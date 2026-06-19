const rateLimit = require('express-rate-limit');

// Limiteur global pour les routes standard (2000 requêtes / 10 minutes)
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.'
  }
});

// Limiteur strict pour les routes sensibles comme le login (50 requêtes / 10 minutes)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de tentatives, veuillez réessayer plus tard.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};
