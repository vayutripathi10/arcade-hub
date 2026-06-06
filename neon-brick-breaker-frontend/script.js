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
let gameState = 'title'; // title, playing, paused, gameover, won, transition
let score = 0;
let highScore = parseInt(localStorage.getItem('brickBreakerBest') || '0');
let lives = 3;
let level = 1;
let lastTime = 0;
let comboStreak = 0;
let comboTimer = 0;
let comboMultiplier = 1;

// Entities
let paddle;
let balls = [];
let bricks = [];
let powerUps = [];
let particles = [];

// Premium Juice additions
let gridRipples = [];
let stars = [];
let scorePopups = [];
let shakeIntensity = 0;
let shakeDuration = 0;
let timeDilation = 1.0;
let slowMoClearPending = false;
let screenFlashAlpha = 0.0;

const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00de',
    accent: '#bc00ff',
    success: '#00ff88',
    warning: '#ffcc00',
    danger: '#ff3333',
    triple: '#ffaa00',
    ghost: 'rgba(255, 255, 255, 0.4)'
};

const STAGE_CONFIG = {
    1:  { speed: 5, paddleW: 120, rows: 4, puFreq: 0.3,  desc: "Tutorial: Frequent Power-ups!" },
    2:  { speed: 5, paddleW: 120, rows: 4, puFreq: 0.3,  desc: "Keep it up!" },
    3:  { speed: 5.7, paddleW: 100, rows: 5, puFreq: 0.15, desc: "Double-Hit Bricks added!", hasDouble: true },
    4:  { speed: 5.7, paddleW: 100, rows: 5, puFreq: 0.15, desc: "Watch out for speed increase!", hasDouble: true },
    5:  { speed: 6.5, paddleW: 85,  rows: 6, puFreq: 0.1,  desc: "Moving Bricks & Triple-Hits!", hasTriple: true, hasMoving: true },
    6:  { speed: 6.5, paddleW: 85,  rows: 6, puFreq: 0.1,  desc: "Things are getting serious!", hasTriple: true, hasMoving: true },
    7:  { speed: 7.5, paddleW: 70,  rows: 7, puFreq: 0.08, desc: "Shield & Ghost Bricks!", hasShield: true, hasGhost: true },
    8:  { speed: 7.5, paddleW: 70,  rows: 7, puFreq: 0.08, desc: "Precision is key now!", hasShield: true, hasGhost: true },
    9:  { speed: 8.5, paddleW: 60,  rows: 8, puFreq: 0.06, desc: "Bombs & Teleports!", hasBomb: true, hasTeleport: true },
    10: { speed: 9.0, paddleW: 60,  rows: 8, puFreq: 0.06, desc: "Nightmare Mode!", hasAll: true }
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
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= 0.02 * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class ScorePopup {
    constructor(x, y, text, color = '#fff') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -1.5;
    }
    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.life -= 0.035 * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 15px var(--font-ui)';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 30;
        this.type = type; // expand, shrink, speedup, slowdown, multi, shield, bomb, life
        this.speed = 3;
        
        const config = {
            expand:   { color: '#00f3ff', icon: '🔵' },
            shrink:   { color: '#ff3333', icon: '🔴' },
            speedup:  { color: '#ffcc00', icon: '⚡' },
            slowdown: { color: '#00ff88', icon: '🐢' },
            multi:    { color: '#ffffff', icon: '🎱' },
            shield:   { color: '#00ffff', icon: '🛡️' },
            bomb:     { color: '#ff5500', icon: '🔥' },
            life:     { color: '#ff00de', icon: '❤️' }
        };
        this.color = config[type].color;
        this.icon = config[type].icon;
    }
    update(deltaTime) {
        this.y += this.speed * deltaTime;
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
    constructor(x, y, w, h, color, life = 1, type = 'normal') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.w = w;
        this.h = h;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.type = type; // normal, moving, shield, ghost, bomb, teleport
        this.destroyed = false;
        this.moveOffset = Math.random() * Math.PI * 2;
        this.ghostTimer = Math.random() * 100;
    }
    update(deltaTime) {
        if (this.destroyed) return;
        if (this.type === 'moving') {
            this.x = this.startX + Math.sin(Date.now() / 1000 + this.moveOffset) * 50;
        }
        if (this.type === 'ghost') {
            this.ghostTimer += deltaTime;
        }
    }
    draw() {
        if (this.destroyed) return;
        if (this.type === 'ghost' && Math.sin(this.ghostTimer * 0.05) < 0) return;
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        
        if (this.type === 'shield') {
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 4;
        }
        
        ctx.strokeRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2 * (this.life / this.maxLife);
        ctx.fillRect(this.x + 4, this.y + 4, this.w - 8, this.h - 8);
        
        if (this.life > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px var(--font-ui)';
            ctx.textAlign = 'center';
            ctx.fillText(this.life, this.x + this.w/2, this.y + this.h/2 + 5);
        }
        ctx.restore();
    }
}

