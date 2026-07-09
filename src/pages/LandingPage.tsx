// ============================================================
// LANDING PAGE — Immersive Parallax + GSAP ScrollTrigger
// Réécriture complète avec animations cinématiques
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  Bell,
  ArrowUpRight,
  Phone,
  Activity,
  Mail,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { BACKEND_URL } from '../config';
import { MorphBlob } from '../components/MorphBlob';
import { AnimatedCounter } from '../components/AnimatedCounter';

gsap.registerPlugin(ScrollTrigger);

// ── Texts (FR / EN) — copywriting conservé ──────────────────
const TEXTS = {
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
    studentsLabel: "Élèves suivis",
    documentsLabel: "Documents générés",
    networkLabel: "Disponibilité",
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
    parentsFocus3Desc: "Accès instantané aux reçus de paiement numérisés dès leur enregistrement par l'école.",
    recommended: 'Recommandé par +15 directeurs',
    liveBadge: 'Activité Live',
    liveSub: 'Reçus SMS envoyés 24h/24',
    secBadge: 'Sécurité & QR Code',
    acadBadge: 'Académie & Bulletins',
    scrollExplore: 'Défilez pour explorer',
    shareStory: 'Partager mon histoire',
    cashMgmt: 'Gestion de la caisse et reçus SMS',
    unlimitedBulletins: 'Bulletins et notes illimités',
    fullAccess: 'Accès complet parents, élèves et profs',
    whatsappSupport: 'Support dédié via WhatsApp',
    parentNotif: 'Koffi Yao est entré en classe. Scan à 07:42.',
    parentAccess: 'Accès Parent Sécurisé',
    notifLabel: 'Notification',
    justNow: "À l'instant",
    securityLabel: 'Sécurité & Fiabilité',
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
    studentsLabel: "Students tracked",
    documentsLabel: "Documents generated",
    networkLabel: "Uptime",
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
    parentsFocus3Desc: "Instant access to digitized payment receipts as soon as they are recorded by the school.",
    recommended: 'Recommended by +15 principals',
    liveBadge: 'Live Activity',
    liveSub: 'SMS receipts sent 24/7',
    scrollExplore: 'Scroll to explore',
    shareStory: 'Share my story',
    cashMgmt: 'Cash management and SMS receipts',
    unlimitedBulletins: 'Unlimited grade books and reports',
    fullAccess: 'Full access for parents, students, and teachers',
    whatsappSupport: 'Dedicated support via WhatsApp',
    parentNotif: 'Koffi Yao arrived at school. Scanned at 07:42.',
    parentAccess: 'Secure Parent Access',
    notifLabel: 'Notification',
    justNow: 'Just now',
    secBadge: 'Security & QR Code',
    acadBadge: 'Academy & Report Cards',
    securityLabel: 'Security & Reliability',
  },
} as const;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dbStats, setDbStats] = useState({ schools: 0, students: 0, documents: 0 });
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Interactive Simulator State
  const [simulatorState, setSimulatorState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [showSimNotif, setShowSimNotif] = useState(false);
  const [activeSimStudent, setActiveSimStudent] = useState({
    name: "Koffi Yao",
    class: "CM2 B",
    time: "07:42",
    avatar: "KY"
  });

  const handleSimulateScan = () => {
    if (simulatorState !== 'idle') return;
    setSimulatorState('scanning');
    setShowSimNotif(false);

    setTimeout(() => {
      setSimulatorState('success');
      setTimeout(() => {
        setShowSimNotif(true);
      }, 800);
    }, 1500);
  };

  const handleResetSimulator = () => {
    setSimulatorState('idle');
    setShowSimNotif(false);
  };

  // Refs for GSAP animations
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const heroProofRef = useRef<HTMLDivElement>(null);
  const heroFloatPhoneRef = useRef<HTMLDivElement>(null);
  const cloudTextRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const pricingTitleRef = useRef<HTMLDivElement>(null);
  const pricingCardRef = useRef<HTMLDivElement>(null);
  const newsroomRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const parentsTitleRef = useRef<HTMLDivElement>(null);
  const parentsPhoneRef = useRef<HTMLDivElement>(null);
  const parentsCardsRef = useRef<HTMLDivElement>(null);
  const screenshotsTitleRef = useRef<HTMLDivElement>(null);
  const scan1TextRef = useRef<HTMLDivElement>(null);
  const scan1ImgRef = useRef<HTMLDivElement>(null);
  const scan2TextRef = useRef<HTMLDivElement>(null);
  const scan2ImgRef = useRef<HTMLDivElement>(null);
  const bentoTitleRef = useRef<HTMLDivElement>(null);

  const t = TEXTS[lang as keyof typeof TEXTS] ?? TEXTS.fr;

  // ── Data fetching ──
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/public/stats`)
      .then(r => r.json())
      .then(d => { if (d && !d.error) setDbStats({ schools: d.schools || 0, students: d.students || 0, documents: d.documents || 0 }); })
      .catch(() => {});
    fetch(`${BACKEND_URL}/api/testimonials`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTestimonials(d); })
      .catch(() => {});
  }, []);

  // ── GSAP Master Timeline ──
  useEffect(() => {
    const isMobileOrLowEnd = typeof window !== 'undefined' && (
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    if (isMobileOrLowEnd) return;

    const ctx = gsap.context(() => {
      // HERO entrance animation
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from(heroTitleRef.current, { opacity: 0, y: 55, duration: 0.8 }, 0.1)
        .from(heroSubRef.current, { opacity: 0, y: 35, duration: 0.8 }, 0.3)
        .from(heroCTARef.current, { opacity: 0, y: 20, duration: 0.8 }, 0.5)
        .from(heroProofRef.current, { opacity: 0, y: 15, duration: 0.8 }, 0.6)
        .from(heroFloatPhoneRef.current, { opacity: 0, x: 30, duration: 0.8 }, 0.4);

      // HERO Parallax
      if (heroRef.current && heroFloatPhoneRef.current) {
        gsap.to(heroFloatPhoneRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
        });
      }
    });

    return () => {
      ctx.revert();
    };
  }, []);

  const stats = [
    { value: `+${dbStats.schools.toLocaleString('fr-FR')}`, label: t.partnersLabel },
    { value: `+${dbStats.students.toLocaleString('fr-FR')}`, label: t.studentsLabel },
    { value: `+${dbStats.documents.toLocaleString('fr-FR')}`, label: t.documentsLabel },
    { value: "99.9%", label: t.networkLabel },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans','Poppins',sans-serif] relative overflow-hidden flex flex-col antialiased">
      <style>{`
        @keyframes scan { 0% { transform: translateY(0%); } 50% { transform: translateY(220px); } 100% { transform: translateY(0%); } }
        .animate-scan { animation: scan 3s linear infinite; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 22s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="w-full px-4 md:px-12">
          <nav className="w-full flex items-center justify-between p-3.5 px-2">
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
              <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
              <span>DGhub<span className="text-slate-900">School</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider text-slate-500 uppercase">
              {[
                { label: t.features, path: `/${lang}/features` },
                { label: t.pricing, path: `/${lang}/pricing` },
                { label: t.about, path: `/${lang}/a-propos` },
              ].map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)} className="hover:text-amber-500 transition-colors cursor-pointer relative py-1 group/item font-jakarta">
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
                </button>
              ))}
              <a href="#stats" className="hover:text-amber-500 transition-colors relative py-1 group/item font-jakarta">
                {t.socialProof}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button onClick={() => navigate(`/${lang}/app`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer font-jakarta">{t.accessPortals}</button>
              ) : (
                <>
                  <button onClick={() => navigate(`/${lang}/login`)} className="text-xs font-black tracking-widest text-slate-600 hover:text-amber-500 transition-colors px-4 py-2 font-jakarta">{t.login}</button>
                  <button onClick={() => navigate(`/${lang}/creer-compte`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer font-jakarta">{t.createSchool}</button>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-amber-500 transition-colors" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white pb-5 pt-4 space-y-4 flex flex-col px-2">
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/features`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.features}</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/pricing`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.pricing}</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/a-propos`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.about}</button>
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/app`); }} className="w-full text-center py-3 text-sm font-black bg-amber-500 text-slate-950 rounded-xl border border-amber-600 shadow-md">{t.accessPortals}</button>
                ) : (
                  <>
                    <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/login`); }} className="w-full text-center py-3 text-sm font-black text-slate-700 border border-slate-200 rounded-xl">{t.login}</button>
                    <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/creer-compte`); }} className="w-full text-center py-3 text-sm font-black bg-amber-500 text-slate-950 rounded-xl border border-amber-600 shadow-md">{t.createSchool}</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── SCROLLING IMAGE BANNER ── */}
      <div className="w-full overflow-hidden bg-white border-b border-slate-200/80 relative" style={{ height: '200px' }}>
        {/* Gradient overlays left/right for seamless fade */}
        <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' }} />
        <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' }} />
        {/* Marquee track — duplicated to create infinite loop */}
        <div className="animate-marquee flex items-center gap-4 h-full" style={{ width: 'max-content' }}>
          {/* First set */}
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          {/* Duplicate set for seamless loop */}
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/KIDS.webp" alt="Kids at school" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
          <img src="/kids1.webp" alt="Kids at school 2" className="h-full w-auto object-cover rounded-xl shadow-md shrink-0" style={{ maxHeight: '180px' }} />
        </div>
      </div>

      <main className="flex-grow flex flex-col">

        {/* ── HERO SECTION ── */}
        <section ref={heroRef} className="relative z-10 w-full overflow-hidden pt-16 md:pt-24 pb-20 md:pb-28 flex-grow flex items-center justify-center bg-gradient-to-b from-white via-slate-50/50 to-white">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <div className="max-w-7xl mx-auto w-full px-4 md:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col justify-center">
                <h1 ref={heroTitleRef} className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.08] font-jakarta">
                  {t.heroTitlePart1}
                  <span className="relative text-amber-500 inline-block px-1">{t.heroTitleHighlight}</span>
                  {t.heroTitlePart2}
                </h1>
                <p ref={heroSubRef} className="text-sm md:text-base lg:text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">{t.heroSubtitle}</p>
                
                <div ref={heroCTARef} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  {isAuthenticated ? (
                    <button onClick={() => navigate(`/${lang}/app`)} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group font-jakarta">
                      {t.accessPortals} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => navigate(`/${lang}/creer-compte`)} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/15 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group font-jakarta">
                        {t.createSchoolFree} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button onClick={() => navigate(`/${lang}/login`)} className="w-full sm:w-auto bg-white/90 backdrop-blur hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider px-8 py-4.5 rounded-xl border border-slate-200 active:scale-95 transition-all cursor-pointer font-jakarta">{t.accessPortals}</button>
                    </>
                  )}
                </div>

                <div ref={heroProofRef} className="flex items-center gap-4 justify-center lg:justify-start pt-8 border-t border-slate-200/60">
                  <div className="flex -space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">CI</div>
                    <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-950">SN</div>
                    <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">BF</div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center text-amber-500 gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}</div>
                    <p className="text-[10px] font-black text-slate-800 tracking-wide uppercase font-jakarta">{t.recommended}</p>
                  </div>
                </div>
              </div>

              <div ref={heroFloatPhoneRef} className="lg:col-span-5 relative flex items-center justify-center mt-12 lg:mt-0 select-none px-4">
                <div className="absolute w-72 h-72 md:w-[450px] md:h-[450px] bg-gradient-to-tr from-amber-500/10 to-indigo-500/5 rounded-full blur-3xl -z-10" />
                
                <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center">
                  <div className="absolute inset-0 bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-2 rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out">
                    <img src="/dashboard_preview.webp" className="w-full h-full object-cover rounded-xl" alt="Dashboard" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-32 sm:w-44 aspect-[9/16] bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-1.5 rotate-[5deg] hover:rotate-0 hover:scale-105 transition-all duration-500 ease-out z-10">
                    <img src="/student_card_preview.png" className="w-full h-full object-contain rounded-xl bg-white" alt="Student Card" />
                  </div>
                  <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur border border-slate-200/80 rounded-xl p-3 shadow-xl flex items-center gap-3 animate-bounce duration-1000 max-w-[210px] z-20">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-900 leading-none">SMS Envoyé</p>
                      <p className="text-[9px] text-slate-500 mt-1 font-medium leading-tight">Yao Koffi est arrivé à l'école.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <section className="bg-slate-950 py-10 overflow-hidden relative border-y border-slate-900">
          <div className="space-y-4">
            {[
              ['Numérisation', 'Code QR', 'Historique', 'Annonces SMS', 'Caisse', 'Export Excel'],
              ['Recouvrement', 'Bulletins PDF', 'Format DRE', 'Espace Parents', 'Absences', 'Retards', 'Messagerie'],
              ['Cloud Sécurisé', 'Zéro Perte', 'Performance Active', 'Tableaux de bord', 'Multi-Années'],
            ].map((row, rowIdx) => (
              <div key={rowIdx} className="flex overflow-hidden">
                <div className={`${rowIdx % 2 === 0 ? 'animate-marquee-left' : 'animate-marquee-right'} hover-pause flex gap-3 items-center`}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-center whitespace-nowrap">
                      {row.map((text) => (
                        <span key={text} className="text-xs font-semibold text-white border border-white/20 rounded-full px-5 py-2 hover:bg-white/5 transition-colors cursor-default">{text}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO GRID FEATURES ── */}
        <section className="bg-white py-24 relative overflow-hidden border-b border-slate-200/80">
          <MorphBlob color="rgba(245,158,11,0.03)" size={400} style={{ top: '10%', right: '5%' }} speed={11} />
          <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
            <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">
                ⚙️ {t.features}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight font-jakarta">
                {lang === 'fr' ? 'Un seul outil. Une puissance infinie.' : 'One tool. Infinite capability.'}
              </h2>
              <p className="text-slate-500 text-sm md:text-base font-medium">
                {lang === 'fr' 
                  ? 'Fini l\'éparpillement. DGhubSchool réunit tous les aspects critiques du pilotage de votre école.'
                  : 'No more switching between systems. DGhubSchool unites every critical aspect of your school management.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-amber-500/25 transition-all duration-300 group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">{t.paymentBadge}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-950 group-hover:text-amber-600 transition-colors font-jakarta mb-3">{t.paymentTracking}</h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium mb-6">{t.paymentDesc}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200/50">
                  {[
                    lang === 'fr' ? 'Enregistrement multi-modes (espèces, chèques, virements)' : 'Multi-mode recording (cash, checks, transfers)',
                    lang === 'fr' ? 'Recalcul instantané du solde et journal de caisse' : 'Instant balance recalculation & cash journal',
                    lang === 'fr' ? 'Envoi automatisé de reçus PDF + SMS aux parents' : 'Automated PDF + SMS receipt sent to parents',
                    lang === 'fr' ? 'Export comptable Excel en un clic' : 'One-click Excel accounting export',
                  ].map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-emerald-500/25 transition-all duration-300 group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">{t.bulletinsBadge}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 group-hover:text-emerald-600 transition-colors font-jakarta mb-3">{t.bulletinsTitle}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium mb-6">{t.bulletinsDesc}</p>
                </div>
                <div className="pt-6 border-t border-slate-200/50 space-y-3">
                  {[
                    lang === 'fr' ? 'Saisie intuitive des notes' : 'Intuitive grade entry',
                    lang === 'fr' ? 'Calcul automatique des moyennes' : 'Automated calculations',
                    lang === 'fr' ? 'Bulletins PDF officiels DRE' : 'Official DRE PDF report cards',
                  ].map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-600 leading-snug">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-blue-500/25 transition-all duration-300 group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">{t.parentsBadge}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 group-hover:text-blue-600 transition-colors font-jakarta mb-3">{t.parentsTitle}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium mb-6">{t.parentsDesc}</p>
                </div>
                <div className="pt-6 border-t border-slate-200/50 space-y-3">
                  {[
                    lang === 'fr' ? 'Portail en ligne accessible h24' : '24/7 accessible portal',
                    lang === 'fr' ? 'Alertes absences & retards live' : 'Live absence & late alerts',
                    lang === 'fr' ? 'Suivi transparent des paiements' : 'Transparent payment tracking',
                  ].map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-600 leading-snug">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-violet-500/25 transition-all duration-300 group cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shadow-sm">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">{t.qrCardsBadge}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-950 group-hover:text-violet-600 transition-colors font-jakarta mb-3">{t.qrCardsTitle}</h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium mb-6">{t.qrCardsDesc}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200/50">
                  {[
                    lang === 'fr' ? 'Cartes d\'identité scolaires à code QR' : 'QR-enabled school ID cards',
                    lang === 'fr' ? 'Scan rapide en moins de 2 secondes' : 'Fast scanning under 2 seconds',
                    lang === 'fr' ? 'Notification SMS automatique immédiate' : 'Immediate automated SMS notification',
                    lang === 'fr' ? 'Historique d\'assiduité complet sécurisé' : 'Full secure attendance logbook',
                  ].map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              <button onClick={() => navigate(`/${lang}/features`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-amber-600 shadow-lg shadow-amber-500/10 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer font-jakarta">
                <span>{lang === 'fr' ? 'Découvrir toutes les fonctionnalités' : 'Discover all features'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── NEW INTERACTIVE QR SCAN SIMULATOR ── */}
        <section className="bg-slate-50 py-24 border-b border-slate-200 relative overflow-hidden">
          <div className="absolute -right-20 top-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 md:px-12 relative z-10">
            <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-750 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">
                ✨ {lang === 'fr' ? 'Expérience interactive' : 'Interactive Demo'}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-950 uppercase tracking-tight font-jakarta">
                {lang === 'fr' ? 'Vivez le scan en direct' : 'Experience the scan live'}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                {lang === 'fr' 
                  ? 'Cliquez pour simuler le scan de la carte d\'un élève et observez le SMS partir instantanément.'
                  : 'Click to simulate a student scanning in and watch the SMS alert send instantly.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-4xl mx-auto">
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-white border border-slate-200 p-8 rounded-2xl shadow-md relative overflow-hidden min-h-[320px]">
                {simulatorState === 'scanning' && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#F59E0B] opacity-80 animate-scan pointer-events-none z-20" />
                )}
                <div className={`w-64 aspect-[1.586/1] bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl p-4 shadow-xl border border-slate-800 flex flex-col justify-between transition-all duration-300 relative ${simulatorState === 'scanning' ? 'scale-[1.02] border-amber-500/45' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">DGhubSchool</h4>
                      <p className="text-[8px] text-slate-400 mt-0.5">Carte Scolaire Officielle</p>
                    </div>
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-amber-500">
                      {activeSimStudent.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{activeSimStudent.name}</p>
                      <p className="text-[9px] text-slate-400">{activeSimStudent.class}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-800/80 pt-2">
                    <span>ID: DG-2026-948</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Actif</span>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  {simulatorState === 'idle' ? (
                    <button onClick={handleSimulateScan} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer font-jakarta">
                      Simuler le scan
                    </button>
                  ) : (
                    <button onClick={handleResetSimulator} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl border border-slate-200 active:scale-95 transition-all cursor-pointer font-jakarta">
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center">
                <div className="w-64 aspect-[9/18.5] bg-slate-900 border-4 border-slate-800 rounded-[32px] p-2.5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mr-2" />
                    <span className="w-8 h-1 bg-slate-950 rounded-full" />
                  </div>
                  <div className="w-full h-full bg-slate-950 rounded-[22px] overflow-hidden relative flex flex-col p-4 pt-6 justify-between select-none">
                    <div className="text-center text-white mt-4">
                      <h5 className="text-2xl font-light tracking-tight">07:43</h5>
                      <p className="text-[9px] text-slate-400 font-medium">Mardi 30 Juin</p>
                    </div>
                    <div className="flex-grow flex items-center justify-center px-1">
                      {showSimNotif ? (
                        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3 border.5 border-slate-200/50 shadow-2xl animate-fade-in-up duration-300 text-left">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-amber-500 flex items-center justify-center text-[7px] text-slate-950 font-black">DG</span>
                              <span className="text-[9px] font-bold text-slate-800">DGhubSchool</span>
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold">{t.justNow}</span>
                          </div>
                          <h6 className="text-[10px] font-black text-slate-950">
                            {lang === 'fr' ? 'Présence Signalée' : 'Attendance Logged'}
                          </h6>
                          <p className="text-[9px] text-slate-600 mt-1 font-medium leading-relaxed">
                            {lang === 'fr'
                              ? `${activeSimStudent.name} est entré en classe. Scan à ${activeSimStudent.time}.`
                              : `${activeSimStudent.name} arrived at school. Scanned at ${activeSimStudent.time}.`}
                          </p>
                        </div>
                      ) : (
                        <div className="text-slate-600 text-[10px] text-center italic font-medium">
                          {simulatorState === 'scanning' ? 'Scan en cours...' : 'En attente du scan...'}
                        </div>
                      )}
                    </div>
                    <div className="text-center text-[9px] text-slate-500 font-medium pb-2 border-t border-slate-800/40 pt-2">
                      🔒 {lang === 'fr' ? 'Accès Parent Sécurisé' : 'Secure Parent Access'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE US & CLOUD RISKS ── */}
        <section id="stats" className="bg-white py-24 relative overflow-hidden border-b border-slate-200/80">
          <MorphBlob color="rgba(99,102,241,0.05)" size={450} style={{ top: '20%', right: '-5%' }} speed={14} />
          <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-6">
                <div ref={statsSectionRef} className="grid grid-cols-2 gap-6 md:gap-8 max-w-lg mx-auto">
                  {stats.map((stat, index) => (
                    <div key={index} className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <AnimatedCounter value={stat.value} className="block text-3xl md:text-5xl font-black text-amber-600 mb-2 select-none tracking-tight font-jakarta" />
                      <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest leading-normal block font-jakarta">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div ref={cloudTextRef} className="lg:col-span-6 space-y-8">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border border-indigo-200 font-jakarta">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />{t.securityLabel}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight leading-tight font-jakarta">
                    {t.cloudTitle}
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                    {t.cloudDesc}
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    { title: t.cloudPoint1.split(':')[0], desc: t.cloudPoint1.split(':')[1], color: 'emerald' },
                    { title: t.cloudPoint2.split(':')[0], desc: t.cloudPoint2.split(':')[1], color: 'amber' },
                    { title: t.cloudPoint3.split(':')[0], desc: t.cloudPoint3.split(':')[1], color: 'blue' },
                  ].map((point, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 flex gap-4 items-start hover:-translate-y-0.5 hover:border-indigo-500/20 transition-all duration-300 shadow-sm">
                      <div className={`w-10 h-10 rounded-lg bg-${point.color}-500/10 text-${point.color}-600 flex items-center justify-center shrink-0 shadow-sm font-black`}>
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm font-jakarta">{point.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{point.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT US & IMAGES ── */}
        <section className="bg-white py-24 relative overflow-hidden border-b border-slate-200/80">
          <MorphBlob color="rgba(99,102,241,0.03)" size={400} style={{ bottom: '10%', left: '-5%' }} speed={12} />
          <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-6 flex justify-center relative select-none px-4">
                <div className="relative w-full max-w-lg aspect-[4/3.5] flex items-center justify-center">
                  <div className="absolute top-0 left-4 w-[48%] aspect-[4/3] rounded-2xl shadow-xl overflow-hidden rotate-[-6deg] border-2 border-white bg-slate-50 hover:rotate-0 transition-transform duration-500 z-10">
                    <img className="w-full h-full object-cover p-2 bg-white" src="/report_card_preview.webp" alt="Report Card Collage" />
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="absolute top-8 right-4 w-[52%] aspect-[3/4] rounded-2xl shadow-xl overflow-hidden rotate-[4deg] border-2 border-white bg-slate-50 hover:rotate-0 transition-transform duration-500 z-20">
                    <img className="w-full h-full object-contain p-2 bg-white" src="/student_card_preview.png" alt="Student Card Collage" />
                  </div>

                  <div className="absolute bottom-4 left-4 w-[75%] aspect-[16/10] rounded-2xl shadow-2xl overflow-hidden rotate-[-2deg] border-2 border-white bg-slate-50 hover:rotate-0 transition-transform duration-500 z-30">
                    <img className="w-full h-full object-cover rounded-xl" src="/dashboard_preview.webp" alt="Dashboard Collage" />
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 rounded-2xl p-4 shadow-2xl flex items-center gap-3 border-2 border-white hover:scale-105 transition-transform duration-300">
                      <div className="w-8 h-8 rounded-lg bg-slate-950/10 flex items-center justify-center shrink-0">
                        <Users className="w-4.5 h-4.5 text-slate-950" />
                      </div>
                      <div className="text-left">
                        <h6 className="text-xs font-black leading-none font-jakarta">+15 Écoles</h6>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-800 block mt-1">Partenaires Actives</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-8">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">
                    💡 {lang === 'fr' ? 'À propos de nous' : 'About us'}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight leading-tight font-jakarta">
                    {lang === 'fr' ? 'Une plateforme légère conçue pour le terrain' : 'A lightweight platform built for the field'}
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                    {lang === 'fr'
                      ? 'DGhubSchool est conçu sur mesure pour s\'adapt parfaitement aux réalités des établissements en Afrique de l\'Ouest. Une plateforme cloud-native légère, sécurisée et optimisée pour s\'exécuter sans accroc même sur des connexions mobiles 2G.'
                      : 'DGhubSchool is custom-built to match the realities of West African schools. A lightweight, secure, and cloud-native platform optimized to run seamlessly even on 2G mobile connections.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: BookOpen, title: lang === 'fr' ? 'Outils de qualité' : 'Quality tools', desc: lang === 'fr' ? 'Bulletins conformes DRE et calculs instantanés.' : 'DRE-compliant reports and instant averages.' },
                    { icon: Phone, title: lang === 'fr' ? 'Support WhatsApp dédié' : 'Dedicated WhatsApp support', desc: lang === 'fr' ? 'Une équipe d\'assistance réactive disponible 24h/24.' : 'A responsive support team available 24/7.' },
                    { icon: Shield, title: lang === 'fr' ? 'Zéro perte de données' : 'Zero data loss', desc: lang === 'fr' ? 'Sauvegardes cloud automatisées quotidiennes.' : 'Daily automated secure cloud backups.' },
                    { icon: Activity, title: lang === 'fr' ? 'Interface intuitive' : 'Intuitive interface', desc: lang === 'fr' ? 'Prise en main en 2 secondes, sans formation technique.' : 'Get started in 2 seconds, no technical training needed.' },
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm font-jakarta">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button onClick={() => navigate(`/${lang}/a-propos`)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl shadow-md active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer font-jakarta">
                    <span>{lang === 'fr' ? 'En savoir plus sur nous' : 'Learn more about us'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── PARENTS PORTAL FOCUS ── */}
        <section className="bg-white py-24 relative overflow-hidden border-b border-slate-200/80">
          <MorphBlob color="rgba(245,158,11,0.05)" size={400} style={{ bottom: '5%', left: '0%' }} speed={10} />
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div ref={parentsTitleRef} className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight font-jakarta">{t.parentsFocusTitle}</h2>
              <p className="text-slate-500 text-sm md:text-base font-medium">{t.parentsFocusDesc}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div ref={parentsPhoneRef} className="lg:col-span-5 flex justify-center relative">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200/80 rotate-[-1deg] hover:rotate-0 transition-transform duration-500 ease-out">
                  <img src="/DASH4.png" className="w-full h-auto object-cover" alt="Espace Familial" loading="lazy" />
                </div>
              </div>
              <div ref={parentsCardsRef} className="lg:col-span-7 space-y-6">
                {[
                  { icon: BookOpen, color: 'blue', title: t.parentsFocus1, desc: t.parentsFocus1Desc },
                  { icon: Bell, color: 'amber', title: t.parentsFocus2, desc: t.parentsFocus2Desc, bounce: true },
                  { icon: CreditCard, color: 'emerald', title: t.parentsFocus3, desc: t.parentsFocus3Desc },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex gap-5 items-start hover:-translate-y-1 hover:border-amber-500/20 transition-all duration-300">
                      <div className={`w-12 h-12 bg-${item.color}-100 text-${item.color}-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon className={`w-6 h-6 ${item.bounce ? 'animate-bounce' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 mb-2 font-jakarta">{item.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── SCREENSHOTS ── */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-28">
          <div ref={screenshotsTitleRef} className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">{t.screenshotsTitle}</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight font-jakarta">{t.discoverFeatures}</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium">{t.discoverDesc}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div ref={scan1TextRef} className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block font-jakarta">{t.secBadge}</span>
              <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight font-jakarta">{t.securityTitle}</h3>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">{t.securityDesc}</p>
            </div>
            <div ref={scan1ImgRef} className="lg:col-span-7 flex justify-center relative">
              <div className="w-full max-w-lg bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl relative overflow-hidden group">
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                  <img src="/student_card_preview.png" alt={t.securityTitle} className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out" loading="lazy" />
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#F59E0B] opacity-80 animate-scan pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div ref={scan2ImgRef} className="lg:col-span-7 flex justify-center lg:order-1 order-2 relative">
              <div className="w-full max-w-lg bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                <div className="w-full bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 flex items-center justify-center">
                  <img src="/report_card_preview.webp" alt={t.academicsTitle} className="w-full h-full object-contain max-h-[380px] group-hover:scale-105 transition-transform duration-500 ease-out" loading="lazy" />
                </div>
              </div>
            </div>
            <div ref={scan2TextRef} className="lg:col-span-5 space-y-6 lg:order-2 order-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block font-jakarta">{t.acadBadge}</span>
              <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight font-jakarta">{t.academicsTitle}</h3>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">{t.academicsDesc}</p>
            </div>
          </div>
        </section>

        {/* ── BENTO FEATURES REDIRECT ── */}
        <section id="features" className="bg-slate-50 border-y border-slate-200 py-16 relative overflow-hidden text-center">
          <MorphBlob color="rgba(245,158,11,0.03)" size={350} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} speed={8} />
          <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">
              ⚙️ {t.features}
            </span>
            <h3 ref={bentoTitleRef} className="text-2xl md:text-4xl font-black text-slate-950 tracking-tight uppercase max-w-2xl mx-auto leading-tight font-jakarta">
              {lang === 'fr' 
                ? "Tout ce dont votre école a besoin, dans un seul outil complet" 
                : "Everything your school needs, in one comprehensive tool"}
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm leading-relaxed font-medium">
              {lang === 'fr' 
                ? "De la gestion de la caisse aux bulletins scolaires, en passant par le portail parents et le contrôle d'accès QR code." 
                : "From cash management and grade reports to the parent portal and QR code access control."}
            </p>
            <div className="pt-4">
              <button onClick={() => navigate(`/${lang}/features`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-amber-600 shadow-lg shadow-amber-500/10 active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer font-jakarta">
                <span>{lang === 'fr' ? 'Découvrir toutes les fonctionnalités' : 'Discover all features'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        {testimonials.length > 0 && (
          <section id="testimonials" className="bg-white py-24 relative overflow-hidden border-t border-slate-100">
            <MorphBlob color="rgba(245,158,11,0.02)" size={350} style={{ bottom: '5%', right: '5%' }} speed={7} />
            <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
              <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">
                  💬 {lang === 'fr' ? 'Témoignages' : 'Testimonials'}
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight font-jakarta">
                  {lang === 'fr' ? 'Les directeurs en parlent' : 'What school leaders are saying'}
                </h2>
                <p className="text-slate-500 text-sm md:text-base font-medium">
                  {lang === 'fr' 
                    ? 'Découvrez les retours d\'expérience de ceux qui gèrent leur école au quotidien avec DGhubSchool.'
                    : 'Discover how school principals manage their daily administration with DGhubSchool.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {testimonials.map((tItem) => (
                  <div key={tItem.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-left relative shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="text-5xl text-amber-500 font-serif leading-none absolute top-4 left-6 opacity-20">"</div>
                    <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed italic relative z-10 pt-4 mb-6">"{tItem.content}"</p>
                    
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200/50 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-black text-amber-750 uppercase">
                        {tItem.name.substring(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black tracking-tight text-slate-900 font-jakarta">{tItem.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-jakarta">
                          {tItem.role} {tItem.school_name ? `— ${tItem.school_name}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button onClick={() => navigate(`/${lang}/partager-mon-histoire`)} className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 text-xs font-black uppercase tracking-wider px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95 font-jakarta">
                  <Star className="w-4 h-4 text-amber-500" />{t.shareStory}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── PRICING ── */}
        <section id="pricing" className="bg-slate-50 border-t border-slate-200 py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div ref={pricingTitleRef} className="text-center mb-16 space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 block mb-2 font-jakarta">{t.pricingTitle}</span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase font-jakarta">{t.pricingSubtitle}</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium">{t.pricingDesc}</p>
            </div>
            <div ref={pricingCardRef} className="relative max-w-sm mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border-2 border-slate-200/80 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute top-6 right-[-36px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-12 text-center select-none shadow-sm">{t.freeTrialBadge}</div>
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2 font-jakarta">{t.singleFormula}</h3>
                  <span className="text-4xl font-black tracking-tight text-slate-950 font-jakarta">{t.daysTrial}</span>
                  <p className="text-xs text-slate-500 mt-2 font-medium">{t.afterTrial}</p>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
                  {[t.cashMgmt, t.unlimitedBulletins, t.fullAccess, t.whatsappSupport].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-emerald-500" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(`/${lang}/creer-compte`)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-jakarta">
                  {t.trialBtn} <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEWSROOM ── */}
        <section id="newsroom" className="bg-slate-50 border-t border-slate-200/60 py-20 relative">
          <div ref={newsroomRef} className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/40 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full font-jakarta">{t.newsroomTitle}</span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase font-jakarta">{t.newsroomSub}</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium">{t.newsroomDesc}</p>
            </div>
            <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full inline-block font-jakarta">{t.newsroomBadge}</span>
                  <h3 className="text-base md:text-lg font-black text-slate-950 uppercase leading-snug group-hover:text-amber-500 transition-colors font-jakarta">{t.newsroomCardTitle}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{t.newsroomCardDesc}</p>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{t.newsroomDate}</span>
                  <span onClick={() => navigate(`/${lang}/newsroom`)} className="text-amber-500 flex items-center gap-1 cursor-pointer hover:underline font-jakarta">{t.viewAllNews} <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA SPLIT CARDS ── */}
        <section className="bg-white py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-12">
            <div ref={ctaRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Card */}
              <div className="relative overflow-hidden bg-slate-950 text-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-900 group flex flex-col justify-between min-h-[22rem] lg:h-96">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-amber-500/15 transition-colors duration-500" />
                <div className="space-y-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full inline-block font-jakarta">
                    🚀 {lang === 'fr' ? 'Lancement' : 'Get Started'}
                  </span>
                  <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-snug font-jakarta">
                    {lang === 'fr' 
                      ? 'Envie de moderniser votre établissement ?' 
                      : 'Want to modernize your institution?'}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium max-w-sm">
                    {lang === 'fr'
                      ? 'Rejoignez les directeurs d\'écoles qui ont abandonné les calculs manuels et les files d\'attente. Essai gratuit de 40 jours.'
                      : 'Join school leaders who have left manual calculations and cash lines behind. 40 days free trial.'}
                  </p>
                </div>
                <div className="pt-6 relative z-10 text-left">
                  <button onClick={() => navigate(`/${lang}/creer-compte`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/15 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer font-jakarta">
                    <span>{lang === 'fr' ? 'Lancer mon école gratuitement' : 'Launch my school for free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Card */}
              <div className="relative overflow-hidden bg-indigo-950 text-white rounded-2xl p-8 md:p-12 shadow-xl border border-indigo-900 group flex flex-col justify-between min-h-[22rem] lg:h-96">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />
                <div className="space-y-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full inline-block font-jakarta">
                    💬 {lang === 'fr' ? 'Support WhatsApp' : 'WhatsApp Support'}
                  </span>
                  <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-snug font-jakarta">
                    {lang === 'fr' 
                      ? 'Une question ou besoin d\'une démo ?' 
                      : 'Any questions or need a demo?'}
                  </h3>
                  <p className="text-xs md:text-sm text-indigo-200 leading-relaxed font-medium max-w-sm">
                    {lang === 'fr'
                      ? 'Notre équipe est à votre écoute pour une présentation sur mesure en direct ou pour vous guider lors de vos premiers pas.'
                      : 'Our team is here to give you a custom live presentation or guide you through your first steps.'}
                  </p>
                </div>
                <div className="pt-6 relative z-10 flex flex-col sm:flex-row gap-4 font-jakarta">
                  <a href="https://wa.me/22872473027" target="_blank" rel="noreferrer" className="bg-white hover:bg-slate-100 text-indigo-950 text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-slate-200 shadow-xl active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer justify-center font-jakarta">
                    <span>{lang === 'fr' ? 'Contacter support' : 'Contact Support'}</span>
                    <ArrowUpRight className="w-4 h-4 text-indigo-950" />
                  </a>
                  <a href="mailto:support@dghubschool.com" className="bg-indigo-900 hover:bg-indigo-850 text-white text-xs font-black uppercase tracking-wider px-8 py-4.5 rounded-xl border border-indigo-700 shadow-xl active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer justify-center font-jakarta">
                    <span>{lang === 'fr' ? 'Nous écrire par email' : 'Write to us by email'}</span>
                    <Mail className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};
