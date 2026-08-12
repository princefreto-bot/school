// ============================================================
// CORRESPONDANCES — moteur de corrélation (M3)
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';
import { runMatching } from '../modules/matching/runMatching';

const router = Router();
router.use(authenticateOperator);

router.post('/run', async (req, res) => {
    try {
        const result = await runMatching();
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'correlation',
            entity_type: 'matches',
            details: result,
        });
        return res.json(result);
    } catch (err: any) {
        console.error('Run matching error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la corrélation.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const { band } = req.query as Record<string, string>;

        let query = classeurClient
            .from('matches')
            .select(
                'id, score, confidence_band, status, algorithm_version, computed_at, ' +
                    'source_record:source_records(id, raw_data, sources(name, original_filename)), ' +
                    'person:persons(id, display_name, origin_school_slug), ' +
                    'match_evidence(field_name, source_value, person_value, field_weight, field_score, contribution, notes)'
            )
            .eq('status', 'pending')
            .order('score', { ascending: false });

        if (band) query = query.eq('confidence_band', band);

        const { data, error } = await query;
        if (error) throw error;

        return res.json({ matches: data });
    } catch (err: any) {
        console.error('List matches error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des correspondances.' });
    }
});

router.post('/:id/confirm', async (req, res) => {
    try {
        const { data: match, error: matchErr } = await classeurClient
            .from('matches')
            .select('id, source_record_id, candidate_person_id, score, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (matchErr) throw matchErr;
        if (!match) return res.status(404).json({ error: 'Correspondance introuvable.' });
        if (match.status !== 'pending') return res.status(409).json({ error: 'Cette correspondance a déjà été traitée.' });

        const { data: record, error: recordErr } = await classeurClient
            .from('source_records')
            .select('id, raw_data')
            .eq('id', match.source_record_id)
            .maybeSingle();
        if (recordErr) throw recordErr;

        const extracted: Record<string, string> = (record?.raw_data as any)?.extracted || {};
        const attributeRows = Object.entries(extracted).map(([key, value]) => ({
            person_id: match.candidate_person_id,
            attribute_key: key,
            attribute_value: value,
            source_record_id: match.source_record_id,
            confidence: 100, // confirmé par un opérateur : certain, pas une estimation
        }));
        if (attributeRows.length > 0) {
            const { error: attrErr } = await classeurClient.from('person_attributes').insert(attributeRows);
            if (attrErr) throw attrErr;
        }

        await classeurClient.from('matches').update({ status: 'confirmed' }).eq('id', match.id);
        await classeurClient
            .from('source_records')
            .update({ classification_status: 'associated', linked_person_id: match.candidate_person_id })
            .eq('id', match.source_record_id);
        await classeurClient
            .from('match_validations')
            .insert({ match_id: match.id, action: 'associer', performed_by: req.operator!.operatorId });
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'validation',
            entity_type: 'match',
            entity_id: match.id,
            details: { score: match.score, personId: match.candidate_person_id },
        });

        return res.json({ ok: true, attributesAdded: attributeRows.length });
    } catch (err: any) {
        console.error('Confirm match error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la confirmation.' });
    }
});

router.post('/:id/reject', async (req, res) => {
    try {
        const { data: match, error: matchErr } = await classeurClient
            .from('matches')
            .select('id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (matchErr) throw matchErr;
        if (!match) return res.status(404).json({ error: 'Correspondance introuvable.' });
        if (match.status !== 'pending') return res.status(409).json({ error: 'Cette correspondance a déjà été traitée.' });

        await classeurClient.from('matches').update({ status: 'rejected' }).eq('id', match.id);
        await classeurClient
            .from('match_validations')
            .insert({ match_id: match.id, action: 'rejeter', performed_by: req.operator!.operatorId });
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'rejection',
            entity_type: 'match',
            entity_id: match.id,
        });

        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Reject match error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du rejet.' });
    }
});

export default router;
