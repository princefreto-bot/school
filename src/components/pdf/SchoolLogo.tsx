// ============================================================
// SchoolLogo / EmployerLogo — logo officiel de l'établissement
// Rendu net à l'écran comme à l'impression. Si aucun logo n'est
// fourni, affiche un espace réservé élégant (monogramme) sans
// casser la mise en page. Utilisé sur les reçus ET les bulletins.
// ============================================================
import React from 'react';

interface SchoolLogoProps {
  /** URL/base64 du logo (paramètres de l'établissement). */
  src?: string | null;
  /** Nom de l'établissement — sert à générer le monogramme de secours. */
  name?: string;
  /** Côté du carré, en millimètres (impression fidèle). Défaut : 16mm. */
  sizeMm?: number;
  className?: string;
}

const initials = (name?: string) =>
  (name || '')
    .replace(/[^A-Za-zÀ-ÿ\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '—';

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ src, name, sizeMm = 16, className = '' }) => {
  const box: React.CSSProperties = {
    width: `${sizeMm}mm`,
    height: `${sizeMm}mm`,
    flex: `0 0 ${sizeMm}mm`,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `Logo ${name}` : 'Logo'}
        className={`object-contain ${className}`}
        style={{ ...box, imageRendering: 'auto', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
      />
    );
  }

  // ── Espace réservé élégant : monogramme dans un carré à filet fin ──
  return (
    <div
      className={`flex items-center justify-center border border-neutral-300 ${className}`}
      style={box}
      aria-label="Logo de l'établissement (non défini)"
    >
      <span
        className="font-semibold text-neutral-400 leading-none"
        style={{ fontSize: `${Math.max(6, sizeMm * 0.34)}mm`, letterSpacing: '0.02em' }}
      >
        {initials(name)}
      </span>
    </div>
  );
};

// Alias sémantique demandé (identique — un établissement est l'employeur sur un bulletin).
export const EmployerLogo = SchoolLogo;

export default SchoolLogo;