class Ball {
    constructor(x, y, speed = 6) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.speed = speed;
        this.baseSpeed = speed;
        this.dx = (Math.random() - 0.5) * speed;
        this.dy = -speed;
        this.fireball = false;
        this.color = '#fff';
        this.tempMulti = 1;
        this.trail = [];
    }
    update(deltaTime) {
        const s = this.speed * this.tempMulti;
        const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx = (this.dx / mag) * s;
        this.dy = (this.dy / mag) * s;

        // Save trail position
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Wall collisions
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx *= -1;
            if (window.audioFX) window.audioFX.playHit();
            addGridRipple(this.x, this.y, 8, 120);
            triggerScreenshake(2, 60);
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx *= -1;
            if (window.audioFX) window.audioFX.playHit();
            addGridRipple(this.x, this.y, 8, 120);
            triggerScreenshake(2, 60);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy *= -1;
            if (window.audioFX) window.audioFX.playHit();
            addGridRipple(this.x, this.y, 8, 120);
            triggerScreenshake(2, 60);
        }

        // Spawn custom fireball flame particles
        if (this.fireball && Math.random() < 0.4) {
            particles.push(new Particle(this.x, this.y, COLORS.secondary));
        }
    }
    draw() {
        ctx.save();
        
        // Draw trailing ghost balls
        const colorBase = this.fireball ? COLORS.secondary : COLORS.primary;
        this.trail.forEach((t, index) => {
            const ratio = (index + 1) / this.trail.length; // 0 to 1
            ctx.save();
            ctx.globalAlpha = ratio * 0.25;
            ctx.shadowBlur = 5;
            ctx.shadowColor = colorBase;
            ctx.fillStyle = colorBase;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * (0.4 + ratio * 0.6), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw main ball
        ctx.shadowBlur = this.fireball ? 20 : 12;
        ctx.shadowColor = this.fireball ? COLORS.secondary : COLORS.primary;
        ctx.fillStyle = this.fireball ? COLORS.secondary : '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Paddle {
    constructor(w = 100) {
        this.w = w;
        this.baseW = w;
        this.h = 12;
        this.x = (canvas.width - this.w) / 2;
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.y = canvas.height - (isMobile ? 70 : 40);
        this.targetX = this.x;
        this.color = COLORS.primary;
        this.timer = 0;
        this.hasShield = false;
        
        // Squash & stretch spring animation values
        this.squashY = 1.0;
        this.stretchX = 1.0;
        this.squashYVelocity = 0;
        this.stretchXVelocity = 0;
    }
    update(deltaTime) {
        this.x += (this.targetX - (this.x + this.w / 2)) * 0.2 * deltaTime;
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        if (this.timer > 0) {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.timer = 0;
                this.w = this.baseW;
                balls.forEach(b => {
                    b.tempMulti = 1;
                    b.fireball = false;
                });
            }
        }

        // Squash & Stretch Spring Simulation
        const springK = 0.15;
        const damping = 0.8;
        const targetSquashY = 1.0;
        const targetStretchX = 1.0;
        
        const diffY = targetSquashY - this.squashY;
        const diffX = targetStretchX - this.stretchX;
        
        this.squashYVelocity = this.squashYVelocity * damping + diffY * springK;
        this.squashY += this.squashYVelocity * deltaTime;
        
        this.stretchXVelocity = this.stretchXVelocity * damping + diffX * springK;
        this.stretchX += this.stretchXVelocity * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Center of the paddle
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        
        // Apply Squash & Stretch Transform
        ctx.translate(centerX, centerY);
        ctx.scale(this.stretchX, this.squashY);
        ctx.translate(-centerX, -centerY);
        
        const r = 6;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, r);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        if (this.hasShield) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.primary;
            ctx.strokeStyle = COLORS.primary;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(0, canvas.height - 5, canvas.width, 5);
            ctx.restore();
        }
    }
}

