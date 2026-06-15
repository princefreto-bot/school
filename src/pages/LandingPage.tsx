// ============================================================
// PAGE D'ACCUEIL SAAS — Style Brutaliste Épuré & Bords Droits
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  CreditCard, 
  BookOpen, 
  Users, 
  QrCode, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Check, 
  Menu, 
  X 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Statistiques de la plateforme
  const stats = [
    { value: "+50", label: "Établissements partenaires" },
    { value: "+10,000", label: "Élèves gérés au quotidien" },
    { value: "+15,000", label: "Paiements sécurisés" },
    { value: "99.9%", label: "Taux de disponibilité" },
  ];

  // Fonctionnalités principales (Bento Grid)
  const features = [
    {
      icon: <CreditCard className="w-8 h-8 text-amber-500" />,
      title: "Finance & Mobile Money",
      description: "Encaissez les frais de scolarité instantanément via Wave, T-Money, Flooz, MTN et Orange Money. Fini les files d'attente à la comptabilité et les reçus papier perdus.",
      badge: "Inédit en Afrique de l'Ouest",
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-amber-500" />,
      title: "Gestion Académique",
      description: "Bulletins scolaires automatisés en un clic, gestion des examens et saisie simplifiée des notes pour les enseignants.",
      badge: "Automatisé",
      className: "bg-white text-slate-800 border-slate-200"
    },
    {
      icon: <Users className="w-8 h-8 text-amber-500" />,
      title: "Espace Parents Intuitif",
      description: "Les parents suivent les notes, l'assiduité et paient la scolarité de leurs enfants directement sur mobile.",
      badge: "Portail Dédié",
      className: "bg-white text-slate-800 border-slate-200"
    },
    {
      icon: <QrCode className="w-8 h-8 text-amber-500" />,
      title: "Cartes Scolaires QR Code",
      description: "Générez des cartes d'identité scolaires dotées de QR Codes pour scanner instantanément les entrées/sorties et assurer la sécurité des élèves.",
      badge: "Sécurité",
      className: "md:col-span-2 bg-slate-900 text-white border-slate-800"
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
            <a href="#features" className="hover:text-amber-500 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-amber-500 transition-colors">Tarification</a>
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-none border border-amber-600 shadow-md active:scale-95 transition-all"
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
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2"
            >
              Fonctionnalités
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors py-2"
            >
              Tarification
            </a>
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
                className="w-full text-center py-3 text-sm font-black uppercase tracking-wider text-slate-700 border border-slate-200 rounded-none"
              >
                Connexion
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/creer-compte'); }}
                className="w-full text-center py-3 text-sm font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded-none border border-amber-600 shadow-md"
              >
                Créer un établissement
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION HERO ──────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-28 pb-16 text-center flex-grow flex flex-col items-center justify-center">
        {/* Badge Intro */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-none mb-6 animate-pulse">
          ⚡ 1ère plateforme de gestion scolaire en Afrique de l'Ouest
        </div>

        {/* Titre Principal */}
        <h1 className="text-3xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] max-w-4xl uppercase mb-6">
          Digitalisez la gestion de votre <span className="text-amber-500 underline decoration-2 decoration-amber-500/50">établissement scolaire</span>
        </h1>

        {/* Sous-titre */}
        <p className="text-sm md:text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
          DGhubSchool réunit en un seul outil les paiements des frais scolaires, les bulletins, la saisie des notes, les présences et la communication instantanée avec les parents.
        </p>

        {/* Actions Hero */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <button 
            onClick={() => navigate('/creer-compte')}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-none border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Créer un établissement gratuitement
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-none border border-slate-200 active:scale-[0.98] transition-all"
          >
            Accéder aux portails
          </button>
        </div>

        {/* Visual Mockup (Brutalist style) */}
        <div className="w-full max-w-5xl border border-slate-200 bg-slate-50 p-3 rounded-none shadow-2xl relative">
          <div className="w-full bg-slate-950 text-white rounded-none p-4 text-left font-mono text-xs flex items-center justify-between border-b border-slate-800 select-none">
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
          <div className="w-full aspect-[16/9] bg-white border-t border-slate-100 flex flex-col md:flex-row rounded-none overflow-hidden relative">
            {/* Sidebar Mockup */}
            <div className="w-full md:w-48 bg-slate-950 p-4 border-r border-slate-100 flex flex-col gap-4 text-slate-400 font-bold text-[9px] uppercase tracking-widest select-none">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                <img src="/logo.jpeg" className="w-6 h-6 object-contain" alt="" />
                <span className="text-white">DGhubSchool</span>
              </div>
              <div className="bg-amber-500/10 text-amber-500 px-3 py-2 rounded-none flex items-center gap-2 border border-amber-500/20">📊 Tableau de bord</div>
              <div className="px-3 py-2 flex items-center gap-2">👥 Gestion Élèves</div>
              <div className="px-3 py-2 flex items-center gap-2">💳 Frais & Scolarité</div>
              <div className="px-3 py-2 flex items-center gap-2">📝 Bulletins & Notes</div>
              <div className="px-3 py-2 flex items-center gap-2">📲 Notifications</div>
            </div>
            {/* Page content mockup */}
            <div className="flex-1 bg-slate-50 p-6 text-left overflow-hidden select-none">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Vue d'ensemble scolaire</h3>
                  <p className="text-[10px] text-slate-400">Statistiques en temps réel de votre école</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
                  ● Serveur Connecté
                </div>
              </div>
              
              {/* Widgets cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Frais Collectés</span>
                  <span className="text-lg font-black text-slate-900">4,820,000 F CFA</span>
                  <div className="text-[9px] font-bold text-emerald-500 mt-1">↑ +12% ce mois</div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Taux Présence</span>
                  <span className="text-lg font-black text-slate-900">96.8 %</span>
                  <div className="text-[9px] font-bold text-amber-500 mt-1">Stables aujourd'hui</div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Parents Actifs</span>
                  <span className="text-lg font-black text-slate-900">432 Connectés</span>
                  <div className="text-[9px] font-bold text-blue-500 mt-1">Via Web Push & SMS</div>
                </div>
              </div>

              {/* Transactions list mockup */}
              <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Derniers Paiements Mobile Money</h4>
                <div className="space-y-2.5 text-[9px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-bold text-slate-800">PARENT DE : Koffi Mensah</span>
                    <span className="bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 font-bold uppercase">T-Money</span>
                    <span className="font-black text-slate-950">45,000 F CFA</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-bold text-slate-800">PARENT DE : Amina Diallo</span>
                    <span className="bg-blue-100 border border-blue-200 text-blue-800 px-2 py-0.5 font-bold uppercase">Wave</span>
                    <span className="font-black text-slate-950">80,000 F CFA</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-bold text-slate-800">PARENT DE : Fofo Lawson</span>
                    <span className="bg-red-100 border border-red-200 text-red-800 px-2 py-0.5 font-bold uppercase">Flooz</span>
                    <span className="font-black text-slate-950">25,000 F CFA</span>
                  </div>
                </div>
              </div>
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
                className={`border p-6 md:p-8 rounded-none shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${feat.className}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-none inline-block">
                      {feat.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20">
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
              "Grâce à DGhubSchool, nous avons réduit de 85% le taux de retard de paiement des frais de scolarité. Les parents adorent pouvoir payer par T-Money ou Flooz sans avoir à se déplacer."
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
              Une tarification claire et adaptée
            </h3>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm">
              Commencez à digitaliser votre établissement dès aujourd'hui sans engagement.
            </p>
          </div>

          {/* Card Pricing */}
          <div className="max-w-sm mx-auto bg-white border border-slate-200 p-8 rounded-none shadow-xl relative overflow-hidden">
            {/* Populaire badge */}
            <div className="absolute top-4 right-[-32px] rotate-45 bg-amber-500 border-y border-amber-600 text-[8px] font-black uppercase tracking-widest text-slate-900 py-1.5 px-10 text-center select-none">
              Essai Gratuit
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Formule Unique</h4>
              <span className="text-4xl font-black tracking-tight text-slate-950">60 Jours Gratuit</span>
              <p className="text-xs text-slate-500 mt-2">Puis un abonnement annuel transparent basé sur la taille de votre école.</p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600 mb-8 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Paiements Mobile Money intégrés</span>
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-none border border-amber-600 shadow-md active:scale-95 transition-all"
            >
              Démarrer l'essai gratuit
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION FINAL CTA ────────────────────────────── */}
      <section className="bg-slate-950 text-white py-20 text-center relative border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none">
            Prêt à transformer votre établissement ?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-xs md:text-sm">
            Rejoignez les dizaines d'écoles qui ont déjà fait le pas vers une gestion moderne en Afrique de l'Ouest.
          </p>
          <button 
            onClick={() => navigate('/creer-compte')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-none border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2"
          >
            Créer un compte établissement
            <ArrowRight className="w-4 h-4" />
          </button>
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
            <a href="/#/conditions-utilisation" target="_blank" className="hover:text-amber-500 transition-colors">CGU</a>
            <a href="/#/confidentialite" target="_blank" className="hover:text-amber-500 transition-colors">Confidentialité</a>
            <a href="mailto:contact@dghubschool.com" className="hover:text-amber-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
