// ============================================================
// APP — Point d'entrée principal
// ============================================================
import React from 'react';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Eleves } from './pages/Eleves';
import { Paiements } from './pages/Paiements';
import { Analyses } from './pages/Analyses';
import { Documents } from './pages/Documents';
import { Parametres } from './pages/Parametres';
import { Recouvrement } from './pages/Recouvrement';
import { ScanPresence } from './pages/ScanPresence';
import { CarteScolaire } from './pages/CarteScolaire';
import { VerificationRecu } from './pages/VerificationRecu';
import { HistoriqueActivites } from './pages/HistoriqueActivites';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ParentHistorique } from './pages/parent/ParentHistorique';
import { ParentRecus } from './pages/parent/ParentRecus';
import { ParentBadges } from './pages/parent/ParentBadges';
import { ParentMessages } from './pages/parent/ParentMessages';
import { ParentsList } from './pages/ParentsList';
import { ChatWindow } from './components/ChatWindow';

const PageContent: React.FC = () => {
  const currentPage = useStore((s) => s.currentPage);

  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    case 'eleves': return <Eleves />;
    case 'paiements': return <Paiements />;
    case 'analyses': return <Analyses />;
    case 'recouvrement': return <Recouvrement />;
    case 'documents': return <Documents />;
    case 'parametres': return <Parametres />;
    case 'scan_presence': return <ScanPresence />;
    case 'carte_scolaire': return <CarteScolaire />;
    case 'verification_recu': return <VerificationRecu />;
    case 'historique_activites': return <HistoriqueActivites />;
    case 'parent_dashboard': return <ParentDashboard />;
    case 'parent_historique': return <ParentHistorique />;
    case 'parent_recus': return <ParentRecus />;
    case 'parent_badges': return <ParentBadges />;
    case 'parent_messages': return <ParentMessages />;
    case 'parents_list': return <ParentsList />;
    case 'chat': return <ChatWindow />;
    default: return <Dashboard />;
  }
};

export function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const fetchAllFromBackend = useStore((s) => s.fetchAllFromBackend);

  // ── Synchronisation Automatique (Temps Réel) ──────────────────
  // Permet de garder le mobile et le PC synchro sans action manuelle
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Premier fetch au montage
    fetchAllFromBackend();

    // Polling toutes les 10 secondes pour le "temps réel"
    const interval = setInterval(() => {
      fetchAllFromBackend();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchAllFromBackend]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <PageContent />
    </Layout>
  );
}
