/**
 * Service pour gérer l'abonnement aux notifications Web Push
 * et la navigation depuis les clics de notification
 */

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) throw new Error('La clé VAPID publique est vide ou non définie.');
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Naviguer vers la bonne page selon le type de notification */
function navigateFromPush(notifType: string) {
  try {
    const { useStore } = require('../store/useStore') as any;
    const store = useStore.getState();
    const user = store.user;
    if (!user || user.role !== 'parent') return;

    const mapped: Record<string, string> = {
      message:      'chat',
      announcement: 'annonces',
      payment:      'parent_historique',
      presence:     'parent_dashboard',
      general:      'parent_dashboard',
    };
    const page = mapped[notifType] || 'parent_dashboard';
    store.setCurrentPage(page as any);

    // Forcer un refresh des données pour mettre à jour l'interface
    store.fetchAllFromBackend?.();
  } catch (e) {
    console.warn('[PushNav] Impossible de naviguer:', e);
  }
}

export const webPushService = {
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push non supporté par ce navigateur.');
      return;
    }

    try {
      // 1. Enregistrement du Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ [SW] Enregistré.');

      // 2. Écouter les messages du SW (navigation après clic sur notification)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_NAVIGATE') {
          const notifType: string = event.data.notifType || 'general';
          console.log('[SW→App] Navigation vers:', notifType);
          navigateFromPush(notifType);
        }
      });

      // 3. Demande de permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Permission refusée par l\'utilisateur.');
        return;
      }

      // 4. Abonnement (Subscribe)
      if (!PUBLIC_VAPID_KEY) {
        console.warn('⚠️ [Push] VITE_VAPID_PUBLIC_KEY manquante, abonnement impossible.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      console.log('✅ [Push] Abonnement réussi.');

      // 5. Sauvegarder la subscription sur le backend
      await this.saveSubscription(subscription);

    } catch (error) {
      console.error('❌ [Push] Erreur init:', error);
    }
  },

  async saveSubscription(subscription: PushSubscription) {
    try {
      const { API_BASE_URL } = await import('../config');
      const { getAuthHeaders } = await import('./apiHelpers');
      const response = await fetch(`${API_BASE_URL}/auth/update-push-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ push_token: JSON.stringify(subscription) })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('❌ [Push] Erreur sauvegarde token:', err.error || response.status);
        return;
      }
      console.log('✅ [Push] Token sauvegardé sur le serveur.');
    } catch (error) {
      console.error('❌ [Push] Erreur réseau sauvegarde token:', error);
    }
  }
};
