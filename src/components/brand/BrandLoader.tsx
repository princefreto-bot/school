// ============================================================
// BrandLoader — animation de chargement aux couleurs DGhubSchool.
// Le monogramme "DG" se dessine puis se remplit, pendant que des
// stickers scolaires (livre, crayon, toque, étoile, reçu) apparaissent
// autour. 100 % SVG inline + CSS (transform/opacity) : aucun fichier
// à télécharger, fluide sur mobile, figé si "réduire les animations".
// ============================================================
import React from 'react';
import { LOGO_MONOGRAM_PATH } from './logoPaths';

type Size = 'sm' | 'md' | 'lg';

interface BrandLoaderProps {
  /** sm : dans une carte/section · md : zone de page (défaut) · lg : plein écran */
  size?: Size;
  label?: string;
  /** Centre le loader dans tout l'écran (overlay de démarrage). */
  fullscreen?: boolean;
  className?: string;
}

const Sticker: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`brand-loader__sticker ${className}`} aria-hidden="true">
    <svg viewBox="0 0 32 32" width="100%" height="100%">{children}</svg>
  </span>
);

const STICKERS = (
  <>
    {/* Livre ouvert */}
    <Sticker className="brand-loader__sticker--1">
      <path d="M5 9c4-1.5 7.5-1 11 1.5v14C12.5 22 9 21.5 5 23z" fill="#fde68a" />
      <path d="M27 9c-4-1.5-7.5-1-11 1.5v14c3.5-2.5 7-3 11-1.5z" fill="#fcd34d" />
      <path d="M16 10.5v14" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 12.5c2-.4 3.9-.1 5.6.8M8 16c2-.4 3.9-.1 5.6.8M18.4 13.3c1.7-.9 3.6-1.2 5.6-.8M18.4 16.8c1.7-.9 3.6-1.2 5.6-.8" stroke="#b45309" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </Sticker>
    {/* Crayon */}
    <Sticker className="brand-loader__sticker--2">
      <g transform="rotate(-45 16 16)">
        <rect x="6" y="12.5" width="15" height="7" rx="1" fill="#f2ae06" />
        <rect x="6" y="12.5" width="3" height="7" rx="1" fill="#f472b6" />
        <rect x="9" y="12.5" width="1.6" height="7" fill="#cbd5e1" />
        <path d="M21 12.5l6 3.5-6 3.5z" fill="#fde68a" />
        <path d="M25 15l2 1-2 1z" fill="#0f172a" />
      </g>
    </Sticker>
    {/* Toque de diplômé */}
    <Sticker className="brand-loader__sticker--3">
      <path d="M16 7L3 13l13 6 13-6z" fill="#0f172a" />
      <path d="M9 16v5c0 1.8 3.1 3.5 7 3.5s7-1.7 7-3.5v-5l-7 3.2z" fill="#1e293b" />
      <path d="M26 14v6" stroke="#f2ae06" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="21" r="1.6" fill="#f2ae06" />
    </Sticker>
    {/* Étoile */}
    <Sticker className="brand-loader__sticker--4">
      <path d="M16 4.5l3.4 7 7.6 1-5.5 5.3 1.3 7.6L16 21.8l-6.8 3.6 1.3-7.6L5 12.5l7.6-1z" fill="#f2ae06" stroke="#b45309" strokeWidth="1" strokeLinejoin="round" />
    </Sticker>
    {/* Reçu de paiement */}
    <Sticker className="brand-loader__sticker--5">
      <path d="M8 4h16v24l-2.7-1.8L18.7 28 16 26.2 13.3 28l-2.6-1.8L8 28z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11.5 10h9M11.5 14h9M11.5 18h5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="21" cy="20.5" r="3.2" fill="#10b981" />
      <path d="M19.6 20.5l1 1 1.8-1.9" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Sticker>
  </>
);

export const BrandLoader: React.FC<BrandLoaderProps> = ({ size = 'md', label = 'Chargement', fullscreen = false, className = '' }) => {
  const loader = (
    <div className={`brand-loader brand-loader--${size} ${className}`} role="status" aria-live="polite">
      <div className="brand-loader__stage">
        <span className="brand-loader__halo" aria-hidden="true" />
        {size !== 'sm' && STICKERS}
        <svg className="brand-loader__logo" viewBox="-10 -10 700 530" aria-hidden="true">
          <path className="brand-loader__stroke" d={LOGO_MONOGRAM_PATH} pathLength={1} fillRule="evenodd" />
        </svg>
      </div>
      {label && (
        <span className="brand-loader__label">
          {label}
          <span className="brand-loader__dots" aria-hidden="true"><i /><i /><i /></span>
        </span>
      )}
    </div>
  );

  if (!fullscreen) return loader;
  return <div className="brand-loader__screen">{loader}</div>;
};

/** Remplace l'ancien spinner de page : centré avec marge verticale. */
export const PageLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center justify-center min-h-[16rem] py-12">
    <BrandLoader size="md" label={label} />
  </div>
);
