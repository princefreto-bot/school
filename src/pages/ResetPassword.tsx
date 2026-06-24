import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Lock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

const translations = {
  fr: {
    invalidLink: "Lien de réinitialisation invalide ou manquant.",
    passwordLengthError: "Le mot de passe doit contenir au moins 6 caractères.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    errorOccurred: "Une erreur est survenue.",
    successReset: "Votre mot de passe a été réinitialisé avec succès !",
    serverError: "Erreur de connexion au serveur.",
    title: "Nouveau mot de passe",
    subtitle: "Veuillez saisir votre nouveau mot de passe sécurisé.",
    redirecting: "Redirection vers la connexion...",
    loginNow: "Se connecter maintenant",
    newPasswordPlaceholder: "Nouveau mot de passe (min 6 car.)",
    confirmPasswordPlaceholder: "Confirmer le mot de passe",
    saving: "Enregistrement...",
    saveBtn: "Enregistrer le mot de passe",
    backBtn: "← Retour à la connexion",
  },
  en: {
    invalidLink: "Invalid or missing reset link.",
    passwordLengthError: "The password must contain at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    errorOccurred: "An error occurred.",
    successReset: "Your password has been successfully reset!",
    serverError: "Server connection error.",
    title: "New password",
    subtitle: "Please enter your new secure password.",
    redirecting: "Redirecting to login...",
    loginNow: "Login now",
    newPasswordPlaceholder: "New password (min 6 chars.)",
    confirmPasswordPlaceholder: "Confirm password",
    saving: "Saving...",
    saveBtn: "Save password",
    backBtn: "← Back to login",
  }
};

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentLang = (lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const t = (key: keyof typeof translations['fr']) => translations[currentLang][key];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError(t('invalidLink'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordLengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || t('errorOccurred'));
      } else {
        setMessage(t('successReset'));
        setTimeout(() => navigate(`/${lang}/portail-ecole`), 3000);
      }
    } catch (err) {
      setError(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 font-['Poppins'] text-center">
        <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-200 max-w-sm">
          {t('invalidLink')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 font-['Poppins'] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[55%] h-[55%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

        <div className="text-center mb-8 rp-item">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('subtitle')}</p>
        </div>

        {message ? (
          <div className="text-center space-y-6 rp-item">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl flex flex-col items-center gap-3 border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-bold">{message}</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">{t('redirecting')}</p>
            </div>
            <button 
              onClick={() => navigate(`/${lang}/portail-ecole`)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
            >
              {t('loginNow')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative rp-item">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="password" 
                placeholder={t('newPasswordPlaceholder')} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-sm focus:outline-none transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="relative rp-item">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="password" 
                placeholder={t('confirmPasswordPlaceholder')} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-sm focus:outline-none transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            {error && (
              <div className="text-rose-500 dark:text-rose-450 text-xs font-bold text-center p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 rp-item">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50 rp-item"
            >
              {loading ? t('saving') : t('saveBtn')}
              {!loading && <Save className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center rp-item">
          <button
            onClick={() => navigate(`/${lang}/portail-ecole`)}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            {t('backBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
