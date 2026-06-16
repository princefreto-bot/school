// ============================================================
// PAGE D'ACCUEIL SAAS — Style Brutaliste Épuré & Bords Droits
// ============================================================
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CreditCard, 
  BookOpen, 
  Users, 
  QrCode, 
  ArrowRight, 
  Check, 
  Menu, 
  X 
} from 'lucide-react';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);


  const texts = {
    fr: {
      features: "Fonctionnalités",
      pricing: "Tarification",
      about: "À Propos",
      login: "Connexion",
      createSchool: "Créer un établissement",
      createSchoolFree: "Créer un établissement gratuitement",
      accessPortals: "Accéder aux portails",
      heroTitlePart1: "Pilotez votre ",
      heroTitleHighlight: "établissement scolaire",
      heroTitlePart2: " en toute simplicité",
      heroSubtitle: "Gérez la caisse et le suivi de la scolarité, éditez les bulletins de notes officiels, suivez les présences par QR Code et donnez accès à des ressources scolaires gratuites pour les révisions à la maison.",
      realTimeDashboard: "Tableau de bord en temps réel (établissement masqué)",
      screenshotsTitle: "📸 Captures d'Écran Officielles",
      discoverFeatures: "Découvrez nos fonctionnalités clés en images",
      discoverDesc: "Une interface épurée, performante et adaptée aux besoins réels des écoles d'Afrique de l'Ouest.",
      securityTitle: "Cartes Scolaires Bien Visibles",
      securityDesc: "Générez et imprimez des cartes d'identité officielles pour vos élèves avec une photo passeport et un QR Code unique pour l'enregistrement automatique des présences.",
      academicsTitle: "Bulletins de Notes bien Remplis",
      academicsDesc: "Calcul automatique des moyennes trimestrielles/semestrielles, rangs, appréciations des enseignants et signature de la direction. Prêt à être imprimé ou partagé en lot.",
      bentoTitle: "Tout ce dont vous avez besoin, réuni au même endroit",
      bentoDesc: "Simplifiez la scolarité de vos élèves et offrez aux parents et aux enseignants une expérience moderne.",
      paymentTracking: "Suivi des Paiements & Caisse",
      paymentDesc: "Suivez les tranches de scolarité et les impayés de chaque élève. Enregistrez les règlements et générez des reçus de caisse numériques automatiques.",
      paymentBadge: "Comptabilité",
      bulletinsTitle: "Bulletins & Notes",
      bulletinsDesc: "Génération automatique des bulletins scolaires en un clic. Calcul des moyennes et classement des élèves sans aucun tableur Excel.",
      bulletinsBadge: "Bulletins PDF",
      parentsTitle: "Suivi des parents d'élèves",
      parentsDesc: "Un espace mobile simplifié pour les parents. Ils consultent les notes, les absences et l'assiduité sans avoir à se déplacer.",
      parentsBadge: "Portail mobile",
      qrCardsTitle: "Cartes scolaires à QR Code",
      qrCardsDesc: "Générez et imprimez des cartes scolaires officielles. Scannez le QR Code à l'entrée et à la sortie pour enregistrer automatiquement la présence de l'élève.",
      qrCardsBadge: "Sécurité d'accès",
      partnersLabel: "Écoles et lycées partenaires",
      studentsLabel: "Élèves inscrits et gérés",
      documentsLabel: "Bulletins et documents édités",
      networkLabel: "Taux de disponibilité réseau",
      testimonialText: "\"Grâce à DGhubSchool, nous avons réduit de 85% le taux de retard de paiement des frais de scolarité. Les parents adorent recevoir instantanément leur reçu numérique par SMS sans avoir à faire la queue à l'école.\"",
      testimonialAuthor: "M. Koffi Mensah",
      testimonialRole: "Directeur d'Établissement Scolaire à Lomé, Togo",
      pricingTitle: "Tarifs Transparent",
      pricingSubtitle: "Tarifs clairs et adaptés",
      pricingDesc: "Commencez sans engagement dès aujourd'hui.",
      freeTrialBadge: "Essai Gratuit",
      singleFormula: "Formule Unique",
      daysTrial: "60 Jours d'essai",
      afterTrial: "Puis un abonnement annuel adapté aux effectifs de votre école.",
      trialBtn: "Démarrer l'essai gratuit",
      newsroomTitle: "📢 Newsroom",
      newsroomSub: "Dernières avancées de DGhubSchool",
      newsroomDesc: "Suivez l'évolution de la plateforme et les fonctionnalités déployées.",
      newsroomBadge: "Infrastructure",
      newsroomCardTitle: "Sécurité renforcée",
      newsroomCardDesc: "DGhubSchool intègre des protocoles d'isolation de données pour s'assurer que chaque établissement dispose d'un espace hermétique protégé.",
      newsroomDate: "Avril 2026",
      viewAllNews: "Voir toutes les actualités",
      readyTitle: "Prêt à simplifier la gestion de votre école ?",
      readyDesc: "Rejoignez les établissements d'Afrique de l'Ouest qui font confiance à notre plateforme pour leur scolarité et leurs encaissements.",
      createSchoolBtn: "Créer un compte établissement"
    },
    en: {
      features: "Features",
      pricing: "Pricing",
      about: "About Us",
      login: "Login",
      createSchool: "Create a School",
      createSchoolFree: "Create a School for Free",
      accessPortals: "Access Portals",
      heroTitlePart1: "Manage your ",
      heroTitleHighlight: "school establishment",
      heroTitlePart2: " with complete simplicity",
      heroSubtitle: "Manage fees and track school activities, generate official report cards, monitor attendance via QR Code, and grant access to free educational resources for home learning.",
      realTimeDashboard: "Real-time dashboard (school masked)",
      screenshotsTitle: "📸 Official Screenshots",
      discoverFeatures: "Discover our key features in pictures",
      discoverDesc: "A clean, high-performance interface tailored to the real needs of West African schools.",
      securityTitle: "Clear School Cards",
      securityDesc: "Generate and print official ID cards for your students with a passport photo and a unique QR Code for automatic attendance tracking.",
      academicsTitle: "Well-filled Report Cards",
      academicsDesc: "Automatic calculation of term/semester averages, rankings, teachers' feedback, and administration signatures. Ready to be printed or shared in batch.",
      bentoTitle: "Everything you need, in one place",
      bentoDesc: "Simplify your students' education and provide a modern experience to parents and teachers.",
      paymentTracking: "Payment Tracking & Cashier",
      paymentDesc: "Track school fee installments and outstanding balances for each student. Record transactions and automatically generate digital receipts.",
      paymentBadge: "Accounting",
      bulletinsTitle: "Report Cards & Grades",
      bulletinsDesc: "Automatic generation of school reports in one click. Grade calculations and rankings without Excel spreadsheets.",
      bulletinsBadge: "PDF Reports",
      parentsTitle: "Parental Student Tracking",
      parentsDesc: "A simplified mobile portal for parents. Check grades, attendance, and progress without having to travel.",
      parentsBadge: "Mobile Portal",
      qrCardsTitle: "QR Code School Cards",
      qrCardsDesc: "Generate and print official student cards. Scan the QR Code at the entrance/exit to automatically record student attendance.",
      qrCardsBadge: "Access Security",
      partnersLabel: "Partner schools and high schools",
      studentsLabel: "Enrolled and managed students",
      documentsLabel: "Report cards and documents generated",
      networkLabel: "Network availability rate",
      testimonialText: "\"Thanks to DGhubSchool, we reduced school fee payment delays by 85%. Parents love receiving their digital receipt instantly by SMS without queuing at the school.\"",
      testimonialAuthor: "Mr. Koffi Mensah",
      testimonialRole: "School Principal in Lomé, Togo",
      pricingTitle: "Transparent Pricing",
      pricingSubtitle: "Clear and adapted pricing",
      pricingDesc: "Get started today with no commitment.",
      freeTrialBadge: "Free Trial",
      singleFormula: "Single Plan",
      daysTrial: "60 Days Trial",
      afterTrial: "Then an annual subscription adjusted to your school's enrollment.",
      trialBtn: "Start Free Trial",
      newsroomTitle: "📢 Newsroom",
      newsroomSub: "Latest Advances of DGhubSchool",
      newsroomDesc: "Follow the platform updates and deployed features.",
      newsroomBadge: "Infrastructure",
      newsroomCardTitle: "Enhanced Security",
      newsroomCardDesc: "DGhubSchool integrates data isolation protocols to ensure that each school has a secure, airtight space.",
      newsroomDate: "April 2026",
      viewAllNews: "See all news",
      readyTitle: "Ready to simplify your school management?",
      readyDesc: "Join West African schools that trust our platform for their operations and cash collections.",
      createSchoolBtn: "Create a school account"
    }
  };

  const t = texts[lang];

  // Statistiques de la plateforme (KPIs chiffrés réels)
  // Fonctionnalités principales (Bento Grid)
  const features = [
    {
      icon: <CreditCard className="w-8 h-8 text-amber-500" />,
      title: t.paymentTracking,
      description: t.paymentDesc,
      badge: t.paymentBadge,
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800 rounded-3xl"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-amber-500" />,
      title: t.bulletinsTitle,
      description: t.bulletinsDesc,
      badge: t.bulletinsBadge,
      className: "bg-white text-slate-800 border-slate-200 rounded-3xl"
    },
    {
      icon: <Users className="w-8 h-8 text-amber-500" />,
      title: t.parentsTitle,
      description: t.parentsDesc,
      badge: t.parentsBadge,
      className: "bg-white text-slate-800 border-slate-200 rounded-3xl"
    },
    {
      icon: <QrCode className="w-8 h-8 text-amber-500" />,
      title: t.qrCardsTitle,
      description: t.qrCardsDesc,
      badge: t.qrCardsBadge,
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800 rounded-3xl"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      {/* Background gradients pour effet premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />

      {/* ── HEADER / NAVIGATION ────────────────────────────── */}
      <header className="relative z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
            <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
          </div>

          {/* Liens Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider text-slate-500">
            <button onClick={() => navigate(`/${lang}/features`)} className="hover:text-amber-500 transition-colors cursor-pointer">{t.features}</button>
            <button onClick={() => navigate(`/${lang}/pricing`)} className="hover:text-amber-500 transition-colors cursor-pointer">{t.pricing}</button>
            <button onClick={() => navigate(`/${lang}/a-propos`)} className="hover:text-amber-500 transition-colors cursor-pointer">{t.about}</button>
          </div>

          {/* Boutons Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate(`/${lang}/login`)}
              className="text-xs font-black tracking-widest text-slate-600 hover:text-amber-500 transition-colors px-4 py-2"
            >
              {t.login}
            </button>
            <button 
              onClick={() => navigate(`/${lang}/creer-compte`)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {t.createSchool}
            </button>
          </div>

          {/* Toggle Menu - Mobile */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-amber-500 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/features`); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              {t.features}
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/pricing`); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              {t.pricing}
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/a-propos`); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              {t.about}
            </button>
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/login`); }}
                className="w-full text-center py-3 text-sm font-black tracking-wider text-slate-700 border border-slate-200 rounded-xl"
              >
                {t.login}
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/creer-compte`); }}
                className="w-full text-center py-3 text-sm font-black tracking-wider bg-amber-500 text-slate-950 rounded-xl border border-amber-600 shadow-md"
              >
                {t.createSchool}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION HERO ──────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 text-center flex-grow flex flex-col items-center justify-center">
        {/* Titre Principal */}
        <h1 className="text-3xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] max-w-4xl mb-6">
          {t.heroTitlePart1}<span className="text-amber-500 underline decoration-2 decoration-amber-500/50">{t.heroTitleHighlight}</span>{t.heroTitlePart2}
        </h1>

        {/* Sous-titre */}
        <p className="text-sm md:text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
          {t.heroSubtitle}
        </p>

        {/* Actions Hero */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <button 
            onClick={() => navigate(`/${lang}/creer-compte`)}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {t.createSchoolFree}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate(`/${lang}/login`)}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-slate-200 active:scale-[0.98] transition-all cursor-pointer"
          >
            {t.accessPortals}
          </button>
        </div>

        {/* Visual Mockup (Modern Rounded Card Style) */}
        <div className="w-full max-w-5xl border border-slate-200 bg-slate-50 p-3 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="w-full bg-slate-950 text-white rounded-t-xl p-4 text-left font-mono text-xs flex items-center justify-between border-b border-slate-800 select-none">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-slate-500 text-[10px] ml-2">dghubschool.com/dashboard</span>
            </div>
            <div className="w-4 h-4 rounded-none bg-slate-800 flex items-center justify-center">
              <span className="text-[10px] text-slate-400">＋</span>
            </div>
          </div>
          <div className="w-full aspect-[16/9] bg-white border-t border-slate-100 flex items-center justify-center rounded-b-xl overflow-hidden relative">
            <img 
              src="/dashboard_preview.png" 
              alt={t.realTimeDashboard} 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>

      {/* ── SECTION APERÇUS RÉELS (SCREENSHOTS) ────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            {t.screenshotsTitle}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">
            {t.discoverFeatures}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
            {t.discoverDesc}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Cartes Scolaires */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-2">
              <h4 className="text-lg font-black text-slate-950 uppercase">{t.securityTitle}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {t.securityDesc}
              </p>
            </div>
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
              <img src="/student_card_preview.png" alt="Cartes scolaires officielles avec QR Code" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Card 2: Bulletins de Notes */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                Académie & Bulletins
              </span>
              <h4 className="text-lg font-black text-slate-950 uppercase">{t.academicsTitle}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {t.academicsDesc}
              </p>
            </div>
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
              <img src="/report_card_preview.png" alt="Bulletins de notes officiels" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION FEATURES (BENTO GRID) ────────────────── */}
      <section id="features" className="bg-slate-50 border-y border-slate-200 py-20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* En-tête Section */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.features}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              {t.bentoTitle}
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              {t.bentoDesc}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className={`border p-6 md:p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${feat.className}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-block">
                      {feat.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                      {feat.badge}
                    </span>
                  </div>
                  <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-3">
                    {feat.title}
                  </h4>
                  <p className="text-xs md:text-sm opacity-80 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION PRICING ────────────────────────────────── */}
      <section id="pricing" className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.pricingTitle}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              {t.pricingSubtitle}
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              {t.pricingDesc}
            </p>
          </div>

          {/* Card Pricing */}
          <div className="max-w-sm mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden">
            {/* Populaire badge */}
            <div className="absolute top-4 right-[-32px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-10 text-center select-none">
              {t.freeTrialBadge}
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">{t.singleFormula}</h4>
              <span className="text-4xl font-black tracking-tight text-slate-950">{t.daysTrial}</span>
              <p className="text-xs text-slate-500 mt-2">{t.afterTrial}</p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'fr' ? 'Gestion de la caisse et reçus SMS' : 'Cash management and SMS receipts'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'fr' ? 'Bulletins et notes illimités' : 'Unlimited grade books and reports'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'fr' ? 'Accès complet parents, élèves et profs' : 'Full access for parents, students, and teachers'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'fr' ? 'Support dédié via WhatsApp' : 'Dedicated support via WhatsApp'}</span>
              </li>
            </ul>

            <button 
              onClick={() => navigate(`/${lang}/creer-compte`)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {t.trialBtn}
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION NEWSROOM (ACTUALITÉS & AVANCÉES) ── */}
      <section id="newsroom" className="bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/60 dark:border-slate-900 py-20 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              {t.newsroomTitle}
            </span>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight uppercase">
              {t.newsroomSub}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-xs md:text-sm">
              {t.newsroomDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
            {/* News 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full inline-block">
                  {t.newsroomBadge}
                </span>
                <h4 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase leading-snug group-hover:text-amber-500 transition-colors">
                  {t.newsroomCardTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t.newsroomCardDesc}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{t.newsroomDate}</span>
                <span 
                  onClick={() => navigate(`/${lang}/newsroom`)}
                  className="text-amber-505 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  {t.viewAllNews} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION FINAL CTA ────────────────────────────── */}
      <section className="bg-white py-16 text-center relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-slate-950 text-white rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-snug">
                {t.readyTitle}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
                {t.readyDesc}
              </p>
              <button 
                onClick={() => navigate(`/${lang}/creer-compte`)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                {t.createSchoolBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
