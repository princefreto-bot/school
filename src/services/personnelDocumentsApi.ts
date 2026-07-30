import { API_BASE_URL } from '../config';
import { parseResponse, getAuthHeaders } from './apiHelpers';

const API_URL = `${API_BASE_URL}/personnel-documents`;

export interface PersonnelDocument {
    id: string;
    personnel_id: string;
    document_type: string;
    title: string;
    file_url: string;
    created_at: string;
}

export const personnelDocumentsApi = {
    getForPersonnel: async (personnelId: string): Promise<PersonnelDocument[]> => {
        const res = await fetch(`${API_URL}/personnel/${personnelId}`, { headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    scan: async (file: File, personnelId: string, docType: string, title: string) => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('personnel_id', personnelId);
        formData.append('document_type', docType);
        formData.append('title', title);

        // Ne pas fixer Content-Type — le navigateur ajoute la frontière multipart.
        const authHeaders = getAuthHeaders() as Record<string, string>;
        const { Authorization } = authHeaders;

        const res = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: Authorization ? { Authorization } : {},
            body: formData,
        });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },

    fileUrl: (filename: string) => `${API_URL}/file/${filename}`,

    remove: async (id: string) => {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await parseResponse(res);
        if (!res.ok) throw data;
        return data;
    },
};
