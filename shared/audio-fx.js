/**
 * AudioFX - A programmatic synthesizer for Arcade Hub
 * Uses Web Audio API to create synthwave sound effects without external files.
 */
class AudioFX {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            console.log('AudioFX: Initializing AudioContext...');
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                
                // Create master chain: Compressor -> Master Gain -> Destination
                this.compressor = this.ctx.createDynamicsCompressor();
                this.masterGain = this.ctx.createGain();
                
                // Typical "loudness" compression settings
                this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
                this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
                this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
                this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
                this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
                
                this.masterGain.gain.setValueAtTime(1.5, this.ctx.currentTime); // Boost overall volume
                
                this.compressor.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
                
                console.log('AudioFX: Context and master chain created. State:', this.ctx.state);
            } else {
                console.warn('AudioFX: Web Audio API not supported');
                this.enabled = false;
                return;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            console.log('AudioFX: Resuming suspended context...');
            this.ctx.resume().then(() => {
                console.log('AudioFX: Context resumed. State:', this.ctx.state);
            });
        }
    }

    createOscillator(freq, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        osc.connect(gain);
        // Connect to compressor instead of destination
        gain.connect(this.compressor);
        return { osc, gain };
    }

    playJump() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Jump sound');
        const { osc, gain } = this.createOscillator(150, 'triangle');
        const now = this.ctx.currentTime;
        
        gain.gain.setValueAtTime(0.5, now); // Increased level
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.2); // Slower decay
        
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playEat() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Eat sound');
        const { osc, gain } = this.createOscillator(523.25, 'square'); // C5
        const now = this.ctx.currentTime;
        
        gain.gain.setValueAtTime(0.4, now); // Increased level
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // Slower decay
        
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Game Over sound');
        const { osc, gain } = this.createOscillator(300, 'sawtooth');
        const now = this.ctx.currentTime;
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        
        osc.frequency.linearRampToValueAtTime(50, now + 0.6);
        
        osc.start(now);
        osc.stop(now + 0.6);
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Level Up sound');
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        notes.forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'sine');
            gain.gain.setValueAtTime(0.3, now + i * 0.1); // Increased level
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4); // Slower decay
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }

    playTest() {
        console.log('AudioFX: Running manual test...');
        this.init();
        setTimeout(() => {
            this.playLevelUp();
            console.log('AudioFX: Test sound triggered. Current State:', this.ctx ? this.ctx.state : 'null');
        }, 100);
    }
}

const audioFX = new AudioFX();
window.audioFX = audioFX;
