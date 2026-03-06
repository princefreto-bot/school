import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

/**
 * Gère les en-têtes avec le token JWT si présent
 */
const getHeaders = () => {
    const token = localStorage.getItem('parent_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const parentApi = {
    // ── Authentification ────────────────────────────────────────
    register: async (data: any) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        const result = await res.json();
        if (result.token) localStorage.setItem('parent_token', result.token);
        return result;
    },

    login: async (data: any) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        const result = await res.json();
        if (result.token) localStorage.setItem('parent_token', result.token);
        return result;
    },

    // ── Recherche d'élèves ───────────────────────────────────────
    searchStudents: async (params: { nom?: string, prenom?: string, classe?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        const res = await fetch(`${API_URL}/students?${query}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // ── Liaison Parent-Enfant ────────────────────────────────────
    linkStudent: async (studentId: string) => {
        const res = await fetch(`${API_URL}/students/link`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    linkStudents: async (studentIds: string[]) => {
        const res = await fetch(`${API_URL}/students/link`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentIds })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    unlinkStudent: async (studentId: string) => {
        const res = await fetch(`${API_URL}/students/unlink/${studentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // ── Données du Dashboard ─────────────────────────────────────
    getDashboard: async () => {
        const res = await fetch(`${API_URL}/parent/dashboard`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // ── Historique des paiements ───────────────────────────────
    getPayments: async (studentId: string) => {
        const res = await fetch(`${API_URL}/parent/payments/${studentId}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // ── Badges ──────────────────────────────────────────────────
    getBadges: async () => {
        const res = await fetch(`${API_URL}/parent/badges`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // ── Messages ────────────────────────────────────────────────
    getMessages: async () => {
        const res = await fetch(`${API_URL}/parent/messages`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    getActiveCount: async () => {
        const res = await fetch(`${API_URL}/parent/active-count`, {
            headers: getHeaders()
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    logout: () => {
        localStorage.removeItem('parent_token');
    }
};
