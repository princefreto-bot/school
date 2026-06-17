// ============================================================
// PAGE 404 — Cool, rime, anti-IA, humain
// ============================================================
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StickerStar, StickerCurvedArrow, StickerWave, StickerSparkle } from '../components/Stickers';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center font-['Poppins'] px-6 py-12 relative overflow-hidden select-none">
      
      {/* Fond dégradé subtil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] bg-amber-400/5 rounded-full blur-[120px]" />
      </div>

      {/* Stickers éparpillés */}
      <StickerStar className="absolute top-[12%] left-[8%] hidden md:block" style={{ transform: 'rotate(-15deg)', opacity: 0.5 }} />
      <StickerCurvedArrow className="absolute top-[20%] right-[10%] hidden lg:block" style={{ transform: 'rotate(15deg) scaleX(-1)', opacity: 0.4 }} />
      <StickerWave className="absolute bottom-[15%] left-[5%] hidden md:block" style={{ opacity: 0.3 }} />
      <StickerSparkle className="absolute bottom-[25%] right-[12%] hidden md:block" style={{ opacity: 0.3 }} />

      {/* Contenu principal */}
      <div className="relative z-10 text-center max-w-xl space-y-8">
        
        {/* Gros 404 */}
        <h1 className="text-[10rem] md:text-[14rem] font-black text-slate-950 leading-none tracking-tighter" style={{ lineHeight: 0.85 }}>
          4<span className="text-amber-500">0</span>4
        </h1>

        {/* Rime cool */}
        <div className="space-y-3">
          <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
            {lang === 'fr' 
              ? "T'as pris le mauvais chemin, frérot."
              : "Yo, you took a wrong turn, bro."}
          </p>
          <p className="text-base md:text-lg text-slate-500 leading-relaxed">
            {lang === 'fr' 
              ? "Cette page a disparu dans la nature, comme un élève en retard un lundi matin."
              : "This page vanished into thin air, like a student late on a Monday morning."}
          </p>
          <p className="text-sm text-slate-400 italic mt-2">
            {lang === 'fr' 
              ? "Pas de panique, on te ramène à la maison."
              : "No worries, we'll get you back home."}
          </p>
        </div>

        {/* Séparateur ondulé SVG */}
        <svg width="120" height="12" viewBox="0 0 120 12" fill="none" className="mx-auto opacity-30">
          <path d="M2 8C20 2 40 10 60 6C80 2 100 10 118 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate(`/${lang}/`)}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-[0.97] cursor-pointer"
          >
            {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer"
          >
            {lang === 'fr' ? 'Page précédente' : 'Go Back'}
          </button>
        </div>

        {/* Petit footer */}
        <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-6">
          DGhub<span className="text-amber-500 font-black">School</span> — {lang === 'fr' ? 'La page que tu cherches n\'est plus là' : 'The page you\'re looking for isn\'t here'}
        </p>
      </div>
    </div>
  );
};
