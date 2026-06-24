import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface SubmitStoryTranslations {
  back: string;
  title: string;
  subtitle: string;
  successTitle: string;
  successDesc: string;
  successBtn: string;
  labelName: string;
  placeholderName: string;
  labelRole: string;
  selectRole: string;
  rolePrincipal: string;
  roleParent: string;
  roleTeacher: string;
  roleOther: string;
  labelSchool: string;
  placeholderSchool: string;
  labelText: string;
  placeholderText: string;
  btnSubmit: string;
  errorSend: string;
  errorGeneral: string;
}

const translations: Record<'fr' | 'en', SubmitStoryTranslations> = {
  fr: {
    back: "Retour",
    title: "Partagez votre histoire",
    subtitle: "Comment DGhubSchool vous aide au quotidien ? Racontez-nous !",
    successTitle: "Merci !",
    successDesc: "Votre témoignage a bien été reçu. Il sera examiné par notre équipe avant d'être publié.",
    successBtn: "Retour à l'accueil",
    labelName: "Votre Nom Complet",
    placeholderName: "Ex: Jean Dupont",
    labelRole: "Votre Rôle",
    selectRole: "Sélectionnez un rôle",
    rolePrincipal: "Directeur / Fondateur",
    roleParent: "Parent d'élève",
    roleTeacher: "Enseignant",
    roleOther: "Autre",
    labelSchool: "Nom de l'école (Optionnel)",
    placeholderSchool: "Ex: Complexe Scolaire Les Étoiles",
    labelText: "Votre Témoignage",
    placeholderText: "Racontez-nous comment la plateforme vous aide...",
    btnSubmit: "Envoyer mon témoignage",
    errorSend: "Erreur lors de l'envoi",
    errorGeneral: "Une erreur est survenue. Veuillez réessayer."
  },
  en: {
    back: "Back",
    title: "Share your story",
    subtitle: "How does DGhubSchool help you daily? Tell us!",
    successTitle: "Thank you!",
    successDesc: "Your story has been received. It will be reviewed by our team before being published.",
    successBtn: "Back to home",
    labelName: "Your Full Name",
    placeholderName: "e.g., John Doe",
    labelRole: "Your Role",
    selectRole: "Select a role",
    rolePrincipal: "Principal / Founder",
    roleParent: "Parent",
    roleTeacher: "Teacher",
    roleOther: "Other",
    labelSchool: "School Name (Optional)",
    placeholderSchool: "e.g., Stars School Complex",
    labelText: "Your Story",
    placeholderText: "Tell us how the platform helps you...",
    btnSubmit: "Send my story",
    errorSend: "Error during sending",
    errorGeneral: "An error occurred. Please try again."
  }
};

export const SubmitStory: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const activeLang = (lang === 'fr' || lang === 'en') ? lang : 'fr';
  const t = translations[activeLang];
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
        throw new Error(t.errorSend);
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      setError(t.errorGeneral);
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
          <h1 className="text-3xl font-black tracking-tight">{t.successTitle}</h1>
          <p className="text-slate-500">
            {t.successDesc}
          </p>
          <button
            onClick={() => navigate(`/${activeLang}`)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors mt-8"
          >
            {t.successBtn}
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
          <span>{t.back}</span>
        </button>
        <div className="font-black text-xl tracking-tight">DGhubSchool</div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4">{t.title}</h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.subtitle}
          </p>
        </div>

        <div className={`p-8 sm:p-10 rounded-[2rem] shadow-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-slate-500">{t.labelName}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={t.placeholderName}
                className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500">{t.labelRole}</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
                >
                  <option value="" disabled>{t.selectRole}</option>
                  <option value="Directeur/Fondateur">{t.rolePrincipal}</option>
                  <option value="Parent d'élève">{t.roleParent}</option>
                  <option value="Enseignant">{t.roleTeacher}</option>
                  <option value="Autre">{t.roleOther}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500">{t.labelSchool}</label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                  placeholder={t.placeholderSchool}
                  className={`w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-slate-500">{t.labelText}</label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder={t.placeholderText}
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
                  <span>{t.btnSubmit}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
