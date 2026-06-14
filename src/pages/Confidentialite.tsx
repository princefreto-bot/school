import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Eye, Lock, Camera, Server, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Confidentialite = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  const handleBack = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const sections = [
    {
      icon: <Camera className="w-5 h-5 text-amber-500" />,
      title: "Utilisation de l'appareil photo",
      content: "L'application requiert l'autorisation d'accéder à l'appareil photo de votre smartphone uniquement dans le but de numériser les documents officiels de vos élèves (actes de naissance, anciens bulletins, certificats). Aucune photo n'est prise à votre insu ou stockée dans votre galerie personnelle de manière permanente."
    },
    {
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
      title: "Sécurité & Stockage des documents",
      content: "Une fois numérisés sous forme de PDF, les documents sont immédiatement téléversés sur nos serveurs hautement sécurisés via des connexions cryptées HTTPS SSL. Les données sont hébergées dans un espace cloud protégé et ne sont accessibles qu'aux administrateurs d'établissement autorisés et aux parents légitimes des élèves concernés."
    },
    {
      icon: <Eye className="w-5 h-5 text-emerald-500" />,
      title: "Respect de la vie privée",
      content: "SchoolFinance s'engage à ne jamais vendre, louer ou partager les documents scolaires ou données personnelles des élèves à des entreprises tierces. Les données d'authentification et les scans restent strictement confinés au cadre de la gestion académique et financière de votre établissement scolaire."
    },
    {
      icon: <Server className="w-5 h-5 text-rose-500" />,
      title: "Hébergement & Droits d'accès",
      content: "Conformément à la réglementation sur la protection des données, vous conservez un droit permanent d'accès, de modification et de suppression des documents scolaires de vos enfants. Les administrateurs scolaires peuvent détruire définitivement tout fichier stocké depuis leur console d'administration."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors duration-300">
      
      {/* Navbar Minimaliste */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          <span className="font-black text-sm text-slate-800 dark:text-white tracking-tight">SchoolFinance Security</span>
        </div>
      </header>

      {/* Corps principal */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 space-y-10 animate-slideUp">
        
        {/* En-tête principal */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 bg-amber-500/10 text-amber-500 rounded-[24px] items-center justify-center shadow-inner mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Charte de Confidentialité
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto font-medium leading-relaxed">
            Chez SchoolFinance, la sécurité des dossiers scolaires et le respect de la vie privée des élèves sont nos priorités absolues.
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Dernière mise à jour : Juin 2026
          </p>
        </div>

        {/* Section explications des "slashes" */}
        <div className="p-6 rounded-2xl border border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/30 dark:bg-indigo-950/10 space-y-3">
          <h3 className="font-black text-sm text-indigo-900 dark:text-indigo-400 tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4" /> Accès et transparence de l'application
          </h3>
          <p className="text-xs text-indigo-950/70 dark:text-slate-300 leading-relaxed font-semibold">
            Cette page dispose d'une URL publique directe (`/#/confidentialite`) permettant à nos utilisateurs, ainsi qu'aux validateurs des magasins d'applications Google Play et Apple App Store, de vérifier nos engagements de sécurité à tout moment et en toute transparence, sans nécessiter de compte d'accès préalable.
          </p>
        </div>

        {/* Grille de sections explicatives */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:border-slate-200 dark:hover:border-slate-800 transition duration-300"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex-shrink-0">
                {section.icon}
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{section.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton de consentement final */}
        <div className="text-center pt-4">
          <button 
            onClick={handleBack}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Check className="w-4 h-4" /> J'ai compris, fermer
          </button>
        </div>

      </main>

      {/* Footer minimal */}
      <footer className="border-t border-slate-100 dark:border-slate-900 py-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        © 2026 SchoolFinance. Tous droits réservés.
      </footer>

    </div>
  );
};
