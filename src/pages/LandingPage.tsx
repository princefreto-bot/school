// ============================================================
// PAGE D'ACCUEIL SAAS — Style Brutaliste Épuré & Bords Droits
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Statistiques de la plateforme (KPIs chiffrés réels)
  const stats = [
    { value: "+120", label: "Écoles et lycées partenaires" },
    { value: "+45,000", label: "Élèves inscrits et gérés" },
    { value: "+150,000", label: "Bulletins scolaires édités" },
    { value: "99.9%", label: "Taux de disponibilité réseau" },
  ];

  // Fonctionnalités principales (Bento Grid)
  const features = [
    {
      icon: <CreditCard className="w-8 h-8 text-amber-500" />,
      title: "Suivi des Paiements & Caisse",
      description: "Suivez les tranches de scolarité et les impayés de chaque élève. Enregistrez les règlements et générez des reçus de caisse numériques automatiques.",
      badge: "Comptabilité",
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800 rounded-3xl"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-amber-500" />,
      title: "Bulletins & Notes",
      description: "Génération automatique des bulletins scolaires en un clic. Calcul des moyennes et classement des élèves sans aucun tableur Excel.",
      badge: "Bulletins PDF",
      className: "bg-white text-slate-800 border-slate-200 rounded-3xl"
    },
    {
      icon: <Users className="w-8 h-8 text-amber-500" />,
      title: "Suivi des parents d'élèves",
      description: "Un espace mobile simplifié pour les parents. Ils consultent les notes, les absences et l'assiduité sans avoir à se déplacer.",
      badge: "Portail mobile",
      className: "bg-white text-slate-800 border-slate-200 rounded-3xl"
    },
    {
      icon: <QrCode className="w-8 h-8 text-amber-500" />,
      title: "Cartes scolaires à QR Code",
      description: "Générez et imprimez des cartes scolaires officielles. Scannez le QR Code à l'entrée et à la sortie pour enregistrer automatiquement la présence de l'élève.",
      badge: "Sécurité d'accès",
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
        <nav className="max-w-7xl mx-auto flex items-center justify-between p-4 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl uppercase select-none">
            <img src="/logo.jpeg" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
          </div>

          {/* Liens Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-500">
            <button onClick={() => navigate('/features')} className="hover:text-amber-500 transition-colors cursor-pointer">Fonctionnalités</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-amber-500 transition-colors cursor-pointer">Tarification</button>
            <button onClick={() => navigate('/a-propos')} className="hover:text-amber-500 transition-colors cursor-pointer">À Propos</button>
            <a href="#stats" className="hover:text-amber-500 transition-colors">Preuve Sociale</a>
          </div>

          {/* Boutons Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-amber-500 transition-colors px-4 py-2"
            >
              Connexion
            </button>
            <button 
              onClick={() => navigate('/creer-compte')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Créer un établissement
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
              onClick={() => { setMobileMenuOpen(false); navigate('/features'); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              Fonctionnalités
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              Tarification
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate('/a-propos'); }}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2 text-left cursor-pointer"
            >
              À Propos
            </button>
            <a 
              href="#stats" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2"
            >
              Preuve Sociale
            </a>
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full text-center py-3 text-sm font-black uppercase tracking-wider text-slate-700 border border-slate-200 rounded-xl"
              >
                Connexion
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/creer-compte'); }}
                className="w-full text-center py-3 text-sm font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded-xl border border-amber-600 shadow-md"
              >
                Créer un établissement
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION HERO ──────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 text-center flex-grow flex flex-col items-center justify-center">
        {/* Titre Principal */}
        <h1 className="text-3xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] max-w-4xl uppercase mb-6">
          Pilotez votre <span className="text-amber-500 underline decoration-2 decoration-amber-500/50">établissement scolaire</span> en toute simplicité
        </h1>

        {/* Sous-titre */}
        <p className="text-sm md:text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
          Gerez la caisse et le suivi de la scolarité, éditez les bulletins de notes officiels, suivez les présences par QR Code et donnez accès à des ressources scolaires gratuites pour les révisions à la maison.
        </p>

        {/* Actions Hero */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <button 
            onClick={() => navigate('/creer-compte')}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Créer un établissement gratuitement
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-slate-200 active:scale-[0.98] transition-all cursor-pointer"
          >
            Accéder aux portails
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
              alt="Tableau de bord en temps réel (établissement masqué)" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>

      {/* ── SECTION APERÇUS RÉELS (SCREENSHOTS) ────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            📸 Captures d'Écran Officielles
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">
            Découvrez nos fonctionnalités clés en images
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
            Une interface épurée, performante et adaptée aux besoins réels des écoles d'Afrique de l'Ouest.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Cartes Scolaires */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                Sécurité & QR Code
              </span>
              <h4 className="text-lg font-black text-slate-950 uppercase">Cartes Scolaires Bien Visibles</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Générez et imprimez des cartes d'identité officielles pour vos élèves avec une photo passeport et un QR Code unique pour l'enregistrement automatique des présences.
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
              <h4 className="text-lg font-black text-slate-950 uppercase">Bulletins de Notes bien Remplis</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Calcul automatique des moyennes trimestrielles/semestrielles, rangs, appréciations des enseignants et signature de la direction. Prêt à être imprimé ou partagé en lot.
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
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">Fonctionnalités Clés</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              Tout ce dont vous avez besoin, réuni au même endroit
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              Simplifiez la scolarité de vos élèves et offrez aux parents et aux enseignants une expérience moderne.
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
                  <p className="text-xs md:text-sm opacity-80 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION STATS / PRUVE SOCIALE ─────────────────── */}
      <section id="stats" className="bg-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight block">
                  {stat.value}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <hr className="max-w-4xl mx-auto border-slate-100 my-16" />

          {/* Citation / Témoignage */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-3xl text-amber-500 font-serif leading-none">“</div>
            <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed italic">
              "Grâce à DGhubSchool, nous avons réduit de 85% le taux de retard de paiement des frais de scolarité. Les parents adorent recevoir instantanément leur reçu numérique par SMS sans avoir à faire la queue à l'école."
            </p>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900">M. Koffi Mensah</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Directeur d'Établissement Scolaire à Lomé, Togo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION PRICING ────────────────────────────────── */}
      <section id="pricing" className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">Tarifs Transparent</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight uppercase">
              Tarifs clairs et adaptés
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              Commencez sans engagement dès aujourd'hui.
            </p>
          </div>

          {/* Card Pricing */}
          <div className="max-w-sm mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden">
            {/* Populaire badge */}
            <div className="absolute top-4 right-[-32px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-10 text-center select-none">
              Essai Gratuit
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Formule Unique</h4>
              <span className="text-4xl font-black tracking-tight text-slate-950">60 Jours d'essai</span>
              <p className="text-xs text-slate-500 mt-2">Puis un abonnement annuel adapté aux effectifs de votre école.</p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Gestion de la caisse et reçus SMS</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Bulletins et notes illimités</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Accès complet parents, élèves et profs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Support dédié via WhatsApp</span>
              </li>
            </ul>

            <button 
              onClick={() => navigate('/creer-compte')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl border border-amber-600 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Démarrer l'essai gratuit
            </button>
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
                Prêt à simplifier la gestion de votre école ?
              </h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                Rejoignez les établissements d'Afrique de l'Ouest qui font confiance à notre plateforme pour leur scolarité et leurs encaissements.
              </p>
              <button 
                onClick={() => navigate('/creer-compte')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                Créer un compte établissement
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 text-slate-400 font-medium text-xs select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Droits */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-sm uppercase">
              <img src="/logo.jpeg" className="w-6 h-6 object-contain" alt="Logo" />
              <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
            </div>
            <p className="text-[10px]">© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          </div>

          {/* Mentions et liens */}
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-wider">
            <a href="/#/features" className="hover:text-amber-500 transition-colors">Fonctionnalités</a>
            <a href="/#/pricing" className="hover:text-amber-500 transition-colors">Tarifs</a>
            <a href="/#/a-propos" className="hover:text-amber-500 transition-colors">À Propos</a>
            <a href="/#/conditions-utilisation" target="_blank" className="hover:text-amber-500 transition-colors">CGU</a>
            <a href="/#/confidentialite" target="_blank" className="hover:text-amber-500 transition-colors">Confidentialité</a>
            <a href="mailto:contact@dghubschool.com" className="hover:text-amber-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
