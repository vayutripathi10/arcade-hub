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
let score = 0;
let bestScore = localStorage.getItem('helixBestScore') || 0;
let level = 1;
let cameraY = 0;
let rings = [];
let particles = [];

// Input Handling
let isDragging = false;
let lastMouseX = 0;
let rotationVelocity = 0;
let levelRotation = 0;

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

    update() {
        if (gameState !== 'PLAYING' || isPaused) return;

        // Apply Gravity
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Friction / Air resistance
        this.vx *= 0.99;

        this.checkCollisions();
    }

    checkCollisions() {
        // Find the ring the ball is currently inside or near
        rings.forEach((ring, index) => {
            const dx = this.x - ring.x;
            const dy = this.y - ring.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
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
                    // Ball is passing through the gap
                    if (!this.isExiting) {
                        // We are falling to the next level
                        this.isExiting = true;
                        // Score for passing through
                    }
                } else {
                    // We hit a wall or hazard
                    // Check for hazard
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

                    // Perform Reflection (Bounce Inside)
                    // Normal points toward center: n = (-dx/dist, -dy/dist)
                    const nx = -dx / dist;
                    const ny = -dy / dist;

                    // Reflect velocity: v' = v - 2(v . n)n
                    const dot = this.vx * nx + this.vy * ny;
                    
                    // Only reflect if moving toward the wall
                    if (dot < 0) {
                        this.vx = (this.vx - 2 * dot * nx) * BOUNCE_DAMPING;
                        this.vy = (this.vy - 2 * dot * ny) * BOUNCE_DAMPING;

                        // Reposition ball inside boundary
                        this.x = ring.x + nx * -innerLimit;
                        this.y = ring.y + ny * -innerLimit;

                        createParticles(this.x, this.y, ring.color);
                    }
                }
            }

            // Check if passed completely through to next level
            if (this.isExiting && dist > RING_RADIUS + 50) {
                this.isExiting = false;
                score += 10;
                updateScore();
                
                // If we passed the current target level, increment
                if (index === level - 1) {
                    level++;
                    currentLevelEl.textContent = level;
                    nextLevelEl.textContent = level + 1;
                    // Add more rings if needed
                    if (rings.length < level + 5) {
                        addRing(rings.length);
                    }
                }
            }
        });

        // Update Camera to follow ball
        const targetY = -this.y + canvas.height * 0.4;
        cameraY += (targetY - cameraY) * 0.1;
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
    const text = `I just scored ${score} in Neon Helix Drop! Can you beat me? 🌀 Play here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareX() {
    const text = `I just scored ${score} in Neon Helix Drop! Can you beat me? 🌀 #ArcadeHub #Gaming`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
}

// Input Events
function handleDown(e) {
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

document.getElementById('btn-start').addEventListener('click', restartGame);
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-help').addEventListener('click', () => toggleHelp(true));
document.getElementById('btn-close-help').addEventListener('click', () => toggleHelp(false));
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

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        if (!isPaused || gameState === 'GAMEOVER') {
            if (!isDragging) rotationVelocity *= ROTATION_MOMENTUM;
            levelRotation += rotationVelocity;
            ball.update();
            
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
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
