import React from 'react';
import { ArrowLeft, Eye, Lock, FileText, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const Confidentialite: React.FC = () => {
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
            🛡️ Protection des Données
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight uppercase">
            Politique de confidentialité
          </h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Dernière mise à jour : 15 Juin 2026
          </p>
        </div>

        {/* Highlight box */}
        <div className="w-full md:w-fit bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-[24px] shadow-sm max-w-sm flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left font-medium">
            Chez DGhubSchool, la protection de la vie privée des élèves et la sécurité des données financières et académiques sont fondamentales. Nous appliquons des protocoles d'isolation stricts pour chaque école.
          </p>
        </div>
      </section>

      {/* ── LEGAL CONTENT SECTION ── */}
      <section className="bg-slate-50/50 dark:bg-slate-950 py-16 px-6 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Introduction */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Introduction
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Chez DGhubSchool, nous accordons une importance primordiale à la protection et à la confidentialité des données personnelles des élèves, des parents et du personnel d'établissement. Cette charte détaille la manière dont nous collectons, gérons et sécurisons ces informations scolaires sensibles dans notre infrastructure multi-établissement isolée.
            </p>
          </div>

          {/* 1. Nature des Données Collectées */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                1. Nature des Données Collectées
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                Dans le cadre de la gestion académique et financière de votre établissement, nous collectons uniquement les informations nécessaires :
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li><strong>Élèves</strong> : Noms, prénoms, date de naissance, classe, notes, relevés de présence et documents officiels numérisés (actes de naissance, bulletins scolaires antérieurs).</li>
                <li><strong>Parents</strong> : Noms, numéros de téléphone (utilisés pour les alertes de présence par SMS et reçus de scolarité numériques).</li>
                <li><strong>Personnel</strong> : Noms, rôles d'accès au système de l'école (directeur, comptable, enseignant, surveillant).</li>
              </ul>
            </div>
          </div>

          {/* 2. Finalité des Traitements */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                2. Finalité des Traitements
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                Ces données sont exclusivement traitées pour assurer le bon fonctionnement administratif et pédagogique :
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li>Le suivi financier, la facturation des frais scolaires et l'édition de reçus de paiement sécurisés.</li>
                <li>La saisie des notes et l'édition automatique des bulletins et relevés de notes.</li>
                <li>La numérisation sécurisée des dossiers des élèves via l'outil scanner intégré.</li>
                <li>L'envoi d'alertes instantanées (notifications push et SMS d'absences ou de reçus financiers) aux parents.</li>
              </ul>
            </div>
          </div>

          {/* 3. Sécurité et Hébergement */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                3. Sécurité & Hébergement
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                Toutes les données sont stockées et sécurisées à l'aide de protocoles stricts de niveau professionnel :
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li>Les bases de données sont gérées via **Supabase** et sont cryptées au repos et en transit via HTTPS/SSL.</li>
                <li>Les documents numérisés (actes de naissance, bulletins archivés) sont enregistrés dans un stockage privé sécurisé et ne sont accessibles qu'aux comptes autorisés.</li>
                <li>Un système d'authentification robuste (Jetons JWT sécurisés) empêche toute consultation non autorisée des données des élèves.</li>
              </ul>
            </div>
          </div>

          {/* 4. Partage et Droits */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                4. Partage & Droits des Utilisateurs
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                <strong>Aucune donnée n'est cédée, vendue ou louée à des tiers à des fins publicitaires ou marketing.</strong>
              </p>
              <p>
                Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et d'effacement de vos informations. Pour toute demande de modification ou suppression, vous pouvez contacter directement la direction de l'établissement scolaire ou envoyer un email à notre service technique.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
      
    </div>
  );
};
