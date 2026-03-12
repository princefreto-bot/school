const { supabase } = require('../utils/supabase');

/**
 * GET /api/settings
 * Récupère les paramètres publics (Nom app, logo, etc.) sans auth.
 */
async function getPublicSettings(req, res) {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'global_settings')
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "not found"
            console.error('❌ [Settings] Supabase error:', error.message);
            throw error;
        }

        if (!data) {
            console.log('🌐 [Settings] No database settings found, returning defaults.');
            return res.json({
                appName: 'EduFinance',
                schoolName: 'Établissement Scolaire',
                schoolLogo: null
            });
        }

        console.log('🌐 [Settings] Dispatching public settings:', {
            appName: data.app_name,
            logoPresent: !!data.school_logo
        });

        return res.json({
            appName: data.app_name,
            schoolName: data.school_name,
            schoolYear: data.school_year,
            schoolLogo: data.school_logo
        });
    } catch (err) {
        console.error('Error fetching public settings:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getPublicSettings };
