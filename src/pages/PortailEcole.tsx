// ============================================================
// PORTAIL DE CONNEXION ÉTABLISSEMENT — Administration, Directeur, Superviseur, Enseignant, Créateur, SuperAdmin
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Store, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import gsap from 'gsap';

export const PortailEcole: React.FC = () => {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const cardRef = useRef<HTMLDivElement>(null);

  
  // Auth Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [trialExpiredSchool, setTrialExpiredSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Selection Établissement
  const [schools, setSchools] = useState<{slug: string, name: string, logo_url: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGlobalAccess, setIsGlobalAccess] = useState(false);

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
      });
      gsap.from(cardRef.current.querySelectorAll('.portal-animate-item'), {
        y: 24,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.3,
      });
    }
  }, []);

  useEffect(() => {
    // Récupérer la liste des écoles
    setFetchError(null);
    fetch(`${API_BASE_URL}/schools`)
      .then(res => {
         if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);
         return res.json();
      })
      .then(data => {
         if (Array.isArray(data)) {
           setSchools(data);
         } else {
           setFetchError("Le format de données reçu est incorrect.");
         }
      })
      .catch(err => {
         console.error("Fetch error:", err);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTrialExpiredSchool(null);
    setLoading(true);

    try {
      // Envoyer le slug vide si accès global sélectionné
      const schoolSlugToSend = isGlobalAccess ? '' : selectedSchool;
      
      if (!isGlobalAccess && !selectedSchool) {
        setError("Veuillez sélectionner un établissement ou cocher l'accès global.");
        setLoading(false);
        return;
      }

      // Appeler le login avec le paramètre 'school'
      const ok = await login(username, password, schoolSlugToSend, 'school');
      if (!ok) {
        setError('Identifiants incorrects.');
      } else {
        navigate(`/${lang}/`, { replace: true });
      }
    } catch (err: any) {
      const msg: string = err?.message || err?.error || "Une erreur est survenue.";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-800 flex items-center justify-center font-['Poppins'] p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[55%] h-[55%] bg-amber-600/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-amber-500/10 to-transparent pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-[32px] p-6 md:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* En-tête */}
        <div className="text-center mb-8 portal-animate-item">
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-none flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 p-1">
            <img src="/logo.svg" className="w-full h-full object-contain" alt="DGhubSchool" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Portail Établissement</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium">Éspace réservé à l'administration de l'école.</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {fetchError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs text-center font-bold portal-animate-item">
              Erreur réseau: {fetchError}
            </div>
          )}

          {/* Type d'accès (Global vs Établissement) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 portal-animate-item">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isGlobalAccess} 
                onChange={(e) => {
                  setIsGlobalAccess(e.target.checked);
                  if (e.target.checked) setSelectedSchool('');
                }} 
                className="accent-amber-500 rounded" 
              />
              <span className="text-xs font-bold text-slate-300">Accès Global (SuperAdmin / Créateur)</span>
            </label>

            {!isGlobalAccess && (
              <div className="relative animate-in slide-in-from-top-2 duration-200">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <select 
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-2xl text-xs md:text-sm font-bold text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  value={selectedSchool} 
                  onChange={(e) => setSelectedSchool(e.target.value)} 
                  required={!isGlobalAccess}
                >
                  <option value="" disabled className="bg-slate-800">-- Sélectionnez votre école --</option>
                  {schools.map(s => <option key={s.slug} value={s.slug} className="bg-slate-800">{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Identifiants */}
          <div className="space-y-3 portal-animate-item">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Email ou Téléphone portable" 
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none transition-colors text-slate-100 placeholder-slate-500"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                placeholder="Mot de passe" 
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none transition-colors text-slate-100 placeholder-slate-500"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="flex items-center justify-end w-full text-xs px-1">
              <button type="button" onClick={() => navigate(`/${lang}/mot-de-passe-oublie-ecole`)} className="text-slate-500 hover:text-amber-500 font-medium transition-colors">Mot de passe oublié ?</button>
            </div>
          </div>

          {trialExpiredSchool && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left">
              <p className="text-amber-400 font-extrabold text-xs">⏰ Période d'essai expirée</p>
              <p className="text-slate-400 text-[10px] mt-1 font-medium">"{trialExpiredSchool}" doit régler son abonnement auprès du SuperAdmin pour réactiver l'accès.</p>
            </div>
          )}

          {error && (
            <div className="text-rose-400 text-xs font-bold text-center py-1">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-amber-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.35)] hover:bg-amber-400 hover:shadow-[0_12px_30px_rgba(245,158,11,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 portal-animate-item"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Actions alternatives et Liens */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-4 text-center portal-animate-item">
          <button 
            onClick={() => navigate(`/${lang}/creer-compte`)} 
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors group"
          >
            <span>Inscrire un nouvel établissement</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate(`/${lang}/login`)} 
            className="text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors pt-2 border-t border-white/5"
          >
            Accéder à l'espace Parent d'élève
          </button>
        </div>

      </div>
    </div>
  );
};
