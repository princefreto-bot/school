const { supabase } = require('../utils/supabase');

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

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Postgres renvoie les colonnes TIME au format "HH:MM:SS" alors que le
// frontend envoie "HH:MM" — sans normalisation, la comparaison de chaînes
// traite "09:00" comme < "09:00:00" (préfixe), créant un faux conflit entre
// deux créneaux pourtant simplement adjacents.
const normalizeTime = (t) => (t || '').slice(0, 5);

function overlaps(startA, endA, startB, endB) {
    const a1 = normalizeTime(startA), a2 = normalizeTime(endA);
    const b1 = normalizeTime(startB), b2 = normalizeTime(endB);
    return a1 < b2 && b1 < a2;
}

/**
 * Vérifie qu'un créneau ne chevauche pas un créneau existant pour la même
 * classe OU le même enseignant, le même jour. `excludeId` sert lors d'une
 * modification pour ignorer le créneau qu'on est en train de modifier.
 */
async function findConflict(schoolSlug, { classe, enseignantNom, jourSemaine, heureDebut, heureFin, academicYearId, excludeId }) {
    let query = supabase
        .from(`timetable_slots_${schoolSlug}`)
        .select('*')
        .eq('jour_semaine', jourSemaine)
        .eq('academic_year_id', academicYearId);

    if (excludeId) query = query.neq('id', excludeId);

    const { data: sameDay, error } = await query;
    if (error) throw error;

    for (const slot of (sameDay || [])) {
        const sameClasse = slot.classe === classe;
        const sameEnseignant = enseignantNom && slot.enseignant_nom && slot.enseignant_nom === enseignantNom;
        if (!sameClasse && !sameEnseignant) continue;
        if (overlaps(heureDebut, heureFin, slot.heure_debut, slot.heure_fin)) {
            return { slot, reason: sameClasse ? 'classe' : 'enseignant' };
        }
    }
    return null;
}

/**
 * GET /api/timetable?classe=6ème A
 * Grille pour une classe (ou toutes si aucun filtre — vue admin globale).
 */
async function getTimetable(req, res) {
    const { schoolSlug } = req.user;
    const { classe } = req.query;

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        let query = supabase
            .from(`timetable_slots_${schoolSlug}`)
            .select(`*, matiere:matiere_id ( nom, categorie )`)
            .eq('academic_year_id', academicYearId)
            .order('jour_semaine', { ascending: true })
            .order('heure_debut', { ascending: true });

        if (classe) query = query.eq('classe', classe);

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/timetable/mine
 * Planning d'un enseignant (compte partagé identifié par nom, cf. classe_matieres.professeur).
 */
async function getMyTimetable(req, res) {
    const { schoolSlug } = req.user;
    const { nom } = req.query;

    if (!nom) return res.status(400).json({ error: 'Nom d\'enseignant requis.' });

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        const { data, error } = await supabase
            .from(`timetable_slots_${schoolSlug}`)
            .select(`*, matiere:matiere_id ( nom, categorie )`)
            .eq('academic_year_id', academicYearId)
            .eq('enseignant_nom', nom)
            .order('jour_semaine', { ascending: true })
            .order('heure_debut', { ascending: true });

        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/timetable
 * Crée un créneau — 409 si conflit avec la classe ou l'enseignant sur ce jour.
 */
async function createSlot(req, res) {
    const { schoolSlug } = req.user;
    const { classe, matiereId, enseignantNom, jourSemaine, heureDebut, heureFin, salle } = req.body;

    if (!classe || jourSemaine === undefined || !heureDebut || !heureFin) {
        return res.status(400).json({ error: 'Classe, jour et horaires requis.' });
    }
    if (heureFin <= heureDebut) {
        return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début.' });
    }

    try {
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        const conflict = await findConflict(schoolSlug, {
            classe, enseignantNom, jourSemaine, heureDebut, heureFin, academicYearId
        });
        if (conflict) {
            return res.status(409).json({
                error: conflict.reason === 'classe'
                    ? `Conflit : la classe ${classe} a déjà un créneau le ${JOURS[jourSemaine]} de ${conflict.slot.heure_debut} à ${conflict.slot.heure_fin}.`
                    : `Conflit : ${enseignantNom} a déjà un créneau le ${JOURS[jourSemaine]} de ${conflict.slot.heure_debut} à ${conflict.slot.heure_fin}.`
            });
        }

        const { data, error } = await supabase
            .from(`timetable_slots_${schoolSlug}`)
            .insert({
                classe,
                matiere_id: matiereId || null,
                enseignant_nom: enseignantNom || null,
                jour_semaine: jourSemaine,
                heure_debut: heureDebut,
                heure_fin: heureFin,
                salle: salle || null,
                academic_year_id: academicYearId
            })
            .select(`*, matiere:matiere_id ( nom, categorie )`)
            .single();

        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/timetable/:id
 */
async function deleteSlot(req, res) {
    const { schoolSlug } = req.user;
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from(`timetable_slots_${schoolSlug}`)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getTimetable,
    getMyTimetable,
    createSlot,
    deleteSlot
};
