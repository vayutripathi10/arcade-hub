/**
 * AudioFX - A programmatic synthesizer for Arcade Hub
 * Uses Web Audio API to create synthwave sound effects without external files.
 */
class AudioFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createOscillator(freq, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        return { osc, gain };
    }

    playJump() {
        if (!this.enabled) return;
        this.init();
        const { osc, gain } = this.createOscillator(150, 'triangle');
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playEat() {
        if (!this.enabled) return;
        this.init();
        const { osc, gain } = this.createOscillator(523.25, 'square'); // C5
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.init();
        const { osc, gain } = this.createOscillator(300, 'sawtooth');
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.5);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        notes.forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'sine');
            gain.gain.setValueAtTime(0.05, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }
}

const audioFX = new AudioFX();
window.audioFX = audioFX;
