import React, { useState, useEffect } from 'react';
import { parentApi } from '../services/parentApi';
import { Search, UserPlus, GraduationCap, X, Check, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface LinkStudentProps {
    onComplete: () => void;
}

export const LinkStudent: React.FC<LinkStudentProps> = ({ onComplete }) => {
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Recherche automatique avec debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim().length >= 2) {
                handleSearch();
            } else {
                setStudents([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await parentApi.searchStudents({ nom: search });
            // Éliminer les doublons côté frontend juste au cas où
            const uniqueStudents = Array.from(new Map(result.students.map((s: any) => [s.id, s])).values());
            setStudents(uniqueStudents);
        } catch (err: any) {
            setError("Erreur lors de la recherche.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkLink = async () => {
        if (selectedIds.length === 0) return;
        setLinking(true);
        setError('');
        try {
            // Utilisation du nouvel endpoint supportant les tableaux d'IDs
            await fetch('/api/students/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('parent_token')}`
                },
                body: JSON.stringify({ studentIds: selectedIds })
            });

            setMessage(`${selectedIds.length} enfant(s) lié(s) avec succès !`);
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err: any) {
            setError("Impossible de lier les élèves sélectionnés.");
        } finally {
            setLinking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Enregistrez vos enfants</h2>
                <p className="text-blue-200 text-sm">
                    Recherchez vos enfants par leur nom et cochez-les pour les lier à votre compte.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Entrez un nom..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 trasition"
                />
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {students.map((student) => {
                    const isSelected = selectedIds.includes(student.id);
                    return (
                        <div
                            key={student.id}
                            onClick={() => toggleSelect(student.id)}
                            className={`flex items-center justify-between p-4 border rounded-xl transition cursor-pointer group ${isSelected
                                ? 'bg-blue-600/20 border-blue-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600' : 'bg-blue-600/30'}`}>
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{student.prenom} {student.nom}</p>
                                    <p className="text-blue-300 text-xs">{student.classe} ({student.cycle})</p>
                                </div>
                            </div>

                            <div className={isSelected ? 'text-blue-400' : 'text-slate-500'}>
                                {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                            </div>
                        </div>
                    );
                })}

                {!loading && search.length >= 2 && students.length === 0 && (
                    <div className="text-center py-8 text-blue-300/60 flex flex-col items-center gap-2">
                        <X className="w-8 h-8 opacity-20" />
                        <p>Aucun élève trouvé.</p>
                    </div>
                )}
            </div>

            {selectedIds.length > 0 && (
                <button
                    onClick={handleBulkLink}
                    disabled={linking}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {linking ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="w-5 h-5" />
                            Lier les {selectedIds.length} enfant(s) sélectionnés
                        </>
                    )}
                </button>
            )}

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {message && (
                <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    {message}
                </div>
            )}

            <button
                onClick={onComplete}
                className="w-full text-blue-300 text-sm hover:text-white transition py-2"
            >
                {selectedIds.length > 0 ? 'Annuler' : 'Passer cette étape pour le moment'}
            </button>
        </div>
    );
};
