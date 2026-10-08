const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Écoles suspendues (mise à jour toutes les 60 s) : une suspension coupe aussi les sessions
// déjà ouvertes, pas seulement les nouvelles connexions (jetons valables 7 jours).
const SUSPENDED_TTL_MS = 60 * 1000;
let suspendedCache = { at: 0, slugs: new Set() };
async function getSuspendedSlugs() {
    if (Date.now() - suspendedCache.at < SUSPENDED_TTL_MS) return suspendedCache.slugs;
    try {
        const { supabase } = require('../utils/supabase');
        const { data, error } = await supabase.from('schools').select('slug').eq('status', 'suspended');
        if (error) throw error;
        suspendedCache = { at: Date.now(), slugs: new Set((data || []).map((s) => s.slug)) };
    } catch {
        // Lecture impossible : on garde la dernière liste connue, sans bloquer personne.
        suspendedCache.at = Date.now();
    }
    return suspendedCache.slugs;
}

// ── Middleware d'authentification de base ──────────────────────
async function authenticateToken(req, res, next) {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token && req.method === 'GET' && /\/(personnel-)?documents\/file\//.test(req.originalUrl)) {
        // Jeton dans l'URL toléré uniquement pour ouvrir un fichier de document (anciennes
        // versions de l'app mobile) : il fuit dans l'historique et les journaux, jamais ailleurs.
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        // Un jeton à usage spécial (ex: réinitialisation de mot de passe) n'est jamais une session.
        if (payload.purpose) {
            return res.status(401).json({ error: 'Session expirée ou invalide.' });
        }
        req.user = payload; // Contient id, nom, role, schoolSlug (ou null pour superadmin/creator)
    } catch (err) {
        return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }
    if (req.user.schoolSlug && req.user.role !== 'superadmin' && !req.user.impersonating) {
        const suspended = await getSuspendedSlugs();
        if (suspended.has(req.user.schoolSlug)) {
            return res.status(403).json({ error: "L'accès à cet établissement est suspendu." });
        }
    }
    return next();
}

// ── Middleware SuperAdmin uniquement ───────────────────────────
// Protège les routes qui ne doivent être accessibles qu'au propriétaire SaaS
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Accès réservé au SuperAdmin.' });
    }
    next();
}

// ── Middleware école requise ────────────────────────────────────
// Garantit que tout utilisateur (sauf superadmin) possède un schoolSlug
function requireSchool(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié.' });
    }
    // Le SuperAdmin a des accès globaux
    if (req.user.role === 'superadmin') {
        return next();
    }
    if (!req.user.schoolSlug) {
        return res.status(403).json({
            error: 'Aucun établissement défini dans la session.'
        });
    }
    next();
}

const requireRoles = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permission refusée. Rôle insuffisant.' });
    }
    next();
};

// ── Encadrement de l'école (hors surveillant, dont le rôle se limite aux scans) ──
const requireSchoolAdmin = requireRoles(['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur']);

// ── Finances : comptabilité, paie, retraits, sauvegardes (rôles ayant ces pages) ──
const requireFinanceAdmin = requireRoles(['admin', 'directeur', 'directeur_general', 'comptable']);

// ── Direction : rentrée/promotion, opérations structurantes ──
const requireDirection = requireRoles(['admin', 'directeur', 'directeur_general']);

// ── Middleware Créateur de contenu uniquement ───────────────────
function requireCreator(req, res, next) {
    if (!req.user || req.user.role !== 'creator') {
        return res.status(403).json({ error: 'Accès réservé aux créateurs.' });
    }
    next();
}

module.exports = { authenticateToken, requireSuperAdmin, requireSchool, requireSchoolAdmin, requireFinanceAdmin, requireDirection, requireCreator, requireRoles };
