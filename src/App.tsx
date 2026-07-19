// ============================================================
// APP — Point d'entrée principal
// ============================================================
import React, { Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { webPushService } from './services/webPushService';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';

import { Capacitor } from '@capacitor/core';

const isCapacitor = Capacitor.isNativePlatform();
// Sur le sous-domaine app.dghubschool.com, on saute la vitrine (LandingPage) et on va
// directement au login/dashboard — même logique que pour l'app mobile Capacitor.
const isAppSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('app.');
// En prod web (hors Capacitor, hors sous-domaine app.), login et app doivent vivre
// exclusivement sur app.dghubschool.com — voir RedirectToAppDomain ci-dessous.
const shouldRedirectToAppDomain = import.meta.env.PROD && !isCapacitor && !isAppSubdomain;



const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const AnnouncementPopup = lazy(() => import('./components/AnnouncementPopup').then(m => ({ default: m.AnnouncementPopup })));
const Confidentialite = lazy(() => import('./pages/Confidentialite').then(m => ({ default: m.Confidentialite })));
const PortailEcole = lazy(() => import('./pages/PortailEcole').then(m => ({ default: m.PortailEcole })));
const CreerCompte = lazy(() => import('./pages/CreerCompte').then(m => ({ default: m.CreerCompte })));
const ConditionsUtilisation = lazy(() => import('./pages/ConditionsUtilisation').then(m => ({ default: m.ConditionsUtilisation })));
const ConfirmerEmail = lazy(() => import('./pages/ConfirmerEmail').then(m => ({ default: m.ConfirmerEmail })));
const OfflinePage = lazy(() => import('./pages/OfflinePage').then(m => ({ default: m.OfflinePage })));
import { ForgotPasswordParent } from './pages/ForgotPasswordParent';
import { ForgotPasswordSchool } from './pages/ForgotPasswordSchool';
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));


