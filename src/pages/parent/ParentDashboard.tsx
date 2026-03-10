import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { parentApi } from '../../services/parentApi';
import { CreditCard, Wallet, TrendingUp, Loader2, AlertCircle, UserPlus, Search, GraduationCap, X } from 'lucide-react';
import { LinkStudentModal } from '../../components/LinkStudentModal';

export const ParentDashboard: React.FC = () => {
    const user = useStore((s) => s.user);
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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

    const handleUnlink = async (studentId: string, name: string) => {
        if (!window.confirm(`Voulez-vous vraiment retirer ${name} de votre compte ?`)) return;

        try {
            await parentApi.unlinkStudent(studentId);
            fetchData();
        } catch (err: any) {
            alert(err.error || "Erreur lors du retrait de l'enfant.");
        }
    };

    useEffect(() => {
        fetchData();
        // Demande l'autorisation des notifications sur mobile
        import('../../utils/capacitorNotifications').then(m => m.checkAndAskNotifications());
    }, []);

    const totalEcolage = children.reduce((acc, s) => acc + s.ecolage, 0);
    const totalDejaPaye = children.reduce((acc, s) => acc + (s.deja_paye || 0), 0);
    const totalRestant = children.reduce((acc, s) => acc + s.restant, 0);

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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bienvenue, {user?.nom}</h2>
                    <p className="text-sm text-slate-500">Consultez et suivez la scolarité de vos enfants en temps réel.</p>
                </div>

                <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                >
                    <UserPlus className="w-5 h-5" />
                    Lier un nouvel enfant
                </button>
            </div>

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
                                <th className="px-6 py-4">Classe & Cycle</th>
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
    );
};