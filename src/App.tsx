// ============================================================
// APP — Point d'entrée principal
// ============================================================
import React, { Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { webPushService } from './services/webPushService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbsiocggltzdssfpsqqi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ic2lvY2dnbHR6ZHNzZnBzcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjcyMjMsImV4cCI6MjA4ODMwMzIyM30.bSIRRsJOhCKTgARqOcRPHYxtWzNAjY65JKKe8JRZUMU';
console.log('🔗 [Realtime] Initialisation de Supabase JS:', { url: !!supabaseUrl, key: !!supabaseAnonKey });
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
const ParentsList = lazy(() => import('./pages/ParentsList').then(m => ({ default: m.ParentsList })));
const ImportExport = lazy(() => import('./components/ImportExport').then(m => ({ default: m.ImportExport })));
const ChatWindow = lazy(() => import('./components/ChatWindow').then(m => ({ default: m.ChatWindow })));
const Annonces = lazy(() => import('./pages/Annonces').then(m => ({ default: m.Annonces })));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));

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

  // Sécurité — Empêcher un parent de voir une page admin même si le store est désynchronisé
  if (user?.role === 'parent') {
    const parentPages = ['parent_dashboard', 'parent_historique', 'parent_recus', 'parent_badges', 'chat', 'annonces'];
    if (!parentPages.includes(currentPage as any)) {
      return <ParentDashboard />;
    }
  }

  if (user?.role === 'superviseur' || user?.role === 'surveillant') {
    const superviseurPages = ['scan_presence', 'scan_sortie', 'carte_scolaire'];
    if (!superviseurPages.includes(currentPage as any)) {
      return <ScanPresence />;
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
    case 'carte_scolaire': return <CarteScolaire />;
    case 'gestion_academique': return <GestionAcademique />;
    case 'saisie_notes': return <SaisieNotes />;
    case 'bulletins': return <Bulletins />;
    case 'verification_recu': return <VerificationRecu />;
    case 'historique_activites': return <HistoriqueActivites />;
    case 'parent_dashboard': return <ParentDashboard />;
    case 'parent_historique': return <ParentHistorique />;
    case 'parent_recus': return <ParentRecus />;
    case 'parent_badges': return <ParentBadges />;
    case 'parent_messages': return <ParentMessages />;
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
  const fetchAllFromBackend = useStore((s) => s.fetchAllFromBackend);

  // ── Chargement des paramètres publics (Logo, Nom App) ────────
  React.useEffect(() => {
    useStore.getState().fetchPublicSettings();
  }, []);

  // ── Initialisation Web Push (Uniquement pour les Parents ou Web) ──
  React.useEffect(() => {
    if (isAuthenticated) {
      webPushService.init();
    }
  }, [isAuthenticated]);

  // ── Synchronisation Automatique (Temps Réel) ──────────────────
  // Parents : poll toutes les 15s pour être toujours à jour
  // Admin/Staff : poll toutes les 60s (moins critique)
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const user = useStore.getState().user;
    const isParent = user?.role === 'parent';

    // Premier fetch immédiat
    fetchAllFromBackend();

    const pollInterval = isParent ? 15000 : 60000;
    const interval = setInterval(() => {
      fetchAllFromBackend();
    }, pollInterval);

    // Activer Supabase Realtime si configuré
    let channel: any = null;
    let syncTimeout: any = null;
    if (supabase && user?.schoolSlug) {
      console.log('📡 [Realtime] Initialisation de l\'écoute pour le slug:', user.schoolSlug);
      channel = supabase
        .channel(`sync_${user.schoolSlug}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('🔔 [Realtime] Événement brut reçu de Supabase:', payload.table);
            // Filtrer uniquement les tables de cette école (ex: app_settings_myschool)
            if (payload.table && payload.table.endsWith(`_${user.schoolSlug}`)) {
              console.log(`⚡ [Realtime] Changement validé sur la table [${payload.table}] -> Lancement Sync avec Debounce (1.5s)`);
              
              if (syncTimeout) clearTimeout(syncTimeout);
              syncTimeout = setTimeout(() => {
                 console.log(`🔄 [Realtime] Exécution de la synchronisation...`);
                 fetchAllFromBackend(true);
              }, 1500);
              
            } else {
               console.log(`⏭️ [Realtime] Ignoré (ne correspond pas à l'école actuelle):`, payload.table);
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`📡 [Realtime] Statut d'abonnement: ${status}`);
          if (err) console.error(`❌ [Realtime] Erreur d'abonnement:`, err);
        });
    } else {
      console.warn('⚠️ [Realtime] Supabase n\'est pas initialisé ou schoolSlug manquant.', {
        hasSupabase: !!supabase,
        schoolSlug: user?.schoolSlug
      });
    }

    return () => {
      clearInterval(interval);
      if (syncTimeout) clearTimeout(syncTimeout);
      if (channel) supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchAllFromBackend]);

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
        store.fetchAllFromBackend();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <PageContent />
      </Suspense>
      <AnnouncementPopup />
    </Layout>
  );
}
