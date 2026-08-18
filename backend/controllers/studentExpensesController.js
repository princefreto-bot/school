// ============================================================
// DÉPENSES ÉLÈVE — dépenses ponctuelles liées à un élève précis (ex:
// Maillots, Excursion), jamais une dépense de l'établissement. Piste
// distincte de l'écolage et des frais d'inscription : jamais mélangée,
// jamais comptée dans le score de priorité du module Recouvrement.
// ============================================================
const { supabase } = require('../utils/supabase');

// ── GET /api/expense-labels — catalogue de libellés réutilisables ──
async function getExpenseLabels(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data, error } = await supabase
            .from(`expense_labels_${schoolSlug}`)
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/expense-labels — { name } ──
async function createExpenseLabel(req, res) {
    const { schoolSlug } = req.user;
    const { name } = req.body;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nom du libellé requis.' });

    try {
        const { data, error } = await supabase
            .from(`expense_labels_${schoolSlug}`)
            .insert({ name: name.trim() })
            .select('*')
            .single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ error: 'Ce libellé existe déjà.' });
            throw error;
        }
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── DELETE /api/expense-labels/:id ──
// Ne supprime jamais les dépenses déjà créées avec ce libellé (label_id passe à
// NULL via ON DELETE SET NULL, mais le texte "label" reste affiché tel quel).
async function deleteExpenseLabel(req, res) {
    const { schoolSlug } = req.user;
    const { id } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { error } = await supabase
            .from(`expense_labels_${schoolSlug}`)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── GET /api/students/:studentId/expenses ──
async function getStudentExpenses(req, res) {
    const { schoolSlug } = req.user;
    const { studentId } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data, error } = await supabase
            .from(`student_expenses_${schoolSlug}`)
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/students/:studentId/expenses — { labelId?, label?, amount } ──
async function createStudentExpense(req, res) {
    const { schoolSlug, nom: userNom } = req.user;
    const { studentId } = req.params;
    const { labelId, label, amount } = req.body;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Montant invalide.' });
    if (!labelId && !(label || '').trim()) return res.status(400).json({ error: 'Libellé requis.' });

    try {
        let finalLabel = (label || '').trim();
        let finalLabelId = labelId || null;

        if (labelId) {
            const { data: labelRow, error: labelErr } = await supabase
                .from(`expense_labels_${schoolSlug}`)
                .select('id, name')
                .eq('id', labelId)
                .maybeSingle();
            if (labelErr) throw labelErr;
            if (!labelRow) return res.status(404).json({ error: 'Libellé introuvable.' });
            finalLabel = labelRow.name;
        }

        const { data: student, error: studentErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id, academic_year_id')
            .eq('id', studentId)
            .single();
        if (studentErr || !student) return res.status(404).json({ error: 'Élève introuvable.' });

        const { data, error } = await supabase
            .from(`student_expenses_${schoolSlug}`)
            .insert({
                student_id: studentId,
                label_id: finalLabelId,
                label: finalLabel,
                amount: numAmount,
                academic_year_id: student.academic_year_id,
                created_by: userNom || null,
            })
            .select('*')
            .single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── DELETE /api/students/:studentId/expenses/:expenseId ──
async function deleteStudentExpense(req, res) {
    const { schoolSlug } = req.user;
    const { studentId, expenseId } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { error } = await supabase
            .from(`student_expenses_${schoolSlug}`)
            .delete()
            .eq('id', expenseId)
            .eq('student_id', studentId);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── POST /api/students/:studentId/expenses/:expenseId/pay — { montant } ──
async function payStudentExpense(req, res) {
    const { schoolSlug } = req.user;
    const { studentId, expenseId } = req.params;
    const { montant } = req.body;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    const paymentAmount = Number(montant);
    if (!paymentAmount || paymentAmount <= 0) return res.status(400).json({ error: 'Montant invalide.' });

    try {
        const { data: expense, error: expenseErr } = await supabase
            .from(`student_expenses_${schoolSlug}`)
            .select('*')
            .eq('id', expenseId)
            .eq('student_id', studentId)
            .single();
        if (expenseErr || !expense) return res.status(404).json({ error: 'Dépense introuvable.' });

        const remaining = expense.amount - expense.amount_paid;
        if (paymentAmount > remaining) {
            return res.status(400).json({ error: `Le montant dépasse le restant (${remaining} FCFA).` });
        }

        const newAmountPaid = expense.amount_paid + paymentAmount;
        const { data, error } = await supabase
            .from(`student_expenses_${schoolSlug}`)
            .update({ amount_paid: newAmountPaid, updated_at: new Date().toISOString() })
            .eq('id', expenseId)
            .select('*')
            .single();
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getExpenseLabels,
    createExpenseLabel,
    deleteExpenseLabel,
    getStudentExpenses,
    createStudentExpense,
    deleteStudentExpense,
    payStudentExpense,
};
