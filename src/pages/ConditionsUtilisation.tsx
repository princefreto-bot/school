import React from 'react';
import { Shield, ArrowLeft, GraduationCap, FileText, CheckCircle, HelpCircle } from 'lucide-react';

export const ConditionsUtilisation: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500/20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <a
            href="/#/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-none transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
          </a>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Version 2.0 — Active</span>
          </div>
        </div>

        {/* En-tête (Pas d'arrondis - rounded-none) */}
        <div className="p-8 md:p-12 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-none shadow-sm text-center flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 bg-amber-500 rounded-none flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/10 mb-6 border border-amber-600">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight max-w-lg uppercase">
            Conditions Générales <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-600">d'Utilisation</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">
            DGhubSchool — Contrat de Service
          </p>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 max-w-xl leading-relaxed">
            Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme de gestion scolaire DGhubSchool par les établissements scolaires, les parents d'élèves et le personnel administratif.
          </p>
        </div>

        {/* Corps de la charte - Sections horizontales plates (style Figma) */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-none space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">1. Acceptation des Conditions</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              En cochant la case d'acceptation lors de la création de votre compte, vous acceptez expressément et sans réserve l'intégralité des présentes conditions d'utilisation. Si vous agissez au nom d'un établissement scolaire, vous garantissez disposer des pouvoirs nécessaires pour l'engager juridiquement.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-none space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">2. Accès à la Plateforme et Sécurité</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              L'établissement et les parents s'engagent à fournir des informations réelles et à jour (noms, numéros de téléphone et e-mails réels). L'utilisateur est seul responsable de la confidentialité de son mot de passe et de son identifiant d'accès. Tout accès non autorisé doit être immédiatement signalé à l'administration de DGhubSchool.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-none space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">3. Obligations de l'Établissement</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              L'établissement scolaire s'engage à utiliser la plateforme dans le respect de la législation en vigueur relative à la protection des données personnelles de l'enfance. L'école est responsable de la validité et de la légalité des documents téléchargés ou scannés (actes de naissance, reçus financiers, photos d'élèves).
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-none space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-none flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">4. Résiliation et Suspension</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              En cas de non-respect des présentes conditions ou de défaut de règlement des abonnements après la période d'essai gratuite, l'administration de DGhubSchool se réserve le droit de suspendre temporairement ou définitivement l'accès à la plateforme pour l'établissement concerné.
            </p>
          </div>

        </div>

        {/* Footer légal */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-y-2 py-6 border-t border-slate-200/60 dark:border-slate-800">
          <p>© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          <p className="flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Plateforme scolaire sécurisée et conforme aux directives de protection des données de l'enfance.
          </p>
        </div>

      </div>
    </div>
  );
};
