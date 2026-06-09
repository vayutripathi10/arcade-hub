const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const leftZone = document.getElementById('leftTouchZone');
const rightZone = document.getElementById('rightTouchZone');
const tweetBtn = document.getElementById('tweetBtn');
const waBtn = document.getElementById('waBtn');
const pauseBtn = document.getElementById('pauseBtnHUD');
const pauseIcon = pauseBtn?.querySelector('.pause-icon');
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');
const livesContainer = document.getElementById('livesContainer');

// Navigation
document.querySelectorAll('.btn-hub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('hub clicked');
        // window.top.location.href = '../index.html';
    });
});

let CANVAS_W = 800;
let CANVAS_H = 400;

let score = 0;
let highScore = localStorage.getItem('brawlerHighScore') || 0;
highScoreEl.textContent = highScore;

let gameRunning = false;
let isPaused = false;
let frameId;
let lastTime = 0;
const fpsInterval = 1000 / 60;

// Game Entities
let player;
let enemies = [];
let particles = [];
let spawnTimer = 0;
let spawnInterval = 100;
let gameSpeedMultiplier = 1;
let screenShake = 0;

// Sky & Juice Entities
let stars = [];
let clouds = [];
let windLines = [];
let slashArcs = [];
let impactRings = [];
let exhaustSparks = [];
let floatingTexts = [];
let flashAlpha = 0;
let flashColor = '#ffffff';
let milestoneText = "";
let milestoneTimer = 0;

// Evolution State
let currentStage = 0; // 0: Cyan, 1: Purple, 2: Red
let comboGlow = 0;
let bossActive = false;
let boss = null;
let warningTimer = 0;

const STAGE_COLORS = ['#00ffcc', '#bc13fe', '#ff3366'];
const HIT_RANGE = 140; 
const KILL_RANGE = 35; 
const BOSS_THRESHOLD = 100;

function initGame() {
    score = 0;
    scoreEl.textContent = '0';
    spawnTimer = 0;
    spawnInterval = 90;
    gameSpeedMultiplier = 1;
    enemies = [];
    particles = [];
    slashArcs = [];
    impactRings = [];
    exhaustSparks = [];
    floatingTexts = [];
    flashAlpha = 0;
    milestoneText = "";
    milestoneTimer = 0;
    
    player = {
        x: CANVAS_W / 2,
        y: CANVAS_H / 2 + 50,
        state: 'idle',
        timer: 0,
        lives: 3,
        invulnerable: false,
        invulnTimer: 0
    };
    currentStage = 0;
    bossActive = false;
    boss = null;
    warningTimer = 0;
    
    updateLivesUI();
    generateEnvironment();

    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    lastTime = performance.now();
    loop(lastTime);
}

function updateLivesUI() {
    if (!livesContainer) return;
    let heartsHTML = '';
    for (let i = 0; i < 3; i++) {
        if (i < player.lives) {
            heartsHTML += '<span class="heart">❤️</span>';
        } else {
            heartsHTML += '<span class="heart empty">❤️</span>';
        }
    }
    livesContainer.innerHTML = heartsHTML;
}

