const Redis = require('ioredis');

// URL Redis configurée dans .env (ex: rediss://user:password@host:port)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redis.on('error', (err) => {
    console.error('Erreur Redis:', err.message);
  });

  redis.on('connect', () => {
    console.log('Connecté à Redis');
  });
} catch (error) {
  console.error('Erreur initialisation Redis:', error);
}

/**
 * Récupère une valeur du cache
 * @param {string} key
 * @returns {Promise<any>}
 */
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Erreur getCache (${key}):`, error);
    return null;
  }
};

/**
 * Définit une valeur dans le cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Durée de vie en secondes (par défaut: 3600 = 1h)
 */
const setCache = async (key, value, ttl = 3600) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    console.error(`Erreur setCache (${key}):`, error);
  }
};

/**
 * Supprime une valeur du cache
 * @param {string} key
 */
const deleteCache = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Erreur deleteCache (${key}):`, error);
  }
};

/**
 * Invalide toutes les clés correspondant à un motif
 * @param {string} pattern - Ex: 'school_stats:*'
 */
const invalidateCachePattern = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Erreur invalidateCachePattern (${pattern}):`, error);
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern
};
