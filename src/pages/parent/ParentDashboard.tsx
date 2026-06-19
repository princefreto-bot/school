import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { parentApi } from '../../services/parentApi';
import { useNavigate, useParams } from 'react-router-dom';
import {
    CreditCard, Wallet, TrendingUp, Loader2, AlertCircle, UserPlus,
    Search, GraduationCap, X, Megaphone, AlertTriangle, Info, Bell, MessageSquare,
    FileText, Play, Download
} from 'lucide-react';
import { LinkStudentModal } from '../../components/LinkStudentModal';
import { SupportModal } from '../../components/SupportModal';
import { LicenseLockScreen } from '../../components/LicenseLockScreen';
import { chatApi } from '../../services/chatApi';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';

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
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-900',
        header: 'bg-red-600',
        badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200',
        icon: <AlertTriangle className="w-5 h-5" />,
        dot: 'bg-red-500',
        label: 'URGENT',
    },
};


// ── Composant principal ──────────────────────────────────────
export const ParentDashboard: React.FC = () => {
    const user = useStore((s) => s.user);
    const children = useStore((s) => s.students);
    const navigate = useNavigate();
    const { lang = 'fr' } = useParams<{ lang?: string }>();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [notifStatus, setNotifStatus] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );
    const [isLicenseReminderOpen, setIsLicenseReminderOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    const parentGraceRemaining = useMemo(() => {
        if (!user?.created_at) return 0;
        const creationDate = new Date(user.created_at);
        const expiryDate = new Date(creationDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 jours
        const diffTime = expiryDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [user?.created_at]);

    const isWithinGracePeriod = parentGraceRemaining > 0;

    const handleDownloadFile = async (url: string, title: string, format: 'png' | 'pdf') => {
        try {
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            const blob = await response.blob();
            
            if (format === 'png') {
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = `${title.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objectUrl);
            } else {
                const { jsPDF } = await import('jspdf');
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const img = new Image();
                    img.src = base64data;
                    img.onload = () => {
                        const doc = new jsPDF({
                            orientation: img.width > img.height ? 'landscape' : 'portrait',
                            unit: 'px',
                            format: [img.width, img.height]
                        });
                        doc.addImage(img, 'PNG', 0, 0, img.width, img.height);
                        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
                    };
                };
                reader.readAsDataURL(blob);
            }
        } catch (err) {
            console.error("Erreur de téléchargement :", err);
            alert("Une erreur est survenue lors du téléchargement.");
        }
    };

    // État des annonces
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [showAnnouncementList, setShowAnnouncementList] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
    
    // Accès au store global pour les lectures
    const announcementReads = useStore(s => s.announcementReads);
    const markAnnouncementRead = useStore(s => s.markAnnouncementRead);
    
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Documents numérisés
    const [childDocs, setChildDocs] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (children.length > 0) {
            children.forEach(child => {
                fetch(`${API_BASE_URL}/documents/student/${child.id}`, {
                    headers: getAuthHeaders()
                })
                .then(res => res.json())
                .then(docs => {
                    if (Array.isArray(docs)) {
                        setChildDocs(prev => ({ ...prev, [child.id]: docs }));
                    }
                })
                .catch(err => console.warn(`Erreur chargement documents pour ${child.id}:`, err));
            });
        }
    }, [children]);

    // Initialiser l'état de notification (ne bloque pas)
    useEffect(() => {
        if ('Notification' in window) {
            setNotifPermission(Notification.permission);
            setNotifStatus(Notification.permission);
        } else {
            setNotifPermission('unsupported');
            setNotifStatus('denied');
        }
    }, []);

    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            setNotifStatus(permission);
            
            if (permission === 'granted') {
                const { webPushService } = await import('../../services/webPushService');
                await webPushService.init();
                // console.log('🚀 Notifications activées');
            }
        } catch (err) {
            console.error('Erreur activation notifs:', err);
        }
    };

    // ── Chargement des données (Si store vide) ────────────────────────
    const fetchData = useCallback(async (force = false) => {
        const currentStudents = useStore.getState().students;
        if (currentStudents.length > 0 && !force) return;
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await parentApi.getDashboard();
            // On s'assure que le store est mis à jour aussi
            useStore.setState({ students: data.students || [] });
        } catch (err: any) {
            setErrorMsg(err.message || "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Polling toutes les 10 secondes ─────────────────────────
    useEffect(() => {
        fetchData();

        // Premier chargement annonces (via le store ou API locale si besoin)
        const fetchAnnouncementsLocal = async () => {
            try {
                const data = await parentApi.getAnnouncements();
                setAnnouncements(data.announcements || []);
            } catch (err) {
                console.warn('⚠️ Annonces non disponibles:', err);
            }
        };

        fetchAnnouncementsLocal();

        // Polling temps réel : toutes les 10 s
        pollingRef.current = setInterval(fetchAnnouncementsLocal, 10_000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchData]);

    const handleUnlink = async (studentId: string, name: string) => {
        if (!window.confirm(`Voulez-vous vraiment retirer ${name} de votre compte ?`)) return;
        try {
            await parentApi.unlinkStudent(studentId);
            fetchData(true);
        } catch (err: any) {
            alert(err.error || "Erreur lors du retrait de l'enfant.");
        }
    };

    const totalEcolage = children.reduce((acc, s) => acc + s.ecolage, 0);
    const totalDejaPaye = children.reduce((acc, s) => acc + (s.dejaPaye || 0), 0);
    const totalRestant = children.reduce((acc, s) => acc + s.restant, 0);

    const handleStartChat = async (role: 'administration' | 'comptabilite') => {
        try {
            // On initialise la conversation d'abord
            await chatApi.initiateConversation(undefined, role);
            // Puis on navigue vers la page de chat
            useStore.getState().setCurrentPage('chat');
        } catch (err) {
            console.error('Erreur initiation chat:', err);
            alert('Impossible de lancer la discussion. Réessayez plus tard.');
        } finally {
            setShowSupportModal(false);
        }
    };

    // ── Nombre d'annonces non vues ───────────────────────────
    const unseenCount = announcements.filter(a => {
        const read = announcementReads.find(r => r.announcementId === a.id && r.parentId === user?.id);
        return !read || !read.readAt;
    }).length;

    if (loading && children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="font-medium">Préparation de votre espace parent...</p>
                <p className="text-xs text-slate-400 mt-1">Cela ne prend que quelques secondes.</p>
            </div>
        );
    }

    if (errorMsg && children.length === 0) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Impossible de charger vos données</h3>
                <p className="text-red-700 text-sm">{errorMsg}</p>
                <p className="text-red-500 text-xs mt-1">Vérifiez votre connexion internet puis réessayez.</p>
                <button
                    onClick={() => fetchData()}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    const hasUnlicensedChild = children.some(child => (child.licenseStatus || 'inactive') !== 'active') && !isWithinGracePeriod;

    return (
        <>
            <div className={hasUnlicensedChild ? "space-y-6 filter blur-md pointer-events-none select-none" : "space-y-6"}>
                {isWithinGracePeriod && children.some(child => (child.licenseStatus || 'inactive') !== 'active') && (
                    <div className="bg-gradient-to-r from-amber-500 to-rose-500 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md animate-fadeIn text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black tracking-tight">Période de grâce en cours</p>
                                <p className="text-xs font-medium text-amber-50">Il vous reste {parentGraceRemaining} jour{parentGraceRemaining > 1 ? 's' : ''} avant que l'accès aux données ne soit bloqué. Veuillez activer vos licences.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsLicenseReminderOpen(true)}
                            className="px-4 py-2 bg-white text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition active:scale-95 cursor-pointer shrink-0"
                        >
                            Activer maintenant
                        </button>
                    </div>
                )}

                {/* ── Barre supérieure ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bonjour, {user?.nom} 👋</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Tout ce qu'il se passe pour vos enfants, ici et maintenant.</p>
                    </div>

                    <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3 w-full md:w-auto">
                        {/* Status Notifications */}
                        {notifStatus !== 'granted' && (
                            <button
                                onClick={handleEnableNotifications}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800/50 hover:bg-amber-200 transition-all animate-pulse"
                            >
                                <Bell className="w-4 h-4" />
                                Activer Notifications
                            </button>
                        )}
                        
                        {/* Bouton Annonces */}
                        <button
                            id="btn-announcements"
                            onClick={() => {
                                setShowAnnouncementList(v => !v);
                                if (!showAnnouncementList && user?.id) {
                                    // Marquer tout comme lu quand on ouvre la liste
                                    announcements.forEach(a => markAnnouncementRead(a.id, user.id));
                                }
                            }}
                            className="relative flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 rounded-[20px] shadow-sm transition-all font-black text-sm active:scale-95 w-full md:w-auto"
                        >
                            <Bell className="w-5 h-5 text-blue-500" />
                            Annonces
                            {unseenCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                                    {unseenCount > 9 ? '9+' : unseenCount}
                                </span>
                            )}
                        </button>

                        {/* Bouton Kids Place */}
                        <button
                            onClick={() => navigate(`/${lang}/parent/kids-place`)}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white rounded-2xl shadow-lg shadow-pink-500/20 transition-all font-bold text-sm w-full md:w-auto"
                        >
                            <Play className="w-4 h-4" />
                            🎬 Kids Place
                        </button>

                        <button
                            id="btn-link-child"
                            onClick={() => setIsLinkModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all font-bold text-sm col-span-2 md:col-span-1 w-full md:w-auto"
                        >
                            <UserPlus className="w-5 h-5" />
                            Lier un nouvel enfant
                        </button>

                        <button
                            onClick={() => setShowSupportModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 transition-all font-bold text-sm col-span-2 md:col-span-1 w-full md:w-auto"
                        >
                            <MessageSquare className="w-5 h-5" />
                            Assistance
                        </button>
                    </div>
                </div>

                {/* ── Panneau annonces (liste déroulante) ── */}
                {showAnnouncementList && (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-blue-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-slideDown">
                        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Megaphone className="w-6 h-6 text-white" />
                                <h3 className="font-black text-white">École Direct Info</h3>
                                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                    {announcements.length} messages
                                </span>
                            </div>
                            <button onClick={() => setShowAnnouncementList(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
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
                                                if (user?.id) markAnnouncementRead(a.id, user.id);
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

                {/* ── Bannière de Notifications Mobile/PWA ── */}
                {notifStatus === 'default' && (
                    <div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 rounded-[32px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-fadeIn border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                        <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0 border border-white/30 shadow-xl">
                                <Bell className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl md:text-2xl text-white tracking-tight">Ne ratez plus aucune alerte</h3>
                                <p className="text-blue-50 text-[11px] md:text-sm mt-1 leading-snug max-w-sm font-medium">Activez les notifications pour être prévenu en temps réel dès qu'il y a une entrée, une sortie ou un nouveau message de l'école.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleEnableNotifications}
                            className="w-full md:w-auto px-10 py-4 bg-white text-blue-700 hover:bg-blue-50 font-black rounded-[24px] transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-widest"
                        >
                            M'alerter
                        </button>
                    </div>
                )}

                {/* ── Cards financières & Scolaires ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col justify-between transition-all hover:shadow-2xl h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Total Scolarité</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{totalEcolage.toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Pour {children.length} enfant{children.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col justify-between transition-all hover:shadow-2xl h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:emerald-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Versé à ce jour</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{totalDejaPaye.toLocaleString()} FCFA</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{totalEcolage > 0 ? Math.round((totalDejaPaye / totalEcolage) * 100) : 0}% du montant total ● Confirmé</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col justify-between transition-all hover:shadow-2xl h-full group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-inner">
                                <CreditCard className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-rose-400 transition-colors">Solde Restant</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{totalRestant.toLocaleString()} FCFA</p>
                            <p className="text-xs text-rose-400 dark:text-rose-500 font-bold uppercase tracking-wide">À régler — Contactez l'établissement</p>
                        </div>
                    </div>

                    <div 
                        onClick={() => useStore.getState().setCurrentPage('parent_notes')}
                        className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col justify-between transition-all hover:shadow-2xl h-full group cursor-pointer hover:border-amber-400"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-amber-400 transition-colors">Notes & Bulletins</span>
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Voir les Résultats</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Moyennes, rangs et appréciations</p>
                        </div>
                    </div>
                </div>

                {/* ── Tableau dossiers scolaires ── */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-6 pb-20">
                    <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Dossiers de vos enfants</h3>
                        </div>
                        {children.length > 0 && (
                            <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">{children.length} enfant{children.length > 1 ? 's' : ''} lié{children.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Fiche Élève</th>
                                    <th className="px-6 py-4 text-center">Cursus</th>
                                    <th className="px-6 py-4 text-right">Encaissement</th>
                                    <th className="px-6 py-4 text-right">Reliquat</th>
                                    <th className="px-6 py-4 text-center">Situation</th>
                                    <th className="px-6 py-4 text-center">Licence</th>
                                    <th className="px-6 py-4 text-right">Gérer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {children.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <Search className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-slate-800 mb-1">Aucun enfant lié à votre compte</p>
                                                    <p className="text-sm text-slate-400">Liez votre enfant avec son numéro d'élève pour accéder à ses notes, ses reçus, ses bulletins et l'historique de présences.</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsLinkModalOpen(true)}
                                                    className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                                                >
                                                    → Lier mon enfant maintenant
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
                                                <p className="text-emerald-600 font-bold text-base">{(child.dejaPaye || 0).toLocaleString()} F</p>
                                                {child.ecolage > 0 && (
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${Math.min(((child.dejaPaye || 0) / child.ecolage) * 100, 100)}%` }}
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
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${(child.licenseStatus || 'inactive') === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30'}`}>
                                                        {(child.licenseStatus || 'inactive') === 'active' ? 'Active' : 'Requise'}
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

                    {/* ── Liste des enfants sur Mobile ── */}
                    <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {children.length === 0 ? (
                            <div className="px-6 py-20 text-center text-slate-500">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-lg font-bold text-slate-800 mb-1">Aucun enfant lié</p>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">Liez votre enfant avec son numéro d'élève pour accéder à son dossier.</p>
                                <button
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                                >
                                    Lier mon enfant maintenant
                                </button>
                            </div>
                        ) : (
                            children.map(child => (
                                <div key={child.id} className="p-5 space-y-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">{child.prenom} {child.nom}</h4>
                                            <code className="text-[10px] text-slate-400 font-mono">REF: {child.id}</code>
                                        </div>
                                        <button
                                            onClick={() => handleUnlink(child.id, `${child.prenom} ${child.nom}`)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                                            title="Retirer cet enfant"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Cursus</p>
                                            <p className="text-slate-700 dark:text-slate-350 font-bold mt-0.5">{child.classe}</p>
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{child.cycle}</span>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Situation</p>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                                    child.status === 'Soldé' ? 'bg-emerald-100 text-emerald-700' :
                                                    child.status === 'Partiel' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {child.status}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                                    (child.licenseStatus || 'inactive') === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30'
                                                }`}>
                                                    {(child.licenseStatus || 'inactive') === 'active' ? 'Active' : 'Requise'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Versé</p>
                                            <p className="text-emerald-600 font-bold text-base mt-0.5">{(child.dejaPaye || 0).toLocaleString()} F</p>
                                            {child.ecolage > 0 && (
                                                <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${Math.min(((child.dejaPaye || 0) / child.ecolage) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Reliquat</p>
                                            <p className={`font-bold text-base mt-0.5 ${child.restant > 25000 ? 'text-red-500' : 'text-amber-600'}`}>
                                                {(child.restant || 0).toLocaleString()} F
                                            </p>
                                            <p className="text-[10px] text-slate-400 italic">Total: {(child.ecolage || 0).toLocaleString()} F</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Documents Numérisés ── */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-6 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Documents officiels numérisés</h3>
                            <p className="text-xs text-slate-500 mt-1">Actes de naissance, bulletins, attestations et autres pièces transmis par l'établissement.</p>
                        </div>
                    </div>

                    {children.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Aucun document disponible.</p>
                    ) : (
                        <div className="space-y-6">
                            {children.map(child => {
                                const docs = childDocs[child.id] || [];
                                return (
                                    <div key={child.id} className="space-y-3">
                                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-200 border-l-4 border-amber-500 pl-3">
                                            {child.prenom} {child.nom} ({child.classe})
                                        </h4>
                                        
                                        {docs.length === 0 ? (
                                            <p className="text-xs text-slate-400 pl-3">Aucun document scanné pour le moment.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-3">
                                                {docs.map(doc => {
                                                    // Type label
                                                    const labels: Record<string, string> = {
                                                        birth_certificate: "Acte de naissance",
                                                        report_card: "Bulletin scolaire",
                                                        certificate: "Attestation / Certificat",
                                                        other: "Document",
                                                    };
                                                    const docLabel = labels[doc.document_type] || "Document";
                                                    
                                                    return (
                                                        <div key={doc.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col justify-between hover:shadow-md transition">
                                                            <div>
                                                                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider mb-2">
                                                                    {docLabel}
                                                                </span>
                                                                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{doc.title}</p>
                                                                <p className="text-[9px] text-slate-400 mt-1">
                                                                    Scanné le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                                </p>
                                                                
                                                                {/* Image Thumbnail Preview */}
                                                                {(doc.file_url.toLowerCase().endsWith('.png') || doc.file_url.toLowerCase().endsWith('.jpg') || doc.file_url.toLowerCase().endsWith('.jpeg')) && (
                                                                    <div 
                                                                        onClick={() => setPreviewImage({ 
                                                                            url: `${API_BASE_URL}/documents/file/${doc.file_url.split('/').pop()}?token=${localStorage.getItem('parent_token')}`, 
                                                                            title: doc.title 
                                                                        })}
                                                                        className="mt-3 block relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center group/thumb cursor-zoom-in"
                                                                    >
                                                                        <img 
                                                                            src={`${API_BASE_URL}/documents/file/${doc.file_url.split('/').pop()}?token=${localStorage.getItem('parent_token')}`} 
                                                                            alt={doc.title}
                                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                        <div className="absolute inset-0 bg-slate-950/0 group-hover/thumb:bg-slate-950/30 transition-colors flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 duration-300">
                                                                            <span className="text-[9px] font-bold text-white bg-indigo-500/90 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                                                Agrandir
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 flex gap-2 w-full">
                                                                <button
                                                                    onClick={() => handleDownloadFile(
                                                                        `${API_BASE_URL}/documents/file/${doc.file_url.split('/').pop()}?token=${localStorage.getItem('parent_token')}`, 
                                                                        doc.title, 
                                                                        'png'
                                                                    )}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition cursor-pointer"
                                                                    title="Télécharger PNG"
                                                                >
                                                                    PNG
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFile(
                                                                        `${API_BASE_URL}/documents/file/${doc.file_url.split('/').pop()}?token=${localStorage.getItem('parent_token')}`, 
                                                                        doc.title, 
                                                                        'pdf'
                                                                    )}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition cursor-pointer"
                                                                    title="Télécharger PDF"
                                                                >
                                                                    PDF
                                                                </button>
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
                    )}
                </div>
            </div>

            {isLicenseReminderOpen && (
                <LicenseLockScreen
                    childrenList={children}
                    onSuccess={() => {
                        setIsLicenseReminderOpen(false);
                        fetchData(true);
                    }}
                    onLinkClick={() => {
                        setIsLicenseReminderOpen(false);
                        setIsLinkModalOpen(true);
                    }}
                    onClose={() => setIsLicenseReminderOpen(false)}
                />
            )}

            {hasUnlicensedChild && (
                <LicenseLockScreen
                    childrenList={children}
                    onSuccess={() => fetchData(true)}
                    onLinkClick={() => setIsLinkModalOpen(true)}
                />
            )}

            <LinkStudentModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSuccess={() => fetchData(true)}
            />

            <SupportModal 
                isOpen={showSupportModal}
                onClose={() => setShowSupportModal(false)}
                onSelect={handleStartChat}
            />

            {/* LIGHTBOX PREVIEW */}
            {previewImage && (
                <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fadeIn">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-md">
                        <h3 className="text-white font-black text-sm uppercase tracking-widest">{previewImage.title}</h3>
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-grow flex items-center justify-center p-4">
                        <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800" />
                    </div>
                    <div className="flex justify-center gap-4 p-4">
                        <button 
                            onClick={() => handleDownloadFile(previewImage.url, previewImage.title, 'png')}
                            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center gap-2 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Télécharger PNG
                        </button>
                        <button 
                            onClick={() => handleDownloadFile(previewImage.url, previewImage.title, 'pdf')}
                            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Télécharger PDF
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};