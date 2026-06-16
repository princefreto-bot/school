import { useEffect } from 'react';

/**
 * Hook to toggle the Müller-Brockmann grid overlay by pressing the 'G' key.
 * Adds the 'grid-on' class to the body.
 */
export const useGridToggle = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle only if the user is not typing in an input or textarea
      if (
        e.key.toLowerCase() === 'g' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        document.body.classList.toggle('grid-on');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
