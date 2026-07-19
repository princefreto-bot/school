import React, { useEffect, useState } from 'react';
import { Database, Download, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';

interface Backup {
  name: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string | null;
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const fmtDate = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const SchoolBackups: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/backups`, { headers: getAuthHeaders() });
      const data = await parseResponse(res);
      if (res.ok) setBackups(data.backups || []);
      else setError(data.error || 'Erreur de chargement des sauvegardes.');
    } catch (err) {
      setError('Erreur réseau lors du chargement des sauvegardes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleRunNow = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/backups/run`, { method: 'POST', headers: getAuthHeaders() });
      const data = await parseResponse(res);
      if (res.ok) {
        await fetchBackups();
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      setError('Erreur réseau lors de la sauvegarde.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Sauvegardes
        </h3>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sauvegarder maintenant
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
        Une sauvegarde automatique de vos données (élèves, paiements, notes, présences, badges) est générée chaque nuit et conservée 30 jours.
      </p>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-3">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
        </div>
      ) : backups.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium py-2">Aucune sauvegarde disponible pour le moment.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {backups.map((b) => (
            <div key={b.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fmtDate(b.createdAt)}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{fmtSize(b.sizeBytes)}</p>
              </div>
              {b.downloadUrl && (
                <a
                  href={b.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
