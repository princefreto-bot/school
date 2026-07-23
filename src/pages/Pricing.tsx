// ============================================================
// PAGE TARIFICATION (PRICING) — Uniquement Annuelle & Structurée
// ============================================================
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, HelpCircle, ArrowLeft, Landmark, Users } from 'lucide-react';
import { Footer } from '../components/Footer';
import gsap from 'gsap';
import { StickerStar, StickerHeart, StickerCurvedArrow, StickerNote, StickerCheck, StickerWave, StickerSparkle } from '../components/Stickers';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [activeTab, setActiveTab] = useState<'school' | 'parent'>('school');

  React.useEffect(() => {
    gsap.fromTo('.pricing-animate-in', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
    );
  }, [activeTab]);

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
      activateBtn: "Créer mon école",
      parentPlanBadge: "Pour les Parents d'Élèves",
      parentPlanTitle: "Abonnement Suivi Élève",
      parentPlanPeriod: "par élève / par an",
      parentPlanDesc: "Contribution annuelle par élève donnant aux parents un accès complet au suivi scolaire en temps réel.",
      parentPlanBtn: "Accéder au portail parent",
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
      activateBtn: "Créer mon école",
      parentPlanBadge: "For Parents",
      parentPlanTitle: "Student Tracking Subscription",
      parentPlanPeriod: "per student / per year",
      parentPlanDesc: "Annual contribution per student giving parents full access to real-time school tracking.",
      parentPlanBtn: "Access parent portal",
      faqTitle: "Frequently Asked Questions"
    }
  };

  const t = texts[lang];

  const schoolPlans = [
    {
      name: lang === 'fr' ? "Licence Établissement" : "School License",
      limit: lang === 'fr' ? "Nombre d'élèves illimité" : "Unlimited students",
      price: lang === 'fr' ? "GRATUIT LA 1ÈRE ANNÉE" : "FREE FOR YEAR 1",
      period: lang === 'fr' ? "Puis licence annuelle selon l'effectif dès l'an 2" : "Then annual license by enrolment from year 2",
      description: lang === 'fr' ? "Un accès total à l'écosystème DGhubSchool, gratuit pendant la première année. À partir de la 2ème année, une licence annuelle unique par établissement s'applique : 65 000 FCFA (0 à 500 élèves), 130 000 FCFA (500 à 1000 élèves), 200 000 FCFA (1000 à 1500 élèves)." : "Full access to the DGhubSchool ecosystem, free for the first year. From year 2, a single annual per-school license applies: 65,000 FCFA (0-500 students), 130,000 FCFA (500-1000), 200,000 FCFA (1000-1500).",
      features: lang === 'fr' ? [
        "Accès complet à la console d'administration et aux statistiques en temps réel",
        "Espace enseignant (notes, moyennes pondérées, appels)",
        "Génération des bulletins officiels DRE au format PDF",
        "Import Excel des notes en masse (modèle pré-rempli)",
        "Système de pointage présence par scan QR Code",
        "Gestion des classes, des inscriptions et de la scolarité",
        "Comptabilité en partie double (dépenses, balance, bilan, compte de résultat)",
        "Paie du personnel avec calcul automatique CNSS, AMU et IRPP",
        "Emploi du temps avec détection automatique des conflits",
        "Rappels de paiement automatiques aux parents en retard",
        "Capacité d'élèves illimitée dans le système",
        "Hébergement Cloud dédié, sauvegardes quotidiennes automatiques et sécurité"
      ] : [
        "Full access to the administration console and real-time statistics",
        "Teacher portal (grades, weighted averages, attendance)",
        "Official DRE report cards generation in PDF format",
        "Bulk Excel grade import (pre-filled template)",
        "QR Code attendance tracking system",
        "Management of classes, enrollments and school fees",
        "Double-entry accounting (expenses, trial balance, balance sheet, income statement)",
        "Payroll with automatic CNSS, AMU and IRPP tax calculation",
        "Timetable builder with automatic conflict detection",
        "Automatic payment reminders for overdue parents",
        "Unlimited student capacity in the system",
        "Dedicated Cloud hosting, automatic daily backups and security"
      ],
      buttonText: lang === 'fr' ? "Créer mon compte gratuitement" : "Create my free account",
      popular: true,
      ctaAction: () => navigate(`/${lang}/creer-compte`),
      borderColor: "border-amber-500 shadow-amber-500/20 shadow-xl"
    }
  ];

  const parentPlan = {
    type: t.parentPlanBadge,
    name: t.parentPlanTitle,
    price: "2 100 F CFA",
    period: lang === 'fr' ? "par élève" : "per student",
    description: lang === 'fr' 
      ? "Contribution de 2 100 F payable en 3 tranches de 700 F/mois. 14 jours d'essai gratuit !"
      : "Contribution of 2,100 F payable in 3 installments of 700 F/month. 14 days free trial!",
    features: lang === 'fr' ? [
      "14 jours d'essai gratuit sans engagement",
      "Paiement flexible en 3 tranches de 700 F CFA",
      "Notification instantanée (Push & SMS) à chaque note et présence",
      "Suivi transparent des versements de scolarité",
      "Accès complet au dossier scolaire et à la messagerie"
    ] : [
      "14-day free trial with no commitment",
      "Flexible payment in 3 installments of 700 F CFA",
      "Instant notification (Push & SMS) for each grade and attendance",
      "Transparent tracking of school fee payments",
      "Full access to academic record and messaging"
    ],
    buttonText: lang === 'fr' ? "Démarrer l'essai (14j)" : "Start free trial",
    ctaAction: () => navigate(`/${lang}/portail-ecole`)
  };

  const faqs = lang === 'fr' ? [
    {
      q: "Combien coûte DGhubSchool pour un établissement ?",
      a: "La 1ère année est entièrement gratuite, sans limite d'élèves. À partir de la 2ème année, une licence annuelle unique par établissement s'applique selon l'effectif : 65 000 FCFA/an (0 à 500 élèves), 130 000 FCFA/an (500 à 1000 élèves), 200 000 FCFA/an (1000 à 1500 élèves). Les modalités de paiement sont communiquées avant la fin de la première année."
    },
    {
      q: "Comment fonctionne l'essai pour les parents ?",
      a: "Les parents bénéficient de 14 jours d'essai gratuit dès la création de leur compte. Ils peuvent découvrir et utiliser la plateforme sans aucune restriction pendant cette période."
    },
    {
      q: "Comment se déroule le paiement de la contribution parentale ?",
      a: "La contribution est de 2 100 F CFA par élève. Elle est payable en 3 tranches souples de 700 F CFA par mois. Vous disposez d'un délai maximum de 3 mois pour solder la totalité."
    },
    {
      q: "Que se passe-t-il si la totalité n'est pas réglée à temps ?",
      a: "Si les 2 100 F CFA ne sont pas soldés au bout du délai maximum (les 14 jours d'essai + le délai de grâce des tranches), l'accès au compte parent sera bloqué jusqu'au règlement de la somme."
    }
  ] : [
    {
      q: "How much does DGhubSchool cost for a school?",
      a: "Year 1 is fully free, with unlimited students. From year 2, a single annual per-school license applies based on enrolment: 65,000 FCFA/year (0-500 students), 130,000 FCFA/year (500-1000), 200,000 FCFA/year (1000-1500). Payment terms are shared before the end of year 1."
    },
    {
      q: "How does the parent trial work?",
      a: "Parents get a 14-day free trial upon account creation. They can discover and use the platform without any restriction during this period."
    },
    {
      q: "How is the parental contribution paid?",
      a: "The contribution is 2,100 F CFA per student. It is payable in 3 flexible installments of 700 F CFA per month. You have a maximum of 3 months to settle the total amount."
    },
    {
      q: "What happens if the total is not paid on time?",
      a: "If the 2,100 F CFA is not settled after the maximum timeframe, access to the parent account will be locked until the payment is completed."
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
            <img src="/logo.svg" className="w-8 h-8 object-contain rounded-lg" alt="Logo" />
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
      <section className="pricing-animate-in relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-6 text-center">
        {/* Stickers décoratifs Hero */}
        <StickerStar className="absolute top-20 left-4 hidden md:block" style={{ transform: 'rotate(-12deg)', opacity: 0.5 }} />
        <StickerHeart className="absolute top-24 right-6 hidden lg:block" style={{ transform: 'rotate(8deg)', opacity: 0.5 }} />
        <StickerSparkle className="absolute bottom-8 left-[25%] hidden md:block" />

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
      <section className="pricing-animate-in relative z-10 max-w-7xl mx-auto px-4 py-8 flex-1">
        {/* Stickers décoratifs Pricing */}
        <StickerCurvedArrow className="absolute top-4 right-[10%] hidden lg:block" style={{ transform: 'rotate(-20deg)' }} />
        <StickerNote className="absolute top-8 left-4 hidden xl:block" style={{ transform: 'rotate(-2deg)' }}>
          {lang === 'fr' ? 'Zéro frais cachés !' : 'Zero hidden fees!'}
        </StickerNote>

        {activeTab === 'school' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch justify-center">
              {/* Only rendering one plan now for the free school offer */}
              <div className="lg:col-start-2">
              {schoolPlans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-900 border p-8 rounded-3xl flex flex-col justify-between relative transition-all hover:shadow-xl ${plan.borderColor}`}
                >
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    {lang === 'fr' ? '1ère année gratuite' : 'Free year 1'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      {plan.limit}
                    </span>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-wide mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-500 tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-400 font-bold block mt-1 uppercase">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feat, fidx) => (
                        <li key={fidx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={plan.ctaAction}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
              </div>
            </div>

            {/* Year 2 tiers table */}
            <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-3 py-1 rounded-full inline-block">
                  {lang === 'fr' ? 'À partir de la 2ème année' : 'From year 2 onward'}
                </span>
                <h4 className="text-lg font-black text-slate-950 dark:text-white mt-3">
                  {lang === 'fr' ? 'Licence annuelle par établissement' : 'Annual license per school'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {lang === 'fr' ? "Un tarif unique et annuel selon l'effectif d'élèves inscrits." : 'One flat annual fee based on total enrolment.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'fr' ? '0 à 500 élèves' : '0 to 500 students'}</p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">65 000<span className="text-sm text-slate-400 font-bold ml-1">FCFA</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{lang === 'fr' ? 'par an' : 'per year'}</p>
                </div>
                <div className="border-2 border-amber-400 dark:border-amber-500/60 rounded-xl p-4 text-center bg-amber-50/30 dark:bg-amber-950/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{lang === 'fr' ? '500 à 1000 élèves' : '500 to 1000 students'}</p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">130 000<span className="text-sm text-slate-400 font-bold ml-1">FCFA</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{lang === 'fr' ? 'par an' : 'per year'}</p>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'fr' ? '1000 à 1500 élèves' : '1000 to 1500 students'}</p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">200 000<span className="text-sm text-slate-400 font-bold ml-1">FCFA</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{lang === 'fr' ? 'par an' : 'per year'}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4 font-medium">
                {lang === 'fr'
                  ? "Modalités de paiement communiquées à chaque école avant la fin de sa 1ère année. Aucun engagement pendant la période gratuite."
                  : "Payment terms are shared with each school before the end of year 1. No commitment during the free period."}
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

      {/* Removed Packs Section */}

      {/* FAQ Section */}
      <section className="pricing-animate-in bg-white dark:bg-slate-950 py-16">
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
