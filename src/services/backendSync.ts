// ============================================================
// UTILITAIRE — Synchronisation Frontend → Backend
// À appeler depuis le frontend React/Zustand
// ============================================================

import { BACKEND_URL } from '../config';

import { AppState } from '../store/useStore';

/**
 * Synchronise les données du store Zustand vers le backend SQLite.
 * Appeler cette fonction depuis l'application React.
 *
 * @param {AppState} store - L'état complet du store Zustand
 * @returns {Promise<any>} - Résultat de la sync
 */
export async function syncToBackend(store: Partial<AppState>) {
    const { students = [], parents = [] } = store;

    try {
        const response = await fetch(`${BACKEND_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students, parents }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erreur de synchronisation');
        }

        return await response.json();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn('⚠️ Sync backend indisponible:', errorMessage);
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
