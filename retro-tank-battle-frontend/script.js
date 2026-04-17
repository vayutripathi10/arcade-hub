const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameWrapper = document.getElementById('gameWrapper');

// HUD/UI
const uiScore = document.getElementById('ui-score');
const hqHpBar = document.getElementById('hq-hp-bar');
const playerHpBar = document.getElementById('player-hp-bar');
const uiStage = document.getElementById('ui-stage');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');
const stageOverlay = document.getElementById('stageOverlay');

// Asset Loading
const assets = {};
const assetFiles = {
    playerTank: 'assets/player_tank.png',
    enemyTank: 'assets/enemy_tank.png',
    baseHQ: 'assets/base_hq.png',
    tileBrick: 'assets/tile_brick.png',
    tileSteel: 'assets/tile_steel.png',
    tileGrass: 'assets/tile_grass.png',
    tileWater: 'assets/tile_water.png'
};

let assetsLoaded = 0;
const totalAssets = Object.keys(assetFiles).length;

function loadAssets() {
    for (let key in assetFiles) {
        const img = new Image();
        img.src = assetFiles[key];
        img.onload = () => {
            assets[key] = img;
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log("All assets loaded.");
            }
        };
    }
}
loadAssets();

// Game Constants
const TILE_SIZE = 32;
const MAP_COLS = 25; // 800px / 32
const MAP_ROWS = 18; // 576px (roughly 600)
const TANK_SIZE = 48;

// Game State
let gameState = 'menu';
let score = 0;
let kills = 0;
let hqHP = 100;
let lastTime = 0;
let currentStage = 1;
let enemiesInStageRemaining = 0;
let enemiesSpawnedInStage = 0;
let totalEnemiesInStage = 5;

let enemies = [];
let bullets = [];
let particles = [];
let powerUps = [];
let enemySpawnTimer = 0;
let spawnRate = 3000;
let freezeTimer = 0;
let deathAnimationTimer = 0;

// Tile Map (0: Empty, 1: Brick, 2: Steel, 3: Grass, 4: Water)
let map = [];
function initMap() {
    map = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        map[r] = [];
        for (let c = 0; c < MAP_COLS; c++) {
            // Borders
            if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
                map[r][c] = 2; // Steel
            } else {
                map[r][c] = 0;
                // Random obstacles
                if (Math.random() < 0.15) map[r][c] = 1; // Brick
                if (Math.random() < 0.05) map[r][c] = 2; // Steel
            }
        }
    }
    // Clear area around HQ
    const midX = Math.floor(MAP_COLS / 2);
    for (let r = MAP_ROWS - 4; r < MAP_ROWS - 1; r++) {
        for (let c = midX - 2; c <= midX + 2; c++) {
            if (map[r] && map[r][c] !== undefined) map[r][c] = 0;
        }
    }
    
    // Clear Player Spawn Area (Centered at MAP_ROWS-5, midX)
    for (let r = MAP_ROWS - 7; r < MAP_ROWS - 3; r++) {
        for (let c = midX - 2; c <= midX + 2; c++) {
            if (map[r] && map[r][c] !== undefined) map[r][c] = 0;
        }
    }

    // Clear Enemy Spawn Area (Top)
    for (let r = 1; r < 4; r++) {
        for (let c = 1; c < MAP_COLS - 1; c++) {
            if (map[r] && map[r][c] !== undefined) {
                // Keep top row mostly clear
                if (Math.random() < 0.8) map[r][c] = 0;
            }
        }
    }
}

// PowerUp Types
const POWERUP_TYPES = ['shield', 'freeze', 'multi', 'strong', 'speed'];

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.life = 10000; // 10 seconds to collect
        this.spawnTime = Date.now();
    }

    draw() {
        const glow = Math.sin(Date.now() / 200) * 5 + 5;
        ctx.shadowBlur = glow;
        ctx.shadowColor = '#fff';

        let color = '#fff';
        let char = '?';
        if (this.type === 'shield') { color = '#00ccff'; char = 'S'; }
        if (this.type === 'freeze') { color = '#00ffff'; char = 'F'; }
        if (this.type === 'multi') { color = '#ff00ff'; char = 'M'; }
        if (this.type === 'strong') { color = '#ff4400'; char = 'B'; }
        if (this.type === 'speed') { color = '#ffff00'; char = 'V'; }

        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#000';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(char, this.x + 5, this.y + 18);
        
        ctx.shadowBlur = 0;
    }
}

