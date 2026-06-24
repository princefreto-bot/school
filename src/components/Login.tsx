// ============================================================
// PAGE DE CONNEXION — Hybride PC (Sliding) / Mobile (Slideshow)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parentApi } from '../services/parentApi';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, Phone, Store } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNavigate, useParams, Link } from 'react-router-dom';

// ── Images de fond (Mobile uniquement) ──
import bgImage1 from '../assets/login-bg1.jpg';
import bgImage2 from '../assets/login-bg2.jpg';
import bgImage3 from '../assets/login-bg3.jpg';
import bgImage4 from '../assets/login-bg4.jpg';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

const BG_IMAGES = [bgImage1, bgImage2, bgImage3, bgImage4];
const SLIDE_DURATION = 5000;


const SchoolLogo: React.FC<{ size?: string; logoUrl?: string | null }> = ({ size = "w-16 h-16", logoUrl }) => {
  return (
    <div className={`${size} bg-white border border-slate-200 rounded-[28px] flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10 p-2`}>
      <img 
        src={logoUrl || "/logo.svg"} 
        className="w-full h-full object-contain" 
        alt="DGhubSchool" 
        onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg" }}
      />
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
        <div className="absolute inset-0 z-[1] bg-slate-900/40 backdrop-blur-[2px]" />
      </div>
    );
};

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────

