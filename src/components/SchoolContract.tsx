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

                        <p>
                            Entre l'entité <strong>DGHUBSCHOOL</strong>, prestataire de services numériques, représentée par <strong>M. Yiagnigni Mohamed</strong> (ci-après « le Prestataire »), et l'établissement scolaire créant un compte sur la plateforme DGHUBSCHOOL (ci-après « l'École » ou « le Partenaire »), il a été convenu ce qui suit :
                        </p>

                        <p>
                            DGHUBSCHOOL est une plateforme numérique de gestion scolaire : inscriptions, scolarité, notes et bulletins conformes DRE, présence par carte à QR Code, comptabilité en partie double, paie du personnel, emploi du temps, et un espace de suivi quotidien pour les parents d'élèves (paiements, notes, présences, messagerie).
                        </p>

                        <p className="font-semibold text-slate-900">
                            Le présent contrat ne comporte aucun engagement financier pour l'École en dehors de la licence décrite à l'Article 5.1 ; il précise les engagements du Prestataire ainsi que quelques règles d'usage nécessaires au bon fonctionnement du service.
                        </p>

                        <h4>Article 1 — Objet</h4>
                        <p>
                            Le présent contrat définit les conditions dans lesquelles l'entité DGHUBSCHOOL met à la disposition de l'École un accès à sa plateforme de gestion scolaire.
                        </p>

                        <h4>Article 2 — Durée</h4>
                        <p>
                            Le présent contrat est conclu pour une durée indéterminée à compter de la création du compte établissement. L'École peut cesser d'utiliser la plateforme à tout moment, sans préavis ni pénalité. Le Prestataire peut suspendre l'accès en cas de manquement grave aux présentes conditions ou à la réglementation en vigueur, après notification préalable à l'École, sauf urgence liée à la sécurité des données.
                        </p>

                        <h4>Article 3 — Engagements du Prestataire</h4>
                        <p>Le Prestataire s'engage à :</p>
                        <ul>
                            <li>Mettre à disposition, sans limite du nombre d'élèves, l'ensemble des fonctionnalités de gestion : élèves et scolarité, notes et bulletins conformes DRE, présence par scan QR Code, comptabilité, paie du personnel, emploi du temps, messagerie et alertes automatiques ;</li>
                            <li>Assurer un support par WhatsApp et par email pour accompagner l'École dans la prise en main de la plateforme ;</li>
                            <li>Ne jamais rendre possible qu'un parent consulte les informations d'un enfant qui n'est pas le sien ;</li>
                            <li>Traiter toutes les données de l'École et de ses élèves de manière strictement confidentielle et sécurisée, conformément à la réglementation togolaise sur la protection des données personnelles ;</li>
                            <li>Réaliser une sauvegarde automatique quotidienne des données de l'École, conservée 30 jours ;</li>
                            <li>Ne rien faire qui puisse nuire, directement ou indirectement, à l'image de l'École ;</li>
                            <li>Permettre à l'École de demander le retrait de sa part due directement depuis son espace d'administration, à tout moment ;</li>
                            <li>Respecter la clé de répartition des revenus décrite à l'Article 5.</li>
                        </ul>

                        <h4>Article 4 — Engagements de l'École</h4>
                        <p>L'École s'engage à :</p>
                        <ul>
                            <li>Fournir des informations exactes et à jour sur l'établissement et son personnel administratif ;</li>
                            <li>Ne pas partager ses identifiants administrateur avec des personnes non autorisées ;</li>
                            <li>Utiliser la plateforme dans le respect de la législation togolaise relative à la protection des données personnelles des élèves ;</li>
                            <li>Être responsable de la validité et de la légalité des documents qu'elle télécharge sur la plateforme (actes de naissance, reçus, photos d'élèves).</li>
                        </ul>

                        <h4>Article 5 — Modèle économique</h4>

                        <p><strong>5.1 — Accès École</strong></p>
                        <p>
                            La création du compte établissement et l'utilisation de l'ensemble des fonctionnalités d'administration sont <strong>gratuites pendant la première année</strong> suivant la création du compte. À compter de la 2<sup>e</sup> année, l'accès de l'École est conditionné au paiement d'une <strong>licence annuelle unique par établissement</strong>, selon l'effectif d'élèves inscrits :
                        </p>
                        <ul>
                            <li><strong>65 000 FCFA/an</strong> pour un effectif de 0 à 500 élèves ;</li>
                            <li><strong>130 000 FCFA/an</strong> pour un effectif de 500 à 1 000 élèves ;</li>
                            <li><strong>200 000 FCFA/an</strong> pour un effectif de 1 000 à 1 500 élèves.</li>
                        </ul>
                        <p>
                            Les modalités de paiement seront communiquées à l'École avant la fin de sa première année d'utilisation. Si cette licence n'est pas réglée à l'échéance, l'accès de l'École pourra être suspendu jusqu'au règlement, sans que cela ne constitue une rupture du présent contrat ni n'engage de pénalité au-delà du montant dû.
                        </p>

                        <p><strong>5.2 — Comptes Parents</strong></p>
                        <p>
                            Le modèle économique du Prestataire repose également sur la contribution des comptes parents, indépendamment du paiement décrit au 5.1 :
                        </p>
                        <ul>
                            <li>Les parents bénéficient d'une période de grâce de <strong>14 jours</strong> après inscription pour consulter les informations de leurs enfants ;</li>
                            <li>Passé ce délai, l'accès complet du compte parent est conditionné à l'activation d'une licence de <strong>2 100 FCFA</strong> par élève et par an, payable en <strong>trois (3) tranches de 700 FCFA</strong> ou en une seule fois ;</li>
                            <li><strong>Chaque tranche fait l'objet d'un enregistrement individuel</strong> (numéro de tranche, date, clé, montant). Le parent peut à tout moment consulter et télécharger le <strong>reçu PDF</strong> de chacune de ses tranches depuis son espace personnel ;</li>
                            <li>L'école consulte en temps réel, dans son propre espace, la liste détaillée des paiements effectués par les parents de ses élèves.</li>
                        </ul>

                        <p><strong>5.3 — Reversement à l'École</strong></p>
                        <p>
                            Indépendamment du paiement décrit au 5.1, le Prestataire reverse à l'École <strong>un tiers (700 FCFA)</strong> de chaque licence parent <strong>entièrement soldée</strong> (§5.2). Ce reversement est <strong>automatiquement crédité au solde retrait de l'École</strong> dès l'enregistrement de la dernière tranche (ou du règlement en une seule fois). Ce montant appartient à l'École ; la manière dont elle en dispose (répartition interne, réinvestissement, etc.) relève de sa seule décision.
                        </p>

                        <p><strong>5.4 — Traçabilité et contrôle</strong></p>
                        <p>
                            L'ensemble des paiements de licence est enregistré de manière individuelle dans les registres du Prestataire. L'École et le Prestataire disposent d'un accès complet à ces registres pour leur périmètre respectif. Le Prestataire conserve un journal global permettant la génération de <strong>rapports d'activité</strong> (récapitulatifs par école, par période) à des fins d'audit et de reporting.
                        </p>

                        <h4>Article 6 — Retraits</h4>
                        <p>
                            L'École peut demander, à tout moment, le retrait de la part qui lui est due directement depuis son espace d'administration, en indiquant le nom et le numéro du bénéficiaire ainsi qu'une pièce justificative si demandée. Les demandes sont traitées par le Prestataire dans les meilleurs délais.
                        </p>

                        <h4>Article 7 — Confiance et bonne foi</h4>
                        <p>
                            Les parties déclarent avoir librement consenti au présent contrat. Toute relation afférente doit être marquée du sceau de la confiance et présumée de bonne foi, sans exclure les vérifications nécessaires pour éviter toute erreur préjudiciable au partenariat.
                        </p>

                        <h4>Article 8 — Règlement des litiges</h4>
                        <p>
                            Tout litige relatif à l'exécution ou à l'interprétation du présent contrat fera l'objet d'un règlement amiable entre les parties. En cas d'échec, le litige sera soumis au Centre d'Arbitrage, de Médiation et de Conciliation du Togo (CAMECO-Togo), selon l'ordre suivant : (1) commission de médiation, (2) procédure d'arbitrage dont les parties définiront les conditions.
                        </p>

                        <h4>Article 9 — Modification du contrat</h4>
                        <p>
                            Le Prestataire peut faire évoluer les présentes conditions pour accompagner l'évolution de la plateforme. Toute modification substantielle sera notifiée à l'École par email ou depuis son espace d'administration avant son entrée en vigueur.
                        </p>

                        <h4>Article 10 — Entrée en vigueur</h4>
                        <p>
                            Le présent contrat entre en vigueur dès son acceptation par l'École lors de la création de son compte établissement.
                        </p>

                        <p className="text-xs text-slate-500">
                            Contact : support@dghubschool.com<br/>
                            WhatsApp : +228 72 47 30 27 | Web : www.dghubschool.com
                        </p>
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
