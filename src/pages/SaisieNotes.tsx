import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Edit3, Save, CheckCircle2, User, LogOut } from 'lucide-react';
import { Note, PeriodeType } from '../types';
import { v4 as uuid } from '../utils/uuid';

export const SaisieNotes: React.FC = () => {
    const currentPeriode = useStore((s) => s.currentPeriode);
    const setCurrentPeriode = useStore((s) => s.setCurrentPeriode);
    const students = useStore((s) => s.students);
    const matieres = useStore((s) => s.matieres);
    const classeMatieres = useStore((s) => s.classeMatieres);
    const user = useStore((s) => s.user);
    const setCurrentPage = useStore((s) => s.setCurrentPage);

    const selectedTeacherName = useMemo(() => {
        return localStorage.getItem('selected_teacher_name') || '';
    }, []);

    React.useEffect(() => {
        if (user?.role === 'enseignant' && !selectedTeacherName) {
            setCurrentPage('selection_enseignant');
        }
    }, [user, selectedTeacherName, setCurrentPage]);

    const periods: PeriodeType[] = ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3', 'SEMESTRE 1', 'SEMESTRE 2'];
    
    const classesList = useMemo(() => {
        if (user?.role === 'enseignant' && selectedTeacherName) {
            return Array.from(new Set(
                classeMatieres
                    .filter(cm => cm.professeur === selectedTeacherName)
                    .map(cm => cm.classe)
            )).sort();
        }
        return Array.from(new Set(students.map(s => s.classe))).sort();
    }, [students, classeMatieres, user, selectedTeacherName]);

    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedMatiereId, setSelectedMatiereId] = useState('');
    const [saisieMode, setSaisieMode] = useState<'matieres' | 'moyenne_generale'>('matieres');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const selectedClassObj = students.find(s => s.classe === selectedClasse);
    const selectedCycle = selectedClassObj?.cycle;
    const availablePeriods = selectedCycle 
        ? (selectedCycle === 'Lycée' 
            ? ['SEMESTRE 1', 'SEMESTRE 2'] as PeriodeType[]
            : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'] as PeriodeType[])
        : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3', 'SEMESTRE 1', 'SEMESTRE 2'] as PeriodeType[];

    React.useEffect(() => {
        if (selectedClasse) {
            const cycle = students.find(s => s.classe === selectedClasse)?.cycle || 'Collège';
            const isLycee = cycle === 'Lycée';
            const allowed = isLycee ? ['SEMESTRE 1', 'SEMESTRE 2'] : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];
            if (!allowed.includes(currentPeriode)) {
                setCurrentPeriode(allowed[0] as PeriodeType);
            }
        }
    }, [selectedClasse, students, currentPeriode, setCurrentPeriode]);

    // Filter students for the selected class
    const classStudents = useMemo(() => {
        return students.filter(s => s.classe === selectedClasse).sort((a,b) => a.nom.localeCompare(b.nom));
    }, [students, selectedClasse]);

    // Matieres available for this class
    const availableMatieres = useMemo(() => {
        let list = classeMatieres.filter(cm => cm.classe === selectedClasse);
        if (user?.role === 'enseignant' && selectedTeacherName) {
            list = list.filter(cm => cm.professeur === selectedTeacherName);
        }
        return list
            .map(cm => ({ cm, mat: matieres.find(m => m.id === cm.matiereId) }))
            .filter(item => item.mat !== undefined);
    }, [classeMatieres, matieres, selectedClasse, user, selectedTeacherName]);

    // Local state for grades being edited (stored as strings to allow typing decimals like "12.")
    const [draftNotes, setDraftNotes] = useState<Record<string, Record<string, string>>>({});
    const isDirtyRef = React.useRef(false);
    const prevSelectionRef = React.useRef<string>('');

    // Déclencher un rechargement forcé du cloud lors de la sélection pour s'assurer que les données sont fraîches
    React.useEffect(() => {
        const targetMatiereId = saisieMode === 'moyenne_generale' ? 'moyenne_generale' : selectedMatiereId;
        if (selectedClasse && targetMatiereId) {
            console.log(`📥 [SaisieNotes] Chargement forcé des notes pour la classe ${selectedClasse} et la matière ${targetMatiereId}...`);
            useStore.getState().fetchAllFromBackend(true);
        }
    }, [selectedClasse, selectedMatiereId, saisieMode, currentPeriode]);

    // Charge les notes existantes dans le brouillon quand la sélection, les élèves ou les notes du store changent
    React.useEffect(() => {
        const targetMatiereId = saisieMode === 'moyenne_generale' ? 'moyenne_generale' : selectedMatiereId;
        const selectionKey = `${selectedClasse}|${targetMatiereId}|${currentPeriode}`;

        // Si la sélection a changé, on n'est plus "dirty", on peut recharger
        if (selectionKey !== prevSelectionRef.current) {
            prevSelectionRef.current = selectionKey;
            isDirtyRef.current = false;
        }

        // Si des modifications locales sont en cours (dirty), on ne recharge pas depuis le store
        // afin de ne pas écraser la saisie active de l'utilisateur.
        if (isDirtyRef.current) return;

        if (!selectedClasse || !targetMatiereId) {
            setDraftNotes({});
            return;
        }

        const currentNotes = useStore.getState().notes;
        const newDrafts: Record<string, Record<string, string>> = {};
        
        classStudents.forEach(student => {
            const existing = currentNotes.find(n => n.eleveId === student.id && n.matiereId === targetMatiereId && n.periode === currentPeriode);
            newDrafts[student.id] = {
                noteClasse: existing?.noteClasse?.toString() || '',
                noteDevoir: existing?.noteDevoir?.toString() || '',
                noteCompo: existing?.noteCompo?.toString() || ''
            };
        });
        setDraftNotes(newDrafts);
    }, [selectedClasse, selectedMatiereId, saisieMode, currentPeriode, classStudents, useStore((s) => s.notes)]);

    const handleNoteChange = (studentId: string, field: 'noteClasse' | 'noteDevoir' | 'noteCompo', value: string) => {
        // Validation basique (on autorise chiffres, point, virgule)
        const cleanedValue = value.replace(',', '.');
        if (cleanedValue !== '' && !/^\d*\.?\d*$/.test(cleanedValue)) return;

        isDirtyRef.current = true;
        setDraftNotes(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: cleanedValue
            }
        }));
    };

    const handleSave = async () => {
        const targetMatiereId = saisieMode === 'moyenne_generale' ? 'moyenne_generale' : selectedMatiereId;
        if (!targetMatiereId || !selectedClasse) return;

        const currentNotes = useStore.getState().notes;
        const batch: Note[] = [];
        
        classStudents.forEach(student => {
            const draft = draftNotes[student.id];
            if (draft) {
                // Chercher si une note existe déjà pour cet élève/matière/période
                const existingNote = currentNotes.find(n => 
                    n.eleveId === student.id && 
                    n.matiereId === targetMatiereId && 
                    n.periode === currentPeriode
                );

                const nC = saisieMode === 'moyenne_generale' ? null : (draft.noteClasse === '' ? null : parseFloat(draft.noteClasse));
                const nD = saisieMode === 'moyenne_generale' ? null : (draft.noteDevoir === '' ? null : parseFloat(draft.noteDevoir));
                const nCp = draft.noteCompo === '' ? null : parseFloat(draft.noteCompo);

                batch.push({
                    // Réutiliser l'UUID existant ou en créer un nouveau seulement si nécessaire
                    id: existingNote ? existingNote.id : uuid(),
                    eleveId: student.id,
                    matiereId: targetMatiereId,
                    periode: currentPeriode,
                    noteClasse: isNaN(nC as any) ? null : nC,
                    noteDevoir: isNaN(nD as any) ? null : nD,
                    noteCompo: isNaN(nCp as any) ? null : nCp,
                });
            }
        });
        
        if (batch.length > 0) {
            // 1. Sauvegarder localement
            useStore.getState().upsertNotes(batch);
            isDirtyRef.current = false;
            
            // 2. Synchroniser vers le cloud (une seule fois, après toutes les notes)
            setSaveStatus('💾 Sauvegarde en cours...');
            try {
                const allNotes = useStore.getState().notes;
                console.log(`📤 [Notes] Envoi de ${allNotes.length} notes vers le cloud...`);
                const { syncToBackend } = await import('../services/backendSync');
                const result = await syncToBackend({ notes: allNotes });
                // Mettre à jour le timestamp pour bloquer le polling pendant 55s
                useStore.setState({ lastSyncTimestamp: Date.now() });
                if (result) {
                    setSaveStatus('✅ Notes enregistrées et synchronisées !');
                    console.log('✅ [Notes] Sync cloud réussie, résultat:', result);
                } else {
                    setSaveStatus('⚠️ Sauvé localement, mais échec de la synchronisation cloud');
                    console.warn('⚠️ [Notes] syncToBackend a retourné null');
                }
            } catch (err) {
                console.error('❌ [Notes] Erreur sync cloud:', err);
                setSaveStatus('⚠️ Sauvé localement, sync cloud en attente');
            }
        } else {
            setSaveStatus('Aucune note à enregistrer');
        }
        
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const calculateMoyenne = (draft: Record<string, string> | undefined) => {
        if (!draft) return '--';
        const nC = draft.noteClasse === '' ? null : parseFloat(draft.noteClasse);
        const nD = draft.noteDevoir === '' ? null : parseFloat(draft.noteDevoir);
        const nCp = draft.noteCompo === '' ? null : parseFloat(draft.noteCompo);

        let moyClasseMat: number | null = null;
        const notesEvaluations = [nC, nD].filter(x => x !== null && !isNaN(x)) as number[];
        if (notesEvaluations.length > 0) {
            moyClasseMat = notesEvaluations.reduce((a,b) => a+b, 0) / notesEvaluations.length;
        }

        const paramPourMoyenne = [moyClasseMat, nCp].filter(x => x !== null && !isNaN(x as any)) as number[];
        if (paramPourMoyenne.length > 0) {
            const avgMatiere = paramPourMoyenne.reduce((a,b) => a+b, 0) / paramPourMoyenne.length;
            return avgMatiere.toFixed(2);
        }
        return '--';
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Saisie des Notes & Moyennes</h2>
                        <p className="text-pink-100">Saisissez les notes d'évaluation par matière ou directement la moyenne générale de la classe.</p>
                    </div>
                </div>
            </div>

            {/* Bascule Mode de Saisie */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 text-base">Méthode de saisie</h3>
                    <p className="text-gray-500 text-xs">Choisissez de saisir par matière individuelle ou directement la moyenne générale de la classe.</p>
                </div>
                <div className="flex p-1 rounded-xl w-fit border border-gray-200 bg-slate-100">
                    <button
                        onClick={() => { setSaisieMode('matieres'); setSelectedMatiereId(''); }}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${saisieMode === 'matieres' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Notes par matière
                    </button>
                    <button
                        onClick={() => { setSaisieMode('moyenne_generale'); setSelectedMatiereId('moyenne_generale'); }}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${saisieMode === 'moyenne_generale' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Moyennes Générales directes
                    </button>
                </div>
            </div>

            {/* Teacher session banner */}
            {user?.role === 'enseignant' && selectedTeacherName && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Enseignant Connecté</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedTeacherName}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('selected_teacher_name');
                            setCurrentPage('selection_enseignant');
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 active:scale-95 shadow-md shadow-indigo-600/10 w-full sm:w-auto justify-center"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Changer d'enseignant
                    </button>
                </div>
            )}

            {/* Filtres de sélection */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Période Académique</label>
                    <select
                        value={currentPeriode}
                        onChange={(e) => setCurrentPeriode(e.target.value as PeriodeType)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-800"
                    >
                        {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
                    <select
                        value={selectedClasse}
                        onChange={(e) => { setSelectedClasse(e.target.value); setSelectedMatiereId(''); }}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold"
                    >
                        <option value="">Sélectionner une classe...</option>
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {saisieMode === 'matieres' && (
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Matière</label>
                        <select
                            value={selectedMatiereId}
                            onChange={(e) => setSelectedMatiereId(e.target.value)}
                            disabled={!selectedClasse}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold disabled:opacity-50"
                        >
                            <option value="">Sélectionner une matière...</option>
                            {availableMatieres.map(item => (
                                <option key={item.mat!.id} value={item.mat!.id}>
                                    {item.mat!.nom} (Coef: {item.cm.coefficient})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Table de Saisie */}
            {selectedClasse && (saisieMode === 'moyenne_generale' || selectedMatiereId) ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            Effectif de la classe : <span className="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">{classStudents.length}</span>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 shadow-md transition-all active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            {saisieMode === 'moyenne_generale' ? 'Enregistrer les moyennes' : 'Enregistrer les notes'}
                        </button>
                    </div>

                    {saveStatus && (
                        <div className="p-3 bg-green-50 text-green-700 font-semibold flex items-center justify-center gap-2 text-sm">
                            <CheckCircle2 className="w-5 h-5" /> {saveStatus}
                        </div>
                    )}

                    {/* Desktop table layout */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white border-b border-gray-200 text-sm">
                                    <th className="p-4 font-bold text-gray-600 w-16">N°</th>
                                    <th className="p-4 font-bold text-gray-600">Nom & Prénom(s)</th>
                                    {saisieMode === 'matieres' ? (
                                        <>
                                            <th className="p-4 font-bold text-blue-600 w-40 text-center">Interro. (/20)</th>
                                            <th className="p-4 font-bold text-indigo-600 w-40 text-center">Devoir (/20)</th>
                                            <th className="p-4 font-bold text-purple-600 w-40 text-center">Compo. (/20)</th>
                                            <th className="p-4 font-bold text-emerald-600 w-40 text-center">Moyenne (/20)</th>
                                        </>
                                    ) : (
                                        <th className="p-4 font-bold text-emerald-600 w-64 text-center">Moyenne Générale (/20)</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map((student, index) => (
                                    <tr key={student.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                                        <td className="p-4 text-gray-500 font-medium">{index + 1}</td>
                                        <td className="p-4 font-bold text-gray-800">
                                            {student.nom} {student.prenom}
                                        </td>
                                        {saisieMode === 'matieres' ? (
                                            <>
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="20" step="0.5"
                                                        className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                                                        value={draftNotes[student.id]?.noteClasse ?? ''}
                                                        onChange={(e) => handleNoteChange(student.id, 'noteClasse', e.target.value)}
                                                        placeholder="--"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="20" step="0.5"
                                                        className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                                                        value={draftNotes[student.id]?.noteDevoir ?? ''}
                                                        onChange={(e) => handleNoteChange(student.id, 'noteDevoir', e.target.value)}
                                                        placeholder="--"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="20" step="0.5"
                                                        className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
                                                        value={draftNotes[student.id]?.noteCompo ?? ''}
                                                        onChange={(e) => handleNoteChange(student.id, 'noteCompo', e.target.value)}
                                                        placeholder="--"
                                                    />
                                                </td>
                                                <td className="p-4 text-center font-bold text-emerald-600 text-lg">
                                                    {calculateMoyenne(draftNotes[student.id])}
                                                </td>
                                            </>
                                        ) : (
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.01"
                                                    className="w-32 px-3 py-2 text-center border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 bg-emerald-50/20 text-lg"
                                                    value={draftNotes[student.id]?.noteCompo ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteCompo', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {classStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold">
                                            Aucun élève trouvé dans cette classe.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile responsive card list layout */}
                    <div className="md:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-900/30">
                        {classStudents.map((student, index) => (
                            <div key={student.id} className="bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400">Élève N° {index + 1}</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">
                                        {student.classe}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                    {student.nom} {student.prenom}
                                </h4>
                                {saisieMode === 'matieres' ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Interro</span>
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.5"
                                                    className="w-full px-2 py-2.5 text-center border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                                    value={draftNotes[student.id]?.noteClasse ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteClasse', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Devoir</span>
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.5"
                                                    className="w-full px-2 py-2.5 text-center border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                                    value={draftNotes[student.id]?.noteDevoir ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteDevoir', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Compo</span>
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.5"
                                                    className="w-full px-2 py-2.5 text-center border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                                    value={draftNotes[student.id]?.noteCompo ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, 'noteCompo', e.target.value)}
                                                    placeholder="--"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/40">
                                            <span className="text-xs font-semibold text-slate-500">Moyenne calculée :</span>
                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                                {calculateMoyenne(draftNotes[student.id])} / 20
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Moyenne Générale</span>
                                        <input
                                            type="number"
                                            min="0" max="20" step="0.01"
                                            className="w-32 px-3 py-2 text-center border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white dark:bg-slate-900 dark:text-white text-emerald-700 text-lg shadow-sm"
                                            value={draftNotes[student.id]?.noteCompo ?? ''}
                                            onChange={(e) => handleNoteChange(student.id, 'noteCompo', e.target.value)}
                                            placeholder="--"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {classStudents.length === 0 && (
                            <p className="text-center py-8 text-gray-500 font-semibold">
                                Aucun élève trouvé dans cette classe.
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Edit3 className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-semibold text-lg text-center max-w-sm">
                        Sélectionnez une classe {saisieMode === 'matieres' ? 'et une matière ' : ''}pour commencer la saisie.
                    </p>
                </div>
            )}
        </div>
    );
};
