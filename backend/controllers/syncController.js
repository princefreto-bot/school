// ============================================================
// CONTRÔLEUR — Synchronisation (Version JSON)
// ============================================================
const { getDb, saveDb } = require('../models/db');

/**
 * POST /api/sync
 * Reçoit les données du localStorage frontend et les merge dans le JSON local.
 */
function syncFromFrontend(req, res) {
    const db = getDb();
    const { students = [], parents = [] } = req.body;

    if (!Array.isArray(students) || !Array.isArray(parents)) {
        return res.status(400).json({ error: 'Format invalide.' });
    }

    let studentsCount = 0;
    let paymentsCount = 0;
    let parentsCount = 0;

    // 1. Sync Students & Payments
    students.forEach(s => {
        const existingIndex = db.students.findIndex(item => item.id === s.id);
        const studentData = {
            id: s.id,
            nom: s.nom,
            prenom: s.prenom,
            classe: s.classe,
            cycle: s.cycle || 'Primaire',
            telephone: s.telephone || null,
            sexe: s.sexe || 'M',
            ecolage: s.ecolage || 0,
            deja_paye: s.dejaPaye || 0,
            restant: s.restant || 0,
            status: s.status || 'Non soldé',
            recu: s.recu || null,
            created_at: s.createdAt || new Date().toISOString(),
            updated_at: s.updatedAt || new Date().toISOString()
        };

        if (existingIndex > -1) {
            db.students[existingIndex] = studentData;
        } else {
            db.students.push(studentData);
        }
        studentsCount++;

        // Sync History
        if (Array.isArray(s.historiquesPaiements)) {
            s.historiquesPaiements.forEach(p => {
                const pExists = db.payments.some(item => item.id === p.id);
                if (!pExists) {
                    db.payments.push({
                        id: p.id,
                        student_id: s.id,
                        montant: p.montant,
                        date: p.date,
                        recu: p.recu || null,
                        note: p.note || null
                    });
                    paymentsCount++;
                }
            });
        }
    });

    // 2. Sync Parents & Links
    parents.forEach(p => {
        if (!p.telephone) return;

        const existingIndex = db.parents.findIndex(item => item.telephone === p.telephone);
        const parentData = {
            id: p.id,
            nom: p.nom,
            telephone: p.telephone,
            password: p.password || 'changeme',
            created_at: p.createdAt || new Date().toISOString()
        };

        if (existingIndex > -1) {
            db.parents[existingIndex].nom = p.nom; // Don't overite password from sync
        } else {
            db.parents.push(parentData);
        }
        parentsCount++;

        // Auto-link if student has parentId
        const linkedStudents = students.filter(s => s.parentId === p.id);
        linkedStudents.forEach(s => {
            const linkExists = db.parent_student.some(
                l => l.parent_id === p.id && l.student_id === s.id
            );
            if (!linkExists) {
                db.parent_student.push({ parent_id: p.id, student_id: s.id });
            }
        });
    });

    saveDb();

    return res.json({
        message: 'Synchronisation JSON réussie.',
        studentsCount,
        paymentsCount,
        parentsCount
    });
}

module.exports = { syncFromFrontend };
