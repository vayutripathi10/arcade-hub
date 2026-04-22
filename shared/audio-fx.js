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
        
        this.isMuted = false;
        try {
            this.isMuted = localStorage.getItem('arcadeHubMuted') === 'true';
        } catch (e) {
            console.warn('AudioFX: LocalStorage access denied. Defaulting to unmuted.');
        }

        this.engineOsc = null;
        this.engineGain = null;

        // Setup UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.injectMuteButton());
        } else {
            this.injectMuteButton();
        }
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
                
                if (this.isMuted) {
                    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                } else {
                    this.masterGain.gain.setValueAtTime(1.5, this.ctx.currentTime); // Boost overall volume
                }
                
                this.compressor.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
                
                console.log('AudioFX: Context and master chain created. State:', this.ctx.state);
            } else {
                console.warn('AudioFX: Web Audio API not supported');
                this.enabled = false;
                return;
            }
        }
        
        // Always try to resume if suspended (standard browser requirement)
        if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
            this.ctx.resume().then(() => {
                console.log('AudioFX: Context resumed. State:', this.ctx.state);
            }).catch(e => console.warn('AudioFX: Resume failed', e));
        }
    }

    injectMuteButton() {
        // [DEPRECATED] Dynamic injection is disabled in favor of manual HTML placement
        // for better consistency and z-index control across all games.
        console.log('AudioFX: Dynamic injection skipped.');
        
        // Fix for mobile landscape mode overlaying correctly and UI visual bugs
        const style = document.createElement('style');
        style.textContent = `
            /* Fix invisible Quit to Menu button backgrounds for older games using share-btn */
            #btn-quit.share-btn {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #ffffff !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            #btn-quit.share-btn:hover {
                background: rgba(255, 255, 255, 0.25) !important;
            }

            @media (max-width: 600px) {
                #global-mute-btn {
                    width: 40px !important;
                    height: 40px !important;
                    font-size: 1.1rem !important;
                }
            }
            @media (max-height: 600px) and (orientation: landscape) {
                #global-mute-btn {
                    position: fixed !important;
                    z-index: 9999 !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    toggleMute() {
        this.init(); // Ensure initialized on user interaction
        this.isMuted = !this.isMuted;
        try {
            localStorage.setItem('arcadeHubMuted', this.isMuted);
        } catch (e) {}
        
        // Sync all possible mute button IDs across the platform
        const icons = this.isMuted ? ['\u{1F507}', '🔇'] : ['\u{1F50A}', '🔊'];
        const targetIds = ['global-mute-btn', 'btn-mute', 'mute-btn'];
        
        targetIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.innerHTML = icons[0];
        });

        // Update master volume if initialized
        if (this.masterGain && this.ctx) {
            if (this.isMuted) {
                this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            } else {
                this.masterGain.gain.setTargetAtTime(1.5, this.ctx.currentTime, 0.05);
            }
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

    playExplosion() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Explosion sound');
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Highpass filter to make it crunchy
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1);

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.compressor);

        noise.start(now);
        noise.stop(now + 1);
    }
    
    startEngine() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.engineOsc) return;

        // Use a triangle wave for an audible buzzy engine hum that works on mobile speakers
        const { osc, gain } = this.createOscillator(80, 'triangle');
        this.engineOsc = osc;
        this.engineGain = gain;
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.engineOsc.start(this.ctx.currentTime);
    }
    
    updateEngine(speed) {
        if (!this.engineOsc || !this.ctx) return;
        // Pitch mapping from audible idle rumble (80Hz) to high whining speed
        const pitch = 80 + (speed * 0.8);
        this.engineOsc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.05);
    }
    
    stopEngine() {
        if (this.engineOsc && this.ctx) {
            const now = this.ctx.currentTime;
            this.engineGain.gain.setTargetAtTime(0, now, 0.1);
            setTimeout(() => {
                if(this.engineOsc) this.engineOsc.stop();
                this.engineOsc = null;
                this.engineGain = null;
            }, 200);
        }
    }
    
    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        
        console.log('AudioFX: Playing Victory sound');
        const now = this.ctx.currentTime;
        // Jingle: C E G C
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'square');
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
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