function initStars() {
    stars = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speed: 0.01 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function drawStars() {
    ctx.save();
    stars.forEach(s => {
        const alpha = 0.15 + Math.abs(Math.sin(Date.now() * s.speed + s.phase)) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.restore();
}

function addGridRipple(x, y, intensity = 12, maxRadius = 160) {
    gridRipples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: maxRadius,
        speed: 8,
        intensity: intensity
    });
}

function getGridRippleOffset(px, py) {
    let offsetX = 0;
    let offsetY = 0;
    gridRipples.forEach(rip => {
        const dx = px - rip.x;
        const dy = py - rip.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < rip.radius) {
            const cycle = dist / rip.radius; // 0 to 1
            const force = Math.sin(cycle * Math.PI) * rip.intensity * (1.0 - rip.radius / rip.maxRadius);
            offsetX += (dx / dist) * force;
            offsetY += (dy / dist) * force;
        }
    });
    return { x: offsetX, y: offsetY };
}

function drawBackground() {
    // 1. Draw radial gradient background
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 10, canvas.width / 2, canvas.height / 2, canvas.height);
    grad.addColorStop(0, '#11121d');
    grad.addColorStop(1, '#05060a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw stars
    drawStars();

    // 3. Draw 3D Perspective Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;

    const horizonY = 80;
    const centerPointX = canvas.width / 2;

    // A. Perspective line dividers projected from vanishing point to bottom
    const numLines = 14;
    for (let i = 0; i <= numLines; i++) {
        const xBottom = (canvas.width / numLines) * i;
        ctx.beginPath();
        
        // Draw segment by segment to apply ripple displacements
        const segments = 16;
        for (let j = 0; j <= segments; j++) {
            const ratio = j / segments;
            const py = horizonY + (canvas.height - horizonY) * ratio;
            // Linear interpolation of X
            const px = centerPointX + (xBottom - centerPointX) * ratio;
            
            const offset = getGridRippleOffset(px, py);
            if (j === 0) {
                ctx.moveTo(px + offset.x, py + offset.y);
            } else {
                ctx.lineTo(px + offset.x, py + offset.y);
            }
        }
        ctx.stroke();
    }

    // B. Exponentially spaced horizontal lines
    const numHorizontal = 16;
    for (let i = 0; i < numHorizontal; i++) {
        // exponential spacing
        const ratio = Math.pow(i / (numHorizontal - 1), 1.6);
        const py = horizonY + (canvas.height - horizonY) * ratio;
        ctx.beginPath();
        
        const segments = 20;
        for (let j = 0; j <= segments; j++) {
            const px = (canvas.width / segments) * j;
            const offset = getGridRippleOffset(px, py);
            if (j === 0) {
                ctx.moveTo(px + offset.x, py + offset.y);
            } else {
                ctx.lineTo(px + offset.x, py + offset.y);
            }
        }
        ctx.stroke();
    }

    ctx.restore();
}

function triggerScreenshake(intensity, duration) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeDuration = Math.max(shakeDuration, duration);
}

