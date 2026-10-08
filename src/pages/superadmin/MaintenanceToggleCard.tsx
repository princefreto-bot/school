import React, { useEffect, useState } from 'react';
import { Wrench, Loader2 } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';

// Interrupteur "Mise à jour en cours" : bloque l'accès des écoles (écran de maintenance),
// le superadmin garde l'accès. Effet en moins de 15 s, sans redéploiement.
export const MaintenanceToggleCard: React.FC = () => {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    superAdminApi.getMaintenance()
      .then((s) => { setActive(!!s.active); setMessage(s.message || ''); })
      .catch(() => setError("Impossible de lire l'état de maintenance."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    const next = !active;
    if (next && !window.confirm("Activer le mode « Mise à jour en cours » ?\n\nToutes les écoles verront l'écran de maintenance et ne pourront plus travailler jusqu'à la désactivation.")) return;
    setSaving(true);
    setError('');
    try {
      const s = await superAdminApi.setMaintenance({ active: next, message });
      setActive(!!s.active);
      setMessage(s.message || message);
    } catch {
      setError("Le changement n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border ${active ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800/40 border-slate-700'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Wrench className={`w-5 h-5 mt-0.5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
          <div>
            <p className="text-white font-black">Mode « Mise à jour en cours »</p>
            <p className="text-slate-400 text-xs mt-1">
              {active
                ? 'ACTIF : les écoles voient l’écran de maintenance. Vous seul gardez l’accès.'
                : 'Inactif : les écoles utilisent normalement l’application.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={loading || saving}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'}`}
        >
          {(loading || saving) && <Loader2 className="w-4 h-4 animate-spin" />}
          {active ? 'Rouvrir l’accès' : 'Activer'}
        </button>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Message affiché aux écoles pendant la mise à jour"
        className="mt-4 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
      />
      {error && <p className="mt-2 text-xs font-bold text-rose-400">{error}</p>}
    </div>
  );
};
