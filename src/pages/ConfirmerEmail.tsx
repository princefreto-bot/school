// ============================================================
// PAGE DE CONFIRMATION E-MAIL — Style Épuré & Bords Droits
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, ShieldAlert, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStore } from '../store/useStore';
import { createActivityLog } from '../utils/activityLogger';

export const ConfirmerEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Zustand actions
  const fetchAllFromBackend = useStore((s) => s.fetchAllFromBackend);
  const addActivityLog = useStore((s) => s.addActivityLog);

  // States
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refs for the 6 digit inputs
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Prefill email if passed in route state
  useEffect(() => {
    if (location.state && (location.state as any).email) {
      setEmail((location.state as any).email);
    }
  }, [location]);

  // Timer for resend code cooldown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Handle digit inputs
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric inputs
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setCodeDigits(digits);
    inputRefs[5].current?.focus();
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("L'adresse email est requise pour renvoyer le code.");
      return;
    }
    
    setError('');
    setResendStatus(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors du renvoi du code.");
      }

      setResendStatus({ type: 'success', message: data.message || "Un nouveau code de validation a été envoyé." });
      setResendCountdown(60); // 60 seconds cooldown
    } catch (err: any) {
      setResendStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const verificationCode = codeDigits.join('');
    if (!email) {
      setError("L'adresse email est requise.");
      return;
    }
    if (verificationCode.length !== 6) {
      setError("Le code de confirmation doit comporter 6 chiffres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-school-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Le code saisi est invalide ou expiré.");
      }

      setSuccess(true);

      // Si le backend renvoie un token (connexion directe autorisée)
      if (data.token && data.user) {
        localStorage.setItem('parent_token', data.token);
        
        const loggedUser = {
          id: data.user.id,
          username: data.user.telephone,
          role: data.user.role,
          nom: data.user.nom,
          telephone: data.user.telephone,
          schoolSlug: data.user.school_slug || undefined,
          schoolName: data.user.school_name || undefined,
          schoolApproved: data.user.school_approved !== undefined ? data.user.school_approved : false,
        };

        // Configurer l'état global Zustand
        useStore.setState({
          students: [],
          parents: [],
          presences: [],
          activityLogs: [],
          links: [],
          announcements: [],
          announcementReads: [],
          matieres: [],
          classeMatieres: [],
          notes: [],
          schoolLogo: data.user.school_logo || null,
          schoolName: data.user.school_name || 'Établissement',
          user: loggedUser,
          isAuthenticated: true,
          currentPage: 'dashboard' // Redirection vers dashboard, Layout se chargera d'afficher l'overlay
        });

        addActivityLog(createActivityLog(loggedUser.nom, loggedUser.role, 'connexion', 'Validation e-mail & connexion automatique réussie'));
        
        // Lancer la synchro
        fetchAllFromBackend();

        // Attendre 1.5s pour l'animation de succès et rediriger
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Fallback si pas de token
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 text-slate-800 flex items-center justify-center font-['Poppins'] p-4 md:p-8 relative overflow-hidden">
      {/* Background gradients pour effet premium */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-none p-6 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo & Retour */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button 
            onClick={() => navigate('/creer-compte')} 
            className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          
          <div className="flex items-center gap-1.5 text-amber-500 font-black tracking-tighter text-lg select-none">
            <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" />
            <span>DGhub<span className="text-slate-900">School</span></span>
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Confirmer votre e-mail
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Saisissez le code de validation reçu sur la messagerie de votre établissement.
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-700 text-xs border border-red-200/50 rounded-none mb-6 animate-shake">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Message de succès */}
        {success && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-700 text-xs border border-emerald-250/50 rounded-none mb-6">
            <div className="w-5 h-5 bg-emerald-500 rounded-none flex items-center justify-center text-white">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Adresse e-mail validée ! Connexion en cours...</span>
          </div>
        )}

        {/* Message de statut du renvoi de code */}
        {resendStatus && (
          <div className={`flex items-start gap-2.5 p-3.5 text-xs border rounded-none mb-6 ${
            resendStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-250/50' 
              : 'bg-red-50 text-red-700 border-red-200/50'
          }`}>
            {resendStatus.type === 'success' ? (
              <div className="w-5 h-5 bg-emerald-500 rounded-none flex items-center justify-center text-white shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
            ) : (
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span className="font-semibold">{resendStatus.message}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleVerify} className="space-y-6">
          
          {/* Saisie E-mail */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Adresse e-mail de l'établissement
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="direction@votre-ecole.com"
                disabled={loading || success}
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 focus:bg-white p-3 pl-10 text-sm outline-none text-slate-900 placeholder:text-slate-400/80 rounded-none transition-all"
              />
            </div>
          </div>

          {/* Saisie Code à 6 chiffres */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
              Code de confirmation à 6 chiffres
            </label>
            <div className="flex justify-between gap-2">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  disabled={loading || success}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  className="w-12 h-14 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white text-center text-xl font-bold outline-none rounded-none text-slate-900 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Bouton de validation */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-amber-500 border border-amber-600 hover:bg-amber-600 text-slate-950 hover:text-slate-950 text-xs font-bold uppercase tracking-widest p-4 rounded-none transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {loading ? 'Validation...' : 'Valider mon compte'}
          </button>

          {/* Option de renvoi du code */}
          <div className="text-center text-xs mt-4">
            <span className="text-slate-500">Vous n'avez pas reçu l'e-mail ? </span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || success || resendCountdown > 0}
              className="text-amber-600 hover:text-amber-700 font-bold hover:underline transition-colors disabled:opacity-50 disabled:no-underline"
            >
              {resendCountdown > 0 
                ? `Renvoyer dans ${resendCountdown}s` 
                : 'Renvoyer le code'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-[10px] text-slate-400 select-none">
          En validant votre compte, vous confirmez votre rôle en tant que Directeur ou Représentant de l'établissement.
        </div>
      </div>
    </div>
  );
};
