// ============================================================
// SERVEUR PRINCIPAL — DGhubSchool Backend (Version Supabase)
// ============================================================
'use strict';
require('dotenv').config();

// Désactiver les console.log en production
if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { supabase } = require('./utils/supabase');
require('./services/cacheService');

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

// Rediriger le trafic HTTP vers HTTPS en production (sauf pour le health check)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (!req.secure && req.path !== '/api/health') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Activer les en-têtes de sécurité (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://mbsiocggltzdssfpsqqi.supabase.co';
    const backupSupabaseUrl = 'https://kbvyyzgulxjzmdyqfcyj.supabase.co';
    
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sheetjs.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src 'self' data: blob: ${supabaseUrl} ${backupSupabaseUrl}`,
        `connect-src 'self' ${supabaseUrl} ${backupSupabaseUrl} ws: wss: http://localhost:* http://127.0.0.1:*`,
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    next();
});

// Middleware globaux
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost', 'https://localhost', 'capacitor://localhost', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'https://dghubschool.com', 'https://www.dghubschool.com'];

// Toujours autoriser les origines locales des builds mobiles (Capacitor)
const capacitorOrigins = ['http://localhost', 'https://localhost', 'capacitor://localhost'];

app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    const corsOptions = { credentials: true };

    if (!origin || process.env.NODE_ENV !== 'production') {
        corsOptions.origin = true;
    } else {
        let isAllowed = allowedOrigins.includes(origin) || capacitorOrigins.includes(origin);
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

// Logger simple des requêtes (uniquement en développement)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        next();
    });
}

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
    // Exclure index.html pour que les routes génériques passent par notre injection SEO
    app.use(express.static(frontendDir, { index: false }));

    let indexHtmlCache = null;

    // Pour toutes les autres routes, on renvoie index.html (React Router)
    app.get('*', (req, res) => {
        // Redirection HTTP 302 de la racine vers /fr pour éviter le duplicate content
        if (req.path === '/') {
            return res.redirect(302, '/fr');
        }

        // Redirection 301 pour les fichiers sitemap et robots avec slash final
        if (req.path === '/sitemap.xml/') {
            return res.redirect(301, '/sitemap.xml');
        }
        if (req.path === '/robots.txt/') {
            return res.redirect(301, '/robots.txt');
        }

        // Si la requête cherche un fichier statique (qui a une extension ou est dans /assets) mais qui n'existe pas, on renvoie un 404
        const isStaticAsset = req.path.startsWith('/assets/') || req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|json|woff2?|eot|ttf|mp3|xml|txt)$/i);
        if (isStaticAsset) {
            return res.status(404).send('Not Found');
        }

        if (!req.path.startsWith('/api')) {
            const htmlPath = path.join(frontendDir, 'index.html');
            
            const pageMetadata = {
                fr: {
                    home: {
                        title: "DGhubSchool — Plateforme de Gestion Scolaire et Financière en Ligne",
                        description: "DGhubSchool est la solution moderne et complète en ligne pour la gestion de votre établissement d'enseignement. Suivez les inscriptions des élèves, organisez les classes et les enseignants, gérez le recouvrement des frais scolaires, et automatisez la génération des reçus financiers et des bulletins scolaires en format PDF.",
                        h1: "DGhubSchool — Plateforme Intégrée de Gestion Financière et Scolaire",
                        p: "DGhubSchool est la solution moderne, performante et complète en ligne pour la gestion de votre établissement d'enseignement. Suivez les inscriptions des élèves, organisez les classes et les enseignants, gérez le recouvrement des frais scolaires, et automatisez la génération des reçus financiers et des bulletins scolaires en format PDF. Offrez aux parents un accès en temps réel au suivi académique, aux relevés de notes et aux annonces de l'établissement. Notre plateforme Cloud s'adapte à tous les types d'écoles (maternelle, primaire, collège, lycée) et offre des interfaces intuitives adaptées aux besoins des administrateurs, des enseignants et des parents d'élèves. Avec une interface fluide, des notifications push en temps réel, un système de scan de présence et de sortie des élèves, et des rapports financiers détaillés pour le recouvrement des scolarités, DGhubSchool représente le choix idéal pour digitaliser votre école en toute simplicité et sécurité."
                    },
                    features: {
                        title: "Fonctionnalités DGhubSchool — Gestion Administrative et Financière",
                        description: "Découvrez les fonctionnalités avancées de DGhubSchool : enregistrement des paiements, recouvrement des frais, génération de reçus PDF, saisie de notes, édition automatisée de bulletins scolaires et portail parents complet.",
                        h1: "Toutes les Fonctionnalités pour Digitaliser votre École",
                        p: "Découvrez la richesse des outils de DGhubSchool conçus spécifiquement pour moderniser votre établissement scolaire. Notre solution intègre une gestion complète du recouvrement des frais de scolarité avec relances automatiques, génération instantanée de reçus de paiement au format PDF avec signatures numériques, et édition de rapports financiers détaillés pour la comptabilité. Côté académique, profitez d'outils simplifiés pour l'organisation des classes, l'attribution des matières aux enseignants, la saisie rapide des notes en ligne et le calcul automatisé des moyennes scolaires pour l'édition de bulletins de notes de haute qualité. De plus, notre système de sécurité permet le scan des cartes scolaires des élèves pour le contrôle des présences et la sécurité des sorties d'établissement. Enfin, le portail parent offre aux familles un canal de communication privilégié pour le suivi des notes, des messages et des paiements en temps réel."
                    },
                    pricing: {
                        title: "Tarifs DGhubSchool — Plans d'Abonnement Flexibles et Période d'Essai",
                        description: "Consultez les tarifs de DGhubSchool. Nous proposons des forfaits mensuels et annuels transparents, adaptés à la taille et au nombre d'élèves de votre école, avec une période d'essai gratuite sans engagement.",
                        h1: "Des Tarifs Transparents et Sans Engagement",
                        p: "Chez DGhubSchool, nous pensons que la technologie de pointe doit être accessible à tous les établissements d'enseignement. C'est pourquoi nous proposons des plans d'abonnement flexibles, transparents et sans frais cachés, calculés de manière juste selon la taille de votre école et le nombre d'élèves inscrits. Chaque plan inclut un accès illimité à l'ensemble de nos fonctionnalités principales : gestion des frais de scolarité, génération de reçus et bulletins au format PDF, portail pour les parents, espace enseignant pour la saisie des notes, et support technique prioritaire. Profitez d'une période d'essai gratuite de 30 jours pour tester notre logiciel cloud en conditions réelles, configurer vos classes, ajouter vos premiers élèves et découvrir comment simplifier le recouvrement financier de votre établissement. Notre support est à votre disposition pour vous accompagner dans l'importation de vos données existantes."
                    },
                    'a-propos': {
                        title: "À Propos de DGhubSchool — Notre Mission pour l'Éducation",
                        description: "En savoir plus sur l'équipe derrière DGhubSchool. Nous développons des outils innovants pour simplifier la gestion des écoles et améliorer la communication avec les parents.",
                        h1: "La Mission de DGhubSchool pour l'Éducation Moderne",
                        p: "DGhubSchool est né de la volonté de répondre aux défis complexes auxquels font face les administrateurs, directeurs, enseignants et parents d'élèves au quotidien. Notre mission principale est de digitaliser les processus administratifs et financiers des établissements scolaires afin de libérer du temps pour l'enseignement et d'apporter une transparence totale dans la gestion financière. Nous développons une plateforme logicielle cloud de pointe, accessible depuis n'importe quel appareil, intégrant les meilleures technologies de sécurité et de base de données. Notre équipe, passionnée par l'éducation et l'innovation technologique, travaille en étroite collaboration avec des écoles partenaires pour concevoir des fonctionnalités toujours plus proches des réalités du terrain : suivi précis des paiements, simplification de la saisie des notes, automatisation des bulletins et amélioration de la sécurité des élèves. En éliminant le papier et les tâches répétitives, nous permettons aux équipes éducatives de se concentrer sur la réussite scolaire des enfants, tout en offrant aux parents une tranquillité d'esprit grâce à un suivi en temps réel de la scolarité et des règlements de scolarité de leurs enfants."
                    },
                    newsroom: {
                        title: "Newsroom DGhubSchool — Actualités et Mises à Jour",
                        description: "Suivez les dernières actualités, guides de gestion scolaire, et nouveautés sur la plateforme DGhubSchool.",
                        h1: "Espace Actualités, Presse et Guides Scolaires",
                        p: "Bienvenue dans la newsroom officielle de DGhubSchool, votre source d'information privilégiée pour suivre toute l'actualité de notre plateforme cloud. Retrouvez ici nos derniers communiqués de presse, les annonces de partenariats stratégiques avec des établissements d'enseignement, et les détails des mises à jour régulières de notre logiciel. Nous publions également des articles de blog, des études de cas et des guides pratiques rédigés par des experts pour aider les directeurs d'école et les gestionnaires financiers à optimiser le recouvrement des frais de scolarité, à simplifier l'organisation académique et à renforcer la relation avec les parents d'élèves. Restez informé des dernières innovations en matière de technologies éducatives (EdTech), découvrez nos conseils pour réussir la transition numérique de votre école, et apprenez comment tirer le meilleur parti de nos fonctionnalités de gestion de bulletins et de scan des présences."
                    },
                    'centre-aide': {
                        title: "Centre d'Aide DGhubSchool — Support et Tutoriels",
                        description: "Trouvez des réponses à toutes vos questions sur DGhubSchool. Consultez nos guides d'utilisation, FAQ et contactez notre support technique.",
                        h1: "Centre d'Aide, Guide de Démarrage et Support",
                        p: "Le centre d'aide de DGhubSchool est conçu pour vous accompagner à chaque étape de l'utilisation de notre plateforme cloud de gestion scolaire. Que vous soyez un nouvel administrateur configurant l'espace de votre école pour la première fois, un enseignant prêt à saisir ses premières notes en ligne, ou un parent souhaitant installer l'application pour suivre les paiements de ses enfants, vous trouverez ici une documentation complète et claire. Explorez nos tutoriels détaillés, nos vidéos de démonstration étape par étape, nos guides d'importation de listes d'élèves depuis Excel, et notre foire aux questions (FAQ) traitant de la facturation, de la sécurité des données et du paramétrage des classes. Si vous ne trouvez pas la réponse à vos questions, notre équipe de support technique réactive et chaleureuse reste à votre entière disposition par e-mail ou via notre ligne directe pour vous apporter une assistance sur mesure."
                    },
                    login: {
                        title: "Connexion — DGhubSchool",
                        description: "Connectez-vous à votre espace DGhubSchool pour gérer votre établissement scolaire, vos finances ou suivre la scolarité de vos enfants.",
                        h1: "Portail de Connexion Sécurisé DGhubSchool",
                        p: "Bienvenue sur le portail de connexion sécurisé de DGhubSchool. Cette interface unique vous permet d'accéder à votre espace personnalisé selon votre rôle dans l'établissement scolaire. Les administrateurs peuvent s'y connecter pour piloter l'ensemble de l'école, valider les encaissements financiers, éditer les reçus et configurer les paramètres de sécurité. Le personnel de surveillance et de direction accède aux modules de scan des présences et de génération des cartes d'élèves. Les enseignants disposent d'un espace optimisé pour l'enregistrement rapide des notes scolaires et des moyennes. Enfin, les parents d'élèves accèdent en toute sécurité à leur tableau de bord pour suivre les relevés de paiement, télécharger les reçus financiers officiels au format PDF, consulter les notes de leurs enfants et recevoir les messages importants envoyés par la direction de l'établissement. Toutes les connexions sont cryptées et protégées par des protocoles de sécurité avancés pour garantir l'entière confidentialité de vos données personnelles et financières."
                    },
                    'creer-compte': {
                        title: "Créer un Compte École — DGhubSchool",
                        description: "Inscrivez votre établissement sur DGhubSchool dès aujourd'hui et commencez à digitaliser vos opérations administratives et financières.",
                        h1: "Inscription et Création d'un Espace École",
                        p: "Prenez le virage du numérique dès aujourd'hui en inscrivant votre établissement sur DGhubSchool. La création de votre compte est simple, rapide et entièrement gratuite pendant les 30 premiers jours, sans engagement ni carte bancaire requise. Ce formulaire vous permet d'enregistrer les informations de base de votre école, de définir votre adresse d'accès personnalisée (URL dédiée) et de configurer votre profil d'administrateur principal. Une fois l'inscription finalisée, vous accéderez instantanément à votre tableau de bord cloud. Vous pourrez immédiatement importer la liste de vos élèves depuis un fichier Excel, configurer les classes de votre choix, définir les frais de scolarité à recouvrer et inviter vos collaborateurs (enseignants, comptables, surveillants) à rejoindre la plateforme. Notre équipe d'assistance est disponible pour vous guider lors de vos premiers pas et assurer le succès de la digitalisation de votre gestion administrative et financière."
                    },
                    confidentialite: {
                        title: "Politique de Confidentialité — DGhubSchool",
                        description: "Consultez notre politique de confidentialité pour comprendre comment DGhubSchool protège et gère les données personnelles des élèves, parents et écoles.",
                        h1: "Politique de Confidentialité et Engagement de Sécurité",
                        p: "Chez DGhubSchool, nous considérons que la protection des données personnelles de nos utilisateurs est une priorité absolue. Cette politique de confidentialité détaille en toute transparence la manière dont nous collectons, stockons, traitons et protégeons les informations confidentielles des établissements scolaires, des élèves, des enseignants et des parents d'élèves. Nous utilisons des technologies de cryptage avancées (SSL/TLS) pour sécuriser toutes les transmissions de données et collaborons avec des hébergeurs certifiés de premier plan sur une infrastructure cloud sécurisée pour garantir l'intégrité de nos bases de données. Nous ne vendons ni ne partageons jamais vos informations à des tiers à des fins publicitaires. Les données collectées (noms, inscriptions, paiements scolaires, notes académiques) sont uniquement utilisées pour fournir et améliorer les services de gestion scolaire demandés par votre établissement. Vous disposez d'un droit permanent d'accès, de rectification et de suppression de vos données personnelles conformément aux réglementations internationales en vigueur."
                    },
                    'conditions-utilisation': {
                        title: "Conditions Générales d'Utilisation — DGhubSchool",
                        description: "Lisez les conditions d'utilisation de la plateforme DGhubSchool régissant l'accès à nos services de gestion scolaire.",
                        h1: "Conditions Générales d'Utilisation de la Plateforme SaaS",
                        p: "Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme logicielle cloud DGhubSchool par les établissements scolaires abonnés, ainsi que par les parents, enseignants et membres du personnel autorisés. En accédant à nos services, vous acceptez sans réserve ces termes, qui définissent les droits et les obligations de chaque partie. DGhubSchool s'engage à fournir un accès continu à son service SaaS, avec un taux de disponibilité optimal, et à assurer des sauvegardes de données régulières pour prévenir toute perte d'information. En contrepartie, les établissements utilisateurs s'engagent à fournir des informations exactes lors de leur inscription, à maintenir la confidentialité de leurs identifiants de connexion et à utiliser le service conformément aux lois locales sur l'éducation et la protection des données. Cette page détaille également les modalités de renouvellement des licences annuelles, les politiques de support technique et les limites de responsabilité de notre entreprise."
                    },
                    'partager-mon-histoire': {
                        title: "Partager mon Histoire avec DGhubSchool",
                        description: "Partagez votre expérience d'utilisation de DGhubSchool et témoignez de l'impact de notre plateforme sur la gestion de votre école.",
                        h1: "Partagez votre Histoire et votre Réussite Scolaire",
                        p: "Nous sommes fiers de voir comment la technologie de DGhubSchool transforme positivement la gestion quotidienne des établissements scolaires partout dans le monde. Cette page vous invite à partager votre propre expérience et à témoigner de l'impact de notre plateforme sur votre école. Que vous soyez directeur d'établissement ayant constaté une nette amélioration du taux de recouvrement des frais de scolarité, comptable ayant gagné un temps précieux grâce à l'automatisation des reçus de paiement PDF, enseignant appréciant la simplicité de la saisie des notes en ligne, ou parent d'élève ravi de pouvoir suivre la scolarité de vos enfants en temps réel, votre histoire nous intéresse ! Soumettez votre témoignage en quelques lignes pour inspirer d'autres écoles à franchir le pas de la digitalisation et aidez-nous à continuer d'améliorer nos services pour répondre toujours mieux à vos besoins quotidiens."
                    },
                    'activation-licence': {
                        title: "Activation de Licence — DGhubSchool",
                        description: "Activez la licence annuelle de votre école sur DGhubSchool pour débloquer toutes les fonctionnalités premium de gestion scolaire.",
                        h1: "Activation et Renouvellement de Licence d'École",
                        p: "Pour continuer à profiter de l'ensemble des services premium de DGhubSchool sans interruption, les établissements scolaires doivent disposer d'une licence annuelle active. Cette page dédiée vous permet d'activer une nouvelle clé de licence fournie par notre équipe commerciale ou de procéder directement au renouvellement de votre abonnement annuel. L'activation de votre licence débloque l'accès complet à tous les modules essentiels : inscriptions des élèves, suivi comptable du recouvrement, impression automatisée de reçus financiers sécurisés, génération de bulletins de notes PDF conformes aux normes nationales, et accès illimité au portail mobile pour les parents d'élèves. Si vous rencontrez la moindre difficulté lors de la saisie de votre clé de licence ou pour effectuer votre paiement en ligne, notre service d'assistance administrative se tient à votre entière disposition pour valider votre accès en quelques minutes seulement."
                    },
                    'portail-ecole': {
                        title: "Portail École — Accès DGhubSchool",
                        description: "Recherchez et accédez directement à l'espace de connexion dédié de votre établissement scolaire sur DGhubSchool.",
                        h1: "Rechercher et Accéder au Portail de votre École",
                        p: "DGhubSchool offre à chaque établissement scolaire partenaire un sous-domaine personnalisé et un portail d'accès unique. Cette page d'annuaire public permet aux parents, élèves, enseignants et membres du personnel administratif de rechercher facilement leur école afin d'être redirigés vers l'interface de connexion appropriée. Saisissez simplement le nom de votre établissement ou son identifiant unique dans notre barre de recherche rapide pour trouver votre portail dédié. Une fois votre école sélectionnée, vous pourrez marquer sa page de connexion personnalisée dans vos favoris pour y accéder en un clic lors de vos prochaines visites. Si votre école n'apparaît pas dans la liste ou si vous rencontrez des difficultés d'accès, veuillez vérifier l'orthographe du nom ou contacter l'administration de votre établissement pour obtenir l'adresse URL exacte de connexion. DGhubSchool s'engage à offrir une accessibilité permanente et sécurisée à tous ses portails d'écoles partenaires pour simplifier les interactions quotidiennes entre les administrations et les familles."
                    }
                },
                en: {
                    home: {
                        title: "DGhubSchool — School and Financial Management Online Platform",
                        description: "DGhubSchool is the modern and complete online solution for school administration and financial management. Track student enrollment, manage tuition fee collection, and automate the generation of receipts and PDF report cards.",
                        h1: "DGhubSchool — Integrated School & Financial Management Platform",
                        p: "DGhubSchool is the modern, powerful, and comprehensive online solution designed for managing your educational institution. Easily track student registrations, organize classes and teaching staff, manage school fee collection, and automate the creation of financial receipts and high-quality report cards in PDF format. Provide parents with secure, real-time access to their children's academic progress, grade sheets, and official announcements. Powered by advanced cloud technology and bank-level database security through Supabase, our platform simplifies daily school administration while boosting financial transparency and enhancing communication with families. Whether you manage a kindergarten, primary school, middle school, or high school, DGhubSchool adapts to your requirements to deliver intuitive interfaces for administrators, teachers, and parents alike. With features like instant push notifications, activity logs, student card printing, and student attendance check-ins, DGhubSchool is the ultimate system to digitize your school securely and effortlessly. Join hundreds of schools improving their operations today."
                    },
                    features: {
                        title: "DGhubSchool Features — Administrative and Financial Tools",
                        description: "Explore all the advanced features of DGhubSchool: tuition tracking, automated billing, PDF receipt generation, grades entry, automated report card creation, and parent portal.",
                        h1: "Comprehensive Features to Digitize Your Educational Institution",
                        p: "Discover the wide range of tools built specifically into DGhubSchool to modernize your school operations. Our software integrates a complete tuition fee collection module featuring automated reminders, instant PDF payment receipt generation with digital signatures, and detailed financial reports for bookkeeping. On the academic side, administrators and teachers benefit from simplified tools to manage class structures, assign subjects, record grades online, and automatically calculate student grade averages to print customized report cards. Additionally, our security features support scanning student cards for quick attendance tracking and secure check-outs. Finally, the parent portal keeps families fully engaged by offering them real-time access to their children's grades, direct messaging with the school administration, and instant access to payment history and invoices. This unified ecosystem reduces administrative burden, eliminates paperwork, and fosters a collaborative learning environment for students, teachers, and school directors alike."
                    },
                    pricing: {
                        title: "DGhubSchool Pricing — Flexible SaaS Plans and Free Trial",
                        description: "Check out our transparent subscription plans for DGhubSchool. We offer monthly and annual pricing scaled to your school's size, with a risk-free 30-day trial period.",
                        h1: "Transparent SaaS Pricing with No Hidden Fees",
                        p: "At DGhubSchool, we believe that state-of-the-art school management technology should be accessible to every educational institution. That is why we offer flexible, transparent subscription plans with no setup costs or hidden fees, calculated fairly based on your school's enrollment size. Every package includes full access to our core modules: tuition fee tracking, automated receipts and report cards, the parent mobile portal, teacher gradebooks, and priority customer support. We invite you to start a risk-free 30-day free trial to test our cloud platform under real conditions, configure your classes, enroll your first students, and experience firsthand how we simplify administrative work. Our technical support team is always ready to assist you with importing your existing student data from Excel files to get your school started in minutes. Choose the plan that best fits your institution's objectives and budget, with the flexibility to upgrade or downgrade as your student count changes."
                    },
                    'a-propos': {
                        title: "About DGhubSchool — Our Mission for Modern Education",
                        description: "Learn about the team and story behind DGhubSchool. We design innovative cloud software solutions to simplify school administration and strengthen parent-school communication.",
                        h1: "The Mission of DGhubSchool to Modernize School Management",
                        p: "DGhubSchool was created to address the complex daily administrative challenges faced by school directors, accountants, teachers, and parents. Our primary goal is to digitize and streamline administrative and financial processes in schools, saving valuable time for education and bringing absolute clarity to financial management. We build a state-of-the-art cloud software platform accessible from any device, incorporating the highest security and database standards. Passionate about education and software engineering, our team works closely with partner schools to design features that reflect classroom realities: precise tuition tracking, simplified gradebooks, automated report card editing, and enhanced student safety. Together, we are building the future of school administration. By replacing paper-based tasks with automation, we empower educators to focus on student success while giving parents peace of mind through real-time updates on their children's attendance, grades, and school fee payments. We are committed to fostering educational success across communities worldwide."
                    },
                    newsroom: {
                        title: "Newsroom and Updates — DGhubSchool Press and Blog",
                        description: "Read the latest news from DGhubSchool. Get platform announcements, product updates, partnership news, and expert articles on administrative and financial management in schools.",
                        h1: "DGhubSchool Newsroom, Product Updates, and School Guides",
                        p: "Welcome to the official DGhubSchool newsroom, your primary resource for staying informed about our cloud platform. Here, you will find our latest press releases, strategic partnership announcements, and detailed guides on our regular software updates. We also publish informative blog posts, case studies, and practical advice written by education technology experts to help school directors and financial managers improve fee collection, simplify academic scheduling, and build stronger relationships with parents. Stay up to date with the latest trends in Educational Technology (EdTech), explore our recommendations for successfully leading the digital transition in your school, and learn how to make the most of our report card modules, attendance tracking systems, and online billing tools. We regularly share success stories from schools that have completely transformed their operations with DGhubSchool, offering valuable insights for administrators globally."
                    },
                    'centre-aide': {
                        title: "Help Center and Technical Support — DGhubSchool Documentation",
                        description: "Need help? Search the DGhubSchool help center for user documentation, step-by-step setup tutorials, FAQs, and to contact our dedicated customer support team.",
                        h1: "Help Center, Setup Guides, and Customer Support",
                        p: "The DGhubSchool help center is built to support you at every stage of using our cloud platform. Whether you are a school administrator configuring your workspace for the first time, a teacher ready to input grades online, or a parent setting up the application to track payments, you will find detailed documentation here. Browse our comprehensive tutorials, step-by-step video guides, tips for importing student directories from Excel files, and our frequently asked questions (FAQ) covering billing setup, data privacy, and class configuration. If you cannot find the answers you need, our friendly customer support team is always available via email or phone to provide personalized assistance to help you get the most out of your platform. We are dedicated to ensuring a smooth onboarding experience for all educational institutions, ensuring that every user finds the support they need to succeed."
                    },
                    login: {
                        title: "Login — DGhubSchool",
                        description: "Log in to your DGhubSchool space to manage your school, finances, or track your children's schooling.",
                        h1: "DGhubSchool Secure Access Login Portal",
                        p: "Welcome to the DGhubSchool secure login portal. This centralized page allows you to access your personal dashboard according to your registered role in the school. Administrators can log in here to oversee all school operations, approve payments, print receipts, and manage security settings. Staff and security personnel access tools for attendance check-ins and student ID card generation. Teachers have a dedicated space to quickly input classroom marks and manage subject grades. Finally, parents can log in to view their payment history, download official PDF receipts, check their children's report cards, and receive direct messages from the school administration. All communication is fully encrypted using SSL/TLS protocols to ensure the absolute confidentiality and safety of your personal and financial records. Please ensure you keep your login credentials private to protect your account."
                    },
                    'creer-compte': {
                        title: "Create a School Account — DGhubSchool",
                        description: "Register your school on DGhubSchool today and start digitalizing your administrative and financial operations.",
                        h1: "Register Your School and Start Your Free Trial",
                        p: "Take the first step toward digitizing your educational institution by signing up for DGhubSchool today. Registering your school is quick, easy, and completely free for the first 30 days, with no credit card required. This sign-up form lets you input basic school details, choose your custom subdomain URL, and create your master administrator account. Once completed, you will gain immediate access to your cloud dashboard. You can instantly import your student roster from Excel, configure classes, set up tuition fee schedules, and invite teachers, registrars, and staff to join your platform. Our support team is ready to assist you during your onboarding to ensure a successful transition to digital administrative and financial management for your school. Start exploring the capabilities of our platform and see the difference in your daily administration."
                    },
                    confidentialite: {
                        title: "Privacy Policy and Data Protection — DGhubSchool",
                        description: "Read the privacy policy of DGhubSchool. Learn how we collect, store, secure, and process personal data for schools, students, parents, and teachers.",
                        h1: "DGhubSchool Privacy Policy & Data Security Commitments",
                        p: "At DGhubSchool, protecting the personal and financial data of our users is our utmost priority. This privacy policy explains how we collect, store, process, and protect information provided by educational institutions, students, teachers, and parents. We implement advanced SSL/TLS encryption for all data transmission and work with industry-leading, certified cloud hosting providers on a secure infrastructure to guarantee data integrity. We never sell or share your data with third parties for marketing. The data collected (names, grades, tuition logs) is used solely to provide and improve the school management services requested by your institution. Under international data protection laws, you retain full rights to access, correct, or delete your personal data. We are committed to maintaining a transparent, highly secure environment for all users. Our systems are audited regularly to keep up with modern compliance standards, assuring the highest level of security."
                    },
                    'conditions-utilisation': {
                        title: "Terms of Service (ToS) — DGhubSchool User Agreement",
                        description: "Review the terms of service of the DGhubSchool platform governing use of our SaaS software by schools, parents, teachers, and staff members.",
                        h1: "DGhubSchool Terms of Service for SaaS Platform",
                        p: "These terms of service govern the access and use of the DGhubSchool cloud platform by subscribed educational institutions and their authorized parents, teachers, and staff members. By using our services, you agree to these terms, which define the rights and obligations of both parties. DGhubSchool commits to providing reliable access to its SaaS platform with optimal uptime, and performing regular automated database backups to prevent data loss. In return, schools agree to provide accurate information, maintain the confidentiality of login credentials, and use our platform in compliance with local education and data protection laws. This page also outlines the annual subscription renewal process, support policies, and liability limits for our cloud software services. If you have any questions regarding these terms, please contact our support team. We value our partnership with schools and strive to build long-term trust."
                    },
                    'partager-mon-histoire': {
                        title: "Share Your Success Story — DGhubSchool Testimonials",
                        description: "Share your experience with DGhubSchool. Tell us how our software helped your school improve fee collections, automate report cards, and simplify operations.",
                        h1: "Share Your Success Story and Experience with DGhubSchool",
                        p: "We are incredibly proud to see how DGhubSchool technology is improving school management operations worldwide. This page is an invitation for you to share your story and testify to the impact of our platform on your school. Whether you are a school director who saw a major increase in tuition fee collection rates, an accountant who saved hours by generating PDF receipts, a teacher enjoying the simplicity of our online gradebook, or a parent happy to track your children's academic success in real-time, we want to hear from you! Submit your testimonial in a few lines to inspire other schools to go digital. Your feedback also helps us refine our tools to serve educational communities better every day. Let's work together to make school management simpler, more transparent, and highly efficient for everyone."
                    },
                    'activation-licence': {
                        title: "School License Activation — DGhubSchool Annual Plan",
                        description: "Activate your school's annual subscription on DGhubSchool. Enter your activation code or complete your payment online to access all platform features.",
                        h1: "School License Activation & Subscription Renewal",
                        p: "To continue enjoying the premium school management services of DGhubSchool without interruption, educational institutions must have an active annual license. This dedicated page allows you to activate a new license key provided by our sales team or complete your annual subscription renewal online. Activating your school license grants full access to all essential modules: student rosters, fee tracking, secure PDF receipt printing, custom report cards matching academic guidelines, and unlimited access to the parent portal. If you experience any issues entering your key or processing your online payment, our support team is available to assist you to activate your account in minutes. We provide flexible payment methods to match local preferences, ensuring that every educational institution can easily renew its license."
                    },
                    'portail-ecole': {
                        title: "Partner Schools Directory — DGhubSchool Portal Access",
                        description: "Find the custom login page of your educational institution on DGhubSchool. Use our directory or search tool to access your dedicated school portal.",
                        h1: "Find and Access Your School Portal Page",
                        p: "DGhubSchool provides each partner educational institution with a custom subdomain and a dedicated portal. This public directory allows parents, students, teachers, and staff members to easily find their school portal and access their login interface. Simply enter your school's name or unique identifier in our search bar to find your portal. Once selected, you can bookmark your school's custom login page for easy access in the future. If your school is not listed or if you experience access issues, please check the spelling or contact your school's administration to get the exact URL for your portal. We work continuously to ensure that every partner school's portal is highly accessible, helping families and administrations connect easily."
                    }
                }
            };

            const serveHtml = (htmlContent) => {
                let modifiedHtml = htmlContent;
                const pathname = req.path;
                const parts = pathname.split('/');
                let currentLang = 'fr';
                let pagePath = pathname;
                
                if (parts[1] === 'fr' || parts[1] === 'en') {
                    currentLang = parts[1];
                    pagePath = '/' + parts.slice(2).join('/');
                }
                
                const cleanPath = pathname.endsWith('/') && pathname !== '/'
                    ? pathname.slice(0, -1)
                    : pathname;
                    
                const canonicalPath = cleanPath === '/' ? '/fr' : cleanPath;
                const canonicalUrl = `https://dghubschool.com${canonicalPath}`;
                
                const pagePathClean = pagePath === '/' ? '' : pagePath;
                const alternateFr = `https://dghubschool.com/fr${pagePathClean}`;
                const alternateEn = `https://dghubschool.com/en${pagePathClean}`;
                
                const pageKey = pagePathClean.replace(/^\//, '') || 'home';
                
                let structuredData = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "DGhubSchool",
      "url": "https://dghubschool.com",
      "logo": "https://dghubschool.com/logo.png"
    }
    </script>`;
                
                if (pageKey === 'home') {
                    structuredData += `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "DGhubSchool",
      "operatingSystem": "All",
      "applicationCategory": "EducationalApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>`;
                }

                // 2. Injecter canonical, hreflangs et JSON-LD dans le head
                const seoTags = `
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="fr" href="${alternateFr}" />
    <link rel="alternate" hreflang="en" href="${alternateEn}" />
    <link rel="alternate" hreflang="x-default" href="${alternateFr}" />
    ${structuredData}
  </head>`;
                modifiedHtml = modifiedHtml.replace('</head>', seoTags);
                
                // 3. Mettre à jour og:url et twitter:url
                modifiedHtml = modifiedHtml.replace(
                    '<meta property="og:url" content="https://dghubschool.com/" />',
                    `<meta property="og:url" content="${canonicalUrl}" />`
                );
                modifiedHtml = modifiedHtml.replace(
                    '<meta name="twitter:url" content="https://dghubschool.com/" />',
                    `<meta name="twitter:url" content="${canonicalUrl}" />`
                );

                // 4. Injecter les métadonnées spécifiques à la page (Titre, description, contenu fallback)
                const meta = pageMetadata[currentLang]?.[pageKey] || pageMetadata[currentLang]?.home;

                if (meta) {
                    // Mettre à jour la balise <title>
                    modifiedHtml = modifiedHtml.replace(
                        /<title>[^<]*<\/title>/i,
                        `<title>${meta.title}</title>`
                    );
                    // Mettre à jour og:title et twitter:title
                    modifiedHtml = modifiedHtml.replace(
                        /<meta property="og:title" content="[^"]*" \/>/gi,
                        `<meta property="og:title" content="${meta.title}" />`
                    );
                    modifiedHtml = modifiedHtml.replace(
                        /<meta name="twitter:title" content="[^"]*" \/>/gi,
                        `<meta name="twitter:title" content="${meta.title}" />`
                    );

                    // Mettre à jour la description
                    modifiedHtml = modifiedHtml.replace(
                        /<meta name="description" content="[^"]*" \/>/gi,
                        `<meta name="description" content="${meta.description}" />`
                    );
                    // Mettre à jour og:description et twitter:description
                    modifiedHtml = modifiedHtml.replace(
                        /<meta property="og:description" content="[^"]*" \/>/gi,
                        `<meta property="og:description" content="${meta.description}" />`
                    );
                    modifiedHtml = modifiedHtml.replace(
                        /<meta name="twitter:description" content="[^"]*" \/>/gi,
                        `<meta name="twitter:description" content="${meta.description}" />`
                    );

                    // Mettre à jour le titre H1 statique et la description de fallback
                    modifiedHtml = modifiedHtml.replace(
                        /<h1 id="seo-title">[^<]*<\/h1>/i,
                        `<h1 id="seo-title">${meta.h1}</h1>`
                    );
                    modifiedHtml = modifiedHtml.replace(
                        /<p id="seo-description">[^<]*<\/p>/i,
                        `<p id="seo-description">${meta.p}</p>`
                    );
                }
                
                res.send(modifiedHtml);
            };

            if (process.env.NODE_ENV === 'production' && indexHtmlCache) {
                serveHtml(indexHtmlCache);
            } else {
                fs.readFile(htmlPath, 'utf8', (err, html) => {
                    if (err) {
                        return res.status(500).send('Error loading index.html');
                    }
                    if (process.env.NODE_ENV === 'production') {
                        indexHtmlCache = html;
                    }
                    serveHtml(html);
                });
            }
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
