const { supabase } = require('./utils/supabase');

async function run() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching global profiles:', error);
        return;
    }
    console.log(`Global profiles (${profiles.length}):`);
    profiles.forEach(p => {
        console.log(`- ID: ${p.id}, Nom: ${p.nom}, Role: ${p.role}, Tel: ${p.telephone}, Email: ${p.email}`);
    });
}

run();
