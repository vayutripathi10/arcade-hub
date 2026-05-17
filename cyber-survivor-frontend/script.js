const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiTime = document.getElementById('ui-time');
const uiLevel = document.getElementById('ui-level');
const uiKills = document.getElementById('ui-kills');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseOverlay');
const gameOverMenu = document.getElementById('gameOverMenu');
const levelUpMenu = document.getElementById('levelUpMenu');
const upgradeOptionsContainer = document.getElementById('upgradeOptions');
const howToPlayModal = document.getElementById('how-to-play');

// Buttons
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-how').addEventListener('click', () => toggleHelp(true));

const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnHelp = document.getElementById('btn-help');
const btnCloseHelp = document.getElementById('btn-close-help');

btnPause.addEventListener('click', () => {
    togglePause();
});

btnResume.addEventListener('click', () => {
    togglePause();
});

btnHelp.addEventListener('click', () => {
    toggleHelp(true);
});

btnCloseHelp.addEventListener('click', () => {
    toggleHelp(false);
});

function toggleHelp(show) {
    if (show) {
        howToPlayModal.classList.remove('hidden');
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            pauseMenu.classList.remove('hidden');
        }
    } else {
        howToPlayModal.classList.add('hidden');
    }
}
document.getElementById('btn-quit').addEventListener('click', quitGame);
document.getElementById('btn-restart-go').addEventListener('click', startGame);
document.getElementById('btn-mute').addEventListener('click', () => window.audioFX && window.audioFX.toggleMute());

// Game State
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, LEVELUP, GAMEOVER
let lastTime = 0;
let gameTime = 0; // In seconds
let killCount = 0;

// Entities
let player;
let enemies = [];
let projectiles = [];
let gems = [];
let particles = [];
let floatingTexts = [];

// Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
let pointer = { active: false, x: 0, y: 0 };
let joystick = { dx: 0, dy: 0 }; // For touch/mouse drag

