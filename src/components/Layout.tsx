import React, { useState, useEffect } from 'react';
import { parseResponse, getAuthHeaders } from '../services/apiHelpers';
import { useStore } from '../store/useStore';
import { AppPage } from '../types';
import { getFilteredNavItems, isAdminRole } from '../utils/rolePermissions';
import {
  GraduationCap, LayoutDashboard, Users, CreditCard,
  BarChart3, FileText, Settings, LogOut, Menu, X,
  Bell, ChevronRight, ChevronLeft, Target, Award, MessageSquare,
  ScanLine, IdCard, ShieldCheck, Activity, Database, Megaphone,
  BookOpen, Edit3, FileSpreadsheet, Sun, Moon, Clock,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

interface NavItem { id: AppPage; label: string; icon: React.ReactNode; badge?: number }

const NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { id: 'dashboard',            label: 'Tableau de bord',   icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'eleves',               label: 'Élèves',            icon: <Users className="w-[18px] h-[18px]" /> },
  { id: 'parents_list',         label: 'Parents',           icon: <Users className="w-[18px] h-[18px]" /> },
  { id: 'paiements',            label: 'Paiements',         icon: <CreditCard className="w-[18px] h-[18px]" /> },
  { id: 'recouvrement',         label: 'Recouvrement',      icon: <Target className="w-[18px] h-[18px]" /> },
  { id: 'scan_presence',        label: 'Scan Présence',     icon: <ScanLine className="w-[18px] h-[18px]" /> },
  { id: 'scan_sortie',          label: 'Scan Sortie',       icon: <ScanLine className="w-[18px] h-[18px]" /> },
  { id: 'carte_scolaire',       label: 'Cartes Scolaires',  icon: <IdCard className="w-[18px] h-[18px]" /> },
  { id: 'gestion_academique',   label: 'Académique',        icon: <BookOpen className="w-[18px] h-[18px]" /> },
  { id: 'saisie_notes',         label: 'Saisie Notes',      icon: <Edit3 className="w-[18px] h-[18px]" /> },
  { id: 'bulletins',            label: 'Bulletins',         icon: <FileSpreadsheet className="w-[18px] h-[18px]" /> },
  { id: 'verification_recu',    label: 'Vérif. Reçus',      icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
  { id: 'analyses',             label: 'Analyses',          icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { id: 'documents',            label: 'Documents',         icon: <FileText className="w-[18px] h-[18px]" /> },
  { id: 'historique_activites', label: 'Historique',        icon: <Activity className="w-[18px] h-[18px]" /> },
  { id: 'chat',                 label: 'Messagerie',        icon: <MessageSquare className="w-[18px] h-[18px]" /> },
  { id: 'annonces',             label: 'Annonces',          icon: <Megaphone className="w-[18px] h-[18px]" /> },
  { id: 'gestion_personnel',    label: 'Personnel',         icon: <Users className="w-[18px] h-[18px]" /> },
  { id: 'import_export',        label: 'Base de données',   icon: <Database className="w-[18px] h-[18px]" /> },
  { id: 'parametres',           label: 'Paramètres',        icon: <Settings className="w-[18px] h-[18px]" /> },
];

const PARENT_NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { id: 'parent_dashboard',  label: 'Mon Tableau de bord', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'parent_historique', label: 'Paiements',           icon: <CreditCard className="w-[18px] h-[18px]" /> },
  { id: 'parent_recus',      label: 'Mes reçus',           icon: <FileText className="w-[18px] h-[18px]" /> },
  { id: 'parent_badges',     label: 'Mes badges',          icon: <Award className="w-[18px] h-[18px]" /> },
  { id: 'chat',              label: 'Messagerie',          icon: <MessageSquare className="w-[18px] h-[18px]" /> },
  { id: 'annonces',          label: 'Annonces',            icon: <Megaphone className="w-[18px] h-[18px]" /> },
];

const NAV_GROUPS: Record<string, string> = {
  dashboard: 'Principal',
  eleves: 'Gestion',
  parents_list: 'Gestion',
  paiements: 'Finance',
  recouvrement: 'Finance',
  scan_presence: 'Présences',
  scan_sortie: 'Présences',
  carte_scolaire: 'Présences',
  gestion_academique: 'Académique',
  saisie_notes: 'Académique',
  bulletins: 'Académique',
  verification_recu: 'Outils',
  analyses: 'Outils',
  documents: 'Outils',
  historique_activites: 'Outils',
  chat: 'Communication',
  annonces: 'Communication',
  gestion_personnel: 'Administration',
  import_export: 'Administration',
  parametres: 'Administration',
};

// ── Real-time clock ──
const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const lomeTime = time.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Lome', hour: '2-digit', minute: '2-digit' });
  const lomeDate = time.toLocaleDateString('fr-FR', { timeZone: 'Africa/Lome', weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <div className="hidden md:flex flex-col items-start gap-0">
      <div className="flex items-center gap-1.5 text-sm font-bold tabular-nums" style={{ color: 'var(--txt-primary)' }}>
        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
        {lomeTime}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--txt-muted)' }}>{lomeDate} — GMT</p>
    </div>
  );
};

