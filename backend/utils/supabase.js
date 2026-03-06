const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl ? '✓ Configurée' : '❌ MANQUANTE');
console.log('[Supabase] Clé Anon:', supabaseKey ? '✓ Configurée' : '❌ MANQUANTE');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERREUR: Clés Supabase manquantes dans le fichier .env');
    console.error('Créez un fichier .env à la racine avec:');
    console.error('  SUPABASE_URL=https://votre-project.supabase.co');
    console.error('  SUPABASE_ANON_KEY=votre-clé-anon');
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
