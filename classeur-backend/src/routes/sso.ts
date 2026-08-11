// ============================================================
// SSO — échange du code de handoff émis par dghubschool.com
// ============================================================
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { classeurClient } from '../lib/supabaseClasseur';

const router = Router();

// ── POST /api/sso/redeem ─────────────────────────────────────
// Appelé par le frontend du classeur juste après la redirection depuis dghubschool.com
// (?code=...). Échange ensuite ce code serveur-à-serveur contre l'identité du superadmin,
// vérifie qu'il est un opérateur actif du classeur, puis émet un JWT propre à ce service.
router.post('/redeem', async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
        return res.status(400).json({ error: 'Code manquant.' });
    }
    if (!config.CLASSEUR_INTERNAL_SECRET) {
        return res.status(500).json({ error: 'Configuration serveur incomplète (secret interne).' });
    }

    try {
        const response = await fetch(`${config.MAIN_BACKEND_URL}/api/superadmin/classeur/redeem-handoff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': config.CLASSEUR_INTERNAL_SECRET,
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            return res.status(response.status).json({ error: body.error || 'Code invalide ou expiré.' });
        }

        const { superadminId, nom } = (await response.json()) as { superadminId: string; nom: string };

        const { data: operator, error } = await classeurClient
            .from('operators')
            .select('*')
            .eq('dghubschool_superadmin_id', superadminId)
            .single();

        if (error || !operator) {
            return res.status(403).json({ error: "Ce compte n'est pas encore autorisé sur le classeur." });
        }
        if (!operator.is_active) {
            return res.status(403).json({ error: 'Accès désactivé pour ce compte.' });
        }

        await classeurClient
            .from('operators')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', operator.id);

        const token = jwt.sign(
            { operatorId: operator.id, superadminId, nom },
            config.CLASSEUR_JWT_SECRET,
            { expiresIn: config.CLASSEUR_JWT_EXPIRES as jwt.SignOptions['expiresIn'] }
        );

        await classeurClient.from('audit_logs').insert({
            actor_id: operator.id,
            actor_name: nom,
            action: 'login',
            entity_type: 'operator',
            entity_id: operator.id,
        });

        return res.json({ token, operator: { id: operator.id, displayName: operator.display_name || nom } });
    } catch (err) {
        console.error('SSO redeem error:', err);
        return res.status(500).json({ error: "Erreur lors de l'authentification." });
    }
});

export default router;
