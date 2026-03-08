const { supabase } = require('../utils/supabase');

/**
 * GET /api/parent/dashboard
 */
async function getDashboard(req, res) {
    const { id: parentId } = req.user;
    console.log('🔍 [Dashboard] Parent ID:', parentId);

    try {
        // Récupérer les ids des élèves liés via la table parent_student
        const { data: links, error: lErr } = await supabase
            .from('parent_student')
            .select('student_id')
            .eq('parent_id', parentId);

        if (lErr) {
            console.error('❌ [Dashboard] Erreur récupération liens:', lErr);
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
            .from('students')
            .select('*')
            .in('id', studentIds)
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
        console.log('🔍 [ActiveCount] start');
        const { count, error } = await supabase
            .from('profiles')
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
        const { data, error } = await supabase
            .from('profiles')
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
    const { role } = req.user;

    // Only admin can access this
    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission refusée.' });
    }

    try {
        console.log(`🔍 [ParentById] fetching parent ${id}`);
        const { data, error } = await supabase
            .from('profiles')
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
    const { role } = req.user;

    console.log(`🗑️ [AdminDelete] Attempting to delete parent ${parentId} by role ${role}`);

    // Seul le directeur peut supprimer des comptes
    if (!['admin', 'directeur', 'directeur_general'].includes(role)) {
        console.warn(`⚠️ [AdminDelete] Permission denied for role ${role}`);
        return res.status(403).json({ error: 'Permission refusée. Seul le Directeur Général peut supprimer des comptes.' });
    }

    try {
        console.log(`🗑️ [AdminDelete] Deleting parent ${parentId} from profiles`);
        const { error } = await supabase
            .from('profiles')
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

module.exports = {
    getDashboard,
    getPayments,
    getBadges,
    getActiveParentsCount,
    getAllParents,
    getParentById,
    adminDeleteAccount
};
