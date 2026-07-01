const { supabase } = require('../utils/supabase');

async function run() {
    console.log('🔍 [YZOMACAMB Logo] Querying app_settings_csyzomacamb table...');
    try {
        const { data, error } = await supabase
            .from('app_settings_csyzomacamb')
            .select('school_logo')
            .eq('id', 'global_settings')
            .single();

        if (error) {
            console.error('❌ Error fetching YZOMACAMB logo:', error.message);
        } else if (data) {
            console.log('\n✅ [YZOMACAMB Logo] Logo found!');
            console.log('--------------------------------------------------');
            if (!data.school_logo) {
                console.log('⚠️ The school_logo is currently null or empty for YZOMACAMB.');
            } else if (data.school_logo.startsWith('data:image/')) {
                console.log('The logo is stored as a Base64 string. Showing preview of the first 100 characters:');
                console.log(data.school_logo.substring(0, 100) + '...');
                console.log('\nFull Base64 string length:', data.school_logo.length);
            } else {
                console.log('The logo is stored as a public URL:');
                console.log(data.school_logo);
            }
            console.log('--------------------------------------------------');
        } else {
            console.log('⚠️ No settings record found in app_settings_csyzomacamb.');
        }
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
