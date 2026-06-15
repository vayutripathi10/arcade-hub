// Game Constants
const BALL_RADIUS = 10;
const RING_RADIUS = 100;
const RING_THICKNESS = 15;
const GRAVITY = 0.4;
const BOUNCE_DAMPING = 0.8;
const ROTATION_MOMENTUM = 0.95;
const GAP_SIZE = 0.8; // Radians

const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00ea',
    danger: '#ff3c00',
    bg: '#050505',
    ring: '#1a1a1a'
};

const CHIME_PITCHES = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]; // A4, C5, D5, E5, G5, A5, C6, D6

// Web Audio API Sound Engine
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    setMuted(muted) {
        this.muted = muted;
    }

    play(type, comboCount = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;

        switch(type) {
            case 'bounce': {
                // FM Synthesizer for punchy electronic bounce
                const carrier = this.ctx.createOscillator();
                const modulator = this.ctx.createOscillator();
                const modGain = this.ctx.createGain();
                const mainGain = this.ctx.createGain();
                
                carrier.type = 'sine';
                modulator.type = 'sine';
                
                carrier.frequency.setValueAtTime(320, now);
                carrier.frequency.exponentialRampToValueAtTime(70, now + 0.12);
                
                modulator.frequency.setValueAtTime(200, now);
                modulator.frequency.linearRampToValueAtTime(40, now + 0.12);
                
                modGain.gain.setValueAtTime(140, now);
                modGain.gain.exponentialRampToValueAtTime(10, now + 0.12);
                
                mainGain.gain.setValueAtTime(0.24, now);
                mainGain.gain.linearRampToValueAtTime(0.001, now + 0.12);
                
                modulator.connect(modGain);
                modGain.connect(carrier.frequency);
                carrier.connect(mainGain);
                mainGain.connect(this.ctx.destination);
                
                modulator.start(now);
                carrier.start(now);
                modulator.stop(now + 0.12);
                carrier.stop(now + 0.12);
                break;
            }
            case 'pass': {
                // Minor Pentatonic Chime scale note on normal pass
                const index = Math.min(Math.max(0, comboCount - 1), CHIME_PITCHES.length - 1);
                const freq = CHIME_PITCHES[index];
                
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(freq, now);
                
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(freq * 2, now); // Crystal clear octave overtone
                
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
                break;
            }
            case 'superpass': {
                // Bandpass swept power chord on super combo drop passes
                const notes = [220.00, 329.63, 440.00, 659.25]; // A3, E4, A4, E5
                const mainGain = this.ctx.createGain();
                mainGain.gain.setValueAtTime(0.22, now);
                mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                
                notes.forEach(freq => {
                    const osc = this.ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);
                    osc.frequency.linearRampToValueAtTime(freq * 1.4, now + 0.5);
                    osc.connect(mainGain);
                    osc.start(now);
                    osc.stop(now + 0.6);
                });
                
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(120, now);
                filter.frequency.exponentialRampToValueAtTime(3200, now + 0.5);
                filter.Q.setValueAtTime(3.5, now);
                
                mainGain.connect(filter);
                filter.connect(this.ctx.destination);
                break;
            }
            case 'crash': {
                // Heavy detuned electronic sweep with lowpass filter
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();
                
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(140, now);
                osc1.frequency.linearRampToValueAtTime(25, now + 0.85);
                
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(143, now); // Detuned spread
                osc2.frequency.linearRampToValueAtTime(26, now + 0.85);
                
                gain.gain.setValueAtTime(0.38, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(280, now);
                filter.frequency.exponentialRampToValueAtTime(30, now + 0.85);
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(filter);
                filter.connect(this.ctx.destination);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.85);
                osc2.stop(now + 0.85);
                break;
            }
            case 'click': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
                break;
            }
        }
    }
}

const soundManager = new SoundManager();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const progressFill = document.getElementById('progress-fill');
const currentLevelEl = document.getElementById('current-level-label');
const nextLevelEl = document.getElementById('next-level-label');

// Game State
let gameState = 'START';
let isPaused = false;
let isMuted = false;
let score = 0;
let bestScore = localStorage.getItem('helixBestScore') || 0;
let level = 1;
let cameraY = 0;
let rings = [];
let particles = [];
let comboCount = 0;

// Camera shake parameters
let shakeIntensity = 0;
let shakeTimeRemaining = 0;

function triggerCameraShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimeRemaining = duration;
}

// Background speed lines for super drop combo state
const speedLines = [];
const NUM_SPEED_LINES = 15;
for (let i = 0; i < NUM_SPEED_LINES; i++) {
    speedLines.push({
        x: Math.random(),
        y: Math.random(),
        length: Math.random() * 80 + 40,
        speed: Math.random() * 15 + 10,
        opacity: Math.random() * 0.4 + 0.1
    });
}

