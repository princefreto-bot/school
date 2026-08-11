// ============================================================
// HANDOFF SSO — Classeur Intelligent de Personnes (data.dghubschool.com)
// ============================================================
// Ce contrôleur ne fait QUE le pont d'authentification entre le backend
// principal (dghubschool.com) et le service séparé classeur-backend.
// Aucune donnée de personnes ne transite ici.
'use strict';

const crypto = require('crypto');
const { supabase } = require('../utils/supabase');
const { CLASSEUR_INTERNAL_SECRET } = require('../config');

const HANDOFF_TTL_SECONDS = 60;

// ── GET /api/superadmin/classeur/handoff-token ──────────────────
// Appelé par le navigateur du superadmin, déjà authentifié sur dghubschool.com.
// Émet un code à usage unique à échanger côté serveur par classeur-backend.
async function getHandoffToken(req, res) {
    try {
        const code = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + HANDOFF_TTL_SECONDS * 1000).toISOString();

        const { error } = await supabase
            .schema('classeur')
            .from('sso_handoffs')
            .insert({ code, superadmin_id: req.user.id, expires_at: expiresAt });

        if (error) throw error;

        return res.json({ code, expiresAt });
    } catch (err) {
        console.error('Classeur handoff-token Error:', err.message);
        return res.status(500).json({ error: "Erreur génération du code d'accès au classeur." });
    }
}

// ── POST /api/superadmin/classeur/redeem-handoff ────────────────
// Appelé serveur-à-serveur par classeur-backend uniquement (jamais par un navigateur).
// Protégé par un secret partagé côté serveur, distinct du JWT_SECRET applicatif.
async function redeemHandoff(req, res) {
    const providedSecret = req.header('x-internal-secret');
    if (!CLASSEUR_INTERNAL_SECRET || providedSecret !== CLASSEUR_INTERNAL_SECRET) {
        return res.status(403).json({ error: 'Accès interne refusé.' });
    }

    const { code } = req.body || {};
    if (!code) {
        return res.status(400).json({ error: 'Code manquant.' });
    }

    try {
        const { data: handoff, error } = await supabase
            .schema('classeur')
            .from('sso_handoffs')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !handoff) {
            return res.status(404).json({ error: 'Code invalide.' });
        }
        if (handoff.used) {
            return res.status(409).json({ error: 'Code déjà utilisé.' });
        }
        if (new Date(handoff.expires_at).getTime() < Date.now()) {
            return res.status(410).json({ error: 'Code expiré.' });
        }

        const { error: updateErr } = await supabase
            .schema('classeur')
            .from('sso_handoffs')
            .update({ used: true })
            .eq('code', code);
        if (updateErr) throw updateErr;

        const { data: superadmin, error: superadminErr } = await supabase
            .from('superadmins')
            .select('id, nom, telephone')
            .eq('id', handoff.superadmin_id)
            .single();

        if (superadminErr || !superadmin) {
            return res.status(404).json({ error: 'SuperAdmin introuvable.' });
        }

        return res.json({
            superadminId: superadmin.id,
            nom: superadmin.nom,
            telephone: superadmin.telephone
        });
    } catch (err) {
        console.error('Classeur redeem-handoff Error:', err.message);
        return res.status(500).json({ error: "Erreur échange du code d'accès au classeur." });
    }
}

module.exports = { getHandoffToken, redeemHandoff };
