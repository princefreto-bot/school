import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, FileText, Building } from 'lucide-react';

interface SchoolContractProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export const SchoolContract: React.FC<SchoolContractProps> = ({ isOpen, onClose, onAccept }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Vérifier le scroll
    const handleScroll = () => {
        if (!contentRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setHasScrolledToBottom(true);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            setIsAccepted(false);
            // Vérifier si le contenu est assez petit pour ne pas nécessiter de scroll
            setTimeout(() => {
                if (contentRef.current) {
                    const { scrollHeight, clientHeight } = contentRef.current;
                    if (scrollHeight <= clientHeight) {
                        setHasScrolledToBottom(true);
                    }
                }
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase">Contrat d'Utilisation</h2>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Building className="w-3 h-3" /> Entité DGHUBSCHOOL
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-slate-700 leading-relaxed custom-scrollbar"
                >
                    <div className="prose prose-sm max-w-none prose-slate prose-headings:font-black prose-headings:text-slate-900 prose-headings:uppercase prose-a:text-blue-600">
                        <h3 className="text-xl mb-4">Conditions Générales d'Utilisation et de Partenariat</h3>
                        
                        <p className="font-semibold text-slate-900">
                            En créant un compte sur la plateforme DGHUBSCHOOL, vous acceptez de vous conformer aux termes et conditions énoncés ci-dessous.
                        </p>

                        <h4>1. Objet</h4>
                        <p>
                            Le présent contrat définit les conditions dans lesquelles l'entité DGHUBSCHOOL met à la disposition de l'Établissement (ci-après désigné "l'École") un accès gratuit à son logiciel de gestion scolaire.
                        </p>

                        <h4>2. Gratuité de la Plateforme pour l'École</h4>
                        <p>
                            La création du compte établissement et l'utilisation de toutes les fonctionnalités d'administration, de gestion des notes, de présence et de communication sont <strong>totalement gratuites</strong> pour l'École. DGHUBSCHOOL ne facturera aucun frais de licence ou de maintenance à l'établissement.
                        </p>

                        <h4>3. Modèle Économique (Comptes Parents)</h4>
                        <p>
                            En contrepartie de la gratuité du système pour l'établissement, le modèle économique de l'entité DGHUBSCHOOL repose exclusivement sur les contributions des parents d'élèves.
                            <br/><br/>
                            - Les parents bénéficient d'une période d'essai gratuit de <strong>14 jours</strong> à compter de leur inscription.
                            <br/>
                            - Au-delà de cette période, l'accès complet au compte parent est conditionné au paiement d'un forfait de <strong>2100 FCFA</strong> par élève et par an.
                            <br/>
                            - Ce paiement peut être effectué en trois (3) tranches de <strong>700 FCFA</strong>. 
                        </p>

                        <h4>4. Reversement et Part de l'École</h4>
                        <p>
                            Dans un esprit de partenariat gagnant-gagnant, l'entité DGHUBSCHOOL s'engage à reverser à l'École une ristourne financière sur les paiements effectués par les parents de ses élèves.
                            <br/><br/>
                            L'École obtiendra sa part, fixée à <strong>700 FCFA par élève</strong>, <em>si et seulement si</em> les parents soldent la totalité des 2100 FCFA sur la plateforme.
                        </p>

                        <h4>5. Retraits des Ristournes</h4>
                        <p>
                            L'École pourra formuler une demande de retrait directement depuis son espace d'administration pour la part qui lui est due. Le retrait nécessite de fournir les informations nécessaires (nom, numéro de compte/mobile) et de joindre les pièces justificatives demandées.
                        </p>

                        <h4>6. Données et Confidentialité</h4>
                        <p>
                            L'entité DGHUBSCHOOL s'engage à traiter toutes les données scolaires de manière strictement confidentielle et sécurisée. 
                            <br/>Contact : contact@dghubschool.com | Web : www.dghubschool.com
                        </p>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-8">
                            <h4 className="text-amber-800 m-0 mb-2">Clauses supplémentaires (En attente)</h4>
                            <p className="text-amber-700/80 m-0 italic">
                                * L'entité DGHUBSCHOOL se réserve le droit de mettre à jour ce contrat. Les clauses définitives fournies ultérieurement par DGHUBSCHOOL viendront compléter et remplacer ce texte.*
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className={`flex items-center gap-3 cursor-pointer ${!hasScrolledToBottom ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={isAccepted}
                            onChange={(e) => setIsAccepted(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-bold text-slate-700">
                            J'ai lu et j'accepte les termes du contrat DGHUBSCHOOL
                        </span>
                    </label>

                    <button
                        onClick={onAccept}
                        disabled={!isAccepted}
                        className={`px-6 py-2.5 rounded-lg font-black text-sm uppercase transition-all flex items-center gap-2 ${
                            isAccepted 
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Accepter et Continuer
                    </button>
                </div>

            </div>
        </div>
    );
};
