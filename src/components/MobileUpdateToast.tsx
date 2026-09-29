import React, { useEffect, useState } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { APK_VERSION, APK_REQUIRES_REINSTALL } from '../data/mobileApp';

const STORAGE_KEY = `dghub_mobile_update_seen_${APK_VERSION}`;

const isNativeApp = () => {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
};

const alreadySeen = () => {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};

export const MobileUpdateToast: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNativeApp() || alreadySeen()) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* stockage indisponible */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-4 right-4 left-4 sm:left-auto z-[95] sm:w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 animate-slideLeft"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 bg-amber-500/10 text-amber-500 rounded-xl">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            Nouvelle version de l'app mobile ({APK_VERSION})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Elle inclut les dernières nouveautés (reçus A5, suppression de paiements, traçabilité des encaissements…).
            {APK_REQUIRES_REINSTALL && ' Désinstallez l\'ancienne application avant d\'installer celle-ci.'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <a
              href="/fr/telecharger-app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </a>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
