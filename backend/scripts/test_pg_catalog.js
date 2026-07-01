const { supabase } = require('../utils/supabase');

async function run() {
    console.log('Testing pg_tables query...');
    try {
        const { data, error } = await supabase.from('pg_tables').select('*');
        if (error) {
            console.log('❌ Error querying pg_tables directly:', error.message);
        } else {
            console.log('✅ Success! Found tables:', data.map(t => t.tablename));
        }
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
