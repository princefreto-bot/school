const { supabase } = require('./utils/supabase');

async function run() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching global profiles:', error);
        return;
    }
    // PII (nom/téléphone/email) volontairement omise du log : ce script peut être lancé
    // par erreur avec un .env pointant vers la base de production.
    console.log(`Global profiles (${profiles.length}):`);
    profiles.forEach(p => {
        console.log(`- ID: ${p.id}, Role: ${p.role}`);
    });
}

run();
