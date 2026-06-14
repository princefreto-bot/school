// ============================================================
// PAGE D'INSCRIPTION ÉTABLISSEMENT — Épurée & Rectangulaire
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, School, User, Phone, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const CreerCompte: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Redirection vers l'écran de confirmation d'e-mail avec l'état
      navigate('/confirmer-email', { state: { email } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 text-slate-800 flex items-center justify-center font-['Inter'] p-4 md:p-8 relative overflow-hidden">
      {/* Background gradients pour effet premium */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-none blur-[120px] pointer-events-none" />

      {/* Remplacement de rounded-[32px] par rounded-none */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-none p-6 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* En-tête de page */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button 
            onClick={() => navigate('/portail-ecole')} 
            className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-600 font-extrabold uppercase text-[10px] tracking-widest px-3 py-1 rounded-none border border-amber-100">
            Création Compte Établissement
          </div>
        </div>

        <form onSubmit={handleRegisterRequest} className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500 rounded-none flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 border border-amber-600">
              <GraduationCap className="w-9 h-9 text-slate-950" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">Rejoignez DGhubSchool</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Inscrivez votre école et commencez à digitaliser votre gestion scolaire dès aujourd'hui.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-none text-xs md:text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 border-l-2 border-amber-500 pl-2">1. Informations de l'Établissement</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nom de l'école *</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ex: C.S. YZOMACAMB" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Code unique d'école (Slug) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                  <input 
                    type="text" 
                    placeholder="Uniquement lettres et chiffres" 
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors font-bold text-amber-600"
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                    required 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Sert d'identifiant technique (ex: csyzomacamb). Sans espace ni caractères spéciaux.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Adresse de l'établissement</label>
                <input 
                  type="text" 
                  placeholder="Ex: Agoé BKS, Lomé, Togo" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Téléphone de l'école</label>
                <input 
                  type="tel" 
                  placeholder="Ex: +228 90 00 00 00" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 border-l-2 border-amber-500 pl-2">2. Directeur / Administrateur</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nom complet du Directeur *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ex: Koffi MENSAN" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={adminNom} 
                    onChange={(e) => setAdminNom(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Numéro mobile du Directeur *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="Ex: +228 99 99 99 99" 
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Adresse Email Réelle * (Pour validation gratuite)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="directeur@ecole.com" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-none text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Un code de confirmation y sera envoyé immédiatement.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mot de passe Administrateur *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Minimum 6 caractères" 
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
                onChange={(e) => setAcceptedTerms(e.checked ?? e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
                required 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                J'accepte les <a href="/#/conditions-utilisation" target="_blank" className="font-bold text-slate-855 text-amber-600 hover:underline">Conditions Générales d'Utilisation</a> de la plateforme. <span className="text-rose-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={acceptedPrivacy} 
                onChange={(e) => setAcceptedPrivacy(e.checked ?? e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
                required 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                J'autorise la collecte et le traitement sécurisé des données selon la <a href="/#/confidentialite" target="_blank" className="font-bold text-slate-855 text-amber-600 hover:underline">Politique de Confidentialité</a> (conforme IPDCP). <span className="text-rose-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={marketingConsent} 
                onChange={(e) => setMarketingConsent(e.checked ?? e.target.checked)} 
                className="mt-1 accent-amber-500 rounded-none scale-95" 
              />
              <span className="text-[10px] md:text-xs text-slate-500 leading-snug font-medium">
                J'accepte de recevoir des actus et conseils d'optimisation scolaire d'YZO. <span className="text-slate-400">(Optionnel)</span>
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-amber-500 text-slate-900 font-black text-xs md:text-sm uppercase tracking-wider rounded-none shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? 'Traitement en cours...' : 'Inscrire mon établissement'}
          </button>
        </form>
      </div>
    </div>
  );
};
