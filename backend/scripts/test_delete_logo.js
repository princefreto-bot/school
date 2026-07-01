const { supabase } = require('../utils/supabase');

async function run() {
    console.log('🔄 [Test Delete Logo] Simulating syncToBackend with schoolLogo = null...');
    const appSettings = {
        appName: 'DGhubSchool',
        schoolName: 'C.S.YZOMACAMB',
        schoolYear: '2024-2025',
        schoolLogo: null, // Deleting logo
        schoolStamp: 'test_stamp',
        messageRemerciement: 'remerciement',
        messageRappel: 'rappel',
        tranches: []
    };

    try {
        const { error } = await supabase.from('app_settings_csyzomacamb').upsert({
            id: 'global_settings',
            app_name: appSettings.appName,
            school_name: appSettings.schoolName,
            school_year: appSettings.schoolYear,
            school_logo: appSettings.schoolLogo,
            school_stamp: appSettings.schoolStamp,
            message_remerciement: appSettings.messageRemerciement,
            message_rappel: appSettings.messageRappel,
            tranches: appSettings.tranches,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) {
            console.error('❌ Supabase Upsert Error:', error.message);
        } else {
            console.log('✅ Upsert completed successfully.');
            // Query it back
            const { data, error: fetchErr } = await supabase
                .from('app_settings_csyzomacamb')
                .select('school_logo')
                .eq('id', 'global_settings')
                .single();
                
            if (fetchErr) {
                console.error('❌ Fetch Error:', fetchErr.message);
            } else {
                console.log('🎉 Current school_logo in DB:', data.school_logo);
            }
        }
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
