import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { getAuthHeaders } from '../../services/apiHelpers';
import { API_BASE_URL } from '../../config';
import { Settings, Calendar, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

export const ParentSettings: React.FC = () => {
  const schoolYear = useStore((s) => s.schoolYear);
  const setSchoolYear = useStore((s) => s.setSchoolYear);
  const schoolName = useStore((s) => s.schoolName);
  
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [savingYear, setSavingYear] = useState<string | null>(null);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/parent/years`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error('Impossible de récupérer la liste des années scolaires.');
        }
        const data = await res.json();
        setYears(data);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []);

  const handleSelectYear = async (yearName: string) => {
    if (yearName === schoolYear) return;
    try {
      setSavingYear(yearName);
      setSchoolYear(yearName);
      console.log(`🔄 Session changée pour : ${yearName}. Rechargement complet...`);
      // Laisse le temps à l'état de se sauvegarder et à l'animation de se jouer
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      setSavingYear(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[800px] mx-auto animate-slideUp">
      
      {/* ── HEADER ── */}
      <div className="relative pro-card p-6 sm:p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-amber-100 dark:border-amber-900/30 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700">
          <Settings className="w-48 h-48 text-amber-500" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Settings className="w-3.5 h-3.5" /> Options
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            Paramètres du <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600">Compte Parent</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Gérez vos préférences de consultation et changez d'année académique.
          </p>
        </div>
      </div>

      {/* ── ACADEMIC YEAR SELECTION ── */}
      <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          Session Scolaire Active
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Sélectionnez l'année scolaire que vous souhaitez consulter. Les données d'écolage, les paiements, les cours et les notes s'ajusteront automatiquement pour l'année choisie.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement des sessions...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {years.map((yr) => {
              const active = yr.name === schoolYear;
              const isSavingThis = yr.name === savingYear;
              return (
                <button
                  key={yr.id}
                  disabled={savingYear !== null}
                  onClick={() => handleSelectYear(yr.name)}
                  className={`group relative flex items-center justify-between p-5 rounded-2xl border text-left transition-all duration-300 active:scale-[0.98] outline-none cursor-pointer
                    ${active 
                      ? 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.15)]' 
                      : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/35'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${active 
                        ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]' 
                        : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-105'
                      }
                    `}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">
                        Session {yr.name}
                      </h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {yr.is_current ? 'Année Courante de l\'école' : 'Historique'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    {isSavingThis ? (
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : active ? (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER INFORMATION ── */}
      <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 text-xs font-semibold max-w-[600px] mx-auto">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          Établissement lié : <strong>{schoolName}</strong>. Si vous ne trouvez pas une année académique, veuillez contacter l'administration de l'établissement.
        </span>
      </div>

    </div>
  );
};
