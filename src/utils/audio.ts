// ============================================================
// AUDIO UTILS — Sons de notification
// ============================================================

// ── Contexte & buffer global pour iph.mp3 ──────────────────
// On utilise Web Audio API (fetch → decode) pour contourner
// la politique autoplay des navigateurs dans les callbacks QR.
let _audioCtx: AudioContext | null = null;
let _iphBuffer: AudioBuffer | null = null;

const getCtx = (): AudioContext => {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _audioCtx;
};

/**
 * À appeler UNE FOIS sur un clic utilisateur (ex: bouton "Activer caméra").
 * Déverrouille l'AudioContext et pré-charge iph.mp3 dans un buffer.
 */
export const unlockAudio = async () => {
    try {
        const ctx = getCtx();
        // Réveille le contexte suspendu par la politique autoplay
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        // Pré-charge le son si pas encore fait
        if (!_iphBuffer) {
            const response = await fetch('/iph.mp3');
            const arrayBuffer = await response.arrayBuffer();
            _iphBuffer = await ctx.decodeAudioData(arrayBuffer);
        }
    } catch (err) {
        console.warn('Audio unlock/preload échoué:', err);
    }
};

/**
 * Fallback bip simple (Web Audio API — jamais bloqué).
 */
export const playBeep = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
        console.error('Audio feedback not supported:', err);
    }
};

/**
 * Joue le son de validation spécifique (iph.mp3).
 * Utilise le buffer pré-chargé par unlockAudio() pour éviter
 * le blocage autoplay dans les callbacks QR.
 */
export const playSuccessSound = () => {
    try {
        const ctx = getCtx();
        if (_iphBuffer) {
            // Lecture via BufferSourceNode — jamais bloquée par autoplay
            const source = ctx.createBufferSource();
            source.buffer = _iphBuffer;
            source.connect(ctx.destination);
            source.start(0);
        } else {
            // Buffer pas encore chargé → tenter quand même avec <audio>
            const audio = new Audio('/iph.mp3');
            audio.play().catch(() => playBeep());
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
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio feedback not supported:', e);
    }
};

/**
 * Bip d'avertissement (élève sans parent lié) — tonalité descendante.
 */
export const playWarningBeep = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
        console.error('Impossible de jouer le son davertissement:', err);
    }
};
