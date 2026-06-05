// Safe localStorage Wrapper to prevent SecurityErrors in sandboxed/third-party iframe environments
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage.getItem access denied:", e);
            return this._fallback[key] || null;
        }
    },
    setItem(key, val) {
        try {
            localStorage.setItem(key, val);
        } catch (e) {
            console.warn("localStorage.setItem access denied:", e);
            this._fallback[key] = String(val);
        }
    },
    _fallback: {}
};

// Game Constants
const PLAYER_SIZE = 40;
const INVADER_SIZE = 30;
const BULLET_SPEED = 7;
const INVADER_SPEED_BASE = 1;
const INVADER_DROP_DIST = 20;

const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00ea',
    danger: '#ff3c00',
    bg: '#050505',
    bullets: '#fff',
    powerup: '#39ff14'
};

// Web Audio API Sound Engine
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        
        // Music sequencer properties
        this.musicInterval = null;
        this.musicStep = 0;
        this.musicBpm = 110;
        this.musicPlaying = false;
        
        // 8-step bass line in C-Minor
        // C2 = 65.41 Hz, Eb2 = 77.78 Hz, G2 = 98.00 Hz, F2 = 87.31 Hz
        this.bassSequence = [65.41, 65.41, 77.78, 77.78, 98.00, 98.00, 87.31, 87.31];
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    setMuted(muted) { 
        this.muted = muted; 
    }

    startMusic() {
        if (this.musicPlaying) return;
        this.init();
        this.musicPlaying = true;
        this.musicStep = 0;
        this.scheduleNextBeat();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }

    setBpm(bpm) {
        this.musicBpm = Math.min(200, Math.max(90, bpm));
    }

    scheduleNextBeat() {
        if (!this.musicPlaying) return;

        const now = this.ctx.currentTime;
        const noteFreq = this.bassSequence[this.musicStep];
        this.playBassNote(noteFreq, now);

        this.musicStep = (this.musicStep + 1) % this.bassSequence.length;
        
        const beatDuration = 60 / this.musicBpm / 2; // eighth notes
        this.musicInterval = setTimeout(() => {
            this.scheduleNextBeat();
        }, beatDuration * 1000);
    }

    playBassNote(freq, time) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, time);
        filter.frequency.exponentialRampToValueAtTime(800, time + 0.02);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);

        gain.gain.setValueAtTime(0.03, time); // slightly lower bass to not overpower SFX
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        subOsc.start(time);
        osc.stop(time + 0.25);
        subOsc.stop(time + 0.25);
    }

    play(type) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch(type) {
            case 'shoot':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
                
                // Sub-oscillator for laser bass crunch
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sawtooth';
                subOsc.frequency.setValueAtTime(150, now);
                subOsc.frequency.linearRampToValueAtTime(40, now + 0.12);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                
                subGain.gain.setValueAtTime(0.04, now);
                subGain.gain.linearRampToValueAtTime(0, now + 0.12);
                
                subOsc.start(now);
                subOsc.stop(now + 0.12);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'explode':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                
                // Procedural white noise buffer for explosion dust
                if (this.ctx.createBuffer) {
                    const bufferSize = this.ctx.sampleRate * 0.3;
                    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;
                    
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, now);
                    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                    
                    const noiseGain = this.ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.12, now);
                    noiseGain.gain.linearRampToValueAtTime(0, now + 0.3);
                    
                    noise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(this.ctx.destination);
                    noise.start(now);
                    noise.stop(now + 0.3);
                }

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.linearRampToValueAtTime(660, now + 0.15);
                osc.frequency.linearRampToValueAtTime(990, now + 0.3);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'hit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.linearRampToValueAtTime(30, now + 0.25);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'levelup':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.08, now + 0.24);
                gain.gain.linearRampToValueAtTime(0, now + 0.32);
                osc.start(now);
                osc.stop(now + 0.32);
                break;
            case 'victory':
                // Triumphant ascending synth arpeggio chord for game completion
                const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
                chordNotes.forEach((f, idx) => {
                    const noteOsc = this.ctx.createOscillator();
                    const noteGain = this.ctx.createGain();
                    noteOsc.type = 'sawtooth';
                    noteOsc.frequency.setValueAtTime(f, now + idx * 0.08);
                    
                    noteGain.gain.setValueAtTime(0.06, now + idx * 0.08);
                    noteGain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.3);
                    noteGain.gain.linearRampToValueAtTime(0, now + idx * 0.08 + 0.5);
                    
                    noteOsc.connect(noteGain);
                    noteGain.connect(this.ctx.destination);
                    noteOsc.start(now + idx * 0.08);
                    noteOsc.stop(now + idx * 0.08 + 0.5);
                });
                break;
        }
    }
}

const soundManager = new SoundManager();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const levelTag = document.getElementById('level-tag');
const livesEl = document.getElementById('lives-display');

// Game State
let gameState = 'START';
let isPaused = false;
let isMuted = false;
let score = 0;
let bestScore = safeStorage.getItem('neonInvadersBest') || 0;
let wave = 1;
let invaderDirection = 1;
let invaderMoveInterval = 1000; // ms
let invaderMoveTimer = 0;
let lastTimestamp = 0;

class Player {
    constructor() {
        this.w = PLAYER_SIZE;
        this.h = PLAYER_SIZE * 0.6;
        this.x = canvas.width / 2 - this.w / 2;
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.y = canvas.height - this.h - (isMobile ? 80 : 20);
        this.targetX = this.x;
        this.lives = isMobile ? 4 : 3;
        this.invincible = 0;
        this.powerups = {
            triple: 0,
            rapid: 0,
            shield: false
        };
    }

