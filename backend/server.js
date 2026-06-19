// ============================================================
// SERVEUR PRINCIPAL — DGhubSchool Backend (Version Supabase)
// ============================================================
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { supabase } = require('./utils/supabase');

const { PORT } = require('./config');

// ── Créer les dossiers nécessaires ───────────────────────────
const uploadsDir = path.join(__dirname, 'uploads', 'messages');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Application Express ───────────────────────────────────────
const app = express();

// ⚡ Render (et tout reverse proxy) transmet l'IP réelle via X-Forwarded-For.
// Sans ce paramètre, express-rate-limit lance ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// La valeur 1 signifie "faire confiance à exactement 1 proxy en amont" (le load balancer Render).
app.set('trust proxy', 1);

// Middleware globaux
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost', 'https://localhost', 'capacitor://localhost', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'https://dghubschool.com', 'https://www.dghubschool.com'];

app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    const corsOptions = { credentials: true };

    if (!origin || process.env.NODE_ENV !== 'production') {
        corsOptions.origin = true;
    } else {
        let isAllowed = allowedOrigins.includes(origin);
        if (!isAllowed) {
            try {
                const host = req.header('Host');
                const originUrl = new URL(origin);
                // Si l'hôte de l'origine correspond à l'hôte de la requête, c'est la même origine
                if (originUrl.host === host) {
                    isAllowed = true;
                }
            } catch (e) {
                isAllowed = false;
            }
        }
        corsOptions.origin = isAllowed;
    }
    callback(null, corsOptions);
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger simple des requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ── Limiteur de requêtes ───────────────────────────────────────
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

// Appliquer le limiteur global à toutes les requêtes API (hors static)
app.use('/api', globalLimiter);

// ── Routes API ────────────────────────────────────────────────
// Appliquer le limiteur plus strict aux routes d'authentification
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/students', require('./routes/students'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/personnel', require('./routes/personnel'));
app.use('/api/superadmin', require('./routes/superAdmin')); // 👑 Routes propriétaire SaaS
app.use('/api/creator', require('./routes/creator'));
app.use('/api/documents', require('./routes/document'));

// Route publique pour lister les écoles dans le login
app.get('/api/schools', async (req, res) => {
    try {
        const { data: schools, error } = await supabase
            .from('schools')
            .select('slug, name, logo_url')
            .in('status', ['active', 'trial'])
            .eq('is_email_verified', true)
            .order('name');
        if (error) throw error;
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: 'Erreur récupération écoles' });
    }
});

// Routes publiques pour les témoignages
app.get('/api/testimonials', async (req, res) => {
    try {
        const { data: testimonials, error } = await supabase
            .from('testimonials')
            .select('id, name, role, school_name, content, created_at')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ error: 'Erreur récupération témoignages' });
    }
});

app.post('/api/testimonials', async (req, res) => {
    try {
        const { name, role, school_name, content } = req.body;
        if (!name || !role || !content) {
            return res.status(400).json({ error: 'Nom, rôle et contenu requis' });
        }
        
        const { data, error } = await supabase
            .from('testimonials')
            .insert([{ name, role, school_name, content, is_approved: false }])
            .select();
            
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: 'Erreur soumission témoignage' });
    }
});

// Route publique pour les statistiques globales
app.get('/api/public/stats', async (req, res) => {
    const { getCache, setCache } = require('./services/cacheService');
    const CACHE_KEY = 'public_stats';

    try {
        const cachedStats = await getCache(CACHE_KEY);
        if (cachedStats) {
            return res.json(cachedStats);
        }

        const { count: totalSchools } = await supabase
            .from('schools')
            .select('*', { count: 'exact', head: true })
            .in('status', ['active', 'trial']);
            
        const { count: totalDocuments } = await supabase
            .from('student_documents')
            .select('*', { count: 'exact', head: true });

        const { data: schools } = await supabase
            .from('schools').select('slug').in('status', ['active', 'trial']);
            
        let totalStudents = 0;
        let totalBulletins = 0;
        
        if (schools) {
            for (let s of schools) {
                try {
                    const { count: sCount } = await supabase
                        .from(`students_${s.slug}`)
                        .select('*', { count: 'exact', head: true });
                    totalStudents += (sCount || 0);
                    
                    const { count: bCount } = await supabase
                        .from(`notes_${s.slug}`)
                        .select('*', { count: 'exact', head: true });
                    totalBulletins += (bCount || 0);
                } catch(e) {}
            }
        }
        
        const stats = {
            schools: totalSchools || 0,
            students: totalStudents || 0,
            documents: (totalDocuments || 0) + (totalBulletins || 0)
        };

        await setCache(CACHE_KEY, stats, 900); // Cache pendant 15 minutes
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Erreur récupération stats' });
    }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        backend: 'online',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ── Service du Frontend (Static Files) ───────────────────────
// On pointe vers le dossier 'dist' à la racine du projet
const frontendDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDir)) {
    app.use(express.static(frontendDir));

    // Pour toutes les autres routes, on renvoie index.html (React Router)
    app.get('*', (req, res) => {
        // Si la requête cherche un fichier statique (qui a une extension ou est dans /assets) mais qui n'existe pas, on renvoie un 404
        const isStaticAsset = req.path.startsWith('/assets/') || req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|json|woff2?|eot|ttf|mp3)$/i);
        if (isStaticAsset) {
            return res.status(404).send('Not Found');
        }

        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendDir, 'index.html'));
        }
    });
}

// ── Gestion globale des erreurs ───────────────────────────────
app.use((err, req, res, _next) => {
    console.error('❌ Erreur serveur:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur.', detail: err.message });
});

// ── Démarrage ─────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 DGhubSchool Backend démarré`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📡 Serveur: http://localhost:${PORT}`);
    console.log(`🛡️  Base de données: Supabase PostgreSQL`);
    console.log(`🔑 Auth: JWT ${process.env.JWT_SECRET ? '(configuré)' : '(DÉFAUT)'}`);
    console.log(`📁 Node env: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💬 Routes actives: /api/auth, /api/parent, /api/students, /api/admissions, /api/sync, /api/chat, /api/notifications, /api/announcements`);
    console.log(`🏥 Health check: /api/health`);
    console.log(`${'='.repeat(60)}\n`);
});

// Gestion des erreurs de démarrage
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé. Utilisez un autre port.`);
    } else {
        console.error(`❌ Erreur au démarrage du serveur:`, err);
    }
    process.exit(1);
});
