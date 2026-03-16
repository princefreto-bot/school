// ============================================================
// PAGE DE CONNEXION — Hybride PC (Sliding) / Mobile (Slideshow)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parentApi } from '../services/parentApi';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, Phone } from 'lucide-react';

// ── Images de fond (Mobile uniquement) ──
import bgImage1 from '../assets/login-bg1.jpg';
import bgImage2 from '../assets/login-bg2.jpg';
import bgImage3 from '../assets/login-bg3.jpg';
import bgImage4 from '../assets/login-bg4.jpg';

const BG_IMAGES = [bgImage1, bgImage2, bgImage3, bgImage4];
const SLIDE_DURATION = 5000;

// ── COMPOSANTS PARTAGÉS ──────────────────────────────────────

const SchoolLogo: React.FC<{ logo: string | null; schoolName: string; size?: string }> = ({ logo, schoolName, size = "w-16 h-16" }) => {
  if (logo) {
    return (
      <div className={`${size} mb-4 flex items-center justify-center`}>
        <img src={logo} alt={`Logo ${schoolName}`} className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`${size} bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20`}>
      <GraduationCap className="w-1/2 h-1/2 text-white" />
    </div>
  );
};

const BackgroundSlideshow: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const goToNext = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, []);
  
    useEffect(() => {
      const timer = setInterval(goToNext, SLIDE_DURATION);
      return () => clearInterval(timer);
    }, [goToNext]);
  
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        {BG_IMAGES.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 z-[1] bg-slate-900/70 backdrop-blur-[2px]" />
      </div>
    );
};

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────

