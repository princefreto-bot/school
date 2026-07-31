// ============================================================
// SUPERADMIN — Vue d'ensemble
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, Building2, Users, Wallet, UserCheck, AlertTriangle, RefreshCw, ArrowRight, TrendingUp, ShieldAlert, BellRing, Megaphone
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';
import { useStore } from '../../store/useStore';
import { formatFCFA } from '../../services/superAdminApi';
import { StatCard } from '../../components/superadmin/StatCard';
import { GlobalStats } from './types';
import { AppPage } from '../../types';

// NOTE: cette liste s'enrichit au fil des phases (Alertes, Auditeur, Pipeline)
// à mesure que leurs pages respectives sont livrées — cf. plan de refonte SuperAdmin.
const QUICK_LINKS: { id: AppPage; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'superadmin_cashflow', label: 'Cashflow', desc: 'Encaissements réels vs dépenses, tendance mensuelle', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'superadmin_auditor', label: 'Auditeur', desc: "Anomalies d'abonnement détectées automatiquement", icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'superadmin_alerts', label: 'Alertes', desc: 'Écoles à contacter (essai, approbation, quota)', icon: <BellRing className="w-5 h-5" /> },
  { id: 'superadmin_pipeline', label: 'Pipeline', desc: 'Prospects et écoles en cours de démarchage', icon: <Megaphone className="w-5 h-5" /> },
];

export const SuperAdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const user = useStore((s) => s.user);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/stats`, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('SuperAdmin overview stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
            <Star className="w-8 h-8 text-white fill-white/20" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">SuperAdmin Global</h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium mt-1">
              {user?.nom ? `Bonjour ${user.nom} — ` : ''}Plateforme SaaS — Contrôle & Gestion centralisée
            </p>
          </div>
        </div>

        <button onClick={loadStats}
          className="relative z-10 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          title="Actualiser">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Écoles" value={stats.total_schools} sub={`${stats.active_schools} actives`} icon={<Building2 className="w-5 h-5" />} color="from-blue-500 to-cyan-500" />
          <StatCard label="Total Élèves" value={stats.total_students.toLocaleString()} sub={`${stats.total_users} users`} icon={<Users className="w-5 h-5" />} color="from-emerald-500 to-teal-500" />
          <StatCard label="Parents Activés" value={stats.total_parents || 0} sub="sur la plateforme" icon={<UserCheck className="w-5 h-5" />} color="from-indigo-500 to-blue-500" />
          <StatCard label="CA Mensuel (estimé)" value={formatFCFA(stats.total_revenue)} sub={`${stats.price_per_student.toLocaleString()} FCFA/élève`} icon={<Wallet className="w-5 h-5" />} color="from-purple-500 to-violet-500" />
        </div>
      ) : null}

      {stats && stats.expired_trials > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">{stats.expired_trials} école{stats.expired_trials > 1 ? 's' : ''} en essai expiré</p>
            <p className="text-sm text-amber-500/80">Voir l'onglet Alertes pour le détail et les relancer.</p>
          </div>
        </div>
      )}

      {QUICK_LINKS.length > 0 && (
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className="text-left bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                {link.icon}
              </div>
              <p className="text-white font-bold flex items-center gap-1.5">
                {link.label}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-slate-500 text-xs mt-1">{link.desc}</p>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
