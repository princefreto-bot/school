const { supabase } = require('../utils/supabase');

/**
 * POST /api/sync
 * Reçoit les données du frontend et les synchronise dans Supabase (Single Source of Truth).
 */
async function syncFromFrontend(req, res) {
    const { students = [], parents = [] } = req.body;

    if (!Array.isArray(students)) {
        return res.status(400).json({ error: 'Format invalide.' });
    }

    try {
        console.log(`🔄 Sync demandée pour ${students.length} élèves.`);

        // 0. NETTOYAGE PRÉALABLE pour éviter les doublons fantômes
        // On supprime les élèves qui vont être mis à jour/insérés
        if (students.length > 0) {
            const ids = students.map(s => s.id);
            await supabase.from('students').delete().in('id', ids);
            await supabase.from('payments').delete().in('student_id', ids);
        }

        // 1. Sync Students (UPSERT)
        const studentData = students.map(s => ({
            id: s.id,
            nom: s.nom,
            prenom: s.prenom,
            classe: s.classe,
            cycle: s.cycle || 'Primaire',
            ecolage: s.ecolage || 0,
            deja_paye: s.dejaPaye || 0,
            restant: s.restant || 0,
            status: s.status || 'Non soldé',
            telephone_parent: s.telephone || null
        }));

        if (studentData.length > 0) {
            const { error: sErr } = await supabase
                .from('students')
                .upsert(studentData, { onConflict: 'id' });
            if (sErr) throw sErr;
        }

        // 2. Sync Payments (Extraction depuis les historiques d'élèves)
        const allPayments = [];
        students.forEach(s => {
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
            const { error: pErr } = await supabase
                .from('payments')
                .upsert(allPayments, { onConflict: 'id' });
            if (pErr) throw pErr;
        }

        return res.json({
            message: 'Synchronisation Supabase réussie.',
            studentsCount: studentData.length,
            paymentsCount: allPayments.length
        });

    } catch (err) {
        console.error('❌ Erreur de sync Supabase:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la synchronisation.', details: err.message });
    }
}

module.exports = { syncFromFrontend };
