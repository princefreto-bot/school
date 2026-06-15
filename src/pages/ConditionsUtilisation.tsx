import React from 'react';
import { ArrowLeft, Landmark, FileText, Shield, Key, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const ConditionsUtilisation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500/20 flex flex-col">
      
      {/* ── HEADER / NAVIGATION ── */}
      <header className="relative z-50 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0">
        <nav className="max-w-7xl mx-auto flex items-center justify-between p-4 md:px-8">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl uppercase select-none cursor-pointer"
          >
            <img src="/logo.jpeg" className="w-8 h-8 object-contain rounded-lg" alt="Logo" />
            <span className="text-amber-500">DGhubSchool</span>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'accueil
          </button>
        </nav>
      </header>

      {/* ── HERO HEADER (Style axazara.com) ── */}
      <section className="relative w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-xl space-y-4 text-left">
          <span className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            📄 Contrat de Service
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight uppercase">
            Conditions générales d'utilisation
          </h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Dernière mise à jour : 15 Juin 2026
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="w-full md:w-fit bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-[24px] shadow-sm max-w-sm flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left font-medium">
            L'utilisation du Service implique l'acceptation pleine et entière de ces conditions d'utilisation. Si vous agissez au nom d'un établissement scolaire, vous garantissez disposer des pouvoirs nécessaires pour l'engager juridiquement.
          </p>
        </div>
      </section>

      {/* ── LEGAL CONTENT SECTION ── */}
      <section className="bg-slate-50/50 dark:bg-slate-950 py-16 px-6 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Préambule */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Préambule
            </h2>
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                <strong>« Nous »</strong> se réfère à la plateforme <strong>DGhubSchool</strong>.
              </p>
              <p>
                <strong>« Le Service »</strong> désigne <strong>DGhubSchool</strong>, un logiciel de gestion scolaire et de suivi parental en tant que service (SaaS) accessible via Internet.
              </p>
              <p>
                Le service est proposé via internet en tant que "Software-as-a-Service". L'utilisation du service implique l'acceptation de ces termes et conditions.
              </p>
            </div>
          </div>

          {/* 1. Inscription et Accès */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                1. Accès à la Plateforme & Sécurité
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              L'accès au Service nécessite une inscription préalable. L'établissement et les parents s'engagent à fournir des informations réelles et à jour (noms, numéros de téléphone et e-mails réels). L'utilisateur est seul responsable de la confidentialité de son mot de passe et de son identifiant d'accès. Tout accès non autorisé doit être immédiatement signalé à notre support.
            </p>
          </div>

          {/* 2. Obligations de l'Utilisateur */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Landmark className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                2. Obligations de l'Établissement
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              L'établissement scolaire s'engage à utiliser la plateforme dans le respect de la législation en vigueur relative à la protection des données personnelles de l'enfance. L'école est responsable de la validité et de la légalité des documents téléchargés ou scannés (actes de naissance, reçus financiers, photos d'élèves).
            </p>
          </div>

          {/* 3. Tarification, Licences et Suspension */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                3. Tarification & Non-Paiement
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                L'utilisation de DGhubSchool pour les établissements et les parents est soumise à des frais de licence annuels conformément aux tarifs indiqués au sein du Service. 
              </p>
              <p className="p-3 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/25 rounded-xl text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ Afin de garantir l'équité, si un établissement dépasse sa limite d'élèves autorisée par son forfait, ou en cas de non-respect des règlements annuels après la période d'essai gratuite, l'accès complet à la plateforme sera automatiquement suspendu.
              </p>
            </div>
          </div>

          {/* 4. Disponibilité & Support */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                4. Maintenance & Support
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Bien que nous nous efforcions de maintenir une disponibilité continue (avec un objectif de 99.9% de disponibilité réseau), nous ne garantissons pas un accès ininterrompu. Le Service peut subir des opérations de maintenance. Notre équipe technique s'engage à assurer un support continu et à communiquer sur les interruptions à l'avance dans la mesure du possible.
            </p>
          </div>

        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
      
    </div>
  );
};
