// ============================================================
// PAGE D'ACCUEIL SAAS — Style Brutaliste Épuré & Bords Droits
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  CreditCard, 
  BookOpen, 
  Users, 
  QrCode, 
  ArrowRight, 
  Check, 
  Menu, 
  X,
  Star,
  Shield,
  Smartphone,
  Bell,
  Sparkles,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { BACKEND_URL } from '../config';
import { StickerStar, StickerHeart, StickerCurvedArrow, StickerWave, StickerCheck, StickerNote, StickerSparkle, StickerCircle, StickerUnderline, StickerBang } from '../components/Stickers';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dbStats, setDbStats] = useState({ schools: 0, students: 0, documents: 0 });
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/public/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setDbStats({
            schools: data.schools || 0, 
            students: data.students || 0,
            documents: data.documents || 0
          });
        }
      })
      .catch(err => console.error("Erreur récupération des statistiques:", err));

    fetch(`${BACKEND_URL}/api/testimonials`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch(err => console.error("Erreur récupération témoignages:", err));

    // Scroll animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const texts = {
    fr: {
      features: "Fonctionnalités",
      pricing: "Tarifs",
      about: "Notre Histoire",
      socialProof: "Résultats",
      login: "Se connecter",
      createSchool: "Lancer mon école",
      createSchoolFree: "Lancer mon école gratuitement",
      accessPortals: "Accéder à mon espace",
      heroTitlePart1: "Fini les files d'attente. Gérez ",
      heroTitleHighlight: "votre école en 2 secondes",
      heroTitlePart2: " depuis votre téléphone.",
      heroSubtitle: "Centralisez vos encaissements de scolarité (espèces, chèques, virements) avec enregistrement de reçus physiques pour notifier les parents instantanément, éditez les bulletins PDF conformes DRE en un clic, pointez les entrées/sorties par scan QR et offrez aux parents un tableau de bord live — le tout sans Excel, sans file d'attente, même en connexion 2G.",
      realTimeDashboard: "Tableau de bord en temps réel",
      screenshotsTitle: "📸 La plateforme en images",
      discoverFeatures: "Ce que voient vos directeurs, parents et élèves",
      discoverDesc: "Des interfaces pensées pour le terrain : rapides, lisibles et accessibles depuis n'importe quel smartphone Android ou iPhone.",
      securityTitle: "Cartes Scolaires avec QR Code",
      securityDesc: "Générez et imprimez en quelques secondes des cartes d'identité officielles avec photo passeport et QR Code unique. Dès qu'un élève scanne à l'entrée, le parent est notifié automatiquement. Fini les absences non signalées.",
      academicsTitle: "Bulletins PDF prêts à signer",
      academicsDesc: "Un clic suffit : DGhubSchool calcule les moyennes, les rangs, les appréciations des enseignants et génère un bulletin conforme DRE, prêt à imprimer ou à envoyer par lot. Zéro calcul manuel, zéro erreur.",
      bentoTitle: "Tout ce que gère un directeur. Dans un seul outil.",
      bentoDesc: "DGhubSchool centralise la caisse, les bulletins, le suivi des parents et la sécurité d'accès — pour que vous passiez enfin du temps à enseigner, pas à administrer.",
      paymentTracking: "Caisse & Recouvrement en temps réel",
      paymentDesc: "Chaque versement (espèces, chèques, virements) est horodaté et associé à l'élève en 2 secondes après enregistrement du reçu physique. Le solde restant est recalculé instantanément, le reçu PDF + SMS part au parent, et votre journal de caisse s'alimente seul. Exportable Excel en un clic.",
      paymentBadge: "💰 Caisse",
      bulletinsTitle: "Bulletins & Relevés de Notes",
      bulletinsDesc: "Vos enseignants saisissent les notes, DGhubSchool fait le reste : moyennes trimestrielles, rangs de classe, appréciations et bulletins PDF conformes au format officiel DRE. Imprimables ou partageables en masse en quelques secondes.",
      bulletinsBadge: "📄 Bulletins PDF",
      parentsTitle: "Parents connectés et informés",
      parentsDesc: "Le parent reçoit une notification push dès qu'une note est saisie, dès qu'un versement est enregistré, dès que son enfant entre ou sort. Il consulte le solde de scolarité, les bulletins et les alertes d'absence — directement depuis son téléphone, sans appeler l'école.",
      parentsBadge: "📱 Portail parents",
      qrCardsTitle: "Présences par QR Code",
      qrCardsDesc: "Chaque élève dispose d'une carte avec QR Code unique. Le gardien scanne à l'entrée : en moins de 2 secondes le parent est notifié par SMS ou notification push. L'historique d'assiduité est consultable 24h/24 par le directeur comme par le parent.",
      qrCardsBadge: "🔐 Sécurité",
      partnersLabel: "Établissements actifs",
      studentsLabel: "Élèves suivis sur la plateforme",
      documentsLabel: "Bulletins & reçus générés",
      networkLabel: "Disponibilité garantie",
      testimonialText: "\"Avant DGhubSchool, je passais 3 heures par semaine à calculer des moyennes dans Excel. Aujourd'hui, les bulletins sont prêts en 5 minutes et les parents les reçoivent directement sur leur téléphone. Nos parents nous font confiance parce qu'ils voient tout en temps réel.\"",
      testimonialAuthor: "Mme Adjoua Yao",
      testimonialRole: "Directrice du Complexe Scolaire Les Étoiles — Abidjan, Côte d'Ivoire",
      pricingTitle: "💡 Tarification",
      pricingSubtitle: "40 jours gratuits. Sans carte bancaire.",
      pricingDesc: "Testez toute la plateforme avec vos vraies données. Si ce n'est pas transformateur, vous ne payez rien.",
      freeTrialBadge: "Essai Gratuit",
      singleFormula: "Formule Unique Tout Inclus",
      daysTrial: "40 jours offerts",
      afterTrial: "Puis un abonnement annuel calculé selon l'effectif de votre établissement. Pas de surprise, pas de module caché.",
      trialBtn: "Commencer gratuitement maintenant",
      newsroomTitle: "📢 Actualités",
      newsroomSub: "Ce qui change chez DGhubSchool",
      newsroomDesc: "Nouvelles fonctionnalités, améliorations de sécurité et retours terrain — tout ce qui fait évoluer la plateforme.",
      newsroomBadge: "🔒 Sécurité",
      newsroomCardTitle: "Isolation des données par établissement",
      newsroomCardDesc: "Chaque école dispose de son propre espace de données totalement isolé. Aucun directeur ne peut voir les données d'un autre établissement. Vos informations financières et académiques restent hermétiquement protégées.",
      newsroomDate: "Juin 2026",
      viewAllNews: "Lire toutes les actualités",
      readyTitle: "Votre école mérite mieux qu'Excel.",
      readyDesc: "Rejoignez les directeurs d'Afrique de l'Ouest qui ont arrêté les calculs manuels, les files d'attente à la caisse et les bulletins imprimés à la dernière minute. Votre essai gratuit de 40 jours commence maintenant.",
      createSchoolBtn: "Lancer mon école gratuitement",
      cloudTitle: "Oubliez les serveurs locaux. Passez au Cloud.",
      cloudDesc: "La majorité des écoles utilisent encore des systèmes installés sur des ordinateurs locaux. Résultat : virus, disques durs grillés, perte totale des données scolaires et inaccessibilité à distance. Avec DGhubSchool, vos données sont sauvegardées en temps réel sur des serveurs Cloud ultra-sécurisés.",
      cloudPoint1: "Zéro risque de perte : Sauvegardes automatisées 24/7.",
      cloudPoint2: "Accessibilité mondiale : Gérez votre école depuis n'importe où.",
      cloudPoint3: "Zéro maintenance : Pas de serveur à acheter ou réparer.",
      parentsFocusTitle: "Impliquez les parents comme jamais auparavant",
      parentsFocusDesc: "Offrez aux parents une visibilité totale sur le parcours de leur enfant via une interface dédiée. Fini les carnets de correspondance papier égarés.",
      parentsFocus1: "Proposition d'Exercices",
      parentsFocus1Desc: "La plateforme propose une sélection d'exercices permettant aux parents d'accompagner leurs enfants dans les révisions à la maison.",
      parentsFocus2: "Alertes Instantanées",
      parentsFocus2Desc: "Notifications en temps réel pour les absences, retards et rappels de paiements via SMS et Push.",
      parentsFocus3: "Reçus Numériques",
      parentsFocus3Desc: "Accès instantané aux reçus de paiement numérisés dès leur enregistrement par l'école."
    },
    en: {
      features: "Features",
      pricing: "Pricing",
      about: "Our Story",
      socialProof: "Results",
      login: "Log in",
      createSchool: "Launch my school",
      createSchoolFree: "Launch my school for free",
      accessPortals: "Access my space",
      heroTitlePart1: "No more queues. Run ",
      heroTitleHighlight: "your entire school in 2 seconds",
      heroTitlePart2: " from your phone.",
      heroSubtitle: "Centralize your tuition collections (cash, checks, transfers) with physical receipt recording to notify parents instantly, produce DRE-compliant PDF report cards in one click, track entries and exits by QR scan, and give parents a live dashboard — all without Excel, without queuing, even on a 2G connection.",
      realTimeDashboard: "Real-time dashboard",
      screenshotsTitle: "📸 The platform in pictures",
      discoverFeatures: "What your principals, parents and students see",
      discoverDesc: "Interfaces built for the field: fast, readable and accessible from any Android or iPhone smartphone.",
      securityTitle: "School ID Cards with QR Code",
      securityDesc: "Generate and print official school ID cards with passport photo and unique QR Code in seconds. When a student scans in, parents are automatically notified. No more unreported absences.",
      academicsTitle: "PDF Report Cards ready to sign",
      academicsDesc: "One click is all it takes: DGhubSchool calculates averages, rankings, teacher comments and generates a DRE-compliant report card, ready to print or send in bulk. Zero manual calculation, zero errors.",
      bentoTitle: "Everything a principal manages. In one tool.",
      bentoDesc: "DGhubSchool centralizes cashiering, report cards, parent communication and access security — so you spend your time teaching, not administering.",
      paymentTracking: "Cashier & Collections in Real Time",
      paymentDesc: "Every payment (cash, checks, transfers) is timestamped and linked to the student in 2 seconds after recording the physical receipt. The remaining balance is instantly recalculated, a PDF + SMS receipt goes to the parent, and your cash journal updates itself. Exportable to Excel in one click.",
      paymentBadge: "💰 Cashier",
      bulletinsTitle: "Report Cards & Grade Records",
      bulletinsDesc: "Teachers enter grades, DGhubSchool does the rest: term averages, class rankings, remarks and DRE-compliant PDF report cards. Printable or shareable in bulk in seconds.",
      bulletinsBadge: "📄 PDF Reports",
      parentsTitle: "Connected and informed parents",
      parentsDesc: "Parents receive a push notification when a grade is entered, a payment recorded, or when their child arrives or leaves. They check tuition balance, report cards and absence alerts — from their phone, without calling the school.",
      parentsBadge: "📱 Parent Portal",
      qrCardsTitle: "Attendance by QR Code",
      qrCardsDesc: "Every student has a card with a unique QR Code. The security guard scans at entry: in under 2 seconds the parent is notified by SMS or push notification. The attendance history is accessible 24/7 by both the principal and the parent.",
      qrCardsBadge: "🔐 Security",
      partnersLabel: "Active schools",
      studentsLabel: "Students managed on the platform",
      documentsLabel: "Report cards & receipts generated",
      networkLabel: "Guaranteed uptime",
      testimonialText: "\"Before DGhubSchool, I spent 3 hours a week calculating averages in Excel. Now report cards are ready in 5 minutes and parents receive them directly on their phones. Our parents trust us because they see everything in real time.\"",
      testimonialAuthor: "Mrs. Adjoua Yao",
      testimonialRole: "Principal of Complexe Scolaire Les Étoiles — Abidjan, Côte d'Ivoire",
      pricingTitle: "💡 Pricing",
      pricingSubtitle: "40 days free. No credit card required.",
      pricingDesc: "Test the full platform with your real data. If it's not transformative, you pay nothing.",
      freeTrialBadge: "Free Trial",
      singleFormula: "Single All-Inclusive Plan",
      daysTrial: "40 days free",
      afterTrial: "Then an annual subscription based on your school's enrollment. No surprises, no hidden modules.",
      trialBtn: "Start free right now",
      newsroomTitle: "📢 News",
      newsroomSub: "What's changing at DGhubSchool",
      newsroomDesc: "New features, security improvements and field feedback — everything that makes the platform evolve.",
      newsroomBadge: "🔒 Security",
      newsroomCardTitle: "Data isolation by school",
      newsroomCardDesc: "Each school has its own completely isolated data space. No principal can see another school's data. Your financial and academic information remains hermetically protected.",
      newsroomDate: "June 2026",
      viewAllNews: "Read all news",
      readyTitle: "Your school deserves better than Excel.",
      readyDesc: "Join school principals across West Africa who have stopped manual calculations, cashier queues and last-minute printed report cards. Your free 40-day trial starts now.",
      createSchoolBtn: "Launch my school for free",
      cloudTitle: "Forget local servers. Switch to the Cloud.",
      cloudDesc: "Most schools still use systems installed on local computers. Result: viruses, dead hard drives, total loss of school data, and lack of remote access. With DGhubSchool, your data is backed up in real-time on ultra-secure Cloud servers.",
      cloudPoint1: "Zero risk of loss: 24/7 automated backups.",
      cloudPoint2: "Global accessibility: Manage your school from anywhere.",
      cloudPoint3: "Zero maintenance: No servers to buy or repair.",
      parentsFocusTitle: "Engage parents like never before",
      parentsFocusDesc: "Give parents full visibility into their child's journey via a dedicated interface. No more lost paper communication books.",
      parentsFocus1: "Practice Exercises",
      parentsFocus1Desc: "The platform offers a selection of exercises allowing parents to help their children with revisions at home.",
      parentsFocus2: "Instant Alerts",
      parentsFocus2Desc: "Real-time notifications for absences, lateness, and payment reminders via SMS and Push.",
      parentsFocus3: "Digital Receipts",
      parentsFocus3Desc: "Instant access to digitized payment receipts as soon as they are recorded by the school."
    }
  };

  const t = texts[lang as keyof typeof texts] ?? texts['fr'];

  const stats = [
    { value: `+${dbStats.schools.toLocaleString('fr-FR')}`, label: t.partnersLabel },
    { value: `+${dbStats.students.toLocaleString('fr-FR')}`, label: t.studentsLabel },
    { value: `+${dbStats.documents.toLocaleString('fr-FR')}`, label: t.documentsLabel },
    { value: "99.9%", label: t.networkLabel },
  ];

  const features = [
    {
      icon: <CreditCard className="w-8 h-8 text-amber-500" />,
      title: t.paymentTracking,
      description: t.paymentDesc,
      badge: t.paymentBadge,
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800 rounded-xl"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-amber-500" />,
      title: t.bulletinsTitle,
      description: t.bulletinsDesc,
      badge: t.bulletinsBadge,
      className: "bg-white text-slate-800 border-slate-200 rounded-xl"
    },
    {
      icon: <Users className="w-8 h-8 text-amber-500" />,
      title: t.parentsTitle,
      description: t.parentsDesc,
      badge: t.parentsBadge,
      className: "bg-white text-slate-800 border-slate-200 rounded-xl"
    },
    {
      icon: <QrCode className="w-8 h-8 text-amber-500" />,
      title: t.qrCardsTitle,
      description: t.qrCardsDesc,
      badge: t.qrCardsBadge,
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800 rounded-xl"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(10%); }
          50% { transform: translateY(700%); }
          100% { transform: translateY(10%); }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Scroll reveal styles */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(25px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-400 { transition-delay: 400ms; }
      `}</style>

      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />

      {/* ── HEADER / NAVIGATION FLOAT ET GLASSMORPHIC AVEC BORDS RÉDUITS ────────────────────────────── */}
      <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="border border-slate-200/80 bg-white/75 backdrop-blur-md rounded-xl shadow-lg shadow-slate-100/50 transition-all duration-300">
          <nav className="w-full flex items-center justify-between p-3 px-6">
            {/* Logo */}
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
              <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
              <span className="text-amber-600">DGhub<span className="text-slate-900">School</span></span>
            </div>

            {/* Liens Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider text-slate-500">
              <button onClick={() => navigate(`/${lang}/features`)} className="hover:text-amber-500 transition-colors cursor-pointer relative py-1 group/item">
                {t.features}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </button>
              <button onClick={() => navigate(`/${lang}/pricing`)} className="hover:text-amber-500 transition-colors cursor-pointer relative py-1 group/item">
                {t.pricing}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </button>
              <button onClick={() => navigate(`/${lang}/a-propos`)} className="hover:text-amber-500 transition-colors cursor-pointer relative py-1 group/item">
                {t.about}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </button>
              <a href="#stats" className="hover:text-amber-500 transition-colors relative py-1 group/item">
                {t.socialProof}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </a>
            </div>

            {/* Boutons Actions - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate(`/${lang}/app`)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {t.accessPortals}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate(`/${lang}/login`)}
                    className="text-xs font-black tracking-widest text-slate-600 hover:text-amber-500 transition-colors px-4 py-2"
                  >
                    {t.login}
                  </button>
                  <button 
                    onClick={() => navigate(`/${lang}/creer-compte`)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {t.createSchool}
                  </button>
                </>
              )}
            </div>

            {/* Toggle Menu - Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-amber-500 transition-colors"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white p-5 space-y-4 flex flex-col rounded-b-xl animate-in fade-in slide-in-from-top-4 duration-200">
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
              <a 
                href="#stats" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2"
              >
                {t.socialProof}
              </a>
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <button 
                    onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/app`); }}
                    className="w-full text-center py-3 text-sm font-black tracking-wider bg-amber-500 text-slate-950 rounded-lg border border-amber-600 shadow-md"
                  >
                    {t.accessPortals}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/login`); }}
                      className="w-full text-center py-3 text-sm font-black tracking-wider text-slate-700 border border-slate-200 rounded-lg"
                    >
                      {t.login}
                    </button>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/creer-compte`); }}
                      className="w-full text-center py-3 text-sm font-black tracking-wider bg-amber-500 text-slate-950 rounded-lg border border-amber-600 shadow-md"
                    >
                      {t.createSchool}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col">
      {/* ── SECTION HERO 2-COLONNES CÔTE-À-CÔTE PREMIUM ──────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-8 pt-12 md:pt-20 pb-20 flex-grow">
        {/* Stickers décoratifs Hero */}
        <StickerStar className="absolute top-10 left-4 hidden md:block animate-pulse" style={{ animationDuration: '4s' }} />
        <StickerHeart className="absolute bottom-16 right-4 hidden md:block" style={{ transform: 'rotate(12deg)' }} />
        <StickerSparkle className="absolute top-20 left-[48%] hidden lg:block" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center text-center lg:text-left">
          {/* Hero Content (Left) */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 animate-fade-in-up">
            {/* Titre Principal */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
              {t.heroTitlePart1}
              <span className="relative text-amber-600 inline-block px-1 select-none">
                {t.heroTitleHighlight}
                <StickerUnderline className="absolute bottom-[-8px] left-0 w-full" />
              </span>
              {t.heroTitlePart2}
            </h1>

            {/* Sous-titre */}
            <p className="text-sm md:text-base lg:text-lg text-slate-500 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Actions Hero */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto lg:justify-start justify-center">
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate(`/${lang}/app`)}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  {t.accessPortals}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate(`/${lang}/creer-compte`)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    {t.createSchoolFree}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => navigate(`/${lang}/login`)}
                    className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-slate-200 active:scale-[0.98] transition-all hover:border-slate-300 cursor-pointer"
                  >
                    {t.accessPortals}
                  </button>
                </>
              )}
            </div>

            {/* Témoignage rapide sous les boutons */}
            <div className="flex items-center gap-4 lg:justify-start justify-center pt-6 border-t border-slate-100 max-w-lg lg:mx-0 mx-auto">
              <div className="flex -space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">CI</div>
                <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-950">SN</div>
                <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">BF</div>
              </div>
              <div className="text-left">
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-[10px] font-black text-slate-800 tracking-wide uppercase">{lang === 'fr' ? 'Recommandé par +150 directeurs' : 'Recommended by +150 principals'}</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup side-by-side (Right) */}
          <div className="lg:col-span-5 relative flex justify-center w-full">
            {/* Lueur de fond diffuse */}
            <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] -translate-x-1/2 -translate-y-1/2 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Laptop Mockup with reduced corners */}
            <div className="w-full max-w-lg border border-slate-200 bg-slate-50 p-2.5 rounded-xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] hover:border-amber-500/20 transition-all duration-300">
              <div className="w-full bg-slate-950 text-white rounded-t-lg p-3 text-left font-mono text-[9px] flex items-center justify-between border-b border-slate-800 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-slate-500 text-[9px] ml-2">dghubschool.com/dashboard</span>
                </div>
                <div className="w-4 h-4 bg-slate-900 rounded flex items-center justify-center">
                  <span className="text-[9px] text-slate-500">＋</span>
                </div>
              </div>
              <div className="w-full aspect-[16/10] bg-white border-t border-slate-100 flex items-center justify-center rounded-b-lg overflow-hidden relative">
                <img 
                  src="/dashboard_preview.png" 
                  alt={t.realTimeDashboard} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>
            </div>

            {/* Floating Smartphone Mockup with corrected framing (object-contain bg-white to avoid cropping horizontal student card) */}
            <div className="absolute -bottom-8 -left-4 w-40 hidden md:block border-4 border-slate-950 bg-slate-950 p-1.5 rounded-xl shadow-2xl z-20 hover:-translate-y-2 transition-all duration-300">
              <div className="w-full aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden relative flex items-center justify-center p-3 border border-slate-900">
                <img src="/student_card_preview.png" className="w-full h-auto object-contain bg-white rounded-lg shadow-sm border border-slate-100" alt="Parent View Preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/5 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating Live Badge */}
            <div className="absolute -top-6 -right-6 bg-white border border-slate-200 p-3.5 px-4 rounded-xl shadow-lg z-20 hidden md:block hover:scale-105 transition-transform">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-50 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">{lang === 'fr' ? 'Activité Live' : 'Live Activity'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{lang === 'fr' ? 'Reçus SMS envoyés 24h/24' : 'SMS receipts sent 24/7'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION MARQUEES ────────────────────────────────── */}
      <section className="bg-slate-950 py-10 overflow-hidden relative border-y border-slate-900 font-['Poppins']">
        <div className="absolute inset-0 opacity-5 pointer-events-none" />
        
        <div className="space-y-4">
          <div className="flex overflow-hidden group">
            <div className="animate-marquee-left hover-pause flex gap-3 items-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center whitespace-nowrap">
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Numérisation</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Code QR</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Historique</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Annonces SMS</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Caisse</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Export Excel</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex overflow-hidden group">
            <div className="animate-marquee-right hover-pause flex gap-3 items-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center whitespace-nowrap">
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Recouvrement</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Bulletins PDF</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Format DRE</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Espace Parents</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Absences</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Retards</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Messagerie</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex overflow-hidden group">
            <div className="animate-marquee-left hover-pause flex gap-3 items-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center whitespace-nowrap">
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Cloud Sécurisé</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Zéro Perte</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Performance Active</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Tableaux de bord</span>
                  <span className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">Multi-Années</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION CLOUD VS LOCAL CÔTE-À-CÔTE AVEC MOCKUPS PREMIUM ET SCROLL ANIMATION ────────────────────────────── */}
      <section className="bg-slate-50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Contenu (Gauche) */}
            <div className="space-y-8 reveal-on-scroll">
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border border-indigo-200">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Sécurité & Fiabilité
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                {(t as any).cloudTitle}
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                {(t as any).cloudDesc}
              </p>
              
              <ul className="space-y-5 mt-8">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{(t as any).cloudPoint1.split(':')[0]}</h3>
                    <p className="text-sm text-slate-500">{(t as any).cloudPoint1.split(':')[1]}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{(t as any).cloudPoint2.split(':')[0]}</h3>
                    <p className="text-sm text-slate-500">{(t as any).cloudPoint2.split(':')[1]}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{(t as any).cloudPoint3.split(':')[0]}</h3>
                    <p className="text-sm text-slate-500">{(t as any).cloudPoint3.split(':')[1]}</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Double Mockup (Droite) - Well framed using tablet frame instead of smartphone */}
            <div className="relative flex justify-center items-center reveal-on-scroll delay-200">
              <div className="absolute w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
              
              {/* Main Desktop Cloud Mockup with reduced borders */}
              <div className="w-full max-w-md border border-slate-200 bg-slate-950 p-2 rounded-xl shadow-2xl overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                <div className="w-full bg-slate-900 text-slate-400 rounded-t-lg p-2 px-3 text-left font-mono text-[9px] flex items-center justify-between border-b border-slate-800 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[8px] text-slate-500 ml-2">dghubschool.com/cloud-dashboard</span>
                  </div>
                </div>
                <div className="w-full aspect-[16/10] bg-slate-900 rounded-b-lg overflow-hidden relative">
                  <img src="/DASH10.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cloud Dashboard" />
                </div>
              </div>

              {/* Overlapping tablet mockup (aspect-4/3) instead of smartphone to keep desktop dashboard screenshot well framed */}
              <div className="absolute -bottom-10 -right-4 w-44 border-4 border-slate-950 bg-slate-950 p-1.5 rounded-xl shadow-2xl z-20 hover:-translate-y-2 transition-all duration-300">
                <div className="w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden relative">
                  <img src="/DASH13.png" className="w-full h-full object-cover" alt="Tablet sync preview" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION EXPÉRIENCE PARENTS CÔTE-À-CÔTE AVEC SCROLL ANIMATION ─────────────────────── */}
      <section className="bg-white py-24 relative overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto reveal-on-scroll">
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">
              {(t as any).parentsFocusTitle}
            </h2>
            <p className="text-slate-500 text-sm md:text-base">
              {(t as any).parentsFocusDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Visual Phone Mockup (Gauche) - Reduced borders */}
            <div className="lg:col-span-5 flex justify-center relative reveal-on-scroll">
              <div className="absolute w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
              
              <div className="w-64 border-4 border-slate-950 bg-slate-950 p-2 rounded-2xl shadow-2xl relative z-10 transform lg:-rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <div className="w-full aspect-[9/16] bg-slate-55 rounded-xl overflow-hidden relative p-4 flex flex-col justify-between border border-slate-900">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <Users className="w-3 h-3 text-amber-600" />
                      </div>
                      <span className="text-[9px] font-black text-slate-800">Portail Parents</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Live</span>
                  </div>
                  
                  {/* Mock parent screen content - well framed with object-contain card */}
                  <div className="flex-grow flex flex-col justify-center items-center py-4 space-y-4">
                    <img src="/student_card_preview.png" className="w-full max-h-32 object-contain rounded-lg shadow-sm border border-slate-100 bg-white" alt="Student Card Preview" />
                    
                    {/* Simulated push notification card */}
                    <div className="w-full bg-slate-900 text-white p-3 rounded-lg text-[9px] shadow-md border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center opacity-70">
                        <span className="font-bold flex items-center gap-1"><Bell className="w-2.5 h-2.5 text-amber-500" /> Notification</span>
                        <span>{lang === 'fr' ? 'À l\'instant' : 'Just now'}</span>
                      </div>
                      <p className="font-medium text-slate-200 leading-snug">
                        {lang === 'fr' ? 'Koffi Yao est entré en classe. Scan à 07:42.' : 'Koffi Yao arrived at school. Scanned at 07:42.'}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 text-center py-2 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    {lang === 'fr' ? 'Accès Parent Sécurisé' : 'Secure Parent Access'}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Accordion Cards (Droite) - Reduced borders */}
            <div className="lg:col-span-7 space-y-6 reveal-on-scroll delay-200">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex gap-5 items-start hover:-translate-y-1 hover:border-amber-500/20 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{(t as any).parentsFocus1}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{(t as any).parentsFocus1Desc}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex gap-5 items-start hover:-translate-y-1 hover:border-amber-500/20 transition-all duration-300">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{(t as any).parentsFocus2}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{(t as any).parentsFocus2Desc}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex gap-5 items-start hover:-translate-y-1 hover:border-amber-500/20 transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{(t as any).parentsFocus3}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{(t as any).parentsFocus3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION APERÇUS RÉELS ALTERNÉS (SCREENSHOTS) AVEC SCROLL ANIMATION ────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-28">
        {/* Stickers décoratifs Screenshots */}
        <StickerCurvedArrow className="absolute top-12 right-[20%] hidden md:block" style={{ transform: 'rotate(-15deg)' }} />
        <StickerWave className="absolute bottom-16 left-8 hidden lg:block" />

        <div className="text-center mb-16 space-y-4 reveal-on-scroll">
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

        {/* Ligne 1: Cartes Scolaires (Texte Gauche, Image Droite avec Simulation Scan Laser) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center reveal-on-scroll">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block">
              Sécurité & QR Code
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight">{t.securityTitle}</h3>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
              {t.securityDesc}
            </p>
          </div>
          
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="absolute w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
            
            {/* Conteneur Scanner with reduced borders */}
            <div className="w-full max-w-lg bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl relative overflow-hidden group">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                <img src="/student_card_preview.png" alt="Cartes scolaires officielles avec QR Code" className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                
                {/* Laser de Scan Interactif en CSS */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#f59e0b] opacity-80 animate-scan pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Ligne 2: Bulletins (Image Gauche, Texte Droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center reveal-on-scroll">
          {/* Image Gauche */}
          <div className="lg:col-span-7 flex justify-center lg:order-1 order-2 relative">
            <div className="absolute w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
            
            {/* Document preview style with reduced borders */}
            <div className="w-full max-w-lg bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
              <div className="w-full bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 flex items-center justify-center relative">
                <img src="/report_card_preview.png" alt="Bulletins de notes officiels" className="w-full h-full object-contain max-h-[380px] group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>

          {/* Texte Droite */}
          <div className="lg:col-span-5 space-y-6 lg:order-2 order-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block">
              Académie & Bulletins
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight">{t.academicsTitle}</h3>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
              {t.academicsDesc}
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION FEATURES (BENTO GRID) AVEC SCROLL ANIMATION ────────────────── */}
      <section id="features" className="bg-slate-50 border-y border-slate-200 py-20 relative">
        {/* Stickers décoratifs Bento */}
        <StickerStar className="absolute top-12 right-12 hidden md:block" style={{ transform: 'rotate(15deg) scale(0.8)', opacity: 0.5 }} />
        <StickerCheck className="absolute bottom-16 left-8 hidden lg:block" style={{ transform: 'rotate(-8deg)' }} />
        <StickerNote className="absolute top-20 left-6 hidden xl:block" style={{ transform: 'rotate(-3deg)' }}>
          {lang === 'fr' ? '100% sans Excel !' : '100% Excel-free!'}
        </StickerNote>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* En-tête Section */}
          <div className="text-center mb-16 space-y-4 reveal-on-scroll">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.features}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              {t.bentoTitle}
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              {t.bentoDesc}
            </p>
          </div>

          {/* Bento Grid with staggered scroll reveals & reduced borders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className={`border p-6 md:p-8 rounded-xl shadow-sm flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-amber-500/40 relative overflow-hidden group reveal-on-scroll delay-${(idx + 1) * 100} ${feat.className}`}
              >
                {/* Lueur de survol subtile interne */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-block group-hover:scale-110 transition-transform duration-300">
                      {feat.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-3 group-hover:text-amber-500 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs md:text-sm opacity-80 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION STATS / PRUVE SOCIALE AVEC SCROLL ANIMATION ─────────────────── */}
      <section id="stats" className="bg-white py-20 relative">
        {/* Stickers décoratifs Stats */}
        <StickerCircle className="absolute top-8 left-[10%] hidden md:block" />
        <StickerSparkle className="absolute bottom-12 right-[15%] hidden lg:block" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          {/* Chiffres clés with scroll reveal & reduced borders */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-5xl mx-auto reveal-on-scroll">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:shadow-md transition duration-300">
                <span className="block text-3xl md:text-5xl font-black text-amber-600 mb-2 select-none tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] md:text-xs font-black text-slate-555 uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Témoignages Dynamiques with scroll reveal & reduced borders */}
          {testimonials.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-12 reveal-on-scroll delay-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.map((tItem) => (
                  <div key={tItem.id} className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-left relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-5xl text-amber-500 font-serif leading-none absolute top-4 left-6 opacity-20">“</div>
                    <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed italic relative z-10 pt-4 mb-6">
                      "{tItem.content}"
                    </p>
                    <div className="space-y-1 relative z-10">
                      <p className="text-sm font-black tracking-tight text-slate-900">{tItem.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-550">
                        {tItem.role} {tItem.school_name ? `— ${tItem.school_name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton Partager mon histoire */}
          <div className="mt-12 reveal-on-scroll delay-300">
            <button
              onClick={() => navigate(`/${lang}/partager-mon-histoire`)}
              className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <Star className="w-4 h-4 text-amber-500" />
              Partager mon histoire
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION PRICING AVEC SCROLL ANIMATION ────────────────────────────────── */}
      <section id="pricing" className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-4 reveal-on-scroll">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.pricingTitle}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              {t.pricingSubtitle}
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              {t.pricingDesc}
            </p>
          </div>

          {/* Card Pricing Premium with reduced borders & scroll reveal */}
          <div className="relative max-w-sm mx-auto group reveal-on-scroll delay-200">
            {/* Lueur d'ambiance */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-white border-2 border-slate-200/80 p-8 rounded-xl shadow-xl hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
              {/* Populaire badge */}
              <div className="absolute top-6 right-[-36px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-12 text-center select-none shadow-sm">
                {t.freeTrialBadge}
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">{t.singleFormula}</h3>
                <span className="text-4xl font-black tracking-tight text-slate-950">{t.daysTrial}</span>
                <p className="text-xs text-slate-500 mt-2">{t.afterTrial}</p>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span>{lang === 'fr' ? 'Gestion de la caisse et reçus SMS' : 'Cash management and SMS receipts'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span>{lang === 'fr' ? 'Bulletins et notes illimités' : 'Unlimited grade books and reports'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span>{lang === 'fr' ? 'Accès complet parents, élèves et profs' : 'Full access for parents, students, and teachers'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span>{lang === 'fr' ? 'Support dédié via WhatsApp' : 'Dedicated support via WhatsApp'}</span>
                </li>
              </ul>

              <button 
                onClick={() => navigate(`/${lang}/creer-compte`)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {t.trialBtn}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION NEWSROOM (ACTUALITÉS & AVANCÉES) AVEC SCROLL ANIMATION ── */}
      <section id="newsroom" className="bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/60 dark:border-slate-900 py-20 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16 space-y-4 reveal-on-scroll">
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

          <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto reveal-on-scroll delay-200">
            {/* News 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full inline-block">
                  {t.newsroomBadge}
                </span>
                <h3 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase leading-snug group-hover:text-amber-500 transition-colors">
                  {t.newsroomCardTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t.newsroomCardDesc}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
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

      {/* ── SECTION FINAL CTA BENTO-STYLE PREMIUM AVEC SCROLL ANIMATION ────────────────────────────── */}
      <section className="bg-white py-20 text-center relative overflow-hidden">
        {/* Stickers CTA */}
        <StickerHeart className="absolute top-12 left-[12%] hidden md:block" style={{ transform: 'rotate(-10deg)', opacity: 0.5 }} />
        <StickerBang className="absolute bottom-12 right-[12%] hidden md:block animate-bounce" style={{ animationDuration: '3s' }} />

        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-slate-950 text-white rounded-xl p-12 md:p-20 relative overflow-hidden shadow-2xl border border-slate-900 group reveal-on-scroll">
            {/* Lueur de fond animée */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-amber-500/15 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight animate-pulse" style={{ animationDuration: '4s' }}>
                {t.readyTitle}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
                {t.readyDesc}
              </p>
              <button 
                onClick={() => navigate(`/${lang}/creer-compte`)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5.5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-3 cursor-pointer group/btn"
              >
                {t.createSchoolBtn}
                <ArrowRight className="w-4.5 h-4.5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