class Tank {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dir = 0; 
        this.speed = type === 'player' ? 3 : Math.min(2.5, 1.5 + (currentStage * 0.1));
        this.width = TANK_SIZE;
        this.height = TANK_SIZE;
        // HITBOX: Slightly smaller than visual size for better movement through gaps
        this.hitboxW = 38;
        this.hitboxH = 38;
        this.hp = type === 'player' ? 100 : 20;
        this.lastShot = 0;
        this.shotCooldown = type === 'player' ? 500 : Math.max(800, 2000 - (currentStage * 100));
        this.moving = false;

        // Power-up States
        this.shield = 0; 
        this.multiShotTimer = 0;
        this.strongBulletTimer = 0;
        this.speedTimer = 0;
        this.visible = true; // NEW
    }

    draw() {
        if (!this.visible) return; // Skip if exploding
        const img = this.type === 'player' ? assets.playerTank : assets.enemyTank;
        if (!img) return;

        // Draw Shield
        if (this.type === 'player' && this.shield > 0) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = Date.now() / 50;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.dir * Math.PI / 2);
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    move(dt) {
        if (this.type === 'enemy' || (this.type === 'player' && this.moving)) {
            let nextX = this.x;
            let nextY = this.y;
            const dist = this.speed;

            if (this.dir === 0) nextY -= dist;
            if (this.dir === 1) nextX += dist;
            if (this.dir === 2) nextY += dist;
            if (this.dir === 3) nextX -= dist;

            if (!this.checkCollision(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            } else if (this.type === 'enemy') {
                // Enemy AI: Change direction if hit wall
                if (Math.random() < 0.05) {
                    this.dir = Math.floor(Math.random() * 4);
                }
            }
        }
    }

    checkCollision(nx, ny) {
        // Calculate hitbox centered coordinates
        const hx = nx + (this.width - this.hitboxW) / 2;
        const hy = ny + (this.height - this.hitboxH) / 2;

        // Map bounds
        if (hx < TILE_SIZE || hx + this.hitboxW > canvas.width - TILE_SIZE || 
            hy < TILE_SIZE || hy + this.hitboxH > canvas.height - TILE_SIZE) return true;

        // Tile overlap check
        const left = Math.floor(hx / TILE_SIZE);
        const right = Math.floor((hx + this.hitboxW) / TILE_SIZE);
        const top = Math.floor(hy / TILE_SIZE);
        const bottom = Math.floor((hy + this.hitboxH) / TILE_SIZE);

        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                if (map[r] && (map[r][c] === 1 || map[r][c] === 2 || map[r][c] === 4)) return true;
            }
        }

        // HQ Collision
        const hqX = (MAP_COLS / 2) * TILE_SIZE - TILE_SIZE;
        const hqY = (MAP_ROWS - 2) * TILE_SIZE;
        const hqW = TILE_SIZE * 2;
        const hqH = TILE_SIZE * 2;
        
        if (hx < hqX + hqW && hx + this.hitboxW > hqX && 
            hy < hqY + hqH && hy + this.hitboxH > hqY) return true;

        return false;
    }

    shoot() {
        const now = Date.now();
        // Speed powerup reduces cooldown
        const effectiveCooldown = (this.type === 'player' && this.speedTimer > 0) ? this.shotCooldown / 1.8 : this.shotCooldown;
        if (now - this.lastShot < effectiveCooldown) return;

        let bx = this.x + this.width / 2;
        let by = this.y + this.height / 2;
        
        if (this.type === 'player' && this.multiShotTimer > 0) {
            // Triple shot spread
            bullets.push(new Bullet(bx, by, this.dir, this.type, this.strongBulletTimer > 0));
            const offset = 12;
            if (this.dir === 0 || this.dir === 2) {
                bullets.push(new Bullet(bx - offset, by, this.dir, this.type, this.strongBulletTimer > 0));
                bullets.push(new Bullet(bx + offset, by, this.dir, this.type, this.strongBulletTimer > 0));
            } else {
                bullets.push(new Bullet(bx, by - offset, this.dir, this.type, this.strongBulletTimer > 0));
                bullets.push(new Bullet(bx, by + offset, this.dir, this.type, this.strongBulletTimer > 0));
            }
        } else {
            bullets.push(new Bullet(bx, by, this.dir, this.type, this.strongBulletTimer > 0));
        }

        this.lastShot = now;
        if (this.type === 'player' && window.audioFX) window.audioFX.playJump();
    }
}

