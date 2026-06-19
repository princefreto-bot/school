import React, { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Un petit délai pour une apparition plus douce
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[1000] p-4 font-['Poppins'] animate-slide-up">
      <div className="max-w-5xl mx-auto bg-slate-900 text-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Cookie className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Votre vie privée nous importe</h3>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              Nous utilisons des cookies essentiels pour assurer le bon fonctionnement de notre plateforme (sécurité, session) 
              et des cookies analytiques pour améliorer votre expérience. Acceptez-vous l'utilisation des cookies ?
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 relative">
          <button 
            onClick={declineCookies}
            className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition-all active:scale-95 w-full sm:w-auto text-sm"
          >
            Refuser
          </button>
          <button 
            onClick={acceptCookies}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 w-full sm:w-auto text-sm"
          >
            Accepter tout
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-12 -right-2 md:hidden text-slate-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
