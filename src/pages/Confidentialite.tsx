import React from 'react';
import { Shield, ArrowLeft, GraduationCap, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const Confidentialite: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500/20">
      
      {/* Barre de navigation supérieure (pleine largeur, bords droits) */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href="/#/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-none transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
          </a>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Version 2.0 — Active</span>
          </div>
        </div>
      </div>

      {/* En-tête (Pleine largeur, bande contrastée) */}
      <div className="w-full bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center relative">
          <div className="w-16 h-16 bg-amber-500 rounded-none flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/10 mb-6 border border-amber-600">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h1 className="text-3.5xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight uppercase">
            Politique de <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-600">Confidentialité</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">
            DGhubSchool — Gestion & Scolarité
          </p>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-6 max-w-2xl leading-relaxed">
            Chez DGhubSchool, nous accordons une importance primordiale à la protection et à la confidentialité des données personnelles des élèves, des parents et du personnel d'établissement.
          </p>
        </div>
      </div>

      {/* Corps - Bandes horizontales alternées (style Figma / Stitch) */}
      <div className="w-full">
        
        {/* Section 1 - Fond Blanc */}
        <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center border border-amber-500/25">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">1. Nature des Données Collectées</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Dans le cadre de la gestion académique et financière de votre établissement, nous collectons les informations nécessaires à la scolarisation :
            </p>
            
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-sm pl-4 list-disc marker:text-amber-500">
              <li><strong>Élèves</strong> : Noms, prénoms, date de naissance, classe, notes, relevés de présence et documents officiels numérisés (actes de naissance, bulletins scolaires antérieurs).</li>
              <li><strong>Parents</strong> : Noms, numéros de téléphone (utilisés pour les alertes push et notifications de paiement), statut des cotisations financières.</li>
              <li><strong>Personnel</strong> : Noms, rôles d'accès au système de l'école.</li>
            </ul>
          </div>
        </div>

        {/* Section 2 - Fond Gris Clair */}
        <div className="w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center border border-amber-500/25">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">2. Finalité des Traitements</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Ces données sont exclusivement traitées pour assurer le bon fonctionnement administratif et pédagogique :
            </p>
            
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-sm pl-4 list-disc marker:text-amber-500">
              <li>Le suivi financier, la facturation des frais scolaires et l'édition de reçus de paiement sécurisés.</li>
              <li>La saisie et l'édition des bulletins et relevés de notes.</li>
              <li>La numérisation sécurisée des dossiers des élèves via l'outil scanner.</li>
              <li>L'envoi d'alertes instantanées (notifications push d'absences, d'événements scolaires ou de reçus financiers) aux comptes de parents associés.</li>
            </ul>
          </div>
        </div>

        {/* Section 3 - Fond Blanc */}
        <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center border border-amber-500/25">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">3. Sécurité et Hébergement</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Toutes les données sont stockées et sécurisées à l'aide de protocoles stricts :
            </p>
            
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-sm pl-4 list-disc marker:text-amber-500">
              <li>Les bases de données sont gérées via **Supabase** et sont cryptées au repos et en transit via HTTPS/SSL.</li>
              <li>Les documents numérisés (actes de naissance, bulletins archivés) sont enregistrés dans un stockage privé sécurisé et ne sont accessibles qu'aux comptes autorisés.</li>
              <li>Un système d'authentification robuste (Jetons JWT sécurisés) empêche toute consultation non autorisée des données des élèves.</li>
            </ul>
          </div>
        </div>

        {/* Section 4 - Fond Gris Clair */}
        <div className="w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center border border-amber-500/25">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">4. Partage et Droits</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              **Aucune donnée n'est cédée, vendue ou louée à des tiers à des fins publicitaires ou marketing.** 
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et d'effacement de vos informations. Pour toute demande de modification ou suppression, vous pouvez contacter directement la direction de l'établissement scolaire.
            </p>
          </div>
        </div>

      </div>

      {/* Footer (Pleine largeur, fond sombre contrasté ou neutre) */}
      <div className="w-full bg-white dark:bg-slate-900 py-12 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          <p className="flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Plateforme scolaire sécurisée et conforme aux directives de protection des données de l'enfance.
          </p>
        </div>
      </div>

    </div>
  );
};
