const { supabase } = require('../utils/supabase');

// Qui peut saisir/consulter/supprimer les absences de tout le personnel.
// Vérification locale au contrôleur — surtout pas ajoutée au middleware partagé
// requireSchoolAdmin (qui gate aussi la paie/comptabilité, hors périmètre secrétaire).
const ABSENCE_MANAGERS = ['directeur', 'directeur_general', 'admin', 'secretaire'];

// ── GET /api/staff-absences/mine ──────────────────────────────
// Tout membre du personnel authentifié consulte ses propres absences.
async function getMyAbsences(req, res) {
    const { id, schoolSlug } = req.user;
    try {
        const { data, error } = await supabase
            .from(`staff_absences_${schoolSlug}`)
            .select('*')
            .eq('personnel_id', id)
            .order('date', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── GET /api/staff-absences?personnelId= ──────────────────────────────
async function getStaffAbsences(req, res) {
    const { role, schoolSlug } = req.user;
    const { personnelId } = req.query;

    if (!ABSENCE_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        let query = supabase
            .from(`staff_absences_${schoolSlug}`)
            .select(`*, personnel:personnel_id ( nom, role )`)
            .order('date', { ascending: false });
        if (personnelId) query = query.eq('personnel_id', personnelId);

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/staff-absences ──────────────────────────────
async function createStaffAbsence(req, res) {
    const { id: userId, role, schoolSlug } = req.user;
    const { personnelId, date, type, heuresManquees, motif } = req.body;

    if (!ABSENCE_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!personnelId || !date) {
        return res.status(400).json({ error: 'Membre du personnel et date requis.' });
    }
    if (type && !['absence', 'retard', 'conge'].includes(type)) {
        return res.status(400).json({ error: 'Type invalide.' });
    }

    try {
        const { data, error } = await supabase
            .from(`staff_absences_${schoolSlug}`)
            .insert({
                personnel_id: personnelId,
                date,
                type: type || 'absence',
                heures_manquees: heuresManquees || null,
                motif: motif || null,
                saisi_par: userId
            })
            .select('*')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── DELETE /api/staff-absences/:id ──────────────────────────────
async function deleteStaffAbsence(req, res) {
    const { role, schoolSlug } = req.user;
    const { id } = req.params;

    if (!ABSENCE_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { error } = await supabase
            .from(`staff_absences_${schoolSlug}`)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getMyAbsences, getStaffAbsences, createStaffAbsence, deleteStaffAbsence };
