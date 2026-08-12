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
        const [persons, eleves, personnel, sources, lastSync, matchesStrong, matchesToVerify, toClassify, duplicateCandidates] = await Promise.all([
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
            classeurClient.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('confidence_band', 'strong'),
            classeurClient.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('confidence_band', 'to_verify'),
            classeurClient
                .from('source_records')
                .select('id', { count: 'exact', head: true })
                .in('classification_status', ['unclassified', 'to_classify']),
            classeurClient.from('duplicate_candidates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        return res.json({
            totalPersons: persons.count ?? 0,
            totalEleves: eleves.count ?? 0,
            totalPersonnel: personnel.count ?? 0,
            totalSources: sources.count ?? 0,
            matchesStrong: matchesStrong.count ?? 0,
            matchesToVerify: matchesToVerify.count ?? 0,
            toClassify: toClassify.count ?? 0,
            duplicateCandidates: duplicateCandidates.count ?? 0,
            lastSyncAt: lastSync.data?.imported_at ?? null,
        });
    } catch (err: any) {
        console.error('Dashboard error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement du tableau de bord.' });
    }
});

export default router;
