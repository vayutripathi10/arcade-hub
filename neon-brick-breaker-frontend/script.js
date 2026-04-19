const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiScore = document.getElementById('ui-score');
const uiLives = document.getElementById('ui-lives');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');
const endTitle = document.getElementById('end-title');
const endScore = document.getElementById('end-score');
const btnPause = document.getElementById('btn-pause');
const btnMute = document.getElementById('btn-mute');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');

// Game Settings
let gameState = 'title'; // title, playing, paused, gameover, won
let score = 0;
let lives = 3;
let level = 1;
let lastTime = 0;

// Entities
let paddle;
let balls = [];
let bricks = [];
let powerUps = [];
let particles = [];

const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00de',
    accent: '#bc00ff',
    success: '#00ff88',
    warning: '#ffcc00',
    danger: '#ff3333'
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 3 + 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 30;
        this.type = type; // 'wide', 'fire', 'multi'
        this.speed = 3;
        this.color = type === 'wide' ? COLORS.primary : type === 'fire' ? COLORS.secondary : COLORS.success;
        this.icon = type === 'wide' ? '↔️' : type === 'fire' ? '🔥' : '💠';
    }
    update() {
        this.y += this.speed;
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        ctx.restore();
    }
}

class Brick {
    constructor(x, y, w, h, color, life = 1) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.life = life;
        this.destroyed = false;
    }
    draw() {
        if (this.destroyed) return;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(this.x + 4, this.y + 4, this.w - 8, this.h - 8);
        ctx.restore();
    }
}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.speed = 6;
        this.dx = (Math.random() - 0.5) * 6;
        this.dy = -6;
        this.fireball = false;
        this.color = '#fff';
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Wall collisions
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.dx *= -1;
            if (window.audioFX) window.audioFX.playHit();
        }
        if (this.y - this.radius < 0) {
            this.dy *= -1;
            if (window.audioFX) window.audioFX.playHit();
        }
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = this.fireball ? 20 : 10;
        ctx.shadowColor = this.fireball ? COLORS.secondary : COLORS.primary;
        ctx.fillStyle = this.fireball ? COLORS.secondary : '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Paddle {
    constructor() {
        this.w = 100;
        this.h = 12;
        this.x = (canvas.width - this.w) / 2;
        this.y = canvas.height - 40;
        this.targetX = this.x;
        this.color = COLORS.primary;
        this.wideTimer = 0;
    }
    update() {
        // Smooth target following
        this.x += (this.targetX - (this.x + this.w / 2)) * 0.2;
        
        // Bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        if (this.wideTimer > 0) {
            this.wideTimer--;
            if (this.wideTimer === 0) this.w = 100;
        }
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Neon Rounded Rect
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(this.x + r, this.y);
        ctx.lineTo(this.x + this.w - r, this.y);
        ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
        ctx.lineTo(this.x + this.w, this.y + this.h - r);
        ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
        ctx.lineTo(this.x + r, this.y + this.h);
        ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
        ctx.lineTo(this.x, this.y + r);
        ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
        ctx.fill();
        
        // Inner Glow
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

function initLevel(lvl) {
    bricks = [];
    const rows = 3 + lvl;
    const cols = Math.floor(canvas.width / 60);
    const brickW = canvas.width / cols;
    const brickH = 25;
    
    const palette = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Random patterns for variety
            if (lvl > 1 && Math.random() < 0.2) continue;
            
            const color = palette[r % palette.length];
            bricks.push(new Brick(c * brickW, r * brickH + 60, brickW, brickH, color));
        }
    }
}

function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    balls = [new Ball(canvas.width / 2, canvas.height - 60)];
    paddle = new Paddle();
    powerUps = [];
    particles = [];
    initLevel(level);
    
    gameState = 'playing';
    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    if (window.audioFX) window.audioFX.init();
}

function updateHUD() {
    uiScore.textContent = score;
    uiLives.textContent = lives;
    
    // Manage header controls visibility
    if (gameState === 'playing' || gameState === 'paused') {
        btnPause.classList.remove('hidden');
    } else {
        btnPause.classList.add('hidden');
    }
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function handleInput(x) {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    paddle.targetX = (x - rect.left) * scaleX;
}

canvas.addEventListener('mousemove', e => handleInput(e.clientX));
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
}, { passive: false });

