import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const SubmitStory: React.FC = () => {
  const navigate = useNavigate();
  const theme = useStore((s) => s.theme);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    school_name: '',
    content: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi");
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Merci !</h1>
          <p className="text-slate-500">
            Votre témoignage a bien été reçu. Il sera examiné par notre équipe avant d'être publié.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors mt-8"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Navbar minimaliste */}
      <nav className={`px-6 h-[72px] flex items-center justify-between border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur-md sticky top-0 z-50`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 font-semibold ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <div className="font-black text-xl tracking-tight">DGhubSchool</div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4">Partagez votre histoire</h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Comment DGhubSchool vous aide au quotidien ? Racontez-nous !
          </p>
        </div>

        <div className={`p-8 sm:p-10 rounded-[2rem] shadow-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Votre Nom Complet</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Jean Dupont"
                className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Votre Rôle</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
                >
                  <option value="" disabled>Sélectionnez un rôle</option>
                  <option value="Directeur/Fondateur">Directeur / Fondateur</option>
                  <option value="Parent d'élève">Parent d'élève</option>
                  <option value="Enseignant">Enseignant</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Nom de l'école (Optionnel)</label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                  placeholder="Ex: Complexe Scolaire Les Étoiles"
                  className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Votre Témoignage</label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Racontez-nous comment la plateforme vous aide..."
                className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none`}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
                ${isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-slate-900 active:scale-[0.98]'}`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer mon témoignage</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
