const { supabase } = require('../utils/supabase');

/**
 * GET /api/parent/dashboard
 */
async function getDashboard(req, res) {
    const { id: parentId } = req.user;

    try {
        // Récupérer les ids des élèves liés via la table parent_student
        const { data: links, error: lErr } = await supabase
            .from('parent_student')
            .select('student_id')
            .eq('parent_id', parentId);

        if (lErr) throw lErr;

        const studentIds = links.map(l => l.student_id);

        if (studentIds.length === 0) {
            return res.json({ students: [] });
        }

        const { data: students, error: sErr } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds)
            .order('nom', { ascending: true });

        if (sErr) throw sErr;

        return res.json({ students: students || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/payments/:studentId
 */
async function getPayments(req, res) {
    const { id: parentId } = req.user;
    const { studentId } = req.params;

    try {
        // Vérifier lien dans la table parent_student
        const { data: isLinked, error: lErr } = await supabase
            .from('parent_student')
            .select('student_id')
            .eq('parent_id', parentId)
            .eq('student_id', studentId)
            .single();

        if (lErr || !isLinked) {
            return res.status(403).json({ error: 'Accès refusé ou enfant non lié.' });
        }

        const { data: student, error: sErr } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (sErr) throw sErr;

        const { data: payments, error: pErr } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', studentId)
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
    const { id: parentId } = req.user;

    try {
        const { data: badges, error } = await supabase
            .from('badges')
            .select(`
                *,
                student:student_id (nom, prenom, classe)
            `)
            .eq('parent_id', parentId)
            .order('earned_at', { ascending: false });

        if (error) throw error;

        const formatted = badges.map(b => ({
            ...b,
            student_nom: b.student?.nom,
            student_prenom: b.student?.prenom,
            classe: b.student?.classe
        }));

        return res.json({ badges: formatted });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/parent/active-count
 * Utilisé par l'admin pour voir le nombre de parents inscrits en temps réel
 */
async function getActiveParentsCount(req, res) {
    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'parent');

        if (error) {
            console.error('❌ Counter Error:', error.message);
            throw error;
        }
        console.log(`📊 Parents inscrits détectés : ${count || 0}`);
        return res.json({ count: count || 0 });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getAllParents(req, res) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, nom, telephone, created_at, role')
            .eq('role', 'parent')
            .order('nom', { ascending: true });

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function adminDeleteAccount(req, res) {
    const { parentId } = req.params;
    const { role } = req.user;

    // Seul le directeur peut supprimer des comptes
    if (role !== 'directeur') {
        return res.status(403).json({ error: 'Permission refusée. Seul le Directeur Général peut supprimer des comptes.' });
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', parentId)
            .neq('role', 'directeur') // Sécurité : ne peut pas s'auto-supprimer via cette route
            .neq('role', 'comptable'); // Sécurité : ne peut pas supprimer le comptable général

        if (error) throw error;
        return res.json({ message: 'Compte supprimé par l\'administrateur.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getDashboard,
    getPayments,
    getBadges,
    getActiveParentsCount,
    getAllParents,
    adminDeleteAccount
};
