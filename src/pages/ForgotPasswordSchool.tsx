import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Store, ArrowLeft, Send } from 'lucide-react';
import { API_BASE_URL } from '../config';

const translations = {
  fr: {
    title: "Mot de passe oublié",
    subtitle: "Saisissez l'e-mail de votre compte pour recevoir un lien de réinitialisation.",
    errorValidation: "Veuillez sélectionner un établissement et saisir votre adresse e-mail.",
    errorOccurred: "Une erreur est survenue.",
    successMessage: "Lien de réinitialisation envoyé.",
    errorServer: "Erreur de connexion au serveur.",
    selectSchool: "-- Sélectionnez votre école --",
    emailPlaceholder: "Adresse e-mail",
    sending: "Envoi...",
    sendLink: "Envoyer le lien",
    backBtn: "Retour à la connexion",
  },
  en: {
    title: "Forgot Password",
    subtitle: "Enter your account email to receive a password reset link.",
    errorValidation: "Please select a school and enter your email address.",
    errorOccurred: "An error occurred.",
    successMessage: "Reset link sent.",
    errorServer: "Server connection error.",
    selectSchool: "-- Select your school --",
    emailPlaceholder: "Email address",
    sending: "Sending...",
    sendLink: "Send link",
    backBtn: "Back to login",
  }
};

export const ForgotPasswordSchool: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const [schools, setSchools] = useState<{slug: string, name: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentLang = (lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const t = (key: keyof typeof translations['fr']) => translations[currentLang][key];

  useEffect(() => {
    fetch(`${API_BASE_URL}/schools`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
         if (Array.isArray(data)) setSchools(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedSchool || !email) {
      setError(t('errorValidation'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, schoolSlug: selectedSchool })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || t('errorOccurred'));
      } else {
        setMessage(data.message || t('successMessage'));
      }
    } catch (err) {
      setError(t('errorServer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-amber-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 py-12 font-['Poppins'] relative overflow-y-auto">

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8 fps-item">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('subtitle')}</p>
        </div>

        {message ? (
          <div className="text-center space-y-6 fps-item">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm font-bold border border-emerald-100 dark:border-emerald-900/50">
              {message}
            </div>
            <button 
              onClick={() => navigate(`/${lang}/portail-ecole`)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl transition border border-slate-200 dark:border-slate-700"
            >
              {t('backBtn')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative fps-item">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <select 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none focus:outline-none"
                value={selectedSchool} 
                onChange={(e) => setSelectedSchool(e.target.value)} 
                required
              >
                <option value="" disabled className="dark:bg-slate-800">{t('selectSchool')}</option>
                {schools.map(s => <option key={s.slug} value={s.slug} className="dark:bg-slate-800">{s.name}</option>)}
              </select>
            </div>

            <div className="relative fps-item">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="email" 
                placeholder={t('emailPlaceholder')} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-sm focus:outline-none transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            {error && <div className="text-rose-500 dark:text-rose-450 text-xs font-bold text-center p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl fps-item">{error}</div>}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.4)] dark:shadow-none transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50 fps-item cursor-pointer"
            >
              {loading ? t('sending') : t('sendLink')}
              {!loading && <Send className="w-4 h-4" />}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate(`/${lang}/portail-ecole`)}
              className="w-full py-2 text-slate-500 dark:text-slate-450 text-xs font-bold flex items-center justify-center gap-2 mt-2 hover:text-slate-700 dark:hover:text-slate-300 transition fps-item"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('backBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
