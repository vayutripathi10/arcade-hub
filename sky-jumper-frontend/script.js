/**
 * Sky Jumper - Core Game Logic
 */

// CanvasRenderingContext2D.prototype.roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Setup Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;

// Layout Constants
const HUD_HEIGHT_DESKTOP = 60;
const HUD_HEIGHT_MOBILE = 48;
const AD_HEIGHT_DESKTOP = 0;
const AD_HEIGHT_MOBILE = 0;
let HUD_HEIGHT = HUD_HEIGHT_DESKTOP;
let AD_HEIGHT = AD_HEIGHT_DESKTOP;

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    cw = canvas.width = rect.width;
    ch = canvas.height = rect.height;
    
    // Update active heights
    HUD_HEIGHT = cw > 600 ? HUD_HEIGHT_DESKTOP : HUD_HEIGHT_MOBILE;
    AD_HEIGHT = cw > 600 ? AD_HEIGHT_DESKTOP : AD_HEIGHT_MOBILE;
}
window.addEventListener('resize', resize);
resize();

// UI Elements
const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const screenPause = document.getElementById('screen-pause');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnSound = document.getElementById('btn-sound');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const livesDisplay = document.getElementById('lives-display');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const comboFlash = document.getElementById('combo-flash');
const btnShareWA = document.getElementById('btn-share-wa');
const btnShareX = document.getElementById('btn-share-x');
const btnHelp = document.getElementById('btn-help');
const btnCloseHelp = document.getElementById('btn-close-help');
const screenHelp = document.getElementById('how-to-play');

// Virtual Buttons
const vbtnLeft = document.getElementById('vbtn-left');
const vbtnRight = document.getElementById('vbtn-right');
const vbtnJump = document.getElementById('vbtn-jump');

// Game State
let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
let score = 0;
let bestScore = localStorage.getItem('skj_best') || 0;
bestScoreEl.innerText = bestScore;
let frames = 0;
let level = 1;
let camY = 0;

let soundEnabled = true;

// Web Audio API Synthesizer
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}
window.addEventListener('keydown', initAudio, { once: true });
window.addEventListener('mousedown', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });

function playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
    if (!soundEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    jump: () => playTone(300, 'sine', 0.2, 0.1, 600),
    land: () => playTone(150, 'triangle', 0.1, 0.2, 100),
    coin: () => { playTone(800, 'sine', 0.1, 0.05); setTimeout(() => playTone(1200, 'sine', 0.1, 0.05), 50); },
    combo: () => { playTone(400, 'sine', 0.1, 0.1); setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 100); setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 200); },
    hurdle: () => playTone(200, 'sawtooth', 0.3, 0.1, 50),
    die: () => { playTone(300, 'sawtooth', 0.2, 0.1, 100); setTimeout(() => playTone(200, 'sawtooth', 0.3, 0.1, 50), 200); },
    levelup: () => { playTone(440, 'sine', 0.1, 0.1); setTimeout(() => playTone(554, 'sine', 0.1, 0.1), 100); setTimeout(() => playTone(659, 'sine', 0.1, 0.1), 200); setTimeout(() => playTone(880, 'sine', 0.4, 0.1), 300); }
};

// Input
const keys = { left: false, right: false, up: false };
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        keys.up = true;
        if (gameState === 'PLAYING') player.jump();
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') pauseGame();
        else if (gameState === 'PAUSED') resumeGame();
    }
});
window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
});

// Touch controls (Virtual Buttons)
vbtnLeft.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    keys.left = true;
}, { passive: false });
vbtnLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
}, { passive: false });
vbtnLeft.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    keys.left = false;
}, { passive: false });

vbtnRight.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    keys.right = true;
}, { passive: false });
vbtnRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.right = false;
}, { passive: false });
vbtnRight.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    keys.right = false;
}, { passive: false });

vbtnJump.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    initAudio();
    player.jump();
}, { passive: false });

// Global touch for audio wake-up
window.addEventListener('touchstart', initAudio, { once: true });

