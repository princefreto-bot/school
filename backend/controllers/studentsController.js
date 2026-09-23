const crypto = require('crypto');
const { supabase } = require('../utils/supabase');
const { getCurrentAcademicYear } = require('../utils/academicYear');

async function resolveAcademicYearId(schoolSlug, req) {
    let yearName = req.headers['x-academic-year'];

    if (!yearName) {
        const { data: settings } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('school_year')
            .single();
        yearName = settings?.school_year || getCurrentAcademicYear();
    }

    const { data: yearRow } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_slug', schoolSlug)
        .eq('name', yearName)
        .single();

    return yearRow?.id || null;
}

/**
 * GET /api/students/by-year?year=YYYY-YYYY
 * Liste COMPLÈTE (pas de plafond à 100, contrairement à listStudents qui est une
 * recherche floue plutôt qu'un inventaire) des élèves d'une année scolaire précise —
 * pas forcément l'année active de la session. Réservé aux comptes établissement (jamais
 * les parents) : sert uniquement à la rentrée/promotion (voir promoteStudents).
 */
async function listStudentsByYear(req, res) {
    const { schoolSlug } = req.user;
    const { year } = req.query;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!year) return res.status(400).json({ error: 'Paramètre "year" requis.' });

    try {
        const { data: yearRow, error: yearErr } = await supabase
            .from('academic_years')
            .select('id')
            .eq('school_slug', schoolSlug)
            .eq('name', year)
            .maybeSingle();
        if (yearErr) throw yearErr;
        if (!yearRow) return res.json({ students: [] });

        const students = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
            const { data, error } = await supabase
                .from(`students_${schoolSlug}`)
                .select('id, nom, prenom, classe, sexe, photo_url')
                .eq('academic_year_id', yearRow.id)
                .order('classe', { ascending: true })
                .order('nom', { ascending: true })
                .range(from, from + pageSize - 1);
            if (error) throw error;
            students.push(...(data || []));
            if (!data || data.length < pageSize) break;
            from += pageSize;
        }

        return res.json({ students });
    } catch (err) {
        console.error('listStudentsByYear error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/students
 * Recherche d'élèves par nom, prénom ou classe.
 */
async function listStudents(req, res) {
    const { nom, prenom, classe, search } = req.query;
    const parentId = req.user ? req.user.id : null;

    const schoolSlug = req.user ? req.user.schoolSlug : null;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        // Colonnes limitées : cette recherche est accessible à tout utilisateur authentifié
        // (y compris les parents pour retrouver leur enfant) — ne jamais exposer license_key,
        // telephone_parent ou les données financières (ecolage, restant...) ici.
        let query = supabase
            .from(`students_${schoolSlug}`)
            .select('id, nom, prenom, classe, cycle, sexe, photo_url, license_status, academic_year_id');

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        if (search || nom) {
            const q = (search || nom).toLowerCase().trim();
            // Recherche flexible : nom, prénom, ou combinaison
            query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`);
        }

        if (prenom && !search && prenom !== nom) {
            query = query.ilike('prenom', `%${prenom}%`);
        }

        if (classe) {
            query = query.ilike('classe', `%${classe}%`);
        }

        const { data: students, error } = await query
            .order('nom', { ascending: true })
            .limit(100);

        if (error) throw error;

        // Vérifier quels élèves sont déjà liés à ce parent
        let linkedIds = [];
        if (parentId) {
            const { data: links } = await supabase
                .from(`parent_student_${schoolSlug}`)
                .select('student_id')
                .eq('parent_id', parentId);
            if (links) linkedIds = links.map(l => l.student_id);
        }

        const results = students.map(s => ({
            ...s,
            is_linked: linkedIds.includes(s.id)
        }));

        return res.json({ students: results, total: results.length });
    } catch (err) {
        console.error('ListStudents Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des élèves.' });
    }
}

/**
 * GET /api/students/count
 * Compte le nombre total d'élèves dans la base
 */
async function countStudents(req, res) {
    const schoolSlug = req.user ? req.user.schoolSlug : null;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);
        let query = supabase
            .from(`students_${schoolSlug}`)
            .select('*', { count: 'exact', head: true });

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { count, error } = await query;

        if (error) throw error;
        return res.json({ count: count || 0 });
    } catch (err) {
        console.error('CountStudents Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors du comptage.' });
    }
}

/**
 * POST /api/students/link
 * Lie un ou plusieurs élèves à un parent.
 */
async function linkStudentToParent(req, res) {
    const { id: parentId } = req.user;
    const { studentId, studentIds, licenseKey } = req.body;

    // Supporter à la fois un ID unique ou un tableau d'IDs (Multi-select)
    const idsToLink = Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : []);

    if (idsToLink.length === 0) {
        return res.status(400).json({ error: "Au moins un studentId est requis." });
    }

    const schoolSlug = req.user ? req.user.schoolSlug : null;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        // Le JWT ne porte pas le téléphone du parent — on le récupère pour vérifier
        // sa correspondance avec telephone_parent avant toute liaison à un élève
        // non réclamé (sinon n'importe quel compte parent pourrait se lier à
        // n'importe quel élève de l'école, cf. audit sécurité 2026-08-19).
        const { data: requestingParent } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('telephone')
            .eq('id', parentId)
            .single();
        const clean = (num) => (num || '').replace(/[\s\-\(\)\+]/g, '');
        const requesterPhoneClean = clean(requestingParent?.telephone);

        const promoBypassKeys = process.env.PROMO_BYPASS_KEYS
            ? process.env.PROMO_BYPASS_KEYS.split(',')
            : (process.env.NODE_ENV === 'production' ? [] : ['DGHUB-VIP', 'DGHUB-PROMO']);

        const errors = [];
        for (const sId of idsToLink) {
            // 1. Vérifier si l'élève est déjà lié à un autre parent
            const { data: existingLinks, error: checkLinkErr } = await supabase
                .from(`parent_student_${schoolSlug}`)
                .select('parent_id')
                .eq('student_id', sId);

            if (checkLinkErr && checkLinkErr.code !== '42P01') {
                errors.push(`${sId}: ${checkLinkErr.message}`);
                continue;
            }

            if (existingLinks && existingLinks.length > 0) {
                // Déjà lié à quelqu'un d'autre. Vérifier si déjà lié à moi
                const alreadyLinkedToMe = existingLinks.some(link => link.parent_id === parentId);
                if (alreadyLinkedToMe) {
                    continue; // Déjà lié, pas besoin de réinsérer
                }

                // Pour relier, il faut fournir la clé de licence qui l'a activé
                const { data: student, error: fetchStudErr } = await supabase
                    .from(`students_${schoolSlug}`)
                    .select('license_key, license_status')
                    .eq('id', sId)
                    .single();

                if (fetchStudErr) {
                    errors.push(`${sId}: Impossible de vérifier le statut de la licence.`);
                    continue;
                }

                const providedKey = (licenseKey || '').trim().toUpperCase();
                const activeKey = (student.license_key || '').trim().toUpperCase();

                const isPromo = promoBypassKeys.some(k => providedKey.startsWith(k.trim().toUpperCase()));
                const keysMatch = activeKey && providedKey === activeKey;

                if (student.license_status === 'active' && (keysMatch || isPromo)) {
                    // La clé est valide, on autorise la liaison
                    const { error: insErr } = await supabase
                        .from(`parent_student_${schoolSlug}`)
                        .insert({ parent_id: parentId, student_id: sId });

                    if (insErr && insErr.code !== '23505') {
                        errors.push(`${sId}: ${insErr.message}`);
                    }
                } else {
                    errors.push(`Cet enfant est déjà lié à un compte. Veuillez saisir la clé de licence d'activation valide pour confirmer votre lien.`);
                }
            } else {
                // Pas encore lié à personne. On exige une preuve de filiation avant la liaison :
                // le téléphone du compte parent doit correspondre à telephone_parent sur la fiche
                // élève (comme à l'inscription, cf. authController.js registerParent), ou à défaut
                // la clé de licence si l'élève en a déjà une (paiement déjà tenté). Sans quoi
                // n'importe quel compte parent pourrait se lier à n'importe quel enfant de l'école.
                const { data: student, error: fetchStudErr } = await supabase
                    .from(`students_${schoolSlug}`)
                    .select('license_key, license_status, telephone_parent')
                    .eq('id', sId)
                    .single();

                if (fetchStudErr) {
                    errors.push(`${sId}: Impossible de vérifier cet élève.`);
                    continue;
                }

                const studentPhoneClean = clean(student.telephone_parent);
                const phoneMatches = requesterPhoneClean && studentPhoneClean && requesterPhoneClean === studentPhoneClean;

                const providedKey = (licenseKey || '').trim().toUpperCase();
                const activeKey = (student.license_key || '').trim().toUpperCase();
                const isPromo = promoBypassKeys.some(k => providedKey.startsWith(k.trim().toUpperCase()));
                const keysMatch = activeKey && providedKey === activeKey;

                if (phoneMatches || isPromo || (student.license_status === 'active' && keysMatch)) {
                    const { error: insErr } = await supabase
                        .from(`parent_student_${schoolSlug}`)
                        .insert({ parent_id: parentId, student_id: sId });

                    if (insErr && insErr.code !== '23505') {
                        errors.push(`${sId}: ${insErr.message}`);
                    }
                } else {
                    errors.push(`Cet enfant n'a pas pu être lié : le numéro de téléphone de votre compte ne correspond pas à celui enregistré pour cet élève. Contactez l'établissement.`);
                }
            }
        }

        if (errors.length > 0 && errors.length === idsToLink.length) {
            return res.status(403).json({ error: errors.join(', ') });
        }

        // Auto-assignation des badges de base
        for (const sId of idsToLink) {
            await _autoAssignBadges(parentId, sId, schoolSlug);
        }

        return res.status(201).json({
            message: `${idsToLink.length} élève(s) lié(s) avec succès.`
        });
    } catch (err) {
        console.error('Link Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la liaison des élèves : ' + err.message });
    }
}

