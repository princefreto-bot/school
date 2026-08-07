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

/**
 * POST /api/settings/recalculate-fees
 * Applique les frais de scolarité personnalisés (class_fees, déjà enregistrés via
 * updateAllSettings) aux élèves déjà créés : recalcule écolage/restant/statut pour
 * chaque élève dont la classe a un tarif personnalisé, sans toucher aux autres.
 * Ne modifie jamais les paiements déjà enregistrés (deja_paye) — uniquement le montant dû.
 */
async function recalculateFees(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data: settings, error: settingsErr } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('class_fees')
            .eq('id', 'global_settings')
            .single();
        if (settingsErr) throw settingsErr;

        const classFees = settings?.class_fees || {};
        const overrideEntries = Object.entries(classFees).filter(
            ([, v]) => typeof v === 'number' && !Number.isNaN(v) && v >= 0
        );
        if (overrideEntries.length === 0) {
            return res.json({ updated: 0, total: 0, message: 'Aucun frais personnalisé à appliquer.' });
        }

        const { data: students, error: studentsErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id, classe, deja_paye, ecolage');
        if (studentsErr) throw studentsErr;

        const findOverride = (classe) => {
            const target = String(classe || '').trim().toLowerCase();
            const match = overrideEntries.find(([k]) => k.trim().toLowerCase() === target);
            return match ? match[1] : null;
        };

        let updated = 0;
        for (const student of students || []) {
            const newEcolage = findOverride(student.classe);
            if (newEcolage == null || newEcolage === student.ecolage) continue;

            const dejaPaye = Number(student.deja_paye) || 0;
            const restant = Math.max(0, newEcolage - dejaPaye);
            let status = 'Non soldé';
            if (restant <= 0) status = 'Soldé';
            else if (dejaPaye / newEcolage >= 0.7) status = 'Partiel';

            const { error: updateErr } = await supabase
                .from(`students_${schoolSlug}`)
                .update({ ecolage: newEcolage, restant, status })
                .eq('id', student.id);
            if (updateErr) {
                console.error(`recalculateFees: échec mise à jour élève ${student.id}:`, updateErr.message);
                continue;
            }
            updated++;
        }

        return res.json({ updated, total: (students || []).length });
    } catch (err) {
        console.error('recalculateFees error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getPublicSettings, getReminderSettings, updateReminderSettings, recalculateFees };
