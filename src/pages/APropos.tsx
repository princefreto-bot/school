// ============================================================
// PAGE À PROPOS (ABOUT) — Modern, Premium, Rounded Borders
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, Heart, Users, Target } from 'lucide-react';

export const APropos: React.FC = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Target className="w-6 h-6 text-amber-500" />,
      title: "Notre Mission",
      desc: "Simplifier la gestion administrative des écoles d'Afrique de l'Ouest pour libérer du temps aux éducateurs et directeurs afin qu'ils se concentrent sur la pédagogie."
    },
    {
      icon: <Users className="w-6 h-6 text-amber-500" />,
      title: "Suivi Simple & Transparent",
      desc: "Permettre aux établissements d'enregistrer et de suivre facilement tous les règlements (espèces, chèques, virements) et de générer des reçus de caisse numériques instantanés pour les familles."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-500" />,
      title: "Sécurité & Transparence",
      desc: "Fournir un cadre robuste et transparent pour la gestion financière des établissements et le suivi sécurisé des élèves via QR Code."
    },
    {
      icon: <Heart className="w-6 h-6 text-amber-500" />,
      title: "Proximité locale",
      desc: "Accompagner personnellement chaque école partenaire avec un support direct sur le terrain et via WhatsApp au quotidien."
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
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          🌱 Notre Histoire
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-6">
          Repenser la gestion scolaire en Afrique de l'Ouest
        </h1>
        <p className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Né du constat des difficultés rencontrées par les parents pour régler la scolarité et par les administrations pour éditer les bulletins scolaires papier, DGhubSchool propose un écosystème moderne, simple et accessible.
        </p>
      </section>

      {/* Core Values Section */}
      <section className="relative z-10 bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">Nos Valeurs</h2>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase tracking-tight">
              Ce qui nous guide au quotidien
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm flex gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl h-fit shrink-0">
                  {val.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-2">
                    {val.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About The Platform Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight leading-snug">
              Un outil conçu pour le terrain scolaire africain
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Nous savons que les coupures de réseau et le manque de matériel informatique sont des réalités quotidiennes. C'est pourquoi DGhubSchool a été conçu pour être extrêmement léger et utilisable directement depuis n'importe quel smartphone.
            </p>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              De l'enregistrement d'un règlement de scolarité à la validation des sorties d'élèves par scan QR code, chaque action prend moins de 3 secondes.
            </p>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3">
              DGhubSchool en quelques chiffres
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">+120</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Écoles partenaires</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">+45k</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Élèves enregistrés</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">99.9%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilité API</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">24/7</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Support technique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 text-white py-16 text-center relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 space-y-6 relative z-10">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-snug">
            Rejoignez l'aventure DGhubSchool
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Profitez de notre essai gratuit de 60 jours pour tester la plateforme avec vos élèves et vos professeurs.
          </p>
          <button 
            onClick={() => navigate('/creer-compte')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Créer mon compte établissement
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10 text-slate-400 font-medium text-[10px] select-none uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-sm uppercase">
              <img src="/logo.jpeg" className="w-6 h-6 object-contain" alt="Logo" />
              <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
            </div>
            <p className="text-[9px]">© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          </div>
          <div className="flex gap-6 font-black">
            <a href="/#/conditions-utilisation" className="hover:text-amber-500 transition-colors">CGU</a>
            <a href="/#/confidentialite" className="hover:text-amber-500 transition-colors">Confidentialité</a>
            <a href="mailto:contact@dghubschool.com" className="hover:text-amber-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
