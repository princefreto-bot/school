import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/admissions`;

export const admissionApi = {
    // 1. Submit a public request
    submitRequest: async (data: any) => {
        const res = await fetch(`${API_URL}/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await parseResponse(res);
        if (!res.ok) throw result;
        return result;
    },

    // 2. List admissions (Admin)
    listRequests: async () => {
        const res = await fetch(`${API_URL}/list`, {
            headers: getAuthHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data; // { success: true, requests: [...] }
    },

    // 3. Approve or Reject a request (Admin)
    resolveRequest: async (id: string, status: 'approved' | 'rejected') => {
        const res = await fetch(`${API_URL}/resolve/${id}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    }
};
