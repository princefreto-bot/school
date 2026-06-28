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

  // Refs for GSAP animations
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const heroProofRef = useRef<HTMLDivElement>(null);
  const heroMockupRef = useRef<HTMLDivElement>(null);
  const heroFloatPhoneRef = useRef<HTMLDivElement>(null);
  const heroLiveRef = useRef<HTMLDivElement>(null);
  const cloudTextRef = useRef<HTMLDivElement>(null);
  const cloudMockupRef = useRef<HTMLDivElement>(null);
  const parentsTitleRef = useRef<HTMLDivElement>(null);
  const parentsPhoneRef = useRef<HTMLDivElement>(null);
  const parentsCardsRef = useRef<HTMLDivElement>(null);
  const screenshotsTitleRef = useRef<HTMLDivElement>(null);
  const scan1TextRef = useRef<HTMLDivElement>(null);
  const scan1ImgRef = useRef<HTMLDivElement>(null);
  const scan2TextRef = useRef<HTMLDivElement>(null);
  const scan2ImgRef = useRef<HTMLDivElement>(null);
  const bentoTitleRef = useRef<HTMLDivElement>(null);
  const bentoGridRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const pricingTitleRef = useRef<HTMLDivElement>(null);
  const pricingCardRef = useRef<HTMLDivElement>(null);
  const newsroomRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

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
        .from(heroTitleRef.current, { opacity: 0, y: 60, duration: 1 }, 0.2)
        .from(heroSubRef.current, { opacity: 0, y: 40, duration: 0.9 }, 0.5)
        .from(heroCTARef.current, { opacity: 0, y: 30, duration: 0.8 }, 0.7)
        .from(heroProofRef.current, { opacity: 0, y: 20, duration: 0.7 }, 0.9)
        .from(heroMockupRef.current, { opacity: 0, scale: 0.92, y: 30, duration: 1.1 }, 0.4)
        .from(heroFloatPhoneRef.current, { opacity: 0, x: -30, y: 20, duration: 0.8 }, 1.0)
        .from(heroLiveRef.current, { opacity: 0, x: 20, scale: 0.9, duration: 0.6 }, 1.2);

      // HERO Parallax
      if (heroRef.current) {
        gsap.to(heroMockupRef.current, {
          y: -60,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1.5 },
        });
        gsap.to(heroFloatPhoneRef.current, {
          y: -30,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 2 },
        });
      }

      // CLOUD section
      if (cloudTextRef.current) {
        gsap.from(cloudTextRef.current, {
          opacity: 0, x: -60, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: cloudTextRef.current, start: 'top 95%' },
        });
      }
      if (cloudMockupRef.current) {
        gsap.from(cloudMockupRef.current, {
          opacity: 0, x: 60, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: cloudMockupRef.current, start: 'top 95%' },
        });
        // Parallax on cloud mockup
        gsap.to(cloudMockupRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: { trigger: cloudMockupRef.current, start: 'top bottom', end: 'bottom top', scrub: 2 },
        });
      }

      // PARENTS section
      if (parentsTitleRef.current) {
        gsap.from(parentsTitleRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: parentsTitleRef.current, start: 'top 95%' },
        });
      }
      if (parentsPhoneRef.current) {
        gsap.from(parentsPhoneRef.current, {
          opacity: 0, x: -50, rotateY: 15, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: parentsPhoneRef.current, start: 'top 95%' },
        });
      }
      if (parentsCardsRef.current) {
        const cards = parentsCardsRef.current.children;
        gsap.from(cards, {
          opacity: 0, x: 50, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: parentsCardsRef.current, start: 'top 95%' },
        });
      }

      // SCREENSHOTS section
      if (screenshotsTitleRef.current) {
        gsap.from(screenshotsTitleRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: screenshotsTitleRef.current, start: 'top 95%' },
        });
      }
      if (scan1TextRef.current) {
        gsap.from(scan1TextRef.current, {
          opacity: 0, x: -50, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: scan1TextRef.current, start: 'top 95%' },
        });
      }
      if (scan1ImgRef.current) {
        gsap.from(scan1ImgRef.current, {
          opacity: 0, x: 50, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: scan1ImgRef.current, start: 'top 95%' },
        });
        gsap.to(scan1ImgRef.current, {
          y: -30, ease: 'none',
          scrollTrigger: { trigger: scan1ImgRef.current, start: 'top bottom', end: 'bottom top', scrub: 2 },
        });
      }
      if (scan2TextRef.current) {
        gsap.from(scan2TextRef.current, {
          opacity: 0, x: 50, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: scan2TextRef.current, start: 'top 95%' },
        });
      }
      if (scan2ImgRef.current) {
        gsap.from(scan2ImgRef.current, {
          opacity: 0, x: -50, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: scan2ImgRef.current, start: 'top 95%' },
        });
        gsap.to(scan2ImgRef.current, {
          y: -30, ease: 'none',
          scrollTrigger: { trigger: scan2ImgRef.current, start: 'top bottom', end: 'bottom top', scrub: 2 },
        });
      }

      // BENTO Grid
      if (bentoTitleRef.current) {
        gsap.from(bentoTitleRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: bentoTitleRef.current, start: 'top 98%' },
        });
      }
      if (bentoGridRef.current) {
        const cards = bentoGridRef.current.children;
        gsap.from(cards, {
          opacity: 0, scale: 0.9, y: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: bentoGridRef.current, start: 'top 98%' },
        });
      }

      // STATS
      if (statsSectionRef.current) {
        gsap.from(statsSectionRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: statsSectionRef.current, start: 'top 95%' },
        });
      }

      // PRICING
      if (pricingTitleRef.current) {
        gsap.from(pricingTitleRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: pricingTitleRef.current, start: 'top 95%' },
        });
      }
      if (pricingCardRef.current) {
        gsap.from(pricingCardRef.current, {
          opacity: 0, scale: 0.92, y: 30, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: pricingCardRef.current, start: 'top 95%' },
        });
      }

      // NEWSROOM
      if (newsroomRef.current) {
        gsap.from(newsroomRef.current, {
          opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: newsroomRef.current, start: 'top 95%' },
        });
      }

      // CTA
      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          opacity: 0, scale: 0.95, y: 30, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: ctaRef.current, start: 'top 95%' },
        });
        // Inverse parallax on CTA
        gsap.to(ctaRef.current, {
          y: -20, ease: 'none',
          scrollTrigger: { trigger: ctaRef.current, start: 'top bottom', end: 'bottom top', scrub: 2 },
        });
      }
    });

    // Refresh ScrollTrigger positions after page fully loads and layout stabilizes
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      ctx.revert();
      clearTimeout(refreshTimer);
    };
  }, []);

  const stats = [
    { value: `+${dbStats.schools.toLocaleString('fr-FR')}`, label: t.partnersLabel },
    { value: `+${dbStats.students.toLocaleString('fr-FR')}`, label: t.studentsLabel },
    { value: `+${dbStats.documents.toLocaleString('fr-FR')}`, label: t.documentsLabel },
    { value: "99.9%", label: t.networkLabel },
  ];

  const features = [
    { icon: <CreditCard className="w-8 h-8 text-amber-500" />, title: t.paymentTracking, description: t.paymentDesc, badge: t.paymentBadge, className: "md:col-span-2 bg-slate-900 text-white border-slate-800" },
    { icon: <BookOpen className="w-8 h-8 text-amber-500" />, title: t.bulletinsTitle, description: t.bulletinsDesc, badge: t.bulletinsBadge, className: "bg-white text-slate-800 border-slate-200" },
    { icon: <Users className="w-8 h-8 text-amber-500" />, title: t.parentsTitle, description: t.parentsDesc, badge: t.parentsBadge, className: "bg-white text-slate-800 border-slate-200" },
    { icon: <QrCode className="w-8 h-8 text-amber-500" />, title: t.qrCardsTitle, description: t.qrCardsDesc, badge: t.qrCardsBadge, className: "md:col-span-2 bg-slate-900 text-white border-slate-800" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes scan { 0% { transform: translateY(10%); } 50% { transform: translateY(700%); } 100% { transform: translateY(10%); } }
        .animate-scan { animation: scan 4s linear infinite; }
      `}</style>

      {/* ── MORPH BLOBS (Parallax background decorations) ── */}
      <MorphBlob color="rgba(245,158,11,0.06)" size={600} style={{ top: '-5%', left: '-10%' }} speed={10} />
      <MorphBlob color="rgba(99,102,241,0.04)" size={500} style={{ bottom: '10%', right: '-8%' }} speed={12} />

      {/* ── HEADER ── */}
      <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="border border-slate-200/80 bg-white/75 backdrop-blur-md rounded-xl shadow-lg shadow-slate-100/50">
          <nav className="w-full flex items-center justify-between p-3 px-6">
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
              <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
              <span>DGhub<span className="text-slate-900">School</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider text-slate-500">
              {[
                { label: t.features, path: `/${lang}/features` },
                { label: t.pricing, path: `/${lang}/pricing` },
                { label: t.about, path: `/${lang}/a-propos` },
              ].map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)} className="hover:text-amber-500 transition-colors cursor-pointer relative py-1 group/item">
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
                </button>
              ))}
              <a href="#stats" className="hover:text-amber-500 transition-colors relative py-1 group/item">
                {t.socialProof}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover/item:w-full" />
              </a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button onClick={() => navigate(`/${lang}/app`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer">{t.accessPortals}</button>
              ) : (
                <>
                  <button onClick={() => navigate(`/${lang}/login`)} className="text-xs font-black tracking-widest text-slate-600 hover:text-amber-500 transition-colors px-4 py-2">{t.login}</button>
                  <button onClick={() => navigate(`/${lang}/creer-compte`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black tracking-widest px-5 py-3 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer">{t.createSchool}</button>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-amber-500 transition-colors" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white p-5 space-y-4 flex flex-col rounded-b-xl">
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/features`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.features}</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/pricing`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.pricing}</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/a-propos`); }} className="text-sm font-bold text-slate-700 hover:text-amber-500 py-2 text-left cursor-pointer">{t.about}</button>
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/app`); }} className="w-full text-center py-3 text-sm font-black bg-amber-500 text-slate-950 rounded-lg border border-amber-600 shadow-md">{t.accessPortals}</button>
                ) : (
                  <>
                    <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/login`); }} className="w-full text-center py-3 text-sm font-black text-slate-700 border border-slate-200 rounded-lg">{t.login}</button>
                    <button onClick={() => { setMobileMenuOpen(false); navigate(`/${lang}/creer-compte`); }} className="w-full text-center py-3 text-sm font-black bg-amber-500 text-slate-950 rounded-lg border border-amber-600 shadow-md">{t.createSchool}</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Multi-layer Parallax + Staggered Entrance
          ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-8 pt-12 md:pt-20 pb-20 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center text-center lg:text-left">
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <h1 ref={heroTitleRef} className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
              {t.heroTitlePart1}
              <span className="relative text-amber-600 inline-block px-1">{t.heroTitleHighlight}</span>
              {t.heroTitlePart2}
            </h1>
            <p ref={heroSubRef} className="text-sm md:text-base lg:text-lg text-slate-500 max-w-2xl lg:mx-0 mx-auto leading-relaxed">{t.heroSubtitle}</p>
            <div ref={heroCTARef} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto lg:justify-start justify-center">
              {isAuthenticated ? (
                <button onClick={() => navigate(`/${lang}/app`)} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group">
                  {t.accessPortals} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate(`/${lang}/creer-compte`)} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group">
                    {t.createSchoolFree} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => navigate(`/${lang}/login`)} className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-slate-200 active:scale-[0.98] transition-all cursor-pointer">{t.accessPortals}</button>
                </>
              )}
            </div>
            <div ref={heroProofRef} className="flex items-center gap-4 lg:justify-start justify-center pt-6 border-t border-slate-100 max-w-lg lg:mx-0 mx-auto">
              <div className="flex -space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">CI</div>
                <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-950">SN</div>
                <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">BF</div>
              </div>
              <div className="text-left">
                <div className="flex items-center text-amber-500 gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}</div>
                <p className="text-[10px] font-black text-slate-800 tracking-wide uppercase">{t.recommended}</p>
              </div>
            </div>
          </div>

          {/* Hero Visual — Parallax mockup */}
          <div className="lg:col-span-5 relative flex justify-center w-full">
            <MorphBlob color="rgba(245,158,11,0.1)" size={350} style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} speed={8} />
            <div ref={heroMockupRef} className="w-full max-w-lg border border-slate-200 bg-slate-50 p-2.5 rounded-xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] hover:border-amber-500/20 transition-all duration-300">
              <div className="w-full bg-slate-950 text-white rounded-t-lg p-3 text-left font-mono text-[9px] flex items-center justify-between border-b border-slate-800 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" /><div className="w-2 h-2 rounded-full bg-yellow-500" /><div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-slate-500 text-[9px] ml-2">dghubschool.com/dashboard</span>
                </div>
              </div>
              <div className="w-full aspect-[16/10] bg-white rounded-b-lg overflow-hidden relative">
                <img src="/dashboard_preview.png" alt={t.realTimeDashboard} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" fetchPriority="high" />
              </div>
            </div>
            <div ref={heroFloatPhoneRef} className="absolute -bottom-8 -left-4 w-40 hidden md:block z-20 hover:-translate-y-2 transition-all duration-300 real-phone-mockup">
              <div className="real-phone-mockup-buttons" />
              <div className="real-phone-screen aspect-[9/16] p-1 flex items-center justify-center bg-white">
                <img src="/student_card_preview.png" className="w-full h-auto object-contain bg-white rounded-lg shadow-sm border border-slate-100" alt="Student Card" />
              </div>
            </div>
            <div ref={heroLiveRef} className="absolute -top-6 -right-6 bg-white border border-slate-200 p-3.5 px-4 rounded-xl shadow-lg z-20 hidden md:block hover:scale-105 transition-transform">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /><span className="text-[10px] font-black uppercase tracking-wider text-slate-800">{t.liveBadge}</span></div>
              <p className="text-[10px] text-slate-400 mt-1">{t.liveSub}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MARQUEE (conservé)
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-slate-950 py-10 overflow-hidden relative border-y border-slate-900 font-['Poppins']">
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
                      <span key={text} className="text-sm font-medium text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white/5 transition-colors">{text}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CLOUD VS LOCAL — Slide-in + Parallax Mockup
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24 relative overflow-hidden content-lazy">
        <MorphBlob color="rgba(99,102,241,0.05)" size={450} style={{ top: '20%', right: '-5%' }} speed={14} />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div ref={cloudTextRef} className="space-y-8">
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border border-indigo-200">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />{t.securityLabel}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight leading-tight">{t.cloudTitle}</h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">{t.cloudDesc}</p>
              <ul className="space-y-5 mt-8">
                {[t.cloudPoint1, t.cloudPoint2, t.cloudPoint3].map((point, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${['bg-emerald-100', 'bg-amber-100', 'bg-blue-100'][i]} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Check className={`w-5 h-5 ${['text-emerald-600', 'text-amber-600', 'text-blue-600'][i]}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{point.split(':')[0]}</h3>
                      <p className="text-sm text-slate-500">{point.split(':')[1]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div ref={cloudMockupRef} className="relative flex justify-center items-center py-12">
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Outer spinning dashed sync circle */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-[spin_30s_linear_infinite]" />
                {/* Inner counter-rotating dashed circle */}
                <div className="absolute inset-6 border border-dashed border-indigo-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                {/* Main continuous active loading circle */}
                <div className="absolute inset-12 border-4 border-indigo-500/10 border-t-indigo-500 border-r-indigo-500/50 rounded-full animate-spin" />
                {/* Pulsing Central Cloud Device */}
                <div className="relative z-10 w-28 h-28 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-transform duration-300">
                  <Shield className="w-12 h-12 text-white animate-pulse" />
                </div>
                {/* Floating data syncing dots */}
                <div className="absolute top-10 left-16 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div className="absolute bottom-12 right-20 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping [animation-delay:0.7s]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PARENTS — 3D Rotate Phone + Stagger Cards
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 relative overflow-hidden border-t border-slate-100 content-lazy">
        <MorphBlob color="rgba(245,158,11,0.05)" size={400} style={{ bottom: '5%', left: '0%' }} speed={10} />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div ref={parentsTitleRef} className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">{t.parentsFocusTitle}</h2>
            <p className="text-slate-500 text-sm md:text-base">{t.parentsFocusDesc}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div ref={parentsPhoneRef} className="lg:col-span-5 flex justify-center relative perspective-container">
              <div className="w-full max-w-sm rounded-2xl incline-3d-image overflow-hidden bg-white">
                <img 
                  src="/DASH4.png" 
                  className="w-full h-auto object-cover" 
                  alt="Espace Familial" 
                  loading="lazy" 
                />
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
                      <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCREENSHOTS — Alternating Slide-in + Parallax
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-28 content-lazy">
        <div ref={screenshotsTitleRef} className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">{t.screenshotsTitle}</div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">{t.discoverFeatures}</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">{t.discoverDesc}</p>
        </div>

        {/* Row 1: Cartes Scolaires — text left, image right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div ref={scan1TextRef} className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block">{t.secBadge}</span>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight">{t.securityTitle}</h3>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">{t.securityDesc}</p>
          </div>
          <div ref={scan1ImgRef} className="lg:col-span-7 flex justify-center relative">
            <div className="w-full max-w-lg bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl relative overflow-hidden group">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                <img src="/student_card_preview.png" alt={t.securityTitle} className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#f59e0b] opacity-80 animate-scan pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Bulletins — image left, text right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div ref={scan2ImgRef} className="lg:col-span-7 flex justify-center lg:order-1 order-2 relative">
            <div className="w-full max-w-lg bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
              <div className="w-full bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 flex items-center justify-center">
                <img src="/report_card_preview.png" alt={t.academicsTitle} className="w-full h-full object-contain max-h-[380px] group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            </div>
          </div>
          <div ref={scan2TextRef} className="lg:col-span-5 space-y-6 lg:order-2 order-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full inline-block">{t.acadBadge}</span>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase leading-tight">{t.academicsTitle}</h3>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">{t.academicsDesc}</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ACCÈS FONCTIONNALITÉS — Redirection simple
          ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-slate-50 border-y border-slate-200 py-16 relative overflow-hidden text-center content-lazy">
        <MorphBlob color="rgba(245,158,11,0.03)" size={350} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} speed={8} />
        <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 space-y-6">
          <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            ⚙️ {t.features}
          </span>
          <h3 ref={bentoTitleRef} className="text-2xl md:text-4xl font-black text-slate-950 tracking-tight uppercase max-w-2xl mx-auto leading-tight">
            {lang === 'fr' 
              ? "Tout ce dont votre école a besoin, dans un seul outil complet" 
              : "Everything your school needs, in one comprehensive tool"}
          </h3>
          <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
            {lang === 'fr' 
              ? "De la gestion de la caisse aux bulletins scolaires, en passant par le portail parents et le contrôle d'accès QR code." 
              : "From cash management and grade reports to the parent portal and QR code access control."}
          </p>
          <div className="pt-4">
            <button 
              onClick={() => navigate(`/${lang}/features`)} 
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-4.5 rounded-lg border border-amber-600 shadow-lg shadow-amber-500/10 active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer animate-pulse"
            >
              <span>{lang === 'fr' ? 'Découvrir toutes les fonctionnalités' : 'Discover all features'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS — Animated Counters
          ═══════════════════════════════════════════════════════════ */}
      <section id="stats" className="bg-white py-20 relative content-lazy">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div ref={statsSectionRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md transition duration-300">
                <AnimatedCounter value={stat.value} className="block text-3xl md:text-5xl font-black text-amber-600 mb-2 select-none tracking-tight" />
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>

          {testimonials.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.map((tItem) => (
                  <div key={tItem.id} className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-left relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-5xl text-amber-500 font-serif leading-none absolute top-4 left-6 opacity-20">"</div>
                    <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed italic relative z-10 pt-4 mb-6">"{tItem.content}"</p>
                    <div className="space-y-1 relative z-10">
                      <p className="text-sm font-black tracking-tight text-slate-900">{tItem.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{tItem.role} {tItem.school_name ? `— ${tItem.school_name}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <button onClick={() => navigate(`/${lang}/partager-mon-histoire`)} className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95">
              <Star className="w-4 h-4 text-amber-500" />{t.shareStory}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING — Scale-in + Glow
          ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-slate-50 border-t border-slate-200 py-20 content-lazy">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div ref={pricingTitleRef} className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.pricingTitle}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">{t.pricingSubtitle}</h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">{t.pricingDesc}</p>
          </div>
          <div ref={pricingCardRef} className="relative max-w-sm mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white border-2 border-slate-200/80 p-8 rounded-xl shadow-xl hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
              <div className="absolute top-6 right-[-36px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-12 text-center select-none shadow-sm">{t.freeTrialBadge}</div>
              <div className="mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">{t.singleFormula}</h3>
                <span className="text-4xl font-black tracking-tight text-slate-950">{t.daysTrial}</span>
                <p className="text-xs text-slate-500 mt-2">{t.afterTrial}</p>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
                {[t.cashMgmt, t.unlimitedBulletins, t.fullAccess, t.whatsappSupport].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-emerald-500" /></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate(`/${lang}/creer-compte`)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-lg border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                {t.trialBtn} <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          NEWSROOM
          ═══════════════════════════════════════════════════════════ */}
      <section id="newsroom" className="bg-slate-50 border-t border-slate-200/60 py-20 relative content-lazy">
        <div ref={newsroomRef} className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/40 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">{t.newsroomTitle}</span>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">{t.newsroomSub}</h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">{t.newsroomDesc}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full inline-block">{t.newsroomBadge}</span>
                <h3 className="text-base md:text-lg font-black text-slate-950 uppercase leading-snug group-hover:text-amber-500 transition-colors">{t.newsroomCardTitle}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{t.newsroomCardDesc}</p>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{t.newsroomDate}</span>
                <span onClick={() => navigate(`/${lang}/newsroom`)} className="text-amber-500 flex items-center gap-1 cursor-pointer hover:underline">{t.viewAllNews} <ArrowRight className="w-3 h-3" /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA — Inverse Parallax
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 text-center relative overflow-hidden content-lazy">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div ref={ctaRef} className="bg-slate-950 text-white rounded-xl p-12 md:p-20 relative overflow-hidden shadow-2xl border border-slate-900 group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-amber-500/15 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight">{t.readyTitle}</h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">{t.readyDesc}</p>
              <button onClick={() => navigate(`/${lang}/creer-compte`)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-lg border border-amber-600 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-3 cursor-pointer group/btn">
                {t.createSchoolBtn} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};
