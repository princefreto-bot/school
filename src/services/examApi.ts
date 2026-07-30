import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/exam`;

export interface ExamSession {
    id: string;
    nom: string;
    academic_year_id: string | null;
    created_by: string | null;
    created_at: string;
}

export interface ExamNote {
    id: string;
    eleve_id: string;
    matiere_id: string;
    exam_session_id: string;
    note: number | null;
    updated_at: string;
}

export const examApi = {
    getSessions: async (): Promise<ExamSession[]> => {
        const res = await fetch(`${API_URL}/sessions`, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    createSession: async (nom: string, academicYearId?: string | null): Promise<ExamSession> => {
        const res = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ nom, academicYearId })
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    deleteSession: async (id: string) => {
        const res = await fetch(`${API_URL}/sessions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    getNotes: async (classe: string, sessionId: string): Promise<ExamNote[]> => {
        const res = await fetch(`${API_URL}/notes?classe=${encodeURIComponent(classe)}&sessionId=${encodeURIComponent(sessionId)}`, {
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    saveNotes: async (sessionId: string, entries: { eleveId: string; matiereId: string; note: number | null }[]): Promise<ExamNote[]> => {
        const res = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ sessionId, entries })
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    }
};
