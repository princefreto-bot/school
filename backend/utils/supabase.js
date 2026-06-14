const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Utiliser la clé SERVICE_ROLE si elle existe pour bypasser RLS, sinon fallback sur Anon
const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isServiceRoleConfigured = rawServiceRoleKey && rawServiceRoleKey !== 'VOTRE_NOUVELLE_SERVICE_ROLE_KEY';
const supabaseKey = isServiceRoleConfigured ? rawServiceRoleKey : process.env.SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl ? '✓ Configurée' : '❌ MANQUANTE');
console.log('[Supabase] Clé Backend:', isServiceRoleConfigured ? '✓ SERVICE_ROLE (RLS Bypass)' : '⚠️ ANON_KEY (Sujet à RLS)');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERREUR: Clés Supabase manquantes dans le fichier .env');
    process.exit(1);
}

// Client principal (SERVICE_ROLE ou ANON selon .env)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin explicite avec service_role (pour Storage uploads)
const supabaseAdmin = isServiceRoleConfigured
    ? createClient(supabaseUrl, rawServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : supabase;

// Test la connexion à Supabase au démarrage
(async () => {
    try {
        const { data, error } = await supabase.from('schools').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connecté avec succès');
    } catch (err) {
        console.error('❌ Impossible de se connecter à Supabase:', err.message);
        console.error('Vérifiez vos clés et l\'URL dans le fichier .env');
    }
})();

module.exports = { supabase, supabaseAdmin };
