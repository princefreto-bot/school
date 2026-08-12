// ============================================================
// HISTORIQUE — journal d'audit (lecture seule)
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (req, res) => {
    try {
        const { action, entityType, limit = '50', offset = '0' } = req.query as Record<string, string>;

        let query = classeurClient
            .from('audit_logs')
            .select('id, actor_name, action, entity_type, entity_id, details, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (action) query = query.eq('action', action);
        if (entityType) query = query.eq('entity_type', entityType);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({ entries: data, total: count });
    } catch (err: any) {
        console.error('List history error:', err);
        return res.status(500).json({ error: err.message || "Erreur lors du chargement de l'historique." });
    }
});

export default router;
