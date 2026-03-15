// ============================================================
// UTILITAIRE — Synchronisation Frontend → Backend
// À appeler depuis le frontend React/Zustand
// ============================================================

import { BACKEND_URL } from '../config';
import { getAuthHeaders } from './apiHelpers';

import { AppState } from '../store/useStore';

/**
 * Synchronise les données du store Zustand vers le backend Supabase.
 * Appeler cette fonction depuis l'application React.
 *
 * @param {AppState} store - L'état complet du store Zustand
 * @param {boolean} replace - Si vrai, vide la base avant d'insérer
 * @returns {Promise<any>} - Résultat de la sync
 */
export async function syncToBackend(store: Partial<AppState>, replace: boolean = false) {
    const { students = [], parents = [], presences = [], activityLogs = [], appName, schoolName, schoolYear, messageRemerciement, messageRappel, schoolLogo, cycleSchedules, announcements = [], announcementReads = [] } = store;
    
    const appSettings = (appName || schoolName || schoolLogo) ? {
        appName,
        schoolName,
        schoolYear,
        messageRemerciement,
        messageRappel,
        schoolLogo,
        cycleSchedules
    } : null;

    try {
        const response = await fetch(`${BACKEND_URL}/api/sync`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ students, parents, presences, activityLogs, appSettings, announcements, announcementReads, replace }),
        });

        // read text first so we can fall back if it's not JSON
        const text = await response.text();

        // If response is empty, server is likely down
        if (!text) {
            console.warn('⚠️ Sync: empty response from backend');
            return null;
        }

        let result: any;
        try {
            result = JSON.parse(text);
        } catch (parseErr) {
            // Response is not JSON (HTML error page, nginx error, etc)
            const preview = text.substring(0, 150).replace(/\n/g, ' ');
            console.warn('⚠️ Sync: non-JSON response:', `[${response.status}]`, preview);
            return null;
        }

        if (!response.ok) {
            const errorMsg = result?.error || result?.message || 'Unknown sync error';
            console.warn('⚠️ Sync failed:', `[${response.status}]`, errorMsg);
            return null;
        }

        if (appSettings) {
            console.log('✅ Settings Sync: SUCCESS');
        } else {
            console.log('✅ Data Sync successful:', result.count || 0, 'students synced');
        }
        return result;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn('⚠️ Sync fetch error:', errorMessage);
        return null;
    }
}

/**
 * Récupère toutes les données depuis le backend Supabase (Single Source of Truth).
 */
export async function fetchFromBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/sync`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            console.warn('⚠️ Fetch from backend failed:', response.status);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('⚠️ Fetch from backend error:', err);
        return null;
    }
}

/**
 * Vérifie que le backend est disponible.
 * @returns {Promise<boolean>}
 */
export async function isBackendAvailable() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
        return response.ok;
    } catch {
        return false;
    }
}