    update(deltaTime) {
        // Spaceship movement speed scales slightly on higher stages
        const speedScale = 1.0 + (wave - 1) * 0.04;
        if (isDragging) {
            this.x += (this.targetX - (this.x + this.w/2)) * 0.2 * deltaTime * speedScale;
        } else {
            const moveSpeed = 7 * deltaTime * speedScale;
            if (keys.ArrowLeft || keys.a) this.x -= moveSpeed;
            if (keys.ArrowRight || keys.d) this.x += moveSpeed;
        }

        // Clamp
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));

        if (this.invincible > 0) this.invincible -= deltaTime;
        
        // Decay powerups
        if (this.powerups.triple > 0) this.powerups.triple -= deltaTime;
        if (this.powerups.rapid > 0) this.powerups.rapid -= deltaTime;
    }

    hit() {
        if (this.invincible > 0) return;
        
        if (this.powerups.shield) {
            this.powerups.shield = false;
            this.invincible = 60;
            soundManager.play('explode');
            triggerScreenshake(8, 12);
            return;
        }

        this.lives--;
        this.invincible = 120;
        updateHUD();
        soundManager.play('hit');
        triggerScreenshake(18, 25);
        
        if (this.lives <= 0) gameOver();
    }

    draw() {
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shield Effect
        if (this.powerups.shield) {
            ctx.beginPath();
            ctx.arc(this.w/2, this.h/2, this.w, 0, Math.PI*2);
            ctx.strokeStyle = COLORS.primary;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        
        // 1. Draw Thruster Flame (animated)
        const flameHeight = 10 + Math.sin(Date.now() / 30) * 8;
        ctx.beginPath();
        ctx.moveTo(this.w * 0.4, this.h);
        ctx.lineTo(this.w * 0.5, this.h + flameHeight);
        ctx.lineTo(this.w * 0.6, this.h);
        ctx.closePath();
        ctx.fillStyle = COLORS.danger;
        ctx.shadowColor = COLORS.danger;
        ctx.fill();
        
        // Restore ship shadow color
        ctx.shadowColor = COLORS.primary;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // fill ship body so grid doesn't show through
        
        // 2. Draw Ship Body (detailed vector)
        ctx.beginPath();
        // Nose cone
        ctx.moveTo(this.w / 2, 0);
        // Right wingtip
        ctx.lineTo(this.w * 0.7, this.h * 0.5);
        ctx.lineTo(this.w, this.h * 0.9);
        ctx.lineTo(this.w * 0.8, this.h * 0.9);
        // Back center
        ctx.lineTo(this.w * 0.5, this.h * 0.7);
        // Left wingtip
        ctx.lineTo(this.w * 0.2, this.h * 0.9);
        ctx.lineTo(0, this.h * 0.9);
        ctx.lineTo(this.w * 0.3, this.h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 3. Draw Cockpit (inner neon highlight)
        ctx.beginPath();
        ctx.moveTo(this.w / 2, this.h * 0.25);
        ctx.lineTo(this.w * 0.6, this.h * 0.55);
        ctx.lineTo(this.w * 0.4, this.h * 0.55);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    }
}

class Invader {
    constructor(x, y, type, hp = 1) {
        this.x = x;
        this.y = y;
        this.w = INVADER_SIZE;
        this.h = INVADER_SIZE;
        this.type = type; // 1, 2, 3
        this.hp = hp;
        this.maxHp = hp;
        this.color = (type === 1) ? COLORS.primary : (type === 2) ? COLORS.secondary : COLORS.danger;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = (this.hp > 1) ? 4 : 2;

        const pad = 5;
        if (this.type === 1) {
            const anim = Math.sin(Date.now() / 150) > 0;
            ctx.beginPath();
            ctx.moveTo(pad, this.h * 0.3);
            ctx.lineTo(this.w - pad, this.h * 0.3);
            ctx.lineTo(this.w - pad * 2, this.h * 0.7);
            ctx.lineTo(pad * 2, this.h * 0.7);
            ctx.closePath();
            ctx.stroke();
            
            // Draw eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.w * 0.3, this.h * 0.4, 3, 3);
            ctx.fillRect(this.w * 0.6, this.h * 0.4, 3, 3);
            
            // Legs
            ctx.beginPath();
            if (anim) {
                ctx.moveTo(pad * 2, this.h * 0.7); ctx.lineTo(pad, this.h * 0.95);
                ctx.moveTo(this.w - pad * 2, this.h * 0.7); ctx.lineTo(this.w - pad, this.h * 0.95);
                ctx.moveTo(this.w / 2, this.h * 0.7); ctx.lineTo(this.w / 2, this.h * 0.9);
            } else {
                ctx.moveTo(pad * 2, this.h * 0.7); ctx.lineTo(pad * 3, this.h * 0.95);
                ctx.moveTo(this.w - pad * 2, this.h * 0.7); ctx.lineTo(this.w - pad * 3, this.h * 0.95);
                ctx.moveTo(this.w * 0.35, this.h * 0.7); ctx.lineTo(this.w * 0.2, this.h * 0.95);
                ctx.moveTo(this.w * 0.65, this.h * 0.7); ctx.lineTo(this.w * 0.8, this.h * 0.95);
            }
            ctx.stroke();
            
            if (this.hp > 1) {
                // outer ring for armored invader
                ctx.strokeRect(pad-2, pad-2, this.w - (pad-2)*2, this.h - (pad-2)*2);
            }
        } else if (this.type === 2) {
            const anim = Math.sin(Date.now() / 120) > 0;
            // Head
            ctx.beginPath();
            ctx.arc(this.w / 2, this.h * 0.4, this.w / 2 - pad, Math.PI, 0);
            ctx.lineTo(this.w - pad, this.h * 0.6);
            ctx.lineTo(pad, this.h * 0.6);
            ctx.closePath();
            ctx.stroke();
            
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.w * 0.35, this.h * 0.45, 3, 3);
            ctx.fillRect(this.w * 0.55, this.h * 0.45, 3, 3);
            
            // Tentacles
            ctx.beginPath();
            if (anim) {
                ctx.moveTo(this.w * 0.25, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.15, this.h * 0.8, this.w * 0.2, this.h * 0.95);
                ctx.moveTo(this.w * 0.5, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.5, this.h * 0.8, this.w * 0.5, this.h * 0.95);
                ctx.moveTo(this.w * 0.75, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.85, this.h * 0.8, this.w * 0.8, this.h * 0.95);
            } else {
                ctx.moveTo(this.w * 0.25, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.35, this.h * 0.8, this.w * 0.3, this.h * 0.95);
                ctx.moveTo(this.w * 0.5, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.4, this.h * 0.8, this.w * 0.4, this.h * 0.95);
                ctx.moveTo(this.w * 0.75, this.h * 0.6); ctx.quadraticCurveTo(this.w * 0.65, this.h * 0.8, this.w * 0.7, this.h * 0.95);
            }
            ctx.stroke();
            
            if (this.hp > 1) {
                // outer ring for armored invader
                ctx.beginPath();
                ctx.arc(this.w / 2, this.h * 0.4, this.w / 2 - pad + 3, Math.PI, 0);
                ctx.stroke();
            }
        } else {
            const pulse = 1 + Math.sin(Date.now() / 80) * 0.08;
            ctx.scale(pulse, pulse);
            const offset = (this.w * (1 - pulse)) / 2;
            ctx.translate(offset / pulse, offset / pulse);
            
            // Diamond/Star Body
            ctx.beginPath();
            ctx.moveTo(this.w/2, pad);
            ctx.lineTo(this.w - pad, this.h/2);
            ctx.lineTo(this.w/2, this.h - pad);
            ctx.lineTo(pad, this.h/2);
            ctx.closePath();
            ctx.stroke();
            
            // Horns/Antennae
            ctx.beginPath();
            ctx.moveTo(this.w * 0.3, pad + 5); ctx.lineTo(this.w * 0.2, pad - 2);
            ctx.moveTo(this.w * 0.7, pad + 5); ctx.lineTo(this.w * 0.8, pad - 2);
            ctx.stroke();
            
            // Glowing eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.w * 0.45, this.h * 0.45, 4, 4);
            
            if (this.hp > 1) {
                // Outer ring
                ctx.beginPath();
                ctx.arc(this.w/2, this.h/2, this.w/2 - pad + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, dy, color, dx = 0) {
        this.x = x;
        this.y = y;
        this.w = (dy < 0 && wave >= 7) ? 5 : 3;
        this.h = 10;
        this.dy = dy;
        this.dx = dx;
        this.color = color;
    }

    update(deltaTime) {
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        if (Math.abs(this.dx) > 0.1) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.w;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.dx * 1.5, this.y + this.dy * 1.5);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillRect(this.x - this.w/2, this.y, this.w, this.h);
        }
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 25;
        this.h = 25;
        this.type = type; // triple, rapid, shield
        this.dy = 2;
        this.label = type === 'triple' ? '🔱' : type === 'rapid' ? '⚡' : '🛡️';
    }

    update(deltaTime) {
        this.y += this.dy * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.powerup;
        ctx.fillStyle = COLORS.powerup;
        ctx.fillText(this.label, this.x, this.y);
        
        ctx.strokeStyle = COLORS.powerup;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, type = 'spark') {
        this.x = x;
        this.y = y;
        this.type = type; // 'spark', 'debris', 'ring'
        this.color = color;
        this.life = 1.0;
        
        if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.decay = 0.02 + Math.random() * 0.02;
            this.length = 5 + Math.random() * 10;
        } else if (type === 'debris') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.decay = 0.015 + Math.random() * 0.015;
            this.size = 2 + Math.random() * 3;
            this.rotation = Math.random() * Math.PI * 2;
            this.vr = (Math.random() - 0.5) * 0.2;
        } else if (type === 'ring') {
            this.vx = 0;
            this.vy = 0;
            this.radius = 2;
            this.maxRadius = 25 + Math.random() * 15;
            this.decay = 0.04;
            this.lineWidth = 2;
        }
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        if (this.type === 'spark') {
            this.vx *= Math.pow(0.95, deltaTime); // drag
            this.vy *= Math.pow(0.95, deltaTime);
        } else if (this.type === 'debris') {
            this.vx *= Math.pow(0.97, deltaTime);
            this.vy *= Math.pow(0.97, deltaTime);
            this.rotation += this.vr * deltaTime;
        } else if (this.type === 'ring') {
            this.radius += (this.maxRadius - this.radius) * 0.15 * deltaTime;
        }
        
        this.life -= this.decay * deltaTime;
    }

    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        if (this.type === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            // Draw line back along velocity vector
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 0.1) {
                ctx.lineTo(this.x - (this.vx / speed) * this.length, this.y - (this.vy / speed) * this.length);
            } else {
                ctx.lineTo(this.x, this.y);
            }
            ctx.stroke();
        } else if (this.type === 'debris') {
            ctx.fillStyle = this.color;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'ring') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class ShieldBlock {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.hp = 3;
    }

    draw() {
        if (this.hp <= 0) return;
        ctx.save();
        ctx.shadowBlur = this.hp * 4;
        ctx.shadowColor = COLORS.primary;
        ctx.strokeStyle = COLORS.primary;
        ctx.globalAlpha = 0.3 + 0.7 * (this.hp / 3);
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

class Shield {
    constructor(x, y) {
        this.blocks = [];
        const rows = 4;
        const cols = 8;
        const blockW = 8;
        const blockH = 8;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r >= 2 && c >= 2 && c <= 5) continue;
                this.blocks.push(new ShieldBlock(x + c * blockW, y + r * blockH, blockW, blockH));
            }
        }
    }

    draw() {
        this.blocks.forEach(b => b.draw());
    }
}

