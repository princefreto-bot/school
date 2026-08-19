const { supabase } = require('./utils/supabase');

async function test() {
    const schools = ['complexescolairebaptistejesussauve', 'csyzomacamb'];
    for (const slug of schools) {
        const { data, error } = await supabase.from(`profiles_${slug}`).select('*');
        if (error) {
            console.error(`Error for profiles_${slug}:`, error.message);
        } else {
            // PII (nom/téléphone) volontairement omise : script pouvant être lancé par erreur
            // avec un .env pointant vers la base de production.
            console.log(`profiles_${slug} rows (${data.length}):`, data.map(p => ({ id: p.id, role: p.role })));
        }
    }
}

test();
