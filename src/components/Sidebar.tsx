import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  Settings, 
  LogOut,
  School,
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';

type Page = 'dashboard' | 'students' | 'import' | 'reports' | 'analytics' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Sidebar = ({ currentPage, onNavigate }: SidebarProps) => {
  const { user, logout } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'students', label: 'Gestion Élèves', icon: Users },
    { id: 'import', label: 'Import/Export', icon: FileSpreadsheet },
    { id: 'reports', label: 'Rapports PDF', icon: FileText },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <School className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SchoolFinance</h1>
            <p className="text-blue-300 text-xs">Gestion Scolaire</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-blue-900 font-semibold'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
            <span className="font-semibold text-sm">
              {user?.nom.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{user?.nom}</p>
            <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};