function initLevel(lvl) {
    bricks = [];
    const config = STAGE_CONFIG[lvl] || STAGE_CONFIG[10];
    const rows = config.rows;
    const cols = Math.floor(canvas.width / 60);
    const brickW = canvas.width / cols;
    const brickH = 25;
    
    // Update visual scheme
    updateColors(lvl);
    
    const palette = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (lvl > 1 && Math.random() < 0.15) continue;
            
            let life = 1;
            let type = 'normal';
            const rand = Math.random();
            
            if (config.hasTriple && rand < 0.1) { life = 3; }
            else if (config.hasDouble && rand < 0.2) { life = 2; }
            
            if (config.hasMoving && Math.random() < 0.1) type = 'moving';
            else if (config.hasShield && Math.random() < 0.08) type = 'shield';
            else if (config.hasGhost && Math.random() < 0.1) type = 'ghost';
            else if (config.hasBomb && Math.random() < 0.05) type = 'bomb';
            else if (config.hasTeleport && Math.random() < 0.05) type = 'teleport';
            else if (config.hasAll) {
                const types = ['moving', 'shield', 'ghost', 'bomb', 'teleport'];
                if (Math.random() < 0.2) type = types[Math.floor(Math.random() * types.length)];
            }

            const color = palette[r % palette.length];
            bricks.push(new Brick(c * brickW, r * brickH + 120, brickW, brickH, color, life, type));
        }
    }
}

function updateColors(lvl) {
    const root = document.documentElement;
    if (lvl <= 3) {
        COLORS.primary = '#00f3ff'; COLORS.secondary = '#ff00de';
    } else if (lvl <= 6) {
        COLORS.primary = '#bc00ff'; COLORS.secondary = '#00ff88';
    } else if (lvl <= 9) {
        COLORS.primary = '#ff3333'; COLORS.secondary = '#ffcc00';
    } else {
        COLORS.primary = '#ffffff'; COLORS.secondary = '#ff00de'; // Intense/Rainbow feel
    }
    root.style.setProperty('--primary', COLORS.primary);
    root.style.setProperty('--secondary', COLORS.secondary);
}

function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    comboStreak = 0;
    comboMultiplier = 1;
    
    const config = STAGE_CONFIG[1];
    paddle = new Paddle(config.paddleW);
    balls = [new Ball(canvas.width / 2, paddle.y - 20, config.speed)];
    powerUps = [];
    particles = [];
    scorePopups = [];
    gridRipples = [];
    initStars();
    initLevel(level);
    
    gameState = 'playing';
    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    if (window.audioFX) {
        window.audioFX.init();
        window.audioFX.stopMusic();
        window.audioFX.startMusic();
    }
}

function updateHUD() {
    uiScore.textContent = Math.floor(score);
    uiLives.textContent = lives;
    
    if (gameState === 'playing' || gameState === 'paused') {
        btnPause.classList.remove('hidden');
    } else {
        btnPause.classList.add('hidden');
    }
}

function spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function handleInput(x) {
    if (gameState !== 'playing' && gameState !== 'transition') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    paddle.targetX = (x - rect.left) * scaleX;
}

canvas.addEventListener('mousemove', e => handleInput(e.clientX));
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
}, { passive: false });

