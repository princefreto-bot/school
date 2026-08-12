// ============================================================
// PARAMÈTRES — seuils de corrélation, types de rôle/relation extensibles
// ============================================================
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const [{ data: settingsRows }, { data: roleTypes }, { data: relationshipTypes }] = await Promise.all([
            classeurClient.from('settings').select('key, value'),
            classeurClient.from('role_types').select('id, code, label_fr, category').order('label_fr'),
            classeurClient.from('relationship_types').select('id, code, label_fr, inverse_code').order('label_fr'),
        ]);
        const settings = Object.fromEntries((settingsRows || []).map((r) => [r.key, r.value]));
        return res.json({ settings, roleTypes, relationshipTypes });
    } catch (err: any) {
        console.error('Get settings error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des paramètres.' });
    }
});

router.patch('/confidence-bands', async (req, res) => {
    const { strong, to_verify } = req.body || {};
    if (typeof strong !== 'number' || typeof to_verify !== 'number' || strong <= to_verify) {
        return res.status(400).json({ error: 'strong et to_verify doivent être des nombres, avec strong > to_verify.' });
    }
    try {
        const { error } = await classeurClient
            .from('settings')
            .update({ value: { strong, to_verify }, updated_by: req.operator!.operatorId, updated_at: new Date().toISOString() })
            .eq('key', 'confidence_bands');
        if (error) throw error;
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Erreur lors de la mise à jour.' });
    }
});

router.post('/role-types', async (req, res) => {
    const { code, label_fr, category } = req.body || {};
    if (!code?.trim() || !label_fr?.trim() || !['staff', 'student', 'family', 'other'].includes(category)) {
        return res.status(400).json({ error: 'code, label_fr et category (staff/student/family/other) sont requis.' });
    }
    try {
        const { data, error } = await classeurClient
            .from('role_types')
            .insert({ code: code.trim(), label_fr: label_fr.trim(), category })
            .select('id, code, label_fr, category')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors de la création du type de rôle." });
    }
});

router.post('/relationship-types', async (req, res) => {
    const { code, label_fr, inverse_code } = req.body || {};
    if (!code?.trim() || !label_fr?.trim()) {
        return res.status(400).json({ error: 'code et label_fr sont requis.' });
    }
    try {
        const { data, error } = await classeurClient
            .from('relationship_types')
            .insert({ code: code.trim(), label_fr: label_fr.trim(), inverse_code: inverse_code?.trim() || null })
            .select('id, code, label_fr, inverse_code')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors de la création du type de relation." });
    }
});

export default router;
