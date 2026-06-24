// ============================================================
// PAGE D'INSCRIPTION ÉTABLISSEMENT — Épurée & Rectangulaire
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, School, User, Phone, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config';

const translations = {
  fr: {
    back: "Retour",
    schoolAccountCreation: "Création Compte Établissement",
    joinTitle: "Rejoignez DGhubSchool",
    joinSubtitle: "Inscrivez votre école et commencez à digitaliser votre gestion scolaire dès aujourd'hui.",
    acceptConsentError: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité.",
    slugRequired: "Le code d'établissement (slug) est requis.",
    registerError: "Une erreur est survenue lors de l'inscription.",
    sectionSchoolInfo: "1. Informations de l'Établissement",
    schoolNameLabel: "Nom de l'école *",
    schoolNamePlaceholder: "Ex: C.S. YZOMACAMB",
    schoolSlugLabel: "Code unique d'école (Slug) *",
    schoolSlugPlaceholder: "Uniquement lettres et chiffres",
    schoolSlugDesc: "Sert d'identifiant technique (ex: csyzomacamb). Sans espace ni caractères spéciaux.",
    schoolAddressLabel: "Adresse de l'établissement",
    schoolAddressPlaceholder: "Ex: Agoé BKS, Lomé, Togo",
    schoolPhoneLabel: "Téléphone de l'école",
    schoolPhonePlaceholder: "Ex: +228 90 00 00 00",
    sectionAdminInfo: "2. Directeur / Administrateur",
    adminNameLabel: "Nom complet du Directeur *",
    adminNamePlaceholder: "Ex: Koffi MENSAN",
    adminPhoneLabel: "Numéro mobile du Directeur *",
    adminPhonePlaceholder: "Ex: +228 99 99 99 99",
    adminEmailLabel: "Adresse Email Réelle * (Pour validation gratuite)",
    adminEmailPlaceholder: "directeur@ecole.com",
    adminEmailDesc: "Un code de confirmation y sera envoyé immédiatement.",
    adminPasswordLabel: "Mot de passe Administrateur *",
    adminPasswordPlaceholder: "Minimum 6 caractères",
    cguText: "J'accepte les ",
    cguLink: "Conditions Générales d'Utilisation",
    cguSuffix: " de la plateforme. *",
    privacyText: "J'autorise la collecte et le traitement sécurisé des données selon la ",
    privacyLink: "Politique de Confidentialité",
    privacySuffix: " (conforme IPDCP). *",
    marketingText: "J'accepte de recevoir des actus et conseils d'optimisation scolaire d'YZO. (Optionnel)",
    processing: "Traitement en cours...",
    submitRequest: "Envoyer la demande d'admission",
  },
  en: {
    back: "Back",
    schoolAccountCreation: "School Account Creation",
    joinTitle: "Join DGhubSchool",
    joinSubtitle: "Register your school and start digitizing your school management today.",
    acceptConsentError: "You must accept the terms of use and the privacy policy.",
    slugRequired: "The school code (slug) is required.",
    registerError: "An error occurred during registration.",
    sectionSchoolInfo: "1. School Information",
    schoolNameLabel: "School Name *",
    schoolNamePlaceholder: "e.g. C.S. YZOMACAMB",
    schoolSlugLabel: "Unique School Code (Slug) *",
    schoolSlugPlaceholder: "Letters and numbers only",
    schoolSlugDesc: "Used as a technical identifier (e.g. csyzomacamb). No spaces or special characters.",
    schoolAddressLabel: "School Address",
    schoolAddressPlaceholder: "e.g. Agoé BKS, Lomé, Togo",
    schoolPhoneLabel: "School Phone Number",
    schoolPhonePlaceholder: "e.g. +228 90 00 00 00",
    sectionAdminInfo: "2. Principal / Administrator",
    adminNameLabel: "Principal's Full Name *",
    adminNamePlaceholder: "e.g. Koffi MENSAN",
    adminPhoneLabel: "Principal's Mobile Number *",
    adminPhonePlaceholder: "e.g. +228 99 99 99 99",
    adminEmailLabel: "Real Email Address * (For free validation)",
    adminEmailPlaceholder: "principal@school.com",
    adminEmailDesc: "A confirmation code will be sent there immediately.",
    adminPasswordLabel: "Administrator Password *",
    adminPasswordPlaceholder: "Minimum 6 characters",
    cguText: "I accept the ",
    cguLink: "Terms and Conditions of Use",
    cguSuffix: " of the platform. *",
    privacyText: "I authorize the secure collection and processing of data according to the ",
    privacyLink: "Privacy Policy",
    privacySuffix: " (IPDCP compliant). *",
    marketingText: "I accept to receive news and school optimization tips from YZO. (Optional)",
    processing: "Processing...",
    submitRequest: "Submit Admission Request",
  }
};