function update(deltaTime) {
    if (gameState !== 'playing') return;

    // Decay screenshake
    if (shakeDuration > 0) {
        shakeDuration -= deltaTime * 16.67;
        if (shakeDuration <= 0) {
            shakeDuration = 0;
            shakeIntensity = 0;
        }
    }

    // Update ripples
    for (let i = gridRipples.length - 1; i >= 0; i--) {
        const r = gridRipples[i];
        r.radius += r.speed * deltaTime;
        if (r.radius >= r.maxRadius) {
            gridRipples.splice(i, 1);
        }
    }

    // Decay screen flash
    if (screenFlashAlpha > 0) {
        screenFlashAlpha -= deltaTime * 0.035;
    }

    // Game speed scaling via time dilation
    const gameDelta = deltaTime * timeDilation;

    paddle.update(gameDelta);
    if (comboTimer > 0) {
        comboTimer -= gameDelta * 16.67;
        if (comboTimer <= 0) {
            comboStreak = 0;
            comboMultiplier = 1;
        }
    }

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.update(gameDelta);

        // Paddle Collision
        if (ball.y + ball.radius > paddle.y && 
            ball.y - ball.radius < paddle.y + paddle.h &&
            ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
            
            ball.dy *= -1;
            ball.y = paddle.y - ball.radius;
            const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            ball.dx = hitPos * 7;
            if (window.audioFX) window.audioFX.playPaddle();
            
            // Squash paddle and add ripple
            paddle.squashY = 0.5;
            paddle.stretchX = 1.4;
            addGridRipple(ball.x, paddle.y, 14, 160);
            triggerScreenshake(4, 100);
        }

        // Brick Collision
        for (let j = bricks.length - 1; j >= 0; j--) {
            const brick = bricks[j];
            if (brick.destroyed) continue;
            brick.update(gameDelta);
            
            if (ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brick.w &&
                ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brick.h) {
                
                if (brick.type === 'shield') {
                    ball.dy *= -1;
                    if (window.audioFX) window.audioFX.playHit();
                    addGridRipple(ball.x, ball.y, 12, 150);
                    triggerScreenshake(3, 80);
                    break;
                }

                if (!ball.fireball) {
                    const overlapX = Math.min(ball.x + ball.radius - brick.x, brick.x + brick.w - (ball.x - ball.radius));
                    const overlapY = Math.min(ball.y + ball.radius - brick.y, brick.y + brick.h - (ball.y - ball.radius));
                    if (overlapX < overlapY) ball.dx *= -1;
                    else ball.dy *= -1;
                }

                brick.life--;
                addGridRipple(ball.x, ball.y, 10, 140);
                triggerScreenshake(3, 80);

                if (brick.life <= 0) {
                    brick.destroyed = true;
                    comboStreak++;
                    comboTimer = 2000;
                    if (comboStreak >= 20) { comboMultiplier = 3; showCombo(20); }
                    else if (comboStreak >= 10) { comboMultiplier = 2; showCombo(10); }
                    else if (comboStreak >= 5) { showCombo(5); }
                    
                    const earned = 10 * comboMultiplier;
                    score += earned;
                    scorePopups.push(new ScorePopup(brick.x + brick.w / 2, brick.y + brick.h / 2, `+${earned}`, brick.color));
                    spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
                    
                    if (brick.type === 'bomb') triggerBomb(brick);
                    if (brick.type === 'teleport') { ball.x = Math.random() * canvas.width; ball.y = 120; }

                    const config = STAGE_CONFIG[level] || STAGE_CONFIG[10];
                    if (Math.random() < (config.puFreq || 0.15)) {
                        const types = ['expand', 'shrink', 'speedup', 'slowdown', 'multi', 'shield', 'bomb', 'life'];
                        powerUps.push(new PowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2, types[Math.floor(Math.random() * types.length)]));
                    }
                }
                
                if (window.audioFX) window.audioFX.playHit();
                updateHUD();
                break;
            }
        }

        // Drop out
        if (ball.y > canvas.height) {
            if (paddle.hasShield) {
                paddle.hasShield = false;
                ball.dy *= -1;
                ball.y = canvas.height - 20;
                addGridRipple(ball.x, canvas.height, 20, 200);
                triggerScreenshake(8, 250);
            } else {
                balls.splice(i, 1);
            }
        }
    }

    // PowerUp Updates
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        pu.update(gameDelta);
        if (pu.y + 15 > paddle.y && pu.y - 15 < paddle.y + paddle.h &&
            pu.x + 15 > paddle.x && pu.x - 15 < paddle.x + paddle.w) {
            
            applyPowerUp(pu.type);
            powerUps.splice(i, 1);
            if (window.audioFX) window.audioFX.playPowerUp();
            addGridRipple(pu.x, paddle.y, 15, 180);
            triggerScreenshake(5, 120);
        } else if (pu.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }

    // Death
    if (balls.length === 0) {
        lives--;
        comboStreak = 0;
        comboMultiplier = 1;
        updateHUD();
        triggerScreenshake(12, 300);
        if (lives <= 0) {
            endGame('gameover');
        } else {
            const config = STAGE_CONFIG[level] || STAGE_CONFIG[10];
            balls = [new Ball(canvas.width / 2, paddle.y - 30, config.speed)];
        }
    }

    // Level Clear with time dilation
    if (bricks.every(b => b.destroyed || b.type === 'shield')) {
        if (!slowMoClearPending) {
            slowMoClearPending = true;
            timeDilation = 0.15;
            screenFlashAlpha = 1.0;
            triggerScreenshake(14, 500);
            if (window.audioFX) window.audioFX.playLevelUp();
            setTimeout(() => {
                slowMoClearPending = false;
                timeDilation = 1.0;
                nextLevel();
            }, 1200);
        }
    }

    // Particles (Update at full speed for visual liquidity)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(deltaTime);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Floating Score Popups (Update at full speed)
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        scorePopups[i].update(deltaTime);
        if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
    }

    // Dynamic music BPM acceleration
    if (bricks.length > 0) {
        const totalActive = bricks.filter(b => !b.destroyed && b.type !== 'shield').length;
        const fraction = totalActive / Math.max(1, bricks.length);
        if (window.audioFX) {
            window.audioFX.setBpm(110 + (1 - fraction) * 50);
        }
    }
}