// ── Sidebar Nav ──
const SidebarNav: React.FC<{
  navItems: NavItem[];
  currentPage: AppPage;
  setCurrentPage: (p: AppPage) => void;
  setSidebarOpen: (v: boolean) => void;
  collapsed: boolean;
}> = ({ navItems, currentPage, setCurrentPage, setSidebarOpen, collapsed }) => {
  let lastGroup = '';
  return (
    <nav className="sidebar-nav" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
      {navItems.map((item) => {
        const active = currentPage === item.id;
        const group = NAV_GROUPS[item.id] || '';
        const showGroupLabel = !collapsed && group && group !== lastGroup;
        if (group && group !== lastGroup) lastGroup = group;

        return (
          <React.Fragment key={item.id}>
            {showGroupLabel && (
              <div className="sidebar-section-label">{group}</div>
            )}
            <button
              onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
              className={`nav-item ${active ? 'active' : ''}`}
              title={item.label}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <span className="nav-item-icon" style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
              {collapsed && item.badge != null && item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 14, height: 14,
                  background: '#EF4444', borderRadius: '50%', fontSize: '0.5625rem',
                  fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ── Full Sidebar Content ──
const SidebarContent: React.FC<{
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
  collapsed: boolean;
  onToggleCollapse?: () => void;
}> = ({ currentPage, setCurrentPage, setSidebarOpen, navItems, schoolName, appName, schoolLogo, userName, userRole, connectedParentsCount, logout, collapsed, onToggleCollapse }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', overflow: 'hidden' }}>

    {/* Brand header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12,
      padding: collapsed ? '18px 0' : '16px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      minHeight: 60, justifyContent: collapsed ? 'center' : 'flex-start',
      transition: 'padding 280ms cubic-bezier(0.16,1,0.3,1)',
      position: 'relative',
    }}>
      {/* Logo icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: 'var(--brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: 'var(--shadow-brand)',
      }}>
        {schoolLogo
          ? <img src={schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          : <GraduationCap style={{ width: 18, height: 18, color: '#1A0E00' }} />
        }
      </div>

      {/* Name + school (hidden when collapsed) */}
      {!collapsed && (
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appName}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {schoolName}
          </p>
        </div>
      )}

      {/* Collapse toggle button (desktop only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
          style={{
            position: collapsed ? 'relative' : 'absolute',
            right: collapsed ? 'auto' : -14,
            top: collapsed ? 'auto' : '50%',
            transform: collapsed ? 'none' : 'translateY(-50%)',
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'var(--sidebar-bg)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            color: 'rgba(255,255,255,0.4)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'all 160ms ease',
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          {collapsed ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronLeft style={{ width: 14, height: 14 }} />}
        </button>
      )}
    </div>

    {/* Navigation */}
    <SidebarNav
      navItems={navItems}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      setSidebarOpen={setSidebarOpen}
      collapsed={collapsed}
    />

    {/* Live parents count (admin only, hidden when collapsed) */}
    {isAdminRole(userRole) && !collapsed && (
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => { setCurrentPage('parents_list'); setSidebarOpen(false); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderRadius: 'var(--r-md)', background: 'rgba(34,197,94,0.08)', border: 'none',
            cursor: 'pointer', transition: 'background 80ms ease-out',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.08)')}
        >
          <div className="pulse-dot" />
          <span style={{ flex: 1, fontSize: '0.8125rem', color: '#4ADE80', fontWeight: 600, textAlign: 'left' }}>
            {connectedParentsCount} parent{connectedParentsCount !== 1 ? 's' : ''}
          </span>
          <ChevronRight style={{ width: 14, height: 14, color: 'rgba(74,222,128,0.5)' }} />
        </button>
      </div>
    )}
    {/* Pulse dot only when collapsed + admin */}
    {isAdminRole(userRole) && collapsed && (
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => { setCurrentPage('parents_list'); setSidebarOpen(false); }}
          title={`${connectedParentsCount} parents inscrits`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <div className="pulse-dot" />
        </button>
      </div>
    )}

    {/* User footer */}
    <div style={{ padding: '10px 8px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* User chip */}
      {!collapsed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--r-md)', marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--brand) 0%, #E0A800 100%)',
            color: '#1A0E00', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', fontWeight: 500 }}>
              {userRole}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div title={userName} style={{
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--brand) 0%, #E0A800 100%)',
            color: '#1A0E00', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        title="Déconnexion"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '8px 12px',
          borderRadius: 'var(--r-md)', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', fontWeight: 500,
          transition: 'all 80ms ease-out',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
      >
        <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
        {!collapsed && <span>Déconnexion</span>}
      </button>
    </div>
  </div>
);

// ── SIDEBAR WIDTH CONSTANTS ──
const SIDEBAR_EXPANDED = 264;
const SIDEBAR_COLLAPSED = 68;
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

// ── LAYOUT PRINCIPAL ──────────────────────────────────────────
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

  // Dark mode
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Sidebar collapsed state — persisted
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin: sync + parent count polling
  useEffect(() => {
    if (user?.role !== 'parent') {
      if (students.length > 0) {
        import('../services/backendSync').then(({ syncToBackend }) => {
          const t = setTimeout(() => syncToBackend({ students, parents }).catch(() => {}), 100);
          return () => clearTimeout(t);
        });
      }
      const fetchCount = async () => {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 3000);
          const res = await fetch('/api/parent/active-count', { signal: ctrl.signal, headers: getAuthHeaders() }).finally(() => clearTimeout(tid));
          if (res.ok) { const d = await parseResponse(res); setConnectedParentsCount(d.count || 0); }
        } catch {}
      };
      fetchCount();
      const iv = setInterval(fetchCount, 30000);
      return () => clearInterval(iv);
    }
  }, [students, parents, user?.role, setConnectedParentsCount]);

  // Parent: unread messages polling
  useEffect(() => {
    if (user?.role === 'parent') {
      fetchUnreadMessages();
      const iv = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(iv);
    }
  }, [user?.role, fetchUnreadMessages]);

  const nonSoldes = students.filter((s) => s.status !== 'Soldé').length;
  const isParent = user?.role === 'parent';
  const baseNavItems = isParent ? PARENT_NAV_ITEMS : NAV_ITEMS;
  const filteredItems = getFilteredNavItems(user?.role, baseNavItems) as Omit<NavItem, 'badge'>[];

  const navItems: NavItem[] = filteredItems.map((item) => ({
    ...item,
    badge: item.id === 'eleves' && nonSoldes > 0 ? nonSoldes
         : item.id === 'chat' && unreadMessages > 0 ? unreadMessages
         : undefined,
  }));

  const currentLabel = [...NAV_ITEMS, ...PARENT_NAV_ITEMS].find((n) => n.id === currentPage)?.label ?? '';
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const sidebarProps = {
    currentPage, setCurrentPage, setSidebarOpen, navItems,
    schoolName, appName, schoolLogo,
    userName: user?.nom ?? '', userRole: user?.role ?? '',
    connectedParentsCount, logout,
    collapsed,
  };

  // Bottom nav items (mobile)
  const bottomNavItems = (user?.role === 'superviseur' || user?.role === 'surveillant') ? [
    { id: 'scan_presence' as AppPage, label: 'Entrée', icon: <ScanLine className="w-5 h-5" /> },
    { id: 'scan_sortie'   as AppPage, label: 'Sortie', icon: <ScanLine className="w-5 h-5" /> },
    { id: 'carte_scolaire'as AppPage, label: 'Cartes', icon: <IdCard className="w-5 h-5" /> },
  ] : [
    { id: (isParent ? 'parent_dashboard' : 'dashboard') as AppPage, label: 'Accueil', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: (isParent ? 'parent_historique' : 'eleves') as AppPage, label: isParent ? 'Paiements' : 'Élèves', icon: isParent ? <CreditCard className="w-5 h-5" /> : <Users className="w-5 h-5" /> },
    { id: 'chat' as AppPage, label: 'Chat', icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessages },
    { id: (isParent ? 'annonces' : 'parametres') as AppPage, label: isParent ? 'Annonces' : 'Config', icon: isParent ? <Megaphone className="w-5 h-5" /> : <Settings className="w-5 h-5" /> },
  ];

  return (
    <div
      className={`min-h-screen flex ${theme === 'dark' ? 'dark' : ''}`}
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", background: 'var(--bg)', color: 'var(--txt-primary)' }}
    >
      {/* ── Sidebar Desktop ── */}
      <aside
        className="hidden lg:block print:hidden"
        style={{
          width: sidebarW,
          height: '100dvh',
          position: 'fixed',
          top: 0, left: 0,
          zIndex: 50,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.15)',
          transition: 'width 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'visible',
        }}
      >
        <SidebarContent {...sidebarProps} onToggleCollapse={toggleCollapse} />
      </aside>

      {/* ── Sidebar Mobile Overlay ── */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} className="lg:hidden">
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,20,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: SIDEBAR_EXPANDED,
            zIndex: 61, display: 'flex', flexDirection: 'column',
            animation: 'sidebar-slide-in 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <style>{`@keyframes sidebar-slide-in { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 62,
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <X size={15} />
            </button>
            <SidebarContent {...sidebarProps} collapsed={false} />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div
        className="print:ml-0"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: 0, // mobile
          transition: 'margin-left 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Apply desktop margin via a style tag that responds to lg breakpoint */}
        <style>{`
          @media (min-width: 1024px) {
            .main-offset { margin-left: ${sidebarW}px !important; }
          }
        `}</style>
        <div className="main-offset" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>

          {/* ── Topbar ── */}
          <header
            className="print:hidden"
            style={{
              height: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 20px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border-light)',
              position: 'sticky',
              top: 0,
              zIndex: 40,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'background var(--t-slow)',
            }}
          >
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{
                width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--txt-secondary)', flexShrink: 0,
              }}
            >
              <Menu size={16} />
            </button>

            {/* Desktop sidebar toggle (replaces hamburger on desktop) */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex"
              title={collapsed ? 'Développer' : 'Réduire la sidebar'}
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface-2)', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--txt-muted)', flexShrink: 0,
                transition: 'all var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
            >
              {collapsed
                ? <PanelLeftOpen size={15} />
                : <PanelLeftClose size={15} />
              }
            </button>

            {/* Page title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.015em',
                color: 'var(--txt-primary)', lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentLabel}
              </h1>
              {!isParent && (
                <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--txt-muted)', marginTop: 1 }}>
                  Session {schoolYear}
                </p>
              )}
            </div>

            {/* Clock */}
            <RealTimeClock />

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Non-soldés alert */}
              {!isParent && nonSoldes > 0 && (
                <button
                  onClick={() => setCurrentPage('eleves')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 100, cursor: 'pointer', transition: 'all var(--t-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                >
                  <Bell style={{ width: 13, height: 13, color: '#EF4444' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>{nonSoldes}</span>
                </button>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'light' ? 'Mode nuit' : 'Mode jour'}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--surface-2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--txt-secondary)', transition: 'all var(--t-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-secondary)'; }}
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Mobile logout */}
              <button
                onClick={logout}
                className="lg:hidden"
                title="Déconnexion"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#EF4444',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>

          {/* ── Page content ── */}
          <main
            className="page-enter print:p-0 print:overflow-visible"
            style={{
              flex: 1,
              padding: '24px',
              paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
              overflowX: 'hidden',
            }}
          >
            <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
              {children}
            </div>
          </main>

          {/* ── Bottom Navigation (Mobile) ── */}
          <nav
            className={`lg:hidden print:hidden ${sidebarOpen ? 'hidden' : 'flex'}`}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-light)',
              alignItems: 'center',
              zIndex: 40,
              boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {bottomNavItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 3, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                    color: active ? 'var(--brand)' : 'var(--txt-muted)',
                    transition: 'color var(--t-fast), transform var(--t-fast)',
                    position: 'relative',
                    transform: active ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 24, height: 3, borderRadius: '0 0 4px 4px',
                      background: 'var(--brand)',
                    }} />
                  )}
                  <div style={{
                    padding: 6, borderRadius: 10,
                    background: active ? 'var(--brand-light)' : 'transparent',
                    transition: 'background var(--t-fast)',
                    position: 'relative',
                  }}>
                    {item.icon}
                    {(item as any).badge != null && (item as any).badge > 0 && (
                      <span style={{
                        position: 'absolute', top: 0, right: 0, width: 16, height: 16,
                        background: '#EF4444', color: 'white', fontSize: '0.625rem', fontWeight: 800,
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--surface)',
                      }}>
                        {(item as any).badge > 9 ? '9+' : (item as any).badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: active ? 700 : 500 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
