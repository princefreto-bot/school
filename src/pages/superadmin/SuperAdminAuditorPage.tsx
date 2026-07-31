// ============================================================
// SUPERADMIN — Auditeur d'abonnements
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';
import { StatCard } from '../../components/superadmin/StatCard';
import { AuditFindingCard, AuditFinding } from '../../components/superadmin/AuditFindingCard';

type SeverityFilter = 'all' | AuditFinding['severity'];

export const SuperAdminAuditorPage: React.FC = () => {
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [summary, setSummary] = useState<{ total: number; danger: number; warning: number; info: number } | null>(null);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getAuditFindings();
      setFindings(data.findings || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Audit findings error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? findings : findings.filter((f) => f.severity === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Auditeur d'abonnements</h1>
          <p className="text-slate-400 text-sm">Anomalies détectées automatiquement à partir des données existantes.</p>
        </div>
        <button onClick={load}
          className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          title="Actualiser">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Critiques" value={summary.danger} icon={<AlertOctagon className="w-5 h-5" />} color="from-red-500 to-rose-600" />
          <StatCard label="À surveiller" value={summary.warning} icon={<AlertTriangle className="w-5 h-5" />} color="from-amber-500 to-amber-600" />
          <StatCard label="Informationnel" value={summary.info} icon={<Info className="w-5 h-5" />} color="from-slate-600 to-slate-700" />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['all', 'danger', 'warning', 'info'] as SeverityFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              filter === f
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'Toutes' : f === 'danger' ? 'Critiques' : f === 'warning' ? 'À surveiller' : 'Info'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <ShieldAlert className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">Aucune anomalie pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => <AuditFindingCard key={`${f.schoolId}-${f.rule}-${i}`} finding={f} />)}
        </div>
      )}
    </div>
  );
};