function applyPowerUp(type) {
    switch(type) {
        case 'expand':   paddle.w = paddle.baseW + 50; paddle.timer = 480; break;
        case 'shrink':   paddle.w = Math.max(40, paddle.baseW - 30); paddle.timer = 360; break;
        case 'speedup':  balls.forEach(b => b.tempMulti = 1.3); paddle.timer = 300; break;
        case 'slowdown': balls.forEach(b => b.tempMulti = 0.7); paddle.timer = 360; break;
        case 'multi':    const b = balls[0] || {x:paddle.x+paddle.w/2, y:paddle.y-20, speed:6};
                         balls.push(new Ball(b.x, b.y, b.speed), new Ball(b.x, b.y, b.speed)); break;
        case 'shield':   paddle.hasShield = true; break;
        case 'bomb':     
            balls.forEach(b => b.fireball = true);
            paddle.timer = 300; // 5 seconds of fireball!
            spawnParticles(paddle.x + paddle.w/2, paddle.y + paddle.h/2, '#ff5500', 40);
            break;
        case 'life':     lives++; updateHUD(); break;
    }
}

function triggerBomb(brick) {
    const radius = 120;
    bricks.forEach(b => {
        if (!b.destroyed && b.type !== 'shield') {
            const dist = Math.sqrt(Math.pow(b.x - brick.x, 2) + Math.pow(b.y - brick.y, 2));
            if (dist < radius) {
                b.destroyed = true;
                const earned = 10 * comboMultiplier;
                score += earned;
                scorePopups.push(new ScorePopup(b.x + b.w / 2, b.y + b.h / 2, `+${earned}`, b.color));
                spawnParticles(b.x + b.w/2, b.y + b.h/2, b.color, 8);
            }
        }
    });
    spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, '#ffaa00', 30);
    triggerScreenshake(14, 400);
    addGridRipple(brick.x + brick.w / 2, brick.y + brick.h / 2, 30, 260);
}

