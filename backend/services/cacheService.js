// ============================================================
// SERVICE DE CACHE — Redis avec Fallback Mémoire Capped
// ============================================================
'use strict';

const { createClient } = require('redis');

// Limite stricte pour le cache en mémoire afin d'éviter les fuites de mémoire (OOM) en production
const MAX_MEMORY_ITEMS = 1000;
const cache = new Map();

let redisClient = null;
let useRedis = false;

// Initialisation asynchrone du client Redis
if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        keepAlive: 5000,         // Maintient la connexion active
        connectTimeout: 10000,    // Timeout de connexion (10s)
        reconnectStrategy: (retries) => {
          // Reconnexion avec backoff exponentiel plafonné à 3 secondes
          const delay = Math.min(retries * 150, 3000);
          // Limiter les logs de reconnexion pour ne pas inonder la production
          if (retries <= 3 || retries % 50 === 0) {
            console.warn(`⚠️ [Redis] Connexion perdue. Tentative de reconnexion #${retries} dans ${delay}ms...`);
          }
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      // Limiter l'affichage des erreurs de connexion répétées
      if (redisClient.errorSpamCount === undefined) redisClient.errorSpamCount = 0;
      redisClient.errorSpamCount++;
      if (redisClient.errorSpamCount <= 3 || redisClient.errorSpamCount % 50 === 0) {
        console.warn(`⚠️ [Redis] Erreur client: ${err.message} (Occurrences: ${redisClient.errorSpamCount})`);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ [Redis] Connexion établie');
    });

    redisClient.on('ready', () => {
      console.log('🚀 [Redis] Client prêt à l\'utilisation');
      useRedis = true;
      redisClient.errorSpamCount = 0; // Réinitialiser le compteur d'erreurs
    });

    redisClient.on('end', () => {
      console.warn('⚠️ [Redis] Connexion fermée. Basculement sur le cache en mémoire (limité).');
      useRedis = false;
    });

    // Connexion asynchrone pour ne pas bloquer le démarrage de l'API
    redisClient.connect().catch((err) => {
      console.error('❌ [Redis] Impossible de se connecter au démarrage:', err.message);
      useRedis = false;
    });
  } catch (err) {
    console.error('❌ [Redis] Erreur lors de l\'initialisation du client:', err.message);
    useRedis = false;
  }
} else {
  console.log('ℹ️ [Redis] REDIS_URL non configuré. Utilisation du cache en mémoire.');
}

/**
 * Définit une valeur dans le cache mémoire de secours (avec éviction FIFO si plein)
 */
const setMemoryCache = (key, value, ttl) => {
  if (cache.size >= MAX_MEMORY_ITEMS) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
  cache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000
  });
};

/**
 * Récupère une valeur du cache
 * @param {string} key
 * @returns {Promise<any>}
 */
const getCache = async (key) => {
  if (useRedis && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`[Cache] Erreur lecture Redis pour la clé "${key}":`, err.message);
    }
  }

  // Repli Cache mémoire
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

/**
 * Définit une valeur dans le cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Durée de vie en secondes (par défaut: 3600 = 1h)
 */
const setCache = async (key, value, ttl = 3600) => {
  if (useRedis && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return;
    } catch (err) {
      console.error(`[Cache] Erreur écriture Redis pour la clé "${key}":`, err.message);
    }
  }

  // Repli Cache mémoire
  setMemoryCache(key, value, ttl);
};

/**
 * Supprime une valeur du cache
 * @param {string} key
 */
const deleteCache = async (key) => {
  if (useRedis && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.error(`[Cache] Erreur suppression Redis pour la clé "${key}":`, err.message);
    }
  }

  // Repli Cache mémoire
  cache.delete(key);
};

/**
 * Invalide toutes les clés correspondant à un motif
 * @param {string} pattern - Ex: 'school_stats:*'
 */
const invalidateCachePattern = async (pattern) => {
  if (useRedis && redisClient) {
    try {
      let keysToDelete = [];
      // Utilisation de scanIterator (non bloquant en production)
      for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 200 })) {
        keysToDelete.push(key);
        // Supprime par lot de 100 via pipeline (multi) pour optimiser les performances réseau
        if (keysToDelete.length >= 100) {
          const pipeline = redisClient.multi();
          keysToDelete.forEach(k => pipeline.del(k));
          await pipeline.exec();
          keysToDelete = [];
        }
      }
      
      // Supprimer le reste si nécessaire
      if (keysToDelete.length > 0) {
        const pipeline = redisClient.multi();
        keysToDelete.forEach(k => pipeline.del(k));
        await pipeline.exec();
      }
      return;
    } catch (err) {
      console.error(`[Cache] Erreur invalidation pattern Redis "${pattern}":`, err.message);
    }
  }

  // Repli Cache mémoire
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  redis: redisClient,
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern
};
