import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { GraduationCap, Save, CheckCircle2, Plus, Trophy, Loader2, Trash2 } from 'lucide-react';
import { isExamClass, getExamenForClasse } from '../utils/examEligibility';
import { calculerClassementExamen } from '../utils/examCalculations';
import { examApi, ExamSession, ExamNote } from '../services/examApi';

export const NotesExamens: React.FC = () => {
    const students = useStore((s) => s.students);
    const matieres = useStore((s) => s.matieres);
    const classeMatieres = useStore((s) => s.classeMatieres);

    const [sessions, setSessions] = useState<ExamSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [newSessionName, setNewSessionName] = useState('');
    const [creatingSession, setCreatingSession] = useState(false);

    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedMatiereId, setSelectedMatiereId] = useState('');

    const [examNotes, setExamNotes] = useState<ExamNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [showClassement, setShowClassement] = useState(false);

    const classesList = useMemo(() => {
        return Array.from(new Set(students.map(s => s.classe)))
            .filter(isExamClass)
            .sort();
    }, [students]);

    useEffect(() => {
        examApi.getSessions()
            .then(setSessions)
            .catch(() => setSessions([]))
            .finally(() => setLoadingSessions(false));
    }, []);

    const classStudents = useMemo(() => {
        return students.filter(s => s.classe === selectedClasse).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [students, selectedClasse]);

    const availableMatieres = useMemo(() => {
        return classeMatieres
            .filter(cm => cm.classe === selectedClasse)
            .map(cm => ({ cm, mat: matieres.find(m => m.id === cm.matiereId) }))
            .filter((item): item is { cm: typeof item.cm; mat: NonNullable<typeof item.mat> } => item.mat !== undefined);
    }, [classeMatieres, matieres, selectedClasse]);

    const handleCreateSession = async () => {
        if (!newSessionName.trim()) return;
        setCreatingSession(true);
        try {
            const created = await examApi.createSession(newSessionName.trim());
            setSessions(prev => [created, ...prev]);
            setSelectedSessionId(created.id);
            setNewSessionName('');
        } catch (err) {
            setSaveStatus('❌ Erreur lors de la création de la session');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setCreatingSession(false);
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            await examApi.deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (selectedSessionId === id) setSelectedSessionId('');
        } catch (err) {
            setSaveStatus('❌ Erreur lors de la suppression de la session');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    // Charger les notes existantes quand classe/session changent
    useEffect(() => {
        if (!selectedClasse || !selectedSessionId) {
            setExamNotes([]);
            return;
        }
        setLoadingNotes(true);
        examApi.getNotes(selectedClasse, selectedSessionId)
            .then(setExamNotes)
            .catch(() => setExamNotes([]))
            .finally(() => setLoadingNotes(false));
    }, [selectedClasse, selectedSessionId]);

    // Rafraîchir le brouillon quand la matière sélectionnée ou les notes chargées changent
    useEffect(() => {
        if (!selectedMatiereId) {
            setDraftNotes({});
            return;
        }
        const drafts: Record<string, string> = {};
        classStudents.forEach(student => {
            const existing = examNotes.find(n => n.eleve_id === student.id && n.matiere_id === selectedMatiereId);
            drafts[student.id] = existing?.note != null ? String(existing.note) : '';
        });
        setDraftNotes(drafts);
    }, [selectedMatiereId, examNotes, classStudents]);

    const handleNoteChange = (studentId: string, value: string) => {
        const cleaned = value.replace(',', '.');
        if (cleaned !== '' && !/^\d*\.?\d*$/.test(cleaned)) return;
        setDraftNotes(prev => ({ ...prev, [studentId]: cleaned }));
    };

    const handleSave = async () => {
        if (!selectedSessionId || !selectedMatiereId) return;
        const entries = classStudents.map(student => ({
            eleveId: student.id,
            matiereId: selectedMatiereId,
            note: draftNotes[student.id] === '' ? null : parseFloat(draftNotes[student.id])
        }));

        setSaveStatus('💾 Sauvegarde en cours...');
        try {
            const saved = await examApi.saveNotes(selectedSessionId, entries);
            setExamNotes(prev => {
                const others = prev.filter(n => n.matiere_id !== selectedMatiereId);
                return [...others, ...saved];
            });
            setSaveStatus('✅ Notes enregistrées !');
        } catch (err) {
            setSaveStatus('❌ Erreur lors de l\'enregistrement');
        }
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const classement = useMemo(() => {
        if (!selectedClasse || !selectedSessionId) return [];
        return calculerClassementExamen(selectedClasse, students, matieres, classeMatieres, examNotes);
    }, [selectedClasse, selectedSessionId, students, matieres, classeMatieres, examNotes]);

    const examType = selectedClasse ? getExamenForClasse(selectedClasse) : null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Notes d'Examens</h2>
                        <p className="text-purple-100">Saisie des notes et classement pour les sessions d'examen national (CEPD, BEPC, BAC).</p>
                    </div>
                </div>
            </div>

            {/* Gestion des sessions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sessions d'examen</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {loadingSessions ? (
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucune session créée. Créez-en une ci-dessous.</p>
                    ) : (
                        sessions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedSessionId(s.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                                    selectedSessionId === s.id
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'
                                }`}
                            >
                                {s.nom}
                                <Trash2
                                    className="w-3.5 h-3.5 opacity-60 hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                                />
                            </div>
                        ))
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        placeholder="Ex: Devoir Blanc 1, Examen Final..."
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                    <button
                        onClick={handleCreateSession}
                        disabled={creatingSession || !newSessionName.trim()}
                        className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Créer
                    </button>
                </div>
            </div>

            {/* Filtres classe/matière */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Classe (Examen)</label>
                    <select
                        value={selectedClasse}
                        onChange={(e) => { setSelectedClasse(e.target.value); setSelectedMatiereId(''); setShowClassement(false); }}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
                    >
                        <option value="">Sélectionner une classe...</option>
                        {classesList.map(c => <option key={c} value={c}>{c} ({getExamenForClasse(c)})</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[250px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Matière</label>
                    <select
                        value={selectedMatiereId}
                        onChange={(e) => setSelectedMatiereId(e.target.value)}
                        disabled={!selectedClasse || !selectedSessionId}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold disabled:opacity-50"
                    >
                        <option value="">Sélectionner une matière...</option>
                        {availableMatieres.map(item => (
                            <option key={item.mat.id} value={item.mat.id}>
                                {item.mat.nom} (Coef: {item.cm.coefficient})
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setShowClassement(v => !v)}
                    disabled={!selectedClasse || !selectedSessionId}
                    className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
                >
                    <Trophy className="w-5 h-5" />
                    {showClassement ? 'Masquer le classement' : 'Voir le classement'}
                </button>
            </div>

            {!selectedSessionId && (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <GraduationCap className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-semibold text-center max-w-sm">Sélectionnez ou créez une session d'examen pour commencer.</p>
                </div>
            )}

            {/* Classement */}
            {showClassement && selectedSessionId && selectedClasse && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
                        <h3 className="font-bold text-amber-800 flex items-center gap-2">
                            <Trophy className="w-5 h-5" /> Classement — {selectedClasse} ({examType})
                        </h3>
                        {classement.length > 0 && (
                            <span className="text-sm font-bold text-amber-700">Moyenne classe : {classement[0].moyenneClasse.toFixed(2)}/20</span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                                    <th className="p-3 font-bold text-gray-600">Rang</th>
                                    <th className="p-3 font-bold text-gray-600">Élève</th>
                                    <th className="p-3 font-bold text-emerald-600 text-center">Moyenne (/20)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classement.map(r => (
                                    <tr key={r.eleve.id} className="border-b border-gray-50">
                                        <td className="p-3 font-bold text-purple-600">{r.rang}</td>
                                        <td className="p-3 font-medium text-gray-800">{r.eleve.nom} {r.eleve.prenom}</td>
                                        <td className={`p-3 text-center font-bold ${r.moyenne >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.moyenne.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {classement.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-500 font-semibold">Aucun élève dans cette classe.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Saisie */}
            {selectedClasse && selectedSessionId && selectedMatiereId && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            Effectif : <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">{classStudents.length}</span>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-md transition-all active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            Enregistrer les notes
                        </button>
                    </div>

                    {saveStatus && (
                        <div className="p-3 bg-green-50 text-green-700 font-semibold flex items-center justify-center gap-2 text-sm">
                            <CheckCircle2 className="w-5 h-5" /> {saveStatus}
                        </div>
                    )}

                    {loadingNotes ? (
                        <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-sm">
                                        <th className="p-4 font-bold text-gray-600 w-16">N°</th>
                                        <th className="p-4 font-bold text-gray-600">Nom & Prénom(s)</th>
                                        <th className="p-4 font-bold text-purple-600 w-40 text-center">Note (/20)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map((student, index) => (
                                        <tr key={student.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                                            <td className="p-4 text-gray-500 font-medium">{index + 1}</td>
                                            <td className="p-4 font-bold text-gray-800">{student.nom} {student.prenom}</td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0" max="20" step="0.5"
                                                    className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
                                                    value={draftNotes[student.id] ?? ''}
                                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                    placeholder="--"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {classStudents.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-gray-500 font-semibold">Aucun élève trouvé dans cette classe.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
