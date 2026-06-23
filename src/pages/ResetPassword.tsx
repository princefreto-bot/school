import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 font-['Poppins'] text-center">
        <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-200 max-w-sm">
          Le lien de réinitialisation est manquant ou invalide.
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nouveau mot de passe</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Veuillez saisir votre nouveau mot de passe sécurisé.</p>
        </div>

        {message ? (
          <div className="text-center space-y-6 rp-item">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl flex flex-col items-center gap-3 border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-bold">{message}</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Redirection vers la connexion...</p>
            </div>
            <button 
              onClick={() => navigate('/fr/portail-ecole')}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
            >
              Se connecter maintenant
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative rp-item">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="password" 
                placeholder="Nouveau mot de passe (min 6 car.)" 
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
                placeholder="Confirmer le mot de passe" 
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
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              {!loading && <Save className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center rp-item">
          <button
            onClick={() => navigate('/fr/portail-ecole')}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};
