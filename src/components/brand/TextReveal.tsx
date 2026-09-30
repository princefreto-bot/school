// ============================================================
// Effets de texte au défilement — desktop ET mobile.
//
//  <WordRise text="..." />   titres : les mots montent un par un depuis
//                            un masque quand le titre entre à l'écran.
//  <ScrollWords text="..." /> sous-titres : les mots s'allument
//                            progressivement au rythme du défilement.
//
// Pas de GSAP ici : un seul IntersectionObserver partagé + un seul écouteur
// de scroll (rAF) qui écrit UNE variable CSS par paragraphe visible. Tout le
// reste est du CSS (transform/opacity) → fluide même sur téléphone d'entrée
// de gamme. Les spans sont rendus par React (jamais de découpage du DOM à la
// main), donc un changement de langue ne casse rien.
// ============================================================
import React, { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Observer partagé : ajoute .is-in au premier passage à l'écran ──
let revealObserver: IntersectionObserver | null = null;
function observeOnce(el: HTMLElement) {
  if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return () => {}; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealObserver?.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  }
  revealObserver.observe(el);
  return () => revealObserver?.unobserve(el);
}

// ── Scroll partagé : met à jour --p (0 → 1) des paragraphes visibles ──
const scrubTargets = new Set<HTMLElement>();
const visibleScrub = new Set<HTMLElement>();
let scrubObserver: IntersectionObserver | null = null;
let ticking = false;

function updateScrub() {
  ticking = false;
  const vh = window.innerHeight;
  visibleScrub.forEach((el) => {
    const r = el.getBoundingClientRect();
    // 0 quand le haut du texte arrive à 88 % de l'écran, 1 quand son bas passe à 45 %.
    const start = vh * 0.88;
    const end = vh * 0.45;
    const p = (start - r.top) / (start - end + r.height);
    el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(3));
  });
}
function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScrub); }
}
function registerScrub(el: HTMLElement) {
  if (!scrubObserver) {
    scrubObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const t = e.target as HTMLElement;
        if (e.isIntersecting) visibleScrub.add(t); else visibleScrub.delete(t);
      });
      onScroll();
    });
  }
  if (scrubTargets.size === 0) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }
  scrubTargets.add(el);
  scrubObserver.observe(el);
  return () => {
    scrubObserver?.unobserve(el);
    scrubTargets.delete(el);
    visibleScrub.delete(el);
    if (scrubTargets.size === 0) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };
}

const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

/** Titres : mots qui montent un par un. S'insère DANS le <h2>/<h3> existant. */
export const WordRise: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { el.classList.add('is-in'); return; }
    el.classList.remove('is-in');
    return observeOnce(el);
  }, [text]);

  const words = splitWords(text);
  return (
    <span ref={ref} className="tr-rise">
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="tr-rise__mask">
            <span className="tr-rise__word" style={{ '--i': Math.min(i, 14) } as React.CSSProperties}>{w}</span>
          </span>
          {i < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </span>
  );
};

/** Sous-titres : mots qui s'allument au rythme du défilement. */
export const ScrollWords: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const words = splitWords(text);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.classList.add('tr-scrub--on');
    const unregister = registerScrub(el);
    return () => { el.classList.remove('tr-scrub--on'); unregister(); };
  }, [text]);

  return (
    <span ref={ref} className="tr-scrub" style={{ '--n': words.length } as React.CSSProperties}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="tr-scrub__word" style={{ '--i': i } as React.CSSProperties}>{w}</span>
          {i < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </span>
  );
};
