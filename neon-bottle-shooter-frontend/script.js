// ---- Game State & DOM ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiScore = document.getElementById('ui-score');
const uiTime = document.getElementById('ui-time');
const uiAccuracy = document.getElementById('ui-accuracy');
const uiAmmo = document.getElementById('ui-ammo');
const uiComboText = document.getElementById('ui-combo-text');
const uiComboContainer = document.getElementById('ui-combo-container');
const btnAmmoReload = document.getElementById('btn-reload');
const btnPause = document.getElementById('btn-pause');
const btnMute = document.getElementById('btn-mute');

// Menus
const mainMenu = document.getElementById('mainMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const pauseMenu = document.getElementById('pauseMenu');
const modeBtns = document.querySelectorAll('.mode-btn');

// --- Globals ---
let animationFrameId;
let lastTime = 0;
let gameState = 'menu'; // menu, playing, paused, gameover
let gameMode = 'classic'; // classic, survival, precision

// Stats
let score = 0;
let timer = 60;
let timeAccumulator = 0;
let shotsFired = 0;
let shotsHit = 0;
let currentCombo = 0;
let maxCombo = 0;
let bottlesDestroyed = 0;
let goldDestroyed = 0;
let iceDestroyed = 0;
let giantDestroyed = 0;
let perfectReloads = 0;
let noBombsShot = true;
let comboMultiplier = 1;

// Ammo & Weapons
const MAX_AMMO = 6;
let ammo = MAX_AMMO;
let isReloading = false;
let reloadTimer = 0;
let slowTimer = 0;
let shotgunAmmo = 0;

// Entities
let bottles = [];
let particles = [];
let floatingTexts = [];

// Effects
let screenShake = 0;
let freezeTimer = 0;
let bossWave = false;
let currentWave = 1;
let waveTimer = 0;
let strikes = 0;

// Juiced Gun & Laser Effects
let gunRecoil = 0;
let muzzleFlashTimer = 0;
let crosshairScale = 1.0;
let laserTrails = [];

function updateLaserTrails(deltaTime) {
    laserTrails.forEach(t => t.life -= 0.25 * deltaTime);
    laserTrails = laserTrails.filter(t => t.life > 0);
}

function drawLaserTrails() {
    laserTrails.forEach(t => {
        ctx.save();
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 6 * t.life;
        ctx.globalAlpha = t.life;
        ctx.shadowBlur = 15;
        ctx.shadowColor = t.color;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawGun() {
    ctx.save();
    const bx = canvas.width / 2;
    const by = canvas.height - 20;
    
    // Angle to crosshair
    const dx = crosshair.x - bx;
    const dy = crosshair.y - by;
    const angle = Math.atan2(dy, dx);
    
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.translate(-gunRecoil, 0);
    
    // 1. Grip / Handguard
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#1a0510';
    
    ctx.beginPath();
    ctx.moveTo(-25, 5);
    ctx.lineTo(-35, 30);
    ctx.lineTo(-20, 35);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Handguard arc
    ctx.beginPath();
    ctx.arc(-15, 10, 20, Math.PI, Math.PI * 0.4, true);
    ctx.stroke();
    
    // 2. Large green power cell/battery in the receiver area
    const cellGrad = ctx.createLinearGradient(0, -12, 0, 12);
    cellGrad.addColorStop(0, '#00ff66');
    cellGrad.addColorStop(0.5, '#66ffaa');
    cellGrad.addColorStop(1, '#009933');
    
    ctx.fillStyle = cellGrad;
    ctx.strokeStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(-5, -12, 35, 24, 6);
    ctx.fill();
    ctx.stroke();
    
    // Cooling vent cover (slanted plates on top of power cell)
    ctx.fillStyle = '#111';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(25, -15);
    ctx.lineTo(15, 15);
    ctx.lineTo(-5, 15);
    ctx.closePath();
    ctx.fill();
    
    // Vent slits (vertical green slots showing through)
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(2 + i * 8, -8, 3, 16);
    }
    
    // 3. Heavy outer casing
    ctx.strokeStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#081c18';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.lineTo(40, -18);
    ctx.lineTo(55, -12);
    ctx.lineTo(55, 12);
    ctx.lineTo(40, 18);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 4. Double Barrels
    const barrelColor = shotgunAmmo > 0 ? '#ff5500' : '#00ffcc';
    ctx.strokeStyle = barrelColor;
    ctx.shadowColor = barrelColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0a0d14';
    
    // Top Barrel
    ctx.beginPath();
    ctx.rect(55, -11, 50, 7);
    ctx.fill();
    ctx.stroke();
    
    // Bottom Barrel
    ctx.beginPath();
    ctx.rect(55, 4, 50, 7);
    ctx.fill();
    ctx.stroke();
    
    // 5. Dual glowing cores inside the barrels
    const coreColor = shotgunAmmo > 0 ? '#ffcc00' : '#ffffff';
    ctx.strokeStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    
    // Top core
    ctx.beginPath();
    ctx.moveTo(60, -7.5);
    ctx.lineTo(100, -7.5);
    ctx.stroke();
    
    // Bottom core
    ctx.beginPath();
    ctx.moveTo(60, 7.5);
    ctx.lineTo(100, 7.5);
    ctx.stroke();
    
    // 6. Charging muzzle rings near the tip
    ctx.strokeStyle = barrelColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    
    // Ring 1 (rear)
    ctx.beginPath();
    ctx.moveTo(78, -13);
    ctx.lineTo(78, 13);
    ctx.stroke();
    
    // Ring 2 (front)
    ctx.beginPath();
    ctx.moveTo(92, -13);
    ctx.lineTo(92, 13);
    ctx.stroke();
    
    // 7. Double Muzzle Flash
    if (muzzleFlashTimer > 0) {
        const flashColor = shotgunAmmo > 0 ? '#ff3300' : '#ffd700';
        const innerFlashColor = '#ffffff';
        
        drawSingleMuzzleFlash(105, -7.5, flashColor, innerFlashColor);
        drawSingleMuzzleFlash(105, 7.5, flashColor, innerFlashColor);
    }
    
    ctx.restore();
}

function drawSingleMuzzleFlash(x, y, color, innerColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.strokeStyle = color;
    ctx.fillStyle = innerColor;
    ctx.shadowBlur = 25;
    ctx.shadowColor = color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? 25 : 8;
        const a = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// Custom synthesized audio effects using Web Audio API nodes
class JuicedSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn("Could not create Web Audio Context:", e);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playLaser() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playShatter(isGiant = false) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const duration = isGiant ? 0.6 : 0.35;
        const freqs = isGiant ? [800, 1200, 1600] : [2000, 3100, 4300];

        freqs.forEach((f) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.8, t + duration);

            gain.gain.setValueAtTime(0.06 / freqs.length, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + duration + 0.01);
        });

        // Add a noise burst for friction/crunch
        try {
            const bufferSize = this.ctx.sampleRate * 0.05;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 3000;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.02, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(t);
            noise.stop(t + 0.06);
        } catch(e) {}
    }

    playReload() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        // Double mechanical click
        [0, 0.12].forEach((delay, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(idx === 0 ? 600 : 400, t + delay);
            osc.frequency.exponentialRampToValueAtTime(100, t + delay + 0.05);

            gain.gain.setValueAtTime(0.08, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t + delay);
            osc.stop(t + delay + 0.06);
        });
    }

    playEmptyClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.02);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    playCombo(multiplier) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const baseFreq = 440 * Math.pow(1.059, multiplier); // rising musical scale!

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.25);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.26);
    }

    playBomb() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.81);
    }

    playShotgun() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        
        [180, 260, 340].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

            gain.gain.setValueAtTime(0.2 / 3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.36);
        });

        try {
            const bufferSize = this.ctx.sampleRate * 0.25;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 800;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.12, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(t);
            noise.stop(t + 0.26);
        } catch(e) {}
    }
}

