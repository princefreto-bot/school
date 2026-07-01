const { supabase } = require('../utils/supabase');

async function run() {
    console.log('🔍 [Find Schools] Querying schools table...');
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('*')
            .order('name');
        if (error) {
            console.error('❌ Error fetching schools:', error.message);
        } else {
            console.log('Active schools in dashboard:');
            data.forEach(s => {
                console.log(`- Slug: "${s.slug}", Name: "${s.name}", Status: "${s.status}", Approved: ${s.is_approved}`);
            });
        }
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
