import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Search, User, ChevronRight, HelpCircle, BookOpen } from 'lucide-react';

export const SelectionEnseignant: React.FC = () => {
  const classeMatieres = useStore((s) => s.classeMatieres);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const schoolName = useStore((s) => s.schoolName);

  const [search, setSearch] = useState('');

  // Extract unique teacher names from classeMatieres list
  const uniqueTeachers = useMemo(() => {
    const list = classeMatieres
      .map((cm) => cm.professeur)
      .filter((p) => p && p.trim() !== '');
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [classeMatieres]);

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    return uniqueTeachers.filter((t) =>
      t.toLowerCase().includes(search.toLowerCase())
    );
  }, [uniqueTeachers, search]);

  const handleSelect = (name: string) => {
    localStorage.setItem('selected_teacher_name', name);
    // Force redirect to saisie_notes
    setCurrentPage('saisie_notes');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 animate-slideUp">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-2">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            Espace Enseignants
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Sélectionnez votre nom pour accéder à vos classes et saisir les notes.
          </p>
        </div>

        {uniqueTeachers.length === 0 ? (
          /* Empty state if no teachers are configured in class configuration */
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Aucun enseignant trouvé</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Aucun enseignant n'a été affecté aux matières de l'établissement ({schoolName}) pour le moment. Veuillez demander à l'administrateur de vous affecter à vos matières respectives.
            </p>
          </div>
        ) : (
          /* Teacher List and Search */
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher votre nom..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredTeachers.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-400 font-medium">
                  Aucun résultat ne correspond à votre recherche.
                </p>
              ) : (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher}
                    onClick={() => handleSelect(teacher)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/40 dark:hover:bg-indigo-500/10 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-left">
                        {teacher}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
