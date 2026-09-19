import { useEffect, useRef } from 'react';

/**
 * Applies GSAP ScrollTrigger reveal animations to elements with [data-reveal].
 *
 * Usage:
 *   const containerRef = useScrollReveal();
 *   <div ref={containerRef}>
 *     <h1 data-reveal="up">Title</h1>
 *     <div data-reveal="left">Content</div>
 *     <div data-reveal="right" data-reveal-delay="0.2">Delayed</div>
 *     <ul data-reveal-stagger>
 *       <li>Item 1</li>
 *       <li>Item 2</li>
 *     </ul>
 *   </div>
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobileOrLowEnd =
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isMobileOrLowEnd) return;

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([gsapModule, { ScrollTrigger }]) => {
        if (cancelled) return;
        const gsap = gsapModule.default;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const reveals = container.querySelectorAll('[data-reveal]');
          reveals.forEach((el) => {
            const dir = (el as HTMLElement).dataset.reveal || 'up';
            const delay = parseFloat((el as HTMLElement).dataset.revealDelay || '0');
            const vars: Record<string, unknown> = {
              opacity: 0,
              duration: 0.9,
              delay,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%' },
            };
            if (dir === 'up') vars.y = 40;
            else if (dir === 'down') vars.y = -40;
            else if (dir === 'left') vars.x = -50;
            else if (dir === 'right') vars.x = 50;
            else if (dir === 'scale') { vars.scale = 0.92; vars.y = 25; }
            gsap.from(el, vars);
          });

          const staggers = container.querySelectorAll('[data-reveal-stagger]');
          staggers.forEach((el) => {
            if (el.children.length === 0) return;
            gsap.from(el.children, {
              opacity: 0,
              y: 20,
              scale: 0.92,
              duration: 0.5,
              stagger: 0.1,
              ease: 'back.out(1.5)',
              scrollTrigger: { trigger: el, start: 'top 88%' },
            });
          });
        }, container);
      }
    );

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return containerRef;
}
