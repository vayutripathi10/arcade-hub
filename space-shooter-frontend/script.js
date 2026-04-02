const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

// Game State
let score = 0;
let highScore = localStorage.getItem('spaceShooterBest') || 0;
let gameRunning = false;
let frameCount = 0;
let lastTime = 0;
let animationFrameId;

// Entities
let player;
let bullets = [];
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
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Draw shield ring
        if (this.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
        this.drawLives();
    }

    drawLives() {
        ctx.save();
        ctx.font = '700 20px Outfit, sans-serif';
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4444';
        
        const isMobile = window.innerWidth <= 600;
        const startX = isMobile ? 20 : 20;
        const startY = isMobile ? 40 : 40;

        for (let i = 0; i < this.lives; i++) {
            ctx.fillText('❤️', startX + (i * 30), startY);
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

    bullets.forEach((b, i) => {
        b.update();
        if (b.y < -20) bullets.splice(i, 1);
    });

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
    if (player.shield) {
        player.shield = false;
        createExplosion(entity.x || entity.x, entity.y || entity.y, '#00ffff');
        if (type === 'enemy') enemies.splice(index, 1);
        else asteroids.splice(index, 1);
        return;
    }

    player.lives--;
    createExplosion(player.x + 20, player.y + 20, '#ff0000');
    if (navigator.vibrate) navigator.vibrate(100);
    
    if (type === 'enemy') enemies.splice(index, 1);
    else asteroids.splice(index, 1);

    if (player.lives <= 0) {
        gameOver();
    } else {
        player.reset();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    particles.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    asteroids.forEach(a => a.draw());
    powerups.forEach(p => p.draw());
    player.draw();
    drawScore();
}

function drawScore() {
    ctx.save();
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffcc';
    ctx.textAlign = 'right';
    
    const isMobile = window.innerWidth <= 600;
    const margin = 20;
    
    ctx.fillText(`${score}`, canvas.width - margin, isMobile ? 40 : 40);
    
    ctx.font = '500 14px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 0;
    ctx.fillText(`BEST: ${highScore}`, canvas.width - margin, isMobile ? 60 : 60);
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
    if (!gameRunning) return;
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
    if (window.audioFX) window.audioFX.init();
    
    gameRunning = true;
    score = 0;
    currentSpeedMultiplier = 1;
    frameCount = 0;
    bullets = [];
    enemies = [];
    asteroids = [];
    powerups = [];
    particles = [];
    player = new Player();
    initStars();
    
    overlay.classList.add('hidden');
    animate(performance.now());
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    if (window.audioFX) window.audioFX.playGameOver();

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('spaceShooterBest', highScore);
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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

startBtn.addEventListener('click', startGame);

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
