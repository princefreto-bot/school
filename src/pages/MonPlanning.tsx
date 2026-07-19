// ============================================================
// PAGE MON PLANNING — Emploi du temps en lecture seule (enseignant)
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import { Calendar, Loader2, Sparkles } from 'lucide-react';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOUR_INDEX: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };

interface Slot {
  id: string;
  classe: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  matiere?: { nom: string; categorie: string } | null;
}

const fmtTime = (t: string) => (t || '').slice(0, 5);

export const MonPlanning: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const teacherName = typeof window !== 'undefined' ? localStorage.getItem('selected_teacher_name') || '' : '';

  useEffect(() => {
    const load = async () => {
      if (!teacherName) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/timetable/mine?nom=${encodeURIComponent(teacherName)}`, { headers: getAuthHeaders() });
        if (res.ok) setSlots(await parseResponse(res));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherName]);

  const grid = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const j of JOURS) map[j] = [];
    for (const s of slots) {
      const jourName = JOURS.find((j) => JOUR_INDEX[j] === s.jour_semaine);
      if (jourName) map[jourName].push(s);
    }
    for (const j of JOURS) map[j].sort((a, b) => fmtTime(a.heure_debut).localeCompare(fmtTime(b.heure_debut)));
    return map;
  }, [slots]);

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Calendar className="w-64 h-64 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-3.5 h-3.5" /> Mon Planning
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">{teacherName || 'Emploi du temps'}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Vos créneaux de cours pour la semaine, toutes classes confondues.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : !teacherName ? (
          <p className="text-center text-slate-400 text-sm font-medium py-16">Aucun enseignant sélectionné.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 min-w-[900px]">
              {JOURS.map((j) => (
                <div key={j} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center py-3 border-b border-slate-100 dark:border-slate-800">
                    {j}
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {grid[j].length === 0 ? (
                      <p className="text-[10px] text-slate-300 dark:text-slate-700 text-center py-4">—</p>
                    ) : (
                      grid[j].map((s) => (
                        <div key={s.id} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-2.5">
                          <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{fmtTime(s.heure_debut)} – {fmtTime(s.heure_fin)}</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{s.matiere?.nom || 'Sans matière'}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.classe}</p>
                          {s.salle && <p className="text-[9px] text-slate-400">Salle {s.salle}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
