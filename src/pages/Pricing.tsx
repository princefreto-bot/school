// ============================================================
// PAGE TARIFICATION (PRICING) — Modern, Premium, Rounded Borders
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'annual' | 'monthly'>('annual');

  const plans = [
    {
      name: "Essai Gratuit",
      price: "0 F CFA",
      period: "pendant 60 jours",
      description: "Découvrez l'ensemble de la plateforme sans aucun engagement financier.",
      features: [
        "Jusqu'à 100 élèves gérés",
        "Encaissements Mobile Money activés",
        "Bulletins scolaires et notes illimités",
        "Espace parents d'élèves inclus",
        "Support par e-mail et WhatsApp"
      ],
      buttonText: "Démarrer l'essai gratuit",
      popular: false,
      ctaAction: () => navigate('/creer-compte'),
      borderColor: "border-slate-200"
    },
    {
      name: "Standard",
      price: billingPeriod === 'annual' ? "1 000 F CFA" : "150 F CFA",
      period: billingPeriod === 'annual' ? "par élève / an" : "par élève / mois",
      description: "La formule idéale pour piloter l'ensemble de votre établissement en toute autonomie.",
      features: [
        "Élèves et classes illimités",
        "Encaissements Wave, T-Money, Flooz, MTN, Orange Money",
        "Bulletins de notes officiels (Moyennes auto)",
        "Envoi de relevés de notes et notifications SMS",
        "Cartes d'identité scolaires avec QR Code",
        "Support prioritaire WhatsApp 6j/7"
      ],
      buttonText: "Activer mon école",
      popular: true,
      ctaAction: () => navigate('/creer-compte'),
      borderColor: "border-amber-500 shadow-amber-500/10 shadow-lg"
    },
    {
      name: "Grand Groupe",
      price: "Sur Mesure",
      period: "devis personnalisé",
      description: "Pour les grands complexes scolaires et les réseaux multi-établissements.",
      features: [
        "Toutes les fonctionnalités incluses",
        "Multi-établissements (Console centrale)",
        "Développement de modules spécifiques",
        "Intégration comptable avancée",
        "Gestionnaire de compte dédié",
        "Support prioritaire 24h/24 & 7j/7"
      ],
      buttonText: "Contacter le support",
      popular: false,
      ctaAction: () => window.location.href = "mailto:contact@dghubschool.com",
      borderColor: "border-slate-200"
    }
  ];

  const faqs = [
    {
      q: "Comment fonctionnent les frais de scolarité via Mobile Money ?",
      a: "Les parents peuvent payer la scolarité de leurs enfants directement sur mobile via Wave, T-Money, Flooz, MTN ou Orange Money. L'argent est instantanément versé sur le compte de l'école et le reçu est généré automatiquement."
    },
    {
      q: "Que se passe-t-il à la fin de l'essai de 60 jours ?",
      a: "Vous pouvez continuer à utiliser la plateforme en choisissant notre formule standard ou grand groupe. Aucune carte bancaire n'est requise pour l'essai gratuit, vos données restent enregistrées et prêtes à l'emploi."
    },
    {
      q: "Est-il possible d'imprimer les cartes scolaires QR Code nous-mêmes ?",
      a: "Oui. DGhubSchool génère un document PDF haute résolution respectant la norme ISO 7810. Vous pouvez l'imprimer directement avec n'importe quelle imprimante de cartes PVC standard ou sur papier cartonné."
    },
    {
      q: "Mes données d'élèves sont-elles sécurisées ?",
      a: "Toutes les données sont chiffrées en transit et stockées sur des serveurs sécurisés. Nous effectuons des sauvegardes automatiques quotidiennes pour garantir que vous ne perdiez jamais vos bulletins scolaires ou vos historiques de caisse."
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
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-12 md:pt-16 pb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-4">
          Une tarification claire et flexible
        </h1>
        <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto mb-10">
          Choisissez la formule qui s'adapte aux effectifs de votre établissement scolaire, sans aucun frais caché.
        </p>

        {/* Toggle Billing Period */}
        <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl mb-12">
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${billingPeriod === 'annual' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
          >
            Facturation Annuelle (Recommandé)
          </button>
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${billingPeriod === 'monthly' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
          >
            Mensuelle
          </button>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white border p-8 rounded-3xl flex flex-col justify-between relative transition-all hover:shadow-xl ${plan.borderColor}`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Recommandé
                </div>
              )}
              <div>
                <h3 className="text-lg font-black text-slate-950 uppercase tracking-wide mb-2">
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

      {/* FAQ Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> FAQ
            </h2>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase tracking-tight">
              Questions Fréquentes
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Des réponses claires à toutes vos questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
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

      {/* Footer CTA */}
      <section className="bg-white py-16 text-center relative border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight">
            Prêt à moderniser votre gestion scolaire ?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            Lancez l'essai de 60 jours dès maintenant, aucune carte bancaire n'est demandée.
          </p>
          <button 
            onClick={() => navigate('/creer-compte')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Commencer l'essai de 60 jours
            <ArrowRight className="w-4 h-4" />
          </button>
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
