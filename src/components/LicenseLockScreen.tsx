import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Key, CheckCircle, AlertCircle, ShoppingBag, Loader2, LogOut, X } from 'lucide-react';
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
    onClose?: () => void;
}

const getPaymentOptions = () => {
    return [
        {
            id: 'tranche_1',
            name: `Payer une tranche (1 mois)`,
            description: `Payez 700 F maintenant. Vous aurez 2 autres tranches de 700 F à régler plus tard.`,
            price: 700,
            url: 'https://zwhhrrbi.mychariow.co/prd_u611otjw/checkout'
        },
        {
            id: 'total',
            name: `Solder la scolarité (Année complète)`,
            description: `Payez 2100 F en une seule fois et soyez tranquille pour toute l'année scolaire.`,
            price: 2100,
            url: 'https://zwhhrrbi.mychariow.co/prd_27g3ge9e/checkout',
            recommended: true
        }
    ];
};

export const LicenseLockScreen: React.FC<LicenseLockScreenProps> = ({ childrenList, onSuccess, onLinkClick, onClose }) => {
    const logout = useStore((s) => s.logout);
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

    const inactiveCount = childrenList.filter(c => (c.licenseStatus || 'inactive') !== 'active').length;
    const paymentOptions = getPaymentOptions();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start md:items-center min-h-screen">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 my-auto animate-scaleUp">
                
                {/* Bouton de fermeture temporaire si onClose est fourni */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 sm:top-6 sm:right-6 flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition duration-300 dark:bg-slate-800 dark:text-slate-400 cursor-pointer"
                        title="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Bouton de déconnexion dans le coin supérieur droit */}
                <button
                    onClick={logout}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-500/10 hover:text-rose-600 text-slate-500 rounded-xl transition duration-300 font-black text-xs cursor-pointer dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400"
                    title="Déconnexion"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                </button>

                {/* Effet lumineux premium arrière plan */}
                <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-3xl flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-inner mb-4">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        🔐 Activation de Licence Requise
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mt-2 font-medium">
                        Pour accéder aux dossiers, notes et reçus de vos enfants en temps réel, veuillez activer une licence annuelle DGhubSchool.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    {/* Liste des enfants */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
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
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Achat de Licence(s)</h3>
                            {loadingPricing ? (
                                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Calcul en cours...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span>Enfants à activer :</span>
                                        <span className="font-extrabold text-amber-600 dark:text-amber-400">{inactiveCount} / {childrenList.length}</span>
                                    </div>
                                    
                                    {inactiveCount > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                                                Pour vos {inactiveCount} enfant(s) non activé(s), veuillez acheter la/les licence(s) ci-dessous :
                                            </p>
                                            
                                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mt-2">
                                                {paymentOptions.map((option) => (
                                                    <div key={option.id} className={`flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border ${option.recommended ? 'border-amber-500 shadow-amber-500/10' : 'border-slate-200 dark:border-slate-800/80'} rounded-xl shadow-sm relative overflow-hidden`}>
                                                        {option.recommended && (
                                                            <div className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black uppercase text-slate-900 px-2 py-0.5 rounded-bl-lg">Recommandé</div>
                                                        )}
                                                        <div>
                                                            <div className="flex justify-between items-center text-[12px] mb-1">
                                                                <span className="font-black text-slate-800 dark:text-slate-200">
                                                                    {option.name}
                                                                </span>
                                                                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                                                    {option.price} F
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-medium leading-snug">{option.description}</p>
                                                        </div>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(option.url, '_blank')}
                                                            className={`w-full flex items-center justify-center gap-1.5 py-2 ${option.recommended ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} font-black text-[11px] rounded-lg transition active:scale-95 shadow-sm cursor-pointer mt-1 relative overflow-hidden group`}
                                                        >
                                                            {option.recommended && (
                                                                <div className="absolute inset-0 bg-white/20 w-12 skew-x-12 -ml-16 group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                                            )}
                                                            <ShoppingBag className={`w-3.5 h-3.5 ${option.recommended ? 'animate-bounce' : ''}`} />
                                                            {option.recommended ? `Payer ${option.price} F (Solder)` : `Payer ${option.price} F (Tranche)`}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                            ✅ Tous vos enfants ont une licence active.
                                        </p>
                                    )}

                                    <p className="text-[9px] text-slate-400 leading-snug italic mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        💡 Tarifs : 2100 F par enfant. Payable en 3 tranches de 700 F.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Formulaire d'activation */}
                <form onSubmit={handleActivate} className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
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
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Clé de licence DGhubSchool</label>
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
