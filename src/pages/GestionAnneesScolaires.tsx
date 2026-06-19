import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const GestionAnneesScolaires: React.FC = () => {
  const academicYears = useStore((s) => s.academicYears) || [];
  const currentSchoolYear = useStore((s) => s.schoolYear);
  const deleteAcademicYear = useStore((s) => s.deleteAcademicYear);
  const updateAllSettings = useStore((s) => s.updateAllSettings);
  const settings = useStore((s) => s.settings);

  const [showNewModal, setShowNewModal] = useState(false);
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
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Année
        </button>
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
    </div>
  );
};
