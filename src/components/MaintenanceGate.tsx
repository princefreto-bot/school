import React, { useEffect, useState } from 'react';
import { Wrench, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStore } from '../store/useStore';

const CHECK_INTERVAL_MS = 60 * 1000;

// Écran "Mise à jour en cours" : quand le superadmin active la maintenance, les écoles
// ne voient que ce message (aucune action possible, donc aucun risque pour leurs données).
// Le superadmin garde l'accès normal.
export const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = useStore((s) => s.user?.role);
  const [state, setState] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/maintenance`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setState({ active: !!data.active, message: data.message || '' });
      } catch {
        // Hors ligne ou serveur injoignable : on ne bloque jamais sur une erreur réseau.
      }
    };
    check();
    const iv = setInterval(check, CHECK_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // Pages publiques et connexion restent accessibles (le superadmin doit pouvoir se connecter).
  if (!state.active || !role || role === 'superadmin') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Wrench className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Mise à jour en cours</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {state.message || 'DGhubSchool est en cours de mise à jour. Vos données sont en sécurité. Merci de réessayer dans quelques minutes.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    </div>
  );
};