function resizeCanvas() {
    const wrapper = document.querySelector('.game-wrapper');
    if (!wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    CANVAS_W = canvas.width;
    CANVAS_H = canvas.height;
    if (player) {
        player.x = CANVAS_W / 2;
        player.y = CANVAS_H / 2 + 50;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function attack(direction) {
    if (!gameRunning || isPaused || player.state === 'dead') return;
    
    player.state = direction === 'left' ? 'attackLeft' : 'attackRight';
    player.timer = 8; 

    // Spawn attack slash arc
    const arcX = player.x + (direction === 'left' ? -25 : 25);
    const arcY = player.y - 20;
    slashArcs.push(new SlashArc(arcX, arcY, STAGE_COLORS[currentStage], direction));
    
    // Boss projectile reflection check
    if (bossActive && boss) {
        boss.projectiles.forEach(p => {
            if (!p.reflected && ((direction === 'left' && p.x < player.x) || (direction === 'right' && p.x > player.x))) {
                let dist = Math.abs(p.x - player.x);
                if (dist < HIT_RANGE) {
                    p.reflected = true;
                    p.vx = -p.vx * 1.5;
                    screenShake = 5;
                    impactRings.push(new ImpactRing(p.x, p.y, '#00ffff'));
                    if (window.audioFX) window.audioFX.playJump();
                }
            }
        });
    }

    let closestEnemy = null;
    let closestDist = Infinity;
    
    for (let e of enemies) {
        if (e.dead) continue;
        if ((direction === 'left' && e.side === 'left') || (direction === 'right' && e.side === 'right')) {
            let dist = Math.abs(e.x - player.x);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = e;
            }
        }
    }
    
    if (closestEnemy && closestDist < HIT_RANGE) {
        // Check for perfect strike timing!
        const isPerfect = closestDist >= 105 && closestDist <= 140;
        const damageDealt = isPerfect ? 2 : 1;
        closestEnemy.hp -= damageDealt;
        
        if (closestEnemy.hp <= 0) {
            closestEnemy.dead = true;
            closestEnemy.vx = (direction === 'left' ? -18 : 18);
            closestEnemy.vy = -12;
            closestEnemy.rotation = 0;
            closestEnemy.rotationSpeed = direction === 'left' ? -0.25 : 0.25;
            
            const pointsGained = isPerfect ? 2 : 1;
            score += pointsGained;
            scoreEl.textContent = score;
            
            // Impact effects
            spawnParticles(closestEnemy.x, closestEnemy.y, STAGE_COLORS[currentStage]);
            impactRings.push(new ImpactRing(closestEnemy.x, closestEnemy.y, isPerfect ? '#ffcc00' : STAGE_COLORS[currentStage]));
            
            if (isPerfect) {
                // Flash screen white for perfect timing
                flashAlpha = 0.55;
                flashColor = '#ffffff';
                floatingTexts.push(new FloatingText(closestEnemy.x, closestEnemy.y - 30, "PERFECT! +2", '#ffcc00'));
                screenShake = closestEnemy.type === 'elite' ? 16 : 10;
                
                // Extra blast particles
                for (let i = 0; i < 15; i++) {
                    particles.push({
                        x: closestEnemy.x, y: closestEnemy.y,
                        vx: (Math.random() - 0.5) * 18,
                        vy: (Math.random() - 0.5) * 18,
                        life: 1.0, color: '#ffffff'
                    });
                }
                
                if (window.audioFX) {
                    if (typeof window.audioFX.playExplosion === 'function') {
                        window.audioFX.playExplosion();
                    } else {
                        window.audioFX.playEat();
                    }
                }
            } else {
                floatingTexts.push(new FloatingText(closestEnemy.x, closestEnemy.y - 30, "HIT", STAGE_COLORS[currentStage]));
                screenShake = closestEnemy.type === 'elite' ? 8 : 3;
                if (window.audioFX) window.audioFX.playEat();
            }

            // Milestone check
            if ([10, 25, 50, 75, 100].includes(score)) {
                if (score === 10) milestoneText = "10 STREAK: WARM UP!";
                else if (score === 25) milestoneText = "25 STREAK: UNSTOPPABLE!";
                else if (score === 50) milestoneText = "50 STREAK: DOMINATING!";
                else if (score === 75) milestoneText = "75 STREAK: SKY BRAWLER!";
                else if (score === 100) milestoneText = "100 STREAK: ASCENDED GOD!";
                
                milestoneTimer = 100;
                if (window.audioFX && typeof window.audioFX.playLevelUp === 'function') {
                    window.audioFX.playLevelUp();
                }
            }

            // Evolution / Stage Logic
            if (score > 0 && score % 50 === 0) {
                currentStage = Math.min(2, Math.floor(score / 50));
                comboGlow = 30;
                if (navigator.vibrate) navigator.vibrate(100);
            }

            if (score === BOSS_THRESHOLD && !bossActive) {
                triggerBoss();
            }
        } else {
            // Shield hit
            spawnParticles(closestEnemy.x, closestEnemy.y, '#ffffff');
            floatingTexts.push(new FloatingText(closestEnemy.x, closestEnemy.y - 30, "BLOCK", '#ffffff'));
            if (window.audioFX) window.audioFX.playJump();
            screenShake = 4;
        }
    } else {
        if (window.audioFX) window.audioFX.playJump(); 
    }
}

function takeDamage() {
    if (player.invulnerable || !gameRunning) return;
    
    player.lives--;
    updateLivesUI();
    player.invulnerable = true;
    player.invulnTimer = 90; // 1.5s invulerability
    screenShake = 20;
    
    flashAlpha = 0.7;
    flashColor = 'rgba(255, 0, 51, 0.4)';
    
    if (navigator.vibrate) navigator.vibrate(100);
    spawnParticles(player.x, player.y - 20, '#ff0000');
    
    if (player.lives <= 0) {
        gameOver();
    }
}

function triggerBoss() {
    bossActive = true;
    warningTimer = 180; // 3 seconds
    boss = new Wyrm();
    if (window.audioFX) window.audioFX.playGameOver(); // Reuse for alert
}

class Wyrm {
    constructor() {
        this.x = -200;
        this.y = player.y - 120;
        this.health = 5;
        this.maxHealth = 5;
        this.projectiles = [];
        this.lastShot = 0;
        this.sinOffset = 0;
        this.active = false;
        this.color = '#ff00ff';
        this.segments = [];
        for(let i=0; i<10; i++) this.segments.push({x: -200, y: this.y});
    }

    update(deltaTime) {
        if (warningTimer > 0) return;
        this.active = true;
        this.sinOffset += 0.04 * deltaTime;
        this.x = (CANVAS_W/2) + Math.sin(this.sinOffset) * (CANVAS_W/2.5);
        this.y = (CANVAS_H/2 - 100) + Math.cos(this.sinOffset * 0.5) * 50;

        // Follow logic
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        for(let i=this.segments.length-1; i>0; i--) {
            this.segments[i].x += (this.segments[i-1].x - this.segments[i].x) * 0.2 * deltaTime;
            this.segments[i].y += (this.segments[i-1].y - this.segments[i].y) * 0.2 * deltaTime;
        }

        // Shooting
        if (Date.now() - this.lastShot > 2500) {
            this.lastShot = Date.now();
            this.fire();
        }

        // Projectiles
        for(let i=this.projectiles.length-1; i>=0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            
            // Reflected hit boss
            if (p.reflected) {
                let dx = p.x - this.x;
                let dy = p.y - this.y;
                if (Math.sqrt(dx*dx + dy*dy) < 60) {
                    this.health--;
                    this.projectiles.splice(i, 1);
                    screenShake = 15;
                    if (this.health <= 0) this.die();
                    continue;
                }
            }

            // Hit player
            if (!p.reflected && Math.abs(p.x - player.x) < 30) {
                takeDamage();
            }

            if (p.x < -100 || p.x > CANVAS_W + 100) this.projectiles.splice(i, 1);
        }
    }

    fire() {
        let side = this.x < player.x ? -1 : 1;
        this.projectiles.push({
            x: this.x,
            y: player.y,
            vx: side === -1 ? 8 : -8,
            reflected: false,
            color: '#00ffff'
        });
    }

    die() {
        bossActive = false;
        score += 500;
        scoreEl.textContent = score;
        spawnParticles(this.x, this.y, '#ffffff');
        boss = null;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 10;
        
        ctx.beginPath();
        this.segments.forEach((s, i) => {
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();

        this.projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 15, 0, Math.PI*2);
            ctx.fill();
        });

        // Health bar
        const bw = 300;
        const bx = (CANVAS_W - bw)/2;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(bx, 50, bw, 8);
        ctx.fillStyle = this.color;
        ctx.fillRect(bx, 50, bw * (this.health/this.maxHealth), 8);
    }
}

class Star {
    constructor() {
        this.x = Math.random() * CANVAS_W;
        this.y = Math.random() * (CANVAS_H * 0.7); // Top sky
        this.size = Math.random() * 1.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        this.phase = Math.random() * Math.PI * 2;
    }
    update(deltaTime) {
        this.phase += this.twinkleSpeed * deltaTime;
        this.x -= 0.05 * deltaTime;
        if (this.x < 0) this.x = CANVAS_W;
    }
    draw(ctx) {
        const alpha = 0.3 + Math.abs(Math.sin(this.phase)) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Cloud {
    constructor(layer) {
        this.layer = layer; // 'bg' or 'fg'
        this.x = Math.random() * (CANVAS_W + 300) - 150;
        this.y = layer === 'bg' 
            ? Math.random() * (CANVAS_H * 0.45) + 20 
            : player.y + 35 + Math.random() * 30; // Under deck
        this.size = layer === 'bg' 
            ? Math.random() * 80 + 60 
            : Math.random() * 50 + 30;
        this.speed = layer === 'bg' 
            ? Math.random() * 0.15 + 0.05 
            : Math.random() * 0.4 + 0.2;
        this.opacity = layer === 'bg' ? 0.08 : 0.15;
        this.color = layer === 'bg' ? '#bc13fe' : '#00ffcc'; // Purple bg, Cyan fg
    }
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
        if (this.x < -this.size * 2) {
            this.x = CANVAS_W + this.size * 2;
            this.y = this.layer === 'bg' 
                ? Math.random() * (CANVAS_H * 0.45) + 20 
                : player.y + 35 + Math.random() * 30;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.2, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x - this.size * 0.6, this.y - this.size * 0.1, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class WindLine {
    constructor() {
        this.x = Math.random() * CANVAS_W;
        this.y = Math.random() * CANVAS_H;
        this.length = Math.random() * 80 + 40;
        this.speed = Math.random() * 4 + 3;
        this.opacity = Math.random() * 0.15 + 0.05;
    }
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
        if (this.x < -this.length) {
            this.x = CANVAS_W + this.length;
            this.y = Math.random() * CANVAS_H;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = '#00ffcc';
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.stroke();
        ctx.restore();
    }
}

class SlashArc {
    constructor(x, y, color, direction) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = direction; // 'left' or 'right'
        this.life = 1.0;
        this.decay = 0.15;
        this.radius = 45;
    }
    update(deltaTime) {
        this.life -= this.decay * deltaTime;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6 * this.life + 1;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        if (this.direction === 'left') {
            ctx.arc(this.x, this.y, this.radius, -Math.PI * 0.6, Math.PI * 0.6, true);
        } else {
            ctx.arc(this.x, this.y, this.radius, -Math.PI * 0.4, Math.PI * 0.4, false);
        }
        ctx.stroke();
        ctx.restore();
    }
}

class ImpactRing {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 5;
        this.maxRadius = 55;
        this.life = 1.0;
        this.decay = 0.12;
    }
    update(deltaTime) {
        this.life -= this.decay * deltaTime;
        this.radius += (this.maxRadius - this.radius) * 0.25 * deltaTime;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.life + 0.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class ExhaustSpark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 4 + 2; // Spraying downward
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.03;
        this.color = Math.random() > 0.5 ? '#ff6600' : '#ffff00'; // Fire colors
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= this.decay * deltaTime;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.03;
        this.vy = -1.5;
    }
    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.life -= this.decay * deltaTime;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

function generateEnvironment() {
    stars = [];
    clouds = [];
    windLines = [];
    
    // Generate stars
    for (let i = 0; i < 50; i++) {
        stars.push(new Star());
    }
    
    // Generate background clouds
    for (let i = 0; i < 5; i++) {
        clouds.push(new Cloud('bg'));
    }
    
    // Generate foreground clouds
    for (let i = 0; i < 4; i++) {
        clouds.push(new Cloud('fg'));
    }
    
    // Generate wind lines
    for (let i = 0; i < 6; i++) {
        windLines.push(new WindLine());
    }
}

function createEnemy() {
    if (bossActive) return; // Stop enemies during boss
    let side = Math.random() > 0.5 ? 'left' : 'right';
    let type = score > 30 && Math.random() > 0.7 ? 'elite' : 'basic';
    enemies.push({
        x: side === 'left' ? -30 : CANVAS_W + 30,
        y: player.y,
        vx: (side === 'left' ? 3.5 : -3.5) * gameSpeedMultiplier,
        vy: 0,
        side: side,
        dead: false,
        hp: type === 'elite' ? 2 : 1,
        type: type
    });
}

function spawnParticles(x, y, color) {
    for (let i=0; i<10; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random()-0.5)*12,
            vy: (Math.random()-0.5)*12,
            life: 1.0, color: color
        });
    }
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
    player.state = 'dead';
    if (window.audioFX) window.audioFX.playGameOver();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('brawlerHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    document.getElementById('overlayTitle').textContent = "Knockout!";
    document.getElementById('overlayMessage').innerHTML = `Final Streak: ${score}<br>You were overwhelmed!`;
    document.getElementById('shareContainer').classList.remove('hidden');
    startBtn.textContent = "Fight Again";
    overlay.classList.remove('hidden');
}

function update(deltaTime) {
    if (player.state === 'attackLeft' || player.state === 'attackRight') {
        player.timer -= deltaTime;
        if (player.timer <= 0) player.state = 'idle';
    }
    
    if (screenShake > 0) screenShake *= Math.pow(0.9, deltaTime);
    if (comboGlow > 0) comboGlow -= deltaTime;
    
    if (player.invulnerable) {
        player.invulnTimer -= deltaTime;
        if (player.invulnTimer <= 0) player.invulnerable = false;
    }

    if (flashAlpha > 0) {
        flashAlpha -= 0.08 * deltaTime;
    }

    if (milestoneTimer > 0) {
        milestoneTimer -= deltaTime;
    }

    // Update sky elements
    stars.forEach(s => s.update(deltaTime));
    clouds.forEach(c => c.update(deltaTime));
    windLines.forEach(wl => wl.update(deltaTime));

    // Update slashes and rings
    slashArcs.forEach(sa => sa.update(deltaTime));
    slashArcs = slashArcs.filter(sa => sa.life > 0);
    
    impactRings.forEach(ir => ir.update(deltaTime));
    impactRings = impactRings.filter(ir => ir.life > 0);
    
    exhaustSparks.forEach(es => es.update(deltaTime));
    exhaustSparks = exhaustSparks.filter(es => es.life > 0);
    
    floatingTexts.forEach(ft => ft.update(deltaTime));
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    if (!bossActive) {
        spawnTimer += deltaTime;
        if (spawnTimer >= spawnInterval) {
            createEnemy();
            spawnTimer = 0;
        }
    } else if (boss) {
        boss.update(deltaTime);
        if (warningTimer > 0) warningTimer -= deltaTime;
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.vx * deltaTime;
        e.y += e.vy * deltaTime;
        
        if (e.dead) {
            e.vy += 0.8 * deltaTime; 
            // Dead enemy dynamic rotation
            e.rotation = (e.rotation || 0) + (e.rotationSpeed || 0.15) * deltaTime;
            
            // Smoke trail particles
            if (Math.random() < 0.35) {
                particles.push({
                    x: e.x, y: e.y - 10,
                    vx: -e.vx * 0.2 + (Math.random() - 0.5) * 3,
                    vy: -e.vy * 0.2 + (Math.random() - 0.5) * 3,
                    life: 0.4 + Math.random() * 0.3,
                    maxLife: 0.7,
                    color: STAGE_COLORS[currentStage]
                });
            }
            
            if (e.y > CANVAS_H + 100) enemies.splice(i, 1);
        } else {
            let dist = Math.abs(e.x - player.x);
            if (dist < KILL_RANGE) {
                takeDamage();
                if (e.hp > 0) { // Push back slightly
                    e.x += e.side === 'left' ? -50 * deltaTime : 50 * deltaTime; 
                }
            }
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= 0.04 * deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.save();
    if (screenShake > 1) {
        ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
    }
    
    // 1. Celestial Atmospheric Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    skyGrad.addColorStop(0, '#04020a');
    skyGrad.addColorStop(0.3, '#0b061e');
    skyGrad.addColorStop(0.65, '#3a1146'); // twilight violet
    skyGrad.addColorStop(0.85, '#d44b68'); // sunset pink
    skyGrad.addColorStop(1.0, '#1c1c3c'); // horizon blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // 2. Draw stars
    stars.forEach(s => s.draw(ctx));
    
    // 3. Draw Background Clouds (layer bg)
    clouds.forEach(c => {
        if (c.layer === 'bg') c.draw(ctx);
    });
    
    // 4. Draw Wind Lines
    windLines.forEach(wl => wl.draw(ctx));
    
    // 5. Draw Platform Deck (Suspended sky runway)
    const deckY = player.y + 20;
    
    // Bottom brackets/thrusters support structure
    ctx.save();
    ctx.fillStyle = '#1e1a2f';
    ctx.strokeStyle = '#392e5c';
    ctx.lineWidth = 2;
    const nozzlesX = [CANVAS_W * 0.25, CANVAS_W * 0.5, CANVAS_W * 0.75];
    nozzlesX.forEach(nx => {
        ctx.beginPath();
        ctx.moveTo(nx - 20, deckY);
        ctx.lineTo(nx - 12, deckY + 15);
        ctx.lineTo(nx + 12, deckY + 15);
        ctx.lineTo(nx + 20, deckY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Fire/glow from nozzles
        const fireHeight = 25 + Math.random() * 15;
        const fireGrad = ctx.createLinearGradient(0, deckY + 15, 0, deckY + 15 + fireHeight);
        fireGrad.addColorStop(0, 'rgba(0, 255, 204, 0.75)');
        fireGrad.addColorStop(0.4, 'rgba(188, 19, 254, 0.4)');
        fireGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.moveTo(nx - 12, deckY + 15);
        ctx.quadraticCurveTo(nx, deckY + 15 + fireHeight * 1.2, nx + 12, deckY + 15);
        ctx.closePath();
        ctx.fill();
        
        // Spawn exhaust sparks
        if (Math.random() < 0.25 && gameRunning && !isPaused) {
            exhaustSparks.push(new ExhaustSpark(nx + (Math.random() - 0.5) * 20, deckY + 15));
        }
    });
    ctx.restore();

    // Draw platform deck beams
    ctx.save();
    let baseColor = STAGE_COLORS[currentStage];
    ctx.strokeStyle = comboGlow > 0 ? '#ffffff' : baseColor;
    ctx.lineWidth = comboGlow > 0 ? 5 : 4;
    ctx.shadowBlur = comboGlow > 0 ? 25 : 15;
    ctx.shadowColor = baseColor;
    
    // Main deck bar
    ctx.beginPath();
    ctx.moveTo(0, deckY);
    ctx.lineTo(CANVAS_W, deckY);
    ctx.stroke();
    
    // Under-deck support wire
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, deckY + 6);
    ctx.lineTo(CANVAS_W, deckY + 6);
    ctx.stroke();
    ctx.restore();

    // 6. Draw Foreground Clouds
    clouds.forEach(c => {
        if (c.layer === 'fg') c.draw(ctx);
    });

    // Draw exhaust sparks
    exhaustSparks.forEach(es => es.draw(ctx));

    // Range Indicator (glowing floor segment under player)
    ctx.fillStyle = currentStage > 0 ? `rgba(${currentStage === 1 ? '188, 19, 254' : '255, 51, 102'}, 0.05)` : 'rgba(0, 255, 204, 0.03)';
    ctx.fillRect(player.x - HIT_RANGE, player.y - 40, HIT_RANGE*2, 60);

    // Warning
    if (warningTimer > 0) {
        ctx.font = '700 40px Outfit, sans-serif';
        ctx.fillStyle = warningTimer % 20 < 10 ? '#ff0000' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('WARNING: BOSS INCOMING', CANVAS_W/2, CANVAS_H/2);
    }

    // Draw impact rings
    impactRings.forEach(ir => ir.draw(ctx));

    const pColor = player.state === 'dead' ? '#555' : STAGE_COLORS[currentStage];
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = pColor;
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    let px = player.x;
    let py = player.y;
    
    if (player.invulnerable && frameCount % 10 < 5) {
        ctx.globalAlpha = 0.4;
    }

    if (player.state === 'attackLeft') px -= 15;
    if (player.state === 'attackRight') px += 15;
    
    ctx.beginPath();
    ctx.arc(px, py - 40, 10, 0, Math.PI * 2); // Head
    ctx.moveTo(px, py - 30); ctx.lineTo(px, py - 10); // Spine
    ctx.moveTo(px, py - 10); ctx.lineTo(px - 15, py + 15); // L Leg
    ctx.moveTo(px, py - 10); ctx.lineTo(px + 15, py + 15); // R Leg
    
    if (player.state === 'attackLeft') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 35, py - 20); // punch L
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 15, py - 5);  // off arm
    } else if (player.state === 'attackRight') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 35, py - 20); // punch R
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 15, py - 5);  // off arm
    } else {
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 20, py - 10); // idle arm L
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 20, py - 10); // idle arm R
    }
    ctx.stroke();
    ctx.restore();

    // Hexagonal energy shield bubble
    if (player.invulnerable) {
        ctx.save();
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15 + Math.sin(frameCount * 0.2) * 5;
        ctx.fillStyle = 'rgba(0, 255, 204, 0.06)';
        
        ctx.beginPath();
        const cx = px;
        const cy = py - 20;
        const r = 35;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (frameCount * 0.02);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    for (let e of enemies) {
        ctx.shadowBlur = e.dead ? 0 : 15;
        let eColor = e.dead ? '#333' : (e.type === 'elite' ? '#ffcc00' : '#ff3366');
        ctx.shadowColor = eColor;
        ctx.strokeStyle = eColor;
        
        ctx.save();
        ctx.translate(e.x, e.y - 10);
        if (e.dead) {
            ctx.rotate(e.rotation || (e.vx * 0.1)); 
        }
        
        let time = performance.now() / 100;
        let stride = e.dead ? 5 : Math.sin(time + e.x) * 15;
        let armSwing = e.dead ? -5 : Math.sin(time + e.x + Math.PI) * 15;
        
        ctx.beginPath();
        // Shield for elite
        if (e.type === 'elite' && e.hp > 1) {
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, -15, 45, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.arc(0, -30, 9, 0, Math.PI * 2); // Head
        ctx.moveTo(0, -21); ctx.lineTo(0, 0); // Spine
        ctx.moveTo(0, 0); ctx.lineTo(-stride, 25); // Leg 1
        ctx.moveTo(0, 0); ctx.lineTo(stride, 25); // Leg 2
        
        if (e.dead) {
            ctx.moveTo(0, -10); ctx.lineTo(-20, -20);
            ctx.moveTo(0, -10); ctx.lineTo(20, -20);
        } else {
            ctx.moveTo(0, -10); ctx.lineTo(-armSwing - 10, 0); // Arm L
            ctx.moveTo(0, -10); ctx.lineTo(armSwing + 10, 0); // Arm R
        }
        ctx.stroke();
        ctx.restore();
    }

    if (bossActive && boss) boss.draw();
    
    // Draw particles
    ctx.shadowBlur = 10;
    for (let p of particles) {
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Draw attack slash arcs
    slashArcs.forEach(sa => sa.draw(ctx));

    // Draw floating texts
    floatingTexts.forEach(ft => ft.draw(ctx));

    // Milestone Announcements
    if (milestoneTimer > 0) {
        ctx.save();
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 20;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const scale = 1.0 + Math.abs(Math.sin(frameCount * 0.15)) * 0.1;
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 60);
        ctx.scale(scale, scale);
        
        ctx.fillText(milestoneText, 0, 0);
        ctx.restore();
    }

    // Fullscreen Flash Overlay
    if (flashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = Math.min(0.85, flashAlpha);
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
    }

    ctx.restore(); 
}

let frameCount = 0;
function loop(timestamp = 0) {
    if (isPaused) return;
    if (gameRunning) {
        frameCount++;
        frameId = requestAnimationFrame(loop);
        if (!lastTime) lastTime = timestamp;
        let dt = timestamp - lastTime;
        lastTime = timestamp;
        
        let deltaTime = Math.min(dt / 16.67, 3);
        
        update(deltaTime);
        draw();
    } else if (player && player.state === 'dead') {
        draw();
    }
}

startBtn.addEventListener('click', initGame);
window.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        if(e.key === ' ' || e.key === 'Enter') initGame();
        return;
    }
    if (isPaused) return;
    if (e.key === 'ArrowLeft') attack('left');
    if (e.key === 'ArrowRight') attack('right');
});
leftZone.addEventListener('mousedown', () => attack('left'));
rightZone.addEventListener('mousedown', () => attack('right'));
leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('left'); }, {passive: false});
rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('right'); }, {passive: false});

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
    cancelAnimationFrame(frameId);
    pauseMenu.classList.add('hidden');
    document.getElementById('overlayTitle').textContent = "Neon Brawler";
    document.getElementById('overlayMessage').innerHTML = "Enemies approach from both sides.<br>Tap Left/Right or use Arrow Keys to strike!";
    startBtn.textContent = "Start Fighting";
    document.getElementById('shareContainer')?.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    
    player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle', lives: 3 };
    updateLivesUI();
    enemies = [];
    particles = [];
    slashArcs = [];
    impactRings = [];
    exhaustSparks = [];
    floatingTexts = [];
    flashAlpha = 0;
    milestoneText = "";
    milestoneTimer = 0;
    score = 0;
    scoreEl.textContent = '0';
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
        cancelAnimationFrame(frameId);
        pauseMenu.classList.remove('hidden');
        if (pauseIcon) pauseIcon.textContent = "▶";
    } else {
        pauseMenu.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now();
        loop(lastTime);
    }
}

function shareScore(platform) {
    const text = `I just reached a streak of ${score} in Neon Brawler 🥊 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}
tweetBtn.addEventListener('click', () => shareScore('twitter'));
waBtn.addEventListener('click', () => shareScore('whatsapp'));

// Idle screen initialization
player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle', lives: 3 };
updateLivesUI();
generateEnvironment();
draw();
