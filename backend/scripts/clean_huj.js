const { supabase } = require('../utils/supabase');

async function run() {
    console.log('🧹 [Clean HUJ] Attempting to drop HUJ tables via RPC drop_school_tables...');
    try {
        const { data, error } = await supabase.rpc('drop_school_tables', { school_slug: 'huj' });
        if (error) {
            console.error('❌ [Clean HUJ] RPC Error:', error.message, error.details);
        } else {
            console.log('✅ [Clean HUJ] RPC executed successfully. Output:', data);
        }
    } catch (err) {
        console.error('💥 [Clean HUJ] Exception:', err.message);
    }
}

run();
