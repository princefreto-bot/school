import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Plus, Trash2, CheckCircle, AlertCircle, ArrowRight, Users, X, Loader2, ChevronDown, GraduationCap, RotateCcw, Ban } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { CLASS_CONFIG, getNextClass, getCycle, getEffectiveEcolage } from '../data/classConfig';

interface YearStudent {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  sexe: string;
  photo_url: string | null;
}

type StudentDecision = 'promote' | 'redouble' | 'exclude';

// ============================================================
// MODALE DE PROMOTION — Rentrée : fait passer les élèves d'une
// année scolaire à l'autre, classe par classe, avec ajustement
// individuel (redoublant / sortant) avant validation.
// ============================================================
const PromoteModal: React.FC<{ academicYears: { id: string; name: string }[]; currentSchoolYear: string; onClose: () => void }> = ({
  academicYears, currentSchoolYear, onClose,
}) => {
  const classFees = useStore((s) => s.classFees);
  const promoteStudentsAction = useStore((s) => s.promoteStudents);

  const [fromYear, setFromYear] = useState(currentSchoolYear);
  const [toYear, setToYear] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<YearStudent[] | null>(null);
  const [loadError, setLoadError] = useState('');

  // Classe cible par classe source ('' = ne promouvoir personne de cette classe par défaut)
  const [classTargets, setClassTargets] = useState<Record<string, string>>({});
  // Décision individuelle par élève, quand elle diffère de la règle de sa classe
  const [overrides, setOverrides] = useState<Record<string, StudentDecision>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ promoted: number; skipped: number } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const toYearOptions = academicYears.filter((y) => y.name !== fromYear);

  useEffect(() => {
    if (!fromYear || !toYear) { setStudents(null); return; }
    setLoadingStudents(true);
    setLoadError('');
    setStudents(null);
    setClassTargets({});
    setOverrides({});
    (async () => {
      try {
        const token = localStorage.getItem('parent_token');
        const res = await fetch(`${API_BASE_URL}/students/by-year?year=${encodeURIComponent(fromYear)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list: YearStudent[] = data.students || [];
        setStudents(list);
        // Pré-remplit la classe cible par défaut pour chaque classe rencontrée.
        const classes = [...new Set(list.map((s) => s.classe))];
        const defaults: Record<string, string> = {};
        classes.forEach((c) => { defaults[c] = getNextClass(c) || ''; });
        setClassTargets(defaults);
      } catch {
        setLoadError("Impossible de charger les élèves de cette année. Vérifiez votre connexion et réessayez.");
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [fromYear, toYear]);

  const byClass = useMemo(() => {
    if (!students) return [];
    const map = new Map<string, YearStudent[]>();
    students.forEach((s) => {
      if (!map.has(s.classe)) map.set(s.classe, []);
      map.get(s.classe)!.push(s);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [students]);

  const getDecision = (studentId: string): StudentDecision => overrides[studentId] || 'promote';

  const summary = useMemo(() => {
    if (!students) return { promoted: 0, redoublants: 0, excluded: 0 };
    let promoted = 0, redoublants = 0, excluded = 0;
    students.forEach((s) => {
      const decision = getDecision(s.id);
      if (decision === 'exclude') { excluded++; return; }
      if (decision === 'redouble') { redoublants++; return; }
      // 'promote' : compte comme exclu si la classe n'a pas de cible définie
      if (classTargets[s.classe]) promoted++; else excluded++;
    });
    return { promoted, redoublants, excluded };
  }, [students, overrides, classTargets]);

  const handleSubmit = async () => {
    if (!students || !fromYear || !toYear) return;
    setSubmitting(true);
    setSubmitError('');

    const promotions = students
      .map((s) => {
        const decision = getDecision(s.id);
        if (decision === 'exclude') return null;
        const targetClasse = decision === 'redouble' ? s.classe : classTargets[s.classe];
        if (!targetClasse) return null; // classe sans cible définie et pas explicitement redoublant
        return {
          studentId: s.id,
          targetClasse,
          targetCycle: getCycle(targetClasse),
          targetEcolage: getEffectiveEcolage(targetClasse, classFees, 'ANCIEN'),
          redoublant: decision === 'redouble',
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (promotions.length === 0) {
      setSubmitError("Aucun élève à promouvoir avec les réglages actuels.");
      setSubmitting(false);
      return;
    }

    const res = await promoteStudentsAction({ fromYear, toYear, promotions });
    setSubmitting(false);
    if (res.success) {
      setResult({ promoted: res.promoted || 0, skipped: res.skipped || 0 });
    } else {
      setSubmitError(res.error || "Erreur lors de la promotion.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Promouvoir les élèves</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rentrée : fait passer les élèves d'une année à l'autre, classe par classe.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {result ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 dark:text-white">{result.promoted} élève{result.promoted > 1 ? 's' : ''} promu{result.promoted > 1 ? 's' : ''} vers {toYear}</p>
                {result.skipped > 0 && <p className="text-sm text-slate-500 mt-1">{result.skipped} ignoré(s) (déjà traité ou incohérence).</p>}
                <p className="text-xs text-slate-400 mt-3">Les fiches de {fromYear} restent intactes pour l'historique. Basculez sur {toYear} pour voir les nouvelles fiches.</p>
              </div>
              <button onClick={onClose} className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold">
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Depuis l'année</label>
                  <select
                    value={fromYear}
                    onChange={(e) => setFromYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                  >
                    {academicYears.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
                  </select>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 mb-3.5 mx-auto hidden sm:block" />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vers l'année</label>
                  <select
                    value={toYear}
                    onChange={(e) => setToYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Choisir...</option>
                    {toYearOptions.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
                  </select>
                </div>
              </div>
              {toYearOptions.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Créez d'abord l'année cible (bouton « Nouvelle Année ») avant de pouvoir y promouvoir des élèves.
                </p>
              )}

              {loadingStudents && (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" /> Chargement des élèves de {fromYear}...
                </div>
              )}
              {loadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {loadError}
                </div>
              )}

              {students && !loadingStudents && (
                students.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Aucun élève dans {fromYear}.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {byClass.map(([classe, classStudents]) => {
                      const target = classTargets[classe] || '';
                      const isExpanded = !!expandedClasses[classe];
                      return (
                        <div key={classe} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/40">
                            <span className="font-black text-slate-800 dark:text-white">{classe}</span>
                            <span className="text-xs font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              {classStudents.length} élève{classStudents.length > 1 ? 's' : ''}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <select
                              value={target}
                              onChange={(e) => setClassTargets((prev) => ({ ...prev, [classe]: e.target.value }))}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                            >
                              <option value="">Ne pas promouvoir cette classe</option>
                              {CLASS_CONFIG.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <button
                              onClick={() => setExpandedClasses((prev) => ({ ...prev, [classe]: !prev[classe] }))}
                              className="ml-auto flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                            >
                              Ajuster élève par élève <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {classStudents.map((s) => {
                                const decision = getDecision(s.id);
                                return (
                                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.prenom} {s.nom}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {([
                                        { key: 'promote', label: target || '—', icon: ArrowRight, title: 'Promouvoir vers la classe cible' },
                                        { key: 'redouble', label: 'Redouble', icon: RotateCcw, title: 'Reste dans la même classe' },
                                        { key: 'exclude', label: 'Exclure', icon: Ban, title: 'Ne pas promouvoir (a quitté l\'établissement...)' },
                                      ] as const).map(({ key, label, icon: Icon, title }) => (
                                        <button
                                          key={key}
                                          title={title}
                                          onClick={() => setOverrides((prev) => ({ ...prev, [s.id]: key }))}
                                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                                            decision === key
                                              ? key === 'exclude' ? 'bg-rose-500 text-white' : key === 'redouble' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'
                                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                          }`}
                                        >
                                          <Icon className="w-3 h-3" /> {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {students && students.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 p-4 bg-indigo-50/60 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-sm font-bold">
                  <span className="text-indigo-700 dark:text-indigo-300">{summary.promoted} promu(s)</span>
                  <span className="text-amber-600 dark:text-amber-400">{summary.redoublants} redoublant(s)</span>
                  <span className="text-slate-500 dark:text-slate-400">{summary.excluded} non promu(s)</span>
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {!result && students && students.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3 shrink-0">
            <button onClick={onClose} className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold transition-all">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || summary.promoted + summary.redoublants === 0}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Promotion en cours...</> : `Promouvoir ${summary.promoted + summary.redoublants} élève(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const GestionAnneesScolaires: React.FC = () => {
  const academicYears = useStore((s) => s.academicYears) || [];
  const currentSchoolYear = useStore((s) => s.schoolYear);
  const deleteAcademicYear = useStore((s) => s.deleteAcademicYear);
  const updateAllSettings = useStore((s) => s.updateAllSettings);
  const settings = useStore((s) => s.settings);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newYearName.trim()) {
      setError("Le nom de l'année scolaire est requis.");
      return;
    }

    const years = newYearName.match(/\b\d{4}\b/g);
    if (!years || years.length !== 2) {
      setError("Le format de l'année scolaire doit être YYYY-YYYY (ex: 2025-2026).");
      return;
    }

    const start = parseInt(years[0], 10);
    const end = parseInt(years[1], 10);
    if (Math.abs(end - start) > 1) {
      setError("L'intervalle ne peut pas être supérieur à 1 an.");
      return;
    }

    if (academicYears.find(y => y.name === newYearName)) {
      setError("Cette année scolaire existe déjà.");
      return;
    }

    setLoading(true);
    try {
      // Pour créer l'année, on simule un changement d'année, ce qui va forcer sa création côté backend,
      // puis on recharge la page pour activer cette nouvelle année.
      await updateAllSettings({ ...settings, schoolYear: newYearName });
    } catch (err) {
      setError("Erreur lors de la création.");
      setLoading(false);
    }
  };

  const handleSwitch = async (yearName: string) => {
    if (yearName === currentSchoolYear) return;

    if (window.confirm(`Voulez-vous basculer sur l'année scolaire ${yearName} ? L'application va se recharger.`)) {
      await updateAllSettings({ ...settings, schoolYear: yearName });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (name === currentSchoolYear) {
      alert("Vous ne pouvez pas supprimer l'année scolaire actuellement active. Veuillez d'abord basculer sur une autre année.");
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT l'année scolaire ${name} ainsi que TOUTES ses données associées (élèves, présences, paiements, notes) ? Cette action est irréversible.`)) {
      const success = await deleteAcademicYear(id);
      if (!success) {
        alert("Erreur lors de la suppression de l'année scolaire.");
      }
    }
  };

  // On s'assure que l'année actuelle est toujours dans la liste pour l'affichage
  const displayYears = [...academicYears];
  if (!displayYears.find(y => y.name === currentSchoolYear)) {
    displayYears.push({ id: 'temp-current', name: currentSchoolYear, isCurrent: true });
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1000px] mx-auto animate-slideUp">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            Années Scolaires
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Gérez les années scolaires, basculez entre elles ou créez la prochaine rentrée.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPromoteModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl font-bold transition-all"
          >
            <GraduationCap className="w-5 h-5" />
            Promouvoir les élèves
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Année
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayYears.sort((a, b) => b.name.localeCompare(a.name)).map((year) => {
          const isActive = year.name === currentSchoolYear;

          return (
            <div
              key={year.id}
              className={`p-6 rounded-2xl border-2 transition-all ${
                isActive
                  ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-500 dark:border-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{year.name}</h3>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 rounded-md mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Année en cours
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                        Archivée / Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                {!isActive && (
                  <button
                    onClick={() => handleSwitch(year.name)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-all text-sm"
                  >
                    Basculer sur cette année
                  </button>
                )}
                {!isActive && year.id !== 'temp-current' && (
                  <button
                    onClick={() => handleDelete(year.id, year.name)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all"
                    title="Supprimer cette année scolaire"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleIn border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Créer une nouvelle année</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Cette action créera une nouvelle année scolaire vierge (sans élèves ni présences). Les paramètres et les matières seront conservés.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nom de l'année (ex: 2026-2027)</label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="2026-2027"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer & Basculer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPromoteModal && (
        <PromoteModal
          academicYears={displayYears}
          currentSchoolYear={currentSchoolYear}
          onClose={() => setShowPromoteModal(false)}
        />
      )}
    </div>
  );
};
