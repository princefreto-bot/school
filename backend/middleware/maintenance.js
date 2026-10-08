// ============================================================
// Mode "Mise à jour en cours" — interrupteur piloté par le superadmin
// (table public.platform_maintenance). Quand il est actif, les écoles reçoivent
// 503 et l'application affiche un écran de maintenance ; le superadmin, la
// connexion, le webhook de paiement et le health check restent accessibles.
// ============================================================
'use strict';
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET } = require('../config');

const CACHE_MS = 15 * 1000;
let cache = { at: 0, state: { active: false, message: '' } };

async function getMaintenanceState(force = false) {
    if (!force && Date.now() - cache.at < CACHE_MS) return cache.state;
    try {
        const { data, error } = await supabase
            .from('platform_maintenance')
            .select('active, message, updated_at')
            .eq('id', 'current')
            .maybeSingle();
        if (error) throw error;
        cache = { at: Date.now(), state: { active: !!data?.active, message: data?.message || '', updatedAt: data?.updated_at || null } };
    } catch (err) {
        // En cas d'erreur de lecture, on ne bloque jamais les écoles : on garde l'état connu.
        console.error('⚠️ [Maintenance] Lecture impossible:', err.message);
        cache.at = Date.now();
    }
    return cache.state;
}

function invalidateMaintenanceCache() {
    cache.at = 0;
}

const ALWAYS_ALLOWED = [
    '/api/health',
    '/api/maintenance',
    '/api/superadmin',
    '/api/auth/login',
    '/api/webhooks',
];

function isSuperadminRequest(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return false;
    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        return payload?.role === 'superadmin';
    } catch {
        return false;
    }
}

async function maintenanceGuard(req, res, next) {
    if (ALWAYS_ALLOWED.some((p) => req.originalUrl.startsWith(p))) return next();
    const state = await getMaintenanceState();
    if (!state.active || isSuperadminRequest(req)) return next();
    return res.status(503).json({ error: state.message, maintenance: true });
}

module.exports = { maintenanceGuard, getMaintenanceState, invalidateMaintenanceCache };