class Saucer {
    constructor() {
        this.w = 50;
        this.h = 20;
        this.x = Math.random() < 0.5 ? -this.w : canvas.width;
        this.y = 35;
        this.speed = 3;
        this.dx = this.x < 0 ? this.speed : -this.speed;
        this.color = COLORS.secondary;
        this.points = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.dx * deltaTime;
        if ((this.dx > 0 && this.x > canvas.width) || (this.dx < 0 && this.x < -this.w)) {
            this.active = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.w / 2, this.h * 0.4, this.h * 0.4, Math.PI, 0);
        ctx.moveTo(0, this.h * 0.7);
        ctx.quadraticCurveTo(this.w / 2, this.h * 0.2, this.w, this.h * 0.7);
        ctx.lineTo(this.w * 0.8, this.h);
        ctx.lineTo(this.w * 0.2, this.h);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

class ScorePopup {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
    }

    update(deltaTime) {
        this.y -= 1 * deltaTime;
        this.life -= 0.02 * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Boss {
    constructor(isFinal = false) {
        this.w = isFinal ? 180 : 160;
        this.h = isFinal ? 70 : 60;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = 80;
        this.targetX = this.x;
        this.isFinal = isFinal;
        this.hp = isFinal ? 250 : 100;
        this.maxHp = this.hp;
        this.speed = isFinal ? 2.5 : 1.5;
        this.dir = 1;
        this.color = isFinal ? '#ff00ea' : COLORS.danger;
        this.shootCooldown = 60;
        this.attackPattern = 0; // 0: spread, 1: homing, 2: sweep
        this.attackTimer = 0;
    }

    update(deltaTime) {
        // Move side to side
        this.x += this.speed * this.dir * deltaTime;
        if (this.x <= 20) {
            this.dir = 1;
        } else if (this.x >= canvas.width - this.w - 20) {
            this.dir = -1;
        }

        // Shoots custom bullet patterns based on cooldown
        this.shootCooldown -= deltaTime;
        if (this.shootCooldown <= 0) {
            this.firePattern();
        }
    }

    firePattern() {
        // Switch patterns occasionally
        if (Math.random() < 0.25) {
            this.attackPattern = (this.attackPattern + 1) % 3;
        }

        if (this.isFinal) {
            // Neon Overlord attacks (Stage 10 final boss)
            if (this.attackPattern === 0) {
                // Heavy spread: 7 bullets in an arc
                for (let angle = -0.6; angle <= 0.6; angle += 0.2) {
                    const bx = this.x + this.w / 2;
                    const by = this.y + this.h;
                    const dx = Math.sin(angle) * BULLET_SPEED * 0.6;
                    const dy = Math.cos(angle) * BULLET_SPEED * 0.6;
                    bullets.push(new Bullet(bx, by, dy, this.color, dx));
                }
                this.shootCooldown = 70;
            } else if (this.attackPattern === 1) {
                // Triple homing laser burst
                const bx = this.x + this.w / 2;
                const by = this.y + this.h;
                const px = player.x + player.w / 2;
                const py = player.y;
                
                const angle = Math.atan2(py - by, px - bx);
                
                bullets.push(new Bullet(bx, by, Math.sin(angle) * BULLET_SPEED * 0.7, this.color, Math.cos(angle) * BULLET_SPEED * 0.7));
                bullets.push(new Bullet(bx, by, Math.sin(angle - 0.15) * BULLET_SPEED * 0.7, this.color, Math.cos(angle - 0.15) * BULLET_SPEED * 0.7));
                bullets.push(new Bullet(bx, by, Math.sin(angle + 0.15) * BULLET_SPEED * 0.7, this.color, Math.cos(angle + 0.15) * BULLET_SPEED * 0.7));
                this.shootCooldown = 50;
            } else {
                // High-speed sweep spray
                const bx = this.x + (Math.sin(Date.now() / 150) * 0.45 + 0.5) * this.w;
                const by = this.y + this.h;
                bullets.push(new Bullet(bx, by, BULLET_SPEED * 0.7, this.color, 0));
                this.shootCooldown = 8;
            }
        } else {
            // Commander Mothership attacks (Stage 5 boss)
            if (this.attackPattern === 0) {
                for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
                    const bx = this.x + this.w / 2;
                    const by = this.y + this.h;
                    const dx = Math.sin(angle) * BULLET_SPEED * 0.5;
                    const dy = Math.cos(angle) * BULLET_SPEED * 0.5;
                    bullets.push(new Bullet(bx, by, dy, COLORS.danger, dx));
                }
                this.shootCooldown = 90;
            } else if (this.attackPattern === 1) {
                const bx = this.x + this.w / 2;
                const by = this.y + this.h;
                const px = player.x + player.w / 2;
                const py = player.y;
                
                const angle = Math.atan2(py - by, px - bx);
                const dx = Math.cos(angle) * BULLET_SPEED * 0.6;
                const dy = Math.sin(angle) * BULLET_SPEED * 0.6;
                
                bullets.push(new Bullet(bx, by, dy, COLORS.danger, dx));
                this.shootCooldown = 40;
            } else {
                const bx = this.x + (Math.sin(Date.now() / 200) * 0.4 + 0.5) * this.w;
                const by = this.y + this.h;
                bullets.push(new Bullet(bx, by, BULLET_SPEED * 0.5, COLORS.danger, 0));
                this.shootCooldown = 15;
            }
        }
    }

    hit(damage = 1) {
        this.hp -= damage;
        triggerScreenshake(4, 6);
        if (this.hp <= 0) {
            triggerScreenshake(25, 60);
            soundManager.play('explode');
            for (let k = 0; k < 30; k++) {
                particles.push(new Particle(this.x + Math.random() * this.w, this.y + Math.random() * this.h, this.color, 'spark'));
                particles.push(new Particle(this.x + Math.random() * this.w, this.y + Math.random() * this.h, this.color, 'debris'));
            }
            for (let k = 0; k < 5; k++) {
                particles.push(new Particle(this.x + this.w/2, this.y + this.h/2, this.color, 'ring'));
            }
            updateScore(1000 * wave);
            scorePopups.push(new ScorePopup(this.x + this.w/2, this.y + this.h/2, `BOSS DEFEATED +${1000 * wave}`, COLORS.secondary));
            
            const types = ['triple', 'rapid', 'shield'];
            types.forEach((type, idx) => {
                powerups.push(new PowerUp(this.x + this.w * (0.25 + idx * 0.25), this.y + this.h, type));
            });
            
            boss = null;
            if (wave === 10) {
                victory();
            } else {
                wave++;
                spawnWave();
            }
        } else {
            soundManager.play('hit');
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.isFinal ? 4 : 3;

        if (this.isFinal) {
            // Draw Neon Overlord (Final Boss) Spiked Crown Citadel shape
            ctx.beginPath();
            ctx.moveTo(this.w * 0.5, 0); // Top spike
            ctx.lineTo(this.w * 0.58, this.h * 0.2);
            ctx.lineTo(this.w * 0.8, this.h * 0.1); // Inner spike
            ctx.lineTo(this.w * 0.72, this.h * 0.4);
            ctx.lineTo(this.w, this.h * 0.3); // Outer spike
            ctx.lineTo(this.w * 0.85, this.h * 0.75);
            ctx.lineTo(this.w * 0.62, this.h * 0.6); // Wing notch
            ctx.lineTo(this.w * 0.5, this.h); // Bottom central cannon
            ctx.lineTo(this.w * 0.38, this.h * 0.6); // Wing notch left
            ctx.lineTo(this.w * 0.15, this.h * 0.75);
            ctx.lineTo(0, this.h * 0.3); // Outer left spike
            ctx.lineTo(this.w * 0.28, this.h * 0.4);
            ctx.lineTo(this.w * 0.2, this.h * 0.1); // Inner left spike
            ctx.lineTo(this.w * 0.42, this.h * 0.2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
            ctx.fill();
            ctx.stroke();

            // Draw glowing matrix lines inside Overlord
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.w * 0.3, this.h * 0.3);
            ctx.lineTo(this.w * 0.45, this.h * 0.5);
            ctx.moveTo(this.w * 0.7, this.h * 0.3);
            ctx.lineTo(this.w * 0.55, this.h * 0.5);
            ctx.stroke();

            // Core shield orb
            ctx.beginPath();
            ctx.arc(this.w / 2, this.h * 0.35, 22, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff00ea';
            ctx.shadowColor = '#ff00ea';
            ctx.shadowBlur = 25;
            ctx.fillStyle = 'rgba(255, 0, 234, 0.35)';
            ctx.fill();
            ctx.stroke();

            // Rotating cyan orbital ring
            const angle = Date.now() / 200;
            ctx.save();
            ctx.translate(this.w / 2, this.h * 0.35);
            ctx.rotate(angle);
            ctx.strokeStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.setLineDash([8, 12]);
            ctx.stroke();
            ctx.restore();
        } else {
            // Draw Commander Mothership frame
            ctx.beginPath();
            ctx.moveTo(0, this.h * 0.3);
            ctx.lineTo(this.w * 0.25, 0);
            ctx.lineTo(this.w * 0.75, 0);
            ctx.lineTo(this.w, this.h * 0.3);
            ctx.lineTo(this.w * 0.9, this.h * 0.6);
            ctx.lineTo(this.w * 0.7, this.h * 0.5);
            ctx.lineTo(this.w * 0.5, this.h * 0.95);
            ctx.lineTo(this.w * 0.3, this.h * 0.5);
            ctx.lineTo(this.w * 0.1, this.h * 0.6);
            ctx.closePath();
            ctx.fillStyle = 'rgba(10, 5, 5, 0.8)';
            ctx.fill();
            ctx.stroke();

            // Core shield orb
            ctx.beginPath();
            ctx.arc(this.w / 2, this.h * 0.35, 15, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.stroke();
        }

        // Animated engines
        const pulse = Math.sin(Date.now() / 40) * 10;
        ctx.fillStyle = COLORS.danger;
        ctx.fillRect(this.w * 0.35, -5 - pulse * 0.3, 10, 5 + pulse * 0.3);
        ctx.fillRect(this.w * 0.55, -5 - pulse * 0.3, 10, 5 + pulse * 0.3);

        ctx.restore();

        // Draw Boss Health Bar
        const barW = canvas.width * 0.6;
        const barH = 10;
        const barX = canvas.width * 0.2;
        const barY = 20;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(barX, barY, barW, barH);
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        const fillRatio = this.hp / this.maxHp;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillRect(barX, barY, barW * fillRatio, barH);
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.font = '900 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.isFinal ? 'NEON OVERLORD - FINAL BOSS' : 'COMMANDER MOTHERSHIP', canvas.width / 2, barY - 6);
        ctx.restore();
    }
}

function initShields() {
    shields = [];
    const numShields = canvas.width < 500 ? 3 : 4;
    const shieldWidth = 64;
    const spacing = canvas.width / (numShields + 1);
    const shieldY = player.y - 70;
    
    for (let i = 0; i < numShields; i++) {
        const shieldX = spacing * (i + 1) - shieldWidth / 2;
        shields.push(new Shield(shieldX, shieldY));
    }
}

// Global Entities
let player = new Player();
let invaders = [];
let bullets = [];
let particles = [];
let powerups = [];
let keys = {};
let isDragging = false;
let initialInvadersCount = 0;
let shields = [];
let saucer = null;
let saucerSpawnTimer = 0;
let saucerSpawnInterval = 15000 + Math.random() * 15000;
let scorePopups = [];
let boss = null;
let shakeDuration = 0;
let shakeIntensity = 0;

function triggerScreenshake(intensity, duration) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeDuration = Math.max(shakeDuration, duration);
}

function spawnWave() {
    invaders = [];
    boss = null;
    bullets = [];
    
    // Wave 5 is standard boss, Wave 10 is the Final Overlord boss
    if (wave === 5 || wave === 10) {
        boss = new Boss(wave === 10);
        initShields();
        levelTag.textContent = `WAVE ${wave} - ${wave === 10 ? 'FINAL BOSS' : 'BOSS'}`;
        return;
    }
    
    const rows = 5;
    const isMobile = canvas.width < 500;
    const cols = isMobile ? 6 : 8;
    
    // Scale spacing based on screen width
    const maxGridWidth = Math.min(isMobile ? 280 : 420, canvas.width - 80);
    const spacingX = maxGridWidth / (cols - 1);
    const spacingY = Math.min(40, spacingX * 0.8);
    const startX = (canvas.width - ((cols - 1) * spacingX + INVADER_SIZE)) / 2;
    const waveDropOffset = Math.min(isMobile ? 60 : 120, (wave - 1) * (isMobile ? 8 : 15));
    
    const centerCol = Math.floor((cols - 1) / 2);
    const centerRow = 2;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let shouldSpawn = false;
            let type = 1;
            let hp = 1;
            
            // Layout formations by Wave
            switch (wave) {
                case 1:
                    // Stage 1: Classic Swarm
                    shouldSpawn = true;
                    type = (r === 0) ? 3 : (r < 3) ? 2 : 1;
                    break;
                case 2:
                    // Stage 2: Chevron / V-Formation
                    const vDist = Math.abs(c - centerCol);
                    if (r === vDist || r === vDist + 1) {
                        shouldSpawn = true;
                        type = (vDist === 0) ? 3 : (vDist < 2) ? 2 : 1;
                    }
                    break;
                case 3:
                    // Stage 3: Alternating Checkerboard
                    if ((r + c) % 2 === 0) {
                        shouldSpawn = true;
                        type = (r === 0) ? 3 : (r === 2) ? 2 : 1;
                        if (Math.random() < 0.25) hp = 2; // Armored
                    }
                    break;
                case 4:
                    // Stage 4: Diamond Shield
                    const dDist = Math.abs(c - centerCol) + Math.abs(r - centerRow);
                    if (dDist <= 3) {
                        shouldSpawn = true;
                        type = (dDist === 0) ? 3 : (dDist === 1) ? 2 : 1;
                        if (dDist === 0) hp = 2;
                    }
                    break;
                case 6:
                    // Stage 6: X-Cross Corridor
                    const xDist = Math.abs(c - Math.floor(cols/2));
                    if (xDist === r || xDist === 4 - r) {
                        shouldSpawn = true;
                        type = (r === 2) ? 3 : (r === 1 || r === 3) ? 2 : 1;
                    }
                    break;
                case 7:
                    // Stage 7: Defensive Columns / Wall
                    if (c % 2 === 0) {
                        shouldSpawn = true;
                        type = (r === 0) ? 3 : (r === 1 || r === 2) ? 2 : 1;
                        if (r === 4) hp = 2; // Armored front line
                    }
                    break;
                case 8:
                    // Stage 8: Double Wedge
                    if ((c < cols/2 && r >= c) || (c >= cols/2 && r >= (cols - 1 - c))) {
                        shouldSpawn = true;
                        type = (r === 4) ? 3 : (r === 2 || r === 3) ? 2 : 1;
                        if (Math.random() < 0.3) hp = 2;
                    }
                    break;
                case 9:
                    // Stage 9: Concentric Fortress Ring
                    const outerRing = (r === 0 || r === 4 || c === 0 || c === cols - 1);
                    const innerCore = (r === centerRow && Math.abs(c - centerCol) <= 1);
                    if (outerRing || innerCore) {
                        shouldSpawn = true;
                        type = innerCore ? 3 : (r === 0 || r === 4) ? 2 : 1;
                        if (innerCore) hp = 2;
                    }
                    break;
                default:
                    // Fallback for any other stages
                    shouldSpawn = true;
                    type = (r === 0) ? 3 : (r < 3) ? 2 : 1;
            }
            
            if (shouldSpawn) {
                // armored scaling on higher levels
                if (wave >= 6 && Math.random() < 0.3) hp = 2;
                invaders.push(new Invader(startX + c * spacingX, 50 + waveDropOffset + r * spacingY, type, hp));
            }
        }
    }
    
    initialInvadersCount = invaders.length;
    initShields();
    
    invaderMoveInterval = Math.max(isMobile ? 350 : 200, 1000 - (wave * 80));
    levelTag.textContent = `WAVE ${wave}`;
}

function updateHUD() {
    scoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    livesEl.textContent = '❤️'.repeat(player.lives);
}

function updateScore(val) {
    score += val;
    if (score > bestScore) {
        bestScore = score;
        safeStorage.setItem('neonInvadersBest', bestScore);
    }
    updateHUD();
}

function gameOver() {
    gameState = 'GAMEOVER';
    soundManager.stopMusic();
    soundManager.play('explode');
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-level').textContent = wave;
    document.getElementById('final-score').textContent = score;
}

function victory() {
    gameState = 'VICTORY';
    soundManager.stopMusic();
    soundManager.play('victory'); // Play epic levelup/victory chime
    document.getElementById('game-victory').classList.remove('hidden');
    document.getElementById('vic-score').textContent = score;
    // Save best score
    if (score > bestScore) {
        bestScore = score;
        safeStorage.setItem('neonInvadersBest', bestScore);
    }
}

function restartGame() {
    score = 0;
    wave = 1;
    bullets = [];
    particles = [];
    powerups = [];
    saucer = null;
    boss = null;
    saucerSpawnTimer = 0;
    scorePopups = [];
    player = new Player();
    spawnWave();
    updateHUD();
    gameState = 'PLAYING';
    soundManager.setBpm(110);
    soundManager.startMusic();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-victory').classList.add('hidden');
}

function togglePause() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶️' : '⏸';
    soundManager.play('click');
}

function toggleSound() {
    isMuted = !isMuted;
    document.getElementById('btn-sound').textContent = isMuted ? '🔇' : '🔊';
    soundManager.setMuted(isMuted);
}

function toggleHelp(show) {
    const helpOverlay = document.getElementById('how-to-play');
    if (show) {
        helpOverlay.classList.remove('hidden');
        if (gameState === 'PLAYING' && !isPaused) togglePause();
    } else {
        helpOverlay.classList.add('hidden');
    }
}

function firePlayer() {
    if (gameState !== 'PLAYING' || isPaused) return;
    
    // Firing limits scale up as stage level increases to match target difficulty and multi-bullet count
    const baseLimit = player.powerups.rapid > 0 ? 15 : 6;
    const waveBonus = wave * 2;
    const limit = baseLimit + waveBonus;
    
    if (bullets.filter(b => b.dy < 0).length < limit) {
        const firedBullets = [];
        const bulletColor = (wave >= 9) ? '#ffffff' : (wave >= 7) ? '#ff00ea' : (wave >= 5) ? '#ffff00' : (wave >= 3) ? '#39ff14' : COLORS.primary;
        
        if (wave <= 2) {
            // Wave 1-2: 1 central bullet
            firedBullets.push(new Bullet(player.x + player.w / 2, player.y, -BULLET_SPEED, bulletColor));
        } else if (wave <= 4) {
            // Wave 3-4: 2 parallel bullets
            firedBullets.push(new Bullet(player.x + player.w * 0.25, player.y, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.75, player.y, -BULLET_SPEED, bulletColor));
        } else if (wave <= 6) {
            // Wave 5-6: 3 parallel bullets
            firedBullets.push(new Bullet(player.x + player.w / 2, player.y, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.15, player.y + 5, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.85, player.y + 5, -BULLET_SPEED, bulletColor));
        } else if (wave <= 8) {
            // Wave 7-8: 4 parallel bullets
            firedBullets.push(new Bullet(player.x + player.w * 0.1, player.y + 5, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.35, player.y, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.65, player.y, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.9, player.y + 5, -BULLET_SPEED, bulletColor));
        } else {
            // Wave 9-10: 5 parallel heavy bullets
            firedBullets.push(new Bullet(player.x + player.w / 2, player.y, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.1, player.y + 5, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.3, player.y + 2, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.7, player.y + 2, -BULLET_SPEED, bulletColor));
            firedBullets.push(new Bullet(player.x + player.w * 0.9, player.y + 5, -BULLET_SPEED, bulletColor));
        }
        
        // Triple shot powerup adds two diagonal side wing bullets
        if (player.powerups.triple > 0) {
            firedBullets.push(new Bullet(player.x, player.y + 10, -BULLET_SPEED, bulletColor, -2.5));
            firedBullets.push(new Bullet(player.x + player.w, player.y + 10, -BULLET_SPEED, bulletColor, 2.5));
        }
        
        // Push all fired bullets to active list
        bullets.push(...firedBullets);
        soundManager.play('shoot');
    }
}

// Input
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space') firePlayer();
});
window.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('mousedown', e => {
    if (gameState === 'PLAYING') {
        isDragging = true;
        player.targetX = e.clientX;
    }
});
canvas.addEventListener('mousemove', e => {
    if (isDragging) player.targetX = e.clientX;
});
window.addEventListener('mouseup', () => isDragging = false);

