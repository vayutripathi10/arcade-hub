const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseIcon = pauseBtn?.querySelector('.pause-icon');
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');

// Game State
const SafeStorage = {
    getItem: (key) => {
        try { return localStorage.getItem(key); }
        catch (e) { return null; }
    },
    setItem: (key, val) => {
        try { localStorage.setItem(key, val); }
        catch (e) { console.warn('Storage blocked'); }
    }
};

let score = 0;
let highScore = SafeStorage.getItem('spaceShooterBest') || 0;
let gameRunning = false;
let isPaused = false;
let frameCount = 0;
let lastTime = 0;
let animationFrameId;
let dayPhase = 0;

// Boss State
let bossState = 'none'; // 'none', 'incoming', 'active', 'defeated'
let boss = null;
let bossMessageTimer = 0;
let screenShake = 0;
let bossSpawnScore = 800; // First boss at 800 points
let bossDefeatedCount = 0;

// Entities
let player;
let bullets = [];
let bossBullets = [];
let enemies = [];
let asteroids = [];
let powerups = [];
let particles = [];
let stars = [];

// Input
const keys = {};

// Constants
const SPEED_INC = 0.0001;
let currentSpeedMultiplier = 1;

highScoreElement.textContent = highScore;

// --- Classes ---

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.reset();
        this.color = '#00ffcc';
        this.shootCooldown = 300;
        this.lastShot = 0;
        this.lives = 3;
        this.shield = false;
        this.speedBoost = false;
        this.speedBoostTimer = 0;
        this.invulnerable = false;
        this.invulnTimer = 0;
    }

    reset() {
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 80;
        this.vx = 0;
        this.vy = 0;
        this.speed = 6;
    }

    update() {
        // Keyboard movement
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['KeyW']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['KeyS']) this.y += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;

        // Auto-shoot
        const now = Date.now();
        const cooldown = this.speedBoost ? this.shootCooldown / 2 : this.shootCooldown;
        if (now - this.lastShot > cooldown && gameRunning) {
            this.shoot();
            this.lastShot = now;
        }

        // Powerup Timers
        if (this.speedBoost) {
            this.speedBoostTimer--;
            if (this.speedBoostTimer <= 0) this.speedBoost = false;
        }

        // Invulnerability Timer
        if (this.invulnerable) {
            this.invulnTimer--;
            if (this.invulnTimer <= 0) this.invulnerable = false;
        }
    }

    shoot() {
        bullets.push(new Bullet(this.x + this.width / 2, this.y));
        if (window.audioFX) window.audioFX.playJump(); // Reuse jump sound for shot
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Draw spaceship polygon
        ctx.beginPath();
        if (this.invulnerable && frameCount % 10 < 5) {
            ctx.globalAlpha = 0.5; // Flicker
        }
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw shield ring
        if (this.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
        // Lives are drawn by draw() outside shake transform
    }

    drawLives() {
        ctx.save();
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4444';
        
        const isMobile = canvas.width < 800;
        const startX = isMobile ? 30 : 30;
        const startY = isMobile ? 90 : 40; 

        for (let i = 0; i < this.lives; i++) {
            ctx.fillText('❤️', startX + (i * 35), startY);
        }
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x - 2;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 10;
        this.color = '#fff';
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class BossBullet {
    constructor(x, y, vx, vy, color = '#ff00ff') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 6;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Boss {
    constructor() {
        this.width = 120;
        this.height = 80;
        this.x = canvas.width / 2;
        this.y = -200; // Start off-screen
        this.maxHealth = 100 + (bossDefeatedCount * 50);
        this.health = this.maxHealth;
        this.phase = 1;
        this.color = '#ff00ff';
        this.speed = 2;
        this.targetX = canvas.width / 2;
        this.lastShot = 0;
        this.lastSpawn = 0;
        this.entryFinished = false;
        this.floatOffset = 0;
        this.segments = []; // For dragon body
        for (let i = 0; i < 5; i++) {
            this.segments.push({ x: this.x, y: this.y - (i * 30), size: 40 - i * 5 });
        }
        
        // Laser state
        this.laserCharging = false;
        this.laserActive = false;
        this.laserTimer = 0;
    }

    update() {
        // Entry
        if (!this.entryFinished) {
            this.y += 2;
            if (this.y >= 100) this.entryFinished = true;
        } else {
            // Hover movement
            this.floatOffset += 0.05;
            this.y = 100 + Math.sin(this.floatOffset) * 20;
            
            if (Math.abs(this.x - this.targetX) < 5) {
                this.targetX = 200 + Math.random() * (canvas.width - 400);
            }
            this.x += (this.targetX - this.x) * 0.02;
        }

        // Update dragon segments (snake following logic)
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        for (let i = this.segments.length - 1; i > 0; i--) {
            this.segments[i].x += (this.segments[i - 1].x - this.segments[i].x) * 0.15;
            this.segments[i].y += (this.segments[i - 1].y - this.segments[i].y) * 0.15;
        }

        // Phase Check
        const hpPerc = this.health / this.maxHealth;
        if (hpPerc < 0.33) this.phase = 3;
        else if (hpPerc < 0.66) this.phase = 2;

        // Attack Patterns
        if (gameRunning && this.entryFinished) {
            if (this.laserActive || this.laserCharging) {
                this.updateLaser();
            } else {
                this.shoot();
                if (this.phase === 3) this.spawnMinions();
            }
        }
    }

    updateLaser() {
        this.laserTimer--;
        if (this.laserCharging) {
            if (this.laserTimer <= 0) {
                this.laserCharging = false;
                this.laserActive = true;
                this.laserTimer = 120; // Fire for 2 seconds
                screenShake = 15;
            }
        } else if (this.laserActive) {
            // Collision with player
            const playerCx = player.x + 20;
            if (Math.abs(playerCx - this.x) < 40 && player.y > this.y) {
                handleCollision(this, 0, 'laser');
            }
            if (this.laserTimer <= 0) {
                this.laserActive = false;
                this.lastShot = Date.now(); // Reset cooldown
            }
        }
    }

    shoot() {
        const now = Date.now();
        let cooldown = 1500 - (this.phase * 300);
        if (now - this.lastShot > cooldown) {
            this.lastShot = now;
            
            if (this.phase === 1) {
                // Single aimed shot
                this.fireAtPlayer(5);
            } else if (this.phase === 2) {
                // Spread 3
                for (let angle = -0.5; angle <= 0.5; angle += 0.5) {
                    bossBullets.push(new BossBullet(this.x, this.y + 40, Math.sin(angle) * 5, 5));
                }
            } else if (this.phase === 3) {
                // Chance to start laser or rapid spread
                if (Math.random() > 0.5) {
                    this.laserCharging = true;
                    this.laserTimer = 90; // 1.5s charge
                } else {
                    for (let angle = -1; angle <= 1; angle += 0.5) {
                        bossBullets.push(new BossBullet(this.x, this.y + 40, Math.sin(angle) * 7, 7, '#ff8c00'));
                    }
                }
            }
        }
    }

    fireAtPlayer(speed) {
        const dx = player.x + 20 - this.x;
        const dy = player.y + 20 - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        bossBullets.push(new BossBullet(this.x, this.y + 40, (dx/dist) * speed, (dy/dist) * speed));
    }

    spawnMinions() {
        const now = Date.now();
        if (now - this.lastSpawn > 4000) {
            this.lastSpawn = now;
            enemies.push(new Enemy('basic'));
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        screenShake = 10;
        if (this.health <= 0) this.defeat();
    }

    defeat() {
        bossState = 'defeated';
        bossMessageTimer = 120;
        bossDefeatedCount++;
        score += 2000;
        createExplosion(this.x, this.y, this.color);
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, this.color));
        }
        bossSpawnScore += 3000;
        if(window.achievements) window.achievements.unlock('space', 'boss_slayer', 'Dragon Slayer');
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Draw segments
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            ctx.globalAlpha = 1 - (i * 0.15);
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Neon glow ring
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw Eyes/Head Detail
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y - 5, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw Laser
        if (this.laserCharging) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 40);
            ctx.lineTo(this.x, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.laserActive) {
            const grad = ctx.createLinearGradient(this.x - 30, 0, this.x + 30, 0);
            grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
            grad.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
            grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = grad;
            ctx.fillRect(this.x - 30, this.y + 40, 60, canvas.height - this.y);
            
            // Core beam
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - 5, this.y + 40, 10, canvas.height - this.y);
        }

        ctx.restore();
        this.drawHealthBar();
    }

    drawHealthBar() {
        const h = 10;
        const isMobile = canvas.width < 800;
        const y = isMobile ? canvas.height - 40 : 30; // Move to bottom on mobile, safe margin
        const barWidth = Math.min(400, canvas.width - 60);
        const x = (canvas.width - barWidth) / 2;

        // Bg
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x, y, barWidth, h);

        // Fill
        const ratio = Math.max(0, this.health / this.maxHealth);
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * ratio, h);
        
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('MECHANICAL DRAGON', canvas.width / 2, y - 10);
    }
}

