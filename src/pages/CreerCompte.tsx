// ============================================================
// PAGE D'INSCRIPTION ÉTABLISSEMENT & VÉRIFICATION D'EMAIL
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, School, ShieldCheck, User, Phone, Lock, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const CreerCompte: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States - Étape 1
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

  // Form States - Étape 2 (Code)
  const [code, setCode] = useState('');

  // Auto-générer le code d'établissement (slug) à partir du nom
  useEffect(() => {
    // Supprimer les caractères spéciaux, les espaces et convertir en minuscules
    // On n'autorise que les lettres et chiffres pour correspondre au format de nom de table de la DB
    const clean = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]/g, ''); // Garde uniquement lettres et chiffres
    setSlug(clean);
  }, [name]);

  // Demande d'inscription (Étape 1)
  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    if (!slug) {
      setError("Le code d'établissement (slug) est requis.");
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
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
      }

      setStep(2);
      setSuccessMsg(data.message || "Code de validation envoyé avec succès !");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validation du code par email (Étape 2)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-school-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la validation.");
      }

      // Succès final
      alert("Votre compte établissement a été créé et activé avec succès !");
      navigate('/portail-ecole', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-['Poppins'] p-4 md:p-8 relative overflow-hidden">
      {/* Background gradients pour effet premium */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* En-tête de page */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
          <button 
            onClick={() => step === 2 ? setStep(1) : navigate('/portail-ecole')} 
            className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 font-extrabold uppercase text-[10px] tracking-widest px-3 py-1 rounded-full border border-amber-500/20">
            Création Compte Établissement
          </div>
        </div>

        {step === 1 ? (
          /* ================= ÉTAPE 1 ================= */
          <form onSubmit={handleRegisterRequest} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <GraduationCap className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Rejoignez DGhubSchool</h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">Inscrivez votre école et commencez à digitaliser votre gestion scolaire dès aujourd'hui.</p>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs md:text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 border-l-2 border-amber-500 pl-2">1. Informations de l'Établissement</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Nom de l'école *</label>
                  <div className="relative">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Ex: C.S. YZOMACAMB" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Code unique d'école (Slug) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">@</span>
                    <input 
                      type="text" 
                      placeholder="Uniquement lettres et chiffres" 
                      className="w-full pl-8 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-amber-500"
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                      required 
                    />
                  </div>
                  <p className="text-[9px] text-slate-500">Sert d'identifiant technique (ex: csyzomacamb). Sans espace ni caractères spéciaux.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Adresse de l'établissement</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Agoé BKS, Lomé, Togo" 
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Téléphone de l'école</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: +228 90 00 00 00" 
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 border-l-2 border-amber-500 pl-2">2. Directeur / Administrateur</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Nom complet du Directeur *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Ex: Koffi MENSAN" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={adminNom} 
                      onChange={(e) => setAdminNom(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Numéro mobile du Directeur *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      placeholder="Ex: +228 99 99 99 99" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={adminTelephone} 
                      onChange={(e) => setAdminTelephone(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Adresse Email Réelle * (Pour validation gratuite)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      placeholder="directeur@ecole.com" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <p className="text-[9px] text-slate-500">Un code de confirmation y sera envoyé immédiatement.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Mot de passe Administrateur *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      placeholder="Minimum 6 caractères" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checkboxes de consentements */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)} 
                  className="mt-1 accent-amber-500 rounded scale-95" 
                  required 
                />
                <span className="text-[10px] md:text-xs text-slate-400 leading-snug">
                  J'accepte les <span className="font-extrabold text-slate-200">Conditions Générales d'Utilisation</span> de la plateforme. <span className="text-rose-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={acceptedPrivacy} 
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)} 
                  className="mt-1 accent-amber-500 rounded scale-95" 
                  required 
                />
                <span className="text-[10px] md:text-xs text-slate-400 leading-snug">
                  J'autorise la collecte et le traitement sécurisé des données selon la <span className="font-extrabold text-slate-200">Politique de Confidentialité</span> (conforme IPDCP). <span className="text-rose-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={marketingConsent} 
                  onChange={(e) => setMarketingConsent(e.target.checked)} 
                  className="mt-1 accent-amber-500 rounded scale-95" 
                />
                <span className="text-[10px] md:text-xs text-slate-400 leading-snug">
                  J'accepte de recevoir des actus et conseils d'optimisation scolaire d'YZO. <span className="text-slate-500">(Optionnel)</span>
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-amber-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Traitement en cours...' : 'Inscrire mon établissement'}
            </button>
          </form>
        ) : (
          /* ================= ÉTAPE 2 ================= */
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-6 animate-in slide-in-from-top duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                <ShieldCheck className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Vérifiez votre Email</h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Un code de vérification à 6 chiffres a été envoyé à l'adresse suivante :<br />
                <span className="font-bold text-amber-500 text-sm">{email}</span>
              </p>
            </div>

            {successMsg && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl text-xs md:text-sm font-bold text-center">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs md:text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-2 max-w-[280px] mx-auto text-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Saisir le code à 6 chiffres</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="0 0 0 0 0 0" 
                className="w-full text-center py-4 bg-slate-950/60 border-2 border-dashed border-slate-800 focus:border-amber-500 rounded-2xl text-2xl font-black tracking-[8px] focus:outline-none transition-colors"
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} 
                required 
              />
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">Vous n'avez pas reçu le code ?</p>
              <button 
                type="button" 
                onClick={handleRegisterRequest} 
                disabled={loading}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline mt-1 disabled:opacity-50"
              >
                Renvoyer le code de validation
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-blue-600 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/10 hover:bg-blue-500 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Validation en cours...' : 'Confirmer mon adresse email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
