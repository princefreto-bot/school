// ============================================================
// SERVEUR PRINCIPAL — EduFinance Backend (Version Supabase)
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

// Middleware globaux
app.use(cors({
    origin: '*', // Plus flexible pour le dév, à restreindre en prod
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/students', require('./routes/students'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/chat', require('./routes/chat'));

// ── Service du Frontend (Static Files) ───────────────────────
// On pointe vers le dossier 'dist' à la racine du projet
const frontendDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDir)) {
    app.use(express.static(frontendDir));

    // Pour toutes les autres routes, on renvoie index.html (React Router)
    app.get('*', (req, res) => {
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
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur actif sur http://localhost:${PORT}`);
    console.log(`🛡️  Base de données : Supabase PostgreSQL`);
    console.log(`💬 Messagerie active : /api/chat\n`);
});
