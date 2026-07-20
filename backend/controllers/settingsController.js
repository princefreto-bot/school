const { supabase } = require('../utils/supabase');

/**
 * GET /api/settings
 * Gère les paramètres publics de la plateforme globale
 */
async function getPublicSettings(req, res) {
    // La table unifiée app_settings n'existe plus en SaaS,
    // Chaque école possède sa propre table, donc on retourne des valeurs générales par défaut
    // sur la page de connexion, avant que l'utilisateur sélectionne son école !
    try {
        return res.json({
            appName: 'Portail Éducation',
            schoolName: 'Bienvenue'
        });
    } catch (err) {
        console.error('Error fetching public settings:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/settings/reminders
 * Configuration des alertes automatiques de retard de paiement pour l'école.
 */
async function getReminderSettings(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data, error } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('auto_reminders_enabled, auto_reminders_threshold_days')
            .eq('id', 'global_settings')
            .single();
        if (error) throw error;
        return res.json({
            autoRemindersEnabled: data.auto_reminders_enabled || false,
            autoRemindersThresholdDays: data.auto_reminders_threshold_days || 30
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * PATCH /api/settings/reminders
 */
async function updateReminderSettings(req, res) {
    const { schoolSlug } = req.user;
    const { autoRemindersEnabled, autoRemindersThresholdDays } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (autoRemindersThresholdDays !== undefined && autoRemindersThresholdDays < 1) {
        return res.status(400).json({ error: 'Le seuil doit être d\'au moins 1 jour.' });
    }

    const updates = {};
    if (autoRemindersEnabled !== undefined) updates.auto_reminders_enabled = autoRemindersEnabled;
    if (autoRemindersThresholdDays !== undefined) updates.auto_reminders_threshold_days = autoRemindersThresholdDays;

    try {
        const { data, error } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .update(updates)
            .eq('id', 'global_settings')
            .select('auto_reminders_enabled, auto_reminders_threshold_days')
            .single();
        if (error) throw error;
        return res.json({
            autoRemindersEnabled: data.auto_reminders_enabled,
            autoRemindersThresholdDays: data.auto_reminders_threshold_days
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getPublicSettings, getReminderSettings, updateReminderSettings };
