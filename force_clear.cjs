const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function forceClear() {
    console.log('🚀 Force clearing Supabase...');
    try {
        await supabase.from('presences').delete().filter('id', 'neq', '_none_');
        await supabase.from('parent_student').delete().filter('student_id', 'neq', '_none_');
        await supabase.from('payments').delete().filter('id', 'neq', '_none_');
        const { error } = await supabase.from('students').delete().filter('id', 'neq', '_none_');
        
        if (error) console.error('Error clearing:', error.message);
        else console.log('✅ Supabase students cleared successfully!');
    } catch (err) {
        console.error('Fatal:', err.message);
    }
}

forceClear();
