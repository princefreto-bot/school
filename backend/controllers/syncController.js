const { supabase } = require('../utils/supabase');

/**
 * POST /api/sync
 * Reçoit les données du frontend et les synchronise dans Supabase (Single Source of Truth).
 */
async function syncFromFrontend(req, res) {
    const { students = [] } = req.body;
    const { role } = req.user;

    // Seuls le directeur et le comptable peuvent synchroniser les données
    if (role !== 'directeur' && role !== 'comptable') {
        return res.status(403).json({ error: 'Permission refusée. Seul la Direction ou la Comptabilité peut synchroniser.' });
    }

    try {
        console.log(`🔄 Synchronisation de ${students.length} élèves...`);

        // UNICITÉ RÉELLE : Filtrage par ID (comme dans le frontend)
        const uniqueItems = new Map();
        students.forEach(s => {
            if (s.id) uniqueItems.set(s.id, s);
        });

        const filteredStudents = Array.from(uniqueItems.values());

        // Préparation des données élèves
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

        // Upsert avec contrainte d'ID
        const { error: sErr } = await supabase
            .from('students')
            .upsert(studentData, { onConflict: 'id' });

        if (sErr) throw sErr;

        // Sync des paiements
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
            await supabase.from('payments').upsert(allPayments, { onConflict: 'id' });
        }

        return res.json({
            message: 'Synchronisation terminée sans doublons.',
            count: studentData.length
        });

    } catch (err) {
        console.error('❌ Erreur Sync:', err.message);
        return res.status(500).json({ error: 'Échec de la synchronisation cloud.' });
    }
}

module.exports = { syncFromFrontend };
