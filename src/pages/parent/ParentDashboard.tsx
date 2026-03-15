import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { parentApi } from '../../services/parentApi';
import {
    CreditCard, Wallet, TrendingUp, Loader2, AlertCircle, UserPlus,
    Search, GraduationCap, X, Megaphone, AlertTriangle, Info, Bell
} from 'lucide-react';
import { LinkStudentModal } from '../../components/LinkStudentModal';

// ── Types annonce ────────────────────────────────────────────
interface Announcement {
    id: string;
    titre: string;
    message: string;
    cible: string;
    importance: 'info' | 'important' | 'urgent';
    createdBy: string;
    createdAt: string;
    date?: string;
}

// ── Styles importance ────────────────────────────────────────
const IMP_STYLES = {
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        header: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Info className="w-5 h-5" />,
        dot: 'bg-blue-500',
        label: 'Information',
    },
    important: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        header: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <AlertCircle className="w-5 h-5" />,
        dot: 'bg-amber-500',
        label: 'Important',
    },
    urgent: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        header: 'bg-red-600',
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: <AlertTriangle className="w-5 h-5" />,
        dot: 'bg-red-500',
        label: 'URGENT',
    },
};

// ── Popup Annonce ────────────────────────────────────────────
const AnnouncementPopup: React.FC<{
    announcement: Announcement;
    onClose: () => void;
}> = ({ announcement, onClose }) => {
    const imp = IMP_STYLES[announcement.importance] || IMP_STYLES.info;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div
                className={`relative w-full max-w-md rounded-3xl shadow-2xl border-2 ${imp.border} ${imp.bg} overflow-hidden animate-slideUp`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-title"
            >
                {/* Header coloré */}
                <div className={`${imp.header} px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                            {imp.icon}
                        </div>
                        <div>
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest block">
                                {imp.label} — École
                            </span>
                            <h3 id="announcement-title" className="text-white font-bold text-base leading-tight">
                                {announcement.titre}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white transition"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Corps */}
                <div className="px-6 py-5">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {announcement.message}
                    </p>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                        <span className="text-xs text-slate-400">
                            Publié le{' '}
                            {new Date(announcement.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </span>
                        <button
                            onClick={onClose}
                            className={`px-5 py-2 ${imp.header} hover:opacity-90 text-white rounded-xl text-sm font-bold transition shadow-md`}
                        >
                            J'ai lu ✓
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Composant principal ──────────────────────────────────────
export const ParentDashboard: React.FC = () => {
    const user = useStore((s) => s.user);
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // État des annonces
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pendingAnnouncements, setPendingAnnouncements] = useState<Announcement[]>([]);
    const [currentPopup, setCurrentPopup] = useState<Announcement | null>(null);
    const [showAnnouncementList, setShowAnnouncementList] = useState(false);
    const seenIds = useRef<Set<string>>(new Set());
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Chargement des données élèves ────────────────────────
    const fetchData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await parentApi.getDashboard();
            setChildren(data.students || []);
        } catch (err: any) {
            setErrorMsg(err.error || "Impossible de charger vos données. Vérifiez votre connexion.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Chargement & tri des annonces ─────────────────────────
    const fetchAnnouncements = useCallback(async () => {
        try {
            const data = await parentApi.getAnnouncements();
            const fetched: Announcement[] = data.announcements || [];

            // Marquer les nouvelles annonces (pas encore vues dans cette session)
            const newOnes = fetched.filter(a => !seenIds.current.has(a.id));

            if (newOnes.length > 0) {
                // Ajouter en file de popups (les urgentes en premier)
                const sorted = [...newOnes].sort((a, b) => {
                    const order = { urgent: 0, important: 1, info: 2 };
                    return (order[a.importance] ?? 2) - (order[b.importance] ?? 2);
                });
                setPendingAnnouncements(prev => {
                    // Éviter les doublons
                    const existing = new Set(prev.map(a => a.id));
                    return [...prev, ...sorted.filter(a => !existing.has(a.id))];
                });
            }

            setAnnouncements(fetched);
        } catch (err) {
            // Silencieux : le parent est peut-être déconnecté
            console.warn('⚠️ Annonces non disponibles:', err);
        }
    }, []);

    // ── Popup : afficher la prochaine en file ─────────────────
    useEffect(() => {
        if (!currentPopup && pendingAnnouncements.length > 0) {
            const [first, ...rest] = pendingAnnouncements;
            setCurrentPopup(first);
            setPendingAnnouncements(rest);
        }
    }, [pendingAnnouncements, currentPopup]);

    // ── Fermer popup et marquer comme vue ────────────────────
    const closePopup = useCallback(() => {
        if (currentPopup) {
            seenIds.current.add(currentPopup.id);
        }
        setCurrentPopup(null);
    }, [currentPopup]);

    // ── Polling toutes les 10 secondes ─────────────────────────
    useEffect(() => {
        fetchData();
        import('../../utils/capacitorNotifications').then(m => m.checkAndAskNotifications());

        // Premier chargement annonces
        fetchAnnouncements();

        // Polling temps réel : toutes les 10 s
        pollingRef.current = setInterval(fetchAnnouncements, 10_000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchAnnouncements]);

    const handleUnlink = async (studentId: string, name: string) => {
        if (!window.confirm(`Voulez-vous vraiment retirer ${name} de votre compte ?`)) return;
        try {
            await parentApi.unlinkStudent(studentId);
            fetchData();
        } catch (err: any) {
            alert(err.error || "Erreur lors du retrait de l'enfant.");
        }
    };

    const totalEcolage = children.reduce((acc, s) => acc + s.ecolage, 0);
    const totalDejaPaye = children.reduce((acc, s) => acc + (s.deja_paye || 0), 0);
    const totalRestant = children.reduce((acc, s) => acc + s.restant, 0);

    // ── Nombre d'annonces non vues ───────────────────────────
    const unseenCount = announcements.filter(a => !seenIds.current.has(a.id)).length;

    if (loading && children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p>Chargement de votre espace parent...</p>
            </div>
        );
    }

    if (errorMsg && children.length === 0) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Erreur de connexion</h3>
                <p className="text-red-700">{errorMsg}</p>
                <button
                    onClick={() => fetchData()}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <>
            {/* ── Popup annonce ── */}
            {currentPopup && (
                <AnnouncementPopup announcement={currentPopup} onClose={closePopup} />
            )}

            <div className="space-y-6">
                {/* ── Barre supérieure ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bienvenue, {user?.nom}</h2>
                        <p className="text-sm text-slate-500">Consultez et suivez la scolarité de vos enfants en temps réel.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Bouton Annonces */}
                        <button
                            id="btn-announcements"
                            onClick={() => {
                                setShowAnnouncementList(v => !v);
                                // Marquer toutes comme vues quand on ouvre la liste
                                if (!showAnnouncementList) {
                                    announcements.forEach(a => seenIds.current.add(a.id));
                                }
                            }}
                            className="relative flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-2xl shadow-sm transition-all font-semibold text-sm"
                        >
                            <Bell className="w-4 h-4" />
                            Annonces
                            {unseenCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                                    {unseenCount > 9 ? '9+' : unseenCount}
                                </span>
                            )}
                        </button>

                        <button
                            id="btn-link-child"
                            onClick={() => setIsLinkModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                        >
                            <UserPlus className="w-5 h-5" />
                            Lier un nouvel enfant
                        </button>
                    </div>
                </div>

                {/* ── Panneau annonces (liste déroulante) ── */}
                {showAnnouncementList && (
                    <div className="bg-white rounded-3xl border border-purple-100 shadow-lg overflow-hidden animate-slideDown">
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Megaphone className="w-5 h-5 text-white" />
                                <h3 className="font-bold text-white">Annonces de l'école</h3>
                                <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                                    {announcements.length}
                                </span>
                            </div>
                            <button onClick={() => setShowAnnouncementList(false)} className="text-white/70 hover:text-white transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                            {announcements.length === 0 ? (
                                <div className="py-10 text-center text-slate-400">
                                    <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm">Aucune annonce pour le moment</p>
                                </div>
                            ) : (
                                announcements.map(a => {
                                    const imp = IMP_STYLES[a.importance] || IMP_STYLES.info;
                                    return (
                                        <div
                                            key={a.id}
                                            className="px-6 py-4 hover:bg-slate-50 transition cursor-pointer"
                                            onClick={() => {
                                                setCurrentPopup(a);
                                                seenIds.current.add(a.id);
                                                setShowAnnouncementList(false);
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${imp.dot}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${imp.badge}`}>
                                                            {imp.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-slate-800 text-sm truncate">{a.titre}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* ── Cards financières ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic group-hover:text-blue-100 transition-colors">Total Scolarité</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">{totalEcolage.toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400 font-medium">Pour {children.length} enfant{children.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic group-hover:text-emerald-100 transition-colors">Déjà Payé</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">{totalDejaPaye.toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400 font-medium">{totalEcolage > 0 ? Math.round((totalDejaPaye / totalEcolage) * 100) : 0}% du total</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic group-hover:text-red-100 transition-colors">Reste à Payer</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-red-700 transition-colors">{totalRestant.toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400 font-medium">À régulariser dès que possible</p>
                        </div>
                    </div>
                </div>

                {/* ── Tableau dossiers scolaires ── */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Dossiers Scolaires</h3>
                        </div>
                        {children.length > 0 && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">{children.length} élève{children.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    <th className="px-6 py-4">Élève / Identifiant</th>
                                    <th className="px-6 py-4">Classe &amp; Cycle</th>
                                    <th className="px-6 py-4">Scolarité Payée</th>
                                    <th className="px-6 py-4">Reste à Payer</th>
                                    <th className="px-6 py-4 text-center">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {children.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <Search className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-slate-800 mb-1">Aucun enfant lié</p>
                                                    <p className="text-sm text-slate-400">Liez vos enfants pour voir leurs informations financières, leurs reçus et leurs badges.</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsLinkModalOpen(true)}
                                                    className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                                                >
                                                    Lier un enfant maintenant
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    children.map(child => (
                                        <tr key={child.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{child.prenom} {child.nom}</p>
                                                <code className="text-[10px] text-slate-300 font-mono tracking-tighter">REF: {child.id}</code>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-700 font-bold text-sm tracking-tight">{child.classe}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{child.cycle}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-emerald-600 font-bold text-base">{(child.deja_paye || 0).toLocaleString()} F</p>
                                                {child.ecolage > 0 && (
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${Math.min(((child.deja_paye || 0) / child.ecolage) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className={`font-bold text-base ${child.restant > 25000 ? 'text-red-500' : 'text-amber-600'}`}>
                                                    {(child.restant || 0).toLocaleString()} F
                                                </p>
                                                <p className="text-[10px] text-slate-400 italic">Total: {(child.ecolage || 0).toLocaleString()} F</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${child.status === 'Soldé' ? 'bg-emerald-100 text-emerald-700' :
                                                        child.status === 'Partiel' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {child.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleUnlink(child.id, `${child.prenom} ${child.nom}`)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Retirer cet enfant"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <LinkStudentModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    onSuccess={() => fetchData()}
                />
            </div>
        </>
    );
};