async function _autoAssignBadges(parentId, studentId, schoolSlug) {
    try {
        const { data: student } = await supabase
            .from(`students_${schoolSlug}`)
            .select('*')
            .eq('id', studentId)
            .single();

        if (!student) return;

        const addBadge = async (code, label, description, icon) => {
            const { data: exists, error } = await supabase
                .from(`badges_${schoolSlug}`)
                .select('id')
                .eq('parent_id', parentId)
                .eq('student_id', studentId)
                .eq('code', code)
                .single();

            // Ignore PGRST116 (No rows found) which is expected, 
            // and 42P01 (Table missing) to be resilient
            if (error && !['PGRST116', '42P01'].includes(error.code)) {
                console.warn(`⚠️ Badge error [${code}]:`, error.message);
                return;
            }

            if (!exists) {
                const { error: insErr } = await supabase.from(`badges_${schoolSlug}`).insert({
                    parent_id: parentId,
                    student_id: studentId,
                    code,
                    label,
                    description,
                    icon,
                    earned_at: new Date().toISOString()
                });
                if (insErr && insErr.code !== '42P01') console.warn(`⚠️ Badge insert error:`, insErr.message);
            }
        };

        await addBadge('welcome', 'Parent Responsable', 'Compte créé et enfant enregistré', '⭐');

        if (student.status === 'Soldé') {
            await addBadge('fully_paid', 'Paiement Complet', 'Scolarité entièrement réglée', '🏆');
        }

        const ratio = student.ecolage > 0 ? student.deja_paye / student.ecolage : 0;
        if (ratio >= 0.5 && student.status !== 'Soldé') {
            await addBadge('half_paid', '2ème Tranche Validée', 'Plus de 50% de la scolarité payée', '🥈');
        }
    } catch (err) {
        console.error('Badge Error:', err.message);
    }
}

