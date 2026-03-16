import React, { useState, useEffect } from 'react';
import { parseResponse, getAuthHeaders } from '../services/apiHelpers';
import { useStore } from '../store/useStore';
import { AppPage } from '../types';
import { getFilteredNavItems } from '../utils/rolePermissions';
import {
  GraduationCap, LayoutDashboard, Users, CreditCard,
  BarChart3, FileText, Settings, LogOut, Menu, X,
  Bell, ChevronRight, Target, Award, MessageSquare,
  ScanLine, IdCard, ShieldCheck, Activity, Database, Megaphone,
  BookOpen, Edit3, FileSpreadsheet, Sun, Moon, Clock
} from 'lucide-react';

interface NavItem { id: AppPage; label: string; icon: React.ReactNode; badge?: number }

const NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'eleves', label: 'Élèves', icon: <Users className="w-5 h-5" /> },
  { id: 'parents_list', label: 'Parents', icon: <Users className="w-5 h-5 text-emerald-500" /> },
  { id: 'paiements', label: 'Paiements', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'recouvrement', label: 'Recouvrement', icon: <Target className="w-5 h-5 text-red-500" /> },
  { id: 'scan_presence', label: 'Scan Présence', icon: <ScanLine className="w-5 h-5 text-cyan-500" /> },
  { id: 'scan_sortie', label: 'Scan Sortie', icon: <ScanLine className="w-5 h-5 text-orange-500" /> },
  { id: 'carte_scolaire', label: 'Cartes Scolaires', icon: <IdCard className="w-5 h-5 text-indigo-500" /> },
  { id: 'gestion_academique', label: 'Gest. Académique', icon: <BookOpen className="w-5 h-5 text-fuchsia-500" /> },
  { id: 'saisie_notes', label: 'Saisie Notes', icon: <Edit3 className="w-5 h-5 text-rose-500" /> },
  { id: 'bulletins', label: 'Bulletins', icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" /> },
  { id: 'verification_recu', label: 'Vérif. Reçus', icon: <ShieldCheck className="w-5 h-5 text-purple-500" /> },
  { id: 'analyses', label: 'Analyses', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  { id: 'historique_activites', label: 'Historique', icon: <Activity className="w-5 h-5 text-slate-500" /> },
  { id: 'chat', label: 'Messagerie', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'annonces', label: 'Annonces', icon: <Megaphone className="w-5 h-5 text-purple-500" /> },
  { id: 'import_export', label: 'Base de données', icon: <Database className="w-5 h-5 text-amber-500" /> },
  { id: 'parametres', label: 'Paramètres', icon: <Settings className="w-5 h-5" /> },
];

const PARENT_NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { id: 'parent_dashboard', label: 'Dashboard Parent', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'parent_historique', label: 'Historique paiements', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'parent_recus', label: 'Mes reçus', icon: <FileText className="w-5 h-5" /> },
  { id: 'parent_badges', label: 'Mes badges', icon: <Award className="w-5 h-5" /> },
  { id: 'chat', label: 'Messagerie', icon: <MessageSquare className="w-5 h-5" /> },
];

// ── Sidebar Items (component défini hors Layout pour éviter remontage) ──────
interface SidebarItemsProps {
  currentPage: AppPage;
  setCurrentPage: (p: AppPage) => void;
  setSidebarOpen: (v: boolean) => void;
  navItems: NavItem[];
}
const SidebarItems: React.FC<SidebarItemsProps> = ({
  currentPage, setCurrentPage, setSidebarOpen, navItems,
}) => (
  <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {navItems.map((item) => {
      const active = currentPage === item.id;
      return (
        <button
          key={item.id}
          onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
        >
          <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}>
            {item.icon}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          {active && <ChevronRight className="w-3 h-3 ml-auto" />}
        </button>
      );
    })}
  </nav>
);

