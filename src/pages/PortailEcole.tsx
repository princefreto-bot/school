// ============================================================
// PORTAIL DE CONNEXION ÉTABLISSEMENT — Administration, Directeur, Superviseur, Enseignant, Créateur, SuperAdmin
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Store, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const PortailEcole: React.FC = () => {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  
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
        navigate('/', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 text-slate-800 flex items-center justify-center font-['Inter'] p-4 relative overflow-hidden">
      {/* Effets lumineux premium discrets */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] p-6 md:p-10 shadow-2xl shadow-slate-200/50 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">Portail Établissement</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Espace réservé à l'administration de l'école.</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {fetchError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-xs text-center font-bold">
              Erreur réseau: {fetchError}
            </div>
          )}

          {/* Type d'accès (Global vs Établissement) */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
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
              <span className="text-xs font-bold text-slate-600">Accès Global (SuperAdmin / Créateur)</span>
            </label>

            {!isGlobalAccess && (
              <div className="relative animate-in slide-in-from-top-2 duration-200">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <select 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  value={selectedSchool} 
                  onChange={(e) => setSelectedSchool(e.target.value)} 
                  required={!isGlobalAccess}
                >
                  <option value="" disabled>-- Sélectionnez votre école --</option>
                  {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Identifiants */}
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Email ou Téléphone portable" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                placeholder="Mot de passe" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          {trialExpiredSchool && (
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-left">
              <p className="text-amber-600 font-extrabold text-xs">⏰ Période d'essai expirée</p>
              <p className="text-slate-600 text-[10px] mt-1 font-medium">"{trialExpiredSchool}" doit régler son abonnement auprès du SuperAdmin pour réactiver l'accès.</p>
            </div>
          )}

          {error && (
            <div className="text-rose-500 text-xs font-bold text-center py-1">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-amber-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Actions alternatives et Liens */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4 text-center">
          <button 
            onClick={() => navigate('/creer-compte')} 
            className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center justify-center gap-1.5 transition-colors group"
          >
            <span>Inscrire un nouvel établissement</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/login')} 
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors pt-2 border-t border-slate-50"
          >
            Accéder à l'espace Parent d'élève
          </button>
        </div>

      </div>
    </div>
  );
};
