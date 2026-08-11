// ============================================================
// CONFIGURATION GLOBALE DU BACKEND
// ============================================================

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'dghubschool_secret_jwt_2026',
    JWT_EXPIRES: '7d',
    // Secret partagé côté serveur uniquement, utilisé pour l'échange du code de handoff SSO
    // avec le service séparé classeur-backend (data.dghubschool.com). Jamais exposé au frontend.
    CLASSEUR_INTERNAL_SECRET: process.env.CLASSEUR_INTERNAL_SECRET || null,
};
