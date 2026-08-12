// ============================================================
// DOUBLONS — détection + fusion contrôlée
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';
import { runDuplicateDetection } from '../modules/matching/runDuplicateDetection';

const router = Router();
router.use(authenticateOperator);

router.post('/run', async (req, res) => {
    try {
        const result = await runDuplicateDetection();
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'correlation',
            entity_type: 'duplicate_candidates',
            details: result,
        });
        return res.json(result);
    } catch (err: any) {
        console.error('Run duplicate detection error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la détection de doublons.' });
    }
});

router.get('/', async (_req, res) => {
    try {
        const { data, error } = await classeurClient
            .from('duplicate_candidates')
            .select(
                'id, score, status, detected_at, ' +
                    'person_a:persons!duplicate_candidates_person_a_id_fkey(id, display_name, origin_school_slug), ' +
                    'person_b:persons!duplicate_candidates_person_b_id_fkey(id, display_name, origin_school_slug)'
            )
            .eq('status', 'pending')
            .order('score', { ascending: false });
        if (error) throw error;
        return res.json({ duplicates: data });
    } catch (err: any) {
        console.error('List duplicates error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des doublons.' });
    }
});

router.post('/:id/reject', async (req, res) => {
    try {
        const { data: candidate, error: candErr } = await classeurClient
            .from('duplicate_candidates')
            .select('id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (candErr) throw candErr;
        if (!candidate) return res.status(404).json({ error: 'Doublon introuvable.' });
        if (candidate.status !== 'pending') return res.status(409).json({ error: 'Ce doublon a déjà été traité.' });

        await classeurClient
            .from('duplicate_candidates')
            .update({ status: 'rejected', resolved_by: req.operator!.operatorId, resolved_at: new Date().toISOString() })
            .eq('id', candidate.id);
        await classeurClient
            .from('match_validations')
            .insert({ match_id: null, action: 'rejeter_doublon', performed_by: req.operator!.operatorId });
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'rejection',
            entity_type: 'duplicate_candidates',
            entity_id: candidate.id,
        });

        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Reject duplicate error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du rejet.' });
    }
});

router.post('/:id/merge', async (req, res) => {
    const { survivorId } = req.body || {};
    if (!survivorId) return res.status(400).json({ error: 'survivorId requis.' });

    try {
        const { data: candidate, error: candErr } = await classeurClient
            .from('duplicate_candidates')
            .select('id, status, person_a_id, person_b_id')
            .eq('id', req.params.id)
            .maybeSingle();
        if (candErr) throw candErr;
        if (!candidate) return res.status(404).json({ error: 'Doublon introuvable.' });
        if (candidate.status !== 'pending') return res.status(409).json({ error: 'Ce doublon a déjà été traité.' });
        if (survivorId !== candidate.person_a_id && survivorId !== candidate.person_b_id) {
            return res.status(400).json({ error: 'survivorId doit être l\'une des deux personnes du doublon.' });
        }

        const mergedId = survivorId === candidate.person_a_id ? candidate.person_b_id : candidate.person_a_id;

        const { error: mergeErr } = await classeurClient.rpc('merge_persons', {
            p_surviving_id: survivorId,
            p_merged_id: mergedId,
            p_merged_by: req.operator!.operatorId,
            p_duplicate_candidate_id: candidate.id,
        });
        if (mergeErr) throw mergeErr;

        await classeurClient
            .from('match_validations')
            .insert({ match_id: null, action: 'fusionner', performed_by: req.operator!.operatorId });
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'merge',
            entity_type: 'person',
            entity_id: survivorId,
            details: { mergedId, duplicateCandidateId: candidate.id },
        });

        return res.json({ ok: true, survivorId, mergedId });
    } catch (err: any) {
        console.error('Merge duplicate error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la fusion.' });
    }
});

export default router;