class Bullet {
    constructor(x, y, dir, owner, isStrong = false) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.owner = owner;
        this.speed = owner === 'player' ? 6 : 4;
        this.radius = 4;
        this.isStrong = isStrong;
    }

    update() {
        if (this.dir === 0) this.y -= this.speed;
        if (this.dir === 1) this.x += this.speed;
        if (this.dir === 2) this.y += this.speed;
        if (this.dir === 3) this.x -= this.speed;

        const r = Math.floor(this.y / TILE_SIZE);
        const c = Math.floor(this.x / TILE_SIZE);
        if (map[r] && map[r][c] > 0) {
            if (map[r][c] === 1) {
                map[r][c] = 0; // Destroy brick
                // Chance to drop powerup
                if (Math.random() < 0.15) {
                    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                    powerUps.push(new PowerUp(c * TILE_SIZE + 4, r * TILE_SIZE + 4, type));
                }
            } else if (map[r][c] === 2 && this.isStrong) {
                map[r][c] = 0; // Destroy steel!
            }
            createExplosion(this.x, this.y, '#f00');
            return false;
        }

        // Collision with HQ
        const hqX = (MAP_COLS / 2) * TILE_SIZE - TILE_SIZE;
        const hqY = (MAP_ROWS - 2) * TILE_SIZE;
        if (this.x > hqX && this.x < hqX + TILE_SIZE * 2 && this.y > hqY && this.y < hqY + TILE_SIZE) {
            hqHP -= 10;
            createExplosion(this.x, this.y, '#ff0');
            updateHUD();
            return false;
        }

        // Collision with Tanks
        if (this.owner === 'enemy') {
            if (Math.abs(this.x - (player.x + TANK_SIZE / 2)) < 24 && Math.abs(this.y - (player.y + TANK_SIZE / 2)) < 24) {
                if (player.shield > 0) {
                    player.shield--;
                    createExplosion(this.x, this.y, '#00ccff');
                } else {
                    player.hp -= 10;
                    createExplosion(this.x, this.y, '#0ff');
                    updateHUD();
                    if (player.hp <= 0) endGame('MISSION FAILED');
                }
                return false;
            }
        } else {
            for (let i = 0; i < enemies.length; i++) {
                let e = enemies[i];
                if (Math.abs(this.x - (e.x + TANK_SIZE / 2)) < 24 && Math.abs(this.y - (e.y + TANK_SIZE / 2)) < 24) {
                    e.hp -= 20;
                    createExplosion(this.x, this.y, '#f0f');
                    if (e.hp <= 0) {
                        enemies.splice(i, 1);
                        enemiesInStageRemaining--;
                        score += 100;
                        kills++;
                        updateHUD();
                        checkStageClear();
                    }
                    return false;
                }
            }
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) return false;
        return true;
    }

    draw() {
        ctx.fillStyle = this.owner === 'player' ? '#fff' : '#ff0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color
        });
    }
}

let player;
const keys = {};