export const CreerCompte: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentLang = (lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const t = (key: keyof typeof translations['fr']) => translations[currentLang][key];

  // Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adminNom, setAdminNom] = useState('');
  const [adminTelephone, setAdminTelephone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Auto-générer le code d'établissement (slug) à partir du nom
  useEffect(() => {
    const clean = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]/g, ''); // Garde uniquement lettres et chiffres
    setSlug(clean);
  }, [name]);

  // Demande d'inscription
  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t('acceptConsentError'));
      return;
    }

    if (!slug) {
      setError(t('slugRequired'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-school-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          address,
          phone,
          email,
          admin_nom: adminNom,
          admin_telephone: adminTelephone,
          admin_password: adminPassword,
          accepted_terms: acceptedTerms,
          accepted_privacy_policy: acceptedPrivacy,
          marketing_consent: marketingConsent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('registerError'));
      }

      // Redirection vers l'écran de confirmation d'e-mail avec l'état
      navigate(`/${lang}/confirmer-email`, { state: { email } });
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

      {/* Remplacement de rounded-[32px] par rounded-none */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-none p-6 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* En-tête de page */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button 
            onClick={() => navigate(`/${lang}/portail-ecole`)} 
            className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-600 font-extrabold uppercase text-[10px] tracking-widest px-3 py-1 rounded-none border border-amber-100">
            {t('schoolAccountCreation')}
          </div>
        </div>

        <form onSubmit={handleRegisterRequest} className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-none flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10 p-1">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="DGhubSchool" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight uppercase">{t('joinTitle')}</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">{t('joinSubtitle')}</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-none text-xs md:text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 border-l-2 border-amber-500 pl-2">{t('sectionSchoolInfo')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('schoolNameLabel')}</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('schoolNamePlaceholder')} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('schoolSlugLabel')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                  <input 
                    type="text" 
                    placeholder={t('schoolSlugPlaceholder')} 
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors font-bold text-amber-600"
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                    required 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium">{t('schoolSlugDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('schoolAddressLabel')}</label>
                <input 
                  type="text" 
                  placeholder={t('schoolAddressPlaceholder')} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('schoolPhoneLabel')}</label>
                <input 
                  type="tel" 
                  placeholder={t('schoolPhonePlaceholder')} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 border-l-2 border-amber-500 pl-2">{t('sectionAdminInfo')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('adminNameLabel')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('adminNamePlaceholder')} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={adminNom} 
                    onChange={(e) => setAdminNom(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('adminPhoneLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder={t('adminPhonePlaceholder')} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={adminTelephone} 
                    onChange={(e) => setAdminTelephone(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('adminEmailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder={t('adminEmailPlaceholder')} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium">{t('adminEmailDesc')}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('adminPasswordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder={t('adminPasswordPlaceholder')} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checkboxes de consentements avec liens cliquables */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={acceptedTerms} 
                onChange={(e) => setAcceptedTerms(e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
                required 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                {t('cguText')}<Link to={`/${lang}/conditions-utilisation`} target="_blank" className="font-bold text-slate-855 text-amber-600 hover:underline">{t('cguLink')}</Link>{t('cguSuffix')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={acceptedPrivacy} 
                onChange={(e) => setAcceptedPrivacy(e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
                required 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                {t('privacyText')}<Link to={`/${lang}/confidentialite`} target="_blank" className="font-bold text-slate-855 text-amber-600 hover:underline">{t('privacyLink')}</Link>{t('privacySuffix')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={marketingConsent} 
                onChange={(e) => setMarketingConsent(e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                {t('marketingText')}
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-amber-500 text-slate-900 font-black text-xs md:text-sm uppercase tracking-wider rounded-none shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? t('processing') : t('submitRequest')}
          </button>
        </form>
      </div>
    </div>
  );
};
