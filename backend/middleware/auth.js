const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { supabase } = require('../utils/supabase');

// ── Middleware d'authentification de base ──────────────────────
function authenticateToken(req, res, next) {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // Contient id, nom, role, schoolSlug (ou null pour superadmin/creator)

        if (payload.role === 'superadmin' || payload.role === 'creator' || !payload.schoolSlug) {
            return next();
        }

        // Vérification de la formule d'abonnement de l'établissement
        (async () => {
            try {
                const { data: school, error: sErr } = await supabase
                    .from('schools')
                    .select('student_limit, name, created_at')
                    .eq('slug', payload.schoolSlug)
                    .single();

                if (sErr || !school) {
                    return next();
                }

                const createdDate = new Date(school.created_at);
                const daysSinceCreation = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
                const isWithinGrace = daysSinceCreation <= 90;

                const limit = school.student_limit || 500;

                const { count: studentCount, error: cErr } = await supabase
                    .from(`students_${payload.schoolSlug}`)
                    .select('id', { count: 'exact', head: true });

                if (cErr) {
                    return next();
                }

                if (studentCount > limit && !isWithinGrace) {
                    return res.status(402).json({
                        error: 'subscription_limit_exceeded',
                        message: `L'accès à l'écosystème de l'établissement ${school.name} est suspendu car l'effectif actuel d'élèves enregistrés (${studentCount}) dépasse la limite de votre formule d'abonnement (${limit} élèves). Veuillez mettre à niveau votre abonnement ou contacter notre support.`
                    });
                }

                next();
            } catch (err) {
                console.error('Error in authenticateToken limit check:', err);
                next();
            }
        })();
    } catch (err) {
        return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }
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

// ── Middleware rôle école (admin / directeur / etc.) ──────────
function requireSchoolAdmin(req, res, next) {
    const schoolAdminRoles = ['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur', 'superviseur'];
    if (!req.user || !schoolAdminRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permission refusée. Rôle insuffisant.' });
    }
    next();
}

// ── Middleware Créateur de contenu uniquement ───────────────────
function requireCreator(req, res, next) {
    if (!req.user || req.user.role !== 'creator') {
        return res.status(403).json({ error: 'Accès réservé aux créateurs.' });
    }
    next();
}

module.exports = { authenticateToken, requireSuperAdmin, requireSchool, requireSchoolAdmin, requireCreator };