window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') player.shoot(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function update(dt) {
    if (gameState === 'death_sequence') {
        deathAnimationTimer -= dt;
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
        particles = particles.filter(p => p.life > 0);
        if (deathAnimationTimer <= 0) endGame('TANK COLLISION!');
        return;
    }

    if (gameState !== 'playing') return;

    // Power-up durations
    if (player.multiShotTimer > 0) player.multiShotTimer -= dt;
    if (player.strongBulletTimer > 0) player.strongBulletTimer -= dt;
    if (player.speedTimer > 0) player.speedTimer -= dt;
    if (freezeTimer > 0) freezeTimer -= dt;

    // Player with speed boost
    player.moving = false;
    const pSpeed = player.speedTimer > 0 ? player.speed * 1.5 : player.speed;

    if (keys['ArrowUp'] || keys['KeyW']) { 
        player.dir = 0; player.moving = true; 
        const nx = player.x; const ny = player.y - pSpeed;
        if (!player.checkCollision(nx, ny)) { player.x = nx; player.y = ny; }
    }
    else if (keys['ArrowRight'] || keys['KeyD']) { 
        player.dir = 1; player.moving = true; 
        const nx = player.x + pSpeed; const ny = player.y;
        if (!player.checkCollision(nx, ny)) { player.x = nx; player.y = ny; }
    }
    else if (keys['ArrowDown'] || keys['KeyS']) { 
        player.dir = 2; player.moving = true; 
        const nx = player.x; const ny = player.y + pSpeed;
        if (!player.checkCollision(nx, ny)) { player.x = nx; player.y = ny; }
    }
    else if (keys['ArrowLeft'] || keys['KeyA']) { 
        player.dir = 3; player.moving = true; 
        const nx = player.x - pSpeed; const ny = player.y;
        if (!player.checkCollision(nx, ny)) { player.x = nx; player.y = ny; }
    }

    // Bullet updates
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].update()) bullets.splice(i, 1);
    }

    // Power-up Collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (Math.abs(player.x + TANK_SIZE/2 - p.x - 12) < 32 && Math.abs(player.y + TANK_SIZE/2 - p.y - 12) < 32) {
            collectPowerUp(p.type);
            powerUps.splice(i, 1);
            continue;
        }
        if (Date.now() - p.spawnTime > p.life) powerUps.splice(i, 1);
    }

    // Enemy AI
    enemySpawnTimer += dt;
    if (enemySpawnTimer > spawnRate && enemiesSpawnedInStage < totalEnemiesInStage) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    if (freezeTimer <= 0) {
        enemies.forEach((e, idx) => {
            const dist = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
            if (dist < TANK_SIZE * 0.75) {
                if (player.shield > 0) {
                    player.shield = 0;
                    createExplosion(player.x + TANK_SIZE/2, player.y + TANK_SIZE/2, '#00ccff');
                    enemies.splice(idx, 1);
                    enemiesInStageRemaining--;
                    checkStageClear();
                } else {
                    createExplosion(player.x + TANK_SIZE/2, player.y + TANK_SIZE/2, '#0ff');
                    createExplosion(e.x + TANK_SIZE/2, e.y + TANK_SIZE/2, '#f0f');
                    // Massive explosion for collision
                    for (let x = 0; x < 5; x++) {
                        createExplosion(player.x + TANK_SIZE/2 + (Math.random()-0.5)*40, player.y + TANK_SIZE/2 + (Math.random()-0.5)*40, '#fff');
                    }
                    
                    player.visible = false;
                    enemies.splice(idx, 1);
                    gameState = 'death_sequence';
                    deathAnimationTimer = 1000;
                    if (window.audioFX) window.audioFX.playExplosion();
                    return;
                }
            }

            const hqX = (MAP_COLS / 2) * TILE_SIZE;
            const hqY = (MAP_ROWS - 2) * TILE_SIZE;
            if (Math.random() < 0.02) {
                const dx = hqX - e.x;
                const dy = hqY - e.y;
                if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 1 : 3;
                else e.dir = dy > 0 ? 2 : 0;
            }
            e.move(dt);
            if (Math.random() < 0.01) e.shoot();
        });
    }

    // Particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
    particles = particles.filter(p => p.life > 0);

    if (hqHP <= 0) endGame('HQ DESTROYED');
}

function collectPowerUp(type) {
    if (window.audioFX) window.audioFX.playLevelUp();
    if (type === 'shield') { player.shield = 1; }
    else if (type === 'freeze') { freezeTimer = 5000; }
    else if (type === 'multi') { player.multiShotTimer = 10000; }
    else if (type === 'strong') { player.strongBulletTimer = 10000; }
    else if (type === 'speed') { player.speedTimer = 8000; }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tiles
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            let img = null;
            if (map[r][c] === 1) img = assets.tileBrick;
            if (map[r][c] === 2) img = assets.tileSteel;
            if (map[r][c] === 3) img = assets.tileGrass;
            if (map[r][c] === 4) img = assets.tileWater;

            if (img) ctx.drawImage(img, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // HQ
    if (assets.baseHQ) {
        const hqX = (MAP_COLS / 2) * TILE_SIZE - TILE_SIZE;
        const hqY = (MAP_ROWS - 2) * TILE_SIZE;
        ctx.drawImage(assets.baseHQ, hqX, hqY, TILE_SIZE * 2, TILE_SIZE * 2);
    }

    player.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());
    powerUps.forEach(p => p.draw());

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;
}

function spawnEnemy() {
    if (enemies.length >= 4) return;
    const colList = [2, 10, 20];
    const col = colList[Math.floor(Math.random() * colList.length)];
    enemies.push(new Tank(col * TILE_SIZE, TILE_SIZE * 1, 'enemy'));
    enemiesSpawnedInStage++;
}

