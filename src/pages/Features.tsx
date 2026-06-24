// ============================================================
// PAGE FONCTIONNALITÉS — Layout alterné Image / Description
// Animations au défilement via IntersectionObserver
// ============================================================
import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight,
  Users, CreditCard, SearchCheck,
  FolderOpen, History, MessageSquare,
  Megaphone, Database, Settings, CreditCard as CardIcon
} from 'lucide-react';
import { Footer } from '../components/Footer';

// ── Définition des 10 fonctionnalités ──────────────────────
const featuresFr = [
  {
    image: '/DASH4.png',
    icon: Users,
    color: '#F59E0B',
    title: 'Gestion des Comptes Parents',
    badge: 'Espace Famille',
    description:
      'Offrez aux parents un accès sécurisé et personnalisé à toutes les informations de leurs enfants. Consultez les notes, les absences, les paiements et les communications directement depuis leur espace dédié, disponible 24h/24 sur mobile et ordinateur.',
    points: [
      'Tableau de bord parent en temps réel',
      'Suivi des notes et moyennes par matière',
      'Historique des présences et absences',
      'Notifications push instantanées',
    ],
  },
  {
    image: '/DASH5.png',
    icon: CreditCard,
    color: '#10B981',
    title: 'Gestion des Paiements',
    badge: 'Finance',
    description:
      'Centralisez et automatisez toute la comptabilité scolaire. Enregistrez les règlements en espèces, Mobile Money ou virement bancaire, générez des reçus PDF en quelques secondes et suivez les impayés par élève avec un tableau de bord clair.',
    points: [
      'Enregistrement multi-modes de paiement',
      'Génération de reçus PDF instantanés',
      'Suivi des tranches et impayés',
      'Export Excel/CSV des rapports financiers',
    ],
  },
  {
    image: '/DASH6.png',
    icon: SearchCheck,
    color: '#3B82F6',
    title: 'Vérification des Informations Élève',
    badge: 'Sécurité',
    description:
      'Accédez instantanément à la fiche complète de chaque élève. Vérifiez l\'identité, les informations médicales, les contacts d\'urgence et le dossier académique complet en moins de 5 secondes grâce au scan QR ou à la recherche rapide.',
    points: [
      'Scan QR Code pour accès instantané',
      'Fiche élève complète avec photo',
      'Informations médicales et contacts d\'urgence',
      'Historique académique consolidé',
    ],
  },
  {
    image: '/DASH8.png',
    icon: FolderOpen,
    color: '#8B5CF6',
    title: 'Centre de Documents',
    badge: 'Bibliothèque',
    description:
      'Stockez, organisez et partagez tous les documents scolaires en un seul endroit sécurisé. Autorisations de sortie, certificats de scolarité, manuels numériques et ressources pédagogiques accessibles par les parents et les enseignants en un clic.',
    points: [
      'Stockage sécurisé de tous les documents',
      'Partage direct avec parents et enseignants',
      'Certificats et autorisations numériques',
      'Bibliothèque de ressources pédagogiques',
    ],
  },
  {
    image: '/DASH10.png',
    icon: History,
    color: '#F97316',
    title: 'Historiques & Activités',
    badge: 'Traçabilité',
    description:
      'Gardez une trace complète de toutes les activités : entrées/sorties, paiements effectués, messages échangés, documents téléchargés et modifications de données. Un journal d\'audit horodaté pour une transparence totale de la gestion scolaire.',
    points: [
      'Journal d\'audit complet et horodaté',
      'Historique des entrées et sorties',
      'Traçabilité des paiements et transactions',
      'Export des logs pour vérification externe',
    ],
  },
  {
    image: '/DASH11.png',
    icon: MessageSquare,
    color: '#06B6D4',
    title: 'Messagerie Intégrée',
    badge: 'Communication',
    description:
      'Facilitez la communication entre l\'école et les familles grâce à une messagerie sécurisée et bidirectionnelle. Les parents, enseignants et administrateurs échangent directement sans passer par des applications externes, tout est centralisé.',
    points: [
      'Messagerie sécurisée bidirectionnelle',
      'Conversations parents-administration',
      'Messagerie enseignant-direction',
      'Notifications push instantanées',
    ],
  },
  {
    image: '/DASH12.png',
    icon: Megaphone,
    color: '#EC4899',
    title: 'Annonces & Actualités',
    badge: 'Information',
    description:
      'Diffusez vos annonces scolaires à tous les parents en quelques secondes. Réunions parents-profs, fermetures exceptionnelles, événements scolaires ou informations urgentes : chaque message est délivré par notification push et visible dans l\'application.',
    points: [
      'Diffusion massive en un clic',
      'Notifications push urgentes',
      'Ciblage par classe ou groupe',
      'Historique des annonces publiées',
    ],
  },
  {
    image: '/DASH13.png',
    icon: Database,
    color: '#14B8A6',
    title: 'Base de Données Centralisée',
    badge: 'Données',
    description:
      'Toutes les données de votre établissement réunies dans une base sécurisée et structurée. Élèves, enseignants, classes, matières, coefficients — gérez tout depuis un tableau de bord unique sans duplication ni perte d\'information.',
    points: [
      'Données centralisées et structurées',
      'Gestion des élèves, classes, matières',
      'Import/Export de données en masse',
      'Sauvegardes automatiques quotidiennes',
    ],
  },
  {
    image: '/DASH14.png',
    icon: Settings,
    color: '#6366F1',
    title: 'Paramètres du Système',
    badge: 'Configuration',
    description:
      'Configurez votre établissement à votre image sans intervention technique. Définissez les années académiques, les cycles scolaires, les coefficients, les tranches de paiement et les permissions d\'accès de chaque rôle utilisateur.',
    points: [
      'Configuration des années académiques',
      'Gestion des rôles et permissions',
      'Paramètres des tranches de paiement',
      'Personnalisation des coefficients',
    ],
  },
  {
    image: '/DASH15.png',
    icon: CardIcon,
    color: '#F59E0B',
    title: 'Carte Scolaire Numérique',
    badge: 'Identité',
    description:
      'Générez automatiquement des cartes d\'identité scolaires numériques avec photo passeport, QR Code unique crypté et toutes les informations de l\'élève. Compatible avec le système de contrôle d\'accès QR pour les entrées et sorties.',
    points: [
      'Génération automatique avec photo',
      'QR Code unique crypté par élève',
      'Compatible scan entrée/sortie',
      'Format numérique et imprimable',
    ],
  },
];

