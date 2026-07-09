import React, { useRef, useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition — enveloppe un contenu de page dans une animation
 * d'entrée fluide, en CSS pur (GPU-composited, pas de reflow).
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-transition-running');
    void el.offsetWidth; // force reflow minimal une seule fois
    el.classList.add('page-transition-running');
  }, []);

  return (
    <div
      ref={ref}
      className={`page-transition-running ${className}`}
    >
      {children}
    </div>
  );
};
