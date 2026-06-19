// ============================================================
// STICKERS DÉCORATIFS — Simplistes, faits-main, anti-IA
// Donne un aspect humain et artisanal aux pages publiques
// Ils sont positionnés en absolute et s'animent de manière ludique au survol
// ============================================================
import React from 'react';

// Chaque sticker est un SVG inline ultra-simple façon "dessiné à la main"
// Ils sont positionnés en absolute et ne gênent pas le contenu

interface StickerProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Petite étoile dessinée à la main */
export const StickerStar: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-115 hover:rotate-12 cursor-pointer`} style={style} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 4C25 16 32 23 44 24C32 25 25 32 24 44C23 32 16 25 4 24C16 23 23 16 24 4Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#FEF3C7" opacity="0.7" />
  </svg>
);

/** Petit cœur gribouilé */
export const StickerHeart: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-115 hover:-rotate-12 cursor-pointer`} style={style} width="40" height="36" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 34C20 34 3 22 3 12C3 6 8 2 13 2C16 2 19 4 20 7C21 4 24 2 27 2C32 2 37 6 37 12C37 22 20 34 20 34Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#FEF3C7" opacity="0.6" />
  </svg>
);

/** Flèche courbée façon annotation */
export const StickerCurvedArrow: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:translate-x-2 hover:-translate-y-1 cursor-pointer`} style={style} width="64" height="48" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 40C12 20 28 8 56 12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.5" />
    <path d="M50 6L56 12L48 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
);

/** Petit cercle gribouilé */
export const StickerCircle: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-110 hover:rotate-6 cursor-pointer`} style={style} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="22" cy="22" rx="18" ry="17" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" fill="none" opacity="0.4" transform="rotate(-5 22 22)" />
  </svg>
);

/** Petit zigzag / trait ondulé */
export const StickerWave: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:translate-y-[-4px] cursor-pointer`} style={style} width="72" height="20" viewBox="0 0 72 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 10C8 2 14 18 20 10C26 2 32 18 38 10C44 2 50 18 56 10C62 2 68 18 70 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
  </svg>
);

/** Checkmark rapide façon stylo */
export const StickerCheck: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-120 hover:rotate-6 cursor-pointer`} style={style} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 18L15 26L28 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
);

/** Petit post-it / note collante */
export const StickerNote: React.FC<StickerProps & { children?: React.ReactNode }> = ({ className = '', style, children }) => (
  <div className={`${className} transition-transform duration-300 hover:scale-108 hover:rotate-3 cursor-pointer`} style={style}>
    <div className="bg-amber-100/80 border border-amber-200/60 rounded-lg px-3 py-2 shadow-sm animate-pulse" style={{ maxWidth: 140, animationDuration: '4s' }}>
      <span className="text-[10px] font-bold text-amber-800 leading-tight block" style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', 'Marker Felt', cursive" }}>
        {children}
      </span>
    </div>
  </div>
);

/** Petites croix / sparkles dispersées */
export const StickerSparkle: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-125 hover:rotate-45 cursor-pointer`} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2V22M2 12H22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <path d="M5 5L19 19M19 5L5 19" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
  </svg>
);

/** Soulignement ondulé fait-main */
export const StickerUnderline: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:scale-x-110 cursor-pointer`} style={style} width="120" height="12" viewBox="0 0 120 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 8C20 2 40 10 60 6C80 2 100 10 118 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/** Point d'exclamation dessiné à la main */
export const StickerBang: React.FC<StickerProps> = ({ className = '', style }) => (
  <svg className={`${className} transition-transform duration-300 hover:translate-y-[-6px] cursor-pointer`} style={style} width="20" height="44" viewBox="0 0 20 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 4L10 28" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <circle cx="10" cy="38" r="3" fill="#F59E0B" opacity="0.5" />
  </svg>
);
