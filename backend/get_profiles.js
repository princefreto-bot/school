const { supabase } = require('./utils/supabase');

async function test() {
    const schools = ['complexescolairebaptistejesussauve', 'csyzomacamb'];
    for (const slug of schools) {
        const { data, error } = await supabase.from(`profiles_${slug}`).select('*');
        if (error) {
            console.error(`Error for profiles_${slug}:`, error.message);
        } else {
            console.log(`profiles_${slug} rows (${data.length}):`, data.map(p => ({ id: p.id, nom: p.nom, role: p.role, telephone: p.telephone })));
        }
    }
}

test();
