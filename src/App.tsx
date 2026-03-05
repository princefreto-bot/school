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
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ParentHistorique } from './pages/parent/ParentHistorique';
import { ParentRecus } from './pages/parent/ParentRecus';
import { ParentBadges } from './pages/parent/ParentBadges';
import { ParentMessages } from './pages/parent/ParentMessages';
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
    case 'parent_dashboard': return <ParentDashboard />;
    case 'parent_historique': return <ParentHistorique />;
    case 'parent_recus': return <ParentRecus />;
    case 'parent_badges': return <ParentBadges />;
    case 'parent_messages': return <ParentMessages />;
    case 'chat': return <ChatWindow />;
    default: return <Dashboard />;
  }
};

export function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <PageContent />
    </Layout>
  );
}
