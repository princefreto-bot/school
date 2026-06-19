require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'VOTRE_NOUVELLE_SERVICE_ROLE_KEY'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Fetching all table names from Supabase...');
        // We can query pg_tables through a simple RPC or just run a query
        // Let's run a SQL query using Supabase's REST API or RPC if available.
        // Wait, if RPC is not available we can just try to fetch school slugs first and query known dynamic tables
        const { data: schools, error: sErr } = await supabase.from('schools').select('*');
        if (sErr) throw sErr;
        
        console.log('Schools in DB:', schools.map(s => ({ id: s.id, name: s.name, slug: s.slug })));

        console.log('\nFetching academic years for all schools...');
        const { data: years, error: yErr } = await supabase.from('academic_years').select('*');
        if (yErr) throw yErr;
        console.log('Academic years in DB:', years.map(y => ({ id: y.id, school_slug: y.school_slug, name: y.name, is_current: y.is_current })));

        const tableTemplates = ['students', 'payments', 'presences', 'notes', 'matieres', 'classe_matieres', 'profiles'];

        for (const school of schools) {
            const slug = school.slug;
            console.log(`\n---------------------------------`);
            console.log(`School Slug: ${slug}`);

            for (const t of tableTemplates) {
                const tableName = `${t}_${slug}`;
                const { data, error } = await supabase.from(tableName).select('*');
                if (error) {
                    // console.log(`Table ${tableName} does not exist or error: ${error.message}`);
                    continue;
                }
                console.log(`Table "${tableName}" exists. Total rows: ${data.length}`);
                if (data.length > 0) {
                    const counts = {};
                    data.forEach(row => {
                        const yearId = row.academic_year_id || 'null';
                        counts[yearId] = (counts[yearId] || 0) + 1;
                    });
                    for (const [yearId, count] of Object.entries(counts)) {
                        const yr = years.find(y => y.id === yearId);
                        console.log(`  - Year ID ${yearId} ("${yr ? yr.name : 'Unknown'}"): ${count} rows`);
                    }
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
