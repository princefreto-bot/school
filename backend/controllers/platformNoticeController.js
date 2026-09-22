// ============================================================
// PLATFORM NOTICE — Message/image du proprietaire SaaS (superadmin)
// affiche aux comptes etablissement (admin/directeur/comptable...),
// jamais aux enseignants ni aux parents.
// Une seule notice active a la fois (id fixe 'current').
// ============================================================
const { supabase } = require('../utils/supabase');

// Roles "compte etablissement" cibles par la notice : direction + comptabilite.
// Volontairement plus etroit que "tout le personnel non-enseignant" — la demande
// est d'informer les directeurs, pas le personnel de terrain (surveillant, secretaire...).
const ELIGIBLE_ROLES = ['admin', 'directeur', 'directeur_general', 'comptable'];

/**
 * GET /api/superadmin/notice
 * Etat actuel de la notice (pour l'ecran d'edition superadmin).
 */
async function getPlatformNoticeAdmin(req, res) {
    try {
        const { data, error } = await supabase
            .from('platform_notices')
            .select('*')
            .eq('id', 'current')
            .maybeSingle();
        if (error) throw error;
        return res.json({ notice: data || null });
    } catch (err) {
        console.error('getPlatformNoticeAdmin error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * PUT /api/superadmin/notice
 * Cree/remplace la notice courante. body: { title?, message?, imageUrl?, active }
 */
async function upsertPlatformNotice(req, res) {
    try {
        const { title, message, imageUrl, active } = req.body;

        if (!message && !imageUrl) {
            return res.status(400).json({ error: 'La notice doit contenir au moins un message ou une image.' });
        }

        const { data, error } = await supabase
            .from('platform_notices')
            .upsert({
                id: 'current',
                title: title || null,
                message: message || null,
                image_url: imageUrl || null,
                active: active !== false,
                created_by: req.user.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .single();
        if (error) throw error;

        return res.json({ notice: data });
    } catch (err) {
        console.error('upsertPlatformNotice error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/superadmin/notice
 * Desactive la notice courante (ne la supprime pas, au cas ou on veut la reactiver).
 */
async function deactivatePlatformNotice(req, res) {
    try {
        const { error } = await supabase
            .from('platform_notices')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', 'current');
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        console.error('deactivatePlatformNotice error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/platform-notice
 * Notice a afficher pour l'utilisateur connecte — null si inactive, si
 * l'utilisateur n'a pas un role eligible (jamais enseignant/secretaire/parent),
 * ou si aucune notice n'a ete publiee.
 */
async function getPlatformNoticeForUser(req, res) {
    try {
        if (!ELIGIBLE_ROLES.includes(req.user.role)) {
            return res.json({ notice: null });
        }

        const { data, error } = await supabase
            .from('platform_notices')
            .select('id, title, message, image_url, updated_at')
            .eq('id', 'current')
            .eq('active', true)
            .maybeSingle();
        if (error) throw error;

        return res.json({ notice: data || null });
    } catch (err) {
        console.error('getPlatformNoticeForUser error:', err.message);
        return res.json({ notice: null });
    }
}

module.exports = {
    getPlatformNoticeAdmin,
    upsertPlatformNotice,
    deactivatePlatformNotice,
    getPlatformNoticeForUser
};
