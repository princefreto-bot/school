const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Utiliser la clé SERVICE_ROLE si elle existe pour bypasser RLS, sinon fallback sur Anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl ? '✓ Configurée' : '❌ MANQUANTE');
console.log('[Supabase] Clé Backend:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ SERVICE_ROLE (RLS Bypass)' : '⚠️ ANON_KEY (Sujet à RLS)');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERREUR: Clés Supabase manquantes dans le fichier .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test la connexion à Supabase au démarrage
(async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connecté avec succès');
    } catch (err) {
        console.error('❌ Impossible de se connecter à Supabase:', err.message);
        console.error('Vérifiez vos clés et l\'URL dans le fichier .env');
    }
})();

module.exports = { supabase };
