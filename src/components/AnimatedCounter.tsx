import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * AnimatedCounter — Counts from 0 to target value on scroll
 * Uses GSAP for smooth number animation
 */
interface AnimatedCounterProps {
  value: string; // e.g. "+1,234" or "99.9%"
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, className = '' }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Parse the numeric value
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[^0-9,.]*$/)?.[0] || '';
    const numericStr = value.replace(prefix, '').replace(suffix, '').replace(/\s/g, '');
    const isDecimal = numericStr.includes('.') || numericStr.includes(',');
    const numericValue = parseFloat(numericStr.replace(/,/g, '.').replace(/\./g, (m, i, s) => {
      // Keep only the last dot as decimal separator
      return i === s.lastIndexOf('.') ? '.' : '';
    }));

    if (isNaN(numericValue)) {
      el.textContent = value;
      return;
    }

    // Set initial value
    el.textContent = `${prefix}0${suffix}`;

    const counter = { val: 0 };

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        gsap.to(counter, {
          val: numericValue,
          duration: 2,
          ease: 'power3.out',
          onUpdate: () => {
            if (isDecimal) {
              el.textContent = `${prefix}${counter.val.toFixed(1).replace('.', ',')}${suffix}`;
            } else {
              const formatted = Math.floor(counter.val).toLocaleString('fr-FR');
              el.textContent = `${prefix}${formatted}${suffix}`;
            }
          },
        });
      },
    });

    return () => {
      trigger.kill();
      gsap.killTweensOf(counter);
    };
  }, [value]);

  return (
    <span ref={spanRef} className={className}>
      {value}
    </span>
  );
};