// Stars Background
const stars = Array.from({length: 180}, () => ({
    x: Math.random() * 2000 - 500, // wide range for panning
    y: Math.random() * 3000 - 1000,
    size: Math.random() * 2 + 0.5,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.05 + 0.02
}));

// Game Entities
let player;
let platforms = [];
let lastPlatformX = 0;
let coins = [];
let hazards = [];
let particles = [];

// Combo System
let comboCount = 0;
let comboTimer = 0;

// Game Juice States
let shakeTime = 0;
let shakeIntensity = 0;
let shakeX = 0;
let shakeY = 0;
let flashAlpha = 0;
let landingRipples = [];
let floatingTexts = [];

function triggerShake(time, intensity) {
    shakeTime = time;
    shakeIntensity = intensity;
}

// Procedural Music Synth Object
const MusicSynth = {
    isPlaying: false,
    nextNoteTime: 0,
    stepIndex: 0,
    bpm: 110,
    schedulerId: null,
    
    start() {
        if (this.isPlaying) return;
        initAudio();
        if (!audioCtx) return;
        
        this.isPlaying = true;
        this.nextNoteTime = audioCtx.currentTime;
        this.stepIndex = 0;
        
        this.run();
    },
    
    stop() {
        this.isPlaying = false;
        if (this.schedulerId) {
            clearTimeout(this.schedulerId);
            this.schedulerId = null;
        }
    },
    
    run() {
        if (!this.isPlaying) return;
        
        const ctxNode = audioCtx;
        while (this.nextNoteTime < ctxNode.currentTime + 0.15) {
            this.scheduleNote(this.stepIndex, this.nextNoteTime);
            
            const stepDuration = 60 / this.bpm / 4; // 16th note
            this.nextNoteTime += stepDuration;
            this.stepIndex = (this.stepIndex + 1) % 16;
        }
        
        // Scale BPM dynamically with level
        this.bpm = 110 + (level || 1) * 2;
        this.bpm = Math.min(this.bpm, 155);
        
        this.schedulerId = setTimeout(() => this.run(), 50);
    },
    
    scheduleNote(step, time) {
        if (!soundEnabled || !audioCtx) return;
        
        // E minor progression: E (82Hz), G (98Hz), B (123Hz), D (146Hz)
        const notes = [
            [82.41, 41.20],  // E
            [97.99, 48.99],  // G
            [123.47, 61.74], // B
            [146.83, 73.42]  // D
        ];
        
        const chordIdx = Math.floor(step / 4) % 4;
        const isOffbeat = step % 2 === 1;
        const freq = isOffbeat ? notes[chordIdx][1] : notes[chordIdx][0];
        
        this.playBass(freq, time);
        
        if (step % 4 === 0) {
            this.playKick(time);
        }
        
        if (step % 8 === 4) {
            this.playSnare(time);
        }
        
        if (step === 2 || step === 5 || step === 10 || step === 13) {
            const melodyNotes = [164.81, 195.99, 246.94, 293.66];
            const melFreq = melodyNotes[chordIdx] * 2;
            this.playMelody(melFreq, time);
        }
    },
    
    playBass(freq, time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        filter.frequency.exponentialRampToValueAtTime(80, time + 0.12);
        
        gainNode.gain.setValueAtTime(0.12, time);
        gainNode.gain.exponentialRampToValueAtTime(0.005, time + 0.15);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.18);
    },
    
    playKick(time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
        
        gainNode.gain.setValueAtTime(0.15, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.1);
    },
    
    playSnare(time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.07);
        
        gainNode.gain.setValueAtTime(0.04, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.08);
    },
    
    playMelody(freq, time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0.015, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.22);
    }
};

class Player {
    constructor() {
        this.w = 30;
        this.h = 40;
        this.x = cw / 2 - this.w / 2;
        this.y = ch - 150;
        this.vx = 0;
        this.vy = 0;
        this.speed = 7;
        this.gravity = 0.45;
        this.jumpPower = -14;
        this.jumpsLeft = 2;
        this.trail = [];
        this.invincible = 0;
        this.lives = 3;
        this.color = '#00f5ff';
        this.scaleX = 1.0;
        this.scaleY = 1.0;
    }