const featuresEn = [
  {
    image: '/DASH4.png',
    icon: Users,
    color: '#F59E0B',
    title: 'Parent Account Management',
    badge: 'Family Portal',
    description:
      'Give parents secure, personalized access to all their children\'s information. View grades, absences, payments, and communications directly from their dedicated space, available 24/7 on mobile and desktop.',
    points: [
      'Real-time parent dashboard',
      'Track grades and averages by subject',
      'Attendance and absence history',
      'Instant push notifications',
    ],
  },
  {
    image: '/DASH5.png',
    icon: CreditCard,
    color: '#10B981',
    title: 'Payment Management',
    badge: 'Finance',
    description:
      'Centralize and automate all school accounting. Record payments in cash, Mobile Money, or bank transfer, generate PDF receipts in seconds, and track outstanding balances per student with a clear dashboard.',
    points: [
      'Multi-mode payment recording',
      'Instant PDF receipt generation',
      'Installment and unpaid tracking',
      'Excel/CSV financial report export',
    ],
  },
  {
    image: '/DASH6.png',
    icon: SearchCheck,
    color: '#3B82F6',
    title: 'Student Information Verification',
    badge: 'Security',
    description:
      'Instantly access each student\'s complete profile. Verify identity, medical information, emergency contacts, and full academic record in under 5 seconds via QR scan or quick search.',
    points: [
      'QR Code scan for instant access',
      'Complete student profile with photo',
      'Medical info and emergency contacts',
      'Consolidated academic history',
    ],
  },
  {
    image: '/DASH8.png',
    icon: FolderOpen,
    color: '#8B5CF6',
    title: 'Document Center',
    badge: 'Library',
    description:
      'Store, organize, and share all school documents in one secure place. Exit authorizations, enrollment certificates, digital textbooks, and educational resources accessible by parents and teachers in one click.',
    points: [
      'Secure storage for all documents',
      'Direct sharing with parents & teachers',
      'Digital certificates and authorizations',
      'Educational resource library',
    ],
  },
  {
    image: '/DASH10.png',
    icon: History,
    color: '#F97316',
    title: 'History & Activity Logs',
    badge: 'Traceability',
    description:
      'Keep a complete trace of all activities: entries/exits, payments made, messages exchanged, documents downloaded, and data modifications. A timestamped audit log for total transparency in school management.',
    points: [
      'Complete timestamped audit log',
      'Entry and exit history',
      'Payment and transaction traceability',
      'Export logs for external verification',
    ],
  },
  {
    image: '/DASH11.png',
    icon: MessageSquare,
    color: '#06B6D4',
    title: 'Integrated Messaging',
    badge: 'Communication',
    description:
      'Facilitate communication between the school and families with secure, bidirectional messaging. Parents, teachers, and administrators communicate directly without external apps — everything is centralized.',
    points: [
      'Secure bidirectional messaging',
      'Parent-administration conversations',
      'Teacher-management messaging',
      'Instant push notifications',
    ],
  },
  {
    image: '/DASH12.png',
    icon: Megaphone,
    color: '#EC4899',
    title: 'Announcements & News',
    badge: 'Information',
    description:
      'Broadcast school announcements to all parents in seconds. Parent-teacher meetings, exceptional closures, school events, or urgent information — every message is delivered via push notification and visible in the app.',
    points: [
      'Mass broadcast in one click',
      'Urgent push notifications',
      'Target by class or group',
      'History of published announcements',
    ],
  },
  {
    image: '/DASH13.png',
    icon: Database,
    color: '#14B8A6',
    title: 'Centralized Database',
    badge: 'Data',
    description:
      'All your institution\'s data in a secure, structured database. Students, teachers, classes, subjects, coefficients — manage everything from a single dashboard with no duplication or data loss.',
    points: [
      'Centralized and structured data',
      'Manage students, classes, subjects',
      'Bulk data import/export',
      'Automatic daily backups',
    ],
  },
  {
    image: '/DASH14.png',
    icon: Settings,
    color: '#6366F1',
    title: 'System Settings',
    badge: 'Configuration',
    description:
      'Configure your institution to your needs without any technical assistance. Set up academic years, school cycles, coefficients, payment installments, and access permissions for each user role.',
    points: [
      'Academic year configuration',
      'Role and permission management',
      'Payment installment settings',
      'Coefficient customization',
    ],
  },
  {
    image: '/DASH15.png',
    icon: CardIcon,
    color: '#F59E0B',
    title: 'Digital School ID Card',
    badge: 'Identity',
    description:
      'Automatically generate digital school ID cards with a passport photo, unique encrypted QR Code, and all student information. Compatible with the QR access control system for entry and exit.',
    points: [
      'Automatic generation with photo',
      'Unique encrypted QR Code per student',
      'Compatible with entry/exit scan',
      'Digital and printable format',
    ],
  },
];

