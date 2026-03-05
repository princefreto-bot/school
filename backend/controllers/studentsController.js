// ============================================================
// CONTRÔLEUR — Élèves (Version JSON)
// ============================================================
const { getDb, saveDb } = require('../models/db');

// ── GET /api/students ─────────────────────────────────────────
function listStudents(req, res) {
    const db = getDb();
    const { nom, prenom, classe, search } = req.query;

    let results = db.students;

    // Si on a un paramètre 'search' global ou si 'nom' est utilisé comme recherche globale
    if (search || nom) {
        const q = (search || nom).toLowerCase();
        results = results.filter(s =>
            s.nom.toLowerCase().includes(q) ||
            s.prenom.toLowerCase().includes(q)
        );
    }

    if (prenom && !search && prenom !== nom) {
        const q = prenom.toLowerCase();
        results = results.filter(s => s.prenom.toLowerCase().includes(q));
    }

    if (classe) {
        const q = classe.toLowerCase();
        results = results.filter(s => s.classe.toLowerCase().includes(q));
    }

    // Trier par nom croissant et limiter à 100
    results = results.sort((a, b) => a.nom.localeCompare(b.nom)).slice(0, 100);

    return res.json({ students: results, total: results.length });
}

// ── Link Student to Parent ────────────────────────────────────
function linkStudentToParent(req, res) {
    const db = getDb();
    const parentId = req.parentId;
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({ error: "studentId est requis." });
    }

    const student = db.students.find(s => s.id === studentId);
    if (!student) {
        return res.status(404).json({ error: "Élève introuvable." });
    }

    // Vérifie si la relation existe déjà
    const existing = db.parent_student.find(
        link => link.parent_id === parentId && link.student_id === studentId
    );
    if (existing) {
        return res.status(409).json({ error: "Cet élève est déjà lié à votre compte." });
    }

    db.parent_student.push({ parent_id: parentId, student_id: studentId });
    _autoAssignBadges(db, parentId, studentId);

    saveDb();

    return res.status(201).json({
        message: `${student.prenom} ${student.nom} a été ajouté à votre compte.`,
        student: { id: student.id, nom: student.nom, prenom: student.prenom },
    });
}

function _autoAssignBadges(db, parentId, studentId) {
    const student = db.students.find(s => s.id === studentId);
    if (!student) return;

    const now = new Date().toISOString();

    const addBadge = (code, label, description, icon) => {
        const exists = db.badges.find(
            b => b.parent_id === parentId && b.student_id === studentId && b.code === code
        );
        if (!exists) {
            db.badges.push({
                id: Date.now() + Math.random(),
                parent_id: parentId,
                student_id: studentId,
                code,
                label,
                description,
                icon,
                earned_at: now
            });
        }
    };

    addBadge('welcome', 'Parent Responsable', 'Compte créé et enfant enregistré', '⭐');

    if (student.status === 'Soldé') {
        addBadge('fully_paid', 'Paiement Complet', 'Scolarité entièrement réglée', '🏆');
    }

    const ratio = student.ecolage > 0 ? student.deja_paye / student.ecolage : 0;
    if (ratio >= 0.5 && student.status !== 'Soldé') {
        addBadge('half_paid', '2ème Tranche Validée', 'Plus de 50% de la scolarité payée', '🥈');
    }
}

module.exports = { listStudents, linkStudentToParent };