    update(deltaTime) {
        // Movement
        if (keys.left) this.vx = -this.speed;
        else if (keys.right) this.vx = this.speed;
        else this.vx *= Math.pow(0.8, deltaTime); // friction

        // Gravity scaling
        const currentGravity = (this.gravity + (level * 0.02)) * deltaTime;
        this.vy += currentGravity;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Wraparound
        if (this.x > cw) this.x = -this.w;
        if (this.x < -this.w) this.x = cw;

        // Trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 12) this.trail.shift();

        // Invincibility
        if (this.invincible > 0) this.invincible -= deltaTime;

        // Scale decay
        this.scaleX += (1.0 - this.scaleX) * 0.12 * deltaTime;
        this.scaleY += (1.0 - this.scaleY) * 0.12 * deltaTime;

        // Death by falling below camera (Instant death at screen edge)
        if (this.y > Math.abs(camY) + ch + 10) {
            this.lives = 0;
            updateHUD();
            gameOver();
        }
    }

    jump() {
        if (this.jumpsLeft > 0) {
            this.vy = this.jumpPower;
            
            // Double jump stretch vs standard jump stretch
            if (this.jumpsLeft === 1) {
                this.scaleY = 1.45;
                this.scaleX = 0.7;
                triggerShake(6, 3.5);
                spawnParticles(this.x + this.w/2, this.y + this.h, 15, '#ffe600');
            } else {
                this.scaleY = 1.3;
                this.scaleX = 0.8;
                triggerShake(3, 1.8);
                spawnParticles(this.x + this.w/2, this.y + this.h, 8, '#fff');
            }
            this.jumpsLeft--;
            sfx.jump();
        }
    }

    hit() {
        if (this.invincible > 0 || this.lives <= 0) return;
        this.lives--;
        this.invincible = 80;
        this.vy = -8; // knockback up
        score = Math.max(0, score - 20);
        sfx.hurdle();
        spawnParticles(this.x + this.w/2, this.y + this.h/2, 20, '#ff2d78');
        updateHUD();
        
        // Juice: hit squash, screen rumble, and impact flash
        this.scaleY = 0.55;
        this.scaleX = 1.45;
        triggerShake(16, 6.0);
        flashAlpha = 0.6;
        
        if (this.lives <= 0) gameOver();
    }

    draw() {
        if (this.invincible > 0 && Math.floor(frames / 5) % 2 === 0) return; // flash

        // Trail
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = i / this.trail.length * 0.5;
            ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x + this.w / 2, t.y + this.h / 2, this.w / 2 * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Astronaut Body (applying scale at center)
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.translate(-this.w / 2, -this.h / 2);

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.w, this.h);
        
        // Visor
        ctx.fillStyle = '#111';
        ctx.fillRect(this.vx > 0 ? 10 : (this.vx < 0 ? 5 : 8), 5, 15, 10);

        // Jetpack flame
        if (this.vy < 0) {
            ctx.save();
            ctx.fillStyle = '#ff2d78';
            ctx.shadowColor = '#ff2d78';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(5, this.h);
            ctx.lineTo(15, this.h + Math.random() * 20 + 10);
            ctx.lineTo(25, this.h);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }
}

class Platform {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = Math.max(70, 120 - (level * 2));
        this.h = 15;
        this.type = type; // normal, moving, break, spring
        this.vx = type === 'moving' ? (Math.random() > 0.5 ? 2 + level*0.2 : -2 - level*0.2) : 0;
        this.broken = false;
        
