// Synthetic Audio Utility using Web Audio API
// This avoids the need for external assets and ensures immediate playback

class AudioController {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.ctx && this.ctx.state === 'suspended' && !muted) {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (this.isMuted || !this.ctx) return;

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
            return;
        }

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio play failed', e);
        }
    }

    playPegHit() {
        // Sharp metallic click
        this.playTone(800 + Math.random() * 200, 'sine', 0.1, 0.05);
    }

    playWin(multiplier) {
        if (this.isMuted || !this.ctx) return;

        // Victory Arpeggio
        const baseFreq = 440; // A4
        const notes = [1, 1.25, 1.5, 2]; // Major chord

        notes.forEach((ratio, i) => {
            setTimeout(() => {
                this.playTone(baseFreq * ratio, 'triangle', 0.3, 0.1);
            }, i * 100);
        });

        // Extra flair for high multipliers
        if (multiplier > 5) {
            setTimeout(() => {
                this.playTone(880 * 2, 'square', 0.5, 0.1);
            }, 400);
        }
    }
}

export const audioController = new AudioController();
