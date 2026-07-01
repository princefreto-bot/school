const { supabase } = require('../utils/supabase');

const candidates = [
    'huj', 'demo', 'test', 'school', 'dghub', 'dghubschool', 'parent', 'admin', 
    'test-noconsent-school', 'ecole', 'institution', 'lycee', 'college',
    'schooltest', 'test-school', 'testschool', 'schooltest1', 'schooltest2', 'schooltest3'
];

async function run() {
    console.log('🏁 [Database Audit] Starting database audit and cleanup...');
    
    // 1. Récupérer les écoles enregistrées dans la table 'schools'
    const { data: schools, error: schoolsErr } = await supabase
        .from('schools')
        .select('*');
        
    if (schoolsErr) {
        console.error('❌ Impossible de lire la table schools:', schoolsErr.message);
        return;
    }

    const activeSlugs = new Set(schools.map(s => s.slug));
    console.log(`\n🏫 Écoles enregistrées dans la table 'schools' (${schools.length}) :`);
    
    for (const school of schools) {
        let studentCount = 'Table introuvable';
        let paymentsCount = 0;
        let profileCount = 0;
        let exists = false;
        
        try {
            const { count, error } = await supabase
                .from(`students_${school.slug}`)
                .select('*', { count: 'exact', head: true });
                
            if (!error || error.code !== '42P01') {
                exists = true;
                studentCount = count || 0;
                
                const { count: pCount } = await supabase
                    .from(`payments_${school.slug}`)
                    .select('*', { count: 'exact', head: true });
                paymentsCount = pCount || 0;

                const { count: uCount } = await supabase
                    .from(`profiles_${school.slug}`)
                    .select('*', { count: 'exact', head: true });
                profileCount = uCount || 0;
            }
        } catch (e) {
            // Ignorer
        }

        console.log(`- Slug: "${school.slug}" | Nom: "${school.name}"`);
        console.log(`  Statut: "${school.status}" | Approuvé: ${school.is_approved}`);
        console.log(`  Tables existantes: ${exists ? 'Oui' : 'Non'}`);
        if (exists) {
            console.log(`  Contenu: ${studentCount} élèves, ${paymentsCount} paiements, ${profileCount} profils/utilisateurs`);
        }
    }

    // 2. Scanner les slugs orphelins (tables sans école dans la table 'schools')
    console.log('\n🔍 [Orphan Scan] Recherche de tables d\'écoles supprimées ou orphelines...');
    
    const orphansFound = [];
    for (const slug of candidates) {
        if (activeSlugs.has(slug)) continue; // Déjà géré

        try {
            const { error } = await supabase
                .from(`students_${slug}`)
                .select('id')
                .limit(1);

            // Si l'erreur n'est pas "relation does not exist" (42P01), la table existe !
            const exists = !error || error.code !== '42P01';
            if (exists) {
                console.log(`⚠️ Tables orphelines détectées pour le slug: "${slug}"`);
                orphansFound.push(slug);
            }
        } catch (e) {
            // Ignorer
        }
    }

    if (orphansFound.length === 0) {
        console.log('✅ Aucun autre set de tables orphelines détecté.');
    } else {
        console.log(`\n🧹 [Orphan Cleanup] Suppression de ${orphansFound.length} set(s) de tables orphelines...`);
        for (const slug of orphansFound) {
            console.log(`🗑️ Suppression des tables pour le slug : "${slug}"`);
            const { error: rpcErr } = await supabase.rpc('drop_school_tables', { school_slug: slug });
            if (rpcErr) {
                console.error(`❌ Échec de la suppression pour "${slug}":`, rpcErr.message);
            } else {
                console.log(`✅ Tables pour "${slug}" supprimées.`);
            }
        }
    }
    
    console.log('\n🎉 Audit et nettoyage terminés avec succès.');
}

run();
