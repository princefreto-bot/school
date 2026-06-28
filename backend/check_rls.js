const { supabase } = require('./utils/supabase');

async function run() {
    // We can query pg_tables or run an RPC if one is available
    // But wait, there is no direct SQL editor here. Let's try running a query on a view or catalog
    const { data, error } = await supabase.rpc('enable_rls_for_school', { school_slug: 'test' }).catch(e => ({ error: e }));
    console.log('RPC check:', { data, error });
}

run();
