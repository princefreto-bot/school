import React, { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';

interface Slot {
  id: string;
  classe: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  matiere?: { nom: string } | null;
}

interface Child { id: string; prenom: string; nom: string; classe: string }

const fmtTime = (t: string) => (t || '').slice(0, 5);
const todayJour = () => new Date().getDay(); // 0=Dimanche ... 6=Samedi, correspond à jour_semaine

export const ParentTodaySchedule: React.FC<{ kids: Child[] }> = ({ kids }) => {
  const [slotsByClasse, setSlotsByClasse] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const classes = Array.from(new Set(kids.map((c) => c.classe).filter(Boolean)));
      if (classes.length === 0) { setLoading(false); return; }

      setLoading(true);
      try {
        const results = await Promise.all(classes.map(async (classe) => {
          const res = await fetch(`${API_BASE_URL}/timetable?classe=${encodeURIComponent(classe)}`, { headers: getAuthHeaders() });
          if (!res.ok) return [classe, []] as const;
          const data = await parseResponse(res);
          const today = todayJour();
          const todaySlots = (data as Slot[])
            .filter((s) => s.jour_semaine === today)
            .sort((a, b) => fmtTime(a.heure_debut).localeCompare(fmtTime(b.heure_debut)));
          return [classe, todaySlots] as const;
        }));
        setSlotsByClasse(Object.fromEntries(results));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [kids.map((c) => c.classe).join(',')]);

  if (kids.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
      <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Emploi du temps — aujourd'hui</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
        ) : (
          <div className="space-y-5">
            {kids.map((child) => {
              const slots = slotsByClasse[child.classe] || [];
              return (
                <div key={child.id}>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    {child.prenom} {child.nom} — {child.classe}
                  </p>
                  {slots.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Pas de cours prévu aujourd'hui.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/40 rounded-xl px-3 py-2">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{fmtTime(s.heure_debut)}–{fmtTime(s.heure_fin)}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.matiere?.nom || 'Cours'}</span>
                          {s.salle && <span className="text-[10px] text-slate-400">Salle {s.salle}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