canvas.addEventListener('touchstart', e => {
    if (gameState === 'PLAYING') {
        e.preventDefault();
        isDragging = true;
        player.targetX = e.touches[0].clientX;
    }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (isDragging) {
        e.preventDefault();
        player.targetX = e.touches[0].clientX;
    }
}, { passive: false });
window.addEventListener('touchend', () => isDragging = false);

document.getElementById('btn-start').addEventListener('click', () => { soundManager.init(); restartGame(); });
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-restart-vic').addEventListener('click', restartGame);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-sound').addEventListener('click', toggleSound);
document.getElementById('btn-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(true); });
document.getElementById('btn-close-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(false); });



// Social
document.getElementById('share-wa').addEventListener('click', () => {
    const text = `I cleared ${wave} waves and scored ${score} in Neon Invaders! 👾 Defend the grid: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
});
document.getElementById('share-x').addEventListener('click', () => {
    const text = `I cleared ${wave} waves and scored ${score} in Neon Invaders! 👾 #NeonInvaders #ArcadeHub`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
});
document.getElementById('share-wa-vic').addEventListener('click', () => {
    const text = `I completed Neon Invaders and scored ${score}! 🏆 Defend the grid: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
});
document.getElementById('share-x-vic').addEventListener('click', () => {
    const text = `I completed Neon Invaders and scored ${score}! 🏆 #NeonInvaders #ArcadeHub`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
});

let stars = [];
function initStars() {
    stars = [];
    const numStars = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.8 + 0.5,
            alpha: Math.random() * 0.7 + 0.3,
            twinkleSpeed: 0.01 + Math.random() * 0.03
        });
    }
}

