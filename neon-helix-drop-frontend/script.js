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

    play(type) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch(type) {
            case 'bounce':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'pass':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'crash':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'click':
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
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

// Input Handling
let isDragging = false;
let lastMouseX = 0;
let levelRotation = 0;
let lastTimestamp = 0;

class Ball {
    constructor() {
        this.reset(0, 0);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isExiting = false;
    }

    jump() {
        if (gameState !== 'PLAYING' || isPaused) return;
        // Apply upward impulse
        this.vy = -7;
        soundManager.play('click');
    }

    update(deltaTime) {
        if (gameState !== 'PLAYING' || isPaused) return;

        // Apply Gravity
        this.vy += GRAVITY * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Friction / Air resistance
        this.vx *= Math.pow(0.99, deltaTime);

        this.checkCollisions(deltaTime);
    }

    checkCollisions(deltaTime) {
        // Find the ring the ball is currently inside or near
        rings.forEach((ring, index) => {
            const dx = this.x - ring.x;
            const dy = this.y - ring.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 1. Collision / Bounce Logic (Proximity Gated)
            if (Math.abs(dy) < RING_RADIUS + 50) {
                const innerLimit = RING_RADIUS - BALL_RADIUS;

                // If the ball hits the inner wall
                if (dist >= innerLimit) {
                    // Calculate angle of the ball relative to ring center
                    let angle = Math.atan2(dy, dx) - levelRotation;
                    angle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                    // Check if we are in the gap
                    let inGap = false;
                    ring.slices.forEach(s => {
                        if (s.type === 'gap' && angle >= s.start && angle <= s.end) {
                            inGap = true;
                        }
                    });

                    if (inGap) {
                        this.isExiting = true;
                    } else {
                        // We hit a wall or hazard
                        let hitHazard = false;
                        ring.slices.forEach(s => {
                            if (s.type === 'hazard' && angle >= s.start && angle <= s.end) {
                                hitHazard = true;
                            }
                        });

                        if (hitHazard) {
                            gameOver();
                            return;
                        }

                        // Reflection (Bounce Inside)
                        const nx = -dx / dist;
                        const ny = -dy / dist;
                        const dot = this.vx * nx + this.vy * ny;
                        
                        if (dot < 0) {
                            this.vx = (this.vx - 2 * dot * nx) * BOUNCE_DAMPING;
                            this.vy = (this.vy - 2 * dot * ny) * BOUNCE_DAMPING;
                            this.x = ring.x + nx * -innerLimit;
                            this.y = ring.y + ny * -innerLimit;
                            createParticles(this.x, this.y, ring.color);
                            soundManager.play('bounce');
                        }
                    }
                }
            }

            // 2. Progression Logic (Always checked once we start exiting)
            if (this.isExiting && this.y > ring.y + RING_RADIUS) {
                // If this is the current ring we are supposed to clear
                if (index === level - 1) {
                    this.isExiting = false;
                    score += 10;
                    updateScore();
                    soundManager.play('pass');
                    level++;
                    currentLevelEl.textContent = level;
                    nextLevelEl.textContent = level + 1;
                    if (rings.length < level + 5) {
                        addRing(rings.length);
                    }
                }
            }
        });

        // Update Camera to follow ball
        const targetY = -this.y + canvas.height * 0.4;
        cameraY += (targetY - cameraY) * 0.1 * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, cameraY + this.y);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
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
            if (!isDragging) rotationVelocity *= Math.pow(ROTATION_MOMENTUM, deltaTime);
            levelRotation += rotationVelocity * deltaTime;
            ball.update(deltaTime);
            
            particles.forEach((p, i) => {
                p.x += p.vx * deltaTime; 
                p.y += p.vy * deltaTime; 
                p.life -= 0.02 * deltaTime;
                if (p.life <= 0) particles.splice(i, 1);
            });
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

        // Update progress bar based on level index
        const progress = Math.min(100, ((level - 1) % 10) * 10);
        progressFill.style.width = progress + '%';
    }
    
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
bestScoreEl.textContent = Math.floor(bestScore);
loop();
