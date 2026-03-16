// ============================================================
// PAGE DE CONNEXION — Sliding Overlay Style
// ============================================================
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { parentApi } from '../services/parentApi';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, Phone, AlertCircle, CheckCircle, Facebook, Github, Chrome } from 'lucide-react';

// ── Composant Logo établissement ───────────────────────────
const SchoolLogo: React.FC<{ logo: string | null; schoolName: string }> = ({ logo, schoolName }) => {
  if (logo) {
    return (
      <div className="login-logo-img-container mb-4">
        <img src={logo} alt={`Logo ${schoolName}`} className="w-16 h-16 object-contain" />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
      <GraduationCap className="w-8 h-8 text-white" />
    </div>
  );
};

export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const schoolName = useStore((s) => s.schoolName);
  const appName = useStore((s) => s.appName);

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [view, setView] = useState<'auth' | 'link'>('auth');
  
  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register States
  const [regNom, setRegNom] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const ok = await login(username, password);
    if (!ok) setLoginError('Identifiants incorrects.');
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
        const result = await parentApi.register({ nom: regNom, telephone: regTel, password: regPass });
        // Success -> Login automatically and move to link
        await login(regTel, regPass);
        setView('link');
    } catch (err: any) {
        setRegError(err.error || "Erreur lors de l'inscription.");
    } finally {
        setRegLoading(false);
    }
  };

  const finishSetup = () => {
    window.location.reload();
  };

  if (view === 'link') {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                <LinkStudent onComplete={finishSetup} />
            </div>
        </div>
    );
  }

  return (
    <div className="login-auth-body">
      <style>{`
        .login-auth-body {
          background: #f1f5f9;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          height: 100vh;
          font-family: 'Poppins', sans-serif;
        }

        .auth-container {
          background-color: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          position: relative;
          overflow: hidden;
          width: 850px;
          max-width: 100%;
          min-height: 550px;
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .auth-container.right-panel-active .sign-in-container {
          transform: translateX(100%);
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }

        .auth-container.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .auth-container.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .overlay {
          background: #2563eb;
          background: linear-gradient(to right, #1d4ed8, #2563eb);
          background-repeat: no-repeat;
          background-size: cover;
          background-position: 0 0;
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .auth-container.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .overlay-left {
          transform: translateX(-20%);
        }

        .auth-container.right-panel-active .overlay-left {
          transform: translateX(0);
        }

        .overlay-right {
          right: 0;
          transform: translateX(0);
        }

        .auth-container.right-panel-active .overlay-right {
          transform: translateX(20%);
        }

        .auth-form {
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 50px;
          height: 100%;
          text-align: center;
        }

        .auth-input {
          background-color: #f1f5f9;
          border: none;
          padding: 12px 15px;
          margin: 8px 0;
          width: 100%;
          border-radius: 12px;
          font-size: 14px;
        }

        .auth-button {
          border-radius: 12px;
          border: 1px solid #2563eb;
          background-color: #2563eb;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in;
          cursor: pointer;
          margin-top: 15px;
        }

        .auth-button:active {
          transform: scale(0.95);
        }

        .auth-button.ghost {
          background-color: transparent;
          border-color: #FFFFFF;
        }

        .social-container {
          margin: 20px 0;
        }

        .social-container a {
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin: 0 5px;
          height: 40px;
          width: 40px;
          color: #1e293b;
          transition: all 0.3s ease;
        }

        .social-container a:hover {
          background-color: #f1f5f9;
          border-color: #2563eb;
          color: #2563eb;
        }

        @media (max-width: 768px) {
            .auth-container {
                width: 100%;
                min-height: 100vh;
                border-radius: 0;
            }
            .overlay-container {
                display: none;
            }
            .form-container {
                width: 100%;
                position: relative;
            }
            .sign-up-container {
                display: ${isRightPanelActive ? 'block' : 'none'};
                opacity: 1;
                transform: none;
            }
            .sign-in-container {
                display: ${isRightPanelActive ? 'none' : 'block'};
                transform: none;
            }
        }
      `}</style>

      <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
        
        {/* Registration Form */}
        <div className="form-container sign-up-container">
          <form className="auth-form" onSubmit={handleRegister}>
            <SchoolLogo logo={schoolLogo} schoolName={schoolName} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Créer un compte</h1>
            <div className="social-container">
              <a href="#"><Facebook className="w-5 h-5" /></a>
              <a href="#"><Chrome className="w-5 h-5" /></a>
              <a href="#"><Github className="w-5 h-5" /></a>
            </div>
            <span className="text-xs text-slate-400 font-medium mb-4">ou utilisez vos coordonnées</span>
            <input 
                type="text" 
                placeholder="Nom complet" 
                className="auth-input" 
                value={regNom}
                onChange={(e) => setRegNom(e.target.value)}
                required
            />
            <input 
                type="tel" 
                placeholder="Numéro de téléphone" 
                className="auth-input" 
                value={regTel}
                onChange={(e) => setRegTel(e.target.value)}
                required
            />
            <input 
                type="password" 
                placeholder="Mot de passe" 
                className="auth-input" 
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                required
            />
            {regError && <div className="text-rose-500 text-xs mt-2 font-bold">{regError}</div>}
            <button className="auth-button" type="submit" disabled={regLoading}>
                {regLoading ? 'En cours...' : "S'inscrire"}
            </button>
            <button 
                className="md:hidden text-blue-600 text-xs font-black mt-6"
                onClick={() => setIsRightPanelActive(false)}
                type="button"
            >
                DÉJÀ UN COMPTE ? SE CONNECTER
            </button>
          </form>
        </div>

        {/* Login Form */}
        <div className="form-container sign-in-container">
          <form className="auth-form" onSubmit={handleLogin}>
            <SchoolLogo logo={schoolLogo} schoolName={schoolName} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Se connecter</h1>
            <div className="social-container">
              <a href="#"><Facebook className="w-5 h-5" /></a>
              <a href="#"><Chrome className="w-5 h-5" /></a>
              <a href="#"><Github className="w-5 h-5" /></a>
            </div>
            <span className="text-xs text-slate-400 font-medium mb-4">Portail {appName || 'EduFinance'}</span>
            <input 
                type="text" 
                placeholder="Identifiant ou Téléphone" 
                className="auth-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input 
                type="password" 
                placeholder="Mot de passe" 
                className="auth-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <a href="#" className="text-xs text-slate-400 hover:text-blue-600 mt-2">Mot de passe oublié ?</a>
            {loginError && <div className="text-rose-500 text-xs mt-2 font-bold">{loginError}</div>}
            <button className="auth-button" type="submit" disabled={loginLoading}>
                {loginLoading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button 
                className="md:hidden text-blue-600 text-xs font-black mt-6"
                onClick={() => setIsRightPanelActive(true)}
                type="button"
            >
                PAS DE COMPTE ? S'INSCRIRE
            </button>
          </form>
        </div>

        {/* Overlay Panels */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-black tracking-tighter mb-4">Content de vous revoir !</h1>
              <p className="text-sm opacity-90 leading-relaxed mb-8">
                Pour rester connecté avec l'établissement, veuillez vous identifier avec vos informations personnelles.
              </p>
              <button className="auth-button ghost" onClick={() => setIsRightPanelActive(false)}>
                Se connecter
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-black tracking-tighter mb-4">Bienvenue, Parent !</h1>
              <p className="text-sm opacity-90 leading-relaxed mb-8">
                Suivez la scolarité de vos enfants en temps réel. Créez votre compte pour commencer votre voyage avec nous.
              </p>
              <button className="auth-button ghost" onClick={() => setIsRightPanelActive(true)}>
                S'inscrire
              </button>
            </div>
          </div>
        </div>

      </div>
      
      <p className="fixed bottom-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} {appName} — Système de Gestion Scolaire
      </p>
    </div>
  );
};