async function unlinkStudentFromParent(req, res) {
    const { id: parentId } = req.user;
    const { studentId } = req.params;
    const schoolSlug = req.user ? req.user.schoolSlug : null;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    if (!studentId) {
        return res.status(400).json({ error: "studentId est requis." });
    }

    try {
        const { error } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .delete()
            .eq('parent_id', parentId)
            .eq('student_id', studentId);

        if (error) throw error;

        return res.json({ message: "Enfant retiré avec succès." });
    } catch (err) {
        console.error('Unlink Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression du lien.' });
    }
}

/**
 * POST /api/students/promote
 * Rentrée / promotion : crée une NOUVELLE fiche par élève promu, rattachée à l'année
 * CIBLE, à partir d'une fiche existante de l'année SOURCE — jamais une mutation de la
 * fiche source (qui doit rester intacte pour l'historique de l'ancienne année : notes,
 * paiements, bulletins...). Cohérent avec le modèle existant où chaque année scolaire a
 * ses propres lignes élèves (voir incident csyzomacamb du 2026-09-23).
 *
 * body: {
 *   fromYear: string, toYear: string,
 *   promotions: [{ studentId, targetClasse, targetCycle, targetEcolage, redoublant }]
 * }
 * Le calcul de targetEcolage (tarifs personnalisés par classe, Ancien/Nouveau...) est
 * fait côté frontend, qui a déjà accès à classFees et à toute la config des classes —
 * pas dupliqué ici pour éviter une seconde source de vérité qui pourrait diverger.
 */
