// ============================================================
// VERIFICATION SCHEMA DB — Supabase PostgreSQL
// ============================================================
const { supabase } = require('../utils/supabase');

async function checkSchema() {
    console.log('🔍 [Database] Vérification du schéma de base de données...');
    
    const tables = ['creators', 'creator_schools', 'student_documents'];
    const missingTables = [];

    for (const table of tables) {
        try {
            // Test simple de sélection sur la table (renvoie une erreur s'il manque la table)
            const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (error) {
                // Code d'erreur PGRST116 ou relation non trouvée
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    missingTables.push(table);
                } else {
                    console.warn(`⚠️ [Database] Alerte sur la table "${table}":`, error.message);
                }
            } else {
                console.log(`✅ [Database] Table "${table}" détectée.`);
            }
        } catch (err) {
            missingTables.push(table);
        }
    }

    if (missingTables.length > 0) {
        console.error(`\n❌ [Database] Erreur : Les tables suivantes sont manquantes dans Supabase : ${missingTables.join(', ')}`);
        console.error(`👉 Action requise :`);
        console.error(`   Veuillez copier et exécuter le contenu de :`);
        console.error(`   c:/Users/LENOVO/Desktop/D/backend/data/creators_migration.sql`);
        console.error(`   dans l'éditeur SQL de votre console Supabase.\n`);
        return false;
    }

    console.log('🎉 [Database] Le schéma de base de données est complet et prêt !');
    return true;
}

if (require.main === module) {
    checkSchema();
}

module.exports = { checkSchema };
