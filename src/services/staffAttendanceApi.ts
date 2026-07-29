import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/staff-attendance`;

export const staffAttendanceApi = {
    scan: async (personnelId: string, type: 'in' | 'out') => {
        const res = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ personnelId, type }),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    todayStatus: async (personnelId: string): Promise<{ hasIn: boolean; hasOut: boolean }> => {
        const res = await fetch(`${API_URL}/today-status?personnelId=${personnelId}`, {
            headers: getAuthHeaders(),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    getAll: async (personnelId?: string, date?: string) => {
        const params = new URLSearchParams();
        if (personnelId) params.set('personnelId', personnelId);
        if (date) params.set('date', date);
        const qs = params.toString();
        const res = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`, {
            headers: getAuthHeaders(),
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },
};