async function promoteStudents(req, res) {
    const { schoolSlug } = req.user;
    const { fromYear, toYear, promotions } = req.body;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!fromYear || !toYear) return res.status(400).json({ error: 'fromYear et toYear sont requis.' });
    if (!Array.isArray(promotions) || promotions.length === 0) {
        return res.status(400).json({ error: 'Aucun élève à promouvoir.' });
    }

    try {
        const [{ data: fromYearRow }, { data: toYearRow }] = await Promise.all([
            supabase.from('academic_years').select('id').eq('school_slug', schoolSlug).eq('name', fromYear).maybeSingle(),
            supabase.from('academic_years').select('id').eq('school_slug', schoolSlug).eq('name', toYear).maybeSingle(),
        ]);
        if (!fromYearRow) return res.status(400).json({ error: `Année source "${fromYear}" introuvable.` });
        if (!toYearRow) return res.status(400).json({ error: `Année cible "${toYear}" introuvable.` });
        const fromYearId = fromYearRow.id;
        const toYearId = toYearRow.id;

        const studentIds = promotions.map((p) => p.studentId);
        const { data: sourceStudents, error: sourceErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id, nom, prenom, sexe, telephone_parent, date_naissance, photo_url, ecole_provenance, adsn, academic_year_id')
            .in('id', studentIds);
        if (sourceErr) throw sourceErr;

        // Sécurité : n'accepte que les élèves réellement présents dans l'année SOURCE
        // annoncée — ignore silencieusement toute incohérence plutôt que d'échouer en bloc.
        const sourceById = new Map((sourceStudents || []).filter((s) => s.academic_year_id === fromYearId).map((s) => [s.id, s]));

        const idMap = new Map(); // ancien id -> nouveau id (pour relier les parents)
        const newRows = [];
        let skipped = 0;

        for (const promo of promotions) {
            const source = sourceById.get(promo.studentId);
            if (!source || !promo.targetClasse) { skipped++; continue; }

            const newId = crypto.randomUUID();
            idMap.set(source.id, newId);

            const ecolage = Number(promo.targetEcolage) || 0;
            newRows.push({
                id: newId,
                nom: source.nom,
                prenom: source.prenom || '',
                classe: promo.targetClasse,
                cycle: promo.targetCycle || 'Primaire',
                ecolage,
                deja_paye: 0,
                restant: ecolage,
                frais_inscription: 0,
                inscription_paye: 0,
                inscription_restant: 0,
                statut_elv: 'ANCIEN',
                status: 'Non soldé',
                telephone_parent: source.telephone_parent || null,
                sexe: source.sexe || 'M',
                redoublant: !!promo.redoublant,
                ecole_provenance: source.ecole_provenance || '',
                date_naissance: source.date_naissance || null,
                adsn: source.adsn || null,
                photo_url: source.photo_url || null,
                academic_year_id: toYearId,
            });
        }

        if (newRows.length === 0) {
            return res.status(400).json({ error: 'Aucun élève valide à promouvoir (vérifiez que les élèves appartiennent bien à l\'année source).' });
        }

        for (let i = 0; i < newRows.length; i += 500) {
            const { error: insertErr } = await supabase.from(`students_${schoolSlug}`).insert(newRows.slice(i, i + 500));
            if (insertErr) throw insertErr;
        }

        // Reporte les liaisons parent-enfant existantes vers les nouvelles fiches — sans
        // ça, un parent perdrait l'accès à son enfant dès la rentrée suivante.
        try {
            const { data: existingLinks } = await supabase
                .from(`parent_student_${schoolSlug}`)
                .select('parent_id, student_id')
                .in('student_id', Array.from(idMap.keys()));
            const newLinks = (existingLinks || [])
                .filter((l) => idMap.has(l.student_id))
                .map((l) => ({ parent_id: l.parent_id, student_id: idMap.get(l.student_id) }));
            if (newLinks.length > 0) {
                await supabase.from(`parent_student_${schoolSlug}`).insert(newLinks);
            }
        } catch (linkErr) {
            console.error('promoteStudents: erreur report liaisons parent-enfant:', linkErr.message);
            // Non bloquant — les élèves sont promus, le lien parent peut être refait manuellement.
        }

        return res.json({ promoted: newRows.length, skipped, total: promotions.length });
    } catch (err) {
        console.error('promoteStudents error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { listStudents, listStudentsByYear, linkStudentToParent, unlinkStudentFromParent, countStudents, promoteStudents };
