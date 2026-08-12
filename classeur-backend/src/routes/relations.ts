// ============================================================
// RELATIONS — liens familiaux/professionnels entre personnes
// ============================================================
// Toute relation créée ici est directement "validated" : c'est l'opérateur qui l'affirme
// explicitement (pas une extraction automatique depuis du texte libre — volontairement
// jamais implémentée, voir modules/extraction). Point d'entrée EXCLUSIF pour créer une
// personne hors synchronisation DGhubschool : uniquement via une relation validée
// rattachée à une personne déjà existante (règle de cadrage #2 du projet).
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const { data, error } = await classeurClient
            .from('relationships')
            .select(
                'id, status, created_at, relationship_types(label_fr), ' +
                    'person_a:persons!relationships_person_a_id_fkey(id, display_name), ' +
                    'person_b:persons!relationships_person_b_id_fkey(id, display_name)'
            )
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) throw error;
        return res.json({ relations: data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des relations.' });
    }
});

router.get('/types', async (_req, res) => {
    try {
        const { data, error } = await classeurClient.from('relationship_types').select('id, code, label_fr, inverse_code').order('label_fr');
        if (error) throw error;
        return res.json({ relationshipTypes: data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des types de relation.' });
    }
});

// ── Lier deux personnes déjà existantes ──────────────────────
router.post('/', async (req, res) => {
    const { personAId, personBId, relationshipTypeId } = req.body || {};
    if (!personAId || !personBId || !relationshipTypeId) {
        return res.status(400).json({ error: 'personAId, personBId et relationshipTypeId sont requis.' });
    }
    if (personAId === personBId) {
        return res.status(400).json({ error: 'Une personne ne peut pas être en relation avec elle-même.' });
    }

    try {
        const { data, error } = await classeurClient
            .from('relationships')
            .insert({
                person_a_id: personAId,
                person_b_id: personBId,
                relationship_type_id: relationshipTypeId,
                status: 'validated',
                validated_by: req.operator!.operatorId,
                validated_at: new Date().toISOString(),
            })
            .select('id')
            .single();
        if (error) throw error;

        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'validation',
            entity_type: 'relationship',
            entity_id: data.id,
            details: { personAId, personBId, relationshipTypeId },
        });

        return res.status(201).json({ id: data.id });
    } catch (err: any) {
        console.error('Create relation error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la création de la relation.' });
    }
});

// ── Créer une nouvelle personne UNIQUEMENT via une relation validée à une personne existante ──
router.post('/new-person', async (req, res) => {
    const { displayName, relatedPersonId, relationshipTypeId } = req.body || {};
    if (!displayName?.trim() || !relatedPersonId || !relationshipTypeId) {
        return res.status(400).json({ error: 'displayName, relatedPersonId et relationshipTypeId sont requis.' });
    }

    try {
        const { data: newPersonId, error } = await classeurClient.rpc('create_person_via_relation', {
            p_display_name: displayName.trim(),
            p_related_person_id: relatedPersonId,
            p_relationship_type_id: relationshipTypeId,
            p_created_by: req.operator!.operatorId,
        });
        if (error) throw error;

        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'modification',
            entity_type: 'person',
            entity_id: newPersonId,
            details: { createdVia: 'relation', displayName, relatedPersonId, relationshipTypeId },
        });

        return res.status(201).json({ personId: newPersonId });
    } catch (err: any) {
        console.error('Create person via relation error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la création de la personne.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { data: rel, error: fetchErr } = await classeurClient
            .from('relationships')
            .select('id')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!rel) return res.status(404).json({ error: 'Relation introuvable.' });

        await classeurClient.from('relationships').delete().eq('id', rel.id);
        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'deletion',
            entity_type: 'relationship',
            entity_id: rel.id,
        });

        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Delete relation error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la suppression de la relation.' });
    }
});

export default router;
