// ============================================================
// SUPERADMIN — Cashflow (encaissements réels vs dépenses)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Scale, RefreshCw, Info } from 'lucide-react';
import { superAdminApi, formatFCFA } from '../../services/superAdminApi';
import { StatCard } from '../../components/superadmin/StatCard';
import { CashflowChart, CashflowPoint } from '../../components/superadmin/CashflowChart';

export const SuperAdminCashflowPage: React.FC = () => {
  const [trend, setTrend] = useState<CashflowPoint[]>([]);
  const [summary, setSummary] = useState<{ totalMoneyIn: number; totalMoneyOut: number; totalNet: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getCashflowTrend(12);
      setTrend(data.trend || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Cashflow trend error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Cashflow</h1>
          <p className="text-slate-400 text-sm">Argent réellement encaissé (licences parents) vs dépenses, sur 12 mois.</p>
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
          Ces chiffres viennent des <strong>paiements de licences réellement encaissés</strong> — distincts du "CA Mensuel estimé"
          affiché sur les autres pages (qui est une projection basée sur le nombre d'élèves actifs). Les deux ne concordent pas par nature.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Encaissé (12 mois)" value={formatFCFA(summary.totalMoneyIn)} icon={<TrendingUp className="w-5 h-5" />} color="from-emerald-500 to-teal-500" />
              <StatCard label="Dépensé (12 mois)" value={formatFCFA(summary.totalMoneyOut)} icon={<TrendingDown className="w-5 h-5" />} color="from-rose-500 to-red-500" />
              <StatCard
                label="Net (12 mois)"
                value={formatFCFA(summary.totalNet)}
                icon={<Scale className="w-5 h-5" />}
                color={summary.totalNet >= 0 ? 'from-amber-500 to-amber-600' : 'from-slate-600 to-slate-700'}
                valueClassName={summary.totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              />
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Tendance mensuelle</h2>
            {trend.every((t) => t.moneyIn === 0) && (
              <p className="text-slate-500 text-xs mb-3">Aucun encaissement de licence enregistré pour l'instant — la ligne "Encaissé" est à zéro, ce n'est pas une erreur.</p>
            )}
            <CashflowChart data={trend} />
          </div>
        </>
      )}
    </div>
  );
};
