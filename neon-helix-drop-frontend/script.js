// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const TOWER_RADIUS = 60;
const PLATFORM_GAP = 180;
const BALL_RADIUS = 8;
const GRAVITY = 0.35;
const BOUNCE_FORCE = -8;
const ROTATION_SPEED = 0.005;
const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00ea',
    danger: '#ff3c00',
    bg: '#050505',
    tower: '#1a1a1a'
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
let towerRotation = 0;
let rotationVelocity = 0;
let towerY = 0; // Camera scroll
let platforms = [];
let particles = [];
let feverMode = 0; // Invincibility progress

// Input Handling
let isDragging = false;
let lastMouseX = 0;

class Ball {
    constructor() {
        this.reset();
    }

    reset() {
        this.y = 100;
        this.vy = 0;
        this.prevY = 100;
        this.isInvincible = false;
    }

    update() {
        if (gameState !== 'PLAYING') return;

        this.prevY = this.y;
        this.vy += GRAVITY;
        this.y += this.vy;

        // Fever mode update
        if (feverMode >= 3) {
            this.isInvincible = true;
            this.vy = 15; // Fast drop
        } else {
            this.isInvincible = false;
        }

        // Check collisions
        this.checkCollisions();

        // Update Camera
        const targetTowerY = -this.y + 250;
        towerY += (targetTowerY - towerY) * 0.1;
    }

    checkCollisions() {
        platforms.forEach(p => {
            // Ball just passed the platform plane
            if (this.prevY < p.y && this.y >= p.y) {
                // Calculate which slice the ball is over
                // The ball is at screen angle 0 relative to the tower center
                // Since the tower is rotated by towerRotation, the ball is at angle -towerRotation relative to the tower
                let normalizedRotation = towerRotation % (Math.PI * 2);
                if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
                
                // Angle of the ball relative to the platform's local coordinates
                let angleOfBall = (Math.PI * 2 - normalizedRotation) % (Math.PI * 2);
                
                let hitPlatform = false;
                let hitHazard = false;

                p.slices.forEach(s => {
                    if (angleOfBall >= s.start && angleOfBall <= s.end) {
                        if (s.type === 'hazard') hitHazard = true;
                        hitPlatform = true;
                    }
                });

                if (hitPlatform) {
                    if (hitHazard && !this.isInvincible) {
                        gameOver();
                    } else {
                        this.y = p.y;
                        this.vy = BOUNCE_FORCE;
                        feverMode = 0;
                        createParticles(this.y, p.color);
                    }
                } else {
                    // Passed through gap
                    score += 10;
                    feverMode += 0.5;
                    updateScore();
                    
                    // Check level progress
                    if (p.isEnd) {
                        nextLevel();
                    }
                }
            }
        });
    }

