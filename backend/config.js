// ============================================================
// CONFIGURATION GLOBALE DU BACKEND
// ============================================================

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'dghubschool_secret_jwt_2026',
    JWT_EXPIRES: '7d',
};
