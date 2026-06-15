// ============================================================
// PAGE TARIFICATION (PRICING) — Uniquement Annuelle & Structurée
// ============================================================
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, HelpCircle, ArrowLeft, Landmark, Users } from 'lucide-react';
import { Footer } from '../components/Footer';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [activeTab, setActiveTab] = useState<'school' | 'parent'>('school');

  const texts = {
    fr: {
      back: "Accueil",
      badge: "🗓️ Tarification Annuelle Structurée",
      title: "Une formule adaptée à chaque besoin",
      subtitle: "Retrouvez nos abonnements annuels transparents pour les établissements scolaires et les parents d'élèves.",
      tabSchool: "Établissement",
      tabParent: "Parents d'Élèves",
      recommended: "Recommandé",
      perYear: "par an / par école",
      perYearCustom: "Tarif personnalisé",
      contactUs: "Nous Contacter",
      activateBtn: "Activer mon école",
      complianceWarningTitle: "⚠️ Avertissement de conformité :",
      complianceWarningDesc: "Le nombre d'élèves enregistrés est vérifié automatiquement. Si un établissement souscrit à une formule inférieure à son effectif réel d'inscriptions, tout son écosystème administratif et académique sera verrouillé jusqu'à la mise à niveau de la licence.",
      parentPlanBadge: "Pour les Parents d'Élèves",
      parentPlanTitle: "Abonnement Suivi Élève",
      parentPlanPeriod: "par élève / par an",
      parentPlanDesc: "Contribution annuelle par élève donnant aux parents un accès complet au suivi scolaire en temps réel.",
      parentPlanBtn: "Accéder au portail parent",
      degressiveTitle: "Tarifs Dégressifs Fratries (Parents)",
      degressiveSubtitle: "Des abonnements annuels dégressifs calculés pour soulager les familles de plusieurs enfants.",
      faqTitle: "Questions Fréquentes"
    },
    en: {
      back: "Home",
      badge: "🗓️ Structured Annual Pricing",
      title: "A plan tailored to every need",
      subtitle: "Find our transparent annual subscriptions for schools and parents.",
      tabSchool: "School",
      tabParent: "Parents",
      recommended: "Recommended",
      perYear: "per year / per school",
      perYearCustom: "Custom Pricing",
      contactUs: "Contact Us",
      activateBtn: "Activate my school",
      complianceWarningTitle: "⚠️ Compliance Warning:",
      complianceWarningDesc: "The number of registered students is verified automatically. If a school subscribes to a plan below its actual enrollment, its entire administrative and academic system will be locked until the license is upgraded.",
      parentPlanBadge: "For Parents",
      parentPlanTitle: "Student Tracking Subscription",
      parentPlanPeriod: "per student / per year",
      parentPlanDesc: "Annual contribution per student giving parents full access to real-time school tracking.",
      parentPlanBtn: "Access parent portal",
      degressiveTitle: "Degressive Family Rates (Parents)",
      degressiveSubtitle: "Degressive annual subscriptions calculated to relieve families with multiple children.",
      faqTitle: "Frequently Asked Questions"
    }
  };

  const t = texts[lang];

  const schoolPlans = [
    {
      name: lang === 'fr' ? "Licence Standard" : "Standard License",
      limit: lang === 'fr' ? "Moins de 500 élèves" : "Under 500 students",
      price: "50 000 F CFA",
      period: t.perYear,
      description: lang === 'fr' ? "Pour les petites écoles de moins de 500 élèves inscrits." : "For small schools with less than 500 registered students.",
      features: lang === 'fr' ? [
        "Accès complet à la console d'administration",
        "Espace enseignant pour la saisie des notes & moyennes",
        "Impression et édition des bulletins officiels DRE",
        "Système de pointage et présence (Scan QR)",
        "Génération de cartes d'identité scolaires avec QR Code",
        "Configuration des frais de scolarité personnalisés"
      ] : [
        "Full access to the administration console",
        "Teacher portal for grading & averages",
        "Printing and editing of official DRE report cards",
        "Attendance and clock-in system (QR Scan)",
        "QR Code student ID card generation",
        "Custom school fees configuration"
      ],
      buttonText: t.activateBtn,
      popular: false,
      ctaAction: () => navigate(`/${lang}/creer-compte`),
      borderColor: "border-slate-200 dark:border-slate-800"
    },
    {
      name: lang === 'fr' ? "Licence Intermédiaire" : "Intermediate License",
      limit: lang === 'fr' ? "Entre 500 et 1000 élèves" : "Between 500 and 1000 students",
      price: "100 000 F CFA",
      period: t.perYear,
      description: lang === 'fr' ? "Pour les écoles de taille moyenne comptant entre 500 et 1000 élèves." : "For mid-size schools with 500 to 1000 students.",
      features: lang === 'fr' ? [
        "Toutes les fonctionnalités de la formule Standard",
        "Capacité d'inscription de 500 à 1000 élèves",
        "Support technique prioritaire",
        "Rapports financiers et bilans automatisés",
        "Envoi de messages groupés aux parents"
      ] : [
        "All features of the Standard plan",
        "Enrollment capacity from 500 to 1000 students",
        "Priority technical support",
        "Automated financial reports and balance sheets",
        "Send bulk messages to parents"
      ],
      buttonText: t.activateBtn,
      popular: true,
      ctaAction: () => navigate(`/${lang}/creer-compte`),
      borderColor: "border-amber-500 shadow-amber-500/10 shadow-lg"
    },
    {
      name: lang === 'fr' ? "Licence Avancée" : "Advanced License",
      limit: lang === 'fr' ? "Entre 1000 et 2000 élèves" : "Between 1000 and 2000 students",
      price: "150 000 F CFA",
      period: t.perYear,
      description: lang === 'fr' ? "Pour les grands établissements scolaires comptant entre 1000 et 2000 élèves." : "For large school establishments with 1000 to 2000 students.",
      features: lang === 'fr' ? [
        "Toutes les fonctionnalités de la formule Intermédiaire",
        "Capacité d'inscription de 1000 à 2000 élèves",
        "Support dédié 24h/24 & 7j/7",
        "Sauvegardes automatiques quotidiennes des données",
        "Accès à l'historique d'activités de l'administration"
      ] : [
        "All features of the Intermediate plan",
        "Enrollment capacity from 1000 to 2000 students",
        "24/7 dedicated support",
        "Daily automatic data backups",
        "Access to administration activity history"
      ],
      buttonText: t.activateBtn,
      popular: false,
      ctaAction: () => navigate(`/${lang}/creer-compte`),
      borderColor: "border-slate-200 dark:border-slate-800"
    },
    {
      name: lang === 'fr' ? "Licence Sur Mesure" : "Custom License",
      limit: lang === 'fr' ? "Plus de 2000 élèves" : "Over 2000 students",
      price: lang === 'fr' ? "Sur Devis" : "Custom Quote",
      period: t.perYearCustom,
      description: lang === 'fr' ? "Pour les très grands complexes de plus de 2000 élèves." : "For very large complexes and school networks with over 2000 students.",
      features: lang === 'fr' ? [
        "Toutes les fonctionnalités de la formule Avancée",
        "Capacité d'élèves illimitée dans le système",
        "Hébergement Cloud dédié et hautes performances",
        "Personnalisation graphique des bulletins d'établissement",
        "Formation sur site de vos équipes administratives"
      ] : [
        "All features of the Advanced plan",
        "Unlimited student capacity in the system",
        "Dedicated high-performance Cloud hosting",
        "Custom graphical layout of report cards",
        "On-site training for your administrative team"
      ],
      buttonText: t.contactUs,
      popular: false,
      ctaAction: () => window.location.href = `mailto:contact@dghubschool.com?subject=Demande%20Tarif%20Sur%20Mesure%20(>2000%20eleves)&body=Langue:${lang}`,
      borderColor: "border-slate-200 dark:border-slate-800"
    }
  ];

  const parentPlan = {
    type: t.parentPlanBadge,
    name: t.parentPlanTitle,
    price: "1 500 F CFA",
    period: t.parentPlanPeriod,
    description: t.parentPlanDesc,
    features: lang === 'fr' ? [
      "Notification instantanée (Push & SMS) à chaque note saisie",
      "Alertes instantanées de présence (Scan à l'arrivée / au départ)",
      "Suivi transparent des versements de scolarité & soldes restants",
      "Accès aux exercices scolaires et eBooks (Bibliothèque Numérique)",
      "Messagerie interne bidirectionnelle avec la vie scolaire"
    ] : [
      "Instant notification (Push & SMS) on every grade entered",
      "Instant attendance alerts (Scan on arrival / departure)",
      "Transparent tracking of school fee payments & remaining balances",
      "Access to academic exercises and eBooks (Digital Library)",
      "Bidirectional internal messaging with school life staff"
    ],
    buttonText: t.parentPlanBtn,
    ctaAction: () => navigate(`/${lang}/login`)
  };

  const packs = [
    {
      title: lang === 'fr' ? "Tarif Individuel" : "Individual Rate",
      sub: lang === 'fr' ? "1 Élève" : "1 Student",
      price: "1 500 F CFA",
      desc: lang === 'fr' ? "par élève et par an" : "per student and per year"
    },
    {
      title: lang === 'fr' ? "Pack Famille Réduit" : "Reduced Family Pack",
      sub: lang === 'fr' ? "3 Élèves" : "3 Students",
      price: "4 000 F CFA",
      desc: lang === 'fr' ? "au lieu de 4 500 F CFA / an" : "instead of 4,500 F CFA / year"
    },
    {
      title: lang === 'fr' ? "Pack Grande Famille" : "Large Family Pack",
      sub: lang === 'fr' ? "5 Élèves" : "5 Students",
      price: "7 000 F CFA",
      desc: lang === 'fr' ? "au lieu de 7 500 F CFA / an" : "instead of 7,500 F CFA / year"
    }
  ];

  const faqs = lang === 'fr' ? [
    {
      q: "Comment est facturé l'établissement ?",
      a: "L'école souscrit à une formule annuelle selon son effectif réel d'élèves (Moins de 500, 500-1000, 1000-2000, ou Plus de 2000). Cette licence annuelle unique permet d'activer tous les portails de gestion administrative, académique et financière."
    },
    {
      q: "Que se passe-t-il si mon établissement dépasse sa limite d'élèves ?",
      a: "Afin de garantir l'équité, si le nombre réel d'élèves inscrits dans votre école dépasse la limite autorisée par votre formule actuelle, l'accès à l'écosystème de l'établissement est temporairement suspendu. Vous devrez simplement mettre à niveau (upgrade) votre formule pour débloquer immédiatement l'accès."
    },
    {
      q: "Who pays the 1,500 F CFA contribution?",
      a: "Cette contribution est payée annuellement par les parents d'élèves lors de leur première connexion. Elle donne accès au suivi en temps réel (SMS, push, notes, présences, exercices). Des packs famille dégressifs sont proposés automatiquement pour les fratries."
    },
    {
      q: "Y a-t-il des frais mensuels ou cachés ?",
      a: "Non. DGhubSchool fonctionne exclusivement sur un modèle d'activation et de contribution annuelle. Aucun abonnement mensuel ni frais masqué n'est appliqué."
    }
  ] : [
    {
      q: "How is the school billed?",
      a: "The school subscribes to an annual formula according to its actual enrollment of students (Under 500, 500-1000, 1000-2000, or Over 2000). This single annual license activates all administrative, academic, and financial management portals."
    },
    {
      q: "What happens if my school exceeds its student limit?",
      a: "To ensure fairness, if the actual number of registered students in your school exceeds the limit allowed by your current plan, access to the school ecosystem is temporarily suspended. You will simply need to upgrade your plan to unlock access immediately."
    },
    {
      q: "Who pays the 1,500 F CFA parental contribution?",
      a: "This contribution is paid annually by parents during their first login. It grants access to real-time tracking (SMS, push notifications, grades, attendance, exercises). Decreasing family packs are automatically offered for siblings."
    },
    {
      q: "Are there any monthly or hidden fees?",
      a: "No. DGhubSchool operates exclusively on an annual activation and contribution model. No monthly subscriptions or hidden fees are applied."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['Poppins'] relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
            <img src="/logo.png" className="w-8 h-8 object-contain rounded-lg" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900 dark:text-white">School</span></span>
          </div>
          <button 
            onClick={() => navigate(`/${lang}`)} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          {t.badge}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-4">
          {t.title}
        </h1>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          {t.subtitle}
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center mt-10">
          <div className="bg-slate-200/60 dark:bg-slate-900/80 p-1.5 rounded-2xl flex gap-1 border border-slate-300/30">
            <button
              onClick={() => setActiveTab('school')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'school'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Landmark className="w-4 h-4" />
              {t.tabSchool}
            </button>
            <button
              onClick={() => setActiveTab('parent')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'parent'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              {t.tabParent}
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-8 flex-1">
        {activeTab === 'school' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {schoolPlans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-900 border p-6 rounded-3xl flex flex-col justify-between relative transition-all hover:shadow-xl ${plan.borderColor}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      {t.recommended}
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      {plan.limit}
                    </span>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wide mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed min-h-[48px]">
                      {plan.description}
                    </p>
                    <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                      <span className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feat, fidx) => (
                        <li key={fidx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={plan.ctaAction}
                    className={`w-full py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
                      plan.popular
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md border border-amber-600"
                        : "bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-warning for schools */}
            <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/30 rounded-2xl max-w-4xl mx-auto flex items-center gap-3 text-red-800 dark:text-red-400 text-xs">
              <Landmark className="w-5 h-5 shrink-0" />
              <p className="font-semibold leading-relaxed">
                ⚠️ <b>{t.complianceWarningTitle}</b> {t.complianceWarningDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-amber-500/30 p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                <Users className="w-48 h-48 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-3 py-1 rounded-full inline-block mb-4">
                  {parentPlan.type}
                </span>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-wide mb-2">
                  {parentPlan.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                  {parentPlan.description}
                </p>
                <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <span className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                    {parentPlan.price}
                  </span>
                  <span className="text-xs text-slate-400 font-bold block mt-1 uppercase">
                    {parentPlan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {parentPlan.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={parentPlan.ctaAction}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {parentPlan.buttonText}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Fratrie / Packs Section */}
      <section className="relative z-10 bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200/50 dark:border-slate-800/80 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-xl md:text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
              {t.degressiveTitle}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              {t.degressiveSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((pack, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{pack.title}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block mb-3">{pack.sub}</span>
                <span className="text-2xl font-black text-amber-500 tracking-tight block">{pack.price}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">{pack.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-slate-950 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> FAQ
            </h2>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
              {t.faqTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 leading-snug">
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
