// ============================================================
// CONTRÔLEUR — Dashboard & Données Parent (Version JSON)
// ============================================================
const path = require('path');
const fs = require('fs');
const { getDb } = require('../models/db');

// ── GET /api/parent/dashboard ─────────────────────────────────
function getDashboard(req, res) {
    const db = getDb();
    const parentId = req.parentId;

    // Récupérer les ids des élèves liés
    const studentIds = db.parent_student
        .filter(link => link.parent_id === parentId)
        .map(link => link.student_id);

    // Récupérer les élèves correspondants
    const students = db.students
        .filter(s => studentIds.includes(s.id))
        .sort((a, b) => a.nom.localeCompare(b.nom));

    if (students.length === 0) {
        return res.json({
            message: 'Aucun enfant lié à ce compte.',
            students: [],
        });
    }

    return res.json({ students });
}

// ── GET /api/parent/payments/:studentId ───────────────────────
function getPayments(req, res) {
    const db = getDb();
    const parentId = req.parentId;
    const { studentId } = req.params;

    const isLinked = db.parent_student.some(
        link => link.parent_id === parentId && link.student_id === studentId
    );
    if (!isLinked) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    const payments = db.payments
        .filter(p => p.student_id === studentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const student = db.students.find(s => s.id === studentId);

    return res.json({ student, payments });
}

// ── GET /api/parent/receipt/:receiptId ───────────────────────
function downloadReceipt(req, res) {
    const db = getDb();
    const parentId = req.parentId;
    const { receiptId } = req.params;

    const payment = db.payments.find(p => p.recu === receiptId);
    if (!payment) {
        return res.status(404).json({ error: 'Reçu introuvable.' });
    }

    const isLinked = db.parent_student.some(
        link => link.parent_id === parentId && link.student_id === payment.student_id
    );
    if (!isLinked) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Chercher fichier physique
    const receiptsDir = path.join(__dirname, '..', 'data', 'receipts');
    const filePath = path.join(receiptsDir, `${receiptId}.pdf`);

    if (!fs.existsSync(filePath)) {
        return res.json({
            message: 'Données du reçu disponibles (PDF à générer côté client).',
            receipt: {
                id: payment.id,
                receiptId: payment.recu,
                studentId: payment.student_id,
                montant: payment.montant,
                date: payment.date,
                note: payment.note,
            },
        });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-${receiptId}.pdf"`);
    return fs.createReadStream(filePath).pipe(res);
}

// ── GET /api/parent/badges ────────────────────────────────────
function getBadges(req, res) {
    const db = getDb();
    const parentId = req.parentId;

    const badges = db.badges
        .filter(b => b.parent_id === parentId)
        .map(b => {
            const student = db.students.find(s => s.id === b.student_id);
            return {
                ...b,
                student_nom: student ? student.nom : null,
                student_prenom: student ? student.prenom : null,
                classe: student ? student.classe : null,
            };
        })
        .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at));

    return res.json({ badges });
}

// ── GET /api/parent/messages ──────────────────────────────────
function getMessages(req, res) {
    const db = getDb();
    const parentId = req.parentId;

    const messages = (db.messages || [])
        .filter(m => m.parent_id === parentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({ messages });
}

module.exports = { getDashboard, getPayments, downloadReceipt, getBadges, getMessages };
