// ============================================================
// CONFIGURATION — classeur-backend
// ============================================================
import 'dotenv/config';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variable d'environnement manquante : ${name}`);
    }
    return value;
}

// Render définit automatiquement RENDER=true sur tout service déployé — utilisé comme filet
// de sécurité si NODE_ENV a été oublié/mal configuré au déploiement (incident déjà vécu côté
// backend principal, cf. mémoire "Deployment gotchas"). Sans ce filet, un NODE_ENV manquant
// désactive silencieusement HSTS et bascule le CORS en "autoriser toute origine".
const detectedNodeEnv = process.env.NODE_ENV || (process.env.RENDER === 'true' ? 'production' : 'development');

export const config = {
    PORT: Number(process.env.PORT) || 4001,
    NODE_ENV: detectedNodeEnv,

    // Ce service émet ses propres tokens, indépendants du JWT_SECRET de dghubschool.com.
    // Doit échouer au démarrage si absent : un secret vide signerait/vérifierait les JWT
    // avec HS256 sur '' , ce qui permettrait de forger un token opérateur valide.
    CLASSEUR_JWT_SECRET: requireEnv('CLASSEUR_JWT_SECRET'),
    CLASSEUR_JWT_EXPIRES: '7d',

    // Secret partagé côté serveur uniquement pour l'échange du code de handoff SSO
    // avec le backend principal — jamais exposé au frontend, ni de l'un ni de l'autre.
    CLASSEUR_INTERNAL_SECRET: process.env.CLASSEUR_INTERNAL_SECRET || '',

    // URL du backend principal (dghubschool.com), utilisée uniquement pour l'appel
    // serveur-à-serveur de redemption du code SSO.
    MAIN_BACKEND_URL: process.env.MAIN_BACKEND_URL || 'https://dghubschool.com',

    // URL du frontend du classeur, utilisée pour la redirection post-handoff.
    CLASSEUR_FRONTEND_URL: process.env.CLASSEUR_FRONTEND_URL || 'https://data.dghubschool.com',

    ALLOWED_ORIGINS: process.env.CLASSEUR_ALLOWED_ORIGINS
        ? process.env.CLASSEUR_ALLOWED_ORIGINS.split(',')
        : ['https://data.dghubschool.com', 'http://localhost:5174'],

    // Même projet Supabase que DGhubschool (voir plan) : lecture des tables school-scoped
    // + lecture/écriture exclusive sur le schéma `classeur`.
    SUPABASE_URL: () => requireEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
};