// ── Sidebar Content complet (défini hors Layout) ─────────────
interface SidebarContentProps {
  currentPage: AppPage;
  setCurrentPage: (p: AppPage) => void;
  setSidebarOpen: (v: boolean) => void;
  navItems: NavItem[];
  schoolName: string;
  appName: string;
  schoolLogo: string | null;
  userName: string;
  userRole: string;
  connectedParentsCount: number;
  logout: () => void;
}
const SidebarContent: React.FC<SidebarContentProps> = ({
  currentPage, setCurrentPage, setSidebarOpen, navItems,
  schoolName, appName, schoolLogo, userName, userRole, connectedParentsCount, logout,
}) => (
  <div className="flex flex-col h-full">
    {/* Logo + Nom app */}
    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-blue-600">
        {schoolLogo ? (
          <img
            src={schoolLogo}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <GraduationCap className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="overflow-hidden">
        <p className="text-white font-bold text-sm truncate">{appName} v1.5</p>
        <p className="text-slate-400 text-xs truncate">{schoolName}</p>
      </div>
    </div>

    {/* Navigation */}
    <SidebarItems
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      setSidebarOpen={setSidebarOpen}
      navItems={navItems}
    />

    {/* Section Parents Connectés (pour Admin) */}
    {userRole !== 'parent' && (
      <div className="px-5 py-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-bold">{connectedParentsCount} Parents</span>
          </div>
        </div>
        <button
          onClick={() => { setCurrentPage('parents_list'); setSidebarOpen(false); }}
          className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between group"
        >
          Voir les comptes
          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
        </button>
      </div>
    )}

    {/* Utilisateur */}
    <div className="px-3 py-4 border-t border-slate-700/50 pb-24 lg:pb-4">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-700/30 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="text-white text-xs font-medium truncate">{userName}</p>
          <p className="text-slate-400 text-xs capitalize">{userRole}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-semibold group"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
          <LogOut className="w-4 h-4" />
        </div>
        Déconnexion
      </button>
    </div>
  </div>
);

// ── LAYOUT PRINCIPAL ─────────────────────────────────────────

const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lomeTime = time.toLocaleTimeString('fr-FR', {
    timeZone: 'Africa/Lome',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const lomeDate = time.toLocaleDateString('fr-FR', {
    timeZone: 'Africa/Lome',
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="hidden md:flex flex-col items-start px-4 border-l-2 border-blue-500/20 ml-2">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black tracking-tighter tabular-nums text-sm">
        <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
        <span>{lomeTime}</span>
      </div>
      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">{lomeDate} — LOMÉ</p>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const schoolName = useStore((s) => s.schoolName);
  const schoolYear = useStore((s) => s.schoolYear);
  const students = useStore((s) => s.students);
  const appName = useStore((s) => s.appName);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const parents = useStore((s) => s.parents);
  const connectedParentsCount = useStore((s) => s.connectedParentsCount);
  const setConnectedParentsCount = useStore((s) => s.setConnectedParentsCount);
  const unreadMessages = useStore((s) => s.unreadMessages);
  const fetchUnreadMessages = useStore((s) => s.fetchUnreadMessages);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  // Appliquer la classe dark au document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync automatique et récupération du vrai compteur de parents
  useEffect(() => {
    if (user?.role !== 'parent') {
      // 1. Sync students (non-bloquant, avec timeout court)
      if (students.length > 0) {
        import('../services/backendSync').then(({ syncToBackend }) => {
          const timer = setTimeout(() => {
            syncToBackend({ students, parents }).catch(() => {
              // Fail silently, backend peut être down
            });
          }, 100);
          return () => clearTimeout(timer);
        });
      }

      // 2. Récupérer le vrai nombre de parents inscrits (Polling toutes les 30s)
      const fetchActiveCount = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(`/api/parent/active-count`, {
            signal: controller.signal,
            headers: getAuthHeaders()
          }).finally(() => clearTimeout(timeoutId));
          if (res.ok) {
            const data = await parseResponse(res);
            setConnectedParentsCount(data.count || 0);
          }
        } catch (err) {
          // Backend indisponible - pas grave, on continue
        }
      };

      fetchActiveCount();
      const interval = setInterval(fetchActiveCount, 30000);
      return () => clearInterval(interval);
    }
  }, [students, parents, user?.role, setConnectedParentsCount]);

  // Fetch unread messages for parents
  useEffect(() => {
    if (user?.role === 'parent') {
      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role, fetchUnreadMessages]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nonSoldes = students.filter((s) => s.status !== 'Soldé').length;

  const isParent = user?.role === 'parent';
  const baseNavItems = isParent ? PARENT_NAV_ITEMS : NAV_ITEMS;

  // Filtrer les items par rôle
  const filteredItems = getFilteredNavItems(user?.role, baseNavItems) as Omit<NavItem, 'badge'>[];

  const navItems: NavItem[] = filteredItems.map((item) => ({
    ...item,
    badge: item.id === 'eleves' && nonSoldes > 0 ? nonSoldes : item.id === 'chat' && unreadMessages > 0 ? unreadMessages : undefined,
  }));

  const currentLabel = [...NAV_ITEMS, ...PARENT_NAV_ITEMS].find((n) => n.id === currentPage)?.label ?? '';

  const sidebarProps: SidebarContentProps = {
    currentPage,
    setCurrentPage,
    setSidebarOpen,
    navItems,
    schoolName,
    appName,
    schoolLogo,
    userName: user?.nom ?? '',
    userRole: user?.role ?? '',
    connectedParentsCount,
    logout,
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 sidebar-premium fixed inset-y-0 left-0 z-30 print:hidden border-r border-white/5">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 z-50">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen print:ml-0 print:bg-white pb-16 lg:pb-0">
        {/* Topbar */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm print:hidden transition-colors">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{currentLabel}</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Session {schoolYear} — Management
                </p>
              </div>
              <RealTimeClock />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95 shadow-inner"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                onClick={logout}
                className="lg:hidden p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 transition-all hover:scale-110 active:scale-95"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
              {!isParent && (
                <>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5">
                    <Users className="w-3 h-3" />
                    <span>{students.length} élève{students.length !== 1 ? 's' : ''}</span>
                  </div>
                  {nonSoldes > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                      <Bell className="w-3 h-3" />
                      <span className="hidden sm:inline">{nonSoldes} non soldé{nonSoldes !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-auto print:p-0 print:overflow-visible page-enter">
          {children}
        </main>

        {/* Bottom Navigation for Mobile (Native App Style) */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${sidebarOpen ? 'hidden' : 'flex'}`}>
          {[
            { id: isParent ? 'parent_dashboard' : 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: isParent ? 'parent_historique' : 'eleves', label: isParent ? 'Historique' : 'Élèves', icon: isParent ? <CreditCard className="w-5 h-5" /> : <Users className="w-5 h-5" /> },
            { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessages },
            { id: isParent ? 'parent_recus' : 'parametres', label: isParent ? 'Recus' : 'Config', icon: isParent ? <FileText className="w-5 h-5" /> : <Settings className="w-5 h-5" /> },
          ].map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as AppPage)}
                className={`relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
                  active ? 'text-blue-600 dark:text-blue-400 font-bold scale-110' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute top-2 right-3 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                {active && (
                  <div className="absolute -top-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
