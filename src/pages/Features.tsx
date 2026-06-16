// ============================================================
// PAGE FONCTIONNALITÉS (FEATURES) — Premium, Interactive Layout
// ============================================================
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CreditCard, BookOpen, QrCode, Users, 
  Settings, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, 
  MessageSquare, UserCheck
} from 'lucide-react';
import { Footer } from '../components/Footer';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();

  const texts = {
    fr: {
      back: "Accueil",
      badge: "⚙️ Fonctionnalités",
      title: "Une suite d'outils complète pour votre école",
      subtitle: "Découvrez comment DGhubSchool modernise la gestion académique, comptable et la sécurité de votre établissement.",
      moreFeatures: "Et bien plus encore",
      moreFeaturesSub: "Des petits détails qui font une grande différence au quotidien.",
      ctaTitle: "Prêt à franchir le pas ?",
      ctaDesc: "Activez votre portail et commencez à digitaliser votre école dès aujourd'hui.",
      ctaBtn: "Démarrer mon essai de 60 jours",
      securityMax: "Sécurité Maximale",
      securityMaxDesc: "Sauvegardes quotidiennes et cryptage des données financières.",
      emailsSms: "E-mails & SMS",
      emailsSmsDesc: "Alertes automatiques pour relancer les paiements ou envoyer les bulletins.",
      trombi: "Trombinoscope",
      trombiDesc: "Fiches élèves complètes avec photo d'identité passeport.",
      easyConfig: "Configuration simple",
      easyConfigDesc: "Ajoutez vos classes, matières et coefficients en quelques clics."
    },
    en: {
      back: "Home",
      badge: "⚙️ Features",
      title: "A complete suite of tools for your school",
      subtitle: "Discover how DGhubSchool modernizes academic, accounting, and security management in your establishment.",
      moreFeatures: "And much more",
      moreFeaturesSub: "Small details that make a big difference on a daily basis.",
      ctaTitle: "Ready to take the leap?",
      ctaDesc: "Activate your portal and start digitalizing your school today.",
      ctaBtn: "Start my 60-day trial",
      securityMax: "Maximum Security",
      securityMaxDesc: "Daily backups and encryption of financial data.",
      emailsSms: "Emails & SMS",
      emailsSmsDesc: "Automatic alerts to follow up payments or send report cards.",
      trombi: "Student Directory",
      trombiDesc: "Complete student profiles with passport ID photo.",
      easyConfig: "Simple Configuration",
      easyConfigDesc: "Add your classes, subjects, and coefficients in a few clicks."
    }
  };

  const t = texts[lang];

  const categories = [
    {
      title: lang === 'fr' ? "Gestion Financière & Scolarité" : "Financial Management & Tuition",
      subtitle: lang === 'fr' ? "Simplifiez le suivi de la scolarité et de la caisse" : "Simplify tuition and cash tracking",
      icon: <CreditCard className="w-6 h-6 text-amber-500" />,
      items: lang === 'fr' ? [
        "Enregistrement des règlements (espèces, chèques, virements) avec reçu instantané",
        "Génération automatique de reçus de caisse numériques envoyés par SMS",
        "Suivi des tranches de scolarité impayées et relances en un clic",
        "Journal de caisse quotidien et rapports financiers exportables en Excel"
      ] : [
        "Recording payments (cash, checks, transfers) with instant receipts",
        "Automatic generation of digital cashier receipts sent via SMS",
        "Tracking unpaid school fee installments and follow-ups in one click",
        "Daily cash journal and financial reports exportable to Excel"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: lang === 'fr' ? "Gestion Académique & Bulletins" : "Academic Management & Report Cards",
      subtitle: lang === 'fr' ? "Fini les calculs manuels et les erreurs de saisie" : "No more manual calculations and entry errors",
      icon: <BookOpen className="w-6 h-6 text-amber-500" />,
      items: lang === 'fr' ? [
        "Portail enseignant ultra-léger pour saisir les notes sur mobile ou PC",
        "Calcul automatique des moyennes de classe, des rangs et des appréciations",
        "Génération des bulletins scolaires au format PDF officiel prêts à imprimer",
        "Suivi des matières par classe et coefficients personnalisés"
      ] : [
        "Ultra-lightweight teacher portal to enter grades on mobile or PC",
        "Automatic calculation of class averages, rankings, and teacher remarks",
        "Generation of school reports in official PDF format ready to print",
        "Tracking subjects by class and customized coefficients"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: lang === 'fr' ? "Sécurité & Présences QR Code" : "Security & QR Code Attendances",
      subtitle: lang === 'fr' ? "Tranquillité d'esprit pour l'école et les familles" : "Peace of mind for school and families",
      icon: <QrCode className="w-6 h-6 text-amber-500" />,
      items: lang === 'fr' ? [
        "Génération automatique de cartes d'élèves officielles munies de QR Codes",
        "Application de scan intégrée pour enregistrer les entrées et sorties",
        "Notification SMS/Push automatique envoyée aux parents dès le scan de la carte",
        "Historique complet d'assiduité par élève consultable à tout moment"
      ] : [
        "Automatic generation of official student cards with QR Codes",
        "Integrated scanning application to record entries and exits",
        "Automatic SMS/Push notification sent to parents upon scanning the card",
        "Complete attendance history per student accessible at any time"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: lang === 'fr' ? "Espace Parents & Communication" : "Parent Portal & Communication",
      subtitle: lang === 'fr' ? "Rapprochez l'école des familles au quotidien" : "Bring the school closer to families daily",
      icon: <Users className="w-6 h-6 text-amber-500" />,
      items: lang === 'fr' ? [
        "Accès mobile pour consulter les notes, moyennes, retards et absences",
        "Messagerie en ligne sécurisée pour communiquer avec l'administration",
        "Panneau d'annonces de l'établissement avec notifications urgentes",
        "Consultation des documents numérisés et autorisations parentales"
      ] : [
        "Mobile access to consult grades, averages, delays, and absences",
        "Secure online messaging to communicate with the administration",
        "Institution announcement board with urgent notifications",
        "Consultation of digitized documents and parental permissions"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: lang === 'fr' ? "Ressources Éducatives & Révisions Gratuites" : "Educational Resources & Free Revisions",
      subtitle: lang === 'fr' ? "Des alternatives scolaires d'excellence intégrées pour s'entraîner à la maison" : "Integrated excellent academic alternatives to practice at home",
      icon: <BookOpen className="w-6 h-6 text-emerald-600 animate-pulse" />,
      items: lang === 'fr' ? [
        "Sésamath : Fiches et manuels de mathématiques conformes aux programmes francophones",
        "Khan Academy : Vidéos courtes, leçons claires et parcours d'exercices gratuits",
        "Bibliothèque Romande : Livres classiques et lectures scolaires en accès libre (PDF/EPUB)",
        "Quiz Interactifs : Exercices locaux et tests de niveau intégrés pour stimuler l'élève"
      ] : [
        "Sesamath: Math worksheets and textbooks conforming to francophone curricula",
        "Khan Academy: Short videos, clear lessons, and free exercise pathways",
        "Bibliothèque Romande: Classic books and free access school readings (PDF/EPUB)",
        "Interactive Quizzes: Integrated local exercises and level tests to stimulate the student"
      ],
      className: "md:col-span-2 bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/5 dark:border-emerald-900/30"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
            <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
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
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          {t.badge}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-6">
          {t.title}
        </h1>
        <p className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          {t.subtitle}
        </p>
      </section>

      {/* Feature Showcase Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, idx) => (
            <div key={idx} className={`p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${cat.className}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight leading-none mb-1">
                    {cat.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{cat.subtitle}</span>
                </div>
              </div>

              <ul className="space-y-4">
                {cat.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed font-medium">
                    <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Extra Features Section (Bento sub-items) */}
      <section className="bg-slate-950 text-white py-20 border-t border-slate-900 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              {t.moreFeatures}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto font-medium">
              {t.moreFeaturesSub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <ShieldCheck className="w-6 h-6 text-amber-500" />, t: t.securityMax, d: t.securityMaxDesc },
              { icon: <MessageSquare className="w-6 h-6 text-amber-500" />, t: t.emailsSms, d: t.emailsSmsDesc },
              { icon: <UserCheck className="w-6 h-6 text-amber-500" />, t: t.trombi, d: t.trombiDesc },
              { icon: <Settings className="w-6 h-6 text-amber-500" />, t: t.easyConfig, d: t.easyConfigDesc }
            ].map((extra, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
                <div className="p-3 bg-white/5 rounded-xl inline-block">{extra.icon}</div>
                <h4 className="text-xs font-black uppercase tracking-wider">{extra.t}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{extra.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto font-medium">
            {t.ctaDesc}
          </p>
          <button 
            onClick={() => navigate(`/${lang}/creer-compte`)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            {t.ctaBtn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
