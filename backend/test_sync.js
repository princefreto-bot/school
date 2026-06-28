const { supabase } = require('./utils/supabase');

async function test(schoolSlug) {
    try {
        console.log(`Running test for school slug: ${schoolSlug}`);
        const { data: academicYearsData, error: err } = await supabase
            .from('academic_years')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('name', { ascending: false });

        if (err) {
            console.error('Error fetching academic_years:', err);
        } else {
            console.log(`Found ${academicYearsData.length} academic years in DB:`, academicYearsData);
        }

        const tbl = (name) => `${name}_${schoolSlug}`;
        const { data: appSettings, error: settingsError } = await supabase
            .from(tbl('app_settings'))
            .select('*')
            .single();

        if (settingsError) {
            console.error('Error fetching app_settings:', settingsError.message);
        } else {
            console.log('App settings in DB:', appSettings);
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test('complexescolairebaptistejesussauve');
