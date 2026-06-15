import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const Newsroom: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center transform -rotate-6">
                <span className="text-white font-black text-sm">DG</span>
              </div>
              <span className="font-black text-xl tracking-tight text-slate-950 dark:text-white">
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
            📢 Newsroom
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tight uppercase leading-none">
            Actualités & Avancées
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Toutes les nouveautés, mises à jour et évolutions de la plateforme DGhubSchool.
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Article 1 */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mai 2026</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">Hébergement bibliothèque numérique</h3>
              </div>
            </div>
            
            <div className="prose prose-slate dark:prose-invert prose-amber max-w-none">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                La bibliothèque numérique s'enrichit pour offrir un meilleur accès aux ressources éducatives. 
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mt-6">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white mb-2">Comment ça fonctionne ?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Il est important de noter que <strong>les établissements ne peuvent pas directement mettre leurs propres cours sur la plateforme</strong>. Cependant, <strong>les parents disposent d'un accès à un vaste catalogue de cours</strong> depuis leur espace personnel, permettant ainsi d'accompagner l'apprentissage de leurs enfants à la maison.
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
