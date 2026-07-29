import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/staff-absences`;

export const staffAbsencesApi = {
    getAll: async (personnelId?: string) => {
        const url = personnelId ? `${API_URL}?personnelId=${personnelId}` : API_URL;
        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    getMine: async () => {
        const res = await fetch(`${API_URL}/mine`, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    create: async (payload: { personnelId: string; date: string; type: string; heuresManquees?: number | null; motif?: string }) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    remove: async (id: string) => {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    }
};
