// ============================================================
// PAGE FONCTIONNALITÉS (FEATURES) — Premium, Interactive Layout
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, BookOpen, QrCode, Users, 
  Settings, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, 
  MessageSquare, UserCheck
} from 'lucide-react';
import { Footer } from '../components/Footer';

export const Features: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: "Gestion Financière & Scolarité",
      subtitle: "Simplifiez le suivi de la scolarité et de la caisse",
      icon: <CreditCard className="w-6 h-6 text-amber-500" />,
      items: [
        "Enregistrement des règlements (espèces, chèques, virements) avec reçu instantané",
        "Génération automatique de reçus de caisse numériques envoyés par SMS",
        "Suivi des tranches de scolarité impayées et relances en un clic",
        "Journal de caisse quotidien et rapports financiers exportables en Excel"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: "Gestion Académique & Bulletins",
      subtitle: "Fini les calculs manuels et les erreurs de saisie",
      icon: <BookOpen className="w-6 h-6 text-amber-500" />,
      items: [
        "Portail enseignant ultra-léger pour saisir les notes sur mobile ou PC",
        "Calcul automatique des moyennes de classe, des rangs et des appréciations",
        "Génération des bulletins scolaires au format PDF officiel prêts à imprimer",
        "Suivi des matières par classe et coefficients personnalisés"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: "Sécurité & Présences QR Code",
      subtitle: "Tranquillité d'esprit pour l'école et les familles",
      icon: <QrCode className="w-6 h-6 text-amber-500" />,
      items: [
        "Génération automatique de cartes d'élèves officielles munies de QR Codes",
        "Application de scan intégrée pour enregistrer les entrées et sorties",
        "Notification SMS/Push automatique envoyée aux parents dès le scan de la carte",
        "Historique complet d'assiduité par élève consultable à tout moment"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: "Espace Parents & Communication",
      subtitle: "Rapprochez l'école des familles au quotidien",
      icon: <Users className="w-6 h-6 text-amber-500" />,
      items: [
        "Accès mobile pour consulter les notes, moyennes, retards et absences",
        "Messagerie en ligne sécurisée pour communiquer avec l'administration",
        "Panneau d'annonces de l'établissement avec notifications urgentes",
        "Consultation des documents numérisés et autorisations parentales"
      ],
      className: "bg-slate-50 border-slate-200"
    },
    {
      title: "Ressources Éducatives & Révisions Gratuites",
      subtitle: "Des alternatives scolaires d'excellence intégrées pour s'entraîner à la maison",
      icon: <BookOpen className="w-6 h-6 text-emerald-600 animate-pulse" />,
      items: [
        "Sésamath : Fiches et manuels de mathématiques conformes aux programmes francophones",
        "Khan Academy : Vidéos courtes, leçons claires et parcours d'exercices gratuits",
        "Bibliothèque Romande : Livres classiques et lectures scolaires en accès libre (PDF/EPUB)",
        "Quiz Interactifs : Exercices locaux et tests de niveau intégrés pour stimuler l'élève"
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
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          ⚙️ Fonctionnalités
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-6">
          Une suite d'outils complète pour votre école
        </h1>
        <p className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Découvrez comment DGhubSchool modernise la gestion académique, comptable et la sécurité de votre établissement.
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
                  <li key={itemIdx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
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
              Et bien plus encore
            </h3>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
              Des petits détails qui font une grande différence au quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <ShieldCheck className="w-6 h-6 text-amber-500" />, t: "Sécurité Maximale", d: "Sauvegardes quotidiennes et cryptage des données financières." },
              { icon: <MessageSquare className="w-6 h-6 text-amber-500" />, t: "E-mails & SMS", d: "Alertes automatiques pour relancer les paiements ou envoyer les bulletins." },
              { icon: <UserCheck className="w-6 h-6 text-amber-500" />, t: "Trombinoscope", d: "Fiches élèves complètes avec photo d'identité passeport." },
              { icon: <Settings className="w-6 h-6 text-amber-500" />, t: "Configuration simple", d: "Ajoutez vos classes, matières et coefficients en quelques clics." }
            ].map((extra, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
                <div className="p-3 bg-white/5 rounded-xl inline-block">{extra.icon}</div>
                <h4 className="text-xs font-black uppercase tracking-wider">{extra.t}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">{extra.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight">
            Prêt à franchir le pas ?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
            Activez votre portail et commencez à digitaliser votre école dès aujourd'hui.
          </p>
          <button 
            onClick={() => navigate('/creer-compte')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Démarrer mon essai de 60 jours
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