        const colors = ['#00f5ff', '#ff2d78', '#39ff14'];
        this.color = type === 'spring' ? '#ffe600' : (type === 'break' ? '#ff9900' : colors[Math.floor(Math.random() * colors.length)]);
    }

    update(deltaTime) {
        if (this.type === 'moving') {
            this.x += this.vx * deltaTime;
            if (this.x < 0 || this.x + this.w > cw) this.vx *= -1;
        }
    }

    draw() {
        if (this.broken) return;

        ctx.save();
        ctx.shadowBlur = 15 + Math.sin(frames * 0.05) * 5; // Pulse
        ctx.shadowColor = this.color;
        
        // Gradient
        const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        
        ctx.fillStyle = grad;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.w, this.h, 5);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, 3);
        
        if (this.type === 'break') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y);
            ctx.lineTo(this.x + 30, this.y + this.h);
            ctx.moveTo(this.x + 50, this.y);
            ctx.lineTo(this.x + 40, this.y + this.h);
            ctx.stroke();
        } else if (this.type === 'spring') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + this.w/2 - 10, this.y - 5, 20, 5);
        }

        ctx.restore();
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.baseY = y;
        this.y = y;
        this.r = 8;
        this.collected = false;
        this.offset = Math.random() * Math.PI * 2;
    }
    update(deltaTime) {
        this.y = this.baseY + Math.sin(frames * 0.1 + this.offset) * 10;
    }
    draw() {
        if (this.collected) return;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffe600';
        
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, '#ffe600');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Hazard {
    constructor(x, y, type) {
        this.type = type; // spike, rocket
        this.x = x;
        this.y = y;
        if (type === 'rocket') {
            this.y -= 20; // Float above platform
            this.x = cw;
            this.vx = -(3 + level * 0.5);
            this.w = 30;
            this.h = 15;
        } else {
            this.w = 20;
            this.h = 20;
        }
    }
    update(deltaTime) {
        if (this.type === 'rocket') {
            this.x += this.vx * deltaTime;
            if (Math.floor(frames) % 3 === 0) spawnParticles(this.x + this.w, this.y + this.h/2, 1, '#ff9900');
        }
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        
        if (this.type === 'spike') {
            ctx.shadowColor = '#ff2d78';
            ctx.fillStyle = '#ff2d78';
            ctx.beginPath();
            ctx.moveTo(this.x + this.w/2, this.y - this.h);
            ctx.lineTo(this.x + this.w, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.fill();
        } else if (this.type === 'rocket') {
            ctx.shadowColor = '#ff2d78';
            ctx.fillStyle = '#ff2d78';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y + this.h/2, this.h/2, Math.PI/2, Math.PI*1.5);
            ctx.fill();
        }
        ctx.restore();
    }
}

function spawnParticles(x, y, amount, color) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color
        });
    }
}

// Game Logic
function resetGame() {
    player = new Player();
    platforms = [];
    coins = [];
    hazards = [];
    particles = [];
    landingRipples = [];
    floatingTexts = [];
    score = 0;
    level = 1;
    camY = 0;
    frames = 0;
    comboCount = 0;
    comboTimer = 0;

    // Initial platform - ensure it's above the ad zone
    const startX = cw / 2 - 50;
    const startY = ch - AD_HEIGHT - 70;
    lastPlatformX = startX;
    platforms.push(new Platform(startX, startY, 'normal'));
    player.x = startX + 10;
    player.y = startY - player.h - 10;
    
    generateWorld();
    updateHUD();
}