const translations = {
  fr: {
    createAccount: "Créer un compte",
    parentRegistration: "Inscription Parent",
    loadError: "Erreur de chargement: ",
    school: "Établissement",
    change: "Changer",
    selectSchool: "-- Sélectionnez votre établissement --",
    selectChildSchool: "-- Sélectionnez l'établissement de votre enfant --",
    fullName: "Nom complet",
    phone: "Téléphone",
    password: "Mot de passe",
    privacyTitle: "Confidentialité & Données (IPDCP)",
    cguText: "J'accepte les ",
    cguLink: "CGU",
    cguSuffix: " de l'application de mon établissement. *",
    privacyText: "J'autorise le traitement des données de scolarité/présences de mon enfant selon la ",
    privacyLink: "Politique de Confidentialité",
    privacySuffix: ". *",
    imageRightsTitle: "Droit à l'image",
    imageRightsText: " : J'autorise l'affichage de la photo de mon enfant.",
    optional: "(Optionnel)",
    marketingText: "J'accepte de recevoir des actus et conseils d'YZO.",
    loading: "Chargement...",
    signUp: "S'inscrire",
    login: "Se connecter",
    access: "Accès",
    usernamePhone: "Utilisateur / Téléphone",
    forgotPassword: "Mot de passe oublié ?",
    privacyAndData: "Confidentialité & Données",
    trialExpired: "⏰ Période d'essai expirée",
    trialExpiredSuffix: " doit régler son abonnement. Contactez l'administrateur de la plateforme.",
    connecting: "Connexion...",
    schoolPortalAccess: "Accès Portail Établissement",
    welcomeBack: "Content de vous revoir ! 👋",
    welcomeBackSub: "Retrouvez tout l'univers scolaire de vos enfants en un clic. Votre tableau de bord personnalisé vous attend.",
    bulletDashboard: "Accès tableau de bord",
    bulletReportCard: "Consultation des bulletins",
    bulletAlerts: "Alertes et annonces",
    helloParent: "Bonjour, Parent ! 🌟",
    helloParentSub: "Plongez au cœur de l'éducation de votre enfant. Suivez chaque instant de sa réussite avec nous.",
    bulletGrades: "Suivi des notes en temps réel",
    bulletPresence: "Notifications de présence",
    bulletCommunication: "Communication école-famille",
    welcomeMobile: "Bienvenue !",
    joinUsMobile: "Rejoignez-nous",
    excellence: "Excellence",
    networkError: "Erreur réseau: ",
    privacyAndSecurity: "Confidentialité & Sécurité",
    privacyAndDataTogo: "Confidentialité & Données (loi togolaise / IPDCP)",
    yzoNews: "J'accepte de recevoir des actualités et conseils d'YZO.",
    trialExpiredSchoolMsg: " — Contactez l'administrateur pour régler l'abonnement.",
    processing: "Traitement...",
    launchMobile: "Décollage",
    registerMobile: "Inscrire",
    newCreateAccount: "Nouveau ? Créer un compte",
    alreadyAccount: "Déjà un compte ? Se connecter",
    connectedEducation: "Éducation Connectée",
    privacyFooter: "Confidentialité",
    dataError: "Le format de données reçu est incorrect.",
    acceptConsentError: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité.",
    incorrectCreds: "Identifiants incorrects.",
    skipStep: "Passer cette étape pour le moment",
  },
  en: {
    createAccount: "Create an account",
    parentRegistration: "Parent Registration",
    loadError: "Loading error: ",
    school: "School",
    change: "Change",
    selectSchool: "-- Select your school --",
    selectChildSchool: "-- Select your child's school --",
    fullName: "Full name",
    phone: "Phone",
    password: "Password",
    privacyTitle: "Privacy & Data (IPDCP)",
    cguText: "I accept the ",
    cguLink: "TOS",
    cguSuffix: " of my school's application. *",
    privacyText: "I authorize the processing of my child's academic/attendance data according to the ",
    privacyLink: "Privacy Policy",
    privacySuffix: ". *",
    imageRightsTitle: "Image Rights",
    imageRightsText: " : I authorize the display of my child's photo.",
    optional: "(Optional)",
    marketingText: "I accept to receive news and tips from YZO.",
    loading: "Loading...",
    signUp: "Sign up",
    login: "Login",
    access: "Access",
    usernamePhone: "Username / Phone",
    forgotPassword: "Forgot password?",
    privacyAndData: "Privacy & Data",
    trialExpired: "⏰ Trial period expired",
    trialExpiredSuffix: " must pay their subscription. Contact the platform administrator.",
    connecting: "Connecting...",
    schoolPortalAccess: "School Portal Access",
    welcomeBack: "Welcome back! 👋",
    welcomeBackSub: "Find all your children's school universe in one click. Your personalized dashboard awaits you.",
    bulletDashboard: "Dashboard access",
    bulletReportCard: "Report card viewing",
    bulletAlerts: "Alerts and announcements",
    helloParent: "Hello, Parent! 🌟",
    helloParentSub: "Dive into the heart of your child's education. Follow every moment of their success with us.",
    bulletGrades: "Real-time grade tracking",
    bulletPresence: "Attendance notifications",
    bulletCommunication: "School-family communication",
    welcomeMobile: "Welcome!",
    joinUsMobile: "Join us",
    excellence: "Excellence",
    networkError: "Network error: ",
    privacyAndSecurity: "Privacy & Security",
    privacyAndDataTogo: "Privacy & Data",
    yzoNews: "I accept to receive news and tips from YZO.",
    trialExpiredSchoolMsg: " — Contact the administrator to pay the subscription.",
    processing: "Processing...",
    launchMobile: "Login",
    registerMobile: "Sign Up",
    newCreateAccount: "New? Create an account",
    alreadyAccount: "Already have an account? Login",
    connectedEducation: "Connected Education",
    privacyFooter: "Privacy",
    dataError: "The received data format is incorrect.",
    acceptConsentError: "You must accept the terms of use and the privacy policy.",
    incorrectCreds: "Incorrect credentials.",
    skipStep: "Skip this step for now",
  }
};

