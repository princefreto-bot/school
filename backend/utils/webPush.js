const webpush = require('web-push');
const { supabase } = require('./supabase');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de web-push avec les clés VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@nomade-corp.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('✅ Web Push configuré avec succès');
} else {
    console.warn('⚠️ Web Push non configuré: VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant.');
}

// Initialisation de Firebase Admin SDK pour les push natives (FCM)
let fcmReady = false;
try {
    const admin = require('firebase-admin');
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
        const serviceAccount = JSON.parse(serviceAccountVar);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        fcmReady = true;
        console.log('✅ Firebase Admin SDK initialisé (FCM actif)');
    } else if (fs.existsSync(path.join(__dirname, '..', 'serviceAccountKey.json'))) {
        const serviceAccount = require('../serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        fcmReady = true;
        console.log('✅ Firebase Admin SDK initialisé via fichier (FCM actif)');
    } else {
        // Fallback sur initialisation par défaut (ex: variables d'env Google Cloud standard)
        admin.initializeApp();
        fcmReady = true;
        console.log('✅ Firebase Admin SDK initialisé par défaut (FCM actif)');
    }
} catch (e) {
    console.warn('⚠️ Firebase Admin non initialisé, FCM natif désactivé:', e.message);
}

/**
 * Envoie une notification push enrichie à un utilisateur (Web Push ou FCM natif)
 * @param {string} userId         - ID du parent dans sa table profiles_<slug>
 * @param {string} schoolSlug     - Slug de l'école (pour chercher dans la bonne table)
 * @param {string} title          - Titre de la notification
 * @param {string} body           - Corps du message
 * @param {string} type           - Type : 'message' | 'announcement' | 'payment' | 'presence' | 'document' | 'general'
 * @param {string} url            - URL de destination optionnelle
 */
async function sendPushNotification(userId, schoolSlug, title, body, type = 'general', url = '/') {
    try {
        console.log(`🔍 [Push] Recherche du push_token pour l'utilisateur ${userId} dans profiles_${schoolSlug}`);

        // Récupérer le token Web Push depuis la table de l'école
        let { data: profile, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('push_token')
            .eq('id', userId)
            .single();

        if (error || !profile?.push_token) {
            // Fallback : essayer dans la table profiles globale
            const { data: globalProfile } = await supabase
                .from('profiles')
                .select('push_token')
                .eq('id', userId)
                .single();
            
            if (globalProfile?.push_token) {
                profile = globalProfile;
            }
        }

        if (!profile?.push_token) {
            console.log(`⚠️ [Push] Aucun push_token trouvé pour ${userId} dans profiles_${schoolSlug} ou profiles`);
            return;
        }

        // Déterminer s'il s'agit d'un Web Push ou d'un token FCM natif
        let isWebPush = false;
        let subscription;
        try {
            subscription = typeof profile.push_token === 'string'
                ? JSON.parse(profile.push_token)
                : profile.push_token;

            if (subscription && subscription.endpoint) {
                isWebPush = true;
            }
        } catch (e) {
            // Si ce n'est pas du JSON valide, c'est un token natif (string brute)
            isWebPush = false;
        }

        if (isWebPush) {
            // --- Flow Web Push (PWA) ---
            if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
                console.warn('⚠️ Web Push : clés VAPID non configurées. Notification ignorée.');
                return;
            }
            const payload = JSON.stringify({ title, body, type, url, icon: '/icon-192x192.png', badge: '/icon-192x192.png' });
            console.log(`🚀 [Push] Envoi notification Web Push type="${type}" à ${userId}`);
            await webpush.sendNotification(subscription, payload);
            console.log(`✅ [Push] Notification Web Push envoyée avec succès à ${userId}`);
        } else {
            // --- Flow FCM Natif (Android / Play Store) ---
            const token = profile.push_token; // Le token est une string brute
            console.log(`🚀 [Push] Envoi notification FCM Native type="${type}" à ${userId}`);

            if (!fcmReady) {
                console.warn('⚠️ [Push] Impossible d\'envoyer le push FCM : Firebase Admin non configuré.');
                return;
            }

            const message = {
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    type: type,
                    url: url
                },
                token: token
            };

            const admin = require('firebase-admin');
            const response = await admin.messaging().send(message);
            console.log(`✅ [Push] Notification FCM envoyée avec succès :`, response);
        }

    } catch (err) {
        console.error(`❌ [Push] Erreur d'envoi pour ${userId}:`, err.message);

        // Si le token est expiré ou invalide, on le supprime de la base
        const isExpired = err.statusCode === 404 || err.statusCode === 410 || 
                          (err.code && (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-argument'));

        if (isExpired) {
            console.log(`🗑️ [Push] Token expiré ou invalide pour ${userId}, suppression...`);
            if (schoolSlug) {
                await supabase.from(`profiles_${schoolSlug}`).update({ push_token: null }).eq('id', userId);
            } else {
                await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
            }
        }
    }
}

/**
 * Envoie une notification push à TOUS les parents d'une école
 * @param {string} schoolSlug
 * @param {string} title
 * @param {string} body  
 * @param {string} type
 */
async function broadcastPushToSchool(schoolSlug, title, body, type = 'announcement') {
    try {
        const { data: parents, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, push_token')
            .eq('role', 'parent')
            .not('push_token', 'is', null);

        if (error || !parents?.length) {
            console.log(`ℹ️ [Push Broadcast] Aucun parent avec token pour ${schoolSlug}`);
            return 0;
        }

        let sent = 0;
        for (const parent of parents) {
            if (parent.push_token) {
                await sendPushNotification(parent.id, schoolSlug, title, body, type);
                sent++;
            }
        }
        console.log(`📢 [Push Broadcast] ${sent} notifications envoyées pour l'école ${schoolSlug}`);
        return sent;
    } catch (err) {
        console.error(`❌ [Push Broadcast] Erreur:`, err.message);
        return 0;
    }
}

module.exports = { sendPushNotification, broadcastPushToSchool };
