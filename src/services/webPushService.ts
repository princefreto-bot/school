/**
 * Service pour gérer l'abonnement aux notifications Web Push
 */

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convertit une clé VAPID base64 en Uint8Array pour le navigateur
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const webPushService = {
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push non supporté par ce navigateur.');
      return;
    }

    try {
      // 1. Enregistrement du Service Worker
      console.log('🔄 Enregistrement du Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré.');

      // 2. Demande de permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission de notification refusée.');
        return;
      }

      // 3. Abonnement (Subscribe)
      console.log('🔄 Abonnement aux notifications push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      console.log('✅ Abonnement réussi:', subscription);

      // 4. Envoi de la subscription au backend
      await this.saveSubscription(subscription);

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation Web Push:', error);
    }
  },

  async saveSubscription(subscription: PushSubscription) {
    try {
      const { API_BASE_URL } = await import('../config');
      const { getAuthHeaders, parseResponse } = await import('./apiHelpers');
      const response = await fetch(`${API_BASE_URL}/auth/update-push-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          push_token: JSON.stringify(subscription)
        })
      });

      if (!response.ok) {
        const errorData = await parseResponse(response);
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde du token sur le serveur');
      }

      console.log('✅ Subscription sauvegardée sur le serveur.');
    } catch (error) {
      console.error('❌ Erreur sauvegarde subscription:', error);
    }
  }
};
