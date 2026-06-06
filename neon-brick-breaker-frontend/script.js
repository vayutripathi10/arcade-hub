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

// Action Revamp additions
let boss = null;
let bossProjectiles = [];
let deflectors = [];
let laserBullets = [];

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
    3:  { speed: 5.7, paddleW: 100, rows: 5, puFreq: 0.2,  desc: "Double-Hit Bricks added!", hasDouble: true },
    4:  { speed: 5.7, paddleW: 100, rows: 5, puFreq: 0.2,  desc: "Watch out for Cyber Deflectors!", hasDouble: true },
    5:  { speed: 6.5, paddleW: 85,  rows: 0, puFreq: 0.0,  desc: "BOSS FIGHT: NEON SENTINEL!" },
    6:  { speed: 6.5, paddleW: 85,  rows: 6, puFreq: 0.15, desc: "Moving Bricks & Triple-Hits!", hasTriple: true, hasMoving: true },
    7:  { speed: 7.5, paddleW: 70,  rows: 7, puFreq: 0.15, desc: "Shield & Ghost Bricks!", hasShield: true, hasGhost: true },
    8:  { speed: 7.5, paddleW: 70,  rows: 7, puFreq: 0.15, desc: "Triple Cyber Deflectors!", hasShield: true, hasGhost: true },
    9:  { speed: 8.5, paddleW: 60,  rows: 8, puFreq: 0.12, desc: "Bombs & Teleports!", hasBomb: true, hasTeleport: true },
    10: { speed: 9.0, paddleW: 60,  rows: 0, puFreq: 0.0,  desc: "FINAL BOSS: CYBER OVERLORD!" }
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
        this.type = type; // expand, shrink, speedup, slowdown, multi, shield, bomb, life, laser
        this.speed = 3;
        
        const config = {
            expand:   { color: '#00f3ff', icon: '🔵' },
            shrink:   { color: '#ff3333', icon: '🔴' },
            speedup:  { color: '#ffcc00', icon: '⚡' },
            slowdown: { color: '#00ff88', icon: '🐢' },
            multi:    { color: '#ffffff', icon: '🎱' },
            shield:   { color: '#00ffff', icon: '🛡️' },
            bomb:     { color: '#ff5500', icon: '🔥' },
            life:     { color: '#ff00de', icon: '❤️' },
            laser:    { color: '#ffff00', icon: '🔫' }
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

class LaserBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 4;
        this.h = 16;
        this.speed = 10;
        this.color = COLORS.secondary;
    }
    update(deltaTime) {
        this.y -= this.speed * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
        ctx.restore();
    }
}

class BossProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 6;
        this.color = '#ff3366';
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Deflector {
    constructor(x, y, w = 70, speed = 2) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = 14;
        this.vx = speed;
        this.color = COLORS.warning;
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        if (this.x < 15 || this.x + this.w > canvas.width - 15) {
            this.vx *= -1;
        }
    }
    draw() {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

class Boss {
    constructor(type, hp) {
        this.type = type; // 'sentinel' or 'overlord'
        this.x = canvas.width / 2;
        this.y = 130;
        this.w = type === 'sentinel' ? 120 : 160;
        this.h = type === 'sentinel' ? 45 : 65;
        this.vx = 2.0;
        this.hp = hp;
        this.maxHp = hp;
        this.color = type === 'sentinel' ? COLORS.secondary : COLORS.accent;
        this.shootTimer = 0;
        
        // Sentinel Orbital Shields
        this.orbitAngle = 0;
        this.shields = []; 
        if (type === 'sentinel') {
            this.shields = [true, true, true, true]; 
        }
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        const limit = 40;
        if (this.x - this.w / 2 < limit) {
            this.x = limit + this.w / 2;
            this.vx *= -1;
        } else if (this.x + this.w / 2 > canvas.width - limit) {
            this.x = canvas.width - limit - this.w / 2;
            this.vx *= -1;
        }

        this.orbitAngle += 0.025 * deltaTime;

        // Shoot Projectiles
        this.shootTimer += deltaTime * 16.67;
        const shootInterval = this.type === 'sentinel' ? 1600 : 1000;
        if (this.shootTimer >= shootInterval) {
            this.shootTimer = 0;
            this.shootProjectiles();
        }
    }
    shootProjectiles() {
        if (gameState !== 'playing') return;
        if (this.type === 'sentinel') {
            bossProjectiles.push(new BossProjectile(this.x - 30, this.y + 10, 0, 4.5));
            bossProjectiles.push(new BossProjectile(this.x + 30, this.y + 10, 0, 4.5));
        } else {
            // Overlord fires a 3-way spread targeting bottom
            bossProjectiles.push(new BossProjectile(this.x, this.y + 20, -1.2, 5.0));
            bossProjectiles.push(new BossProjectile(this.x, this.y + 20, 0, 5.0));
            bossProjectiles.push(new BossProjectile(this.x, this.y + 20, 1.2, 5.0));
        }
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        
        // Draw main body
        ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        ctx.globalAlpha = 1.0;

        // Draw core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sentinel Orbital Shields
        if (this.type === 'sentinel') {
            ctx.strokeStyle = COLORS.primary;
            ctx.shadowColor = COLORS.primary;
            ctx.lineWidth = 4;
            const radius = 90;
            for (let i = 0; i < 4; i++) {
                if (this.shields[i]) {
                    const angle = this.orbitAngle + (i * Math.PI / 2);
                    const sx = this.x + Math.cos(angle) * radius;
                    const sy = this.y + Math.sin(angle) * radius;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = COLORS.primary;
                    ctx.globalAlpha = 0.2;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        }
        ctx.restore();
        drawBossUI(this);
    }
    hit(damage) {
        this.hp -= damage;
        triggerScreenshake(6, 120);
        addGridRipple(this.x, this.y, 15, 160);
        spawnParticles(this.x, this.y, this.color, 12);
        
        if (this.hp <= 0) {
            this.hp = 0;
            triggerScreenshake(25, 600);
            addGridRipple(this.x, this.y, 40, 300);
            spawnParticles(this.x, this.y, this.color, 50);
            if (window.audioFX) window.audioFX.playLevelUp();
            
            if (!slowMoClearPending) {
                slowMoClearPending = true;
                timeDilation = 0.15;
                screenFlashAlpha = 1.0;
                setTimeout(() => {
                    slowMoClearPending = false;
                    timeDilation = 1.0;
                    nextLevel();
                }, 1500);
            }
        }
    }
}

function drawBossUI(boss) {
    ctx.save();
    const barW = 240;
    const barH = 8;
    const bx = (canvas.width - barW) / 2;
    const by = 90;
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    
    // Fill
    const ratio = boss.hp / boss.maxHp;
    ctx.fillStyle = boss.color;
    ctx.fillRect(bx + 1, by + 1, (barW - 2) * ratio, barH - 2);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px var(--font-arcade)';
    ctx.textAlign = 'center';
    ctx.fillText(boss.type === 'sentinel' ? 'NEON SENTINEL' : 'CYBER OVERLORD', canvas.width / 2, by - 8);
    ctx.restore();
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
        this.spin = 0;
    }
    update(deltaTime) {
        const s = this.speed * this.tempMulti;
        
        // Apply spin curve physics
        this.dx += this.spin * deltaTime;
        this.spin *= Math.pow(0.96, deltaTime);

        const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx = (this.dx / mag) * s;
        this.dy = (this.dy / mag) * s;

        // Clamp dy so it doesn't get completely horizontal
        if (Math.abs(this.dy) < s * 0.2) {
            this.dy = (this.dy < 0 ? -1 : 1) * s * 0.2;
            const newMag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = (this.dx / newMag) * s;
            this.dy = (this.dy / newMag) * s;
        }

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
        
        // Lifted the paddle bar higher up (100px desktop, 130px mobile) to keep gameplay fast-paced
        this.y = canvas.height - (isMobile ? 130 : 100);
        this.targetX = this.x;
        this.color = COLORS.primary;
        this.timer = 0;
        this.hasShield = false;
        
        // Squash & stretch spring animation values
        this.squashY = 1.0;
        this.stretchX = 1.0;
        this.squashYVelocity = 0;
        this.stretchXVelocity = 0;

        // Laser cannons
        this.hasLasers = false;
        this.laserTimer = 0;
        this.lastFireTime = 0;

        // Speed tracker for curve physics
        this.prevX = this.x;
        this.vx = 0;
    }
    update(deltaTime) {
        // Calculate velocity
        this.x += (this.targetX - (this.x + this.w / 2)) * 0.2 * deltaTime;
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        this.vx = (this.x - this.prevX) / (deltaTime || 1);
        this.prevX = this.x;

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

        if (this.hasLasers) {
            if (this.laserTimer !== Infinity) {
                this.laserTimer -= deltaTime;
                if (this.laserTimer <= 0) {
                    this.laserTimer = 0;
                    this.hasLasers = false;
                }
            }
            
            // Autofire lasers every 300ms
            const nowMs = Date.now();
            if (!this.lastFireTime || nowMs - this.lastFireTime > 300) {
                this.lastFireTime = nowMs;
                fireLasers();
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
        
        // Draw dual guns if hasLasers is active
        if (this.hasLasers) {
            ctx.save();
            ctx.fillStyle = COLORS.secondary;
            ctx.shadowColor = COLORS.secondary;
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x + 4, this.y - 7, 6, 9);
            ctx.fillRect(this.x + this.w - 10, this.y - 7, 6, 9);
            ctx.restore();
        }

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
    boss = null;
    bossProjectiles = [];
    deflectors = [];
    laserBullets = [];

    // Spawning bosses on Wave 5 & 10
    if (lvl === 5) {
        boss = new Boss('sentinel', 60);
        updateColors(lvl);
        if (paddle) {
            paddle.hasLasers = true;
            paddle.laserTimer = Infinity;
        }
        return;
    }
    if (lvl === 10) {
        boss = new Boss('overlord', 150);
        updateColors(lvl);
        if (paddle) {
            paddle.hasLasers = true;
            paddle.laserTimer = Infinity;
        }
        return;
    }

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

            const color = palette[r % palette.length];
            bricks.push(new Brick(c * brickW, r * brickH + 120, brickW, brickH, color, life, type));
        }
    }

    // Spawn Mid-Field Bumpers/Deflectors
    if (lvl === 4) {
        deflectors.push(new Deflector(80, 240, 70, 2));
        deflectors.push(new Deflector(280, 280, 70, -2));
    } else if (lvl === 6) {
        deflectors.push(new Deflector(40, 240, 80, 2.5));
        deflectors.push(new Deflector(240, 290, 80, -2.5));
    } else if (lvl === 8) {
        deflectors.push(new Deflector(50, 210, 60, 3));
        deflectors.push(new Deflector(150, 250, 60, -3));
        deflectors.push(new Deflector(250, 290, 60, 3));
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
    laserBullets = [];
    bossProjectiles = [];
    deflectors = [];
    boss = null;
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

function fireLasers() {
    if (gameState === 'playing' && paddle && paddle.hasLasers) {
        laserBullets.push(new LaserBullet(paddle.x + 10, paddle.y));
        laserBullets.push(new LaserBullet(paddle.x + paddle.w - 10, paddle.y));
        if (window.audioFX) window.audioFX.playShoot();
        triggerScreenshake(3, 70);
        addGridRipple(paddle.x + paddle.w/2, paddle.y, 8, 100);
    }
}

canvas.addEventListener('click', e => {
    fireLasers();
});
canvas.addEventListener('touchstart', e => {
    if (gameState === 'playing') {
        fireLasers();
    }
});

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

    // Update boss & boss projectiles
    if (boss) {
        boss.update(gameDelta);
        
        // Update boss projectiles
        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            const proj = bossProjectiles[i];
            proj.update(gameDelta);
            
            // Collision with paddle
            if (proj.y + proj.radius > paddle.y && proj.y - proj.radius < paddle.y + paddle.h &&
                proj.x + proj.radius > paddle.x && proj.x - proj.radius < paddle.x + paddle.w) {
                
                bossProjectiles.splice(i, 1);
                
                if (paddle.hasShield) {
                    paddle.hasShield = false;
                } else {
                    lives--;
                    updateHUD();
                    triggerScreenshake(15, 350);
                    addGridRipple(paddle.x + paddle.w/2, paddle.y, 25, 200);
                    spawnParticles(proj.x, proj.y, '#ff3366', 20);
                    if (lives <= 0) {
                        endGame('gameover');
                        return;
                    } else {
                        // Glitch shrink paddle
                        paddle.w = Math.max(45, paddle.w - 30);
                        paddle.timer = 180; // shrink for 3s
                    }
                }
            } else if (proj.y > canvas.height) {
                bossProjectiles.splice(i, 1);
            }
        }
    }

    // Update laser bullets
    for (let i = laserBullets.length - 1; i >= 0; i--) {
        const bullet = laserBullets[i];
        bullet.update(gameDelta);
        
        let bulletHit = false;
        
        if (boss) {
            // Hit boss
            if (bullet.x > boss.x - boss.w/2 && bullet.x < boss.x + boss.w/2 &&
                bullet.y > boss.y - boss.h/2 && bullet.y < boss.y + boss.h/2) {
                boss.hit(1.2);
                bulletHit = true;
            }
            
            // Hit sentinel shields
            if (!bulletHit && boss.type === 'sentinel') {
                const radius = 90;
                for (let k = 0; k < 4; k++) {
                    if (boss.shields[k]) {
                        const angle = boss.orbitAngle + (k * Math.PI / 2);
                        const sx = boss.x + Math.cos(angle) * radius;
                        const sy = boss.y + Math.sin(angle) * radius;
                        const dist = Math.sqrt(Math.pow(bullet.x - sx, 2) + Math.pow(bullet.y - sy, 2));
                        if (dist < 18) {
                            boss.shields[k] = false;
                            bulletHit = true;
                            if (window.audioFX) window.audioFX.playHit();
                            triggerScreenshake(3, 80);
                            addGridRipple(sx, sy, 10, 120);
                            spawnParticles(sx, sy, COLORS.primary, 8);
                            break;
                        }
                    }
                }
            }
        } else {
            // Hit bricks
            for (let j = bricks.length - 1; j >= 0; j--) {
                const brick = bricks[j];
                if (brick.destroyed || brick.type === 'shield') continue;
                if (bullet.x > brick.x && bullet.x < brick.x + brick.w &&
                    bullet.y > brick.y && bullet.y < brick.y + brick.h) {
                    
                    brick.life--;
                    bulletHit = true;
                    addGridRipple(bullet.x, bullet.y, 8, 110);
                    triggerScreenshake(2, 60);

                    if (brick.life <= 0) {
                        brick.destroyed = true;
                        comboStreak++;
                        comboTimer = 2000;
                        if (comboStreak >= 20) { comboMultiplier = 3; showCombo(20); }
                        else if (comboStreak >= 10) { comboMultiplier = 2; showCombo(10); }
                        else if (comboStreak >= 5) { showCombo(5); }
                        
                        const earned = 10 * comboMultiplier;
                        score += earned;
                        scorePopups.push(new ScorePopup(brick.x + brick.w/2, brick.y + brick.h/2, `+${earned}`, brick.color));
                        spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color);
                        
                        if (brick.type === 'bomb') triggerBomb(brick);
                    }
                    if (window.audioFX) window.audioFX.playHit();
                    updateHUD();
                    break;
                }
            }
        }
        
        if (bulletHit || bullet.y < 0) {
            laserBullets.splice(i, 1);
        }
    }

    // Update mid-field deflectors & check ball collision
    deflectors.forEach(def => {
        def.update(gameDelta);
    });

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

            // Set ball spin curve based on paddle horizontal velocity
            ball.spin = paddle.vx * 0.35;

            // Speed scaling on hits (up to 1.6x)
            ball.speed = Math.min(ball.baseSpeed * 1.6, ball.speed + 0.3);
        }

        // Deflector Collision
        deflectors.forEach(def => {
            if (ball.x + ball.radius > def.x && ball.x - ball.radius < def.x + def.w &&
                ball.y + ball.radius > def.y && ball.y - ball.radius < def.y + def.h) {
                
                // Bounce ball
                const overlapX = Math.min(ball.x + ball.radius - def.x, (def.x + def.w) - (ball.x - ball.radius));
                const overlapY = Math.min(ball.y + ball.radius - def.y, (def.y + def.h) - (ball.y - ball.radius));
                if (overlapX < overlapY) ball.dx *= -1;
                else ball.dy *= -1;
                
                if (window.audioFX) window.audioFX.playHit();
                addGridRipple(ball.x, ball.y, 10, 130);
                triggerScreenshake(3, 70);
            }
        });

        // Boss Collision
        if (boss) {
            if (ball.x + ball.radius > boss.x - boss.w/2 && ball.x - ball.radius < boss.x + boss.w/2 &&
                ball.y + ball.radius > boss.y - boss.h/2 && ball.y - ball.radius < boss.y + boss.h/2) {
                
                if (!ball.fireball) {
                    const overlapX = Math.min(ball.x + ball.radius - (boss.x - boss.w/2), (boss.x + boss.w/2) - (ball.x - ball.radius));
                    const overlapY = Math.min(ball.y + ball.radius - (boss.y - boss.h/2), (boss.y + boss.h/2) - (ball.y - ball.radius));
                    if (overlapX < overlapY) ball.dx *= -1;
                    else ball.dy *= -1;
                } else {
                    ball.dy *= -1;
                }
                
                boss.hit(ball.fireball ? 3.0 : 1.0);
            }
            
            // Boss orbital shields collision
            if (boss.type === 'sentinel') {
                const radius = 90;
                for (let k = 0; k < 4; k++) {
                    if (boss.shields[k]) {
                        const angle = boss.orbitAngle + (k * Math.PI / 2);
                        const sx = boss.x + Math.cos(angle) * radius;
                        const sy = boss.y + Math.sin(angle) * radius;
                        const dist = Math.sqrt(Math.pow(ball.x - sx, 2) + Math.pow(ball.y - sy, 2));
                        if (dist < ball.radius + 12) {
                            ball.dy *= -1;
                            ball.dx += (Math.random() - 0.5) * 4;
                            
                            boss.shields[k] = false;
                            if (window.audioFX) window.audioFX.playHit();
                            triggerScreenshake(4, 100);
                            addGridRipple(sx, sy, 12, 140);
                            spawnParticles(sx, sy, COLORS.primary, 8);
                        }
                    }
                }
            }
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
                        const types = ['expand', 'shrink', 'speedup', 'slowdown', 'multi', 'shield', 'bomb', 'life', 'laser'];
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
    const isLevelFinished = boss ? (boss.hp <= 0) : bricks.every(b => b.destroyed || b.type === 'shield');
    if (isLevelFinished) {
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

    // Particles (Update at full speed)
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
    if (boss) {
        if (window.audioFX) {
            window.audioFX.setBpm(boss.type === 'sentinel' ? 140 : 165);
        }
    } else if (bricks.length > 0) {
        const totalActive = bricks.filter(b => !b.destroyed && b.type !== 'shield').length;
        const fraction = totalActive / Math.max(1, bricks.length);
        if (window.audioFX) {
            window.audioFX.setBpm(110 + (1 - fraction) * 50);
        }
    }
}

function applyPowerUp(type) {
    // Show notification popup for collected powerups
    scorePopups.push(new ScorePopup(paddle.x + paddle.w/2, paddle.y - 30, type.toUpperCase(), COLORS.success));

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
            paddle.timer = 300; 
            spawnParticles(paddle.x + paddle.w/2, paddle.y + paddle.h/2, '#ff5500', 40);
            break;
        case 'life':     lives++; updateHUD(); break;
        case 'laser':    
            paddle.hasLasers = true; 
            paddle.laserTimer = 360; // 6 seconds of laser guns
            break;
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
    bossProjectiles = [];
    laserBullets = [];
    if (paddle) {
        paddle.hasLasers = false;
        paddle.laserTimer = 0;
    }
    boss = null;
    
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

    // 2. Draw moving deflectors
    if (deflectors.length > 0) deflectors.forEach(def => def.draw());

    // 3. Draw boss if active
    if (boss) boss.draw();

    // 4. Draw normal entities
    if (paddle) paddle.draw();
    if (bricks.length > 0) bricks.forEach(b => b.draw());
    if (balls.length > 0) balls.forEach(b => b.draw());
    if (powerUps.length > 0) powerUps.forEach(p => p.draw());
    if (laserBullets.length > 0) laserBullets.forEach(lb => lb.draw());
    if (bossProjectiles.length > 0) bossProjectiles.forEach(bp => bp.draw());
    if (particles.length > 0) particles.forEach(p => p.draw());
    if (scorePopups.length > 0) scorePopups.forEach(sp => sp.draw());

    // 5. Draw screen flash
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
        paddle.y = canvas.height - (isMobile ? 130 : 100);
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

document.getElementById('btn-home-go').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'title';
    updateHUD();
    if (window.audioFX) window.audioFX.stopMusic();
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
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        fireLasers();
    }
});