// ── Composant FeatureRow ─────────────────────────────────────
interface FeatureRowProps {
  feature: (typeof featuresFr)[0];
  index: number;
  isReversed: boolean;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ feature, index, isReversed }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('feat-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Icon = feature.icon;

  return (
    <div
      ref={rowRef}
      className={`feat-row ${isReversed ? 'feat-row--reversed' : ''}`}
      style={{ '--feat-color': feature.color } as React.CSSProperties}
    >
      {/* ── Image Side ── */}
      <div className="feat-image-wrap">
        <div className="feat-image-inner">
          {/* Badge numéro */}
          <div className="feat-number">
            {String(index + 1).padStart(2, '0')}
          </div>
          <img
            src={feature.image}
            alt={feature.title}
            className="feat-image"
            loading="lazy"
          />
          {/* Glow effect */}
          <div className="feat-image-glow" style={{ background: `${feature.color}20` }} />
        </div>
      </div>

      {/* ── Text Side ── */}
      <div className="feat-text-wrap">
        {/* Badge */}
        <div className="feat-badge" style={{ color: feature.color, borderColor: `${feature.color}30`, background: `${feature.color}10` }}>
          <Icon size={13} />
          <span>{feature.badge}</span>
        </div>

        {/* Title */}
        <h2 className="feat-title">{feature.title}</h2>

        {/* Description */}
        <p className="feat-description">{feature.description}</p>

        {/* Points */}
        <ul className="feat-points">
          {feature.points.map((point, i) => (
            <li key={i} className="feat-point">
              <span className="feat-point-dot" style={{ background: feature.color }} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ── Page principale ──────────────────────────────────────────
export const Features: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();

  const features = lang === 'en' ? featuresEn : featuresFr;

  const texts = {
    fr: {
      back: 'Accueil',
      badge: '⚙️ Fonctionnalités',
      title: 'Tout ce dont votre école a besoin',
      subtitle: 'Découvrez comment DGhubSchool modernise chaque aspect de la gestion scolaire — de la scolarité aux paiements, en passant par la sécurité et la communication.',
      ctaTitle: 'Prêt à transformer votre école ?',
      ctaDesc: 'Démarrez votre essai gratuit de 40 jours et découvrez toutes ces fonctionnalités en action.',
      ctaBtn: 'Démarrer mon essai gratuit',
    },
    en: {
      back: 'Home',
      badge: '⚙️ Features',
      title: 'Everything your school needs',
      subtitle: 'Discover how DGhubSchool modernizes every aspect of school management — from academics and payments to security and communication.',
      ctaTitle: 'Ready to transform your school?',
      ctaDesc: 'Start your free 40-day trial and discover all these features in action.',
      ctaBtn: 'Start my free trial',
    },
  };

  const t = texts[lang] ?? texts.fr;

  return (
    <div className="features-page">
      {/* ── Header ── */}
      <header className="features-header">
        <nav className="features-nav">
          <div
            className="features-logo"
            onClick={() => navigate(`/${lang}`)}
          >
            <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500 font-black text-xl">DGhub<span className="text-slate-900">School</span></span>
          </div>
          <button
            onClick={() => navigate(`/${lang}`)}
            className="features-back-btn"
          >
            <ArrowLeft size={16} />
            <span>{t.back}</span>
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="features-hero">
        <div className="features-hero-inner">
          <div className="features-hero-badge">
            {t.badge}
          </div>
          <h1 className="features-hero-title">{t.title}</h1>
          <p className="features-hero-subtitle">{t.subtitle}</p>

          {/* Scroll indicator */}
          <div className="features-scroll-indicator">
            <div className="features-scroll-dot" />
            <span>{lang === 'fr' ? 'Défilez pour explorer' : 'Scroll to explore'}</span>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="feat-blob feat-blob-1" />
        <div className="feat-blob feat-blob-2" />
      </section>

      {/* ── Features List ── */}
      <main className="features-main">
        {features.map((feature, index) => (
          <React.Fragment key={index}>
            <FeatureRow
              feature={feature}
              index={index}
              isReversed={index % 2 !== 0}
            />
            {/* Separateur subtil entre les items (sauf dernier) */}
            {index < features.length - 1 && (
              <div className="feat-separator" />
            )}
          </React.Fragment>
        ))}
      </main>

      {/* ── CTA Section ── */}
      <section className="features-cta-section">
        <div className="features-cta-inner">
          <h2 className="features-cta-title">{t.ctaTitle}</h2>
          <p className="features-cta-desc">{t.ctaDesc}</p>
          <button
            onClick={() => navigate(`/${lang}/creer-compte`)}
            className="features-cta-btn"
          >
            <span>{t.ctaBtn}</span>
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="feat-blob feat-blob-cta" />
      </section>

      <Footer />
    </div>
  );
};