class Enemy {
    constructor(type) {
        this.type = type;
        this.x = Math.random() * (canvas.width - 40);
        this.y = -50;
        this.health = 1;
        this.isZigzag = false;
        this.zigzagPhase = 0;
        
        if (type === 'basic') {
            this.width = 30;
            this.height = 30;
            this.color = '#ff00ff';
            this.speed = 3 * currentSpeedMultiplier;
        } else if (type === 'zigzag') {
            this.width = 35;
            this.height = 35;
            this.color = '#ff8c00';
            this.speed = 2.5 * currentSpeedMultiplier;
            this.isZigzag = true;
            this.startX = this.x;
        } else if (type === 'tank') {
            this.width = 60;
            this.height = 50;
            this.color = '#ff4444';
            this.speed = 1.5 * currentSpeedMultiplier;
            this.health = 3;
        }
    }

    update() {
        this.y += this.speed;
        if (this.isZigzag) {
            this.zigzagPhase += 0.05;
            this.x = this.startX + Math.sin(this.zigzagPhase) * 100;
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        if (this.type === 'basic') {
            // Triangle down
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        } else if (this.type === 'zigzag') {
            // Diamond
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height / 2);
        } else if (this.type === 'tank') {
            // Hexagon
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const size = this.width / 2;
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(cx + size * Math.cos(i * Math.PI / 3), cy + size * Math.sin(i * Math.PI / 3));
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Asteroid {
    constructor() {
        this.radius = 15 + Math.random() * 25;
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = 2 + Math.random() * 3;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.points = [];
        const sides = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const dist = this.radius * (0.8 + Math.random() * 0.4);
            this.points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = '#4a4a4a';
        ctx.fillStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Powerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = Math.random() > 0.5 ? 'speed' : 'shield';
        this.color = this.type === 'speed' ? '#ffcc00' : '#00ffff';
        this.vy = 2;
    }

    update() {
        this.y += this.vy;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.font = '20px Arial';
        ctx.fillText(this.type === 'speed' ? '⚡' : '🛡️', this.x, this.y + 20);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// --- Background ---

function initStars() {
    stars = [];
    const counts = [100, 50, 20]; // Slow, Medium, Fast
    const speeds = [0.2, 0.5, 1.5];
    for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < counts[layer]; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: speeds[layer],
                size: layer + 1
            });
        }
    }
}

function updateStars() {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });
}

