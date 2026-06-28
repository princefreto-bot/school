const { supabase } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const schoolSlug = 'csyzomacamb';
        const hashed = await bcrypt.hash('password123', 10);
        const adminPayload = {
            nom: 'Directeur Test',
            telephone: '+22899999999',
            password: hashed,
            role: 'directeur',
            accepted_terms: true,
            accepted_privacy_policy: true,
            marketing_consent: true,
            consented_at: new Date().toISOString(),
            signup_ip_hash: '127.0.0.1'
        };

        const { data, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .insert(adminPayload)
            .select()
            .single();

        if (error) {
            console.error('Error inserting test user:', error);
        } else {
            console.log('Successfully created test user:', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

run();