    draw() {
        ctx.save();
        // Offset the ball to sit on the ring radius (TOWER_RADIUS + 20)
        ctx.translate(canvas.width / 2 + TOWER_RADIUS + 20, towerY + this.y);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isInvincible ? COLORS.secondary : COLORS.primary;
        
        ctx.fillStyle = this.isInvincible ? COLORS.secondary : COLORS.primary;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Platform {
    constructor(y, levelNum, isEnd = false) {
        this.y = y;
        this.isEnd = isEnd;
        this.slices = [];
        this.color = isEnd ? COLORS.secondary : COLORS.primary;
        
        if (isEnd) {
            this.slices.push({ start: 0, end: Math.PI * 2, type: 'normal' });
        } else {
            const gapSize = Math.max(0.5, 1.2 - levelNum * 0.05);
            const numSlices = 8;
            const sliceAngle = (Math.PI * 2) / numSlices;
            
            // Randomly pick a gap
            const gapIndex = Math.floor(Math.random() * numSlices);
            
            for (let i = 0; i < numSlices; i++) {
                if (i === gapIndex) continue;
                
                const type = (Math.random() < 0.15 + levelNum * 0.02) ? 'hazard' : 'normal';
                this.slices.push({
                    start: i * sliceAngle,
                    end: (i + 1) * sliceAngle,
                    type: type
                });
            }
        }
    }

    draw() {
        const screenY = towerY + this.y;
        if (screenY < -100 || screenY > canvas.height + 100) return;

        ctx.save();
        ctx.translate(canvas.width / 2, screenY);
        ctx.rotate(towerRotation);

        this.slices.forEach(s => {
            ctx.beginPath();
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';
            ctx.strokeStyle = s.type === 'hazard' ? COLORS.danger : this.color;
            
            // Neon Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
            
            ctx.arc(0, 0, TOWER_RADIUS + 20, s.start + 0.1, s.end - 0.1);
            ctx.stroke();
        });

        ctx.restore();
    }
}

const ball = new Ball();

function generateLevel() {
    platforms = [];
    const numPlatforms = 10 + level * 2;
    for (let i = 0; i < numPlatforms; i++) {
        platforms.push(new Platform(300 + i * PLATFORM_GAP, level, i === numPlatforms - 1));
    }
    currentLevelEl.textContent = level;
    nextLevelEl.textContent = level + 1;
}

function updateScore() {
    scoreEl.textContent = Math.floor(score);
    if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = Math.floor(bestScore);
        localStorage.setItem('helixBestScore', bestScore);
    }
}

function nextLevel() {
    level++;
    score += 100;
    ball.reset();
    generateLevel();
    updateScore();
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
    towerY = 0;
    isPaused = false;
    document.getElementById('btn-pause').textContent = '⏸';
    ball.reset();
    generateLevel();
    updateScore();
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

function createParticles(y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: canvas.width / 2 + TOWER_RADIUS + 20 + (Math.random() - 0.5) * 20,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: color
        });
    }
}

function updateParticles() {
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, towerY + p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function drawTower() {
    ctx.fillStyle = COLORS.tower;
    ctx.fillRect(canvas.width / 2 - TOWER_RADIUS, 0, TOWER_RADIUS * 2, canvas.height);
    
    // Tower highlights for rotation feel
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        const x = canvas.width / 2 - TOWER_RADIUS + (i * TOWER_RADIUS * 0.5) + (towerRotation * 20) % (TOWER_RADIUS * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function resize() {
    const container = document.getElementById('game-container');
    const hud = document.getElementById('hud');
    const adPlaceholder = document.querySelector('.ad-footer-placeholder');
    
    const availableHeight = container.clientHeight - hud.clientHeight - adPlaceholder.clientHeight;
    
    // Maintain aspect ratio or fill width
    canvas.width = container.clientWidth;
    canvas.height = availableHeight;
}

// Input Events
function handleDown(e) {
    isDragging = true;
    lastMouseX = e.clientX || e.touches[0].clientX;
}

function handleMove(e) {
    if (!isDragging) return;
    const x = e.clientX || e.touches[0].clientX;
    const deltaX = x - lastMouseX;
    rotationVelocity = deltaX * 0.01;
    lastMouseX = x;
}

function handleUp() {
    isDragging = false;
}

function togglePause() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶️' : '⏸';
}

window.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);
window.addEventListener('touchstart', handleDown);
window.addEventListener('touchmove', handleMove);
window.addEventListener('touchend', handleUp);

document.getElementById('btn-start').addEventListener('click', restartGame);
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-help').addEventListener('click', () => toggleHelp(true));
document.getElementById('btn-close-help').addEventListener('click', () => toggleHelp(false));

function toggleHelp(show) {
    const helpOverlay = document.getElementById('how-to-play');
    if (show) {
        helpOverlay.classList.remove('hidden');
        if (gameState === 'PLAYING' && !isPaused) {
            togglePause();
        }
    } else {
        helpOverlay.classList.add('hidden');
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        if (!isPaused || gameState === 'GAMEOVER') {
            // Momentum
            if (!isDragging) {
                rotationVelocity *= 0.95;
            }
            towerRotation += rotationVelocity;

            ball.update();
            updateParticles();
        }

        drawTower();
        platforms.forEach(p => p.draw());
        drawParticles();
        ball.draw();

        // Update progress bar
        const startY = 300;
        const endY = platforms[platforms.length - 1].y;
        const progress = Math.min(100, Math.max(0, ((ball.y - startY) / (endY - startY)) * 100));
        progressFill.style.width = progress + '%';
    }
    
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
generateLevel();
bestScoreEl.textContent = Math.floor(bestScore);
loop();