export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const schoolName = useStore((s) => s.schoolName);
  const appName = useStore((s) => s.appName);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState<'login' | 'register' | 'link'>('login');
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  
  // Auth Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (type === 'login') {
            const ok = await login(username, password);
            if (!ok) setError('Identifiants incorrects.');
        } else {
            setLoading(true);
            await parentApi.register({ nom, telephone: username, password });
            // On reste en local pour l'étape de liaison avant de déclencher l'auth globale
            setView('link');
        }
    } catch (err: any) {
        setError(err.error || "Une erreur est survenue.");
    } finally {
        setLoading(false);
    }
  };


  if (view === 'link') {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
                <LinkStudent onComplete={async () => {
                   // Une fois lié, on connecte officiellement
                   await login(username, password);
                }} />
                <button 
                  onClick={async () => await login(username, password)}
                  className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-blue-600 transition"
                >
                  Passer cette étape pour le moment
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-['Poppins'] overflow-hidden bg-slate-100 relative">
      <style>{`
        /* ──── DESKTOP SLIDING OVERLAY ──── */
        .auth-container {
          background-color: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          position: relative;
          overflow: hidden;
          width: 850px;
          max-width: 100%;
          min-height: 550px;
          z-index: 10;
        }

        .form-container {
          position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out;
        }

        .sign-in-container { left: 0; width: 50%; z-index: 2; }
        .auth-container.right-panel-active .sign-in-container { transform: translateX(100%); }

        .sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }
        .auth-container.right-panel-active .sign-up-container {
          transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute; top: 0; left: 50%; width: 50%; height: 100%;
          overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100;
        }
        .auth-container.right-panel-active .overlay-container { transform: translateX(-100%); }

        .overlay {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: #FFFFFF; position: relative; left: -100%; height: 100%; width: 200%;
          transform: translateX(0); transition: transform 0.6s cubic-bezier(0.7, 0, 0.3, 1);
        }
        .auth-container.right-panel-active .overlay { transform: translateX(50%); }

        .overlay-panel {
          position: absolute; display: flex; align-items: center; justify-content: center;
          flex-direction: column; padding: 0 50px; text-align: center; top: 0; height: 100%; width: 50%;
          transform: translateX(0); transition: transform 0.6s cubic-bezier(0.7, 0, 0.3, 1);
        }
        .overlay-left { transform: translateX(-20%); }
        .auth-container.right-panel-active .overlay-left { transform: translateX(0); }
        .overlay-right { right: 0; transform: translateX(0); }
        .auth-container.right-panel-active .overlay-right { transform: translateX(20%); }

        .auth-form {
          background-color: #FFFFFF; display: flex; align-items: center; justify-content: center;
          flex-direction: column; padding: 0 50px; height: 100%; text-align: center;
        }

        .auth-input {
          background-color: #f1f5f9; border: none; padding: 12px 15px; margin: 8px 0;
          width: 100%; border-radius: 12px; font-size: 14px; focus:outline-none focus:ring-2 focus:ring-blue-400;
        }

        .auth-button {
          border-radius: 12px; border: 1px solid #2563eb; background-color: #2563eb; color: #FFFFFF;
          font-size: 12px; font-weight: bold; padding: 12px 45px; letter-spacing: 1px;
          text-transform: uppercase; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; margin-top: 15px;
        }
        .auth-button:active { transform: scale(0.95); }
        .auth-button.ghost { background-color: transparent; border-color: #FFFFFF; }

        .social-container { margin: 15px 0; }
        .social-container a {
          border: 1px solid #e2e8f0; border-radius: 50%; display: inline-flex; justify-content: center;
          align-items: center; margin: 0 5px; height: 38px; width: 38px; color: #1e293b; transition: all 0.3s;
        }
        .social-container a:hover { background: #f1f5f9; border-color: #2563eb; color: #2563eb; }

        /* ──── MOBILE CARDS ──── */
        .mobile-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            width: 90%;
            max-width: 400px;
            padding: 32px 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            z-index: 10;
        }
      `}</style>

      {/* --- DESKTOP VIEW --- */}
      {!isMobile && (
        <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`}>
          
          {/* Register Panel */}
          <div className="form-container sign-up-container">
            <form className="auth-form" onSubmit={(e) => handleAuth(e, 'register')}>
              <SchoolLogo logo={schoolLogo} schoolName={schoolName} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Créer un compte</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Inscription Parent</div>
              <input type="text" placeholder="Nom complet" className="auth-input" value={nom} onChange={(e) => setNom(e.target.value)} required />
              <input type="tel" placeholder="Téléphone" className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <div className="text-rose-500 text-xs mt-2 font-bold">{error}</div>}
              <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Chargement...' : "S'inscrire"}</button>
            </form>
          </div>

          {/* Login Panel */}
          <div className="form-container sign-in-container">
            <form className="auth-form" onSubmit={(e) => handleAuth(e, 'login')}>
              <SchoolLogo logo={schoolLogo} schoolName={schoolName} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Se connecter</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Gestion {appName}</div>
              <input type="text" placeholder="Utilisateur / Téléphone" className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <a href="#" className="text-xs text-slate-400 hover:text-blue-600 mt-2">Mot de passe oublié ?</a>
              {error && <div className="text-rose-500 text-xs mt-2 font-bold">{error}</div>}
              <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
            </form>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-left duration-700">Content de vous revoir ! 👋</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">Retrouvez tout l'univers scolaire de vos enfants en un clic. Votre tableau de bord personnalisé vous attend.</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Accès tableau de bord</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Consultation des bulletins</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Alertes et annonces</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(false)}>Se connecter</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-right duration-700">Bonjour, Parent ! 🌟</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">Plongez au cœur de l'éducation de votre enfant. Suivez chaque instant de sa réussite avec nous.</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Suivi des notes en temps réel</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Notifications de présence</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full"/> Communication école-famille</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(true)}>Créer un compte</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE VIEW --- */}
      {isMobile && (
        <>
            <BackgroundSlideshow />
            <div className="mobile-card">
                <div className="flex flex-col items-center">
                    <SchoolLogo logo={schoolLogo} schoolName={schoolName} size="w-20 h-20" />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter text-center">
                        {view === 'login' ? 'Bienvenue !' : 'Rejoignez-nous'}
                    </h1>
                    <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-[0.2em] mt-2 mb-6 bg-blue-50 px-3 py-1 rounded-full">
                        {appName} • Excellence
                    </p>
                </div>

                <form onSubmit={(e) => handleAuth(e, view === 'login' ? 'login' : 'register')} className="space-y-4">
                    {view === 'register' && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input type="text" placeholder="Nom complet" className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm" value={nom} onChange={(e) => setNom(e.target.value)} required />
                        </div>
                    )}
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input type="tel" placeholder="Téléphone" className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input type="password" placeholder="Mot de passe" className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    {error && <div className="text-rose-500 text-xs italic text-center font-bold px-4">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4">
                        {loading ? 'Traitement...' : (view === 'login' ? 'Décollage' : 'Inscrire')}
                    </button>
                    
                    <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full py-2 text-blue-600 text-[10px] font-black uppercase tracking-widest mt-2">
                        {view === 'login' ? "Nouveau ? Créer un compte" : "Déjà un compte ? Se connecter"}
                    </button>
                </form>
            </div>
        </>
      )}

      <p className={`fixed bottom-8 text-[10px] font-black uppercase tracking-[0.3em] z-20 ${isMobile ? 'text-white/60' : 'text-slate-400'}`}>
        © {new Date().getFullYear()} {appName} • Éducation Connectée
      </p>
    </div>
  );
};