const synth = new JuicedSynth();

// Palettes
const colors = {
    normal: '#00ffff', // Cyan
    red: '#ff0055',    // Pink/Red bonus
    gold: '#ffd700',   // Gold
    ice: '#aaddff',    // Pale blue
    bomb: '#ff3300',   // Dark Red/Orange
    giant: '#ff00ff',  // Magenta
    slow: '#ffaa00',   // Orange
    shotgun: '#ff5500',// Orange-Red
    blast: '#ff00cc'   // Neon Pink-Purple
};

// Canvas Sizing
function resizeCanvas() {
    const wrapper = document.getElementById('gameWrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    
    // Fixed logical resolution based on aspect ratio
    const aspect = rect.height / rect.width;
    canvas.width = 1000;
    canvas.height = 1000 * aspect;
}
window.addEventListener('resize', () => {
    try { resizeCanvas(); } catch(e){}
});
resizeCanvas();

// --- Input Handling (Crosshair) ---
const crosshair = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    active: false
};

let rawMouseX = -100;
let rawMouseY = -100;

function mapCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousemove', (e) => {
    const p = mapCoords(e);
    rawMouseX = p.x;
    rawMouseY = p.y;
    crosshair.x = p.x;
    crosshair.y = p.y;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const p = mapCoords(e);
    crosshair.x = p.x;
    crosshair.y = p.y;
}, {passive: false});

canvas.addEventListener('mousedown', shoot);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const p = mapCoords(e);
    crosshair.x = p.x;
    crosshair.y = p.y;
    shoot();
}, {passive: false});

// --- Sound Standard ---
if (btnMute) {
    btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        const muted = synth.toggleMute();
        btnMute.innerHTML = muted ? '🔇' : '🔊';
        if (window.audioFX) {
            window.audioFX.toggleMute();
        }
    });
}

// --- Sound Utility ---
function playSound(type) {
    synth.init();
    try {
        switch(type) {
            case 'shoot': synth.playLaser(); break; 
            case 'shatter': synth.playShatter(); break;
            case 'reload': synth.playReload(); break;
            case 'empty': synth.playEmptyClick(); break;
            case 'combo': synth.playCombo(comboMultiplier); break;
            case 'bomb': synth.playBomb(); break;
            case 'shotgun': synth.playShotgun(); break;
        }
    } catch(e) {
        console.warn("Audio error:", e);
    }
}