function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.globalAlpha = s.speed / 2;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;
}

// --- Utils ---

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.width || 
             r2.x + r2.width < r1.x || 
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function spawnEntity() {
    if (bossState !== 'none') return; // Pause normal stuff during boss flow

    if (score >= bossSpawnScore) {
        bossState = 'incoming';
        bossMessageTimer = 120; // 2 seconds
        return;
    }

    if (frameCount % 60 === 0) {
        const rand = Math.random();
        if (rand > 0.8) enemies.push(new Enemy('tank'));
        else if (rand > 0.5) enemies.push(new Enemy('zigzag'));
        else enemies.push(new Enemy('basic'));
    }
    if (frameCount % 100 === 0) {
        asteroids.push(new Asteroid());
    }
}

// --- Core Loops ---

function update() {
    frameCount++;
    currentSpeedMultiplier += SPEED_INC;

    updateStars();
    player.update();

    if (screenShake > 0) screenShake *= 0.9;

    bullets.forEach((b, i) => {
        b.update();
        if (b.y < -20) {
            bullets.splice(i, 1);
            return;
        }

        // Bullet hit boss
        if (bossState === 'active' && boss && boss.entryFinished) {
            const dx = b.x - boss.x;
            const dy = b.y - boss.y;
            if (Math.abs(dx) < 60 && Math.abs(dy) < 40) {
                boss.takeDamage(1);
                bullets.splice(i, 1);
                return;
            }
        }
    });

    bossBullets.forEach((b, i) => {
        b.update();
        if (b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20) {
            bossBullets.splice(i, 1);
            return;
        }

        // Boss bullet hit player
        const dx = b.x - (player.x + 20);
        const dy = b.y - (player.y + 20);
        if (Math.sqrt(dx*dx + dy*dy) < 20) {
            bossBullets.splice(i, 1);
            handleCollision(b, i, 'bullet');
        }
    });

    if (bossMessageTimer > 0) bossMessageTimer--;

    if (bossState === 'incoming' && bossMessageTimer <= 0) {
        bossState = 'active';
        boss = new Boss();
    }
    
    if (bossState === 'defeated' && bossMessageTimer <= 0) {
        bossState = 'none';
        boss = null;
    }

    if (bossState === 'active' && boss) {
        boss.update();
        // Collision dragon body with player
        boss.segments.forEach(seg => {
            const dx = seg.x - (player.x + 20);
            const dy = seg.y - (player.y + 20);
            if (Math.sqrt(dx*dx + dy*dy) < 35) {
                handleCollision(seg, 0, 'boss');
            }
        });
    }

    enemies.forEach((e, i) => {
        e.update();
        if (e.y > canvas.height + 50) enemies.splice(i, 1);

        // Bullet hit enemy
        bullets.forEach((b, bi) => {
            if (rectIntersect(b, e)) {
                bullets.splice(bi, 1);
                e.health--;
                if (e.health <= 0) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
                    score += e.type === 'tank' ? 50 : (e.type === 'zigzag' ? 20 : 10);
                    if (e.type === 'tank') {
                        powerups.push(new Powerup(e.x + e.width/2, e.y + e.height/2));
                        if(window.achievements) window.achievements.unlock('space', 'kill_tank', 'Tank Buster');
                    }
                    enemies.splice(i, 1);
                    checkAchievements();
                }
            }
        });

        // Player hit enemy
        if (rectIntersect(player, e)) {
            handleCollision(e, i, 'enemy');
        }
    });

    asteroids.forEach((a, i) => {
        a.update();
        if (a.y > canvas.height + 50) asteroids.splice(i, 1);

        // Player hit asteroid
        const dist = Math.sqrt((player.x + 20 - a.x)**2 + (player.y + 20 - a.y)**2);
        if (dist < a.radius + 15) {
            handleCollision(a, i, 'asteroid');
        }

        // Bullet hit asteroid
        bullets.forEach((b, bi) => {
            const bDist = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2);
            if (bDist < a.radius) {
                bullets.splice(bi, 1);
                createExplosion(a.x, a.y, '#4a4a4a');
                asteroids.splice(i, 1);
                score += 5;
                checkAchievements();
            }
        });
    });

    powerups.forEach((p, i) => {
        p.update();
        if (rectIntersect(player, p)) {
            if (p.type === 'speed') {
                player.speedBoost = true;
                player.speedBoostTimer = 300;
            } else {
                player.shield = true;
            }
            powerups.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.update();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    spawnEntity();
    scoreElement.textContent = score;
}

function handleCollision(entity, index, type) {
    if (player.invulnerable) return; // Ignore collisions if invulnerable

    if (player.shield) {
        player.shield = false;
        player.invulnerable = true;
        player.invulnTimer = 60;
        createExplosion(player.x + 20, player.y + 20, '#00ffff');
        if (type === 'enemy') enemies.splice(index, 1);
        else if (type === 'asteroid') asteroids.splice(index, 1);
        return;
    }

    player.lives--;
    player.invulnerable = true;
    player.invulnTimer = 90; // 1.5s of safety after hit
    createExplosion(player.x + 20, player.y + 20, '#ff0000');
    if (navigator.vibrate) navigator.vibrate(100);
    
    if (type === 'enemy') enemies.splice(index, 1);
    else if (type === 'asteroid') asteroids.splice(index, 1);
    else if (type === 'bullet') bossBullets.splice(index, 1);

    if (player.lives <= 0) {
        gameOver();
    } else {
        player.reset();
    }
}

function draw() {
    // Always clear the full canvas at true coords before any transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShake > 1) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    drawStars();
    particles.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    bossBullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    asteroids.forEach(a => a.draw());
    powerups.forEach(p => p.draw());
    if (bossState === 'active' && boss) boss.draw();
    player.draw();
    drawScore();

    if (bossState === 'incoming') {
        drawBossMessage('WARNING: BOSS INCOMING', '#ff0000');
    } else if (bossState === 'defeated') {
        drawBossMessage('BOSS DEFEATED!', '#00ffcc');
    }
    ctx.restore();

    // Draw lives outside shake so hearts are always at fixed position
    player.drawLives();
}

function drawBossMessage(text, color) {
    ctx.save();
    ctx.fillStyle = bossMessageTimer % 20 < 10 ? color : '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    const fontSize = canvas.width < 500 ? 24 : 40;
    ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

function drawScore() {
    ctx.save();
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffcc';
    ctx.textAlign = 'center';
    
    const isMobile = canvas.width < 800;
    const yTop = isMobile ? 60 : 40;
    
    ctx.fillText(`${score}`, canvas.width / 2, yTop);
    
    ctx.font = '500 14px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 0;
    ctx.fillText(`BEST: ${highScore}`, canvas.width / 2, yTop + 20);
    ctx.restore();
}

function checkAchievements() {
    if (!window.achievements) return;
    if (score >= 1) window.achievements.unlock('space', 'first_kill', 'First Blood');
    if (score >= 100) window.achievements.unlock('space', 'score_100', 'Cadet');
    if (score >= 500) window.achievements.unlock('space', 'score_500', 'Ace Pilot');
    if (score >= 1000) window.achievements.unlock('space', 'score_1000', 'Galaxy Legend');
}

// --- Animation Loop ---

function animate(timestamp) {
    if (!gameRunning || isPaused) return;
    animationFrameId = requestAnimationFrame(animate);
    
    const elapsed = timestamp - lastTime;
    if (elapsed > 16.6) { // ~60fps
        lastTime = timestamp;
        update();
        draw();
    }
}

function startGame() {
    if (gameRunning) return;
    if (window.audioFX) {
        window.audioFX.init();
        // Update mute icon state on start
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    
    gameRunning = true;
    score = 0;
    currentSpeedMultiplier = 1;
    frameCount = 0;
    bullets = [];
    bossBullets = [];
    enemies = [];
    asteroids = [];
    powerups = [];
    particles = [];
    bossState = 'none';
    bossMessageTimer = 0;
    boss = null;
    bossSpawnScore = 800;
    bossDefeatedCount = 0;
    player = new Player();
    initStars();
    
    overlay.classList.add('hidden');
    isPaused = false;
    pauseBtn?.classList.remove('hidden');
    animate(performance.now());
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
    cancelAnimationFrame(animationFrameId);
    if (window.audioFX) window.audioFX.playGameOver();

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        SafeStorage.setItem('spaceShooterBest', highScore);
    }

    overlayTitle.textContent = "Mission Failed";
    overlayMessage.textContent = `Final Score: ${score}`;
    overlay.classList.remove('hidden');
    document.getElementById('shareContainer').classList.remove('hidden');
    startBtn.textContent = "Retry Mission";
}

// --- Initialization ---

function resizeCanvas() {
    const isMobile = window.innerWidth <= 600;
    
    if (isMobile) {
        const aspectRatio = window.innerHeight / window.innerWidth;
        canvas.width = 600;
        canvas.height = 600 * aspectRatio;
    } else {
        canvas.width = 800; // Fixed inner resolution for logic
        canvas.height = 500;
    }
    
    // Update background stars for new size
    initStars();
    
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
}

window.addEventListener('resize', () => {
    try { resizeCanvas(); } catch(e) {}
});
try { resizeCanvas(); } catch(e) {}

startBtn.addEventListener('click', startGame);

pauseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
});
btnResume?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause(false);
});
btnQuit?.addEventListener('click', (e) => {
    e.stopPropagation();
    gameRunning = false;
    isPaused = false;
    cancelAnimationFrame(animationFrameId);
    pauseMenu.classList.add('hidden');
    overlayTitle.textContent = "Neon Shooter";
    overlayMessage.textContent = "Fly through the cosmos. Eliminate all hostiles.";
    startBtn.textContent = "Launch Mission";
    document.getElementById('shareContainer')?.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    
    player = new Player();
    bullets = [];
    bossBullets = [];
    enemies = [];
    asteroids = [];
    powerups = [];
    particles = [];
    score = 0;
    scoreElement.textContent = score;
    initStars();
    draw();
});

btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioFX) {
        window.audioFX.toggleMute();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameRunning && !isPaused) togglePause(true);
});
window.addEventListener('blur', () => {
    if (gameRunning && !isPaused) togglePause(true);
});

function togglePause(forcePause) {
    if (!gameRunning) return;
    
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        cancelAnimationFrame(animationFrameId);
        pauseMenu.classList.remove('hidden');
        if (pauseIcon) pauseIcon.textContent = "▶";
    } else {
        pauseMenu.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now();
        animate(lastTime);
    }
}

// Controls
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameRunning) startGame();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Touch support - 1:1 position following
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) startGame();
    updatePlayerPositionFromTouch(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || !player) return;
    updatePlayerPositionFromTouch(e);
    e.preventDefault();
}, { passive: false });

function updatePlayerPositionFromTouch(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Calculate position relative to canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;
    
    // Smoothly follow but snap for instant response in a shooter
    player.x = touchX - player.width / 2;
    player.y = touchY - player.height - 20; // Offset slightly above finger so visible
    
    // Bounds check
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
}

// Share Logic
function share(platform) {
    const text = `I just scored ${score} in Neon Space Shooter 🚀 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`);
}

document.getElementById('tweetBtn').onclick = () => share('x');
document.getElementById('waBtn').onclick = () => share('wa');

initStars();
draw();
