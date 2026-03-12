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
        
        // ── Trick Safari : Jouer un silence immédiat sur le clic ────────────────
        const silentOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        silentOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        silentOsc.start(0);
        silentOsc.stop(0.1);

        // Réveille le contexte suspendu par la politique autoplay
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        console.log('🔊 AudioContext déverrouillé. État:', ctx.state);

        // Pré-charge le son si pas encore fait
        if (!_iphBuffer) {
            console.log('🔄 Chargement de iph.mp3...');
            const response = await fetch('/iph.mp3');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            _iphBuffer = await ctx.decodeAudioData(arrayBuffer);
            console.log('✅ iph.mp3 chargé dans le buffer.');
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
        console.log('🎵 playSuccessSound() appelé. État AudioContext:', ctx.state);
        
        if (_iphBuffer) {
            console.log('🔊 Lecture via AudioBufferSourceNode (Méthode Web Audio API)');
            const source = ctx.createBufferSource();
            source.buffer = _iphBuffer;
            source.connect(ctx.destination);
            source.start(0);
        } else {
            console.warn('⚠️ Buffer iph.mp3 non chargé, tentative via élément <audio>');
            const audio = new Audio('/iph.mp3');
            audio.play()
                .then(() => console.log('✅ Lecture via <audio> réussie'))
                .catch((e) => {
                    console.error('❌ Échec lecture <audio>:', e.message);
                    playBeep();
                });
        }
    } catch (err) {
        console.error('❌ Erreur fatale dans playSuccessSound:', err);
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
