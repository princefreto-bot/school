const { supabase } = require('./utils/supabase');

async function run() {
    // Run SQL via supabase.rpc or a simple query
    // Wait, since we can't run raw SQL easily via JS client, let's try querying pg_tables if we have a custom RPC or try querying pg_class
    // Or, we can use a supabase rpc if one exists, or query a postgres catalog table.
    // Wait! Let's try to query 'pg_catalog.pg_tables' or 'information_schema.tables'.
    const { data, error } = await supabase
        .from('schools')
        .select('slug');
    
    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }
    console.log('Schools:', data);
}

run();
