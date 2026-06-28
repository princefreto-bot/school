import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useReveal — GSAP ScrollTrigger reveal animation hook
 * Supports: fade-up, fade-left, fade-right, scale-in, stagger-children
 */
type RevealMode = 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'stagger-children';

interface UseRevealOptions {
  mode?: RevealMode;
  delay?: number;
  duration?: number;
  staggerAmount?: number;
  start?: string;
  once?: boolean;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(options: UseRevealOptions = {}) {
  const ref = useRef<T>(null);
  const {
    mode = 'fade-up',
    delay = 0,
    duration = 0.9,
    staggerAmount = 0.12,
    start = 'top 88%',
    once = true,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let fromVars: gsap.TweenVars = { opacity: 0 };
    const toVars: gsap.TweenVars = { opacity: 1, duration, delay, ease: 'power3.out' };

    switch (mode) {
      case 'fade-up':
        fromVars = { ...fromVars, y: 50 };
        toVars.y = 0;
        break;
      case 'fade-left':
        fromVars = { ...fromVars, x: -60 };
        toVars.x = 0;
        break;
      case 'fade-right':
        fromVars = { ...fromVars, x: 60 };
        toVars.x = 0;
        break;
      case 'scale-in':
        fromVars = { ...fromVars, scale: 0.88 };
        toVars.scale = 1;
        break;
      case 'stagger-children':
        break;
    }

    if (mode === 'stagger-children') {
      const children = el.children;
      if (children.length === 0) return;

      gsap.set(children, { opacity: 0, y: 30 });
      
      const tween = gsap.to(children, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger: staggerAmount,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: once ? 'play none none none' : 'play none none reverse',
        },
      });

      return () => {
        tween.kill();
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
      };
    } else {
      gsap.set(el, fromVars);

      const tween = gsap.to(el, {
        ...toVars,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: once ? 'play none none none' : 'play none none reverse',
        },
      });

      return () => {
        tween.kill();
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
      };
    }
  }, [mode, delay, duration, staggerAmount, start, once]);

  return ref;
}
