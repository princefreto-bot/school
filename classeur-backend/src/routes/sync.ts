// ============================================================
// SYNC — déclenchement manuel de la synchronisation DGhubschool -> classeur
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';
import { syncAllSchools } from '../modules/sync/dghubschoolSync';

const router = Router();
const SYNC_SOURCE_NAME = 'Synchronisation DGhubschool';

router.post('/dghubschool', authenticateOperator, async (req, res) => {
    try {
        const { results, totalPersons } = await syncAllSchools();
        const hasErrors = results.some((r) => r.error);

        const { data: existingSource } = await classeurClient
            .from('sources')
            .select('id')
            .eq('source_type', 'dghubschool_live')
            .eq('name', SYNC_SOURCE_NAME)
            .maybeSingle();

        const sourceRow = {
            name: SYNC_SOURCE_NAME,
            source_type: 'dghubschool_live' as const,
            status: hasErrors ? 'failed' : 'processed',
            row_count: totalPersons,
            error_log: hasErrors ? results.filter((r) => r.error) : null,
            imported_by: req.operator!.operatorId,
            imported_at: new Date().toISOString(),
        };

        if (existingSource) {
            await classeurClient.from('sources').update(sourceRow).eq('id', existingSource.id);
        } else {
            await classeurClient.from('sources').insert(sourceRow);
        }

        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'import',
            entity_type: 'sync',
            details: { results, totalPersons },
        });

        return res.json({ results, totalPersons });
    } catch (err: any) {
        console.error('Sync error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la synchronisation.' });
    }
});

export default router;
