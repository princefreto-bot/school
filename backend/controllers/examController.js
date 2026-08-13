// ============================================================
// EXAM CONTROLLER — Sessions et notes d'examens (CEPD/BEPC/BAC)
// Classes concernées : CM2, 3ème, 1ère, Terminale (voir
// src/utils/examEligibility.ts côté frontend pour la détection).
// Table dédiée, jamais mêlée aux notes trimestrielles/semestrielles.
// ============================================================
const { supabase } = require('../utils/supabase');

// Qui peut créer/supprimer des sessions d'examen et consulter toutes les notes.
const EXAM_MANAGERS = ['directeur', 'directeur_general', 'admin', 'censeur', 'proviseur'];
// Qui peut saisir des notes d'examens (les gestionnaires + les enseignants,
// comme pour la saisie de notes habituelle).
const EXAM_NOTE_WRITERS = [...EXAM_MANAGERS, 'enseignant'];

// ── GET /api/exam/sessions ──────────────────────────────
async function getSessions(req, res) {
    const { schoolSlug } = req.user;
    try {
        const { data, error } = await supabase
            .from(`exam_sessions_${schoolSlug}`)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/exam/sessions ──────────────────────────────
async function createSession(req, res) {
    const { role, schoolSlug, id: userId } = req.user;
    const { nom, academicYearId } = req.body;

    if (!EXAM_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!nom || !nom.trim()) {
        return res.status(400).json({ error: 'Nom de la session requis.' });
    }

    try {
        const { data, error } = await supabase
            .from(`exam_sessions_${schoolSlug}`)
            .insert({ nom: nom.trim(), academic_year_id: academicYearId || null, created_by: userId })
            .select('*')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        // 23503 = violation de clé étrangère. Le cas concret rencontré en prod : le
        // compte du token (created_by) ne correspond plus à aucune ligne de
        // profiles_{slug} (ex. compte supprimé puis recréé pendant l'onboarding) —
        // un token valide en apparence mais qui pointe sur un id disparu. Sans ce
        // garde-fou l'erreur Postgres brute remontait telle quelle en 500, illisible
        // pour l'utilisateur et sans piste d'action.
        if (err.code === '23503' && (err.message || '').includes('created_by')) {
            return res.status(409).json({ error: 'Votre session est invalide ou obsolète. Déconnectez-vous puis reconnectez-vous pour réessayer.' });
        }
        return res.status(500).json({ error: err.message });
    }
}

// ── DELETE /api/exam/sessions/:id ──────────────────────────────
async function deleteSession(req, res) {
    const { role, schoolSlug } = req.user;
    const { id } = req.params;

    if (!EXAM_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { error } = await supabase
            .from(`exam_sessions_${schoolSlug}`)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── GET /api/exam/notes?classe=&sessionId= ──────────────────────────────
// Renvoie les notes existantes pour les élèves de la classe, pour cette session.
async function getNotes(req, res) {
    const { role, schoolSlug } = req.user;
    const { classe, sessionId } = req.query;

    if (!EXAM_NOTE_WRITERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!classe || !sessionId) {
        return res.status(400).json({ error: 'Classe et session requises.' });
    }

    try {
        const { data: students, error: sErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id')
            .eq('classe', classe);
        if (sErr) throw sErr;
        const studentIds = (students || []).map((s) => s.id);
        if (studentIds.length === 0) return res.json([]);

        const { data, error } = await supabase
            .from(`exam_notes_${schoolSlug}`)
            .select('*')
            .eq('exam_session_id', sessionId)
            .in('eleve_id', studentIds);
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/exam/notes ──────────────────────────────
// Upsert en lot : { sessionId, entries: [{ eleveId, matiereId, note }] }
async function saveNotes(req, res) {
    const { role, schoolSlug } = req.user;
    const { sessionId, entries } = req.body;

    if (!EXAM_NOTE_WRITERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!sessionId || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: 'Session et notes requises.' });
    }

    try {
        const rows = entries.map((e) => ({
            eleve_id: e.eleveId,
            matiere_id: e.matiereId,
            exam_session_id: sessionId,
            note: e.note === '' || e.note === null || e.note === undefined ? null : Number(e.note),
            updated_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
            .from(`exam_notes_${schoolSlug}`)
            .upsert(rows, { onConflict: 'eleve_id,matiere_id,exam_session_id' })
            .select('*');
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getSessions, createSession, deleteSession, getNotes, saveNotes };
