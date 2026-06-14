import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflinePageProps {
  onRetry?: () => void;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({ onRetry }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-8 text-center shadow-lg">
        
        {/* Icône Déconnectée */}
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-none flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
          <WifiOff className="w-10 h-10" />
        </div>

        {/* Code d'erreur / Titre */}
        <h1 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-wider mb-2">
          Erreur 404
        </h1>
        
        {/* Message principal */}
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 leading-snug">
          Oups ! Vous n'êtes pas connecté à Internet.
        </p>

        {/* Message secondaire */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          L'accès à DGhubSchool nécessite une connexion active pour synchroniser les données scolaires et financières en temps réel. Veuillez vérifier votre Wi-Fi ou vos données mobiles.
        </p>

        {/* Bouton de reconnexion */}
        <button
          onClick={handleRetry}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-none border border-amber-600 transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer la connexion
        </button>

      </div>
    </div>
  );
};
