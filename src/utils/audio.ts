// ============================================================
// AUDIO UTILS — Sons de notification
// ============================================================

/**
 * Joue le son de validation spécifique (iph.mp3).
 */
export const playSuccessSound = () => {
    const audio = new Audio('/iph.mp3');
    audio.play().catch(e => console.warn('Audio play failed:', e));
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
