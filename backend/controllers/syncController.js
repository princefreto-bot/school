const { supabase } = require('../utils/supabase');

/**
 * POST /api/sync
 * Receives data from frontend and syncs to Supabase (Single Source of Truth).
 */
async function syncFromFrontend(req, res) {
    console.log('🔄 [Sync] Request received');
    
    // Check auth
    if (!req.user) {
        console.warn('⚠️ [Sync] req.user is undefined - auth failed');
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { students = [] } = req.body;
    const { role } = req.user;

    console.log(`📊 [Sync] User role: ${role}, Students count: ${students.length}`);

    // Only directeur and comptable can sync
    if (role !== 'directeur' && role !== 'comptable') {
        console.warn(`⚠️ [Sync] Permission denied for role: ${role}`);
        return res.status(403).json({ error: 'Permission refusée. Seul la Direction ou la Comptabilité peut synchroniser.' });
    }

    try {
        console.log(`🔄 [Sync] Processing ${students.length} students...`);

        // REAL UNIQUENESS: Filter by ID (like frontend)
        const uniqueItems = new Map();
        students.forEach(s => {
            if (s.id) uniqueItems.set(s.id, s);
        });

        const filteredStudents = Array.from(uniqueItems.values());
        console.log(`✅ [Sync] After dedup: ${filteredStudents.length} unique students`);

        // Prepare student data
        const studentData = filteredStudents.map(s => ({
            id: s.id,
            nom: s.nom,
            prenom: s.prenom || '',
            classe: s.classe || 'Inconnue',
            cycle: s.cycle || 'Primaire',
            ecolage: s.ecolage || 0,
            deja_paye: s.dejaPaye || 0,
            restant: s.restant || 0,
            status: s.status || 'Non soldé',
            telephone_parent: s.telephone || null
        }));

        // Upsert with ID constraint
        console.log(`📤 [Sync] Upserting ${studentData.length} students to Supabase...`);
        const { error: sErr } = await supabase
            .from('students')
            .upsert(studentData, { onConflict: 'id' });

        if (sErr) {
            console.error('❌ [Sync] Student upsert failed:', sErr.message);
            throw sErr;
        }
        console.log('✅ [Sync] Students upserted successfully');

        // Sync payments
        const allPayments = [];
        filteredStudents.forEach(s => {
            if (Array.isArray(s.historiquesPaiements)) {
                s.historiquesPaiements.forEach(p => {
                    allPayments.push({
                        id: p.id,
                        student_id: s.id,
                        montant: p.montant,
                        date: p.date,
                        recu: p.recu || null,
                        note: p.note || null
                    });
                });
            }
        });

        if (allPayments.length > 0) {
            console.log(`📤 [Sync] Upserting ${allPayments.length} payments...`);
            await supabase.from('payments').upsert(allPayments, { onConflict: 'id' });
            console.log('✅ [Sync] Payments upserted successfully');
        }

        console.log(`🎉 [Sync] Completed: ${studentData.length} students`);
        return res.json({
            message: 'Synchronisation terminée sans doublons.',
            count: studentData.length
        });

    } catch (err) {
        console.error('💥 [Sync] Fatal error:', err.message, err.code);
        return res.status(500).json({ error: 'Échec de la synchronisation cloud: ' + err.message });
    }
}


module.exports = { syncFromFrontend };
