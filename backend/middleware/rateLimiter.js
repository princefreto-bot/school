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

// Limiteur dédié à la création de session de paiement (licence parent) : un token parent
// compromis ne doit pas pouvoir spammer la création de sessions SasPay au rythme du
// limiteur global générique (20 requêtes / 10 minutes, largement suffisant en usage normal).
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de tentatives de paiement, veuillez réessayer plus tard.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  paymentLimiter
};
