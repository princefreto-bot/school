// ============================================================
// AUDIO UTILS — Sons de notification
// ============================================================

import iphSound from '../assets/iph.mp3';

export const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (err) {
        console.error('Audio feedback not supported:', err);
    }
};

/**
 * Joue le son de validation spécifique (iph.mp3).
 */
export const playSuccessSound = () => {
    try {
        const audio = new Audio(iphSound);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.error('Erreur lecture audio (autoplay ou format):', err);
                // Fallback de sécurité si l'audio mp3 bloque
                playBeep();
            });
        }
    } catch (err) {
        console.error('Impossible de jouer le son de validation:', err);
        playBeep();
    }
};

/**
 * Joue un son d'erreur (buzzer).
 */
export const playErrorSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Son de buzzer (dent de scie + fréquence basse)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio feedback not supported:', e);
    }
};

export const playWarningBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Son différent (tonalité qui descend)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.3); 
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
        console.error('Impossible de jouer le son davertissement:', err);
    }
};
