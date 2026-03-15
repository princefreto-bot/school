import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MatiereCategorie, Matiere, ClasseMatiere } from '../types';
import { v4 as uuid } from '../utils/uuid';
import { BookOpen, Plus, Trash2, Settings2, Users } from 'lucide-react';

export const GestionAcademique: React.FC = () => {
    const { 
        matieres, setMatieres, addMatiere, deleteMatiere,
        classeMatieres, addClasseMatiere, deleteClasseMatiere,
        students
    } = useStore();

    // Extraire la liste unique des classes depuis les étudiants
    const classesList = Array.from(new Set(students.map(s => s.classe))).sort();

    const [activeTab, setActiveTab] = useState<'matieres' | 'liaisons'>('matieres');

    // États formulaire Matière
    const [nomMatiere, setNomMatiere] = useState('');
    const [categorie, setCategorie] = useState<MatiereCategorie>('1-MATIERES LITTERAIRES');

    // États formulaire Liaison (ClasseMatiere)
    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedMatiere, setSelectedMatiere] = useState('');
    const [professeur, setProfesseur] = useState('');
    const [coefficient, setCoefficient] = useState(1);

    const handleAddMatiere = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomMatiere.trim()) return;
        addMatiere({ id: uuid(), nom: nomMatiere.trim(), categorie });
        setNomMatiere('');
    };

    const handleAddLiaison = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClasse || !selectedMatiere || coefficient <= 0) return;
        // Vérifier si cette matière est déjà liée à cette classe
        const existing = classeMatieres.find(cm => cm.classe === selectedClasse && cm.matiereId === selectedMatiere);
        if (existing) {
            alert('Cette matière est déjà enseignée dans cette classe.');
            return;
        }

        addClasseMatiere({
            id: uuid(),
            classe: selectedClasse,
            matiereId: selectedMatiere,
            professeur: professeur.trim(),
            coefficient
        });
        setSelectedMatiere('');
        setProfesseur('');
        setCoefficient(1);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-fuchsia-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Gestion Académique</h2>
                        <p className="text-purple-100">Configurez les matières et les coefficients par classe.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 px-2">
                <button
                    onClick={() => setActiveTab('matieres')}
                    className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                        activeTab === 'matieres' ? 'border-fuchsia-600 text-fuchsia-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Settings2 className="w-4 h-4" /> Catalogue des Matières
                </button>
                <button
                    onClick={() => setActiveTab('liaisons')}
                    className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                        activeTab === 'liaisons' ? 'border-fuchsia-600 text-fuchsia-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users className="w-4 h-4" /> Matières par Classe & Coef.
                </button>
            </div>

            {/* Contenu MATIERES */}
            {activeTab === 'matieres' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Créer une matière</h3>
                        <form onSubmit={handleAddMatiere} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la matière</label>
                                <input
                                    type="text"
                                    required
                                    value={nomMatiere}
                                    onChange={(e) => setNomMatiere(e.target.value)}
                                    placeholder="Ex: Mathématiques"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    value={categorie}
                                    onChange={(e) => setCategorie(e.target.value as MatiereCategorie)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                >
                                    <option value="1-MATIERES LITTERAIRES">1-MATIERES LITTERAIRES</option>
                                    <option value="2-MATIERES SCIENTIFIQUES">2-MATIERES SCIENTIFIQUES</option>
                                    <option value="3-AUTRES MATIERES">3-AUTRES MATIERES</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 bg-fuchsia-600 text-white font-semibold rounded-xl hover:bg-fuchsia-700 transition flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Ajouter la matière
                            </button>
                        </form>
                    </div>

                    <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Répertoire global ({matieres.length})</h3>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {matieres.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-xl">Aucune matière n'est configurée.</p>
                            ) : (
                                ['1-MATIERES LITTERAIRES', '2-MATIERES SCIENTIFIQUES', '3-AUTRES MATIERES'].map((cat) => (
                                    <div key={cat} className="mb-4">
                                        <h4 className="font-semibold text-xs text-fuchsia-600 uppercase tracking-widest bg-fuchsia-50 p-2 rounded-lg mb-2">
                                            {cat.substring(2)}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {matieres.filter(m => m.categorie === cat).map(mat => (
                                                <div key={mat.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:shadow-md transition">
                                                    <span className="font-medium text-gray-700">{mat.nom}</span>
                                                    <button onClick={() => deleteMatiere(mat.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu LIAISONS */}
            {activeTab === 'liaisons' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Assigner à une classe</h3>
                        <form onSubmit={handleAddLiaison} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                                <select
                                    required
                                    value={selectedClasse}
                                    onChange={(e) => setSelectedClasse(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                                <select
                                    required
                                    value={selectedMatiere}
                                    onChange={(e) => setSelectedMatiere(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {matieres.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.categorie.substring(2)})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Professeur (Optionnel)</label>
                                <input
                                    type="text"
                                    value={professeur}
                                    onChange={(e) => setProfesseur(e.target.value)}
                                    placeholder="Ex: M. DUBOIS"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
                                <input
                                    type="number"
                                    required
                                    min="0.5"
                                    step="0.5"
                                    value={coefficient}
                                    onChange={(e) => setCoefficient(parseFloat(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Assigner
                            </button>
                        </form>
                    </div>

                    <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Configuration par Classe</h3>
                            <select
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                value={selectedClasse}
                                onChange={(e) => setSelectedClasse(e.target.value)}
                            >
                                <option value="">Toutes les classes</option>
                                {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        
                        <div className="max-h-[500px] overflow-y-auto">
                            {classeMatieres.filter(cm => selectedClasse === '' || cm.classe === selectedClasse).length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-xl">Aucune matière n'est assignée pour cette sélection.</p>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <th className="p-3 font-semibold rounded-tl-xl border-b border-gray-100">Classe</th>
                                            <th className="p-3 font-semibold border-b border-gray-100">Matière</th>
                                            <th className="p-3 font-semibold border-b border-gray-100">Professeur</th>
                                            <th className="p-3 font-semibold border-b border-gray-100">Coef.</th>
                                            <th className="p-3 font-semibold rounded-tr-xl border-b border-gray-100 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {classeMatieres
                                            .filter(cm => selectedClasse === '' || cm.classe === selectedClasse)
                                            .sort((a,b) => a.classe.localeCompare(b.classe))
                                            .map(cm => {
                                                const mat = matieres.find(m => m.id === cm.matiereId);
                                                return (
                                                    <tr key={cm.id} className="border-b border-gray-50 hover:bg-purple-50 transition-colors">
                                                        <td className="p-3 font-bold text-gray-800">{cm.classe}</td>
                                                        <td className="p-3 text-gray-700 font-medium">{mat ? mat.nom : 'Inconnue'}</td>
                                                        <td className="p-3 text-gray-500">{cm.professeur || '-'}</td>
                                                        <td className="p-3">
                                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold">{cm.coefficient}</span>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button onClick={() => deleteClasseMatiere(cm.id)} className="text-red-400 hover:text-red-600 p-1">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
