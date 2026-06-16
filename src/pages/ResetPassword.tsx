import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';
import gsap from 'gsap';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
      });
      gsap.from(cardRef.current.querySelectorAll('.rp-item'), {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.35,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Lien de réinitialisation invalide ou manquant.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
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
        setError(data.error || 'Une erreur est survenue.');
      } else {
        setMessage('Votre mot de passe a été réinitialisé avec succès !');
        setTimeout(() => navigate('/fr/portail-ecole'), 3000);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-['Poppins'] text-center">
        <div className="p-6 bg-rose-500/10 text-rose-400 rounded-2xl font-bold border border-rose-500/20 max-w-sm">
          Le lien de réinitialisation est manquant ou invalide.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-['Poppins'] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[55%] h-[55%] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-[32px] p-6 md:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative z-10">

        <div className="text-center mb-8 rp-item">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nouveau mot de passe</h1>
          <p className="text-sm text-slate-400 mt-2">Veuillez saisir votre nouveau mot de passe sécurisé.</p>
        </div>

        {message ? (
          <div className="text-center space-y-6 rp-item">
            <div className="p-6 bg-emerald-500/10 text-emerald-400 rounded-2xl flex flex-col items-center gap-3 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="font-bold">{message}</p>
              <p className="text-xs text-emerald-500/80">Redirection vers la connexion...</p>
            </div>
            <button 
              onClick={() => navigate('/fr/portail-ecole')}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition-all border border-slate-700"
            >
              Se connecter maintenant
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative rp-item">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                placeholder="Nouveau mot de passe (min 6 car.)" 
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-sm focus:outline-none transition-colors text-slate-100 placeholder-slate-500"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="relative rp-item">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                placeholder="Confirmer le mot de passe" 
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-sm focus:outline-none transition-colors text-slate-100 placeholder-slate-500"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            {error && (
              <div className="text-rose-400 text-xs font-bold text-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 rp-item">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50 rp-item"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              {!loading && <Save className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/10 text-center rp-item">
          <button
            onClick={() => navigate('/fr/portail-ecole')}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};