// Lazy loading for pages to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Eleves = lazy(() => import('./pages/Eleves').then(m => ({ default: m.Eleves })));
const Paiements = lazy(() => import('./pages/Paiements').then(m => ({ default: m.Paiements })));
const Retraits = lazy(() => import('./pages/Retraits').then(m => ({ default: m.Retraits })));
const Analyses = lazy(() => import('./pages/Analyses').then(m => ({ default: m.Analyses })));
const Documents = lazy(() => import('./pages/Documents').then(m => ({ default: m.Documents })));
const Parametres = lazy(() => import('./pages/Parametres').then(m => ({ default: m.Parametres })));
const Recouvrement = lazy(() => import('./pages/Recouvrement').then(m => ({ default: m.Recouvrement })));
const ScanPresence = lazy(() => import('./pages/ScanPresence').then(m => ({ default: m.ScanPresence })));
const ScanSortie = lazy(() => import('./pages/ScanSortie').then(m => ({ default: m.ScanSortie })));
const ScanInformation = lazy(() => import('./pages/ScanInformation'));
const CarteScolaire = lazy(() => import('./pages/CarteScolaire').then(m => ({ default: m.CarteScolaire })));
const CarteExamen = lazy(() => import('./pages/CarteExamen').then(m => ({ default: m.CarteExamen })));
const GestionAcademique = lazy(() => import('./pages/GestionAcademique' /* */).then(m => ({ default: m.GestionAcademique })));
const GestionAnneesScolaires = lazy(() => import('./pages/GestionAnneesScolaires').then(m => ({ default: m.GestionAnneesScolaires })));
const SaisieNotes = lazy(() => import('./pages/SaisieNotes' /* */).then(m => ({ default: m.SaisieNotes })));
const Bulletins = lazy(() => import('./pages/Bulletins').then(m => ({ default: m.Bulletins })));
const VerificationRecu = lazy(() => import('./pages/VerificationRecu').then(m => ({ default: m.VerificationRecu })));
const RapportsAcademiques = lazy(() => import('./pages/RapportsAcademiques').then(m => ({ default: m.RapportsAcademiques })));
const HistoriqueActivites = lazy(() => import('./pages/HistoriqueActivites').then(m => ({ default: m.HistoriqueActivites })));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const ParentHistorique = lazy(() => import('./pages/parent/ParentHistorique').then(m => ({ default: m.ParentHistorique })));
const ParentRecus = lazy(() => import('./pages/parent/ParentRecus').then(m => ({ default: m.ParentRecus })));
const ParentBadges = lazy(() => import('./pages/parent/ParentBadges').then(m => ({ default: m.ParentBadges })));
const ParentMessages = lazy(() => import('./pages/parent/ParentMessages').then(m => ({ default: m.ParentMessages })));
const ParentNotes = lazy(() => import('./pages/parent/ParentNotes').then(m => ({ default: m.ParentNotes })));
const ParentCourses = lazy(() => import('./pages/parent/ParentCourses').then(m => ({ default: m.ParentCourses })));
const ParentSettings = lazy(() => import('./pages/parent/ParentSettings').then(m => ({ default: m.ParentSettings })));
const KidsPlace = lazy(() => import('./pages/parent/KidsPlace').then(m => ({ default: m.KidsPlace })));
const ParentsList = lazy(() => import('./pages/ParentsList').then(m => ({ default: m.ParentsList })));
const ImportExport = lazy(() => import('./components/ImportExport').then(m => ({ default: m.ImportExport })));
const ChatWindow = lazy(() => import('./components/ChatWindow').then(m => ({ default: m.ChatWindow })));
const Annonces = lazy(() => import('./pages/Annonces').then(m => ({ default: m.Annonces })));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const SelectionEnseignant = lazy(() => import('./pages/SelectionEnseignant').then(m => ({ default: m.SelectionEnseignant })));
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const APropos = lazy(() => import('./pages/APropos').then(m => ({ default: m.APropos })));
const Features = lazy(() => import('./pages/Features').then(m => ({ default: m.Features })));
const Newsroom = lazy(() => import('./pages/Newsroom').then(m => ({ default: m.Newsroom })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then(m => ({ default: m.HelpCenter })));
const ActivationLicence = lazy(() => import('./pages/ActivationLicence').then(m => ({ default: m.ActivationLicence })));
const SubmitStory = lazy(() => import('./pages/SubmitStory').then(m => ({ default: m.SubmitStory })));
const CookieConsent = lazy(() => import('./components/CookieConsent').then(m => ({ default: m.CookieConsent })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="flex flex-col items-center gap-3">
      <div className="spinner-ring" />
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">Chargement...</span>
    </div>
  </div>
);

const RedirectWithSearch: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

const RedirectToLogin: React.FC = () => {
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  return <Navigate to={`/${lang}/login`} replace />;
};

const RedirectToApp: React.FC = () => {
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  return <Navigate to={`/${lang}/app`} replace />;
};

// Redirige (navigation externe, changement de domaine) vers le même chemin sur
// app.dghubschool.com. Utilisé pour que login/app ne vivent que sur ce sous-domaine.
const RedirectToAppDomain: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    window.location.replace(`https://app.dghubschool.com${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);
  return <LoadingSpinner />;
};

// Redirige vers un sous-chemin en préservant le préfixe de langue courant
const RedirectWithLang: React.FC<{ to: string }> = ({ to }) => {
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  return <Navigate to={`/${lang}${to}`} replace />;
};


const PageContent: React.FC = () => {
  const currentPage = useStore((s) => s.currentPage);
  const user = useStore((s) => s.user);
  const students = useStore((s) => s.students);

  // SuperAdmin: uniquement ses pages
  if (user?.role === 'superadmin') {
    return (
      <div key="superadmin" className="page-transition-running">
        <Suspense fallback={<LoadingSpinner />}>
          <SuperAdminDashboard />
        </Suspense>
      </div>
    );
  }

  // Creator: uniquement son dashboard
  if (user?.role === 'creator') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <CreatorDashboard />
      </Suspense>
    );
  }

  // Sécurité — Empêcher un parent de voir une page admin même si le store est désynchronisé
  if (user?.role === 'parent') {
    const parentPages = ['parent_dashboard', 'parent_historique', 'parent_recus', 'parent_badges', 'chat', 'annonces', 'parent_notes', 'parent_courses', 'parent_parametres'];
    if (!parentPages.includes(currentPage as any)) {
      return <ParentDashboard />;
    }

    // Verrou de licence : si au moins un enfant lié n'a pas de licence active et que la
    // période de grâce de 14 jours est dépassée, on bloque TOUTE l'interface parent (pas
    // seulement le tableau de bord) — ParentDashboard affiche alors lui-même l'écran de
    // verrouillage non-fermable par-dessus son propre contenu flouté.
    const graceExpiryMs = user.created_at ? new Date(user.created_at).getTime() + 14 * 24 * 60 * 60 * 1000 : 0;
    const isWithinGracePeriod = Date.now() < graceExpiryMs;
    const hasUnlicensedChild = students.some((s) => (s.licenseStatus || 'inactive') !== 'active');
    if (hasUnlicensedChild && !isWithinGracePeriod && currentPage !== 'parent_dashboard') {
      return <ParentDashboard />;
    }
  }

  if (user?.role === 'superviseur' || user?.role === 'surveillant') {
    const superviseurPages = ['scan_presence', 'scan_sortie', 'scan_information', 'carte_scolaire'];
    if (!superviseurPages.includes(currentPage as any)) {
      return <ScanPresence />;
    }
  }

  if (user?.role === 'enseignant') {
    const teacherPages = ['saisie_notes', 'selection_enseignant'];
    if (!teacherPages.includes(currentPage as any)) {
      const selectedTeacherName = localStorage.getItem('selected_teacher_name');
      return (
        <Suspense fallback={<LoadingSpinner />}>
          {selectedTeacherName ? <SaisieNotes /> : <SelectionEnseignant />}
        </Suspense>
      );
    }
  }

  return (
    <div key={currentPage} className="page-transition-running">
      <Suspense fallback={<LoadingSpinner />}>
        {(() => {
          switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'eleves': return <Eleves />;
            case 'paiements': return <Paiements />;
            case 'retraits': return <Retraits />;
            case 'analyses': return <Analyses />;
            case 'recouvrement': return <Recouvrement />;
            case 'documents': return <Documents />;
            case 'parametres': return <Parametres />;
            case 'scan_presence': return <ScanPresence />;
            case 'scan_sortie': return <ScanSortie />;
            case 'scan_information': return <ScanInformation />;
            case 'carte_scolaire': return <CarteScolaire />;
            case 'carte_examen': return <CarteExamen />;
            case 'gestion_academique': return <GestionAcademique />;
            case 'gestion_annees_scolaires': return <GestionAnneesScolaires />;
            case 'saisie_notes': return <SaisieNotes />;
            case 'selection_enseignant': return <SelectionEnseignant />;
            case 'bulletins': return <Bulletins />;
            case 'verification_recu': return <VerificationRecu />;
            case 'rapports_academiques': return <RapportsAcademiques />;
            case 'historique_activites': return <HistoriqueActivites />;
            case 'parent_dashboard': return <ParentDashboard />;
            case 'parent_historique': return <ParentHistorique />;
            case 'parent_recus': return <ParentRecus />;
            case 'parent_badges': return <ParentBadges />;
            case 'parent_messages': return <ParentMessages />;
            case 'parent_notes': return <ParentNotes />;
            case 'parent_courses': return <ParentCourses />;
            case 'parent_parametres': return <ParentSettings />;
            case 'parents_list': return <ParentsList />;
            case 'import_export': return <ImportExport />;
            case 'chat': return <ChatWindow />;
            case 'annonces': return <Annonces />;
            case 'superadmin_dashboard':
            case 'superadmin_schools':
            case 'superadmin_billing':
              return <SuperAdminDashboard />;
            default: return user?.role === 'parent' ? <ParentDashboard /> : <Dashboard />;
          }
        })()}
      </Suspense>
    </div>
  );
};

import { useGridToggle } from './hooks/useGridToggle';

const pageMetadata: Record<string, Record<string, { title: string; description: string }>> = {
  fr: {
    home: {
      title: "DGhubSchool — Plateforme de Gestion Scolaire et Financière en Ligne",
      description: "DGhubSchool est la solution moderne et complète en ligne pour la gestion de votre établissement d'enseignement. Suivez les inscriptions des élèves, organisez les classes et les enseignants, gérez le recouvrement des frais scolaires, et automatisez la génération des reçus financiers et des bulletins scolaires en format PDF."
    },
    features: {
      title: "Fonctionnalités DGhubSchool — Gestion Administrative et Financière",
      description: "Découvrez les fonctionnalités avancées de DGhubSchool : enregistrement des paiements, recouvrement des frais, génération de reçus PDF, saisie de notes, édition automatisée de bulletins scolaires et portail parents complet."
    },
    pricing: {
      title: "Tarifs DGhubSchool — Plans d'Abonnement Flexibles et Période d'Essai",
      description: "Consultez les tarifs de DGhubSchool. Nous proposons des forfaits mensuels et annuels transparents, adaptés à la taille et au nombre d'élèves de votre école, avec une période d'essai gratuite sans engagement."
    },
    'a-propos': {
      title: "À Propos de DGhubSchool — Notre Mission pour l'Éducation",
      description: "En savoir plus sur l'équipe derrière DGhubSchool. Nous développons des outils innovants pour simplifier la gestion des écoles et améliorer la communication avec les parents."
    },
    newsroom: {
      title: "Newsroom DGhubSchool — Actualités et Mises à Jour",
      description: "Suivez les dernières actualités, guides de gestion scolaire, et nouveautés sur la plateforme DGhubSchool."
    },
    'centre-aide': {
      title: "Centre d'Aide DGhubSchool — Support et Tutoriels",
      description: "Trouvez des réponses à toutes vos questions sur DGhubSchool. Consultez nos guides d'utilisation, FAQ et contactez notre support technique."
    },
    login: {
      title: "Connexion — DGhubSchool",
      description: "Connectez-vous à votre espace DGhubSchool pour gérer votre établissement scolaire, vos finances ou suivre la scolarité de vos enfants."
    },
    'creer-compte': {
      title: "Créer un Compte École — DGhubSchool",
      description: "Inscrivez votre établissement sur DGhubSchool dès aujourd'hui et commencez à digitaliser vos opérations administratives et financières."
    },
    confidentialite: {
      title: "Politique de Confidentialité — DGhubSchool",
      description: "Consultez notre politique de confidentialité pour comprendre comment DGhubSchool protège et gère les données personnelles des élèves, parents et écoles."
    },
    'conditions-utilisation': {
      title: "Conditions Générales d'Utilisation — DGhubSchool",
      description: "Lisez les conditions d'utilisation de la plateforme DGhubSchool régissant l'accès à nos services de gestion scolaire."
    },
    'partager-mon-histoire': {
      title: "Partager mon Histoire avec DGhubSchool",
      description: "Partagez votre expérience d'utilisation de DGhubSchool et témoignez de l'impact de notre plateforme sur la gestion de votre école."
    },
    'activation-licence': {
      title: "Activation de Licence — DGhubSchool",
      description: "Activez la licence annuelle de votre école sur DGhubSchool pour débloquer toutes les fonctionnalités premium de gestion scolaire."
    },
    'portail-ecole': {
      title: "Portail École — Accès DGhubSchool",
      description: "Recherchez et accédez directement à l'espace de connexion dédié de votre établissement scolaire sur DGhubSchool."
    }
  },
  en: {
    home: {
      title: "DGhubSchool — School and Financial Management Online Platform",
      description: "DGhubSchool is the modern and complete online solution for school administration and financial management. Track student enrollment, manage tuition fee collection, and automate the generation of receipts and PDF report cards."
    },
    features: {
      title: "DGhubSchool Features — Administrative and Financial Tools",
      description: "Explore all the advanced features of DGhubSchool: tuition tracking, automated billing, PDF receipt generation, grades entry, automated report card creation, and parent portal."
    },
    pricing: {
      title: "DGhubSchool Pricing — Flexible SaaS Plans and Free Trial",
      description: "Check out our transparent subscription plans for DGhubSchool. We offer monthly and annual pricing scaled to your school's size, with a risk-free 30-day trial period."
    },
    'a-propos': {
      title: "About DGhubSchool — Our Mission for Modern Education",
      description: "Learn about the team and story behind DGhubSchool. We design innovative cloud software solutions to simplify school administration and strengthen parent-school communication."
    },
    newsroom: {
      title: "Newsroom and Updates — DGhubSchool Press and Blog",
      description: "Read the latest news from DGhubSchool. Get platform announcements, product updates, partnership news, and expert articles on administrative and financial management in schools."
    },
    'centre-aide': {
      title: "Help Center and Technical Support — DGhubSchool Documentation",
      description: "Need help? Search the DGhubSchool help center for user documentation, step-by-step setup tutorials, FAQs, and to contact our dedicated customer support team."
    },
    login: {
      title: "Login — DGhubSchool",
      description: "Log in to your DGhubSchool space to manage your school, finances, or track your children's schooling."
    },
    'creer-compte': {
      title: "Create a School Account — DGhubSchool",
      description: "Create an account for your educational institution on DGhubSchool. Sign up in minutes to start your risk-free 30-day free trial and digitize your school."
    },
    confidentialite: {
      title: "Privacy Policy and Data Protection — DGhubSchool",
      description: "Read the privacy policy of DGhubSchool. Learn how we collect, store, secure, and process personal data for schools, students, parents, and teachers."
    },
    'conditions-utilisation': {
      title: "Terms of Service (ToS) — DGhubSchool User Agreement",
      description: "Review the terms of service of the DGhubSchool platform governing use of our SaaS software by schools, parents, teachers, and staff members."
    },
    'partager-mon-histoire': {
      title: "Share Your Success Story — DGhubSchool Testimonials",
      description: "Share your experience with DGhubSchool. Tell us how our software helped your school improve fee collections, automate report cards, and simplify operations."
    },
    'activation-licence': {
      title: "School License Activation — DGhubSchool Annual Plan",
      description: "Activate your school's annual subscription on DGhubSchool. Enter your activation code or complete your payment online to access all platform features."
    },
    'portail-ecole': {
      title: "Partner Schools Directory — DGhubSchool Portal Access",
      description: "Find the custom login page of your educational institution on DGhubSchool. Use our directory or search tool to access your dedicated school portal."
    }
  }
};

export function App() {
  useGridToggle();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
  const fetchAllFromBackend = useStore((s) => s.fetchAllFromBackend);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Synchronisation du thème sur document.documentElement
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
        setTheme('dark');
      } else {
        root.classList.remove('dark');
        setTheme('light');
      }
    }
  }, [theme, setTheme]);

  // Écoute de l'état de la connexion Internet
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dynamisation des balises SEO (Lang, Canonical, Hreflang alternates & x-default)
  React.useEffect(() => {
    const parts = location.pathname.split('/');
    const currentLang = parts[1] === 'en' ? 'en' : 'fr';
    const pathWithoutLang = '/' + parts.slice(2).join('/');
    const cleanPath = location.pathname.endsWith('/') && location.pathname !== '/'
      ? location.pathname.slice(0, -1)
      : location.pathname;
    
    // Mettre à jour le HTML lang
    document.documentElement.lang = currentLang;

    // Mettre à jour la balise canonical
    const canonicalHref = `https://dghubschool.com${cleanPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // Mettre à jour og:url et twitter:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalHref);
    }
    let twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', canonicalHref);
    }

    // Mettre à jour/créer les balises hreflang alternates (fr, en, x-default)
    const pagePath = pathWithoutLang === '/' ? '' : pathWithoutLang;
    
    const updateHreflang = (lang: string, href: string) => {
      let el = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'alternate');
        el.setAttribute('hreflang', lang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    updateHreflang('fr', `https://dghubschool.com/fr${pagePath}`);
    updateHreflang('en', `https://dghubschool.com/en${pagePath}`);
    updateHreflang('x-default', `https://dghubschool.com/fr${pagePath}`);

    // Mettre à jour le titre du document et les meta tags de description/OG/Twitter
    const pageKey = pagePath.replace(/^\//, '') || 'home';
    const meta = pageMetadata[currentLang]?.[pageKey] || pageMetadata[currentLang]?.home;
    if (meta) {
      document.title = meta.title;

      const updateMeta = (name: string, content: string, isProperty = false) => {
        const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          if (isProperty) {
            el.setAttribute('property', name);
          } else {
            el.setAttribute('name', name);
          }
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      updateMeta('description', meta.description);
      updateMeta('og:title', meta.title, true);
      updateMeta('twitter:title', meta.title);
      updateMeta('og:description', meta.description, true);
      updateMeta('twitter:description', meta.description);
    }
  }, [location.pathname]);

  // Redirect logic to add default lang prefix if missing
  React.useEffect(() => {
    const parts = location.pathname.split('/');
    const firstSegment = parts[1];
    if (firstSegment !== 'fr' && firstSegment !== 'en') {
      const rest = location.pathname === '/' ? '' : location.pathname;
      navigate(`/fr${rest}${location.search}${location.hash}`, { replace: true });
    }
  }, [location.pathname, navigate, location.search, location.hash]);

  // Redirect logic based on login state
  React.useEffect(() => {
    const parts = location.pathname.split('/');
    const currentLang = parts[1];
    if (currentLang !== 'fr' && currentLang !== 'en') return;

    const pathWithoutLang = '/' + parts.slice(2).join('/');
    
    if (isAuthenticated) {
      if (
        ['/login', '/portail-ecole', '/creer-compte', '/confirmer-email', '/pricing', '/a-propos', '/features', '/activation-licence', '/partager-mon-histoire'].includes(pathWithoutLang) ||
        pathWithoutLang.startsWith('/login/') ||
        pathWithoutLang.startsWith('/portail-ecole/')
      ) {
        navigate(`/${currentLang}/app`, { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // ── Chargement des paramètres publics (Logo, Nom App) ────────
  React.useEffect(() => {
    useStore.getState().fetchPublicSettings();
  }, []);

  // ── Initialisation Web Push (Uniquement pour les Rôles supportant les Pushs) ──
  React.useEffect(() => {
    if (isAuthenticated && user && user.role !== 'superadmin' && user.role !== 'creator') {
      webPushService.init();
    }
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    // ── Synchronisation Manuelle Uniquement ──────────────────────
    // On ne fait qu'un fetch initial au chargement de l'app.
    // La suite sera gérée manuellement par l'utilisateur via le bouton Sync.
    if (isOnline) {
      fetchAllFromBackend();
    }

    return () => {
      // Nettoyage si nécessaire
    };
  }, [isAuthenticated, fetchAllFromBackend, isOnline]);

  // ── Écoute des messages du Service Worker (navigation depuis push) ──
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NAVIGATE') {
        const notifType: string = event.data.notifType || 'general';
        const store = useStore.getState();
        const user = store.user;
        if (!user || user.role !== 'parent') return;

        const pageMap: Record<string, string> = {
          message:      'chat',
          announcement: 'annonces',
          payment:      'parent_historique',
          presence:     'parent_dashboard',
          general:      'parent_dashboard',
        };
        const targetPage = pageMap[notifType] || 'parent_dashboard';
        store.setCurrentPage(targetPage as any);
        if (navigator.onLine) {
          store.fetchAllFromBackend();
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
  }, []);

  // Affichage de la page offline si pas d'Internet
  if (!isOnline) {
    return <Suspense fallback={<LoadingSpinner />}><OfflinePage onRetry={() => setIsOnline(navigator.onLine)} /></Suspense>;
  }

  const subscriptionBlockedMessage = useStore((s) => s.subscriptionBlockedMessage);
  const logout = useStore((s) => s.logout);

  // Détermination de la langue courante pour les navigations post-logout
  const currentLang = location.pathname.split('/')[1] === 'en' ? 'en' : 'fr';

  if (isAuthenticated && subscriptionBlockedMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-['Poppins']">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
            Accès Établissement Bloqué
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {subscriptionBlockedMessage}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                logout();
                navigate(`/${currentLang}/pricing`);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Consulter les Tarifs
            </button>
            <button
              onClick={() => {
                logout();
                navigate(`/${currentLang}/login`);
              }}
              className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Se déconnecter
            </button>
            <a
              href="mailto:support@dghubschool.com"
              className="text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-wider block pt-2"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Prefixed routes */}
        <Route path="/:lang/confidentialite" element={<Suspense fallback={<LoadingSpinner />}><Confidentialite /></Suspense>} />
        <Route path="/:lang/conditions-utilisation" element={<Suspense fallback={<LoadingSpinner />}><ConditionsUtilisation /></Suspense>} />
        <Route 
          path="/:lang/parent/exercices" 
          element={
            isAuthenticated ? (
              <Suspense fallback={<LoadingSpinner />}>
                <ParentCourses />
              </Suspense>
            ) : (
              <RedirectToLogin />
            )
          } 
        />
        <Route path="/:lang/parent/courses" element={<RedirectWithLang to="/parent/exercices" />} />
        <Route 
          path="/:lang/parent/kids-place" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <KidsPlace />
            </Suspense>
          } 
        />
        <Route path="/:lang/confirmer-email" element={<Suspense fallback={<LoadingSpinner />}><ConfirmerEmail /></Suspense>} />
        <Route path="/:lang/portail-ecole" element={<Suspense fallback={<LoadingSpinner />}><PortailEcole /></Suspense>} />
        <Route path="/:lang/portail-ecole/:schoolSlug" element={<Suspense fallback={<LoadingSpinner />}><PortailEcole /></Suspense>} />
        <Route path="/:lang/creer-compte" element={<Suspense fallback={<LoadingSpinner />}><CreerCompte /></Suspense>} />
        <Route path="/:lang/pricing" element={<Suspense fallback={<LoadingSpinner />}><Pricing /></Suspense>} />
        <Route path="/:lang/a-propos" element={<Suspense fallback={<LoadingSpinner />}><APropos /></Suspense>} />
        <Route path="/:lang/features" element={<Suspense fallback={<LoadingSpinner />}><Features /></Suspense>} />
        <Route path="/:lang/newsroom" element={<Suspense fallback={<LoadingSpinner />}><Newsroom /></Suspense>} />
        <Route path="/:lang/centre-aide" element={<Suspense fallback={<LoadingSpinner />}><HelpCenter /></Suspense>} />
        <Route path="/:lang/mot-de-passe-oublie" element={<Suspense fallback={<LoadingSpinner />}><ForgotPasswordParent /></Suspense>} />
        <Route path="/:lang/mot-de-passe-oublie-ecole" element={<Suspense fallback={<LoadingSpinner />}><ForgotPasswordSchool /></Suspense>} />
        <Route path="/:lang/reset-password" element={<Suspense fallback={<LoadingSpinner />}><ResetPassword /></Suspense>} />
        <Route path="/:lang/activation-licence" element={<Suspense fallback={<LoadingSpinner />}><ActivationLicence /></Suspense>} />
        <Route path="/:lang/partager-mon-histoire" element={<Suspense fallback={<LoadingSpinner />}><SubmitStory /></Suspense>} />
        <Route
          path="/:lang/login"
          element={
            shouldRedirectToAppDomain ? <RedirectToAppDomain /> :
            isAuthenticated ? <RedirectToApp /> : <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>
          }
        />
        <Route
          path="/:lang/login/:schoolSlug"
          element={
            shouldRedirectToAppDomain ? <RedirectToAppDomain /> :
            isAuthenticated ? <RedirectToApp /> : <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>
          }
        />
        <Route
          path="/:lang/app"
          element={
            shouldRedirectToAppDomain ? <RedirectToAppDomain /> :
            isAuthenticated ? (
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <PageContent />
                </Suspense>
                <AnnouncementPopup />
              </Layout>
            ) : (
              <RedirectToLogin />
            )
          } 
        />
        <Route
          path="/:lang"
          element={
            (isCapacitor || isAppSubdomain) ? (
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <PageContent />
                  </Suspense>
                  <AnnouncementPopup />
                </Layout>
              ) : (
                <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>
              )
            ) : (
              <Suspense fallback={<LoadingSpinner />}><LandingPage /></Suspense>
            )
          }
        />

        {/* Non-prefixed fallback routes to prevent blank screen collisions */}
        <Route path="/confidentialite" element={<Navigate to="/fr/confidentialite" replace />} />
        <Route path="/conditions-utilisation" element={<Navigate to="/fr/conditions-utilisation" replace />} />
        <Route path="/confirmer-email" element={<RedirectWithSearch to="/fr/confirmer-email" />} />
        <Route path="/portail-ecole" element={<Navigate to="/fr/portail-ecole" replace />} />
        <Route path="/creer-compte" element={<Navigate to="/fr/creer-compte" replace />} />
        <Route path="/pricing" element={<Navigate to="/fr/pricing" replace />} />
        <Route path="/a-propos" element={<Navigate to="/fr/a-propos" replace />} />
        <Route path="/features" element={<Navigate to="/fr/features" replace />} />
        <Route path="/newsroom" element={<Navigate to="/fr/newsroom" replace />} />
        <Route path="/centre-aide" element={<Navigate to="/fr/centre-aide" replace />} />
        <Route path="/login" element={<Navigate to="/fr/login" replace />} />
        <Route path="/mot-de-passe-oublie" element={<Navigate to="/fr/mot-de-passe-oublie" replace />} />
        <Route path="/mot-de-passe-oublie-ecole" element={<Navigate to="/fr/mot-de-passe-oublie-ecole" replace />} />
        <Route path="/reset-password" element={<RedirectWithSearch to="/fr/reset-password" />} />
        <Route path="/activation-licence" element={<RedirectWithSearch to="/fr/activation-licence" />} />
        <Route path="/partager-mon-histoire" element={<Navigate to="/fr/partager-mon-histoire" replace />} />

        <Route path="/stats" element={<Navigate to="/fr#stats" replace />} />
        <Route path="/fr/stats" element={<Navigate to="/fr#stats" replace />} />
        <Route path="/en/stats" element={<Navigate to="/en#stats" replace />} />

        <Route path="/" element={<Navigate to="/fr" replace />} />
        <Route path="*" element={<Suspense fallback={<LoadingSpinner />}><NotFound /></Suspense>} />
      </Routes>
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </>
  );
}
