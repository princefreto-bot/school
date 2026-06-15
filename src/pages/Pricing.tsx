// ============================================================
// PAGE TARIFICATION (PRICING) — Uniquement Annuelle & Structurée
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const pricingStructure = [
    {
      type: "Pour l'Établissement",
      name: "Licence Annuelle École",
      price: "35 000 F CFA",
      period: "par an / par école",
      description: "Abonnement fixe obligatoire pour l'activation technique de votre établissement scolaire.",
      features: [
        "Accès complet à la console d'administration",
        "Espace enseignant pour la saisie des notes et moyennes",
        "Impression et édition des bulletins scolaires au format officiel",
        "Système de pointage et présence des élèves",
        "Génération de cartes d'identité scolaires avec QR Code",
        "Configuration des frais de scolarité personnalisés"
      ],
      buttonText: "Activer mon établissement",
      popular: true,
      ctaAction: () => navigate('/creer-compte'),
      borderColor: "border-amber-500 shadow-amber-500/10 shadow-lg"
    },
    {
      type: "Pour les Parents d'Élèves",
      name: "Abonnement Élève",
      price: "1 500 F CFA",
      period: "par élève / par an",
      description: "Contribution annuelle par élève pour l'accès complet des parents au suivi scolaire.",
      features: [
        "Notification en temps réel (Push & SMS) des notes et moyennes",
        "Alertes instantanées à chaque scan de présence (arrivée / départ)",
        "Suivi instantané des versements et soldes de scolarité",
        "Accès aux exercices scolaires gratuits à la maison",
        "Messagerie en ligne directe avec la vie scolaire"
      ],
      buttonText: "Découvrir le portail",
      popular: false,
      ctaAction: () => navigate('/login'),
      borderColor: "border-slate-200"
    }
  ];

  const packs = [
    {
      title: "Tarif Individuel",
      sub: "1 Élève",
      price: "1 500 F CFA",
      desc: "par élève et par an"
    },
    {
      title: "Pack Famille Réduit",
      sub: "3 Élèves",
      price: "4 000 F CFA",
      desc: "au lieu de 4 500 F CFA / an"
    },
    {
      title: "Pack Grande Famille",
      sub: "5 Élèves",
      price: "7 000 F CFA",
      desc: "au lieu de 7 500 F CFA / an"
    }
  ];

  const faqs = [
    {
      q: "Comment est facturé l'abonnement de l'établissement ?",
      a: "L'école s'acquitte d'un montant annuel unique de 35 000 F CFA pour activer la licence technique. Cette licence permet d'ouvrir les portails de gestion administrative, financière et académique."
    },
    {
      q: "Qui paie la contribution de 1 500 F CFA par élève ?",
      a: "Cette contribution annuelle de 1 500 F CFA par élève est à la charge des parents lors de la première connexion. Elle donne accès à tout le suivi (SMS, présences, notes, exercices). Des tarifs réduits s'appliquent automatiquement pour les fratries (4 000 F CFA pour 3 élèves et 7 000 F CFA pour 5 élèves)."
    },
    {
      q: "Y a-t-il des frais mensuels ?",
      a: "Non. DGhubSchool fonctionne uniquement sur un modèle de facturation annuelle sans aucun engagement mensuel ni coût additionnel masqué."
    },
    {
      q: "Comment s'effectue le suivi des frais de scolarité ?",
      a: "L'administration enregistre les règlements de scolarité (espèces, chèques, virements) depuis sa console. Les parents reçoivent immédiatement un reçu numérique par SMS et peuvent consulter leur solde en temps réel."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl uppercase select-none cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpeg" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Accueil</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          🗓️ Tarification Annuelle Unique
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-4">
          Une tarification simple et transparente
        </h1>
        <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto">
          DGhubSchool propose un modèle annuel clair réparti entre la licence établissement et l'accès de suivi pour les parents d'élèves.
        </p>
      </section>

      {/* Core Pricing Grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {pricingStructure.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white border p-8 rounded-3xl flex flex-col justify-between relative transition-all hover:shadow-xl ${plan.borderColor}`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full inline-block mb-4">
                  {plan.type}
                </span>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-wide mb-2">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {plan.description}
                </p>
                <div className="mb-8 border-b border-slate-100 pb-6">
                  <span className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400 font-bold block mt-1">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={plan.ctaAction}
                className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600"
                    : "bg-slate-900 hover:bg-black text-white border border-transparent"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Fratrie / Packs Section */}
      <section className="relative z-10 bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-xl md:text-3xl font-black text-slate-950 uppercase tracking-tight mb-2">
              Tarifs Dégressifs Fratries (Parents)
            </h3>
            <p className="text-xs md:text-sm text-slate-500">
              Des tarifs préférentiels adaptés pour l'inscription de plusieurs enfants d'une même famille.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((pack, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{pack.title}</span>
                <span className="text-sm font-black text-slate-900 block mb-3">{pack.sub}</span>
                <span className="text-2xl font-black text-amber-500 tracking-tight block">{planPriceFormat(pack.price)}</span>
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">{pack.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> FAQ
            </h2>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase tracking-tight">
              Questions Fréquentes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-black text-slate-900 mb-3 leading-snug">
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10 text-slate-400 font-medium text-[10px] select-none uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-sm uppercase">
              <img src="/logo.jpeg" className="w-6 h-6 object-contain" alt="Logo" />
              <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
            </div>
            <p className="text-[9px]">© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          </div>
          <div className="flex gap-6 font-black">
            <a href="/#/conditions-utilisation" className="hover:text-amber-500 transition-colors">CGU</a>
            <a href="/#/confidentialite" className="hover:text-amber-500 transition-colors">Confidentialité</a>
            <a href="mailto:contact@dghubschool.com" className="hover:text-amber-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper simple pour éviter de répéter
function planPriceFormat(val: string) {
  return val;
}
