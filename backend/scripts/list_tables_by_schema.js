const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
    console.log('🔍 [List Tables] Connecting with schema option...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    // Connect explicitly to information_schema
    const supabase = createClient(supabaseUrl, supabaseKey, {
        db: { schema: 'information_schema' }
    });

    try {
        const { data, error } = await supabase
            .from('tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public');
            
        if (error) {
            console.error('❌ Error fetching from information_schema.tables:', error.message);
        } else {
            console.log('✅ List of all public tables in Supabase:');
            const names = data.map(t => t.table_name).sort();
            names.forEach(name => {
                console.log(`- ${name}`);
            });
        }
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
