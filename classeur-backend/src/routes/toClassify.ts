// ============================================================
// À CLASSER — association manuelle des lignes importées à une personne existante
// ============================================================
// Règle de cadrage non négociable : ce module ne crée JAMAIS de nouvelle personne.
// Une ligne importée ne peut qu'être associée à une personne qui existe déjà dans
// classeur.persons (donc déjà ancrée sur DGhubschool, voir M1), ou rester en attente/
// être rejetée/ignorée. La création via relation validée est une fonctionnalité
// distincte, prévue en M5 — elle n'est pas exposée ici.
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (req, res) => {
    try {
        const { q, limit = '50', offset = '0' } = req.query as Record<string, string>;

        let query = classeurClient
            .from('source_records')
            .select('id, raw_data, row_index, classification_status, extracted_at, sources(name, original_filename, imported_at)', {
                count: 'exact',
            })
            .in('classification_status', ['unclassified', 'to_classify'])
            .order('extracted_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (q) query = query.ilike('raw_data::text', `%${q}%`);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({ records: data, total: count });
    } catch (err: any) {
        console.error('List to-classify error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement de la file à classer.' });
    }
});

async function logValidation(recordId: string, action: 'associer' | 'rejeter' | 'ignorer', operatorId: string) {
    await classeurClient.from('match_validations').insert({ match_id: null, action, performed_by: operatorId });
    await classeurClient.from('audit_logs').insert({
        actor_id: operatorId,
        action: action === 'associer' ? 'association' : action === 'rejeter' ? 'rejection' : 'modification',
        entity_type: 'source_record',
        entity_id: recordId,
        details: { action },
    });
}

router.post('/:id/associate', async (req, res) => {
    const { personId } = req.body || {};
    if (!personId) return res.status(400).json({ error: 'personId requis.' });

    try {
        const { data: record, error: recordErr } = await classeurClient
            .from('source_records')
            .select('id, raw_data, classification_status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (recordErr) throw recordErr;
        if (!record) return res.status(404).json({ error: 'Ligne introuvable.' });
        if (record.classification_status === 'associated') {
            return res.status(409).json({ error: 'Cette ligne est déjà associée.' });
        }

        const { data: person, error: personErr } = await classeurClient
            .from('persons')
            .select('id')
            .eq('id', personId)
            .maybeSingle();
        if (personErr) throw personErr;
        if (!person) {
            // Garde-fou applicatif redondant avec la contrainte SQL origin_anchor_required :
            // on n'accepte que l'association à une personne qui existe déjà.
            return res.status(404).json({ error: 'Personne introuvable — impossible de créer une personne depuis ce module.' });
        }

        const extracted: Record<string, string> = (record.raw_data as any)?.extracted || {};
        const attributeRows = Object.entries(extracted).map(([key, value]) => ({
            person_id: personId,
            attribute_key: key,
            attribute_value: value,
            source_record_id: record.id,
            confidence: 100, // association manuelle confirmée par un opérateur, pas une estimation
        }));
        if (attributeRows.length > 0) {
            const { error: attrErr } = await classeurClient.from('person_attributes').insert(attributeRows);
            if (attrErr) throw attrErr;
        }

        const { error: updateErr } = await classeurClient
            .from('source_records')
            .update({ classification_status: 'associated', linked_person_id: personId })
            .eq('id', record.id);
        if (updateErr) throw updateErr;

        await logValidation(record.id, 'associer', req.operator!.operatorId);

        return res.json({ ok: true, attributesAdded: attributeRows.length });
    } catch (err: any) {
        console.error('Associate error:', err);
        return res.status(500).json({ error: err.message || "Erreur lors de l'association." });
    }
});

router.post('/:id/reject', async (req, res) => {
    try {
        const { error } = await classeurClient
            .from('source_records')
            .update({ classification_status: 'rejected' })
            .eq('id', req.params.id);
        if (error) throw error;
        await logValidation(req.params.id, 'rejeter', req.operator!.operatorId);
        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Reject error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du rejet.' });
    }
});

router.post('/:id/ignore', async (req, res) => {
    try {
        const { error } = await classeurClient
            .from('source_records')
            .update({ classification_status: 'ignored' })
            .eq('id', req.params.id);
        if (error) throw error;
        await logValidation(req.params.id, 'ignorer', req.operator!.operatorId);
        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Ignore error:', err);
        return res.status(500).json({ error: err.message || "Erreur lors de l'ignorance de la ligne." });
    }
});

export default router;