function generateWorld() {
    let topPlat = platforms.length > 0 ? platforms.reduce((min, p) => Math.min(min, p.y), Infinity) : ch - AD_HEIGHT - 20;
    const isMobile = cw <= 768;
    
    while (topPlat > -camY - ch) {
        topPlat -= Math.max(75, 110 - (10 - Math.min(level, 10)) * 2); 
        
        let x;
        if (isMobile) {
            // Increase horizontal spread on mobile: 35-45% of cw gap
            const minGap = cw * 0.38; 
            const maxGap = cw * 0.55;
            const gap = minGap + Math.random() * (maxGap - minGap);
            const direction = lastPlatformX > cw / 2 ? -1 : 1;
            x = lastPlatformX + (direction * gap);
            
            // Boundary check
            if (x < 20) x = 20 + Math.random() * 40;
            if (x > cw - 120) x = cw - 120 - Math.random() * 40;
        } else {
            x = Math.random() * (cw - 120);
        }
        lastPlatformX = x;
        
        // Platform Type
        let type = 'normal';
        if (level >= 2 && Math.random() < 0.3) type = 'moving';
        if (level >= 2 && Math.random() < 0.2) type = 'break';
        if (Math.random() < 0.05) type = 'spring';
        const np = new Platform(x, topPlat, type);
        platforms.push(np);

        // Hazards
        if (level >= 2 && type === 'normal' && Math.random() < 0.25) {
            hazards.push(new Hazard(x + Math.random() * (120 - 20), topPlat, 'spike'));
        }
        if (level >= 3 && Math.random() < 0.15) {
            hazards.push(new Hazard(cw, topPlat - 50, 'rocket'));
        }

        // Coins
        if (type !== 'break' && Math.random() < 0.6) {
            const numCoins = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numCoins; i++) {
                coins.push(new Coin(x + 20 + (i * 25), topPlat - 30));
            }
        }
    }
}

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;
    frames += deltaTime;

    // Difficulty Scaling (increase level every 10 seconds / 600 frames)
    if (Math.floor(frames / 600) > Math.floor((frames - deltaTime) / 600)) {
        level++;
        sfx.levelup();
        spawnParticles(player.x + player.w/2, player.y, 50, '#39ff14');
        updateHUD();
        
        // Show Level Up Flash
        comboFlash.innerText = `LEVEL ${level}!`;
        comboFlash.classList.remove('hidden');
        comboFlash.classList.remove('active');
        void comboFlash.offsetWidth;
        comboFlash.classList.add('active');
        flashAlpha = 0.35;
    }

    // Combo
    if (comboTimer > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) comboCount = 0;
    }

    // Screenshake & flash decay
    if (shakeTime > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeTime -= deltaTime;
    } else {
        shakeX = 0;
        shakeY = 0;
    }
    
    if (flashAlpha > 0) {
        flashAlpha -= 0.035 * deltaTime;
    }

    player.update(deltaTime);

    // Camera follow
    let targetCamY = -player.y + ch * 0.4;
    
    // Clamp camera so we don't see below the starting ad zone
    const maxCamY = 0; 
    if (targetCamY < maxCamY) targetCamY = maxCamY; 

    if (targetCamY > camY) {
        camY = targetCamY;
        // Update Score based on height
        const newScore = Math.max(score, Math.floor(camY / 10));
        if (newScore > score) {
            score = newScore;
            updateHUD();
        }
    }

    // Spawn space speed lines falling down
    if (Math.random() < 0.15) {
        particles.push({
            type: 'speedline',
            x: Math.random() * cw,
            y: -camY - 20,
            vx: 0,
            vy: Math.random() * 5 + 6 + (level * 0.4),
            life: 1.0,
            length: 15 + Math.random() * 25,
            color: 'rgba(0, 245, 255, 0.22)'
        });
    }

    generateWorld();

    // Platform Collisions
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        p.update(deltaTime);
        
        // Remove off-screen
        if (p.y > -camY + ch + 10) {
            platforms.splice(i, 1);
            continue;
        }

        if (!p.broken && player.vy > 0 && 
            player.x + player.w > p.x && player.x < p.x + p.w &&
            player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.vy) {
            
            player.y = p.y - player.h;
            player.jumpsLeft = 2; // reset double jump
            player.vy = 0; // Stand manually
            sfx.land();

            // Juice: landing squash, screenshake, and platform ripple
            player.scaleY = 0.7;
            player.scaleX = 1.3;
            triggerShake(3, 1.5);
            
            landingRipples.push({
                x: player.x + player.w / 2,
                y: p.y,
                r: 5,
                maxR: p.w * 0.75,
                alpha: 0.8,
                color: p.color
            });
            
            if (p.type === 'moving') {
                player.x += p.vx;
            }
            
            if (p.type === 'break') {
                p.broken = true;
                spawnParticles(p.x + p.w/2, p.y + p.h/2, 20, p.color);
                sfx.hurdle(); // crack sound
            } else if (p.type === 'spring') {
                player.jumpPower = -20; // super jump
                // Juice: super spring jump stretch & screenshake
                player.scaleY = 1.6;
                player.scaleX = 0.6;
                triggerShake(8, 4.0);
            } else {
                player.jumpPower = -14; // normal
            }
        }
    }

    // Coins
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.update(deltaTime);
        if (c.y > -camY + ch + 10) { coins.splice(i, 1); continue; }
        
        if (!c.collected && 
            player.x < c.x + c.r && player.x + player.w > c.x - c.r &&
            player.y < c.y + c.r && player.y + player.h > c.y - c.r) {
            
            c.collected = true;
            comboCount++;
            comboTimer = 120;
            const pointsGained = 5 * comboCount;
            score += pointsGained;
            updateHUD();
            
            // Juice: floating score popup
            floatingTexts.push({
                x: c.x,
                y: c.y,
                text: `+${pointsGained}`,
                color: comboCount >= 3 ? '#ff2d78' : '#ffe600',
                alpha: 1.0
            });
            
            if (comboCount >= 3) {
                sfx.combo();
                comboFlash.innerText = `${comboCount}x COMBO!`;
                comboFlash.classList.remove('hidden');
                comboFlash.classList.remove('active');
                void comboFlash.offsetWidth; // trigger reflow
                comboFlash.classList.add('active');
            } else {
                sfx.coin();
            }
            
            spawnParticles(c.x, c.y, 10, '#ffe600');
            coins.splice(i, 1);
        }
    }

    // Hazards
    for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.update(deltaTime);
        if (h.y > -camY + ch + 10 || h.x < -100) { hazards.splice(i, 1); continue; }
        
        if (player.x < h.x + h.w && player.x + player.w > h.x &&
            player.y < h.y + (h.type==='spike'?0:h.h) && player.y + player.h > h.y - (h.type==='spike'?h.h:0)) {
            player.hit();
        }
    }

    // Particles (standard + speedlines)
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        if (p.type === 'speedline') {
            p.life -= 0.03 * deltaTime;
        } else {
            p.life -= 0.05 * deltaTime;
        }
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update landing ripples
    for (let i = landingRipples.length - 1; i >= 0; i--) {
        const r = landingRipples[i];
        r.r += 2.5 * deltaTime;
        r.alpha -= 0.04 * deltaTime;
        if (r.alpha <= 0 || r.r >= r.maxR) {
            landingRipples.splice(i, 1);
        }
    }

    // Update floating score text popups
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 1.5 * deltaTime;
        ft.alpha -= 0.02 * deltaTime;
        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function lerpColor(c1, c2, t) {
    const hex2rgb = h => [parseInt(h.slice(1,3), 16), parseInt(h.slice(3,5), 16), parseInt(h.slice(5,7), 16)];
    const [r1, g1, b1] = hex2rgb(c1);
    const [r2, g2, b2] = hex2rgb(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

function draw() {
    // BG
    const t = Math.min(1, score / 2000);
    const topColor = lerpColor('#02020a', '#0a001a', t);
    const bottomColor = lerpColor('#07080f', '#140024', t);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
    bgGrad.addColorStop(0, topColor);
    bgGrad.addColorStop(1, bottomColor);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        s.twinkle += s.speed;
        ctx.globalAlpha = Math.max(0.2, Math.abs(Math.sin(s.twinkle)));
        // Parallax
        const sy = (s.y + camY * 0.15) % ch;
        const drawY = sy < 0 ? sy + ch : sy;
        ctx.beginPath();
        ctx.arc(s.x, drawY, s.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    // Apply Screenshake & Camera Translation
    ctx.translate(shakeX, shakeY);
    ctx.translate(0, camY);

    platforms.forEach(p => p.draw());
    hazards.forEach(h => h.draw());
    coins.forEach(c => c.draw());

    // Draw landing ripples
    ctx.save();
    landingRipples.forEach(r => {
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.restore();

    player.draw();

    // Particles (standard + speedlines)
    particles.forEach(p => {
        if (p.type === 'speedline') {
            ctx.save();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + p.length);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    });
    ctx.globalAlpha = 1;

    // Draw floating score text popups
    ctx.save();
    floatingTexts.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();

    ctx.restore(); // restores shake/camera

    // Full-screen red/pink flash overlay
    if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 45, 120, ${flashAlpha})`;
        ctx.fillRect(0, 0, cw, ch);
    }
}

function varColor(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

let lastTimestamp = 0;
function gameLoop(timestamp = 0) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const deltaTime = Math.min(dt / 16.67, 3);

    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    scoreDisplay.innerText = Math.floor(score);
    levelDisplay.innerText = `LVL ${level}`;
    livesDisplay.innerText = '❤️'.repeat(Math.max(0, player.lives));
}

function gameOver() {
    gameState = 'GAMEOVER';
    sfx.die();
    spawnParticles(player.x, player.y, 50, '#ff2d78');

    // Stop procedural music
    MusicSynth.stop();

    // Juice: crash squash, massive screenshake, and flash
    player.scaleY = 0.4;
    player.scaleX = 1.6;
    triggerShake(24, 9.0);
    flashAlpha = 0.8;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('skj_best', bestScore);
        bestScoreEl.innerText = bestScore;
    }
    
    finalScoreEl.innerText = Math.floor(score);
    screenGameOver.classList.remove('hidden');
    checkAchievements();
}

function checkAchievements() {
    if (!window.achievements) return;
    if (level >= 5) achievements.unlock('skyjumper', 'lvl5', 'Stratosphere (Level 5)');
    if (score >= 1000) achievements.unlock('skyjumper', 'score1000', 'Sky Legend (1000 Pts)');
}

// Buttons
btnStart.addEventListener('click', () => {
    initAudio();
    screenStart.classList.add('hidden');
    resetGame();
    gameState = 'PLAYING';
    MusicSynth.start();
});

btnRetry.addEventListener('click', () => {
    screenGameOver.classList.add('hidden');
    resetGame();
    gameState = 'PLAYING';
    MusicSynth.start();
});

function pauseGame() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        screenPause.classList.remove('hidden');
        btnPause.innerText = '▶️';
        MusicSynth.stop();
    }
}

function resumeGame() {
    if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        screenPause.classList.add('hidden');
        screenHelp.classList.add('hidden');
        btnPause.innerText = '⏸️';
        MusicSynth.start();
    }
}

function toggleHelp(show) {
    if (show) {
        screenHelp.classList.remove('hidden');
        if (gameState === 'PLAYING') pauseGame();
    } else {
        screenHelp.classList.add('hidden');
    }
}

btnPause.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') pauseGame();
    else resumeGame();
});

btnPause.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') pauseGame();
    else resumeGame();
});

btnResume.addEventListener('click', () => {
    resumeGame();
});

btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.innerText = soundEnabled ? '🔊' : '🔇';
    btnSound.style.opacity = soundEnabled ? '1' : '0.5';
});

btnShareWA.addEventListener('click', () => {
    const text = encodeURIComponent(`I just scored ${Math.floor(score)} in Sky Jumper! Can you beat my score? Play at arcadehubplay.com/sky-jumper-frontend/`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
});

btnShareX.addEventListener('click', () => {
    const text = encodeURIComponent(`I just scored ${Math.floor(score)} in Sky Jumper! Can you beat my score? #SkyJumper #ArcadeHub`);
    const url = encodeURIComponent('http://arcadehubplay.com/sky-jumper-frontend/');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
});

btnHelp.addEventListener('click', () => toggleHelp(true));
btnCloseHelp.addEventListener('click', () => toggleHelp(false));

document.querySelectorAll('#btn-hub, .btn-hub-over').forEach(btn => {
    btn.addEventListener('click', () => {
        MusicSynth.stop();
    });
    btn.addEventListener('touchstart', () => {
        MusicSynth.stop();
    });
});
// Init
resetGame();
gameLoop();