window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause(); });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Touch / Mouse controls
canvas.addEventListener('mousedown', e => { pointer.active = true; updateJoystick(e.clientX, e.clientY); });
canvas.addEventListener('mousemove', e => { if (pointer.active) updateJoystick(e.clientX, e.clientY); });
canvas.addEventListener('mouseup', () => { pointer.active = false; joystick.dx = 0; joystick.dy = 0; });
canvas.addEventListener('touchstart', e => { pointer.active = true; updateJoystick(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
canvas.addEventListener('touchmove', e => { if (pointer.active) updateJoystick(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, {passive: false});
canvas.addEventListener('touchend', () => { pointer.active = false; joystick.dx = 0; joystick.dy = 0; });

function updateJoystick(clientX, clientY) {
    if (!player) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
        joystick.dx = dx / dist;
        joystick.dy = dy / dist;
    } else {
        joystick.dx = 0;
        joystick.dy = 0;
    }
}

// Resize
function resize() {
    const hud = document.getElementById('hud');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - (hud ? hud.clientHeight : 0);
}
window.addEventListener('resize', resize);
resize();

// --- Classes ---

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 15;
        this.speed = 200; // px per sec
        this.maxHp = 100;
        this.hp = this.maxHp;
        
        // XP System
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 10;
        this.pickupRadius = 100;

        // Weapons & Stats
        this.weapons = {
            blaster: { level: 1, cooldown: 0.5, timer: 0, damage: 10, speed: 400, pierce: 1 },
            orbital: { level: 0, angle: 0, speed: 3, radius: 60, damage: 15 },
            spread: { level: 0, cooldown: 1.0, timer: 0, damage: 8, speed: 350 }
        };
    }

    update(deltaTime) {
        // Movement
        let dx = 0, dy = 0;
        if (keys.w || keys.ArrowUp) dy -= 1;
        if (keys.s || keys.ArrowDown) dy += 1;
        if (keys.a || keys.ArrowLeft) dx -= 1;
        if (keys.d || keys.ArrowRight) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;
        } else if (pointer.active) {
            dx = joystick.dx;
            dy = joystick.dy;
        }

        this.x += dx * (this.speed / 60) * deltaTime;
        this.y += dy * (this.speed / 60) * deltaTime;

        // Bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        // Auto Shoot - Blaster (Targets nearest)
        if (this.weapons.blaster.level > 0) {
            this.weapons.blaster.timer -= deltaTime * 0.01667;
            if (this.weapons.blaster.timer <= 0) {
                const target = getNearestEnemy(this.x, this.y);
                if (target) {
                    this.weapons.blaster.timer = this.weapons.blaster.cooldown;
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    projectiles.push(new Projectile(this.x, this.y, angle, this.weapons.blaster));
                    if (window.audioFX) window.audioFX.playShoot();
                }
            }
        }

        // Auto Shoot - Spread
        if (this.weapons.spread.level > 0) {
            this.weapons.spread.timer -= deltaTime * 0.01667;
            if (this.weapons.spread.timer <= 0) {
                this.weapons.spread.timer = this.weapons.spread.cooldown;
                const count = 2 + this.weapons.spread.level;
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 / count) * i + gameTime; // Spinning spread
                    projectiles.push(new Projectile(this.x, this.y, angle, this.weapons.spread, '#f0f'));
                }
                if (window.audioFX) window.audioFX.playShoot();
            }
        }

        // Orbital Update
        if (this.weapons.orbital.level > 0) {
            this.weapons.orbital.angle += (this.weapons.orbital.speed / 60) * deltaTime;
            // Collision handled in main loop
        }

        // Magnetic Gems
        gems.forEach(gem => {
            if (gem.collecting) return;
            const dist = Math.hypot(gem.x - this.x, gem.y - this.y);
            if (dist < this.pickupRadius) {
                gem.collecting = true;
            }
        });
    }

    draw(ctx) {
        // Draw Player
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Orbitals
        if (this.weapons.orbital.level > 0) {
            const numOrbits = this.weapons.orbital.level;
            ctx.fillStyle = '#ffb700';
            ctx.shadowColor = '#ffb700';
            ctx.shadowBlur = 10;
            for (let i = 0; i < numOrbits; i++) {
                const angle = this.weapons.orbital.angle + (Math.PI * 2 / numOrbits) * i;
                const ox = this.x + Math.cos(angle) * this.weapons.orbital.radius;
                const oy = this.y + Math.sin(angle) * this.weapons.orbital.radius;
                ctx.beginPath();
                ctx.arc(ox, oy, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        // Draw Health Bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 20, this.y + 25, 40, 5);
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(this.x - 20, this.y + 25, 40 * (this.hp / this.maxHp), 5);
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpNeeded) {
            this.xp -= this.xpNeeded;
            this.level++;
            this.xpNeeded = Math.floor(this.xpNeeded * 1.5);
            uiLevel.textContent = this.level;
            triggerLevelUp();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        floatingTexts.push(new FloatingText(this.x, this.y - 20, Math.floor(amount), '#ff0055'));
        if (window.audioFX) window.audioFX.playHit();
        if (this.hp <= 0) {
            gameOver();
        }
    }
}

class Enemy {
    constructor(type) {
        // Spawn outside screen
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(canvas.width, canvas.height) / 2 + 50;
        this.x = canvas.width/2 + Math.cos(angle) * dist;
        this.y = canvas.height/2 + Math.sin(angle) * dist;
        
        this.type = type;
        this.markedForDeletion = false;
        this.knockbackX = 0;
        this.knockbackY = 0;

        // Scaling based on time
        const scale = 1 + (gameTime / 60);

        if (type === 'basic') {
            this.radius = 12;
            this.hp = 20 * scale;
            this.speed = 100 + Math.random() * 20;
            this.color = '#ff00ea';
            this.xp = 1;
            this.damage = 10;
        } else if (type === 'tank') {
            this.radius = 20;
            this.hp = 80 * scale;
            this.speed = 60 + Math.random() * 10;
            this.color = '#ff0055';
            this.xp = 5;
            this.damage = 25;
        } else if (type === 'fast') {
            this.radius = 8;
            this.hp = 10 * scale;
            this.speed = 160 + Math.random() * 30;
            this.color = '#00ff66';
            this.xp = 1;
            this.damage = 5;
        } else if (type === 'boss') {
            this.radius = 40;
            this.hp = 2000 * scale;
            this.speed = 80;
            this.color = '#ffb700';
            this.xp = 50;
            this.damage = 40;
        }
    }

    update(deltaTime) {
        // Move towards player
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Apply knockback
        this.x += (this.knockbackX / 60) * deltaTime;
        this.y += (this.knockbackY / 60) * deltaTime;
        this.knockbackX *= Math.pow(0.9, deltaTime);
        this.knockbackY *= Math.pow(0.9, deltaTime);

        // Normal movement
        this.x += dx * (this.speed / 60) * deltaTime;
        this.y += dy * (this.speed / 60) * deltaTime;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    takeDamage(amount, kx = 0, ky = 0) {
        this.hp -= amount;
        this.knockbackX = kx * 300;
        this.knockbackY = ky * 300;
        floatingTexts.push(new FloatingText(this.x, this.y - this.radius, Math.floor(amount), '#fff'));
        
        // Spawn particles
        for(let i=0; i<3; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }

        if (this.hp <= 0 && !this.markedForDeletion) {
            this.markedForDeletion = true;
            killCount++;
            uiKills.textContent = killCount;
            gems.push(new Gem(this.x, this.y, this.xp));
            
            // Death particles
            for(let i=0; i<10; i++) {
                particles.push(new Particle(this.x, this.y, this.color));
            }

            if (this.type === 'boss') {
                if (window.achievements) window.achievements.unlock('survivor', 'boss_slayer', 'Boss Slayer');
            }

            if (killCount === 1 && window.achievements) {
                window.achievements.unlock('survivor', 'first_blood', 'First Blood');
            }
        }
    }
}

class Projectile {
    constructor(x, y, angle, stats, color = '#00f3ff') {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * stats.speed;
        this.vy = Math.sin(angle) * stats.speed;
        this.damage = stats.damage;
        this.pierce = stats.pierce || 1;
        this.life = 2.0; // seconds
        this.color = color;
        this.radius = 4;
        this.markedForDeletion = false;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.x += (this.vx / 60) * deltaTime;
        this.y += (this.vy / 60) * deltaTime;
        this.life -= deltaTime * 0.01667;
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Gem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = value > 10 ? 8 : (value > 1 ? 6 : 4);
        this.color = value > 10 ? '#ffb700' : (value > 1 ? '#00ff66' : '#00f3ff');
        this.markedForDeletion = false;
        this.collecting = false;
    }

    update(deltaTime) {
        if (this.collecting) {
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const speed = 400; // suck speed
            if (dist < 15) {
                this.markedForDeletion = true;
                player.gainXp(this.value);
                if (window.audioFX) window.audioFX.playGem();
            } else {
                this.x += (dx / dist) * (speed / 60) * deltaTime;
                this.y += (dy / dist) * (speed / 60) * deltaTime;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 0.5 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.color = color;
    }
    update(deltaTime) {
        this.x += (this.vx / 60) * deltaTime;
        this.y += (this.vy / 60) * deltaTime;
        this.life -= deltaTime * 0.01667;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.vy = -50;
    }
    update(deltaTime) {
        this.y += (this.vy / 60) * deltaTime;
        this.life -= deltaTime * 0.01667;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

// --- Systems ---

let spawnTimer = 0;
let bossSpawnedAt = new Set();

function spawnEnemies(deltaTime) {
    spawnTimer -= deltaTime * 0.01667;
    if (spawnTimer <= 0) {
        // Spawn rate gets faster over time, min 0.2s
        spawnTimer = Math.max(0.2, 1.5 - (gameTime / 120)); 
        
        let type = 'basic';
        const rand = Math.random();
        
        // Spawn logic changes over time
        if (gameTime > 30 && rand < 0.2) type = 'fast';
        if (gameTime > 60 && rand < 0.15) type = 'tank';
        
        // Bosses every 2 mins (120s)
        const minuteMark = Math.floor(gameTime / 120);
        if (minuteMark > 0 && !bossSpawnedAt.has(minuteMark)) {
            bossSpawnedAt.add(minuteMark);
            enemies.push(new Enemy('boss'));
        }

        enemies.push(new Enemy(type));
    }
}

function getNearestEnemy(x, y) {
    let nearest = null;
    let minDist = Infinity;
    enemies.forEach(e => {
        const dist = Math.hypot(e.x - x, e.y - y);
        if (dist < minDist) {
            minDist = dist;
            nearest = e;
        }
    });
    return nearest;
}

// Upgrades logic
const UPGRADES = [
    {
        id: 'blaster_dmg', name: 'Blaster Damage', icon: '🔫', desc: 'Increases basic attack damage.',
        apply: () => { player.weapons.blaster.damage += 5; }
    },
    {
        id: 'blaster_speed', name: 'Rapid Fire', icon: '⚡', desc: 'Shoots basic attacks much faster.',
        apply: () => { player.weapons.blaster.cooldown = Math.max(0.1, player.weapons.blaster.cooldown - 0.1); }
    },
    {
        id: 'blaster_pierce', name: 'Piercing Rounds', icon: '🏹', desc: 'Basic attacks pierce 1 more enemy.',
        apply: () => { player.weapons.blaster.pierce += 1; }
    },
    {
        id: 'orbital_new', name: 'Orbital Shield', icon: '⭐', desc: 'Adds a rotating protective orb.',
        apply: () => { player.weapons.orbital.level += 1; }
    },
    {
        id: 'spread_new', name: 'Spread Shot', icon: '✨', desc: 'Fires projectiles in multiple directions.',
        apply: () => { player.weapons.spread.level += 1; player.weapons.spread.damage += 2; }
    },
    {
        id: 'speed_up', name: 'Neon Boots', icon: '👟', desc: 'Increases your movement speed.',
        apply: () => { player.speed += 30; }
    },
    {
        id: 'magnet', name: 'Magnetism', icon: '🧲', desc: 'Increases XP gem pickup radius.',
        apply: () => { player.pickupRadius += 50; }
    },
    {
        id: 'heal', name: 'Emergency Repair', icon: '❤️', desc: 'Restores 50% max HP.',
        apply: () => { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); }
    }
];

function triggerLevelUp() {
    gameState = 'LEVELUP';
    if (window.audioFX) window.audioFX.playLevelUp();
    levelUpMenu.classList.remove('hidden');
    
    // Pick 3 random distinct upgrades
    const choices = [];
    const pool = [...UPGRADES];
    for(let i=0; i<3; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        choices.push(pool.splice(idx, 1)[0]);
    }

    upgradeOptionsContainer.innerHTML = '';
    choices.forEach(upg => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${upg.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${upg.name}</div>
                <div class="upgrade-desc">${upg.desc}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            upg.apply();
            resumeFromLevelUp();
        });
        upgradeOptionsContainer.appendChild(card);
    });

    if (player.level === 10 && window.achievements) {
        window.achievements.unlock('survivor', 'level_10', 'Survivor Level 10');
    }
}

function resumeFromLevelUp() {
    levelUpMenu.classList.add('hidden');
    gameState = 'PLAYING';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// --- Main Loop ---

function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function update(deltaTime) {
    const dtSeconds = deltaTime * 0.01667;
    gameTime += dtSeconds;
    uiTime.textContent = formatTime(gameTime);

    // Achievements
    if (gameTime >= 300 && window.achievements) { // 5 minutes
        window.achievements.unlock('survivor', 'survive_5m', 'Survived 5 Minutes');
    }

    player.update(deltaTime);
    spawnEnemies(deltaTime);

    enemies.forEach(e => e.update(deltaTime));
    projectiles.forEach(p => p.update(deltaTime));
    gems.forEach(g => g.update(deltaTime));
    particles.forEach(p => p.update(deltaTime));
    floatingTexts.forEach(ft => ft.update(deltaTime));

    // Collisions
    // 1. Projectiles vs Enemies
    projectiles.forEach(p => {
        enemies.forEach(e => {
            if (p.markedForDeletion || e.markedForDeletion || p.hitEnemies.has(e)) return;
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            if (dist < p.radius + e.radius) {
                p.hitEnemies.add(e);
                let kx = p.vx > 0 ? 1 : (p.vx < 0 ? -1 : 0);
                let ky = p.vy > 0 ? 1 : (p.vy < 0 ? -1 : 0);
                if (p.vx === 0 && p.vy === 0) { // Spread/Orbital might have different mechanics, but orbital is separate
                    kx = (e.x - player.x) > 0 ? 1 : -1;
                    ky = (e.y - player.y) > 0 ? 1 : -1;
                }
                e.takeDamage(p.damage, kx, ky);
                p.pierce--;
                if (p.pierce <= 0) p.markedForDeletion = true;
            }
        });
    });

    // 2. Orbitals vs Enemies
    if (player.weapons.orbital.level > 0) {
        const numOrbits = player.weapons.orbital.level;
        for (let i = 0; i < numOrbits; i++) {
            const angle = player.weapons.orbital.angle + (Math.PI * 2 / numOrbits) * i;
            const ox = player.x + Math.cos(angle) * player.weapons.orbital.radius;
            const oy = player.y + Math.sin(angle) * player.weapons.orbital.radius;
            
            enemies.forEach(e => {
                if (e.markedForDeletion) return;
                const dist = Math.hypot(ox - e.x, oy - e.y);
                if (dist < 8 + e.radius) {
                    // Knockback away from player
                    const dx = e.x - player.x;
                    const dy = e.y - player.y;
                    const len = Math.hypot(dx, dy);
                    e.takeDamage(player.weapons.orbital.damage * deltaTime * 0.01667 * 5, dx/len, dy/len); 
                    // applied rapidly due to overlap, mitigated by dt
                }
            });
        }
    }

    // 3. Enemies vs Player
    enemies.forEach(e => {
        if (e.markedForDeletion) return;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < e.radius + player.radius) {
            player.takeDamage(e.damage * deltaTime * 0.01667); // continuous damage on touch
        }
    });

    // Cleanup
    enemies = enemies.filter(e => !e.markedForDeletion);
    projectiles = projectiles.filter(p => !p.markedForDeletion);
    gems = gems.filter(g => !g.markedForDeletion);
    particles = particles.filter(p => p.life > 0);
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    // Draw background (grid)
    ctx.fillStyle = 'rgba(5, 5, 16, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridSize = 100;
    const offsetX = (player.x * -0.1) % gridSize; // Parallax effect
    const offsetY = (player.y * -0.1) % gridSize;
    for (let x = offsetX; x < canvas.width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = offsetY; y < canvas.height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    gems.forEach(g => g.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    player.draw(ctx);
    floatingTexts.forEach(ft => ft.draw(ctx));

    // XP Bar at top
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, canvas.width, 5);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(0, 0, canvas.width * (player.xp / player.xpNeeded), 5);
}

function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') return;

    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    const deltaTime = Math.min(dt / 16.67, 3);
    update(deltaTime);

    if (gameState === 'PLAYING') {
        requestAnimationFrame(gameLoop);
    }
}

// --- Control Flow ---

function startGame() {
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    
    // Reset state
    player = new Player();
    enemies = [];
    projectiles = [];
    gems = [];
    particles = [];
    floatingTexts = [];
    gameTime = 0;
    killCount = 0;
    spawnTimer = 0;
    bossSpawnedAt.clear();
    
    uiTime.textContent = '00:00';
    uiLevel.textContent = '1';
    uiKills.textContent = '0';

    if (window.audioFX) window.audioFX.init();

    gameState = 'PLAYING';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function quitGame() {
    gameState = 'MENU';
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (window.audioFX) window.audioFX.playGameOver();
    
    document.getElementById('go-time').textContent = formatTime(gameTime);
    document.getElementById('go-kills').textContent = killCount;
    document.getElementById('go-level').textContent = player.level;
    
    gameOverMenu.classList.remove('hidden');
}

// Sharing
document.getElementById('btn-share-wa').addEventListener('click', () => {
    const text = `I survived ${formatTime(gameTime)} and reached Level ${player.level} in Cyber Survivor! 👾 Can you beat my score? #CyberSurvivor #ArcadeHub`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
});

document.getElementById('btn-share-x').addEventListener('click', () => {
    const text = `I survived ${formatTime(gameTime)} and reached Level ${player.level} in Cyber Survivor! 👾 #CyberSurvivor #ArcadeHub`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
});

// Initial draw
ctx.fillStyle = 'rgba(5, 5, 16, 1.0)';
ctx.fillRect(0, 0, canvas.width, canvas.height);
