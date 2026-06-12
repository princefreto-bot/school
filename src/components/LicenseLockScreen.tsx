import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Key, CheckCircle, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { parentApi } from '../services/parentApi';
import { useStore } from '../store/useStore';

interface Child {
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    licenseStatus?: 'active' | 'inactive';
    licenseKey?: string | null;
}

interface LicenseLockScreenProps {
    childrenList: Child[];
    onSuccess: () => void;
    onLinkClick?: () => void;
}

export const LicenseLockScreen: React.FC<LicenseLockScreenProps> = ({ childrenList, onSuccess, onLinkClick }) => {
    const [pricing, setPricing] = useState<any>(null);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [licenseKey, setLicenseKey] = useState<string>('');
    const [loadingPricing, setLoadingPricing] = useState(true);
    const [activating, setActivating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const schoolSlug = useStore((s) => s.user?.schoolSlug);

    // Charger les détails de tarification basés sur le nombre d'enfants
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await parentApi.getLicensePricing();
                setPricing(data);
                
                // Pré-sélectionner le premier enfant inactif
                const inactiveChild = childrenList.find(c => (c.licenseStatus || 'inactive') !== 'active');
                if (inactiveChild) {
                    setSelectedChildId(inactiveChild.id);
                }
            } catch (err) {
                console.error("Erreur chargement prix licence:", err);
            } finally {
                setLoadingPricing(false);
            }
        };
        fetchPricing();
    }, [childrenList]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChildId || !licenseKey.trim()) {
            setErrorMsg("Veuillez sélectionner un enfant et saisir une clé de licence.");
            return;
        }

        setActivating(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await parentApi.activateLicense(selectedChildId, licenseKey.trim());
            if (res.success) {
                setSuccessMsg(`Félicitations ! La licence pour ${childrenList.find(c => c.id === selectedChildId)?.prenom} a été activée.`);
                setLicenseKey('');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err: any) {
            setErrorMsg(err.error || "Clé de licence invalide ou expirée.");
        } finally {
            setActivating(false);
        }
    };

    const handleCheckout = () => {
        const CHECKOUT_URL = 'https://zwhhrrbi.mychariow.co/prd_uky8xjl7/checkout';
        window.open(CHECKOUT_URL, '_blank');
    };

    const inactiveCount = childrenList.filter(c => (c.licenseStatus || 'inactive') !== 'active').length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl p-6 md:p-8 animate-scaleUp overflow-hidden max-h-[90vh]">
                
                {/* Effet lumineux premium arrière plan */}
                <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-3xl flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-inner mb-4">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        🔐 Activation de Licence Requise
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mt-2 font-medium">
                        Pour accéder aux dossiers, notes et reçus de vos enfants en temps réel, veuillez activer une licence annuelle Chariow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Liste des enfants */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mes enfants liés</h3>
                            {onLinkClick && (
                                <button
                                    type="button"
                                    onClick={onLinkClick}
                                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    + Lier un enfant
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {childrenList.map((child) => {
                                const isActive = (child.licenseStatus || 'inactive') === 'active';
                                return (
                                    <div key={child.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{child.prenom} {child.nom}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">{child.classe}</p>
                                        </div>
                                        {isActive ? (
                                            <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                                                Non payé
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tarification */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Tarif & Réductions</h3>
                            {loadingPricing ? (
                                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Calcul en cours...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                        <span>Nombre d'enfants :</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{pricing?.count}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                        <span>Forfait applicable :</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{pricing?.totalPrice.toLocaleString()} F</span>
                                    </div>
                                    {pricing?.discount > 0 && (
                                        <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg mt-1">
                                            <span>Économie de groupe :</span>
                                            <span>-{pricing?.discount.toLocaleString()} F</span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 leading-snug mt-2 italic">
                                        💡 Forfait 10 mois : 1-2 enfants = 2000 F / enfant. 3-4 enfants = 5000 F total. 5+ enfants = 7000 F total.
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Acheter une licence (Chariow)
                        </button>
                    </div>
                </div>

                {/* Formulaire d'activation */}
                <form onSubmit={handleActivate} className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-500" />
                        Activer un enfant
                    </h3>

                    {errorMsg && (
                        <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Enfant à activer</label>
                            <select
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                <option value="" disabled>Sélectionner un enfant</option>
                                {childrenList.map((child) => (
                                    <option key={child.id} value={child.id} disabled={(child.licenseStatus || 'inactive') === 'active'}>
                                        {child.prenom} {child.nom} {((child.licenseStatus || 'inactive') === 'active') ? ' (Déjà active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Clé de licence Chariow</label>
                            <input
                                type="text"
                                placeholder="Saisir la clé (ex: CHA-XXXX-XXXX)"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase font-mono"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={activating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:bg-blue-400"
                    >
                        {activating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validation en cours...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Activer la Licence
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
