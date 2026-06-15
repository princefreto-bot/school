// ============================================================
// APP — Point d'entrée principal
// ============================================================
import React, { Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { webPushService } from './services/webPushService';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Confidentialite } from './pages/Confidentialite';
import { PortailEcole } from './pages/PortailEcole';
import { CreerCompte } from './pages/CreerCompte';
import { ConditionsUtilisation } from './pages/ConditionsUtilisation';
import { ConfirmerEmail } from './pages/ConfirmerEmail';
import { OfflinePage } from './pages/OfflinePage';


// Lazy loading for pages to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Eleves = lazy(() => import('./pages/Eleves').then(m => ({ default: m.Eleves })));
const Paiements = lazy(() => import('./pages/Paiements').then(m => ({ default: m.Paiements })));
const Analyses = lazy(() => import('./pages/Analyses').then(m => ({ default: m.Analyses })));
const Documents = lazy(() => import('./pages/Documents').then(m => ({ default: m.Documents })));
const Parametres = lazy(() => import('./pages/Parametres').then(m => ({ default: m.Parametres })));
const Recouvrement = lazy(() => import('./pages/Recouvrement').then(m => ({ default: m.Recouvrement })));
const ScanPresence = lazy(() => import('./pages/ScanPresence').then(m => ({ default: m.ScanPresence })));
const ScanSortie = lazy(() => import('./pages/ScanSortie').then(m => ({ default: m.ScanSortie })));
const ScanInformation = lazy(() => import('./pages/ScanInformation'));
const CarteScolaire = lazy(() => import('./pages/CarteScolaire').then(m => ({ default: m.CarteScolaire })));
const GestionAcademique = lazy(() => import('./pages/GestionAcademique' /* */).then(m => ({ default: m.GestionAcademique })));
const SaisieNotes = lazy(() => import('./pages/SaisieNotes' /* */).then(m => ({ default: m.SaisieNotes })));
const Bulletins = lazy(() => import('./pages/Bulletins').then(m => ({ default: m.Bulletins })));
const VerificationRecu = lazy(() => import('./pages/VerificationRecu').then(m => ({ default: m.VerificationRecu })));
const HistoriqueActivites = lazy(() => import('./pages/HistoriqueActivites').then(m => ({ default: m.HistoriqueActivites })));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const ParentHistorique = lazy(() => import('./pages/parent/ParentHistorique').then(m => ({ default: m.ParentHistorique })));
const ParentRecus = lazy(() => import('./pages/parent/ParentRecus').then(m => ({ default: m.ParentRecus })));
const ParentBadges = lazy(() => import('./pages/parent/ParentBadges').then(m => ({ default: m.ParentBadges })));
const ParentMessages = lazy(() => import('./pages/parent/ParentMessages').then(m => ({ default: m.ParentMessages })));
const ParentNotes = lazy(() => import('./pages/parent/ParentNotes').then(m => ({ default: m.ParentNotes })));
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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const PageContent: React.FC = () => {
  const currentPage = useStore((s) => s.currentPage);
  const user = useStore((s) => s.user);

  // SuperAdmin: uniquement ses pages
  if (user?.role === 'superadmin') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SuperAdminDashboard />
      </Suspense>
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
    const parentPages = ['parent_dashboard', 'parent_historique', 'parent_recus', 'parent_badges', 'chat', 'annonces', 'parent_notes'];
    if (!parentPages.includes(currentPage as any)) {
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

  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    case 'eleves': return <Eleves />;
    case 'paiements': return <Paiements />;
    case 'analyses': return <Analyses />;
    case 'recouvrement': return <Recouvrement />;
    case 'documents': return <Documents />;
    case 'parametres': return <Parametres />;
    case 'scan_presence': return <ScanPresence />;
    case 'scan_sortie': return <ScanSortie />;
    case 'scan_information': return <ScanInformation />;
    case 'carte_scolaire': return <CarteScolaire />;
    case 'gestion_academique': return <GestionAcademique />;
    case 'saisie_notes': return <SaisieNotes />;
    case 'selection_enseignant': return <SelectionEnseignant />;
    case 'bulletins': return <Bulletins />;
    case 'verification_recu': return <VerificationRecu />;
    case 'historique_activites': return <HistoriqueActivites />;
    case 'parent_dashboard': return <ParentDashboard />;
    case 'parent_historique': return <ParentHistorique />;
    case 'parent_recus': return <ParentRecus />;
    case 'parent_badges': return <ParentBadges />;
    case 'parent_messages': return <ParentMessages />;
    case 'parent_notes': return <ParentNotes />;
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
};

export function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
  const fetchAllFromBackend = useStore((s) => s.fetchAllFromBackend);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

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

  // Redirect logic based on login state
  React.useEffect(() => {
    const publicPaths = ['/', '/login', '/confidentialite', '/conditions-utilisation', '/portail-ecole', '/creer-compte', '/confirmer-email', '/pricing', '/a-propos'];
    if (isAuthenticated) {
      if (location.pathname === '/login' || location.pathname === '/portail-ecole' || location.pathname === '/creer-compte' || location.pathname === '/confirmer-email' || location.pathname === '/pricing' || location.pathname === '/a-propos') {
        navigate('/', { replace: true });
      }
    } else {
      if (!publicPaths.includes(location.pathname)) {
        navigate('/', { replace: true });
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
    return <OfflinePage onRetry={() => setIsOnline(navigator.onLine)} />;
  }

  return (
    <Routes>
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />
      <Route path="/confirmer-email" element={<ConfirmerEmail />} />
      <Route path="/portail-ecole" element={<PortailEcole />} />
      <Route path="/creer-compte" element={<CreerCompte />} />
      <Route path="/pricing" element={<Suspense fallback={<LoadingSpinner />}><Pricing /></Suspense>} />
      <Route path="/a-propos" element={<Suspense fallback={<LoadingSpinner />}><APropos /></Suspense>} />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <PageContent />
              </Suspense>
              <AnnouncementPopup />
            </Layout>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <LandingPage />
            </Suspense>
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
