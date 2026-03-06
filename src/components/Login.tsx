// ============================================================
// PAGE DE CONNEXION
// ============================================================
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Register } from './Register';
import { LinkStudent } from './LinkStudent';
import { GraduationCap, Lock, User, AlertCircle, UserPlus } from 'lucide-react';

type ViewMode = 'login' | 'register' | 'link';

export const Login: React.FC = () => {
  const login = useStore((s) => s.login);
  const [view, setView] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = await login(username, password);
    if (!ok) setError('Identifiants incorrects. Veuillez réessayer.');
    setLoading(false);
  };

  const onRegisterSuccess = async (parent: any) => {
    // Une fois inscrit, on demande de lier un enfant
    // (Note: login() est déjà appelé dans le backend par register() renvoyant un token,
    // mais ici on va juste changer la vue pour LinkStudent)
    setView('link');
    // On simule une connexion réussie pour le store si nécessaire, 
    // ou on attend que l'utilisateur se reconnecte.
    // Pour simplifier l'UX, on va relogguer l'utilisateur via le store localement.
    await login(parent.telephone, "demo123"); // Password is not known here, so we might need a store update
  };

  const finishSetup = () => {
    // Redirige vers le dashboard
    window.location.reload(); // Simple way to re-rehydrate and see the linked child
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Décoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">YZOMACAMB</h1>
          <p className="text-blue-300 mt-1 text-sm">Gestion Financière Scolaire</p>
        </div>

        {/* Carte */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">

          {view === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-white mb-6 text-center">Connexion</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Identifiant</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin, comptable, ou téléphone"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setView('register')}
                    className="text-blue-300 text-sm hover:text-white transition flex items-center justify-center gap-2 w-full"
                  >
                    <UserPlus className="w-4 h-4" />
                    Nouveau parent ? Créer un compte
                  </button>
                </div>
              </form>
            </>
          )}

          {view === 'register' && (
            <Register
              onBack={() => setView('login')}
              onSuccess={onRegisterSuccess}
            />
          )}

          {view === 'link' && (
            <LinkStudent onComplete={finishSetup} />
          )}

          )}
        </div>

        <p className="text-center text-blue-400/50 text-xs mt-6">
          © 2024 EduFinance — Tous droits réservés
        </p>
      </div>
    </div>
  );
};
