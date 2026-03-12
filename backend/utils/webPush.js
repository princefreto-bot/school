const webpush = require('web-push');
const { supabase } = require('./supabase');
require('dotenv').config();

// Configuration de web-push avec les clés VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@princefreto.education';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_EMAIL,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push configuré avec succès');
} else {
    console.warn('⚠️ Web Push non configuré: VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant.');
}


/**
 * Envoie une notification push à un utilisateur donné
 * @param {string} userId - ID du parent
 * @param {string} title - Titre de la notification
 * @param {string} body - Contenu de la notification
 */
async function sendPushNotification(userId, title, body) {
    try {
        console.log(`🔍 Recherche du push_token pour l'utilisateur ${userId}`);
        
        // Récupérer le token Web Push de l'utilisateur
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', userId)
            .single();
            
        if (error) {
            console.error('❌ Erreur lors de la récupération du token:', error.message);
            return;
        }
        
        if (!profile || !profile.push_token) {
            console.log(`⚠️ Aucun push_token trouvé pour l'utilisateur ${userId}`);
            return;
        }

        let subscription;
        const pushTokenStr = profile.push_token;

        // Tenter de parser le push_token (s'il s'agit d'une chaîne JSON de subscription Web Push)
        try {
            subscription = typeof pushTokenStr === 'string' 
                ? JSON.parse(pushTokenStr) 
                : pushTokenStr;
                
            // Vérification basique d'une subscription web-push
            if (!subscription || !subscription.endpoint) {
                console.log(`ℹ️ Le push_token pour l'utilisateur ${userId} ne ressemble pas à une subscription Web Push. Il s'agit peut-être d'un token Capacitor/FCM.`);
                return;
            }
        } catch (e) {
            console.log(`ℹ️ Le push_token pour l'utilisateur ${userId} n'est pas un JSON valide. Ce n'est pas une subscription Web Push.`);
            return;
        }

        console.log(`🚀 Envoi de la notification Web Push à ${userId}`);
        
        const payload = JSON.stringify({
            title: title || 'Nouvelle notification',
            body: body || 'Vous avez un nouveau message.',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
        });

        // Envoi via web-push
        await webpush.sendNotification(subscription, payload);
        console.log(`✅ Notification Web Push envoyée avec succès à l'utilisateur ${userId}`);
        
    } catch (err) {
        console.error(`❌ Erreur lors de l'envoi Web Push à ${userId}:`, err.message);
        
        // Si le token a expiré ou n'est plus valide (404 / 410)
        if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`🗑️ Suppression du push_token expiré pour l'utilisateur ${userId}`);
            await supabase
                .from('profiles')
                .update({ push_token: null })
                .eq('id', userId);
        }
    }
}

module.exports = { sendPushNotification };
