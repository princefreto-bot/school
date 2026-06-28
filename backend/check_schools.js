const { supabase } = require('./utils/supabase');

async function run() {
    const { data: schools, error } = await supabase.from('schools').select('*');
    if (error) {
        console.error('Error fetching schools:', error);
        return;
    }
    console.log('Schools detailed:', schools.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        email: s.email,
        is_approved: s.is_approved,
        is_email_verified: s.is_email_verified,
        temp_admin_telephone: s.temp_admin_telephone,
        temp_admin_nom: s.temp_admin_nom
    })));
}

run();
