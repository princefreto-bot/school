// ============================================================
// SERVEUR — Classeur Intelligent de Personnes (data.dghubschool.com)
// Service Render séparé du backend principal DGhubschool, volontairement.
// L'OCR/parsing PDF est un travail lourd qui ne doit jamais risquer de ralentir
// ou faire timeout le backend qui sert les écoles clientes payantes.
// ============================================================
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import ssoRoutes from './routes/sso';

const app = express();
app.set('trust proxy', 1);

// Redirection HTTP -> HTTPS en production (sauf health check)
if (config.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (!req.secure && req.path !== '/api/health') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// En-têtes de sécurité + CSP propre à ce service (jamais une modification de celle du backend principal)
app.use((req, res, next) => {
    if (config.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Application privée : jamais indexée, quelle que soit la page servie.
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${supabaseUrl}`,
        `connect-src 'self' ${supabaseUrl}`,
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    next();
});

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || config.NODE_ENV !== 'production') return callback(null, true);
            callback(null, config.ALLOWED_ORIGINS.includes(origin));
        },
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' }));

const globalLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 500 });
app.use('/api', globalLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/sso', ssoRoutes);

// TODO (M1+) : routes /api/persons, /api/matches, /api/to-classify, /api/duplicates,
// /api/relations, /api/documents, /api/locations, /api/sources, /api/history,
// /api/dashboard, /api/settings — protégées par authenticateOperator.

// Sert le build statique du frontend du classeur (même pattern que backend/server.js)
const frontendDist = path.join(__dirname, '..', '..', 'classeur-frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(config.PORT, () => {
    console.log(`Classeur backend démarré sur le port ${config.PORT}`);
});
