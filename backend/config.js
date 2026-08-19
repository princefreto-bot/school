// ============================================================
// CONFIGURATION GLOBALE DU BACKEND
// ============================================================

// JWT_SECRET doit échouer au démarrage s'il est absent : un fallback en dur dans le code
// signifierait que n'importe qui peut forger un token (y compris superadmin) dès que la
// variable d'environnement n'est pas définie sur un déploiement (cf. audit sécurité 2026-08-19).
if (!process.env.JWT_SECRET) {
    console.error('❌ ERREUR: JWT_SECRET manquant dans les variables d\'environnement.');
    process.exit(1);
}

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES: '7d',
    // Secret partagé côté serveur uniquement, utilisé pour l'échange du code de handoff SSO
    // avec le service séparé classeur-backend (data.dghubschool.com). Jamais exposé au frontend.
    CLASSEUR_INTERNAL_SECRET: process.env.CLASSEUR_INTERNAL_SECRET || null,
};
