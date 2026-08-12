// ============================================================
// DASHBOARD — compteurs
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const [persons, eleves, personnel, sources, lastSync] = await Promise.all([
            classeurClient.from('persons').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            classeurClient
                .from('persons')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active')
                .eq('origin_source_table', 'students'),
            classeurClient
                .from('persons')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active')
                .eq('origin_source_table', 'profiles'),
            classeurClient.from('sources').select('id', { count: 'exact', head: true }),
            classeurClient
                .from('sources')
                .select('imported_at')
                .eq('source_type', 'dghubschool_live')
                .order('imported_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);

        return res.json({
            totalPersons: persons.count ?? 0,
            totalEleves: eleves.count ?? 0,
            totalPersonnel: personnel.count ?? 0,
            totalSources: sources.count ?? 0,
            // Les compteurs suivants arrivent avec le moteur de corrélation (M2/M3) —
            // renvoyés à 0 pour que le dashboard n'affiche jamais un chiffre inventé.
            matchesStrong: 0,
            matchesToVerify: 0,
            toClassify: 0,
            duplicateCandidates: 0,
            lastSyncAt: lastSync.data?.imported_at ?? null,
        });
    } catch (err: any) {
        console.error('Dashboard error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement du tableau de bord.' });
    }
});

export default router;
