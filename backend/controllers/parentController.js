const { supabase } = require('../utils/supabase');
const { sendSuperadminLicensePaymentAlert } = require('../utils/mailer');

// Chariow — mapping product_id -> montant unitaire (FCFA)
// Utilisé pour reconnaître si un paiement est une tranche ou un règlement complet.
const CHARIOW_PRODUCT_AMOUNTS = {
    'prd_u611otjw': 700,   // Licence d'abonnement (tranche)
    'prd_27g3ge9e': 2100,  // Licence d'abonnements complet
};
const CHARIOW_LICENSE_TOTAL = 2100;
const CHARIOW_TRANCHE_COUNT = 3;
const CHARIOW_TRANCHE_AMOUNT = 700;

async function resolveAcademicYearId(schoolSlug, req) {
    let yearName = req.headers['x-academic-year'];
    
    if (!yearName) {
        const { data: settings } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('school_year')
            .single();
        yearName = settings?.school_year || '2025-2026';
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
 * Détermine si le compte parent est verrouillé : au moins un enfant lié n'a pas de
 * licence active, et la période de grâce de 14 jours (depuis la création du compte
 * parent) est dépassée. Un seul enfant impayé verrouille tout le compte, pas seulement
 * les données de cet enfant — même règle que l'écran de verrouillage du frontend.
 */
async function getParentLockState(schoolSlug, parentId) {
    const { data: parentProfile } = await supabase
        .from(`profiles_${schoolSlug}`)
        .select('created_at')
        .eq('id', parentId)
        .single();

    const parentCreatedAt = parentProfile?.created_at;
    const isWithinGracePeriod = (() => {
        if (!parentCreatedAt) return false;
        const daysSinceCreation = (new Date().getTime() - new Date(parentCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 14;
    })();

    const { data: links } = await supabase
        .from(`parent_student_${schoolSlug}`)
        .select('student_id')
        .eq('parent_id', parentId);
    const studentIds = (links || []).map(l => l.student_id);

    let hasUnlicensedChild = false;
    if (studentIds.length > 0) {
        const { data: linkedStudents } = await supabase
            .from(`students_${schoolSlug}`)
            .select('license_status')
            .in('id', studentIds);
        hasUnlicensedChild = (linkedStudents || []).some(s => (s.license_status || 'inactive') !== 'active');
    }

    return { locked: hasUnlicensedChild && !isWithinGracePeriod, isWithinGracePeriod };
}

/**
 * GET /api/parent/dashboard
 */
async function getDashboard(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    console.log('🔍 [Dashboard] Parent ID:', parentId);

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        // Récupérer les ids des élèves liés via la table parent_student
        const { data: links, error: lErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId);

        if (lErr) {
            console.error('❌ [Dashboard] Erreur récupération liens:', lErr);
            if (lErr.code === '42P01') return res.json({ students: [] });
            throw lErr;
        }

        console.log('📋 [Dashboard] Liens trouvés:', links?.length || 0);

        const studentIds = links.map(l => l.student_id);
        console.log('👨‍👩‍👧‍👦 [Dashboard] IDs élèves:', studentIds);

        if (studentIds.length === 0) {
            console.log('⚠️ [Dashboard] Aucun élève lié');
            return res.json({ students: [] });
        }

        const { data: students, error: sErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('*')
            .in('id', studentIds)
            .eq('academic_year_id', academicYearId)
            .order('nom', { ascending: true });

        if (sErr) {
            console.error('❌ [Dashboard] Erreur récupération élèves:', sErr);
            throw sErr;
        }

        console.log('✅ [Dashboard] Élèves récupérés:', students?.length || 0);
        return res.json({ students: students || [] });
    } catch (err) {
        console.error('💥 [Dashboard] Erreur générale:', err);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/payments/:studentId
 */
async function getPayments(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    const { studentId } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        // Vérifier lien dans la table parent_student
        const { data: isLinked, error: lErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId)
            .eq('student_id', studentId)
            .single();

        if (lErr || !isLinked) {
            return res.status(403).json({ error: 'Accès refusé ou enfant non lié.' });
        }

        const { data: student, error: sErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('*')
            .eq('id', studentId)
            .eq('academic_year_id', academicYearId)
            .single();

        if (sErr) throw sErr;

        // Sécurité : compte verrouillé si un enfant lié (celui-ci ou un autre) n'a pas
        // soldé sa licence au-delà de la période de grâce.
        const { locked } = await getParentLockState(schoolSlug, parentId);
        if (locked) {
            return res.status(402).json({ error: 'license_required', message: 'Licence active requise.' });
        }

        const { data: payments, error: pErr } = await supabase
            .from(`payments_${schoolSlug}`)
            .select('*')
            .eq('student_id', studentId)
            .eq('academic_year_id', academicYearId)
            .order('date', { ascending: false });

        if (pErr) throw pErr;

        return res.json({ student, payments });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/badges
 */
async function getBadges(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { locked } = await getParentLockState(schoolSlug, parentId);
        if (locked) {
            return res.status(402).json({ error: 'license_required', message: 'Licence active requise.' });
        }

        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        const { data: badges, error } = await supabase
            .from(`badges_${schoolSlug}`)
            .select(`
                *,
                student:student_id (nom, prenom, classe, academic_year_id)
            `)
            .eq('parent_id', parentId)
            .order('earned_at', { ascending: false });

        if (error) {
            // Gérer le cas où la table n'existe pas encore pour cette école
            const errMsg = (error.message || '').toLowerCase();
            if (error.code === '42P01' || errMsg.includes('schema cache') || errMsg.includes('does not exist') || errMsg.includes('could not find')) {
                return res.json({ badges: [] });
            }
            throw error;
        }

        const formatted = (badges || [])
            .filter(b => b.student && b.student.academic_year_id === academicYearId)
            .map(b => ({
                ...b,
                student_nom: b.student?.nom,
                student_prenom: b.student?.prenom,
                classe: b.student?.classe
            }));

        return res.json({ badges: formatted });
    } catch (err) {
        console.error('[getBadges] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/active-count
 * Utilisé par l'admin pour voir le nombre de parents inscrits en temps réel
 */
async function getActiveParentsCount(req, res) {
    try {
        console.log('🔍 [ActiveCount] start');
        const schoolSlug = req.user ? req.user.schoolSlug : null;
        if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

        const { count, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('*', { count: 'exact', head: true })
            .eq('role', 'parent');

        if (error) {
            console.error('❌ [ActiveCount] Supabase error:', error.message);
            throw error;
        }
        console.log(`📊 [ActiveCount] parents count: ${count || 0}`);
        return res.json({ count: count || 0 });
    } catch (err) {
        console.error('❌ [ActiveCount] handler error:', err);
        return res.status(500).json({ error: err.message });
    }
}

async function getAllParents(req, res) {
    try {
        console.log('🔍 [ParentList] fetching all parents');
        const schoolSlug = req.user ? req.user.schoolSlug : null;
        if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

        const { data, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, nom, telephone, created_at, role')
            .eq('role', 'parent')
            .order('nom', { ascending: true });

        if (error) {
            console.error('❌ [ParentList] Supabase error:', error.message);
            throw error;
        }
        console.log(`✅ [ParentList] returned ${data?.length || 0} items`);
        return res.json(data);
    } catch (err) {
        console.error('❌ [ParentList] handler error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/:id
 * Get a specific parent by ID (for admin purposes)
 */
async function getParentById(req, res) {
    const { id } = req.params;
    const { role, schoolSlug } = req.user;

    // Only admin can access this
    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission refusée.' });
    }

    try {
        console.log(`🔍 [ParentById] fetching parent ${id}`);
        const { data, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, nom, telephone, created_at, role')
            .eq('id', id)
            .eq('role', 'parent')
            .single();

        if (error) {
            console.error('❌ [ParentById] Supabase error:', error.message);
            if (error.code === 'PGRST116') { // No rows returned
                return res.status(404).json({ error: 'Parent non trouvé.' });
            }
            throw error;
        }

        console.log(`✅ [ParentById] found parent: ${data.nom}`);
        return res.json({ success: true, data });
    } catch (err) {
        console.error('❌ [ParentById] handler error:', err);
        return res.status(500).json({ error: err.message });
    }
}

async function adminDeleteAccount(req, res) {
    const { parentId } = req.params;
    const { role, schoolSlug } = req.user;

    console.log(`🗑️ [AdminDelete] Attempting to delete parent ${parentId} by role ${role}`);

    // Seul le directeur peut supprimer des comptes
    if (!['admin', 'directeur', 'directeur_general'].includes(role)) {
        console.warn(`⚠️ [AdminDelete] Permission denied for role ${role}`);
        return res.status(403).json({ error: 'Permission refusée. Seul le Directeur Général peut supprimer des comptes.' });
    }

    try {
        console.log(`🗑️ [AdminDelete] Deleting parent ${parentId} from profiles`);
        const { error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .delete()
            .eq('id', parentId)
            .neq('role', 'directeur') // Sécurité : ne peut pas s'auto-supprimer via cette route
            .neq('role', 'comptable'); // Sécurité : ne peut pas supprimer le comptable général

        if (error) {
            console.error('❌ [AdminDelete] Supabase error:', error.message);
            throw error;
        }

        console.log(`✅ [AdminDelete] Parent ${parentId} deleted successfully`);
        return res.json({ message: 'Compte supprimé par l\'administrateur.' });
    } catch (err) {
        console.error('💥 [AdminDelete] Fatal error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression: ' + err.message });
    }
}

/**
 * GET /api/parent/presences/:studentId
 */
async function getPresences(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    const { studentId } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        // Vérifier lien dans la table parent_student
        const { data: isLinked, error: lErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId)
            .eq('student_id', studentId)
            .single();

        if (lErr || !isLinked) {
            return res.status(403).json({ error: 'Accès refusé ou enfant non lié.' });
        }

        // Vérifier la licence
        const { data: student, error: sErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('license_status')
            .eq('id', studentId)
            .eq('academic_year_id', academicYearId)
            .single();

        if (sErr) throw sErr;

        // Sécurité : compte verrouillé si un enfant lié (celui-ci ou un autre) n'a pas
        // soldé sa licence au-delà de la période de grâce.
        const { locked } = await getParentLockState(schoolSlug, parentId);
        if (locked) {
            return res.status(402).json({ error: 'license_required', message: 'Licence active requise.' });
        }

        const { data: presences, error: pErr } = await supabase
            .from(`presences_${schoolSlug}`)
            .select('*')
            .eq('student_id', studentId)
            .eq('academic_year_id', academicYearId)
            .order('date', { ascending: false })
            .order('heure', { ascending: false });

        if (pErr) throw pErr;

        return res.json({ presences: presences || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/data
 * Retourne les données fraiches pour un parent loggé :
 * annonces, lectures d'annonces, messages non lus
 */
async function getParentData(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        // 0. Récupérer les IDs des enfants liés pour filtrer les notes
        const { data: links } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId);
        
        const studentIds = (links || []).map(l => l.student_id);

        const { locked } = await getParentLockState(schoolSlug, parentId);

        // 1. Annonces de l'école
        const { data: announcements } = await supabase
            .from(`announcements_${schoolSlug}`)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        // 2. Statut de lecture des annonces pour ce parent
        const { data: announcementReads } = await supabase
            .from(`announcement_reads_${schoolSlug}`)
            .select('*')
            .eq('parent_id', parentId);

        // 3. Compter les messages non lus
        const { count: unreadMessages } = await supabase
            .from(`messages_${schoolSlug}`)
            .select('id', { count: 'exact', head: true })
            .eq('read_status', false)
            .neq('sender_id', parentId);

        // 4. Paramètres de l'école (Logo, Nom, etc.)
        const { data: dbSettings } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('*')
            .single();
        
        const appSettings = dbSettings ? {
            appName: dbSettings.app_name,
            schoolName: dbSettings.school_name,
            schoolYear: dbSettings.school_year,
            schoolLogo: dbSettings.school_logo,
            schoolStamp: dbSettings.school_stamp,
            messageRemerciement: dbSettings.message_remerciement,
            messageRappel: dbSettings.message_rappel,
            tranches: dbSettings.tranches || [],
            schoolMotto: dbSettings.school_motto || 'Travail-Rigueur-Succès',
            schoolBp: dbSettings.school_bp || '80159',
            schoolTelephone: dbSettings.school_telephone || '+228 90 17 79 66 / 99 41 40 47',
            schoolAddress: dbSettings.school_address || 'Apéssito - TOGO',
            schoolCurrency: dbSettings.school_currency || 'FCFA',
            countryName: dbSettings.country_name || 'République Togolaise',
            countryMotto: dbSettings.country_motto || 'Travail - Liberté - Patrie',
            ministereName: dbSettings.ministere_name || 'Ministère de l\'Éducation Nationale'
        } : null;

        // 5. Détails des élèves (enfants)
        let students = [];
        let activeStudentIds = [];
        if (studentIds.length > 0) {
            const { data: dbStudents } = await supabase
                .from(`students_${schoolSlug}`)
                .select('*')
                .in('id', studentIds)
                .eq('academic_year_id', academicYearId);
            
            students = (dbStudents || []).map(s => ({
                ...s,
                dejaPaye: s.deja_paye,
                telephone: s.telephone_parent,
                sexe: s.sexe || 'M',
                redoublant: s.redoublant || false,
                ecoleProvenance: s.ecole_provenance || '',
                dateNaissance: s.date_naissance || null,
                adsn: s.adsn || null,
                photoUrl: s.photo_url || null,
                licenseKey: s.license_key || null,
                licenseStatus: s.license_status || 'inactive',
                licenseActivatedAt: s.license_activated_at || null,
                historiquesPaiements: []
            }));

            // Compte verrouillé = aucune donnée académique (notes, badges) pour aucun enfant,
            // même ceux dont la licence individuelle est active — même règle que le frontend.
            activeStudentIds = locked ? [] : (dbStudents || []).map(s => s.id);
        }

        // 6. Données Académiques (pour le relevé de notes)
        let notes = [];
        let matieres = [];
        let classeMatieres = [];

        if (studentIds.length > 0) {
            // Récupérer les notes des enfants (uniquement ceux avec licence active)
            const { data: dbNotes } = await supabase
                .from(`notes_${schoolSlug}`)
                .select('*')
                .in('eleve_id', activeStudentIds)
                .eq('academic_year_id', academicYearId);

            // Calculer les statistiques de classe (Plus forte note, plus faible note, rang)
            const classes = Array.from(new Set(students.map(s => s.classe)));
            let allClassNotes = [];
            const studentIdToClasse = {};

            const calculateFinalAvg = (note) => {
                if (!note) return null;
                const nc = note.note_classe !== null && note.note_classe !== undefined ? Number(note.note_classe) : null;
                const nd = note.note_devoir !== null && note.note_devoir !== undefined ? Number(note.note_devoir) : null;
                const compo = note.note_compo !== null && note.note_compo !== undefined ? Number(note.note_compo) : null;

                let moyClasse = null;
                const notesEval = [nc, nd].filter(v => v !== null);
                if (notesEval.length > 0) {
                    moyClasse = notesEval.reduce((a, b) => a + b, 0) / notesEval.length;
                }

                const hasMoy = typeof moyClasse === 'number';
                const hasCompo = typeof compo === 'number';

                if (hasMoy && hasCompo) {
                    return (moyClasse + compo) / 2;
                } else if (hasMoy) {
                    return moyClasse;
                } else if (hasCompo) {
                    return compo;
                }
                return null;
            };

            const formatRang = (rank) => {
                if (rank === 1) return '1er';
                return `${rank}ème`;
            };

            if (classes.length > 0) {
                const { data: allClassStudents } = await supabase
                    .from(`students_${schoolSlug}`)
                    .select('id, classe')
                    .in('classe', classes)
                    .eq('academic_year_id', academicYearId);
                
                if (allClassStudents && allClassStudents.length > 0) {
                    allClassStudents.forEach(s => {
                        studentIdToClasse[s.id] = s.classe;
                    });
                    const classStudentIds = allClassStudents.map(s => s.id);
                    let fetchedClassNotes = [];
                    let from = 0;
                    const limit = 1000;
                    let hasMore = true;
                    while (hasMore) {
                        const { data: chunk, error } = await supabase
                            .from(`notes_${schoolSlug}`)
                            .select('*')
                            .in('eleve_id', classStudentIds)
                            .eq('academic_year_id', academicYearId)
                            .range(from, from + limit - 1);
                        if (error) throw error;
                        if (chunk && chunk.length > 0) {
                            fetchedClassNotes.push(...chunk);
                            if (chunk.length < limit) {
                                hasMore = false;
                            } else {
                                from += limit;
                            }
                        } else {
                            hasMore = false;
                        }
                    }
                    allClassNotes = fetchedClassNotes;
                }
            }

            const classAverages = {}; // classAverages[classe][matiereId][periode] = [{ eleveId, avg }]
            allClassNotes.forEach(n => {
                const studentClasse = studentIdToClasse[n.eleve_id];
                if (!studentClasse) return;
                const avg = calculateFinalAvg(n);
                if (avg === null) return;

                if (!classAverages[studentClasse]) classAverages[studentClasse] = {};
                if (!classAverages[studentClasse][n.matiere_id]) classAverages[studentClasse][n.matiere_id] = {};
                if (!classAverages[studentClasse][n.matiere_id][n.periode]) classAverages[studentClasse][n.matiere_id][n.periode] = [];

                classAverages[studentClasse][n.matiere_id][n.periode].push({
                    eleveId: n.eleve_id,
                    avg: Number(avg.toFixed(2))
                });
            });

            // Sort averages in descending order
            Object.keys(classAverages).forEach(cls => {
                Object.keys(classAverages[cls]).forEach(matId => {
                    Object.keys(classAverages[cls][matId]).forEach(per => {
                        classAverages[cls][matId][per].sort((a, b) => b.avg - a.avg);
                    });
                });
            });

            notes = (dbNotes || []).map(n => {
                const child = students.find(s => s.id === n.eleve_id);
                const childClasse = child ? child.classe : null;
                
                let rank = '--';
                let highestNote = null;
                let lowestNote = null;

                if (childClasse && classAverages[childClasse] && classAverages[childClasse][n.matiere_id] && classAverages[childClasse][n.matiere_id][n.periode]) {
                    const list = classAverages[childClasse][n.matiere_id][n.periode];
                    const avgs = list.map(item => item.avg);
                    if (avgs.length > 0) {
                        highestNote = Math.max(...avgs);
                        lowestNote = Math.min(...avgs);
                    }
                    
                    const childAvg = calculateFinalAvg(n);
                    if (childAvg !== null) {
                        // Determine rank considering ex-aequo
                        let rankNum = 1;
                        for (let i = 0; i < list.length; i++) {
                            if (i > 0 && list[i].avg < list[i - 1].avg) {
                                rankNum = i + 1;
                            }
                            if (list[i].eleveId === n.eleve_id) {
                                rank = formatRang(rankNum);
                                break;
                            }
                        }
                    }
                }

                return {
                    id: n.id,
                    eleveId: n.eleve_id,
                    matiereId: n.matiere_id,
                    periode: n.periode,
                    noteClasse: n.note_classe !== undefined && n.note_classe !== null ? Number(n.note_classe) : null,
                    noteDevoir: n.note_devoir !== undefined && n.note_devoir !== null ? Number(n.note_devoir) : null,
                    noteCompo: n.note_compo !== undefined && n.note_compo !== null ? Number(n.note_compo) : null,
                    rank,
                    highestNote,
                    lowestNote
                };
            });

            // Récupérer toutes les matières
            const { data: dbMatieres } = await supabase
                .from(`matieres_${schoolSlug}`)
                .select('*')
                .eq('academic_year_id', academicYearId);
            matieres = (dbMatieres || []).map(m => ({
                id: m.id,
                nom: m.nom,
                categorie: m.categorie
            }));

            // Récupérer les configurations de classe
            const { data: dbClasseMatieres } = await supabase
                .from(`classe_matieres_${schoolSlug}`)
                .select('*')
                .eq('academic_year_id', academicYearId);
            classeMatieres = (dbClasseMatieres || []).map(cm => ({
                id: cm.id,
                classe: cm.classe,
                matiereId: cm.matiere_id,
                professeur: cm.professeur,
                coefficient: cm.coefficient
            }));
        }

        // 7. Badges (uniquement pour ceux avec licence active)
        let badges = [];
        try {
            const { data: dbBadges, error: bErr } = await supabase
                .from(`badges_${schoolSlug}`)
                .select(`
                    *,
                    student:student_id (nom, prenom, classe, academic_year_id)
                `)
                .eq('parent_id', parentId)
                .in('student_id', activeStudentIds)
                .order('earned_at', { ascending: false });
            
            if (bErr) {
                const bErrMsg = (bErr.message || '').toLowerCase();
                if (bErr.code !== '42P01' && !bErrMsg.includes('schema cache') && !bErrMsg.includes('does not exist') && !bErrMsg.includes('could not find')) {
                    throw bErr;
                }
            }
            
            badges = (dbBadges || [])
                .filter(b => b.student && b.student.academic_year_id === academicYearId)
                .map(b => ({
                    ...b,
                    student_nom: b.student?.nom,
                    student_prenom: b.student?.prenom,
                    classe: b.student?.classe
                }));

            // Proactif : Si le parent a des enfants mais aucun badge, on tente une génération auto
            if (badges.length === 0 && activeStudentIds.length > 0) {
                for (const sId of activeStudentIds) {
                    await _autoAssignBadgesSync(parentId, sId, schoolSlug);
                }
            }
        } catch (err) {
            console.warn('[getParentData] Badge retrieval failed:', err.message);
        }

        return res.json({
            announcements: announcements || [],
            announcementReads: announcementReads || [],
            unreadMessages: unreadMessages || 0,
            appSettings,
            students,
            notes,
            matieres,
            classeMatieres,
            badges
        });
    } catch (err) {
        console.error('[getParentData] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Helper proactif pour générer les badges manquants pendant la sync
 */
async function _autoAssignBadgesSync(parentId, studentId, schoolSlug) {
    try {
        const { data: student } = await supabase.from(`students_${schoolSlug}`).select('*').eq('id', studentId).single();
        if (!student) return;

        const addBadge = async (code, label, description, icon) => {
            const { data: exists } = await supabase.from(`badges_${schoolSlug}`).select('id').eq('parent_id', parentId).eq('student_id', studentId).eq('code', code).single();
            if (!exists) {
                await supabase.from(`badges_${schoolSlug}`).insert({
                    parent_id: parentId, student_id: studentId, code, label, description, icon, earned_at: new Date().toISOString()
                });
            }
        };

        // 1. Badge d'inscription
        await addBadge('welcome', 'Parent Responsable', 'Compte créé et enfant enregistré pour le suivi digital.', '🛡️');

        // 2. Badges financiers
        if (student.status === 'Soldé') {
            await addBadge('fully_paid', 'Mécène de l\'Éducation', 'Scolarité entièrement réglée pour l\'année en cours.', '🏆');
        }
        const ratio = student.ecolage > 0 ? student.deja_paye / student.ecolage : 0;
        if (ratio >= 0.5 && student.status !== 'Soldé') {
            await addBadge('half_paid', 'Partenaire Engagé', 'Plus de 50% de la scolarité validée avec succès.', '🥈');
        }

        // 3. Badges académiques (Proactif)
        // On récupère les notes pour voir si l'élève a une excellente moyenne
        const { data: notes } = await supabase.from(`notes_${schoolSlug}`).select('*').eq('eleve_id', studentId);
        if (notes && notes.length > 3) {
            const avg = notes.reduce((acc, n) => acc + (n.note_classe || 0) + (n.note_devoir || 0), 0) / (notes.length * 2);
            if (avg >= 15) {
                await addBadge('excellence', 'Fierté Académique', 'Votre enfant maintient une moyenne d\'excellence dans ses résultats.', '⭐');
            }
        }

        // 4. Badge d'assiduité
        const { data: presences } = await supabase.from(`presences_${schoolSlug}`).select('id').eq('student_id', studentId).limit(20);
        if (presences && presences.length >= 20) {
            await addBadge('attendance', 'Modèle de Ponctualité', 'Assiduité exemplaire constatée au cours des dernières semaines.', '⚡');
        }

    } catch (e) { /* ignore silent failure during sync */ }
}

/**
 * GET /api/parent/license-pricing
 * Calcule le prix total : 2 100 F par enfant, payable en 3 tranches de 700 F.
 */
async function getLicensePricing(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        const { data: links, error: lErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId);

        if (lErr) throw lErr;

        let count = 0;
        if (links && links.length > 0) {
            const studentIds = links.map(l => l.student_id);
            const { data: students, error: sErr } = await supabase
                .from(`students_${schoolSlug}`)
                .select('id')
                .in('id', studentIds)
                .eq('academic_year_id', academicYearId);
            
            if (sErr) throw sErr;
            count = students ? students.length : 0;
        }

        let totalPrice = count * 2100;
        let originalPrice = totalPrice;
        const discount = 0;

        return res.json({
            count,
            totalPrice,
            originalPrice,
            discount,
            pricePerChild: 2100,
            trancheInfo: {
                trancheCount: 3,
                trancheAmount: 700
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/parent/activate-license-auto
 * Active une licence pour le PREMIER enfant du parent connecté qui n'a pas encore
 * de licence active. Utilisé par le flux de redirection Chariow après paiement,
 * pour que le parent n'ait pas à saisir la clé manuellement.
 */
async function activateLicenseAuto(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    const { licenseKey } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!licenseKey) return res.status(400).json({ error: 'Clé de licence requise.' });

    try {
        const { data: links, error: linksErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId);
        if (linksErr) throw linksErr;
        if (!links || links.length === 0) {
            return res.status(404).json({ error: 'Aucun enfant lié à ce compte parent.' });
        }

        const studentIds = links.map(l => l.student_id);
        const { data: students, error: stErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id, license_status')
            .in('id', studentIds);
        if (stErr) throw stErr;

        const unlicensed = (students || []).filter(s => (s.license_status || 'inactive') !== 'active');
        if (unlicensed.length === 0) {
            return res.json({ success: true, message: 'Toutes les licences sont déjà actives.', alreadyActive: true });
        }

        // Privilégier l'enfant avec des tranches déjà entamées (poursuite du paiement en cours),
        // sinon prendre le premier enfant sans aucune tranche.
        const { data: partials, error: partErr } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('student_id, amount')
            .in('student_id', unlicensed.map(s => s.id));
        if (partErr) throw partErr;

        const totalsByStudent = new Map();
        (partials || []).forEach(p => {
            totalsByStudent.set(p.student_id, (totalsByStudent.get(p.student_id) || 0) + (p.amount || 0));
        });
        const withPartial = unlicensed
            .map(s => ({ id: s.id, total: totalsByStudent.get(s.id) || 0 }))
            .filter(s => s.total > 0 && s.total < CHARIOW_LICENSE_TOTAL)
            .sort((a, b) => b.total - a.total);

        const target = withPartial[0] || unlicensed[0];

        req.body = { studentId: target.id, licenseKey };
        return activateLicense(req, res);
    } catch (err) {
        console.error('activateLicenseAuto error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/parent/activate-license
 * Active une licence pour un élève (Bypass DGHUB-VIP/PROMO, ou validation externe)
 */
async function activateLicense(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    const { studentId, licenseKey } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!studentId || !licenseKey) {
        return res.status(400).json({ error: 'ID étudiant et clé de licence requis.' });
    }

    try {
        // 1. Vérifier si le parent est lié à cet élève
        const { data: link, error: linkErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId)
            .eq('student_id', studentId)
            .single();

        if (linkErr || !link) {
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à gérer cet élève.' });
        }

        const cleanKey = (licenseKey || '').trim().toUpperCase();

        // 2. Bypass VIP/PROMO
        const promoBypassKeys = process.env.PROMO_BYPASS_KEYS
            ? process.env.PROMO_BYPASS_KEYS.split(',')
            : (process.env.NODE_ENV === 'production' ? [] : ['DGHUB-VIP', 'DGHUB-PROMO']);
        const isBypass = promoBypassKeys.some(k => cleanKey.startsWith(k.trim().toUpperCase()));
        let isValid = false;
        let chariowData = null;

        if (isBypass) {
            isValid = true;
            chariowData = {
                id: 'bypass-' + Math.random().toString(36).substring(2, 9),
                key: cleanKey,
                status: 'active'
            };
        } else {
            const CHARIOW_SECRET = process.env.CHARIOW_SECRET_KEY;
            if (!CHARIOW_SECRET) {
                if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
                    console.log('⚠️ Mode Dev: Pas de CHARIOW_SECRET_KEY, acceptation automatique de la clé.');
                    isValid = true;
                    chariowData = { id: 'dev-key', key: cleanKey, status: 'active' };
                } else {
                    return res.status(500).json({ error: 'Clé secrète d\'activation non configurée.' });
                }
            } else {
                // Appel API externe
                const validateRes = await fetch(`https://api.chariow.com/v1/licenses/${cleanKey}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${CHARIOW_SECRET}` }
                });

                if (validateRes.ok) {
                    const responseBody = await validateRes.json();
                    const license = responseBody.data || responseBody;
                    
                    if (license.is_expired) {
                        return res.status(400).json({ error: 'Cette licence a expiré.' });
                    }

                    // Vérifier si la licence est déjà activée pour cet élève précis
                    let isAlreadyActivatedForThisStudent = false;
                    try {
                        const activationsRes = await fetch(`https://api.chariow.com/v1/licenses/${cleanKey}/activations`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${CHARIOW_SECRET}` }
                        });
                        if (activationsRes.ok) {
                            const activationsBody = await activationsRes.json();
                            const activationsList = activationsBody.data || [];
                            isAlreadyActivatedForThisStudent = activationsList.some(act => 
                                (act.activated_by?.device === studentId) || 
                                (act.device === studentId)
                            );
                        }
                    } catch (e) {
                        console.error('Erreur lors de la vérification de l\'historique d\'activations:', e);
                    }

                    if (isAlreadyActivatedForThisStudent) {
                        chariowData = license;
                        isValid = true;
                    } else if (!license.is_active || license.can_activate) {
                        // Activer sur la plateforme externe
                        const actRes = await fetch(`https://api.chariow.com/v1/licenses/${cleanKey}/activate`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${CHARIOW_SECRET}`
                            },
                            body: JSON.stringify({ device_identifier: studentId })
                        });

                        if (actRes.ok) {
                            const actBody = await actRes.json();
                            chariowData = actBody.data || actBody;
                            isValid = true;
                        } else {
                            const errData = await actRes.json();
                            return res.status(400).json({ error: errData.message || 'Erreur lors de l\'activation.' });
                        }
                    } else {
                        return res.status(400).json({ error: 'Cette licence a déjà atteint sa limite d\'activation sur un autre compte.' });
                    }
                } else {
                    return res.status(400).json({ error: 'Licence introuvable ou invalide.' });
                }
            }
        }

        if (!isValid) {
            return res.status(400).json({ error: 'Validation de licence échouée.' });
        }

        // 3. Résoudre le montant du paiement à partir du produit Chariow
        const productId = chariowData?.product?.id || null;
        const productSlug = chariowData?.product?.slug || null;
        const saleId = chariowData?.sale?.id || chariowData?.sale_id || null;
        const paymentAmount = (productId && CHARIOW_PRODUCT_AMOUNTS[productId])
            || CHARIOW_TRANCHE_AMOUNT; // fallback tranche 700 F

        // 4. Refuser la réutilisation d'une clé déjà enregistrée (idempotence)
        const { data: existingForKey } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('id')
            .eq('license_key', cleanKey)
            .maybeSingle();
        if (existingForKey) {
            return res.status(400).json({ error: 'Cette clé de licence a déjà été utilisée.' });
        }

        // 5. Calculer les paiements déjà validés pour cet élève
        const { data: previousRows, error: prevErr } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('amount, tranche_number, paid_at')
            .eq('student_id', studentId)
            .order('paid_at', { ascending: true });
        if (prevErr) throw prevErr;

        const previousTotal = (previousRows || []).reduce((s, r) => s + (r.amount || 0), 0);
        if (previousTotal >= CHARIOW_LICENSE_TOTAL) {
            return res.status(400).json({ error: 'La licence de cet élève est déjà entièrement soldée.' });
        }

        // 6. Numéro de tranche : 0 pour paiement complet (2100), sinon incrémental
        const trancheNumber = paymentAmount >= CHARIOW_LICENSE_TOTAL
            ? 0
            : Math.min((previousRows || []).length + 1, CHARIOW_TRANCHE_COUNT);
        const newTotal = previousTotal + paymentAmount;
        const isFinal = newTotal >= CHARIOW_LICENSE_TOTAL;

        // 7. Enregistrer la ligne de paiement
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);
        const { error: insErr } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .insert({
                student_id: studentId,
                parent_id: parentId,
                academic_year_id: academicYearId,
                license_key: cleanKey,
                sale_id: saleId,
                product_id: productId || productSlug,
                amount: paymentAmount,
                tranche_number: trancheNumber,
                is_final: isFinal
            });
        if (insErr) throw insErr;

        // 8. Mettre à jour l'élève : active uniquement si soldé
        const studentUpdate = { license_key: cleanKey };
        if (isFinal) {
            studentUpdate.license_status = 'active';
            studentUpdate.license_activated_at = new Date().toISOString();
        }
        const { error: updErr } = await supabase
            .from(`students_${schoolSlug}`)
            .update(studentUpdate)
            .eq('id', studentId);
        if (updErr) throw updErr;

        const amountRemaining = Math.max(0, CHARIOW_LICENSE_TOTAL - newTotal);
        const tranchesPaid = trancheNumber === 0 ? CHARIOW_TRANCHE_COUNT : trancheNumber;
        const tranchesRemaining = Math.max(0, CHARIOW_TRANCHE_COUNT - tranchesPaid);

        // Notification superadmin (fire-and-forget, ne bloque pas la réponse)
        (async () => {
            try {
                const [{ data: school }, { data: student }, { data: parentProfile }] = await Promise.all([
                    supabase.from('schools').select('name').eq('slug', schoolSlug).maybeSingle(),
                    supabase.from(`students_${schoolSlug}`).select('nom, prenom, classe').eq('id', studentId).maybeSingle(),
                    supabase.from(`profiles_${schoolSlug}`).select('nom, telephone').eq('id', parentId).maybeSingle()
                ]);
                await sendSuperadminLicensePaymentAlert({
                    schoolName: school?.name || schoolSlug,
                    schoolSlug,
                    studentName: student ? `${student.prenom} ${student.nom}${student.classe ? ' (' + student.classe + ')' : ''}` : '—',
                    parentName: parentProfile ? `${parentProfile.nom}${parentProfile.telephone ? ' · ' + parentProfile.telephone : ''}` : '—',
                    amount: paymentAmount,
                    trancheLabel: trancheNumber === 0 ? 'Règlement complet' : `Tranche ${trancheNumber}/${CHARIOW_TRANCHE_COUNT}`,
                    isFinal,
                    totalPaid: newTotal,
                    licenseKey: cleanKey
                });
            } catch (e) {
                console.error('Notification superadmin licence: erreur non bloquante', e.message);
            }
        })();

        return res.json({
            success: true,
            message: isFinal
                ? 'Paiement complet enregistré. Licence activée avec succès !'
                : `Tranche ${trancheNumber}/${CHARIOW_TRANCHE_COUNT} validée. Il vous reste ${amountRemaining} F CFA à régler.`,
            license: chariowData,
            payment: {
                amount: paymentAmount,
                trancheNumber,
                tranchesPaid,
                tranchesRemaining,
                totalPaid: newTotal,
                totalRequired: CHARIOW_LICENSE_TOTAL,
                amountRemaining,
                isFullyPaid: isFinal
            }
        });
    } catch (err) {
        console.error('activateLicense Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

async function getAcademicYears(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data: years, error } = await supabase
            .from('academic_years')
            .select('id, name, is_current')
            .eq('school_slug', schoolSlug);

        if (error) throw error;
        // Sort years logically (newest first or oldest first)
        const sortedYears = (years || []).sort((a, b) => b.name.localeCompare(a.name));
        return res.json(sortedYears);
    } catch (err) {
        console.error('getAcademicYears Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getDashboard,
    getPayments,
    getBadges,
    getPresences,
    getActiveParentsCount,
    getAllParents,
    getParentById,
    adminDeleteAccount,
    getParentData,
    getLicensePricing,
    activateLicense,
    activateLicenseAuto,
    getAcademicYears
};