// Input Handling
let isDragging = false;
let lastMouseX = 0;
let levelRotation = 0;
let lastTimestamp = 0;
let keys = {};

window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
        keys[key] = false;
    }
});

class Ball {
    constructor() {
        this.reset(0, 0);
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.scaleXVelocity = 0;
        this.scaleYVelocity = 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isExiting = false;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.scaleXVelocity = 0;
        this.scaleYVelocity = 0;
        comboCount = 0;
    }

    jump() {
        if (gameState !== 'PLAYING' || isPaused) return;
        this.vy = -7;
        soundManager.play('click');
        
        // Squeeze vertically on launch
        this.scaleY = 0.75;
        this.scaleX = 1.25;
    }

    update(deltaTime) {
        if (gameState !== 'PLAYING' || isPaused) return;

        // Apply Gravity
        this.vy += GRAVITY * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Friction / Air resistance
        this.vx *= Math.pow(0.99, deltaTime);

        // Spawn golden speed-streak particles behind the ball in super drop state
        if (comboCount >= 3) {
            particles.push({
                x: this.x + (Math.random() - 0.5) * BALL_RADIUS,
                y: this.y + (Math.random() - 0.5) * BALL_RADIUS,
                vx: (Math.random() - 0.5) * 2,
                vy: -this.vy * 0.15 + (Math.random() - 0.5) * 0.5,
                life: 0.8,
                color: '#ffd700'
            });
        }

        // Spring physics to restore normal scale (1.0)
        const springK = 0.16;
        const damping = 0.82;
        
        const forceX = (1.0 - this.scaleX) * springK;
        this.scaleXVelocity = this.scaleXVelocity * damping + forceX * deltaTime;
        this.scaleX += this.scaleXVelocity * deltaTime;
        
        const forceY = (1.0 - this.scaleY) * springK;
        this.scaleYVelocity = this.scaleYVelocity * damping + forceY * deltaTime;
        this.scaleY += this.scaleYVelocity * deltaTime;

        // Apply visual stretch based on velocity if not in active bounce transition
        if (Math.abs(this.scaleX - 1.0) < 0.15 && Math.abs(this.scaleY - 1.0) < 0.15) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 1.5) {
                const stretch = Math.min(0.35, speed * 0.03);
                this.scaleY = 1.0 + stretch;
                this.scaleX = 1.0 / this.scaleY;
            }
        }

        this.checkCollisions(deltaTime);
    }

    checkCollisions(deltaTime) {
        rings.forEach((ring, index) => {
            const dx = this.x - ring.x;
            const dy = this.y - ring.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Proximity Gated Collision check
            if (Math.abs(dy) < RING_RADIUS + 50) {
                const innerLimit = RING_RADIUS - BALL_RADIUS;

                // Hit outer boundaries of inner ring
                if (dist >= innerLimit) {
                    let angle = Math.atan2(dy, dx) - levelRotation;
                    angle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                    // Check gap clearance
                    let inGap = false;
                    ring.slices.forEach(s => {
                        if (s.type === 'gap' && angle >= s.start && angle <= s.end) {
                            inGap = true;
                        }
                    });

                    if (inGap) {
                        this.isExiting = true;
                    } else {
                        let hitHazard = false;
                        ring.slices.forEach(s => {
                            if (s.type === 'hazard' && angle >= s.start && angle <= s.end) {
                                hitHazard = true;
                            }
                        });

                        if (hitHazard) {
                            // If falling in super drop state, hazards are smashed!
                            if (comboCount >= 3) {
                                // Clear the hazard! Turn it into normal slice
                                const targetSlice = ring.slices.find(s => s.type === 'hazard' && angle >= s.start && angle <= s.end);
                                if (targetSlice) targetSlice.type = 'normal';
                                
                                triggerCameraShake(8, 0.22);
                                createParticles(this.x, this.y, COLORS.danger);
                                soundManager.play('bounce');
                            } else {
                                gameOver();
                                return;
                            }
                        }

                        // Bounce reflection inside coordinates
                        const nx = -dx / dist;
                        const ny = -dy / dist;
                        const dot = this.vx * nx + this.vy * ny;
                        
                        if (dot < 0) {
                            this.vx = (this.vx - 2 * dot * nx) * BOUNCE_DAMPING;
                            this.vy = (this.vy - 2 * dot * ny) * BOUNCE_DAMPING;
                            this.x = ring.x + nx * -innerLimit;
                            this.y = ring.y + ny * -innerLimit;
                            
                            // Bounce squash deformation
                            this.scaleY = 0.52;
                            this.scaleX = 1.38;
                            this.scaleXVelocity = 0;
                            this.scaleYVelocity = 0;
                            
                            // Reset combo count on normal bounce
                            comboCount = 0;

                            // Spawn paint splat and particles
                            createParticles(this.x, this.y, ring.color);
                            soundManager.play('bounce');

                            const localAngle = Math.atan2(this.y - ring.y, this.x - ring.x) - levelRotation;
                            ring.splats.push({
                                angle: localAngle,
                                size: Math.random() * 5 + 7,
                                alpha: 0.75,
                                color: ring.color
                            });
                            if (ring.splats.length > 15) {
                                ring.splats.shift();
                            }
                        }
                    }
                }
            }

            // Progression check
            if (this.isExiting && this.y > ring.y + RING_RADIUS) {
                if (index === level - 1) {
                    this.isExiting = false;
                    comboCount++; // Passed a ring! Increase combo
                    
                    // Increment score with combo multiplier
                    const points = 10 * comboCount;
                    score += points;
                    updateScore();
                    
                    // Play regular or super pass sound
                    if (comboCount >= 3) {
                        soundManager.play('superpass');
                        triggerCameraShake(5, 0.18);
                    } else {
                        soundManager.play('pass', comboCount);
                    }
                    
                    level++;
                    currentLevelEl.textContent = level;
                    nextLevelEl.textContent = level + 1;
                    if (rings.length < level + 5) {
                        addRing(rings.length);
                    }
                }
            }
        });

        // Update Camera
        const targetY = -this.y + canvas.height * 0.4;
        cameraY += (targetY - cameraY) * 0.1 * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, cameraY + this.y);
        
        // Rotate the drawing context along velocity direction for sleek stretch lines
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.15) {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);
        } else {
            ctx.rotate(Math.PI / 2);
        }
        
        ctx.scale(this.scaleX, this.scaleY);
        
        const isSuper = (comboCount >= 3);
        const glowColor = isSuper ? '#ffd700' : COLORS.primary;
        
        ctx.shadowBlur = isSuper ? 25 : 12;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = glowColor;
        
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Shiny core reflection highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-BALL_RADIUS * 0.25, -BALL_RADIUS * 0.25, BALL_RADIUS * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Ring {
    constructor(y, levelIdx) {
        this.x = canvas.width / 2;
        this.y = y;
        this.color = (levelIdx % 2 === 0) ? COLORS.primary : COLORS.secondary;
        this.slices = [];
        this.splats = [];
        this.generateSlices(levelIdx);
    }

    generateSlices(levelIdx) {
        const numSlices = 12;
        const sliceAngle = (Math.PI * 2) / numSlices;
        const gapIdx = Math.floor(Math.random() * numSlices);
        
        for (let i = 0; i < numSlices; i++) {
            const start = i * sliceAngle;
            const end = (i + 1) * sliceAngle;
            
            if (i === gapIdx) {
                this.slices.push({ start, end, type: 'gap' });
            } else {
                const isHazard = Math.random() < (0.1 + levelIdx * 0.02);
                this.slices.push({ start, end, type: isHazard ? 'hazard' : 'normal' });
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, cameraY + this.y);
        ctx.rotate(levelRotation);

        this.slices.forEach(s => {
            if (s.type === 'gap') return;

            ctx.beginPath();
            ctx.lineWidth = RING_THICKNESS;
            ctx.strokeStyle = (s.type === 'hazard') ? COLORS.danger : this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
            
            // Draw inner arc
            ctx.arc(0, 0, RING_RADIUS, s.start + 0.05, s.end - 0.05);
            ctx.stroke();
        });

        // Draw local neon paint splats sticking to the ring
        this.splats.forEach(sp => {
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.alpha;
            ctx.shadowBlur = 6;
            ctx.shadowColor = sp.color;

            const sx = Math.cos(sp.angle) * RING_RADIUS;
            const sy = Math.sin(sp.angle) * RING_RADIUS;

            // Main splat drop
            ctx.beginPath();
            ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
            ctx.fill();

            // Tiny splash dots
            for (let j = 0; j < 3; j++) {
                const dropAngle = sp.angle + (j - 1) * 0.15 + (Math.random() - 0.5) * 0.05;
                const dropDist = RING_RADIUS + (j - 1) * 7;
                const dsx = Math.cos(dropAngle) * dropDist;
                const dsy = Math.sin(dropAngle) * dropDist;
                ctx.beginPath();
                ctx.arc(dsx, dsy, sp.size * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

const ball = new Ball();

function addRing(i) {
    rings.push(new Ring(300 + i * 400, i));
}

function updateScore() {
    scoreEl.textContent = Math.floor(score);
    if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = Math.floor(bestScore);
        localStorage.setItem('helixBestScore', bestScore);
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    soundManager.play('crash');
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').textContent = Math.floor(score);
    document.getElementById('final-best').textContent = Math.floor(bestScore);
    updateHubBtn();
}

function restartGame() {
    score = 0;
    level = 1;
    cameraY = 0;
    rings = [];
    levelRotation = 0;
    rotationVelocity = 0;
    lastTimestamp = 0;
    
    for (let i = 0; i < 5; i++) addRing(i);
    
    ball.reset(canvas.width / 2, rings[0].y);
    
    updateScore();
    currentLevelEl.textContent = level;
    nextLevelEl.textContent = level + 1;
    
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    updateHubBtn();
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

function createParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color
        });
    }
}

// Social Sharing
function shareWA() {
    const roundedScore = Math.floor(score);
    const text = `I just scored ${roundedScore} in Neon Helix Drop! Can you beat me? 🌀 Play here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

function shareX() {
    const roundedScore = Math.floor(score);
    const text = `I just scored ${roundedScore} in Neon Helix Drop! Can you beat me? 🌀 #ArcadeHub #Gaming`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
}

// Input Events
function handleDown(e) {
    if (gameState === 'PLAYING') {
        ball.jump();
    }
    isDragging = true;
    lastMouseX = e.clientX || (e.touches && e.touches[0].clientX);
}

function handleMove(e) {
    if (!isDragging) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const deltaX = x - lastMouseX;
    rotationVelocity = deltaX * 0.005;
    lastMouseX = x;
}

function handleUp() { isDragging = false; }

window.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);
window.addEventListener('touchstart', handleDown, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleUp);

function updateHubBtn() {
    const hubBtn = document.getElementById('hub-btn');
    if (!hubBtn) return;
    if (gameState === 'START') {
        hubBtn.textContent = '🏠 HUB';
    } else {
        hubBtn.textContent = '← Back';
    }
}

document.getElementById('hub-btn').addEventListener('click', () => {
    soundManager.play('click');
    if (gameState === 'START') {
        window.location.href = '../index.html';
    } else {
        gameState = 'START';
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('how-to-play').classList.add('hidden');
        if (isPaused) togglePause();
        updateHubBtn();
    }
});

document.getElementById('btn-quit-gameover').addEventListener('click', () => {
    soundManager.play('click');
    gameState = 'START';
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
    updateHubBtn();
});

document.getElementById('btn-start').addEventListener('click', () => { soundManager.init(); restartGame(); });
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-sound').addEventListener('click', toggleSound);
document.getElementById('btn-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(true); });
document.getElementById('btn-close-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(false); });
document.getElementById('share-wa').addEventListener('click', shareWA);
document.getElementById('share-x').addEventListener('click', shareX);

function resize() {
    const container = document.getElementById('game-container');
    const hud = document.getElementById('hud');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - hud.clientHeight;
    // Update ring X positions
    rings.forEach(r => r.x = canvas.width / 2);
}

function loop(timestamp) {
    const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 3) : 1;
    lastTimestamp = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        if (!isPaused || gameState === 'GAMEOVER') {
            if (!isDragging) {
                if (keys['arrowleft'] || keys['a']) {
                    rotationVelocity = -0.06;
                } else if (keys['arrowright'] || keys['d']) {
                    rotationVelocity = 0.06;
                } else {
                    rotationVelocity *= Math.pow(ROTATION_MOMENTUM, deltaTime);
                }
            }
            levelRotation += rotationVelocity * deltaTime;
            ball.update(deltaTime);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx * deltaTime; 
                p.y += p.vy * deltaTime; 
                p.life -= 0.02 * deltaTime;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }

        ctx.save();
        if (shakeTimeRemaining > 0) {
            const dx = (Math.random() - 0.5) * shakeIntensity;
            const dy = (Math.random() - 0.5) * shakeIntensity;
            ctx.translate(dx, dy);
            shakeTimeRemaining -= deltaTime * 0.01667;
        }

        // Draw background speed lines behind the rings when comboCount >= 3
        if (comboCount >= 3) {
            ctx.save();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            speedLines.forEach(line => {
                const lx = line.x * canvas.width;
                line.y -= line.speed * deltaTime * 0.05; // falling fast down, so lines move up
                if (line.y < -0.2) {
                    line.y = 1.2;
                    line.x = Math.random();
                }
                const ly = line.y * canvas.height;
                ctx.globalAlpha = line.opacity;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx, ly + line.length);
                ctx.stroke();
            });
            ctx.restore();
        }

        rings.forEach(r => r.draw());
        
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, cameraY + p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        
        ball.draw();

        ctx.restore();

        // Update progress bar based on level index
        const progress = Math.min(100, ((level - 1) % 10) * 10);
        progressFill.style.width = progress + '%';
    }
    
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
bestScoreEl.textContent = Math.floor(bestScore);
updateHubBtn();
loop(performance.now());
