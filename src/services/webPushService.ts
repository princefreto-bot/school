/**
 * Service pour gérer l'abonnement aux notifications Web Push (PWA)
 * et les notifications natives (FCM Capacitor) sur Android / iOS.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from './apiHelpers';
import { useStore } from '../store/useStore';

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

export const webPushService = {
  async init() {
    // ── Détection plateforme native (Capacitor) ──
    if (Capacitor.isNativePlatform()) {
      console.log('📱 [Push] Plateforme native détectée : activation du module Capacitor Push.');
      await this.registerCapacitorPush();
      return;
    }

    // ── Détection plateforme Web (PWA Web Push) ──
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push non supporté par ce navigateur.');
      return;
    }

    try {
      // 1. Enregistrement du Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ [SW] Enregistré.');

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

      console.log('✅ [Push] Abonnement Web Push réussi:', subscription.endpoint);

      // 5. Sauvegarder la subscription sur le backend
      await this.saveSubscription(subscription);

    } catch (error) {
      console.error('❌ [Push] Erreur init:', error);
    }
  },

  async saveSubscription(subscription: PushSubscription) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-push-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ push_token: JSON.stringify(subscription) })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('❌ [Push] Erreur sauvegarde token Web:', err.error || response.status);
        return;
      }
      console.log('✅ [Push] Token Web Push sauvegardé sur le serveur.');
    } catch (error) {
      console.error('❌ [Push] Erreur réseau sauvegarde token Web:', error);
    }
  },

  // ── Flow Capacitor Push Natif (Android / Play Store) ──
  async registerCapacitorPush() {
    try {
      // 1. Vérifier et demander la permission
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ [Capacitor Push] Permission refusée par l\'utilisateur.');
        return;
      }

      // 2. Enregistrer l'appareil pour obtenir le token
      await PushNotifications.register();

      // 3. Écouter l'enregistrement du token (FCM)
      PushNotifications.addListener('registration', async (token) => {
        console.log('✅ [Capacitor Push] Token FCM généré :', token.value);
        await this.saveCapacitorToken(token.value);
      });

      // Écouter les erreurs d'enregistrement
      PushNotifications.addListener('registrationError', (err) => {
        console.error('❌ [Capacitor Push] Erreur enregistrement token:', err.error);
      });

      // Écouter la réception de push en premier plan
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('🔔 [Capacitor Push] Notification reçue en premier plan:', notification);
      });

      // Écouter les clics sur la notification
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 [Capacitor Push] Clic sur notification:', action);
        const data = action.notification.data;
        if (data && data.url) {
          // Navigation
          const store = useStore.getState();
          if (store.user && store.user.role === 'parent') {
            const pageMap: Record<string, string> = {
              message:      'chat',
              announcement: 'annonces',
              payment:      'parent_historique',
              presence:     'parent_dashboard',
              document:     'parent_dashboard',
              general:      'parent_dashboard',
            };
            const targetPage = pageMap[data.type] || 'parent_dashboard';
            store.setCurrentPage(targetPage as any);
            store.fetchAllFromBackend();
          }
        }
      });

    } catch (err) {
      console.error('❌ [Capacitor Push] Erreur globale du module:', err);
    }
  },

  async saveCapacitorToken(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-push-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ push_token: token })
      });

      if (!response.ok) {
        console.error('❌ [Capacitor Push] Erreur sauvegarde token FCM:', response.status);
        return;
      }
      console.log('✅ [Capacitor Push] Token FCM sauvegardé sur le serveur.');
    } catch (error) {
      console.error('❌ [Capacitor Push] Erreur réseau sauvegarde token FCM:', error);
    }
  }
};
