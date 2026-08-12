import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import StubPage from './components/StubPage';
import { AuthProvider } from './auth/AuthContext';
import Dashboard from './pages/Dashboard';
import SsoPage from './pages/SsoPage';
import Personnes from './pages/Personnes';
import PersonDetail from './pages/PersonDetail';
import Sources from './pages/Sources';
import AClasser from './pages/AClasser';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/sso" element={<SsoPage />} />
                <Route
                    element={
                        <RequireAuth>
                            <Layout />
                        </RequireAuth>
                    }
                >
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/personnes" element={<Personnes />} />
                    <Route path="/personnes/:id" element={<PersonDetail />} />
                    <Route path="/correspondances" element={<StubPage title="Correspondances" note="Arrive en phase M3 avec le moteur de corrélation automatique." />} />
                    <Route path="/a-classer" element={<AClasser />} />
                    <Route path="/doublons" element={<StubPage title="Doublons" note="Arrive en phase M4." />} />
                    <Route path="/documents" element={<StubPage title="Documents" note="Arrive en phase M4 (PDF/images)." />} />
                    <Route path="/relations" element={<StubPage title="Relations" note="Arrive en phase M5." />} />
                    <Route
                        path="/localisations"
                        element={<StubPage title="Localisations" note="Réservé au personnel adulte — jamais aux élèves. Arrive en phase M5." />}
                    />
                    <Route path="/sources" element={<Sources />} />
                    <Route path="/historique" element={<StubPage title="Historique" />} />
                    <Route path="/parametres" element={<StubPage title="Paramètres" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}