function showCombo(count) {
    const toast = document.getElementById('comboToast');
    toast.textContent = `COMBO x${count}! ${count >= 10 ? '🔥' : count >= 20 ? '⚡' : ''}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 1500);
}

function nextLevel() {
    level++;
    gameState = 'transition';
    const transition = document.getElementById('stageTransition');
    const levelText = document.getElementById('trans-level-text');
    const starsEl = document.getElementById('trans-stars');
    const mechanicDesc = document.getElementById('trans-mechanic-desc');
    
    levelText.textContent = `STAGE ${level-1} COMPLETE!`;
    starsEl.textContent = lives >= 3 ? '⭐⭐⭐' : lives === 2 ? '⭐⭐' : '⭐';
    
    const config = STAGE_CONFIG[level] || STAGE_CONFIG[10];
    mechanicDesc.textContent = config.desc || "Endless Madness Increasing!";
    
    transition.classList.remove('hidden');
    scorePopups = [];
    gridRipples = [];
    
    setTimeout(() => {
        transition.classList.add('hidden');
        initLevel(level);
        const config = STAGE_CONFIG[level] || STAGE_CONFIG[10];
        paddle.baseW = config.paddleW;
        paddle.w = config.paddleW;
        balls = [new Ball(canvas.width / 2, paddle.y - 20, config.speed)];
        gameState = 'playing';
    }, 2500);
}

function endGame(state) {
    gameState = state;
    if (window.audioFX) window.audioFX.stopMusic();
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('brickBreakerBest', highScore);
    }
    
    document.getElementById('go-score').textContent = Math.floor(score);
    document.getElementById('go-best').textContent = highScore;
    document.getElementById('gameOverMenu').classList.remove('hidden');
    
    if (window.audioFX) window.audioFX.playGameOver();
    
    // Achievements
    if (score >= 1000 && window.achievements) window.achievements.unlock('brickbreaker', 'score_1000', 'Neon Star');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
        if (window.audioFX) window.audioFX.stopMusic();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        if (window.audioFX) window.audioFX.startMusic();
    }
}

function toggleMute() {
    if (window.audioFX) {
        window.audioFX.toggleMute();
    }
}

function shareGame(platform) {
    const scoreVal = document.getElementById('go-score').textContent;
    const gameName = "Neon Brick Breaker";
    const text = `I scored ${scoreVal} on ${gameName} at arcadehubplay.com! Can you beat my score? 🎮`;
    const url = window.location.href;
    
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`);
    }
}

function draw() {
    // 1. Draw grid background & twinkling stars
    drawBackground();

    // 2. Draw normal entities
    if (paddle) paddle.draw();
    if (bricks.length > 0) bricks.forEach(b => b.draw());
    if (balls.length > 0) balls.forEach(b => b.draw());
    if (powerUps.length > 0) powerUps.forEach(p => p.draw());
    if (particles.length > 0) particles.forEach(p => p.draw());
    if (scorePopups.length > 0) scorePopups.forEach(sp => sp.draw());

    // 3. Draw screen flash
    if (screenFlashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

function loop(t) {
    if (!lastTime) {
        lastTime = t;
        requestAnimationFrame(loop);
        return;
    }
    const dt = t - lastTime;
    lastTime = t;
    
    const deltaTime = Math.min(dt / 16.67, 3);
    
    if (gameState === 'playing') {
        update(deltaTime);
    }
    
    ctx.save();
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }
    
    draw();
    
    ctx.restore();
    requestAnimationFrame(loop);
}

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (paddle) {
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        paddle.y = canvas.height - (isMobile ? 70 : 40);
    }
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);

// Button Listeners
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-how').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
document.getElementById('btn-close-how').addEventListener('click', () => howToPlayModal.classList.add('hidden'));

document.getElementById('btn-restart-go').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    startGame();
});

document.getElementById('btn-howtoplay-go').addEventListener('click', () => {
    howToPlayModal.classList.remove('hidden');
});

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
    if (window.audioFX) window.audioFX.stopMusic();
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') togglePause();
    if (e.key.toLowerCase() === 'm') toggleMute();
    if (e.key === 'Escape' && gameState === 'playing') togglePause();
});
