import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const Newsroom: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();

  const texts = {
    fr: {
      badge: "📢 Newsroom",
      title: "Actualités & Avancées",
      subtitle: "Toutes les nouveautés, mises à jour et évolutions de la plateforme DGhubSchool.",
      art1Date: "Mai 2026",
      art1Title: "Hébergement bibliothèque numérique",
      art1Desc: "La bibliothèque numérique s'enrichit pour offrir un meilleur accès aux ressources éducatives.",
      art1TipTitle: "Comment ça fonctionne ?",
      art1TipDesc: "Il est important de noter que les établissements ne peuvent pas directement mettre leurs propres cours sur la plateforme. Cependant, les parents disposent d'un accès à un vaste catalogue de cours depuis leur espace personnel, permettant ainsi d'accompagner l'apprentissage de leurs enfants à la maison."
    },
    en: {
      badge: "📢 Newsroom",
      title: "News & Advances",
      subtitle: "All the news, updates, and developments of the DGhubSchool platform.",
      art1Date: "May 2026",
      art1Title: "Digital library hosting",
      art1Desc: "The digital library is enriched to provide better access to educational resources.",
      art1TipTitle: "How does it work?",
      art1TipDesc: "It is important to note that schools cannot directly upload their own courses onto the platform. However, parents have access to a vast catalog of courses from their personal dashboard, allowing them to support their children's learning at home."
    }
  };

  const t = texts[lang];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="w-full px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/${lang}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center transform -rotate-6">
                <img src="/logo.svg" className="w-full h-full object-contain rounded-md" alt="" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-950">
                DGhub<span className="text-amber-500">School</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full">
        <div className="space-y-6 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full inline-block">
            {t.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight uppercase leading-none">
            {t.title}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <div className="space-y-12">
          {/* Article 1 */}
          <article className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.art1Date}</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight">{t.art1Title}</h3>
              </div>
            </div>
            
            <div className="prose prose-slate prose-amber max-w-none">
              <p className="text-slate-600 leading-relaxed font-medium">
                {t.art1Desc}
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 mb-2">{t.art1TipTitle}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.art1TipDesc}
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};