// --- Classes ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 20;
        this.vy = (Math.random() - 0.5) * 20 - 5; // push up slightly
        this.size = Math.random() * 8 + 4;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.3;
        
        // Generate random triangular/polygonal shard points
        this.points = [];
        const numPoints = Math.floor(Math.random() * 3) + 3; // 3 to 5 points
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const r = Math.random() * 0.5 + 0.5;
            this.points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 0.8 * deltaTime; // gravity
        this.angle += this.angularVelocity * deltaTime;
        this.life -= this.decay * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color + '33';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        this.points.forEach((p, idx) => {
            const px = p.x * this.size;
            const py = p.y * this.size;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color, size = 24) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.size = size;
        this.scale = 2.0; // starts double size
    }
    update(deltaTime) {
        this.y -= 2.2 * deltaTime;
        this.life -= 0.025 * deltaTime;
        if (this.scale > 1.0) {
            this.scale -= 0.12 * deltaTime;
        } else {
            this.scale = 1.0;
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Outfit`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

class Bottle {
    constructor(type) {
        this.type = type;
        this.color = colors[type] || colors.normal;
        this.w = type === 'giant' ? 80 : 48;
        this.h = type === 'giant' ? 160 : 96;
        
        // Starting pos and movement logic
        const side = Math.random() > 0.5 ? 1 : -1;
        this.x = side === 1 ? -100 : canvas.width + 100;
        
        // Pick one of the 3 visual shelves (25%, 50%, 75% of screen height)
        const shelfLevel = Math.floor(Math.random() * 3) + 1;
        const shelfY = (canvas.height / 4) * shelfLevel;
        this.y = shelfY - (this.h / 2);
        
        let speedMult = 1 + (currentWave * 0.2);
        this.vx = side * (Math.random() * 3 + 2) * speedMult;
        
        // sine wave pattern
        this.isZigZag = Math.random() > 0.7;
        this.startY = this.y;
        this.angle = 0;
        
        this.hp = type === 'giant' ? 3 : 1;
        this.active = true;

        // Visual squash/stretch
        this.scaleX = 0.01;
        this.scaleY = 0.01;
        this.squashVelocityX = 0.0;
        this.squashVelocityY = 0.0;
    }

    update(deltaTime) {
        if (freezeTimer > 0) return; // Ice effect
        
        let speedMult = 1.0;
        if (slowTimer > 0) speedMult = 0.4;
        
        this.x += this.vx * speedMult * deltaTime;
        if (this.isZigZag) {
            this.angle += 0.1 * speedMult * deltaTime;
            this.y = this.startY + Math.sin(this.angle) * 50;
        }

        // Spring squash and stretch physics
        const k = 0.15; // spring constant
        const damping = 0.8; // damping factor
        const ax = -k * (this.scaleX - 1.0);
        const ay = -k * (this.scaleY - 1.0);
        this.squashVelocityX += ax * deltaTime;
        this.squashVelocityY += ay * deltaTime;
        this.squashVelocityX *= damping;
        this.squashVelocityY *= damping;
        this.scaleX += this.squashVelocityX * deltaTime;
        this.scaleY += this.squashVelocityY * deltaTime;

        // Conveyor bounce logic (if hits edge, rarely bounce, usually disappear)
        if (this.x > canvas.width + 150 || this.x < -150) {
            this.active = false;
            if (gameMode === 'survival' && gameState === 'playing' && this.type !== 'bomb') {
                strikes++;
                updateHUD();
                if (strikes >= 3) {
                    setTimeout(() => {
                        if (gameState === 'playing') gameOver();
                    }, 800);
                }
            }
        }
    }

    draw() {
        if (!this.active) return;
        ctx.save();
        
        // Apply squash & stretch relative to visual center
        ctx.translate(this.x + this.w / 2, this.y);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.translate(-(this.x + this.w / 2), -this.y);

        const top = this.y - this.h / 2;
        const bottom = this.y + this.h / 2;
        const left = this.x;
        const right = this.x + this.w;
        const w = this.w;
        const h = this.h;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = this.color;
        
        // Subtle gradient fill for glass depth
        const bodyGrad = ctx.createLinearGradient(left, 0, right, 0);
        bodyGrad.addColorStop(0, this.color + '22');
        bodyGrad.addColorStop(0.3, this.color + '0a');
        bodyGrad.addColorStop(0.7, this.color + '0a');
        bodyGrad.addColorStop(1, this.color + '22');
        ctx.fillStyle = bodyGrad;
        
        // Outline path with rounded neck, shoulders, and bottom
        ctx.beginPath();
        ctx.moveTo(left + w * 0.35, top);
        ctx.lineTo(left + w * 0.65, top);
        ctx.quadraticCurveTo(left + w * 0.68, top, left + w * 0.68, top + h * 0.05);
        ctx.lineTo(left + w * 0.65, top + h * 0.06);
        ctx.lineTo(left + w * 0.65, top + h * 0.28);
        ctx.bezierCurveTo(
            left + w * 0.65, top + h * 0.35,
            right, top + h * 0.38,
            right, top + h * 0.45
        );
        ctx.lineTo(right, bottom - h * 0.08);
        ctx.quadraticCurveTo(right, bottom, right - w * 0.15, bottom);
        ctx.lineTo(left + w * 0.15, bottom);
        ctx.quadraticCurveTo(left, bottom, left, bottom - h * 0.08);
        ctx.lineTo(left, top + h * 0.45);
        ctx.bezierCurveTo(
            left, top + h * 0.38,
            left + w * 0.35, top + h * 0.35,
            left + w * 0.35, top + h * 0.28
        );
        ctx.lineTo(left + w * 0.35, top + h * 0.06);
        ctx.quadraticCurveTo(left + w * 0.32, top + h * 0.05, left + w * 0.32, top);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 1. Draw sloshing liquid shader inside the bottle bounds
        ctx.save();
        // Create clipping path from the outer bottle shape
        ctx.beginPath();
        ctx.moveTo(left + w * 0.35, top);
        ctx.lineTo(left + w * 0.65, top);
        ctx.quadraticCurveTo(left + w * 0.68, top, left + w * 0.68, top + h * 0.05);
        ctx.lineTo(left + w * 0.65, top + h * 0.06);
        ctx.lineTo(left + w * 0.65, top + h * 0.28);
        ctx.bezierCurveTo(left + w * 0.65, top + h * 0.35, right, top + h * 0.38, right, top + h * 0.45);
        ctx.lineTo(right, bottom - h * 0.08);
        ctx.quadraticCurveTo(right, bottom, right - w * 0.15, bottom);
        ctx.lineTo(left + w * 0.15, bottom);
        ctx.quadraticCurveTo(left, bottom, left, bottom - h * 0.08);
        ctx.lineTo(left, top + h * 0.45);
        ctx.bezierCurveTo(left, top + h * 0.38, left + w * 0.35, top + h * 0.35, left + w * 0.35, top + h * 0.28);
        ctx.lineTo(left + w * 0.35, top + h * 0.06);
        ctx.quadraticCurveTo(left + w * 0.32, top + h * 0.05, left + w * 0.32, top);
        ctx.closePath();
        ctx.clip();
        
        // Define fluid color gradients based on type
        const liquidGrad = ctx.createLinearGradient(0, bottom - h * 0.5, 0, bottom);
        liquidGrad.addColorStop(0, this.color + 'cc');
        liquidGrad.addColorStop(1, this.color + '44');
        ctx.fillStyle = liquidGrad;
        
        // Draw the sloshing waves
        const liquidLevel = bottom - h * 0.45;
        const sloshAngle = (Date.now() * 0.004) + (this.x * 0.01);
        const sloshHeight = Math.sin(sloshAngle) * 4;
        
        ctx.beginPath();
        ctx.moveTo(left - 20, bottom + 20);
        ctx.lineTo(left - 20, liquidLevel + sloshHeight);
        ctx.quadraticCurveTo(
            left + w * 0.5, liquidLevel - sloshHeight,
            right + 20, liquidLevel + sloshHeight
        );
        ctx.lineTo(right + 20, bottom + 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 2. Draw glossy light reflection highlights
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        
        // Left edge shine
        ctx.beginPath();
        ctx.moveTo(left + w * 0.08, top + h * 0.48);
        ctx.lineTo(left + w * 0.08, bottom - h * 0.1);
        ctx.stroke();
        
        // Neck reflection
        ctx.beginPath();
        ctx.moveTo(left + w * 0.38, top + h * 0.1);
        ctx.lineTo(left + w * 0.38, top + h * 0.22);
        ctx.stroke();
        ctx.restore();

        // 3. Draw inner icons centered
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        
        if (this.type === 'bomb') {
            ctx.font = 'bold 24px Outfit';
            ctx.fillText('💣', left + w/2, top + h * 0.72);
        } else if (this.type === 'giant') {
            // Give giant bottles a darker filled look
            ctx.fillStyle = `rgba(255,0,255,${this.hp/3 * 0.35})`;
            ctx.fillRect(left + 2, top + h * 0.45, w - 4, h * 0.45);
        } else if (this.type === 'ice') {
            ctx.font = 'bold 20px Outfit';
            ctx.fillText('❄️', left + w/2, top + h * 0.72);
        } else if (this.type === 'slow') {
            ctx.font = 'bold 20px Outfit';
            ctx.fillText('⏳', left + w/2, top + h * 0.72);
        } else if (this.type === 'shotgun') {
            ctx.font = 'bold 20px Outfit';
            ctx.fillText('⚡', left + w/2, top + h * 0.72);
        } else if (this.type === 'blast') {
            ctx.font = 'bold 20px Outfit';
            ctx.fillText('💥', left + w/2, top + h * 0.72);
        }
        
        ctx.restore();
    }
}

// --- Mechanics ---

function spawnBottle() {
    let type = 'normal';
    const r = Math.random();
    if (r < 0.06) {
        type = 'bomb';
    } else if (r < 0.10) {
        type = 'ice';
    } else if (r < 0.14) {
        type = 'slow';
    } else if (r < 0.18) {
        type = 'shotgun';
    } else if (r < 0.22) {
        type = 'blast';
    } else if (r < 0.28) {
        type = 'gold';
    } else if (r < 0.38) {
        type = 'red';
    } else if (r < 0.44 && currentWave > 2) {
        type = 'giant';
    }
    
    bottles.push(new Bottle(type));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function reload() {
    if (gameMode === 'precision') return;
    if (isReloading || ammo === MAX_AMMO) return;
    isReloading = true;
    reloadTimer = 30; // 0.5 seconds
    synth.playReload();
    uiAmmo.classList.add('ammo-empty');
}

function finishReload() {
    isReloading = false;
    ammo = MAX_AMMO;
    uiAmmo.classList.remove('ammo-empty');
    updateHUD();
    perfectReloads++;
    if (perfectReloads >= 20 && window.achievements) window.achievements.unlock('bottle', 'reload_20', 'Reload Master');
}

function triggerCombo(amount) {
    currentCombo += amount;
    if (currentCombo > maxCombo) maxCombo = currentCombo;
    
    comboMultiplier = 1 + Math.floor(currentCombo / 5);
    
    uiComboText.textContent = `COMBO x${comboMultiplier} (${currentCombo})`;
    uiComboContainer.classList.add('active');
    
    // Play rising pitch combo chime
    synth.playCombo(comboMultiplier);
    
    // Remove active class to replay animation later
    clearTimeout(uiComboContainer.timeout);
    uiComboContainer.timeout = setTimeout(() => {
        uiComboContainer.classList.remove('active');
    }, 2000);

    if (currentCombo === 10 && window.achievements) {
        window.achievements.unlock('bottle', 'combo_10', 'Combo King');
    }
}

function resetCombo() {
    currentCombo = 0;
    comboMultiplier = 1;
    uiComboContainer.classList.remove('active');
}

function checkCollisionAt(tx, ty) {
    let hit = false;
    for (let i = bottles.length - 1; i >= 0; i--) {
        const b = bottles[i];
        const padx = 15;
        const pady = 15;
        if (tx > b.x - padx && tx < b.x + b.w + padx &&
            ty > b.y - b.h/2 - pady && ty < b.y + b.h/2 + pady) {
            
            b.hp--;
            if (b.hp <= 0) {
                hitBottle(b, i);
            } else {
                b.scaleX = 1.5;
                b.scaleY = 0.5;
                b.squashVelocityX = -0.3;
                b.squashVelocityY = 0.3;
                createExplosion(tx, ty, '#fff');
                synth.playShatter(true);
            }
            hit = true;
            break;
        }
    }
    return hit;
}

function shootShotgun() {
    shotgunAmmo--;
    shotsFired++;
    
    playSound('shotgun');
    
    gunRecoil = 45;
    muzzleFlashTimer = 8;
    crosshairScale = 2.0;
    screenShake = 12;
    
    updateHUD();
    
    const bx = canvas.width / 2;
    const by = canvas.height - 20;
    const dx = crosshair.x - bx;
    const dy = crosshair.y - by;
    const angle = Math.atan2(dy, dx);
    const muzzleX = bx + Math.cos(angle) * 105;
    const muzzleY = by + Math.sin(angle) * 105;
    
    laserTrails.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: crosshair.x,
        y2: crosshair.y,
        color: '#ff5500',
        life: 1.0
    });
    laserTrails.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: crosshair.x - 90,
        y2: crosshair.y,
        color: '#ffaa00',
        life: 1.0
    });
    laserTrails.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: crosshair.x + 90,
        y2: crosshair.y,
        color: '#ffaa00',
        life: 1.0
    });
    
    [crosshair.x, crosshair.x - 90, crosshair.x + 90].forEach(tx => {
        for (let s = 0; s < 5; s++) {
            particles.push(new Particle(tx, crosshair.y, '#ffaa00'));
        }
    });

    let hitAny = false;
    if (checkCollisionAt(crosshair.x, crosshair.y)) hitAny = true;
    if (checkCollisionAt(crosshair.x - 90, crosshair.y)) hitAny = true;
    if (checkCollisionAt(crosshair.x + 90, crosshair.y)) hitAny = true;
    
    if (!hitAny) {
        resetCombo();
        if (gameMode === 'survival') {
            strikes++;
            updateHUD();
            if (strikes >= 3) {
                setTimeout(() => {
                    if (gameState === 'playing') gameOver();
                }, 800);
                return;
            }
            score -= 50;
            if (score < 0) score = 0;
        }
    }

    if (gameMode === 'precision' && ammo <= 0 && shotgunAmmo <= 0) {
        setTimeout(() => {
            if (gameState === 'playing') gameOver();
        }, 800);
    }
}

function shoot() {
    if (gameState !== 'playing') return;
    
    if (isReloading) return;

    if (shotgunAmmo > 0) {
        shootShotgun();
        return;
    }

    if (ammo <= 0) {
        if (gameMode === 'precision') {
            gameOver();
            return;
        }
        synth.playEmptyClick();
        reload();
        return;
    }

    ammo--;
    shotsFired++;
    
    synth.init();
    synth.playLaser();
    
    gunRecoil = 30;
    muzzleFlashTimer = 5;
    crosshairScale = 1.6;
    screenShake = 7;
    
    updateHUD();
    
    const bx = canvas.width / 2;
    const by = canvas.height - 20;
    const dx = crosshair.x - bx;
    const dy = crosshair.y - by;
    const angle = Math.atan2(dy, dx);
    const muzzleX = bx + Math.cos(angle) * 105;
    const muzzleY = by + Math.sin(angle) * 105;
    
    laserTrails.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: crosshair.x,
        y2: crosshair.y,
        color: '#00ffcc',
        life: 1.0
    });
    
    for (let s = 0; s < 6; s++) {
        particles.push(new Particle(crosshair.x, crosshair.y, '#00ffff'));
    }

    let hit = checkCollisionAt(crosshair.x, crosshair.y);

    if (!hit) {
        resetCombo();
        if (gameMode === 'survival') {
            strikes++;
            updateHUD();
            if (strikes >= 3) {
                setTimeout(() => {
                    if (gameState === 'playing') gameOver();
                }, 800);
                return;
            }
            score -= 50;
            if (score < 0) score = 0;
        }
    }

    if (gameMode === 'precision' && ammo <= 0 && shotgunAmmo <= 0) {
        setTimeout(() => {
            if (gameState === 'playing') gameOver();
        }, 800);
    }
}

function triggerMegaBlast(centerX, centerY) {
    const radius = 220;
    
    playSound('bomb');
    
    createExplosion(centerX, centerY, colors.blast);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const vx = Math.cos(angle) * 12;
        const vy = Math.sin(angle) * 12;
        const p = new Particle(centerX, centerY, colors.blast);
        p.vx = vx;
        p.vy = vy;
        particles.push(p);
    }
    
    const targets = [];
    for (let i = bottles.length - 1; i >= 0; i--) {
        const b = bottles[i];
        const bx = b.x + b.w/2;
        const by = b.y;
        const dist = Math.hypot(bx - centerX, by - centerY);
        if (dist <= radius) {
            targets.push({ bottle: b, index: i });
        }
    }

    targets.sort((a, b) => b.index - a.index);
    targets.forEach(t => {
        if (bottles[t.index] === t.bottle) {
            if (t.bottle.type === 'blast') {
                bottles.splice(t.index, 1);
                shotsHit++;
                bottlesDestroyed++;
                createExplosion(t.bottle.x + t.bottle.w/2, t.bottle.y, t.bottle.color);
                score += 150 * comboMultiplier;
            } else {
                hitBottle(t.bottle, t.index);
            }
        }
    });
}

function hitBottle(b, index) {
    bottles.splice(index, 1);
    shotsHit++;
    bottlesDestroyed++;
    createExplosion(b.x + b.w/2, b.y, b.color);
    
    synth.playShatter(b.type === 'giant');
    
    if (bottlesDestroyed === 1 && window.achievements) window.achievements.unlock('bottle', '1st', 'First Smash');
    if (bottlesDestroyed === 500 && window.achievements) window.achievements.unlock('bottle', 'destroy_500', 'Bottle Hunter');
    if (bottlesDestroyed === 1000 && window.achievements) window.achievements.unlock('bottle', 'destroy_1000', 'Demolition Expert');

    let pts = 0;
    switch(b.type) {
        case 'normal': pts = 10; break;
        case 'red': pts = 50; break;
        case 'gold': 
            pts = 100; triggerCombo(2); 
            goldDestroyed++;
            if(goldDestroyed>=50 && window.achievements) window.achievements.unlock('bottle', 'gold_50', 'Gold Rush');
            break;
        case 'ice': 
            freezeTimer = 300; // 5 seconds freeze
            iceDestroyed++;
            if(iceDestroyed>=25 && window.achievements) window.achievements.unlock('bottle', 'ice_25', 'Ice Breaker');
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3, '❄️ TIME FROZEN! ❄️', colors.ice, 48));
            break;
        case 'slow':
            slowTimer = 480; // 8 seconds slow
            pts = 50;
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3, '⏳ SLOW MOTION! ⏳', colors.slow, 48));
            break;
        case 'shotgun':
            shotgunAmmo = 5; // 5 shotgun shells
            pts = 50;
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3, '⚡ SHOTGUN SPREAD! ⚡', colors.shotgun, 48));
            break;
        case 'blast':
            pts = 150;
            screenShake = 25;
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3, '💥 MEGA BLAST! 💥', colors.blast, 48));
            triggerMegaBlast(b.x + b.w/2, b.y);
            break;
        case 'giant': 
            pts = 200; screenShake = 15; 
            giantDestroyed++;
            break;
        case 'bomb': 
            pts = -100; resetCombo(); screenShake = 20; synth.playBomb(); noBombsShot = false; break;
    }

    if (b.type !== 'bomb') {
        triggerCombo(1);
    }

    const finalPts = pts * comboMultiplier;
    score += finalPts;
    
    if (score < 0) score = 0;

    let sign = finalPts > 0 ? '+' : '';
    floatingTexts.push(new FloatingText(b.x + b.w/2, b.y, `${sign}${finalPts}`, b.color));
    
    updateHUD();
}

// --- Main Loop ---

function update(deltaTime) {
    if (isReloading) {
        reloadTimer -= deltaTime;
        if (reloadTimer <= 0) finishReload();
    }

    if (freezeTimer > 0) freezeTimer -= deltaTime;
    if (slowTimer > 0) slowTimer -= deltaTime;

    // Gun recoil, muzzle flash, crosshair scale, laser trails update
    if (gunRecoil > 0) {
        gunRecoil += -0.15 * gunRecoil * deltaTime;
        if (gunRecoil < 0.1) gunRecoil = 0;
    }
    if (muzzleFlashTimer > 0) {
        muzzleFlashTimer -= deltaTime;
    }
    if (crosshairScale > 1.0) {
        crosshairScale += -0.12 * (crosshairScale - 1.0) * deltaTime;
        if (crosshairScale < 1.01) crosshairScale = 1.0;
    }
    updateLaserTrails(deltaTime);

    // Bottle generation
    waveTimer += deltaTime;
    let spawnRate = Math.max(30, 90 - (currentWave * 10)); 
    if (gameMode === 'precision') spawnRate = 120; // Slower for precision
    
    // We use a separate accumulator for spawning to keep it consistent
    if (!this._spawnAccum) this._spawnAccum = 0;
    this._spawnAccum += deltaTime;
    if (this._spawnAccum >= spawnRate && freezeTimer <= 0) {
        spawnBottle();
        this._spawnAccum = 0;
    }

    // Wave Progression
    if (waveTimer > 600) { // Every 10 seconds advance difficulty
        waveTimer = 0;
        currentWave++;
        if (currentWave === 3 && window.achievements) {
            window.achievements.unlock('bottle', 'boss_1', 'Boss Breaker'); 
        }
    }

    // Update Entities
    bottles.forEach(b => b.update(deltaTime));
    bottles = bottles.filter(b => b.active);

    particles.forEach(p => p.update(deltaTime));
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(t => t.update(deltaTime));
    floatingTexts = floatingTexts.filter(t => t.life > 0);

    // Timer & Modes
    if (gameMode === 'classic') {
        timeAccumulator += deltaTime;
        if (timeAccumulator >= 60) {
            timeAccumulator -= 60;
            timer--;
            if (timer <= 10) uiTime.classList.add('time-warning');
            updateHUD();
            if (timer <= 0) gameOver();
        }
    } else if (gameMode === 'survival' || gameMode === 'precision') {
        // Handled in shoot()
    }
}

function drawCrosshair() {
    ctx.save();
    ctx.translate(crosshair.x, crosshair.y);
    ctx.scale(crosshairScale, crosshairScale);
    
    ctx.strokeStyle = isReloading ? varWarn() : varAccent();
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    
    const r = crosshair.radius;
    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.stroke();

    // Ticks
    const off = isReloading ? (reloadTimer % 10) : 0;
    ctx.beginPath();
    ctx.moveTo(-r-10 + off, 0); ctx.lineTo(-r + off, 0);
    ctx.moveTo(r - off, 0); ctx.lineTo(r+10 - off, 0);
    ctx.moveTo(0, -r-10 + off); ctx.lineTo(0, -r + off);
    ctx.moveTo(0, r - off); ctx.lineTo(0, r+10 - off);
    ctx.stroke();

    if (isReloading) {
        ctx.font = '12px Outfit';
        ctx.fillStyle = varWarn();
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING', 0, r + 25);
    }
    
    ctx.restore();
}

function drawShelves() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    
    for(let i=1; i<4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (canvas.height/4) * i);
        ctx.lineTo(canvas.width, (canvas.height/4) * i);
        ctx.stroke();
    }
    ctx.restore();
}

function drawVignette(color, intensity) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 25;
    ctx.globalAlpha = intensity;
    ctx.shadowBlur = 40;
    ctx.shadowColor = color;
    ctx.strokeRect(12.5, 12.5, canvas.width - 25, canvas.height - 25);
    ctx.restore();
}

function draw() {
    ctx.save();
    
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        const angle = (Math.random() - 0.5) * screenShake * 0.003;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvas.width / 2 + dx, -canvas.height / 2 + dy);
        
        screenShake -= 0.6;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    if (freezeTimer > 0) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.15;
        drawVignette('#00aaff', pulse * Math.min(1.0, freezeTimer / 30));
        ctx.fillStyle = 'rgba(170, 221, 255, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (slowTimer > 0) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.15;
        drawVignette('#ffaa00', pulse * Math.min(1.0, slowTimer / 30));
        ctx.fillStyle = 'rgba(255, 170, 0, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawShelves();

    bottles.forEach(b => b.draw());
    particles.forEach(p => p.draw());
    floatingTexts.forEach(t => t.draw());

    if (gameState === 'playing') {
        drawGun();
        drawLaserTrails();
        drawCrosshair();
    }

    ctx.restore();
}

function loop(timestamp) {
    if (gameState === 'playing') {
        if (!lastTime) lastTime = timestamp;
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        
        const deltaTime = Math.min(dt / 16.67, 3);
        update(deltaTime);
        draw();
    } else {
        // Draw even in menu/gameover for background visuals
        draw();
        lastTime = timestamp;
    }
    animationFrameId = requestAnimationFrame(loop);
}

// --- Game Flow ---

function initGame(mode) {
    synth.init();
    if (btnMute) btnMute.innerHTML = synth.muted ? '🔇' : '🔊';
    gameMode = mode;
    score = 0;
    timer = gameMode === 'classic' ? 60 : 0;
    timeAccumulator = 0;
    shotsFired = 0;
    shotsHit = 0;
    currentCombo = 0;
    maxCombo = 0;
    bottlesDestroyed = 0;
    goldDestroyed = 0;
    iceDestroyed = 0;
    giantDestroyed = 0;
    perfectReloads = 0;
    noBombsShot = true;
    comboMultiplier = 1;

    if (gameMode === 'precision') {
        ammo = 30;
        if (btnAmmoReload) btnAmmoReload.style.display = 'none';
    } else {
        ammo = MAX_AMMO;
        if (btnAmmoReload) btnAmmoReload.style.display = 'inline-block';
    }

    isReloading = false;
    currentWave = 1;
    waveTimer = 0;
    bottles = [];
    particles = [];
    floatingTexts = [];
    freezeTimer = 0;
    slowTimer = 0;
    shotgunAmmo = 0;
    strikes = 0;

    uiTime.classList.remove('time-warning');
    uiTime.style.visibility = 'visible';

    updateHUD();
    document.getElementById('hud').classList.remove('hud-hidden');
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    
    canvas.classList.add('playing');
    gameState = 'playing';
    updateHubButton();
    lastTime = performance.now();
    
    if (!animationFrameId) loop(lastTime);
}

function updateHUD() {
    uiScore.textContent = score;
    
    if (gameMode === 'classic') {
        uiTime.textContent = timer;
    } else if (gameMode === 'survival') {
        let strikeStr = 'STRIKES: ';
        for (let i = 1; i <= 3; i++) {
            strikeStr += (i <= strikes) ? '❌' : '⚪';
        }
        uiTime.textContent = strikeStr;
    } else if (gameMode === 'precision') {
        uiTime.textContent = `BULLETS: ${ammo}`;
    }
    
    if (shotgunAmmo > 0) {
        uiAmmo.textContent = `⚡ Shotgun: ${shotgunAmmo}`;
        uiAmmo.classList.add('shotgun-active');
    } else if (gameMode === 'precision') {
        uiAmmo.textContent = `🔫 Ammo: ${ammo} / 30`;
        uiAmmo.classList.remove('shotgun-active');
    } else {
        uiAmmo.textContent = `🔫 ${ammo} / ${MAX_AMMO}`;
        uiAmmo.classList.remove('shotgun-active');
    }
    
    let acc = 100;
    if (shotsFired > 0) acc = Math.round((shotsHit / shotsFired) * 100);
    uiAccuracy.textContent = `${acc}%`;

    if (acc >= 90 && shotsFired >= 20 && window.achievements) {
        window.achievements.unlock('bottle', 'sharp_90', 'Sharp Shooter');
    }
    if (score >= 10000 && window.achievements) {
        window.achievements.unlock('bottle', 'score_legend', 'Neon Legend');
    }
}

function updateHubButton() {
    const btn = document.getElementById('hud-hub-btn');
    if (!btn) return;
    if (gameState === 'menu') {
        btn.textContent = '← Arcade Hub';
    } else {
        btn.textContent = '← Back';
    }
}

function gameOver() {
    gameState = 'gameover';
    updateHubButton();
    canvas.classList.remove('playing');
    document.getElementById('hud').classList.add('hud-hidden');
    
    const bestKey = `bottleBest_${gameMode}`;
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) {
        best = score;
        localStorage.setItem(bestKey, best);
    }

    if (noBombsShot && bottlesDestroyed > 10 && window.achievements) {
        window.achievements.unlock('bottle', 'no_bombs', 'Untouchable');
    }

    document.getElementById('go-score').textContent = score;
    document.getElementById('go-best').textContent = best;
    
    let acc = 100;
    if (shotsFired > 0) acc = Math.round((shotsHit / shotsFired) * 100);
    document.getElementById('go-accuracy').textContent = `${acc}%`;
    document.getElementById('go-combo').textContent = maxCombo;
    document.getElementById('go-bottles').textContent = bottlesDestroyed;

    setTimeout(() => {
        gameOverMenu.classList.remove('hidden');
    }, 500); 
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        canvas.classList.remove('playing');
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        canvas.classList.add('playing');
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
    }
}

// --- Utils ---
function varAccent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim(); }
function varWarn() { return getComputedStyle(document.body).getPropertyValue('--warn').trim(); }

// --- Event Listeners ---

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        initGame(btn.getAttribute('data-mode'));
    });
});

btnAmmoReload.addEventListener('click', () => {
    if (gameState === 'playing') reload();
});

btnPause.addEventListener('click', togglePause);

document.getElementById('btn-resume').addEventListener('click', togglePause);

document.getElementById('btn-restart').addEventListener('click', () => initGame(gameMode));
document.getElementById('btn-menu').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'menu';
    updateHubButton();
});
document.getElementById('btn-quit').addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hud-hidden');
    gameState = 'menu';
    updateHubButton();
});

const hubBtn = document.getElementById('hud-hub-btn');
if (hubBtn) {
    hubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameState === 'menu') {
            window.top.location.href = '../index.html';
        } else {
            if (gameState === 'paused') {
                togglePause();
            }
            gameState = 'menu';
            document.getElementById('hud').classList.add('hud-hidden');
            gameOverMenu.classList.add('hidden');
            pauseMenu.classList.add('hidden');
            mainMenu.classList.remove('hidden');
            updateHubButton();
        }
    });
}

// Initial call to set correct button label on load
updateHubButton();

// Start loop empty for background menu drawing
animationFrameId = requestAnimationFrame(loop);
