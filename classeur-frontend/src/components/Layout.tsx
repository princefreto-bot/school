import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/personnes', label: 'Personnes' },
    { to: '/correspondances', label: 'Correspondances' },
    { to: '/a-classer', label: 'À classer' },
    { to: '/doublons', label: 'Doublons' },
    { to: '/documents', label: 'Documents' },
    { to: '/relations', label: 'Relations' },
    { to: '/localisations', label: 'Localisations' },
    { to: '/sources', label: 'Sources' },
    { to: '/historique', label: 'Historique' },
    { to: '/parametres', label: 'Paramètres' },
];

export default function Layout() {
    const { operator, logout } = useAuth();

    return (
        <div className="app-shell">
            <aside className="app-nav">
                <div className="app-nav__brand">Classeur Intelligent</div>
                <nav>
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end} className="app-nav__link">
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="app-nav__footer">
                    <span>{operator?.displayName}</span>
                    <button onClick={logout}>Déconnexion</button>
                </div>
            </aside>
            <main className="app-content">
                <Outlet />
            </main>
        </div>
    );
}