function resize() {
    const hud = document.getElementById('hud');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - hud.clientHeight;
    initStars();
}
window.addEventListener('resize', resize);
resize();

function drawBackground() {
    // 1. Draw Starfield
    ctx.save();
    stars.forEach(star => {
        star.alpha += star.twinkleSpeed;
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(star.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    // 2. Draw Half Earth in the bottom-right corner
    const earthRadius = Math.min(220, canvas.width * 0.3);
    const cx = canvas.width - earthRadius * 0.2;
    const cy = canvas.height - earthRadius * 0.2;
    
    ctx.save();
    
    // Glowing Atmosphere Layer (Cyan outer glow)
    const atmosphereGlow = ctx.createRadialGradient(cx, cy, earthRadius * 0.8, cx, cy, earthRadius * 1.1);
    atmosphereGlow.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
    atmosphereGlow.addColorStop(0.2, 'rgba(0, 150, 255, 0.2)');
    atmosphereGlow.addColorStop(0.6, 'rgba(0, 50, 150, 0.05)');
    atmosphereGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = atmosphereGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Earth Base Sphere (Shadow/Dark side)
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#02040c';
    ctx.fill();
    
    // Landmasses Masked to Earth Sphere
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.fillStyle = '#0a3a40'; // Ocean teal-blue base
    
    // Continent 1 (Top-Left)
    ctx.beginPath();
    ctx.moveTo(cx - earthRadius * 0.8, cy - earthRadius * 0.4);
    ctx.bezierCurveTo(cx - earthRadius * 0.6, cy - earthRadius * 0.8, cx - earthRadius * 0.2, cy - earthRadius * 0.7, cx - earthRadius * 0.1, cy - earthRadius * 0.4);
    ctx.bezierCurveTo(cx - earthRadius * 0.2, cy - earthRadius * 0.2, cx - earthRadius * 0.5, cy - earthRadius * 0.1, cx - earthRadius * 0.8, cy - earthRadius * 0.4);
    ctx.closePath();
    ctx.fill();
    
    // Continent 2 (Mid-Left)
    ctx.beginPath();
    ctx.moveTo(cx - earthRadius * 0.5, cy + earthRadius * 0.1);
    ctx.bezierCurveTo(cx - earthRadius * 0.2, cy + earthRadius * 0.2, cx - earthRadius * 0.1, cy + earthRadius * 0.6, cx - earthRadius * 0.4, cy + earthRadius * 0.7);
    ctx.bezierCurveTo(cx - earthRadius * 0.6, cy + earthRadius * 0.8, cx - earthRadius * 0.7, cy + earthRadius * 0.4, cx - earthRadius * 0.5, cy + earthRadius * 0.1);
    ctx.closePath();
    ctx.fill();

    // Continent 3 (Right)
    ctx.beginPath();
    ctx.moveTo(cx + earthRadius * 0.1, cy - earthRadius * 0.2);
    ctx.bezierCurveTo(cx + earthRadius * 0.3, cy - earthRadius * 0.4, cx + earthRadius * 0.5, cy - earthRadius * 0.1, cx + earthRadius * 0.4, cy + earthRadius * 0.2);
    ctx.bezierCurveTo(cx + earthRadius * 0.2, cy + earthRadius * 0.3, cx + earthRadius * 0.1, cy + earthRadius * 0.0, cx + earthRadius * 0.1, cy - earthRadius * 0.2);
    ctx.closePath();
    ctx.fill();

    // 3D Spherical Light Terminator Shading (linear gradient)
    const earthShading = ctx.createLinearGradient(cx - earthRadius, cy - earthRadius, cx + earthRadius * 0.2, cy + earthRadius * 0.2);
    earthShading.addColorStop(0, 'rgba(0, 170, 255, 0.4)');
    earthShading.addColorStop(0.35, 'rgba(0, 100, 200, 0.1)');
    earthShading.addColorStop(0.65, 'rgba(0, 0, 0, 0.8)');
    earthShading.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
    ctx.fillStyle = earthShading;
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius + 1, 0, Math.PI * 2);
    ctx.fill();

    // City lights on the dark shadow side (Tiny glowing yellow dots)
    ctx.fillStyle = 'rgba(255, 230, 100, 0.85)';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffe664';
    const cityLightOffsets = [
        {dx: 0.1, dy: 0.2}, {dx: 0.15, dy: 0.25}, {dx: 0.2, dy: 0.18}, {dx: 0.22, dy: 0.3},
        {dx: 0.35, dy: 0.4}, {dx: 0.4, dy: 0.38}, {dx: 0.42, dy: 0.45},
        {dx: 0.5, dy: 0.55}, {dx: 0.55, dy: 0.5}, {dx: 0.58, dy: 0.62},
        {dx: 0.7, dy: 0.72}, {dx: 0.75, dy: 0.68}, {dx: 0.8, dy: 0.75}
    ];
    cityLightOffsets.forEach(pt => {
        ctx.beginPath();
        ctx.arc(cx + earthRadius * pt.dx, cy + earthRadius * pt.dy, 1.2, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function loop(timestamp) {
    const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 3) : 1;
    lastTimestamp = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeDuration -= deltaTime;
        if (shakeDuration <= 0) {
            shakeIntensity = 0;
        }
    }
    drawBackground();
    drawGrid();

    if (gameState === 'PLAYING' && !isPaused) {
        player.update(deltaTime);
        
        // Auto-fire on mobile/touch screens when dragging
        if (isDragging && (window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0))) {
            if (!player.autoFireTimer) player.autoFireTimer = 0;
            player.autoFireTimer += deltaTime;
            const fireInterval = player.powerups.rapid > 0 ? 6 : 15;
            if (player.autoFireTimer >= fireInterval) {
                firePlayer();
                player.autoFireTimer = 0;
            }
        }
        
        // Saucer Spawning & Movement
        if (!saucer) {
            saucerSpawnTimer += deltaTime * 16.67;
            if (saucerSpawnTimer >= saucerSpawnInterval) {
                saucer = new Saucer();
                saucerSpawnTimer = 0;
                saucerSpawnInterval = 15000 + Math.random() * 15000;
            }
        } else {
            saucer.update(deltaTime);
            if (!saucer.active) {
                saucer = null;
            }
        }

        // Update Score Popups
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            const sp = scorePopups[i];
            sp.update(deltaTime);
            if (sp.life <= 0) scorePopups.splice(i, 1);
        }

        if (boss) {
            boss.update(deltaTime);
            soundManager.setBpm(boss.isFinal ? 160 : 140);
        } else {
            // Move Invaders (Speed up as their numbers decrease)
            invaderMoveTimer += deltaTime * 16.67;
            
            const fractionLeft = invaders.length / (initialInvadersCount || 1);
            const speedFactor = 0.1 + 0.9 * fractionLeft; // speeds up from 1.0x to 0.1x interval
            // Scale interval based on screen width to keep visual travel speed consistent
            const screenScale = Math.max(1.0, Math.min(2.5, 900 / canvas.width));
            const currentInterval = Math.max(80, invaderMoveInterval * speedFactor * screenScale);
            
            // Adjust music BPM based on remaining invaders (110 BPM to 160 BPM)
            soundManager.setBpm(110 + (1 - fractionLeft) * 50);
            
            if (invaderMoveTimer >= currentInterval) {
                invaderMoveTimer = 0;
                let shouldDrop = false;
                invaders.forEach(inv => {
                    inv.x += 10 * invaderDirection;
                    if (inv.x > canvas.width - inv.w || inv.x < 0) shouldDrop = true;
                });
                
                if (shouldDrop) {
                    invaderDirection *= -1;
                    invaders.forEach(inv => {
                        const isMobile = canvas.width < 500;
                        inv.y += isMobile ? 12 : INVADER_DROP_DIST;
                        if (inv.y + inv.h > player.y) gameOver();
                    });
                }
            }
            
            // Invader Fire
            if (Math.random() < (0.01 + (wave * 0.005)) * deltaTime) {
                const shooter = invaders[Math.floor(Math.random() * invaders.length)];
                if (shooter) bullets.push(new Bullet(shooter.x + shooter.w/2, shooter.y + shooter.h, BULLET_SPEED * 0.6, COLORS.danger));
            }
        }

        // Powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.update(deltaTime);
            if (p.y > canvas.height) { powerups.splice(i, 1); continue; }
            
            // Magnet attraction: powerups float towards player horizontally when close
            const distY = player.y - p.y;
            if (distY > 0 && distY < 250) {
                const distX = (player.x + player.w/2) - p.x;
                if (Math.abs(distX) < 180) {
                    p.x += Math.sign(distX) * 2 * deltaTime;
                }
            }
            
            if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
                const durationScale = 1.0 + (wave - 1) * 0.10;
                if (p.type === 'triple') player.powerups.triple = 600 * durationScale;
                else if (p.type === 'rapid') player.powerups.rapid = 600 * durationScale;
                else if (p.type === 'shield') player.powerups.shield = true;
                
                soundManager.play('powerup');
                powerups.splice(i, 1);
            }
        }

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b) continue;
            b.update(deltaTime);
            if (b.y < 0 || b.y > canvas.height) { bullets.splice(i, 1); continue; }
            
            // Bullet hits shield block
            let shieldCollided = false;
            for (let s = 0; s < shields.length; s++) {
                const sh = shields[s];
                for (let bIdx = sh.blocks.length - 1; bIdx >= 0; bIdx--) {
                    const block = sh.blocks[bIdx];
                    if (block.hp > 0 &&
                        b.x >= block.x && b.x <= block.x + block.w &&
                        b.y >= block.y && b.y <= block.y + block.h) {
                        
                        block.hp--;
                        if (block.hp <= 0) {
                            sh.blocks.splice(bIdx, 1);
                            for (let k = 0; k < 3; k++) particles.push(new Particle(block.x + block.w/2, block.y + block.h/2, COLORS.primary, 'debris'));
                            for (let k = 0; k < 3; k++) particles.push(new Particle(block.x + block.w/2, block.y + block.h/2, COLORS.primary, 'spark'));
                            triggerScreenshake(2, 5);
                        } else {
                            triggerScreenshake(1, 3);
                        }
                        bullets.splice(i, 1);
                        soundManager.play('hit');
                        shieldCollided = true;
                        break;
                    }
                }
                if (shieldCollided) break;
            }
            if (shieldCollided) continue;
            
            // Player bullet hits boss or saucer
            if (b.dy < 0) {
                if (boss && b.x >= boss.x && b.x <= boss.x + boss.w && b.y >= boss.y && b.y <= boss.y + boss.h) {
                    boss.hit(1);
                    bullets.splice(i, 1);
                    continue;
                }
                
                if (saucer && b.x >= saucer.x && b.x <= saucer.x + saucer.w && b.y >= saucer.y && b.y <= saucer.y + saucer.h) {
                    updateScore(saucer.points);
                    scorePopups.push(new ScorePopup(saucer.x + saucer.w/2, saucer.y + saucer.h/2, `+${saucer.points}`, COLORS.secondary));
                    particles.push(new Particle(saucer.x + saucer.w/2, saucer.y + saucer.h/2, saucer.color, 'ring'));
                    particles.push(new Particle(saucer.x + saucer.w/2, saucer.y + saucer.h/2, saucer.color, 'ring'));
                    for (let k = 0; k < 15; k++) particles.push(new Particle(saucer.x + saucer.w/2, saucer.y + saucer.h/2, saucer.color, 'spark'));
                    for (let k = 0; k < 10; k++) particles.push(new Particle(saucer.x + saucer.w/2, saucer.y + saucer.h/2, saucer.color, 'debris'));
                    bullets.splice(i, 1);
                    saucer = null;
                    soundManager.play('explode');
                    triggerScreenshake(8, 15);
                    continue;
                }
                
                // Player bullet hits invader
                for (let j = invaders.length - 1; j >= 0; j--) {
                    const inv = invaders[j];
                    if (b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
                        inv.hp--;
                        bullets.splice(i, 1);
                        
                        if (inv.hp <= 0) {
                            particles.push(new Particle(inv.x + inv.w/2, inv.y + inv.h/2, inv.color, 'ring'));
                            for (let k = 0; k < 10; k++) particles.push(new Particle(inv.x + inv.w/2, inv.y + inv.h/2, inv.color, 'spark'));
                            for (let k = 0; k < 6; k++) particles.push(new Particle(inv.x + inv.w/2, inv.y + inv.h/2, inv.color, 'debris'));
                            
                            // Drop Powerup (Drop rate increases on higher stages to power up the spaceship)
                            const dropChance = 0.20 + (wave - 1) * 0.02;
                            if (Math.random() < dropChance) {
                                const types = ['triple', 'rapid', 'shield'];
                                powerups.push(new PowerUp(inv.x + inv.w/2, inv.y + inv.h/2, types[Math.floor(Math.random()*types.length)]));
                            }
                            
                            const scoreVal = 10 * wave;
                            scorePopups.push(new ScorePopup(inv.x + inv.w/2, inv.y + inv.h/2, `+${scoreVal}`, inv.color));
                            invaders.splice(j, 1);
                            updateScore(scoreVal);
                            soundManager.play('explode');
                            triggerScreenshake(3, 8);
                        } else {
                            soundManager.play('shoot'); // metallic hit sound
                            triggerScreenshake(1, 4);
                        }
                        break;
                    }
                }
            } else {
                // Invader bullet hits player
                if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
                    player.hit();
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update(deltaTime);
            if (p.life <= 0) particles.splice(i, 1);
        }

        if (invaders.length === 0 && !boss) {
            if (wave === 10) {
                victory();
            } else {
                wave++;
                spawnWave();
                soundManager.play('levelup');
            }
        }
    }

    // Draw
    shields.forEach(sh => sh.draw());
    if (saucer) saucer.draw();
    if (boss) boss.draw();
    scorePopups.forEach(sp => sp.draw());
    
    invaders.forEach(inv => inv.draw());
    bullets.forEach(b => b.draw());
    powerups.forEach(p => p.draw());
    particles.forEach(p => p.draw());
    player.draw();
    ctx.restore();

    requestAnimationFrame(loop);
}

bestScoreEl.textContent = bestScore;
loop();
