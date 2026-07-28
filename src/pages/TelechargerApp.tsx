// ============================================================
// PAGE APP MOBILE — APK direct + PWA install
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Smartphone, Download, ArrowLeft, ShieldCheck, Wifi,
  CheckCircle2, AlertTriangle, Globe, Share2, Sparkles
} from 'lucide-react';
import { Footer } from '../components/Footer';

// ── Mockup téléphone incliné avec splash screen (logo centré) ─
type Variant = 'dark' | 'amber' | 'light';

interface PhoneMockupProps {
  variant?: Variant;
  rotate: string;
  translateY?: string;
  className?: string;
  scale?: string;
  zIndex?: number;
  showTime?: boolean;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({
  variant = 'dark',
  rotate,
  translateY = '0',
  className = '',
  scale = '1',
  zIndex = 1,
  showTime = false
}) => {
  const screenBg = {
    dark: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    amber: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
    light: 'bg-gradient-to-br from-white via-slate-50 to-slate-100'
  }[variant];

  const titleColor = variant === 'light' ? 'text-slate-900' : 'text-white';
  const subColor = variant === 'light' ? 'text-slate-500' : 'text-white/70';

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `rotate(${rotate}) translateY(${translateY}) scale(${scale})`,
        zIndex,
        filter: 'drop-shadow(0 30px 40px rgba(15, 23, 42, 0.35))'
      }}
    >
      {/* Cadre téléphone */}
      <div className="relative bg-slate-950 rounded-[2.5rem] p-2 shadow-2xl">
        {/* Encoche (notch) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-950 w-24 h-6 rounded-b-2xl z-20" />
        {/* Écran */}
        <div className={`relative w-56 sm:w-64 h-[440px] sm:h-[500px] rounded-[2rem] overflow-hidden border-2 border-slate-800 ${screenBg} flex flex-col items-center justify-center`}>
          {/* Status bar simulée */}
          {showTime && (
            <div className={`absolute top-2 left-0 right-0 px-6 flex justify-between items-center text-[9px] font-black tracking-widest ${variant === 'light' ? 'text-slate-700' : 'text-white'}`}>
              <span>09:41</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded-sm border border-current" />
                <span className="w-3 h-2 rounded-sm border border-current bg-current" />
              </span>
            </div>
          )}

          {/* Logo centré */}
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${variant === 'amber' ? 'bg-white/20 backdrop-blur-md' : 'bg-white shadow-2xl'}`}>
              <img src="/logo.png" alt="Logo DGhubSchool" className="w-16 h-16 object-contain" />
            </div>
            <div className={`font-black text-xl tracking-tighter ${titleColor}`}>
              DGhub<span className="text-amber-400">School</span>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${subColor}`}>
              Gestion Scolaire
            </div>
          </div>

          {/* Bas d'écran : indicateur home + loader style */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${variant === 'light' ? 'border-amber-500' : 'border-white/40'}`} style={{ borderTopColor: 'transparent' }} />
            <div className={`h-1 w-24 rounded-full ${variant === 'light' ? 'bg-slate-900/40' : 'bg-white/40'}`} />
          </div>

          {/* Reflet subtil */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.06) 100%)'
            }}
          />
        </div>
        {/* Boutons latéraux */}
        <div className="absolute right-[-3px] top-24 w-1 h-16 bg-slate-800 rounded-r-md" />
        <div className="absolute left-[-3px] top-20 w-1 h-8 bg-slate-800 rounded-l-md" />
        <div className="absolute left-[-3px] top-32 w-1 h-12 bg-slate-800 rounded-l-md" />
      </div>
    </div>
  );
};

// URL de l'APK à héberger. Deux options :
// 1) Fichier dans public/ → /downloads/dghubschool.apk (recommandé, servi statiquement)
// 2) GitHub Releases → https://github.com/.../releases/download/vX.Y.Z/app-release.apk
const APK_DOWNLOAD_URL = '/downloads/dghubschool.apk';
const APK_VERSION = '1.0.0';
const APK_SIZE = '~20 Mo';

const texts = {
  fr: {
    back: 'Accueil',
    badge: '📱 App Mobile Android',
    title: "Installez l'app DGhubSchool sur votre téléphone",
    subtitle: "Deux façons d'installer — choisissez celle qui vous convient. Aucun compte Google Play requis.",
    apkTitle: '1. Télécharger l\'APK Android',
    apkDesc: 'Version officielle signée. Installation en 30 secondes.',
    apkBtn: 'Télécharger le fichier APK',
    apkMeta: `Version ${APK_VERSION} · ${APK_SIZE} · Android 7+`,
    qrHint: 'Scannez ce QR code depuis votre téléphone',
    stepsTitle: 'Étapes pour installer l\'APK',
    step1: 'Cliquez sur « Télécharger l\'APK » ci-dessus.',
    step2: 'Une fois le fichier téléchargé, ouvrez-le depuis votre gestionnaire de fichiers ou la barre de notification.',
    step3: 'Autorisez l\'installation d\'applications de cette source si Android le demande (une seule fois).',
    step4: 'Cliquez sur « Installer » puis « Ouvrir ». L\'icône DGhubSchool apparaît sur votre écran d\'accueil.',
    safetyTitle: 'Est-ce sûr ?',
    safetyDesc: 'Oui. L\'APK est signé par DGhubSchool et hébergé sur notre propre site. Aucune donnée n\'est envoyée à des tiers.',
    pwaTitle: '2. Installer depuis le navigateur (PWA)',
    pwaDesc: 'Pas envie de télécharger un fichier ? Vous pouvez installer l\'app directement depuis Chrome, Edge ou Samsung Internet en 1 clic.',
    pwaSteps: [
      'Ouvrez www.dghubschool.com dans Chrome sur votre téléphone.',
      'Ouvrez le menu (⋮ en haut à droite).',
      'Choisissez « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».'
    ],
    pwaTip: 'Sur iPhone : ouvrez Safari, appuyez sur le bouton Partager puis « Sur l\'écran d\'accueil ».',
    reqTitle: 'Besoin d\'une version iPhone / iPad ?',
    reqDesc: "L'app iOS n'est pas encore publiée sur l'App Store. En attendant, utilisez l'installation PWA depuis Safari — vous aurez la même expérience.",
    supportTitle: 'Une question, un problème ?',
    supportDesc: "Contactez-nous à support@dghubschool.com ou par WhatsApp au +228 72 47 30 27."
  },
  en: {
    back: 'Home',
    badge: '📱 Android Mobile App',
    title: 'Install the DGhubSchool app on your phone',
    subtitle: 'Two ways to install — pick the one that suits you. No Google Play account required.',
    apkTitle: '1. Download the Android APK',
    apkDesc: 'Official signed release. Installs in 30 seconds.',
    apkBtn: 'Download the APK file',
    apkMeta: `Version ${APK_VERSION} · ${APK_SIZE} · Android 7+`,
    qrHint: 'Scan this QR code from your phone',
    stepsTitle: 'Steps to install the APK',
    step1: 'Click "Download the APK" above.',
    step2: 'Once downloaded, open the file from your file manager or the notification bar.',
    step3: 'Allow installation from this source if Android asks (only the first time).',
    step4: 'Tap "Install" then "Open". The DGhubSchool icon will appear on your home screen.',
    safetyTitle: 'Is it safe?',
    safetyDesc: 'Yes. The APK is signed by DGhubSchool and hosted on our own site. No data is sent to third parties.',
    pwaTitle: '2. Install from the browser (PWA)',
    pwaDesc: "Don't feel like downloading a file? You can install the app directly from Chrome, Edge or Samsung Internet in 1 click.",
    pwaSteps: [
      'Open www.dghubschool.com in Chrome on your phone.',
      'Open the menu (⋮ top right).',
      'Choose "Install app" or "Add to Home screen".'
    ],
    pwaTip: 'On iPhone: open Safari, tap Share then "Add to Home Screen".',
    reqTitle: 'Need an iPhone / iPad version?',
    reqDesc: "The iOS app is not yet published on the App Store. In the meantime, use the PWA install from Safari — you'll get the same experience.",
    supportTitle: 'A question or an issue?',
    supportDesc: 'Contact us at support@dghubschool.com or on WhatsApp at +228 72 47 30 27.'
  }
};

export const TelechargerApp: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const t = texts[lang];
  const [origin, setOrigin] = useState('https://dghubschool.com');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const apkAbsoluteUrl = `${origin}${APK_DOWNLOAD_URL}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['Poppins'] flex flex-col">
      <header className="relative z-50 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
            <img src="/logo.svg" className="w-8 h-8 object-contain rounded-lg" alt="Logo DGhubSchool" />
            <span className="text-amber-500">DGhub<span className="text-slate-900 dark:text-white">School</span></span>
          </div>
          <button
            onClick={() => navigate(`/${lang}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </nav>
      </header>

      {/* ── HERO IMMERSIF : Fond gradient + mockups téléphones inclinés ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pt-14 md:pt-20 pb-16 md:pb-24">
        {/* Halos décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-4 items-center">
          {/* Colonne texte */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              {t.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-5 leading-[0.95]">
              <span className="bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                {t.title}
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto md:mx-0 font-medium mb-8">
              {t.subtitle}
            </p>

            {/* CTA hero */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start items-center">
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-sm px-6 py-4 rounded-xl shadow-2xl shadow-amber-500/40 transition-all active:scale-95 hover:scale-105"
              >
                <Download className="w-5 h-5" />
                {t.apkBtn}
              </a>
              <a
                href="#pwa-install"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black uppercase tracking-widest text-xs px-5 py-4 rounded-xl transition-all"
              >
                <Globe className="w-4 h-4" />
                {t.pwaTitle.replace(/^\d+\.\s*/, '')}
              </a>
            </div>

          </div>

          {/* Colonne mockups téléphones — splash screens en 3 variantes */}
          <div className="relative h-[480px] sm:h-[560px] flex items-center justify-center perspective-1000">
            {/* Téléphone arrière-gauche : variant clair */}
            <div className="absolute left-0 sm:left-4 top-8 opacity-95">
              <PhoneMockup
                variant="light"
                rotate="-14deg"
                translateY="20px"
                scale="0.85"
                zIndex={1}
              />
            </div>
            {/* Téléphone arrière-droit : variant amber (brand) */}
            <div className="absolute right-0 sm:right-4 top-16 opacity-95">
              <PhoneMockup
                variant="amber"
                rotate="12deg"
                translateY="30px"
                scale="0.82"
                zIndex={1}
              />
            </div>
            {/* Téléphone central : variant dark, en avant, avec status bar */}
            <div className="relative">
              <PhoneMockup
                variant="dark"
                rotate="-3deg"
                zIndex={5}
                showTime
              />
            </div>
          </div>
        </div>

        {/* Bandeau scroll hint */}
        <div className="relative text-center mt-10 md:mt-12">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            ↓ 2 méthodes d'installation ci-dessous ↓
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 md:py-16">

        {/* Option 1 : APK */}
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-xl shadow-amber-500/10 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase">
                  {t.apkTitle}
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                {t.apkDesc}
              </p>

              <a
                href={APK_DOWNLOAD_URL}
                download
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-sm px-6 py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                {t.apkBtn}
              </a>
            </div>

            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeCanvas value={apkAbsoluteUrl} size={160} level="M" bgColor="#FFFFFF" fgColor="#0F172A" />
              </div>
              <p className="text-[11px] text-slate-500 font-bold text-center mt-3 uppercase tracking-widest">
                {t.qrHint}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono break-all text-center">
                {apkAbsoluteUrl}
              </p>
            </div>
          </div>

          {/* Étapes */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{t.stepsTitle}</h3>
            <ol className="space-y-3">
              {[t.step1, t.step2, t.step3, t.step4].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Safety */}
          <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">{t.safetyTitle}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">{t.safetyDesc}</p>
            </div>
          </div>
        </div>

        {/* Option 2 : PWA */}
        <div id="pwa-install" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-8 scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase">
              {t.pwaTitle}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
            {t.pwaDesc}
          </p>
          <ol className="space-y-2 mb-4">
            {t.pwaSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{step}</span>
              </li>
            ))}
          </ol>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 flex items-start gap-2">
            <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">{t.pwaTip}</p>
          </div>
        </div>

        {/* iOS notice */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 flex items-start gap-3 mb-8">
          <div className="w-9 h-9 shrink-0 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800 dark:text-amber-300">{t.reqTitle}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">{t.reqDesc}</p>
          </div>
        </div>

        {/* Support */}
        <div className="text-center bg-slate-900 dark:bg-slate-800 rounded-2xl p-6">
          <div className="w-10 h-10 mx-auto mb-3 bg-white/10 rounded-xl flex items-center justify-center">
            <Wifi className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm font-black text-white">{t.supportTitle}</p>
          <p className="text-xs text-slate-400 font-medium mt-2">{t.supportDesc}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TelechargerApp;
