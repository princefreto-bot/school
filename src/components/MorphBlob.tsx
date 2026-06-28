import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * MorphBlob — Animated SVG blob that morphs between organic shapes
 * Used as decorative background element
 */
interface MorphBlobProps {
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}

// 4 organic blob paths to morph between
const BLOB_PATHS = [
  'M44.5,-76.3C56.3,-68.4,63.4,-53.3,70.8,-38.6C78.2,-23.9,85.8,-9.5,84.7,4.2C83.5,18,73.7,31,63.1,41.5C52.5,52,41.1,60,28.3,65.6C15.5,71.2,1.4,74.3,-13.6,74.1C-28.5,73.9,-44.3,70.3,-55.4,61.1C-66.4,51.9,-72.7,37,-77.3,21.2C-81.9,5.5,-84.8,-11.1,-80.1,-25.1C-75.4,-39.2,-63.1,-50.7,-49.3,-57.8C-35.5,-65,-20.2,-67.9,-2.7,-63.8C14.8,-59.6,32.7,-84.3,44.5,-76.3Z',
  'M39.8,-67.7C50.9,-60.4,58.5,-47.6,65.5,-34C72.5,-20.5,78.8,-6.1,77.8,7.8C76.8,21.6,68.5,35,57.8,44.7C47.1,54.5,34,60.7,19.8,66.6C5.7,72.5,-9.5,78.1,-23.9,76.1C-38.4,74.1,-52.1,64.5,-61.5,51.8C-70.8,39.1,-75.8,23.2,-77.5,6.8C-79.3,-9.5,-77.8,-26.4,-70.1,-39.3C-62.4,-52.2,-48.5,-61.2,-34.7,-66.7C-20.8,-72.2,-7,-74.2,4.8,-81.6C16.6,-89,28.6,-75,39.8,-67.7Z',
  'M46.2,-78.5C58.6,-70.4,66.5,-55.1,73.2,-39.5C79.9,-23.8,85.3,-7.8,83.3,7.1C81.2,22,71.7,35.8,60.5,46.7C49.3,57.6,36.5,65.7,22.1,71.3C7.8,76.9,-8.1,80,-22.1,76.4C-36.1,72.8,-48.2,62.5,-57.7,50.2C-67.2,37.9,-74.2,23.5,-76.4,8.2C-78.5,-7.2,-75.9,-23.5,-68.4,-37C-60.9,-50.5,-48.5,-61.2,-35,-68C-21.5,-74.8,-6.8,-77.7,5.8,-86.8C18.3,-95.9,33.7,-86.6,46.2,-78.5Z',
  'M41.5,-72C52.6,-63.7,59.8,-49.9,66.9,-35.8C74,-21.6,81,-7.2,80.2,6.7C79.4,20.6,70.7,34,60.4,45C50.1,56,38.2,64.6,24.7,69.5C11.2,74.3,-3.8,75.4,-18.5,72.7C-33.2,70,-47.5,63.5,-57.4,52.7C-67.4,42,-73,27,-75.5,11.3C-78.1,-4.4,-77.6,-20.7,-71.1,-34.1C-64.5,-47.5,-51.9,-57.9,-38.3,-64.9C-24.7,-71.9,-10.1,-75.5,3.5,-81.3C17.1,-87.1,30.4,-80.2,41.5,-72Z',
];

export const MorphBlob: React.FC<MorphBlobProps> = ({
  color = 'rgba(245,158,11,0.08)',
  size = 500,
  className = '',
  style,
  speed = 8,
}) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    // Detect mobile or low performance preference to bypass continuous rendering loop
    const isMobileOrLowEnd = typeof window !== 'undefined' && (
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    if (isMobileOrLowEnd) {
      return;
    }

    let currentIndex = 0;

    const morphToNext = () => {
      currentIndex = (currentIndex + 1) % BLOB_PATHS.length;
      gsap.to(path, {
        attr: { d: BLOB_PATHS[currentIndex] },
        duration: speed,
        ease: 'sine.inOut',
        onComplete: morphToNext,
      });
    };

    morphToNext();

    return () => {
      gsap.killTweensOf(path);
    };
  }, [speed]);

  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      className={`morph-blob ${className}`}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    >
      <path
        ref={pathRef}
        d={BLOB_PATHS[0]}
        fill={color}
        transform="translate(0, 0)"
      />
    </svg>
  );
};