function updateHUD() {
    uiScore.textContent = score.toString().padStart(5, '0');
    hqHpBar.style.width = Math.max(0, hqHP) + '%';
    playerHpBar.style.width = Math.max(0, player.hp) + '%';
    uiStage.textContent = currentStage;
    hqHpBar.style.background = hqHP < 40 ? '#ff0000' : '#00ff00';
    playerHpBar.style.background = player.hp < 40 ? '#ffaa00' : '#00ccff';
}

function checkStageClear() {
    if (enemiesInStageRemaining <= 0 && enemiesSpawnedInStage >= totalEnemiesInStage) {
        gameState = 'stage_clear';
        currentStage++;
        totalEnemiesInStage = 5 + (currentStage * 2);
        showStageOverlay(`STAGE ${currentStage}`, "GET READY!");
        setTimeout(startNextStage, 2000);
    }
}

function showStageOverlay(title, sub) {
    stageOverlay.classList.remove('hidden');
    document.getElementById('stage-title').textContent = title;
    document.getElementById('stage-subtitle').textContent = sub;
}

function startNextStage() {
    initMap();
    enemies = [];
    bullets = [];
    particles = [];
    powerUps = [];
    enemiesSpawnedInStage = 0;
    enemiesInStageRemaining = totalEnemiesInStage;
    spawnRate = Math.max(800, 3000 - (currentStage * 200));
    freezeTimer = 0;

    player.hp = 100;
    player.visible = true;
    player.shield = 0;
    player.multiShotTimer = 0;
    player.strongBulletTimer = 0;
    player.speedTimer = 0;
    player.x = (MAP_COLS / 2) * TILE_SIZE - TILE_SIZE / 2;
    player.y = (MAP_ROWS - 5) * TILE_SIZE;
    
    updateHUD();
    stageOverlay.classList.add('hidden');
    gameState = 'playing';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function initGame() {
    canvas.width = 800;
    canvas.height = 576;
    currentStage = 1;
    totalEnemiesInStage = 5;
    score = 0;
    kills = 0;
    hqHP = 100;
    
    initMap();
    player = new Tank((MAP_COLS / 2) * TILE_SIZE - TILE_SIZE / 2, (MAP_ROWS - 5) * TILE_SIZE, 'player');
    
    enemies = [];
    bullets = [];
    particles = [];
    powerUps = [];
    enemiesSpawnedInStage = 0;
    enemiesInStageRemaining = totalEnemiesInStage;
    freezeTimer = 0;
    deathAnimationTimer = 0;
    
    player.shield = 0;
    player.multiShotTimer = 0;
    player.strongBulletTimer = 0;
    player.speedTimer = 0;
    
    updateHUD();
    mainMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    
    showStageOverlay(`STAGE 1`, "PROTECT THE HQ");
    setTimeout(() => {
        stageOverlay.classList.add('hidden');
        gameState = 'playing';
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }, 2000);
}

function gameLoop(timestamp) {
    if (gameState !== 'playing' && gameState !== 'death_sequence') return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt); draw();
    requestAnimationFrame(gameLoop);
}

function endGame(title) {
    gameState = 'gameover';
    document.getElementById('end-title').textContent = title;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-kills').textContent = kills;
    gameOverMenu.classList.remove('hidden');
}

// Auto-detect touch support
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.getElementById('mobile-controls').classList.remove('hidden');
}

// Button Events
document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
document.getElementById('btn-pause').addEventListener('click', () => {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
    }
});
document.getElementById('btn-resume').addEventListener('click', () => {
    gameState = 'playing';
    pauseMenu.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});
document.getElementById('btn-howtoplay').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
document.querySelector('.close-btn').addEventListener('click', () => howToPlayModal.classList.add('hidden'));

// Mute Logic
document.getElementById('btn-mute').addEventListener('click', () => {
    if (window.audioFX) {
        window.audioFX.muted = !window.audioFX.muted;
        document.getElementById('btn-mute').textContent = window.audioFX.muted ? '🔇' : '🔊';
    }
});

// Quit Logic
const quitGame = () => {
    window.location.href = '../retro-hub.html';
};
document.getElementById('btn-quit').addEventListener('click', quitGame);
document.getElementById('btn-quit-end').addEventListener('click', quitGame);

// Mobile Controls
const bindBtn = (id, key) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
        if(key==='Space') player.shoot();
    }, {passive: false});
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
    }, {passive: false});
};
bindBtn('btn-up', 'ArrowUp');
bindBtn('btn-down', 'ArrowDown');
bindBtn('btn-left', 'ArrowLeft');
bindBtn('btn-right', 'ArrowRight');
bindBtn('btn-fire', 'Space');
