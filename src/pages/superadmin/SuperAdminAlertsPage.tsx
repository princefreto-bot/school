// ============================================================
// SUPERADMIN — Alertes (écoles à contacter)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, RefreshCw, Info } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';
import { AlertFeedItem, OverdueAlert } from '../../components/superadmin/AlertFeedItem';

export const SuperAdminAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<OverdueAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getOverdueAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Overdue alerts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Alertes</h1>
          <p className="text-slate-400 text-sm">{alerts.length} école{alerts.length !== 1 ? 's' : ''} à relancer.</p>
        </div>
        <button onClick={load}
          className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          title="Actualiser">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          Suivi manuel uniquement — aucun email ou SMS n'est envoyé automatiquement. "Marquer comme contactée" garde juste une trace de vos relances.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BellRing className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">Aucune école à relancer pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => <AlertFeedItem key={a.schoolId} alert={a} onContacted={load} />)}
        </div>
      )}
    </div>
  );
};
