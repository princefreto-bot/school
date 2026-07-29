// ============================================================
// MES ABSENCES — Vue lecture seule (portail « Mon Espace »)
// Saisies par l'admin/la secrétaire — pas de scan pour l'instant.
// ============================================================
import React, { useEffect, useState } from 'react';
import { staffAbsencesApi } from '../services/staffAbsencesApi';
import { CalendarX, Loader2 } from 'lucide-react';

interface Absence {
  id: string;
  date: string;
  type: string;
  heures_manquees: number | null;
  motif: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  absence: 'Absence',
  retard: 'Retard',
  conge: 'Congé',
};

export const MesAbsences: React.FC = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await staffAbsencesApi.getMine();
        setAbsences(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-[900px] mx-auto animate-slideUp">
      <div className="relative pro-card p-8 overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            <CalendarX className="w-3.5 h-3.5" /> Mon Espace
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Mes Absences</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-2">
            Historique de vos absences, retards et congés, saisis par la direction.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Heures manquées</th>
                <th className="px-6 py-4">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
              ) : absences.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucune absence enregistrée.</td></tr>
              ) : (
                absences.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{TYPE_LABELS[a.type] || a.type}</td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400">{a.heures_manquees != null ? `${a.heures_manquees} h` : '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{a.motif || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MesAbsences;