function update(dt) {
    if (gameState !== 'playing') return;

    paddle.update();

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.update();

        // Paddle Collision
        if (ball.y + ball.radius > paddle.y && 
            ball.y - ball.radius < paddle.y + paddle.h &&
            ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
            
            ball.dy *= -1;
            ball.y = paddle.y - ball.radius;
            
            // Deflection angle based on where it hit the paddle
            const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            ball.dx = hitPos * 7;
            
            if (window.audioFX) window.audioFX.playPaddle();
        }

        // Brick Collision
        for (const brick of bricks) {
            if (brick.destroyed) continue;
            
            if (ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brick.w &&
                ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brick.h) {
                
                if (!ball.fireball) {
                    // Detect collision side
                    const overlapX = Math.min(ball.x + ball.radius - brick.x, brick.x + brick.w - (ball.x - ball.radius));
                    const overlapY = Math.min(ball.y + ball.radius - brick.y, brick.y + brick.h - (ball.y - ball.radius));

                    if (overlapX < overlapY) ball.dx *= -1;
                    else ball.dy *= -1;
                }

                brick.destroyed = true;
                score += 10;
                spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
                if (window.audioFX) window.audioFX.playHit();

                // Drop PowerUp
                if (Math.random() < 0.15) {
                    const types = ['wide', 'fire', 'multi'];
                    powerUps.push(new PowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2, types[Math.floor(Math.random() * types.length)]));
                }
                
                updateHUD();
                break;
            }
        }

        // Drop out
        if (ball.y > canvas.height) {
            balls.splice(i, 1);
        }
    }

    // PowerUp Updates
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        pu.update();
        
        // Catch
        if (pu.y + 15 > paddle.y && pu.y - 15 < paddle.y + paddle.h &&
            pu.x + 15 > paddle.x && pu.x - 15 < paddle.x + paddle.w) {
            
            if (window.audioFX) window.audioFX.playPowerUp();
            
            if (pu.type === 'wide') {
                paddle.w = 180;
                paddle.wideTimer = 600; // ~10 seconds
            } else if (pu.type === 'fire') {
                balls.forEach(b => {
                    b.fireball = true;
                    setTimeout(() => b.fireball = false, 8000);
                });
            } else if (pu.type === 'multi') {
                const b = balls[0] || { x: paddle.x + paddle.w / 2, y: paddle.y - 20 };
                balls.push(new Ball(b.x, b.y), new Ball(b.x, b.y));
            }
            powerUps.splice(i, 1);
        } else if (pu.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }

    // Death
    if (balls.length === 0) {
        lives--;
        updateHUD();
        if (lives <= 0) {
            endGame('gameover');
        } else {
            balls.push(new Ball(canvas.width / 2, canvas.height - 60));
        }
    }

    // Level Clear
    if (bricks.every(b => b.destroyed)) {
        level++;
        if (level > 10) {
            endGame('won');
        } else {
            initLevel(level);
            balls.forEach(b => b.y = canvas.height - 100);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
    }
}

function toggleMute() {
    if (window.audioFX) {
        window.audioFX.toggleMute();
    }
}

function endGame(state) {
    gameState = state;
    gameOverMenu.classList.remove('hidden');
    endTitle.textContent = state === 'won' ? 'LEVELS CLEAR!' : 'GAME OVER';
    endTitle.style.color = state === 'won' ? COLORS.success : COLORS.danger;
    endScore.textContent = score;
    if (window.audioFX) window.audioFX.playGameOver();
    
    // Achievements
    if (score >= 1000 && window.achievements) window.achievements.unlock('brickbreaker', 'score_1000', 'Neon Star');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (paddle) paddle.draw();
    if (bricks.length > 0) bricks.forEach(b => b.draw());
    if (balls.length > 0) balls.forEach(b => b.draw());
    if (powerUps.length > 0) powerUps.forEach(p => p.draw());
    if (particles.length > 0) particles.forEach(p => p.draw());
}

function loop(t) {
    if (!lastTime) {
        lastTime = t;
        requestAnimationFrame(loop);
        return;
    }
    const dt = t - lastTime;
    lastTime = t;
    
    if (gameState === 'playing') {
        update(dt);
    }
    draw();
    requestAnimationFrame(loop);
}

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (paddle) {
        paddle.y = canvas.height - 40;
    }
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);

// Button Listeners
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-how').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
document.getElementById('btn-close-how').addEventListener('click', () => howToPlayModal.classList.add('hidden'));

btnPause.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
});

btnResume.addEventListener('click', togglePause);

btnMute.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
});

btnQuit.addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'title';
    updateHUD();
});

document.getElementById('btn-home').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'title';
    updateHUD();
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') togglePause();
    if (e.key.toLowerCase() === 'm') toggleMute();
    if (e.key === 'Escape' && gameState === 'playing') togglePause();
});
