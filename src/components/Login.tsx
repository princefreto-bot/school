// ============================================================
// PAGE DE CONNEXION — Slideshow + Logo dynamique
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Register } from './Register';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, AlertCircle, UserPlus } from 'lucide-react';

// ── Images de fond du slideshow (importées comme modules Vite) ─
import bgImage1 from '../assets/login-bg1.jpg';
import bgImage2 from '../assets/login-bg2.jpg';
import bgImage3 from '../assets/login-bg3.jpg';
import bgImage4 from '../assets/login-bg4.jpg';

const BG_IMAGES = [bgImage1, bgImage2, bgImage3, bgImage4];

const SLIDE_DURATION = 5000; // 5 secondes par image

type ViewMode = 'login' | 'register' | 'link';

// ── Composant Slideshow ────────────────────────────────────
const BackgroundSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % BG_IMAGES.length;
        setNextIndex((next + 1) % BG_IMAGES.length);
        return next;
      });
      setIsTransitioning(false);
    }, 1000); // durée du fade
  }, []);

  // Avance automatique
  useEffect(() => {
    const timer = setInterval(goToNext, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [goToNext]);

  // Préchargement des images
  useEffect(() => {
    BG_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="login-slideshow" aria-hidden="true">
      {/* Image courante */}
      <div
        key={currentIndex}
        className="login-slide login-slide--active"
        style={{ backgroundImage: `url(${BG_IMAGES[currentIndex]})` }}
      />
      {/* Image suivante (prête en arrière) */}
      <div
        key={`next-${nextIndex}`}
        className={`login-slide login-slide--next ${isTransitioning ? 'login-slide--transitioning' : ''}`}
        style={{ backgroundImage: `url(${BG_IMAGES[nextIndex]})` }}
      />
      {/* Overlay sombre pour la lisibilité du formulaire */}
      <div className="login-overlay" />

      {/* Indicateurs de dots */}
      <div className="login-dots">
        {BG_IMAGES.map((_, i) => (
          <button
            key={i}
            className={`login-dot ${i === currentIndex ? 'login-dot--active' : ''}`}
            onClick={() => {
              setNextIndex((currentIndex + 1) % BG_IMAGES.length);
              setCurrentIndex(i);
            }}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Composant Logo établissement ───────────────────────────
const SchoolLogo: React.FC<{ logo: string | null; schoolName: string }> = ({ logo, schoolName }) => {
  if (logo) {
    return (
      <div className="login-logo-wrapper">
        <div className="login-logo-img-container">
          <img
            src={logo}
            alt={`Logo ${schoolName}`}
            className="login-logo-img"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="login-logo-wrapper">
      <div className="login-logo-icon">
        <GraduationCap className="w-10 h-10 text-white" />
      </div>
    </div>
  );
};

// ── Composant principal Login ──────────────────────────────
export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const schoolName = useStore((s) => s.schoolName);
  const appName = useStore((s) => s.appName);

  const [view, setView] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = await login(username, password);
    if (!ok) setError('Identifiants incorrects. Veuillez réessayer.');
    setLoading(false);
  };

  const onRegisterSuccess = async (parent: any) => {
    setView('link');
    await login(parent.telephone, 'demo123');
  };

  const finishSetup = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Styles intégrés pour le slideshow */}
      <style>{`
        /* ── SLIDESHOW ─────────────────────────────── */
        .login-slideshow {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .login-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: opacity 1s ease-in-out;
        }
        .login-slide--active {
          opacity: 1;
          z-index: 1;
        }
        .login-slide--next {
          opacity: 0;
          z-index: 2;
        }
        .login-slide--transitioning {
          opacity: 1;
        }
        .login-overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.75) 0%,
            rgba(30, 58, 138, 0.60) 50%,
            rgba(15, 23, 42, 0.80) 100%
          );
        }
        /* ── DOTS ─────────────────────────────────── */
        .login-dots {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .login-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        .login-dot--active {
          width: 24px;
          border-radius: 4px;
          background: rgba(255,255,255,0.9);
        }
        /* ── LOGO ─────────────────────────────────── */
        .login-logo-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .login-logo-img-container {
          width: 88px;
          height: 88px;
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          border: 3px solid rgba(255,255,255,0.8);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          backdrop-filter: blur(8px);
        }
        .login-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 6px;
        }
        .login-logo-icon {
          width: 88px;
          height: 88px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-radius: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 0 8px 32px rgba(37,99,235,0.5), 0 0 0 1px rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* ── ANIMATIONS INPUT ─────────────────────── */
        .login-input-group {
          position: relative;
        }
        .login-input-group input:focus ~ .login-input-border {
          width: 100%;
        }
        .login-input-border {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #60a5fa;
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        /* ── BOUTON ───────────────────────────────── */
        .login-btn {
          position: relative;
          overflow: hidden;
        }
        .login-btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.4s ease, height 0.4s ease;
        }
        .login-btn:hover::after {
          width: 300px;
          height: 300px;
        }
        /* ── PAGE WRAPPER ─────────────────────────── */
        .login-page {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .login-card-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
        }
        /* ── CARTE DE FORMULAIRE ──────────────────── */
        .login-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px;
          padding: 32px;
          box-shadow:
            0 25px 50px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.05) inset;
        }
        /* ── RESPONSIVE ───────────────────────────── */
        @media (max-width: 480px) {
          .login-card {
            padding: 24px 20px;
          }
          .login-logo-img-container,
          .login-logo-icon {
            width: 72px;
            height: 72px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="login-page">
        {/* Slideshow en arrière-plan */}
        <BackgroundSlideshow />

        <div className="login-card-wrapper">
          {/* Logo + Titre */}
          <div className="text-center mb-6">
            <SchoolLogo logo={schoolLogo} schoolName={schoolName} />
            <h1 className="text-2xl font-bold text-white mt-2 tracking-tight">
              {appName || 'EduFinance'}
            </h1>
            <p className="text-blue-300 mt-1 text-sm font-medium">
              {schoolName || 'Gestion Financière Scolaire'}
            </p>
          </div>

          {/* Carte principale */}
          <div className="login-card">

            {/* Vue : CONNEXION */}
            {view === 'login' && (
              <>
                <h2 className="text-lg font-semibold text-white mb-6 text-center flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Connexion
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Identifiant */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider">
                      Identifiant
                    </label>
                    <div className="login-input-group">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input
                          id="login-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="admin, comptable, ou téléphone"
                          required
                          autoComplete="username"
                          className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/50 focus:bg-white/12 transition-all duration-200 text-sm"
                          style={{ background: 'rgba(255,255,255,0.07)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-4 py-3 border border-white/15 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/50 transition-all duration-200 text-sm"
                        style={{ background: 'rgba(255,255,255,0.07)' }}
                      />
                    </div>
                  </div>

                  {/* Message d'erreur */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-sm animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Bouton connexion */}
                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="login-btn w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-900 disabled:to-blue-900 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Se connecter
                      </>
                    )}
                  </button>

                  {/* Lien inscription parent */}
                  <div className="pt-1 text-center border-t border-white/10 mt-4">
                    <button
                      type="button"
                      onClick={() => setView('register')}
                      className="text-blue-300 text-xs hover:text-white transition-colors duration-200 flex items-center justify-center gap-1.5 w-full pt-3 group"
                    >
                      <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      Nouveau parent ? Créer un compte
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Vue : INSCRIPTION */}
            {view === 'register' && (
              <Register
                onBack={() => setView('login')}
                onSuccess={onRegisterSuccess}
              />
            )}

            {/* Vue : LIAISON ENFANT */}
            {view === 'link' && (
              <LinkStudent onComplete={finishSetup} />
            )}
          </div>

          {/* Pied de page */}
          <p className="text-center text-white/30 text-xs mt-5">
            © {new Date().getFullYear()} {appName} — Tous droits réservés
          </p>
        </div>
      </div>
    </>
  );
};
