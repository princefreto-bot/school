// ============================================================
// DÉPENSES ÉLÈVE — catalogue de libellés réutilisables + dépenses
// ponctuelles liées à un élève précis (ex: Maillots, Excursion).
// ============================================================
import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';
import { ExpenseLabel, StudentExpense } from '../types';

const mapLabel = (r: any): ExpenseLabel => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
});

const mapExpense = (r: any): StudentExpense => ({
    id: r.id,
    studentId: r.student_id,
    labelId: r.label_id,
    label: r.label,
    amount: Number(r.amount),
    amountPaid: Number(r.amount_paid),
    academicYearId: r.academic_year_id,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
});

export const expensesApi = {
    getLabels: async (): Promise<ExpenseLabel[]> => {
        const res = await fetch(`${API_BASE_URL}/expense-labels`, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return (data || []).map(mapLabel);
    },

    createLabel: async (name: string): Promise<ExpenseLabel> => {
        const res = await fetch(`${API_BASE_URL}/expense-labels`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name }),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return mapLabel(data);
    },

    deleteLabel: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/expense-labels/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
    },

    getStudentExpenses: async (studentId: string): Promise<StudentExpense[]> => {
        const res = await fetch(`${API_BASE_URL}/students/${studentId}/expenses`, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return (data || []).map(mapExpense);
    },

    createStudentExpense: async (studentId: string, payload: { labelId?: string; label?: string; amount: number }): Promise<StudentExpense> => {
        const res = await fetch(`${API_BASE_URL}/students/${studentId}/expenses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return mapExpense(data);
    },

    deleteStudentExpense: async (studentId: string, expenseId: string): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/students/${studentId}/expenses/${expenseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
    },

    payStudentExpense: async (studentId: string, expenseId: string, montant: number): Promise<StudentExpense> => {
        const res = await fetch(`${API_BASE_URL}/students/${studentId}/expenses/${expenseId}/pay`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ montant }),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return mapExpense(data);
    },
};
