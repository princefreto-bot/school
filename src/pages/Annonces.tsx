// ============================================================
// ANNONCES — Gestion des annonces de l'école (admin)
// ============================================================
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Megaphone, Plus, Trash2, X, Send, Eye, EyeOff, Clock,
    AlertCircle, Info, AlertTriangle, Filter
} from 'lucide-react';
import type { AnnouncementImportance, AnnouncementTarget } from '../types';

const IMPORTANCE_LABELS: Record<AnnouncementImportance, { label: string; color: string; icon: React.ReactNode }> = {
    info:      { label: 'Information',   color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: <Info className="w-3.5 h-3.5" /> },
    important: { label: 'Important',     color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
    urgent:    { label: 'Urgent',        color: 'bg-red-100 text-red-700 border-red-200',        icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export const Annonces: React.FC = () => {
    const user            = useStore(s => s.user);
    const students        = useStore(s => s.students);
    const announcements   = useStore(s => s.announcements);
    const announcementReads = useStore(s => s.announcementReads);
    const addAnnouncement = useStore(s => s.addAnnouncement);
    const deleteAnnouncement = useStore(s => s.deleteAnnouncement);

    const [showForm, setShowForm]     = useState(false);
    const [titre, setTitre]           = useState('');
    const [message, setMessage]       = useState('');
    const [cible, setCible]           = useState<AnnouncementTarget>('all');
    const [importance, setImportance] = useState<AnnouncementImportance>('info');

    const classes = [...new Set(students.map(s => s.classe))].sort();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim() || !message.trim()) return;
        addAnnouncement({
            titre: titre.trim(),
            message: message.trim(),
            date: new Date().toISOString().split('T')[0],
            cible,
            importance,
            createdBy: user?.nom || 'Admin',
        });
        setTitre('');
        setMessage('');
        setCible('all');
        setImportance('info');
        setShowForm(false);
    };

    const handleDelete = (id: string, titre: string) => {
        if (window.confirm(`Supprimer l'annonce "${titre}" ?`)) {
            deleteAnnouncement(id);
        }
    };

    // Calcul stats de lecture pour chaque annonce
    const getReadStats = (annonceId: string) => {
        const reads = announcementReads.filter(r => r.announcementId === annonceId && r.readAt);
        const parentsTotal = useStore.getState().connectedParentsCount || 0;
        return { lus: reads.length, total: Math.max(reads.length, parentsTotal) };
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* En-tête */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Annonces de l'école</h2>
                            <p className="text-purple-200 text-sm">
                                Communication directe avec les parents — popup obligatoire
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Annuler' : 'Créer une annonce'}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{announcements.length}</p>
                        <p className="text-xs text-purple-200">Annonces</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">
                            {announcements.filter(a => a.importance === 'urgent').length}
                        </p>
                        <p className="text-xs text-purple-200">Urgentes</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">
                            {announcementReads.filter(r => r.readAt).length}
                        </p>
                        <p className="text-xs text-purple-200">Confirmations "J'ai lu"</p>
                    </div>
                </div>
            </div>

            {/* Formulaire création */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slideDown">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Send className="w-4 h-4 text-purple-600" />
                        Nouvelle annonce
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Titre */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                Titre de l'annonce *
                            </label>
                            <input
                                value={titre}
                                onChange={e => setTitre(e.target.value)}
                                placeholder="Ex: Réunion parents-professeurs"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                Message complet *
                            </label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Rédigez le message qui sera affiché aux parents..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Cible */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                    <Filter className="w-3 h-3 inline mr-1" />
                                    Destinataires
                                </label>
                                <select
                                    value={cible}
                                    onChange={e => setCible(e.target.value as AnnouncementTarget)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="all">Toutes les classes</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Importance */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                    Niveau d'importance
                                </label>
                                <div className="flex gap-2">
                                    {(['info', 'important', 'urgent'] as const).map(level => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setImportance(level)}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${importance === level
                                                ? IMPORTANCE_LABELS[level].color + ' ring-2 ring-offset-1'
                                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {IMPORTANCE_LABELS[level].icon}
                                            {IMPORTANCE_LABELS[level].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!titre.trim() || !message.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                        >
                            <Send className="w-4 h-4" />
                            Publier l'annonce
                        </button>
                    </form>
                </div>
            )}

            {/* Liste des annonces */}
            <div className="space-y-3">
                {announcements.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Aucune annonce publiée</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Créez votre première annonce pour informer les parents
                        </p>
                    </div>
                ) : (
                    announcements.map(a => {
                        const imp = IMPORTANCE_LABELS[a.importance];
                        const stats = getReadStats(a.id);
                        const nonLus = stats.total - stats.lus;
                        return (
                            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Badge importance + cible */}
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${imp.color}`}>
                                                {imp.icon} {imp.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {a.cible === 'all' ? 'Toutes les classes' : `Classe: ${a.cible}`}
                                            </span>
                                            <span className="text-[10px] text-gray-300 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Titre + Message */}
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{a.titre}</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{a.message}</p>

                                        {/* Stats lecture */}
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="font-bold">{stats.lus}</span>
                                                <span className="text-gray-400">parent{stats.lus > 1 ? 's' : ''} informé{stats.lus > 1 ? 's' : ''}</span>
                                            </div>
                                            {nonLus > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                    <span className="font-bold">{nonLus}</span>
                                                    <span className="text-gray-400">non lu{nonLus > 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleDelete(a.id, a.titre)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
