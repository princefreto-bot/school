'use strict';
const { supabase } = require('../utils/supabase');
const { getMaintenanceState, invalidateMaintenanceCache } = require('../middleware/maintenance');

// GET /api/maintenance — public : l'application l'interroge pour afficher l'écran de mise à jour.
async function getMaintenance(req, res) {
    const state = await getMaintenanceState();
    return res.json({ active: state.active, message: state.active ? state.message : '' });
}

// GET /api/superadmin/maintenance
async function getMaintenanceAdmin(req, res) {
    const state = await getMaintenanceState(true);
    return res.json(state);
}

// PUT /api/superadmin/maintenance { active, message? }
async function setMaintenance(req, res) {
    const { active, message } = req.body || {};
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'Le champ active (booléen) est requis.' });
    const update = { active, updated_at: new Date().toISOString() };
    if (typeof message === 'string' && message.trim()) update.message = message.trim().slice(0, 500);
    try {
        const { error } = await supabase.from('platform_maintenance').update(update).eq('id', 'current');
        if (error) throw error;
        invalidateMaintenanceCache();
        console.error(`🛠️ [Maintenance] ${active ? 'ACTIVÉE' : 'désactivée'} par ${req.user?.nom || req.user?.id}`);
        return res.json(await getMaintenanceState(true));
    } catch (err) {
        console.error('❌ [Maintenance] Mise à jour impossible:', err.message);
        return res.status(500).json({ error: "Impossible de changer le mode maintenance." });
    }
}

module.exports = { getMaintenance, getMaintenanceAdmin, setMaintenance };
