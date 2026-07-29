import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/personnel`;

export const personnelApi = {
    getPersonnel: async () => {
        const res = await fetch(API_URL, {
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    createPersonnel: async (personnelData: any) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(personnelData)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    updatePersonnel: async (id: string, updates: Record<string, any>) => {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    getMyProfile: async () => {
        const res = await fetch(`${API_URL}/me`, {
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    getTeachingMode: async (): Promise<{ mode: 'individual' | 'shared'; applicable: boolean }> => {
        const res = await fetch(`${API_URL}/me/teaching-mode`, {
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    deletePersonnel: async (id: string) => {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    }
};