export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const { lang = 'fr', schoolSlug } = useParams<{ lang?: string, schoolSlug?: string }>();
  const appName = "DGhubSchool";

  const currentLang = (lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const t = (key: keyof typeof translations['fr']) => translations[currentLang][key];

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState<'login' | 'register' | 'link'>('login');
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  
  // Auth Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');
  const [trialExpiredSchool, setTrialExpiredSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
  // Consent States
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [parentPhotoAuth, setParentPhotoAuth] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  // NOUVEAU : Sélection Établissement
  const [schools, setSchools] = useState<{slug: string, name: string, logo_url: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolSlug) {
      setSelectedSchool(schoolSlug);
      localStorage.setItem('last_school_slug', schoolSlug);
    } else {
      const savedSlug = localStorage.getItem('last_school_slug');
      if (savedSlug && savedSlug !== 'undefined' && savedSlug !== 'null') {
        navigate(`/${lang}/login/${savedSlug}`, { replace: true });
      }
    }
  }, [schoolSlug, lang, navigate]);

  useEffect(() => {
    // Récupérer la liste des écoles
    console.log("Fetching schools from:", `${API_BASE_URL}/schools`);
    setFetchError(null);
    fetch(`${API_BASE_URL}/schools`)
      .then(res => {
         if (!res.ok) {
           throw new Error(`Erreur HTTP : ${res.status}`);
         }
         return res.json();
      })
      .then(data => {
         console.log("Schools received:", data);
         if (Array.isArray(data)) {
           setSchools(data);
         } else {
           setFetchError(t('dataError'));
         }
      })
      .catch(err => {
         console.error("Fetch error:", err);
         setFetchError(err.message || String(err));
      });

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setError('');
    setTrialExpiredSchool(null);
    setLoading(true);

    try {
        if (type === 'login') {
            const ok = await login(username, password, selectedSchool, 'parent');
            if (!ok) setError(t('incorrectCreds'));
        } else {
            if (!acceptedTerms || !acceptedPrivacy) {
                setError(t('acceptConsentError'));
                setLoading(false);
                return;
            }
            setLoading(true);
            await parentApi.register({
                nom,
                telephone: username,
                password,
                school_slug: selectedSchool,
                accepted_terms: acceptedTerms,
                accepted_privacy_policy: acceptedPrivacy,
                parent_photo_authorization: parentPhotoAuth,
                marketing_consent: marketingConsent
            });
            // On reste en local pour l'étape de liaison avant de déclencher l'auth globale
            setView('link');
        }
    } catch (err: any) {
        const msg: string = err?.message || err?.error || (lang === 'en' ? "An error occurred." : "Une erreur est survenue.");
        // Essai expiré
        if (msg.startsWith('TRIAL_EXPIRED:')) {
            const schoolName = msg.split(':')[1] || '';
            setTrialExpiredSchool(schoolName);
        } else {
            setError(msg);
        }
    } finally {
        setLoading(false);
    }
  };


  if (view === 'link') {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-none shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
                <LinkStudent onComplete={async () => {
                   // Une fois lié, on connecte officiellement
                   await login(username, password, selectedSchool);
                }} />
                <button 
                  onClick={async () => await login(username, password, selectedSchool)}
                  className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-amber-600 transition"
                >
                  {t('skipStep')}
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-['Poppins'] overflow-hidden bg-white relative">
      <style>{`
        /* ──── DESKTOP SLIDING OVERLAY ──── */
        .auth-container {
          background-color: #fff;
          border-radius: 0;
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
          background: linear-gradient(135deg, #fbbf24 0%, #eab308 100%);
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
          background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 12px 15px; margin: 8px 0;
          width: 100%; border-radius: 0; font-size: 14px; focus:outline-none focus:ring-2 focus:ring-amber-400;
        }

        .auth-button {
          border-radius: 0; border: 1px solid #eab308; background-color: #eab308; color: #FFFFFF;
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
        .social-container a:hover { background: #f1f5f9; border-color: #eab308; color: #eab308; }

        /* ──── MOBILE CARDS ──── */
        .mobile-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 0;
            width: 90%;
            max-width: 400px;
            padding: 32px 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            z-index: 10;
        }
      `}</style>

      {/* --- DESKTOP VIEW --- */}
      {!isMobile && (
        <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`}>
          
          {/* Register Panel */}
          <div className="form-container sign-up-container">
            <form className="auth-form" onSubmit={(e) => handleAuth(e, 'register')}>
              <SchoolLogo logoUrl={schoolSlug && schools.find(s => s.slug === schoolSlug)?.logo_url} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{t('createAccount')}</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">{t('parentRegistration')}</div>
              
              {fetchError && (
                <div className="p-2 mb-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-none text-xs font-bold w-full">
                  {t('loadError')}{fetchError}
                </div>
              )}

              {schoolSlug && schools.length > 0 && schools.find(s => s.slug === schoolSlug) ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none mb-4 text-left w-full">
                  <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                    <img 
                      src={schools.find(s => s.slug === schoolSlug)?.logo_url || "/logo.svg"} 
                      className="w-full h-full object-contain" 
                      alt="Logo"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{t('school')}</p>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {schools.find(s => s.slug === schoolSlug)?.name}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('last_school_slug');
                      setSelectedSchool('');
                      navigate(`/${lang}/login`);
                    }}
                    className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    {t('change')}
                  </button>
                </div>
              ) : (
                <select className="auth-input mb-4 font-bold text-slate-600 border border-slate-200" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required>
                    <option value="" disabled>{t('selectSchool')}</option>
                    {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              )}

              <input type="text" placeholder={t('fullName')} className="auth-input" value={nom} onChange={(e) => setNom(e.target.value)} required />
              <input type="tel" placeholder={t('phone')} className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder={t('password')} className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="text-left w-full mt-2 space-y-1.5 max-w-[280px]">
                <p className="text-[10px] font-bold text-slate-700">{t('privacyTitle')}</p>
                
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" required />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    {t('cguText')}<Link to={`/${lang}/conditions-utilisation`} target="_blank" className="font-bold text-slate-700 hover:underline">{t('cguLink')}</Link>{t('cguSuffix')}
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" required />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    {t('privacyText')}<Link to={`/${lang}/confidentialite`} target="_blank" className="font-bold text-slate-700 hover:underline">{t('privacyLink')}</Link>{t('privacySuffix')}
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={parentPhotoAuth} onChange={(e) => setParentPhotoAuth(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    <span className="font-bold text-slate-700">{t('imageRightsTitle')}</span>{t('imageRightsText')} <span className="text-slate-400">{t('optional')}</span>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" />
                  <span className="text-[9px] text-slate-500 leading-tight">
                    {t('marketingText')} <span className="text-slate-400">{t('optional')}</span>
                  </span>
                </label>
              </div>
              {error && <div className="text-rose-500 text-xs mt-2 font-bold">{error}</div>}
              <button className="auth-button" type="submit" disabled={loading}>{loading ? t('loading') : t('signUp')}</button>
            </form>
          </div>

          {/* Login Panel */}
          <div className="form-container sign-in-container">
            <form className="auth-form" onSubmit={(e) => handleAuth(e, 'login')}>
              <SchoolLogo logoUrl={schoolSlug && schools.find(s => s.slug === schoolSlug)?.logo_url} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{t('login')}</h1>
              <div className="social-container text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">{t('access')} {appName}</div>
              
              {fetchError && (
                <div className="p-2 mb-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-none text-xs font-bold w-full">
                  {t('loadError')}{fetchError}
                </div>
              )}

              {schoolSlug && schools.length > 0 && schools.find(s => s.slug === schoolSlug) ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none mb-4 text-left w-full">
                  <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                    <img 
                      src={schools.find(s => s.slug === schoolSlug)?.logo_url || "/logo.svg"} 
                      className="w-full h-full object-contain" 
                      alt="Logo"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{t('school')}</p>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {schools.find(s => s.slug === schoolSlug)?.name}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('last_school_slug');
                      setSelectedSchool('');
                      navigate(`/${lang}/login`);
                    }}
                    className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    {t('change')}
                  </button>
                </div>
              ) : (
                <select className="auth-input mb-4 font-bold text-slate-600 border border-slate-200" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required>
                    <option value="" disabled>{t('selectChildSchool')}</option>
                    {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              )}

              <input type="text" placeholder={t('usernamePhone')} className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder={t('password')} className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="flex items-center justify-between w-full mt-2 text-xs px-1">
                <button type="button" onClick={() => navigate(`/${lang}/mot-de-passe-oublie`)} className="text-slate-400 hover:text-amber-600 text-left">{t('forgotPassword')}</button>
                <Link 
                  to={`/${lang}/confidentialite`}
                  target="_blank"
                  className="text-slate-400 hover:text-amber-600 underline cursor-pointer"
                >
                  {t('privacyAndData')}
                </Link>
              </div>
              {trialExpiredSchool && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-none text-left">
                  <p className="text-amber-800 font-bold text-xs">{t('trialExpired')}</p>
                  <p className="text-amber-700 text-xs mt-1">"{trialExpiredSchool}"{t('trialExpiredSuffix')}</p>
                </div>
              )}
              {error && <div className="text-rose-500 text-xs mt-2 font-bold">{error}</div>}
              <button className="auth-button" type="submit" disabled={loading}>{loading ? t('connecting') : t('login')}</button>
              <div className="mt-4 flex flex-col gap-2">
                <button 
                  type="button" 
                  onClick={() => navigate(`/${lang}/portail-ecole`)}
                  className="text-slate-400 hover:text-amber-600 text-[10px] font-bold tracking-wider uppercase transition-colors"
                >
                  {t('schoolPortalAccess')}
                </button>
              </div>
            </form>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-left duration-700">{t('welcomeBack')}</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">{t('welcomeBackSub')}</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> {t('bulletDashboard')}</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> {t('bulletReportCard')}</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-amber-200 rounded-full"/> {t('bulletAlerts')}</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(false)}>{t('login')}</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1 className="text-4xl font-black tracking-tighter mb-4 animate-in slide-in-from-right duration-700">{t('helloParent')}</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-6 max-w-[300px]">{t('helloParentSub')}</p>
                <div className="flex flex-col gap-2 mb-8 text-left w-full max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> {t('bulletGrades')}</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> {t('bulletPresence')}</div>
                  <div className="flex items-center gap-2 text-xs font-bold"><div className="w-1.5 h-1.5 bg-white rounded-full"/> {t('bulletCommunication')}</div>
                </div>
                <button className="auth-button ghost hover:bg-white/10" onClick={() => setIsRightPanelActive(true)}>{t('createAccount')}</button>
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
                    <SchoolLogo size="w-20 h-20" logoUrl={schoolSlug && schools.find(s => s.slug === schoolSlug)?.logo_url} />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter text-center">
                        {view === 'login' ? t('welcomeMobile') : t('joinUsMobile')}
                    </h1>
                    <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-[0.2em] mt-2 mb-6 bg-amber-50 px-3 py-1 rounded-none">
                        {appName} • {t('excellence')}
                    </p>
                </div>

                <form onSubmit={(e) => handleAuth(e, view === 'login' ? 'login' : 'register')} className="space-y-4">
                    {fetchError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-none text-xs font-bold text-center">
                        {t('networkError')}{fetchError}
                      </div>
                    )}
                    
                    {schoolSlug && schools.length > 0 && schools.find(s => s.slug === schoolSlug) ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none mb-4 text-left w-full">
                        <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                          <img 
                            src={schools.find(s => s.slug === schoolSlug)?.logo_url || "/logo.svg"} 
                            className="w-full h-full object-contain" 
                            alt="Logo"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{t('school')}</p>
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {schools.find(s => s.slug === schoolSlug)?.name}
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('last_school_slug');
                            setSelectedSchool('');
                            navigate(`/${lang}/login`);
                          }}
                          className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                        >
                          {t('change')}
                        </button>
                      </div>
                    ) : (
                      <div className="relative mb-2">
                          <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                          <select className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold text-slate-700 appearance-none" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required>
                              <option value="" disabled>{t('selectChildSchool')}</option>
                              {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                          </select>
                      </div>
                    )}

                    {view === 'register' && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                            <input type="text" placeholder={t('fullName')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-none text-sm" value={nom} onChange={(e) => setNom(e.target.value)} required />
                        </div>
                    )}
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <input type="tel" placeholder={t('phone')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-none text-sm" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <input type="password" placeholder={t('password')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    {view === 'login' ? (
                      <div className="flex justify-between items-center px-1 text-[11px] mt-1">
                        <button type="button" onClick={() => navigate(`/${lang}/mot-de-passe-oublie`)} className="text-slate-400 hover:text-amber-600 text-left">{t('forgotPassword')}</button>
                        <Link 
                          to={`/${lang}/confidentialite`}
                          target="_blank"
                          className="text-slate-400 hover:text-amber-600 underline cursor-pointer"
                        >
                          {t('privacyAndSecurity')}
                        </Link>
                      </div>
                    ) : (
                      <div className="text-left w-full mt-2 space-y-1.5 px-1 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-bold text-slate-700">{t('privacyAndDataTogo')}</p>
                        
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" required />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            {t('cguText')}<Link to={`/${lang}/conditions-utilisation`} target="_blank" className="font-bold text-slate-700 hover:underline">{t('cguLink')}</Link>{t('cguSuffix')}
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" required />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            {t('privacyText')}<Link to={`/${lang}/confidentialite`} target="_blank" className="font-bold text-slate-700 hover:underline">{t('privacyLink')}</Link>{t('privacySuffix')}
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={parentPhotoAuth} onChange={(e) => setParentPhotoAuth(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            <span className="font-bold text-slate-700">{t('imageRightsTitle')}</span>{t('imageRightsText')} <span className="text-slate-400">{t('optional')}</span>
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 accent-amber-500 rounded-none scale-90" />
                          <span className="text-[9px] text-slate-500 leading-tight">
                            {t('yzoNews')} <span className="text-slate-400">{t('optional')}</span>
                          </span>
                        </label>
                      </div>
                    )}

                    {trialExpiredSchool && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                            <p className="text-amber-800 font-bold text-xs">{t('trialExpired')}</p>
                            <p className="text-amber-700 text-xs mt-1">"{trialExpiredSchool}"{t('trialExpiredSchoolMsg')}</p>
                        </div>
                    )}
                    {error && <div className="text-rose-500 text-xs italic text-center font-bold px-4">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full py-4 bg-amber-500 text-white rounded-none font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4 cursor-pointer">
                        {loading ? t('processing') : (view === 'login' ? t('launchMobile') : t('registerMobile'))}
                    </button>
                    
                    <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full py-2 text-amber-600 text-[10px] font-black uppercase tracking-widest mt-2">
                        {view === 'login' ? t('newCreateAccount') : t('alreadyAccount')}
                    </button>
                    {view === 'login' && (
                      <div className="flex flex-col gap-1 mt-1">
                        <button type="button" onClick={() => navigate(`/${lang}/portail-ecole`)} className="w-full py-2 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                          {t('schoolPortalAccess')}
                        </button>
                      </div>
                    )}
                </form>
            </div>
        </>
      )}

      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 z-20 text-[10px] font-black uppercase tracking-[0.3em] ${isMobile ? 'text-white/60' : 'text-slate-400'} whitespace-nowrap`}>
        <span>© {new Date().getFullYear()} {appName} • {t('connectedEducation')}</span>
        <span className="hidden sm:inline">•</span>
        <Link 
          to={`/${lang}/confidentialite`}
          target="_blank"
          className="hover:text-amber-500 transition-colors underline cursor-pointer"
        >
          {t('privacyFooter')}
        </Link>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
