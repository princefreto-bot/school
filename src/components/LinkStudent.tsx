// ============================================================
// COMPOSANT — Liaison Parent-Enfant
// ============================================================
import React, { useState, useEffect } from 'react';
import { parentApi } from '../services/parentApi';
import { Search, UserPlus, GraduationCap, X, Check, AlertCircle } from 'lucide-react';

interface LinkStudentProps {
    onComplete: () => void;
}

export const LinkStudent: React.FC<LinkStudentProps> = ({ onComplete }) => {
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState<string | null>(null);
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
            setStudents(result.students);
        } catch (err: any) {
            setError("Erreur lors de la recherche.");
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async (studentId: string) => {
        setLinking(studentId);
        setError('');
        try {
            await parentApi.linkStudent(studentId);
            setMessage("Élève lié avec succès !");
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err: any) {
            setError(err.error || "Impossible de lier cet élève.");
        } finally {
            setLinking(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Enregistrez votre enfant</h2>
                <p className="text-blue-200 text-sm">
                    Recherchez votre enfant par son nom pour lier son dossier à votre compte.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Entrez le nom de l'élève..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 trasition"
                />
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {students.map((student) => (
                    <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{student.prenom} {student.nom}</p>
                                <p className="text-blue-300 text-xs">{student.classe} ({student.cycle})</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleLink(student.id)}
                            disabled={linking !== null}
                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all disabled:opacity-50"
                        >
                            {linking === student.id ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <UserPlus className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                ))}

                {!loading && search.length >= 2 && students.length === 0 && (
                    <div className="text-center py-8 text-blue-300/60 flex flex-col items-center gap-2">
                        <X className="w-8 h-8 opacity-20" />
                        <p>Aucun élève trouvé.</p>
                    </div>
                )}
            </div>

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
                Passer cette étape pour le moment
            </button>
        </div>
    );
};
