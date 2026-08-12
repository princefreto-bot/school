import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import StubPage from './components/StubPage';
import { AuthProvider } from './auth/AuthContext';
import Dashboard from './pages/Dashboard';
import SsoPage from './pages/SsoPage';
import Personnes from './pages/Personnes';
import PersonDetail from './pages/PersonDetail';

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
                    <Route path="/correspondances" element={<StubPage title="Correspondances" />} />
                    <Route path="/a-classer" element={<StubPage title="À classer" />} />
                    <Route path="/doublons" element={<StubPage title="Doublons" />} />
                    <Route path="/documents" element={<StubPage title="Documents" />} />
                    <Route path="/relations" element={<StubPage title="Relations" />} />
                    <Route
                        path="/localisations"
                        element={<StubPage title="Localisations" note="Réservé au personnel adulte — jamais aux élèves." />}
                    />
                    <Route path="/sources" element={<StubPage title="Sources" />} />
                    <Route path="/historique" element={<StubPage title="Historique" />} />
                    <Route path="/parametres" element={<StubPage title="Paramètres" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}
