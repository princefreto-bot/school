// Cache mémoire simple pour remplacer Redis si non disponible
const cache = new Map();

/**
 * Récupère une valeur du cache
 * @param {string} key
 * @returns {Promise<any>}
 */
const getCache = async (key) => {
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
  cache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000
  });
};

/**
 * Supprime une valeur du cache
 * @param {string} key
 */
const deleteCache = async (key) => {
  cache.delete(key);
};

/**
 * Invalide toutes les clés correspondant à un motif
 * @param {string} pattern - Ex: 'school_stats:*'
 */
const invalidateCachePattern = async (pattern) => {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  redis: null,
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern
};
