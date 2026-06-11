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

// Juicing States
let shakeTime = 0;
let shakeIntensity = 0;
let shakeX = 0;
let shakeY = 0;
let flashAlpha = 0;
let flashColor = '#fff';
let frames = 0;

function triggerShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTime = duration;
}

// Entities
let player;
let enemies = [];
let projectiles = [];
let gems = [];
let powerups = [];
let particles = [];
let floatingTexts = [];
let comboCount = 0;
let comboTimer = 0;

// Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
let pointer = { active: false, x: 0, y: 0 };
let joystick = { dx: 0, dy: 0 }; // For touch/mouse drag

window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    if (e.key === ' ') {
        e.preventDefault();
        if (player && player.ultimateCharge >= 100 && gameState === 'PLAYING') {
            player.activateUltimate();
        }
    }
    if (e.key === 'b' || e.key === 'B') {
        if (player && player.bombs > 0 && gameState === 'PLAYING') {
            player.triggerTacticalBomb();
        }
    }
});
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

function isOverUltimateButton(clientX, clientY) {
    if (!player) return false;
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const touchY = clientY - rect.top;
    const btnX = canvas.width - 80;
    const btnY = canvas.height - 80;
    const dist = Math.hypot(touchX - btnX, touchY - btnY);
    return dist <= 45;
}

function isOverBombButton(clientX, clientY) {
    if (!player) return false;
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const touchY = clientY - rect.top;
    const btnX = 80;
    const btnY = canvas.height - 80;
    const dist = Math.hypot(touchX - btnX, touchY - btnY);
    return dist <= 45;
}

// Touch / Mouse controls
canvas.addEventListener('mousedown', e => {
    if (gameState === 'PLAYING') {
        if (isOverUltimateButton(e.clientX, e.clientY)) {
            player.activateUltimate();
            return;
        }
        if (isOverBombButton(e.clientX, e.clientY)) {
            player.triggerTacticalBomb();
            return;
        }
    }
    pointer.active = true;
    updateJoystick(e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', e => { if (pointer.active) updateJoystick(e.clientX, e.clientY); });
canvas.addEventListener('mouseup', () => { pointer.active = false; joystick.dx = 0; joystick.dy = 0; });
canvas.addEventListener('touchstart', e => {
    if (gameState === 'PLAYING') {
        if (isOverUltimateButton(e.touches[0].clientX, e.touches[0].clientY)) {
            player.activateUltimate();
            e.preventDefault();
            return;
        }
        if (isOverBombButton(e.touches[0].clientX, e.touches[0].clientY)) {
            player.triggerTacticalBomb();
            e.preventDefault();
            return;
        }
    }
    pointer.active = true;
    updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: false});
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

class GridRipple {
    constructor(x, y, maxRadius, strength, speed, color = 'rgba(0, 243, 255, 0.3)') {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.strength = strength;
        this.speed = speed;
        this.color = color;
        this.life = 1.0;
    }
    update(deltaTime) {
        this.radius += this.speed * deltaTime;
        this.life = Math.max(0, 1.0 - (this.radius / this.maxRadius));
    }
}
let gridRipples = [];
function spawnRipple(x, y, maxRadius, strength, speed, color) {
    gridRipples.push(new GridRipple(x, y, maxRadius, strength, speed, color));
}

class BombRing {
    constructor(x, y, maxRadius, speed, damage, color = '#ffb700') {
        this.x = x;
        this.y = y;
        this.currentRadius = 0;
        this.maxRadius = maxRadius;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.damagedEnemies = new Set();
        this.markedForDeletion = false;
    }
    getColor(ratio) {
        // Shifting colors: Cyan -> Orange -> Dark Red
        if (ratio < 0.3) {
            const t = ratio / 0.3;
            const r = Math.round(0 + t * 255);
            const g = Math.round(243 - t * 141);
            const b = Math.round(255 - t * 255);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (ratio < 0.75) {
            const t = (ratio - 0.3) / 0.45;
            const g = Math.round(102 - t * 51);
            return `rgb(255, ${g}, 0)`;
        } else {
            const t = (ratio - 0.75) / 0.25;
            const r = Math.round(255 - t * 119);
            const g = Math.round(51 - t * 51);
            return `rgb(${r}, ${g}, 0)`;
        }
    }
    update(deltaTime) {
        this.currentRadius += (this.speed / 60) * deltaTime;
        if (this.currentRadius >= this.maxRadius) {
            this.markedForDeletion = true;
            return;
        }

        // Keep centered on player's ship
        if (player) {
            this.x = player.x;
            this.y = player.y;
        }

        // Shake the screen as the ring expands
        const intensity = 28 * (1 - this.currentRadius / this.maxRadius) + 4;
        triggerShake(intensity, 0.15);

        // Check enemies hit by expanding ring
        enemies.forEach(enemy => {
            if (this.damagedEnemies.has(enemy)) return;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.currentRadius) {
                this.damagedEnemies.add(enemy);
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.takeDamage(this.damage, Math.cos(angle), Math.sin(angle));
                
                // Blast particles at enemy
                for (let i = 0; i < 12; i++) {
                    const colors = ['#ff3300', '#ff6600', '#ffb700', '#ffff00'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const p = new Particle(enemy.x, enemy.y, color);
                    const speed = Math.random() * 220 + 80;
                    const angle = Math.random() * Math.PI * 2;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    p.life = 0.5 + Math.random() * 0.4;
                    p.maxLife = p.life;
                    particles.push(p);
                }
            }
        });
    }
    draw(ctx) {
        ctx.save();
        
        const ratio = this.currentRadius / this.maxRadius;
        const ringColor = this.getColor(ratio);
        
        // Primary shockwave ring
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 8 * (1 - ratio) + 2; 
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Trailing secondary ring
        if (this.currentRadius > 30) {
            const trailingRatio = Math.max(0, (this.currentRadius - 25) / this.maxRadius);
            const trailingColor = this.getColor(trailingRatio);
            ctx.strokeStyle = trailingColor;
            ctx.lineWidth = 3 * (1 - ratio) + 1;
            ctx.shadowColor = trailingColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius - 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Fading glow fill
        const alpha = 0.15 * (1 - ratio);
        ctx.fillStyle = ringColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
let bombRings = [];

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

        // Squash & Stretch
        this.scaleX = 1.0;
        this.scaleY = 1.0;

        // Ultimate System
        this.ultimateCharge = 0;
        this.ultimateTime = 0;
        this.ultimateTimer = 0;
        this.rapidFireTimer = 0;
        this.bombs = 1;
        this.bombCooldownTimer = 0;

        // Weapons & Stats
        this.weapons = {
            blaster: { level: 1, cooldown: 0.5, timer: 0, damage: 10, speed: 400, pierce: 1 },
            orbital: { level: 0, angle: 0, speed: 3, radius: 60, damage: 15 },
            spread: { level: 0, cooldown: 1.0, timer: 0, damage: 8, speed: 350 },
            missile: { level: 0, cooldown: 1.8, timer: 0, damage: 25, speed: 300 },
            bomb: { level: 0, cooldown: 3.0, timer: 0, damage: 45, speed: 200 }
        };
    }

    getPickupRadius() {
        const pickupMultiplier = 1.0 + Math.min(1.0, Math.floor(comboCount / 5) * 0.15);
        return this.pickupRadius * pickupMultiplier;
    }

    triggerTacticalBomb() {
        if (this.bombs > 0 && this.bombCooldownTimer <= 0) {
            this.bombs--;
            this.bombCooldownTimer = 0.6; // 0.6 seconds cooldown
            
            const maxBlastRadius = 380; 
            const speed = 750; 
            const damage = 500; // Extremely powerful to destroy nearby enemies
            
            spawnRipple(this.x, this.y, maxBlastRadius, 3.0, 12, '#ffb700');
            spawnRipple(this.x, this.y, maxBlastRadius * 0.7, 2.0, 8, '#ff3300');
            
            bombRings.push(new BombRing(this.x, this.y, maxBlastRadius, speed, damage, '#ffb700'));
            
            // Spawn initial launch particles from the spaceship
            for (let i = 0; i < 20; i++) {
                const p = new Particle(this.x, this.y, '#ffb700');
                const speed = Math.random() * 200 + 100;
                p.vx = Math.cos(Math.random() * Math.PI * 2) * speed;
                p.vy = Math.sin(Math.random() * Math.PI * 2) * speed;
                particles.push(p);
            }
            
            floatingTexts.push(new FloatingText(this.x, this.y - 45, "TACTICAL BLAST!", '#ffcc00'));
            
            if (window.audioFX && typeof window.audioFX.playBombExplode === 'function') {
                window.audioFX.playBombExplode();
            } else if (window.audioFX) {
                window.audioFX.playHit();
            }
        }
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

        const speedMultiplier = 1.0 + Math.min(0.25, Math.floor(comboCount / 5) * 0.05);
        const actualSpeed = this.speed * speedMultiplier;
        this.x += dx * (actualSpeed / 60) * deltaTime;
        this.y += dy * (actualSpeed / 60) * deltaTime;

        // Spawn engine trail particles when moving
        if ((dx !== 0 || dy !== 0) && Math.random() < 0.35) {
            const angle = Math.atan2(dy, dx);
            const ox = this.x - Math.cos(angle) * 12;
            const oy = this.y - Math.sin(angle) * 12;
            const p = new Particle(ox, oy, 'rgba(0, 243, 255, 0.7)');
            const pSpeed = Math.random() * 40 + 15;
            p.vx = -dx * pSpeed + (Math.random() - 0.5) * 15;
            p.vy = -dy * pSpeed + (Math.random() - 0.5) * 15;
            p.life = 0.2 + Math.random() * 0.25;
            p.maxLife = p.life;
            particles.push(p);
        }

        // Bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        // Scale decay
        this.scaleX += (1.0 - this.scaleX) * 0.12 * deltaTime;
        this.scaleY += (1.0 - this.scaleY) * 0.12 * deltaTime;

        // Rapid Fire countdown
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer -= deltaTime * 0.01667;
            if (this.rapidFireTimer < 0) this.rapidFireTimer = 0;
        }

        // Bomb Cooldown countdown
        if (this.bombCooldownTimer > 0) {
            this.bombCooldownTimer -= deltaTime * 0.01667;
            if (this.bombCooldownTimer < 0) this.bombCooldownTimer = 0;
        }

        // Auto Shoot - Blaster (Targets nearest)
        if (this.weapons.blaster.level > 0) {
            this.weapons.blaster.timer -= deltaTime * 0.01667;
            const currentCooldown = this.rapidFireTimer > 0 ? 0.05 : this.weapons.blaster.cooldown;
            if (this.weapons.blaster.timer <= 0) {
                const target = getNearestEnemy(this.x, this.y);
                if (target) {
                    this.weapons.blaster.timer = currentCooldown;
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    const bulletRadius = 4;
                    
                    if (this.rapidFireTimer > 0) {
                        const proj = new Projectile(this.x, this.y, angle, {
                            speed: this.weapons.blaster.speed * 1.3,
                            damage: this.weapons.blaster.damage,
                            pierce: this.weapons.blaster.pierce
                        }, '#ff6600');
                        proj.radius = bulletRadius + 1;
                        projectiles.push(proj);
                        if (window.audioFX && typeof window.audioFX.playRapidShoot === 'function') {
                            window.audioFX.playRapidShoot();
                        } else if (window.audioFX) {
                            window.audioFX.playShoot();
                        }
                    } else {
                        const proj = new Projectile(this.x, this.y, angle, {
                            speed: this.weapons.blaster.speed,
                            damage: this.weapons.blaster.damage,
                            pierce: this.weapons.blaster.pierce
                        });
                        proj.radius = bulletRadius;
                        projectiles.push(proj);
                        if (window.audioFX) window.audioFX.playShoot();
                    }
                    spawnRipple(this.x, this.y, 60, 0.2, 5, 'rgba(0, 243, 255, 0.15)');
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
                spawnRipple(this.x, this.y, 80, 0.3, 6, 'rgba(255, 0, 255, 0.2)');
            }
        }

        // Orbital Update
        if (this.weapons.orbital.level > 0) {
            this.weapons.orbital.angle += (this.weapons.orbital.speed / 60) * deltaTime;
        }

        // Auto Shoot - Homing Missile
        if (this.weapons.missile.level > 0) {
            this.weapons.missile.timer -= deltaTime * 0.01667;
            if (this.weapons.missile.timer <= 0) {
                this.weapons.missile.timer = this.weapons.missile.cooldown;
                const count = this.weapons.missile.level;
                const targets = getNearestEnemies(this.x, this.y, count);
                for (let i = 0; i < count; i++) {
                    const target = targets[i] || getNearestEnemy(this.x, this.y);
                    if (target) {
                        const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
                        const launchAngle = baseAngle + (Math.random() - 0.5) * 1.2; // Fan out
                        projectiles.push(new HomingMissile(this.x, this.y, launchAngle, this.weapons.missile, target));
                        if (window.audioFX && typeof window.audioFX.playMissile === 'function') {
                            window.audioFX.playMissile();
                        } else if (window.audioFX) {
                            window.audioFX.playShoot();
                        }
                    }
                }
            }
        }

        // Auto Shoot - Plasma Bomb
        if (this.weapons.bomb.level > 0) {
            this.weapons.bomb.timer -= deltaTime * 0.01667;
            if (this.weapons.bomb.timer <= 0) {
                this.weapons.bomb.timer = this.weapons.bomb.cooldown;
                const target = getNearestEnemy(this.x, this.y);
                if (target) {
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    projectiles.push(new PlasmaBomb(this.x, this.y, angle, this.weapons.bomb, target.x, target.y));
                    if (window.audioFX && typeof window.audioFX.playBombLaunch === 'function') {
                        window.audioFX.playBombLaunch();
                    } else if (window.audioFX) {
                        window.audioFX.playShoot();
                    }
                }
            }
        }

        // Collect Gems when ship physically touches/collides with them
        gems.forEach(gem => {
            if (gem.collecting) return;
            const dist = Math.hypot(gem.x - this.x, gem.y - this.y);
            if (dist < this.radius + gem.radius + 3) {
                gem.collecting = true;
            }
        });

        // Ultimate Overload Decay & Fire
        if (this.ultimateTime > 0) {
            this.ultimateTime -= deltaTime * 0.01667;
            this.ultimateTimer -= deltaTime * 0.01667;
            if (this.ultimateTimer <= 0) {
                this.ultimateTimer = 0.12; // Fire rapid bursts
                const count = 12; // 12-directional blast
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 / count) * i + (this.ultimateTime * 2); // spinning vortex!
                    projectiles.push(new Projectile(this.x, this.y, angle, {
                        damage: this.weapons.blaster.damage * 2.5,
                        speed: 550,
                        pierce: 3
                    }, '#ff00ea'));
                }
                if (window.audioFX) window.audioFX.playShoot();
                triggerShake(4, 0.1);
                spawnRipple(this.x, this.y, 100, 0.4, 6, 'rgba(255, 0, 234, 0.2)');
            }
        }
    }

    activateUltimate() {
        if (this.ultimateCharge >= 100 && this.ultimateTime <= 0) {
            this.ultimateCharge = 0;
            this.ultimateTime = 6.0; // 6 seconds duration
            this.ultimateTimer = 0;

            // Visual explosion burst
            spawnRipple(this.x, this.y, 350, 2.5, 9, '#ff00ea');
            triggerShake(20, 0.8);
            flashAlpha = 0.6;
            flashColor = 'rgba(255, 0, 234, 0.4)';

            // Overload sparks
            for (let i = 0; i < 40; i++) {
                particles.push(new Particle(this.x, this.y, '#ff00ea'));
            }

            floatingTexts.push(new FloatingText(this.x, this.y - 40, "REACTOR OVERLOAD!!!", '#ff00ea'));

            if (window.audioFX && typeof window.audioFX.playUltimate === 'function') {
                window.audioFX.playUltimate();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scaleX, this.scaleY);
        
        // Calculate angle towards nearest enemy or towards movement direction
        let angle = 0;
        const target = getNearestEnemy(this.x, this.y);
        if (target) {
            angle = Math.atan2(target.y - this.y, target.x - this.x);
        } else if (pointer.active && (joystick.dx !== 0 || joystick.dy !== 0)) {
            angle = Math.atan2(joystick.dy, joystick.dx);
        } else {
            let dx = 0, dy = 0;
            if (keys.w || keys.ArrowUp) dy -= 1;
            if (keys.s || keys.ArrowDown) dy += 1;
            if (keys.a || keys.ArrowLeft) dx -= 1;
            if (keys.d || keys.ArrowRight) dx += 1;
            if (dx !== 0 || dy !== 0) angle = Math.atan2(dy, dx);
        }
        ctx.rotate(angle);

        // 1. Draw side thrusters / wings (cyber-fighter design)
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        
        // Left Wing / Thruster
        ctx.fillStyle = '#101424';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-22, -18);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Wing / Thruster
        ctx.beginPath();
        ctx.moveTo(-10, 8);
        ctx.lineTo(-22, 18);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Main Mech Body (aerodynamic hexagon)
        ctx.fillStyle = '#161b33';
        ctx.strokeStyle = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(6, -12);
        ctx.lineTo(-12, -12);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, 12);
        ctx.lineTo(6, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Central glowing reactor core
        let coreGlow = 6 + Math.sin(frames * 0.15) * 3;
        let isUltReady = (this.ultimateCharge >= 100);
        let isUltActive = (this.ultimateTime > 0);

        if (isUltActive) {
            ctx.shadowColor = '#ff00ea';
            ctx.fillStyle = '#ff00ea';
            coreGlow = 15 + Math.sin(frames * 0.3) * 6;
        } else if (isUltReady) {
            let pulseColor = Math.floor(frames * 0.2) % 2 === 0 ? '#ff00ea' : '#39ff14';
            ctx.shadowColor = pulseColor;
            ctx.fillStyle = pulseColor;
            coreGlow = 10 + Math.sin(frames * 0.3) * 4;
        } else {
            ctx.shadowColor = '#39ff14';
            ctx.fillStyle = '#39ff14';
        }

        ctx.shadowBlur = coreGlow;
        ctx.beginPath();
        ctx.arc(-2, 0, isUltActive ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 4. Cockpit windshield glass
        let visGrad = ctx.createLinearGradient(4, -5, 12, 5);
        visGrad.addColorStop(0, '#00f3ff');
        visGrad.addColorStop(1, '#005f73');
        ctx.fillStyle = visGrad;
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -6);
        ctx.lineTo(2, 0);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();

        // 5. Thruster exhausts (behind wings if moving)
        let isMoving = (keys.w || keys.s || keys.a || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || (pointer.active && (joystick.dx !== 0 || joystick.dy !== 0)));
        if (isMoving) {
            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 10;
            
            // Left exhaust flame
            ctx.beginPath();
            ctx.moveTo(-18, -11);
            ctx.lineTo(-30 - Math.random() * 8, -11);
            ctx.lineTo(-18, -7);
            ctx.closePath();
            ctx.fill();
            
            // Right exhaust flame
            ctx.beginPath();
            ctx.moveTo(-18, 11);
            ctx.lineTo(-30 - Math.random() * 8, 11);
            ctx.lineTo(-18, 7);
            ctx.closePath();
            ctx.fill();
        }

        // Rapid Fire glowing aura
        if (this.rapidFireTimer > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 102, 0, 0.45)';
            ctx.lineWidth = 3.0 + Math.sin(frames * 0.35) * 1.5;
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 15 + Math.sin(frames * 0.35) * 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 6. Overload Shield Field
        if (this.ultimateTime > 0) {
            ctx.strokeStyle = 'rgba(255, 0, 234, 0.45)';
            ctx.lineWidth = 2.0;
            ctx.shadowColor = '#ff00ea';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 36 + Math.sin(frames * 0.25) * 5, 0, Math.PI * 2);
            ctx.stroke();

            // Orbiting shield gems
            ctx.fillStyle = '#ff00ea';
            for (let i = 0; i < 3; i++) {
                let pAngle = (frames * 0.08) + (Math.PI * 2 / 3) * i;
                let px = Math.cos(pAngle) * 36;
                let py = Math.sin(pAngle) * 36;
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        // Draw Orbitals (unaffected by local transformations)
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
            
            // Level Up Juice
            this.scaleY = 1.55;
            this.scaleX = 0.65;
            triggerShake(8, 0.35);
            flashAlpha = 0.45;
            flashColor = 'rgba(0, 255, 102, 0.3)';
            spawnRipple(this.x, this.y, 250, 1.5, 9, '#00ff66');

            triggerLevelUp();
        }
    }

    takeDamage(amount) {
        if (this.ultimateTime > 0) return;
        this.hp -= amount;
        floatingTexts.push(new FloatingText(this.x, this.y - 20, Math.floor(amount), '#ff0055'));
        if (window.audioFX) window.audioFX.playHit();
        
        // Squash on hit
        this.scaleY = 0.6;
        this.scaleX = 1.4;
        
        triggerShake(12, 0.4);
        flashAlpha = 0.5;
        flashColor = 'rgba(255, 0, 85, 0.35)';
        spawnRipple(this.x, this.y, 200, 1.2, 10, '#ff0055');

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

        if (type === 'basic') {
            this.radius = 12;
            this.hp = 30;
            this.speed = 100 + Math.random() * 20;
            this.color = '#ff00ea';
            this.xp = 1;
            this.damage = 10;
        } else if (type === 'tank') {
            this.radius = 20;
            this.hp = 70;
            this.speed = 60 + Math.random() * 10;
            this.color = '#ff0055';
            this.xp = 5;
            this.damage = 25;
        } else if (type === 'fast') {
            this.radius = 8;
            this.hp = 20;
            this.speed = 160 + Math.random() * 30;
            this.color = '#00ff66';
            this.xp = 1;
            this.damage = 5;
        } else if (type === 'boss') {
            this.radius = 40;
            this.hp = 1200;
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
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        if (this.type === 'basic') {
            // Diamond cyber-drone shape
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y);
            ctx.lineTo(this.x, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'fast') {
            // Triangle delta drone
            ctx.moveTo(this.x + this.radius * 1.2, this.y);
            ctx.lineTo(this.x - this.radius * 0.8, this.y - this.radius);
            ctx.lineTo(this.x - this.radius * 0.8, this.y + this.radius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'tank') {
            // Shield hexagon drone
            ctx.moveTo(this.x + this.radius, this.y);
            ctx.lineTo(this.x + this.radius * 0.5, this.y - this.radius);
            ctx.lineTo(this.x - this.radius * 0.5, this.y - this.radius);
            ctx.lineTo(this.x - this.radius, this.y);
            ctx.lineTo(this.x - this.radius * 0.5, this.y + this.radius);
            ctx.lineTo(this.x + this.radius * 0.5, this.y + this.radius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw a dark inner core
            ctx.fillStyle = '#050510';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'boss') {
            // Large spinning mecha orbital ring around a glowing core
            const angle = frames * 0.05;
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            
            // Outer ring
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner spiked core (drawn as a star)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i;
                const r1 = this.radius * 0.6;
                const r2 = this.radius * 0.3;
                ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
                ctx.lineTo(Math.cos(a + Math.PI / 8) * r2, Math.sin(a + Math.PI / 8) * r2);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    takeDamage(amount, kx = 0, ky = 0) {
        this.hp -= amount;
        this.knockbackX = kx * 300;
        this.knockbackY = ky * 300;
        floatingTexts.push(new FloatingText(this.x, this.y - this.radius, Math.floor(amount), '#fff'));
        
        // Spawn damage particles
        for(let i=0; i<3; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }

        // Tiny hit ripple & light shake
        spawnRipple(this.x, this.y, 70, 0.3, 5, 'rgba(255, 255, 255, 0.15)');
        triggerShake(2, 0.1);

        if (this.hp <= 0 && !this.markedForDeletion) {
            this.markedForDeletion = true;
            killCount++;
            comboCount++;
            comboTimer = 2.0;
            uiKills.textContent = killCount;
            gems.push(new Gem(this.x, this.y, this.xp));

            // Award 1 bomb after each 40 kills
            if (killCount > 0 && killCount % 40 === 0 && player) {
                player.bombs++;
                floatingTexts.push(new FloatingText(player.x, player.y - 45, "+1 BOMB!", '#ffcc00'));
                if (window.audioFX && typeof window.audioFX.playPowerUp === 'function') {
                    window.audioFX.playPowerUp();
                }
            }

            // Chance to drop a Rapid Fire Power-up
            if (Math.random() < 0.035) {
                powerups.push(new PowerUp(this.x, this.y, 'rapid_fire'));
            }

            // Add to ultimate charge!
            if (player && player.ultimateCharge < 100 && player.ultimateTime <= 0) {
                let chargeAmt = 1.0;
                if (this.type === 'boss') chargeAmt = 20.0;
                else if (this.type === 'tank') chargeAmt = 3.0;
                else if (this.type === 'fast') chargeAmt = 1.5;
                player.ultimateCharge = Math.min(100, player.ultimateCharge + chargeAmt);
            }
            
            // Death particles
            for(let i=0; i<10; i++) {
                particles.push(new Particle(this.x, this.y, this.color));
            }

            // Death ripple & shake
            if (this.type === 'boss') {
                spawnRipple(this.x, this.y, 400, 2.0, 12, '#ffb700');
                triggerShake(24, 0.7);
                flashAlpha = 0.7;
                flashColor = 'rgba(255, 255, 255, 0.6)';
                
                // Exploding shockwave rings
                for (let j = 0; j < 3; j++) {
                    setTimeout(() => {
                        spawnRipple(this.x, this.y, 300, 1.5, 10, '#ff0055');
                    }, j * 150);
                }
            } else if (this.type === 'tank') {
                spawnRipple(this.x, this.y, 180, 0.9, 8, this.color);
                triggerShake(6, 0.25);
            } else {
                spawnRipple(this.x, this.y, 120, 0.6, 7, this.color);
                triggerShake(4, 0.18);
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
        if (Math.random() < 0.6) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
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

class HomingMissile extends Projectile {
    constructor(x, y, angle, stats, targetEnemy) {
        super(x, y, angle, stats, '#ff3388');
        this.target = targetEnemy;
        this.radius = 5;
        this.homingStrength = 0.08;
        this.speed = stats.speed;
        this.angle = angle;
    }
    update(deltaTime) {
        if (this.target && !this.target.markedForDeletion) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * this.homingStrength * deltaTime;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        } else {
            this.target = getNearestEnemy(this.x, this.y);
        }
        super.update(deltaTime);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class PlasmaBomb extends Projectile {
    constructor(x, y, angle, stats, tx, ty) {
        super(x, y, angle, stats, '#ffb700');
        this.tx = tx;
        this.ty = ty;
        this.radius = 7;
        this.startX = x;
        this.startY = y;
        this.distToTravel = Math.hypot(tx - x, ty - y);
        this.distTraveled = 0;
        this.speed = stats.speed;
        this.angle = angle;
        this.stats = stats;
    }
    update(deltaTime) {
        const step = (this.speed / 60) * deltaTime;
        this.x += Math.cos(this.angle) * step;
        this.y += Math.sin(this.angle) * step;
        this.distTraveled += step;
        if (Math.random() < 0.4) {
            particles.push(new Particle(this.x, this.y, '#ffb700'));
        }
        if (this.distTraveled >= this.distToTravel || this.distTraveled >= 400) {
            this.detonate();
        }
    }
    detonate() {
        this.markedForDeletion = true;
        const baseRadius = 220 + (this.stats.level - 1) * 40;
        const damage = this.stats.damage;
        triggerShake(22 + this.stats.level * 5, 0.55);
        spawnRipple(this.x, this.y, baseRadius * 1.6, 2.0, 10, '#ffcc00');
        spawnRipple(this.x, this.y, baseRadius * 1.1, 1.4, 7, '#ff3300');
        enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < baseRadius) {
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.takeDamage(damage, Math.cos(angle), Math.sin(angle));
            }
        });
        for (let i = 0; i < 25; i++) {
            const p = new Particle(this.x, this.y, '#ffb700');
            const speed = Math.random() * 200 + 100;
            p.vx = Math.cos(Math.random() * Math.PI * 2) * speed;
            p.vy = Math.sin(Math.random() * Math.PI * 2) * speed;
            particles.push(p);
        }
        if (window.audioFX && typeof window.audioFX.playBombExplode === 'function') {
            window.audioFX.playBombExplode();
        } else if (window.audioFX) {
            window.audioFX.playHit();
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(frames * 0.1);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * (this.radius + 5), Math.sin(a) * (this.radius + 5));
            ctx.stroke();
        }
        ctx.restore();
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
                for (let i = 0; i < 4; i++) {
                    particles.push(new Particle(this.x, this.y, this.color));
                }
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

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'rapid_fire'
        this.radius = 8;
        this.color = '#ff6600';
        this.markedForDeletion = false;
        this.pulseTime = 0;
        this.life = 10.0;
    }
    update(deltaTime) {
        this.pulseTime += deltaTime * 0.05;
        this.life -= deltaTime * 0.01667;
        if (this.life <= 0) this.markedForDeletion = true;
        
        // Collect when ship physically touches/collides with the power-up
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < player.radius + this.radius + 3) {
            this.markedForDeletion = true;
            this.collect();
        }
    }
    collect() {
        if (this.type === 'rapid_fire') {
            player.rapidFireTimer = 8.0;
            floatingTexts.push(new FloatingText(player.x, player.y - 30, "RAPID FIRE OVERDRIVE!!!", '#ff6600'));
            if (window.audioFX && typeof window.audioFX.playPowerUp === 'function') {
                window.audioFX.playPowerUp();
            } else if (window.audioFX) {
                window.audioFX.playLevelUp();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const scale = 1.0 + Math.sin(this.pulseTime) * 0.15;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        
        ctx.restore();
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
        ctx.font = 'bold 12px "Outfit", sans-serif';
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

function getNearestEnemies(x, y, count) {
    const sorted = [...enemies].sort((a, b) => {
        return Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y);
    });
    return sorted.slice(0, count);
}

// Upgrades logic
const UPGRADES = [
    {
        id: 'blaster_dmg', name: 'Blaster Damage', icon: '🔫', desc: 'Increases basic attack damage.',
        apply: () => { player.weapons.blaster.damage += 5; }
    },
    {
        id: 'blaster_speed', name: 'Rapid Fire', icon: '⚡', desc: 'Shoots basic attacks much faster.',
        apply: () => { 
            player.weapons.blaster.cooldown = Math.max(0.1, player.weapons.blaster.cooldown - 0.1); 
            player.rapidFireTimer = 8.0;
        }
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
        id: 'heal', name: 'Emergency Repair', icon: '❤️', desc: 'Restores 50% max HP.',
        apply: () => { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); }
    },
    {
        id: 'missile_up', name: 'Homing Missiles', icon: '🚀', desc: 'Fires seeking missiles that lock on and destroy.',
        apply: () => {
            player.weapons.missile.level = Math.min(4, player.weapons.missile.level + 1);
            player.weapons.missile.damage += 5;
        }
    },
    {
        id: 'bomb_up', name: 'Plasma Bomb', icon: '💣', desc: 'Launches a tactical bomb dealing heavy area damage.',
        apply: () => {
            player.weapons.bomb.level = Math.min(4, player.weapons.bomb.level + 1);
            player.weapons.bomb.damage += 10;
        }
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
    
    frames += deltaTime;

    // Screenshake decay
    if (shakeTime > 0) {
        shakeTime -= dtSeconds;
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
    } else {
        shakeX = 0;
        shakeY = 0;
        shakeIntensity = 0;
    }

    // Flash decay
    if (flashAlpha > 0) {
        flashAlpha -= deltaTime * 0.04;
    }

    // Combo timer decay
    if (comboTimer > 0) {
        comboTimer -= dtSeconds;
        if (comboTimer <= 0) {
            comboCount = 0;
        }
    }

    // Dynamic music tempo scaling
    if (window.audioFX) {
        window.audioFX.setTempo(120 + gameTime / 6.0);
    }

    // Update ripples
    gridRipples.forEach(r => r.update(deltaTime));
    gridRipples = gridRipples.filter(r => r.life > 0);

    // Achievements
    if (gameTime >= 300 && window.achievements) { // 5 minutes
        window.achievements.unlock('survivor', 'survive_5m', 'Survived 5 Minutes');
    }

    player.update(deltaTime);
    spawnEnemies(deltaTime);

    bombRings.forEach(br => br.update(deltaTime));
    bombRings = bombRings.filter(br => !br.markedForDeletion);

    enemies.forEach(e => e.update(deltaTime));
    projectiles.forEach(p => p.update(deltaTime));
    gems.forEach(g => g.update(deltaTime));
    powerups.forEach(pu => pu.update(deltaTime));
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
                    const dx = e.x - player.x;
                    const dy = e.y - player.y;
                    const len = Math.hypot(dx, dy);
                    e.takeDamage(player.weapons.orbital.damage * deltaTime * 0.01667 * 5, dx/len, dy/len); 
                }
            });
        }
    }

    // 3. Enemies vs Player
    enemies.forEach(e => {
        if (e.markedForDeletion) return;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < e.radius + player.radius) {
            player.takeDamage(e.damage * deltaTime * 0.01667);
        }
    });

    // Cleanup
    enemies = enemies.filter(e => !e.markedForDeletion);
    projectiles = projectiles.filter(p => !p.markedForDeletion);
    gems = gems.filter(g => !g.markedForDeletion);
    powerups = powerups.filter(pu => !pu.markedForDeletion);
    particles = particles.filter(p => p.life > 0);
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    // Apply screenshake translation to game world elements
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw background (grid)
    ctx.fillStyle = 'rgba(5, 5, 16, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid Lines Drawing (Warped)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const offsetX = (player.x * -0.1) % gridSize; // Parallax effect
    const offsetY = (player.y * -0.1) % gridSize;
    
    // Draw vertical lines
    for (let gx = offsetX - gridSize; gx < canvas.width + gridSize; gx += gridSize) {
        ctx.beginPath();
        let first = true;
        for (let gy = 0; gy <= canvas.height; gy += 25) {
            let wx = gx;
            let wy = gy;
            
            // Apply ripples
            let dispX = 0, dispY = 0;
            gridRipples.forEach(r => {
                const dx = wx - r.x;
                const dy = wy - r.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < r.radius + 80 && dist > r.radius - 80) {
                    const distFromFront = Math.abs(dist - r.radius);
                    const factor = (1.0 - distFromFront / 80) * r.life * r.strength;
                    dispX += (dx / dist) * factor * 25;
                    dispY += (dy / dist) * factor * 25;
                }
            });
            
            if (first) {
                ctx.moveTo(wx + dispX, wy + dispY);
                first = false;
            } else {
                ctx.lineTo(wx + dispX, wy + dispY);
            }
        }
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let gy = offsetY - gridSize; gy < canvas.height + gridSize; gy += gridSize) {
        ctx.beginPath();
        let first = true;
        for (let gx = 0; gx <= canvas.width; gx += 25) {
            let wx = gx;
            let wy = gy;
            
            // Apply ripples
            let dispX = 0, dispY = 0;
            gridRipples.forEach(r => {
                const dx = wx - r.x;
                const dy = wy - r.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < r.radius + 80 && dist > r.radius - 80) {
                    const distFromFront = Math.abs(dist - r.radius);
                    const factor = (1.0 - distFromFront / 80) * r.life * r.strength;
                    dispX += (dx / dist) * factor * 25;
                    dispY += (dy / dist) * factor * 25;
                }
            });
            
            if (first) {
                ctx.moveTo(wx + dispX, wy + dispY);
                first = false;
            } else {
                ctx.lineTo(wx + dispX, wy + dispY);
            }
        }
        ctx.stroke();
    }

    gems.forEach(g => g.draw(ctx));
    powerups.forEach(pu => pu.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    bombRings.forEach(br => br.draw(ctx));
    player.draw(ctx);
    floatingTexts.forEach(ft => ft.draw(ctx));

    ctx.restore();

    // Combo Multiplier HUD
    if (comboCount >= 3) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const pulse = 1.0 + Math.sin(frames * 0.15) * 0.08 + Math.min(0.3, (comboCount / 20) * 0.1);
        ctx.translate(canvas.width / 2, 85);
        ctx.scale(pulse, pulse);
        
        ctx.font = 'bold 20px "Outfit", sans-serif';
        ctx.fillStyle = '#ff00ea'; // neon pink
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 12;
        ctx.fillText(`${comboCount}x COMBO!`, 0, 0);
        
        const barW = 80;
        const barH = 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-barW / 2, 12, barW, barH);
        
        ctx.fillStyle = '#ff00ea';
        ctx.shadowBlur = 6;
        ctx.fillRect(-barW / 2, 12, barW * (comboTimer / 2.0), barH);
        
        ctx.restore();
    }

    // XP Bar at top
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, canvas.width, 5);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(0, 0, canvas.width * (player.xp / player.xpNeeded), 5);

    // 1. Ultimate Bar at bottom-center
    const barW = 300;
    const barH = 8;
    const barX = canvas.width / 2 - barW / 2;
    const barY = canvas.height - 30;

    // 1.5. Rapid Fire Countdown Bar
    if (player.rapidFireTimer > 0) {
        const rfBarW = 220;
        const rfBarH = 6;
        const rfBarX = canvas.width / 2 - rfBarW / 2;
        const rfBarY = barY - 18;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(rfBarX, rfBarY, rfBarW, rfBarH);
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.fillRect(rfBarX, rfBarY, rfBarW * (player.rapidFireTimer / 8.0), rfBarH);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`RAPID FIRE: ${player.rapidFireTimer.toFixed(1)}s`, canvas.width / 2, rfBarY - 6);
        ctx.restore();
    }
    
    ctx.save();
    // Background slot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(barX, barY, barW, barH);
    
    // Fill ratio
    let chargeRatio = player.ultimateCharge / 100;
    let isUltReady = player.ultimateCharge >= 100;
    let isUltActive = player.ultimateTime > 0;
    
    if (isUltActive) {
        // Active overload progress bar (decaying ultimateTime)
        let activeRatio = player.ultimateTime / 6.0;
        ctx.fillStyle = '#ff00ea';
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 10;
        ctx.fillRect(barX, barY, barW * activeRatio, barH);
    } else {
        ctx.fillStyle = isUltReady ? '#ff00ea' : '#7f00aa';
        if (isUltReady) {
            ctx.shadowColor = '#ff00ea';
            ctx.shadowBlur = 10;
        }
        ctx.fillRect(barX, barY, barW * chargeRatio, barH);
    }
    
    // Draw boundary line
    ctx.strokeStyle = isUltReady ? '#ff00ea' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    
    // Draw Pulsing Text Alert
    if (isUltReady && !isUltActive) {
        ctx.fillStyle = '#ff00ea';
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.5 + Math.sin(frames * 0.2) * 0.5;
        ctx.fillText('[SPACE] REACTOR OVERLOAD', canvas.width / 2, barY - 12);
    } else if (isUltActive) {
        ctx.fillStyle = '#ff00ea';
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OVERCHARGE ACTIVE', canvas.width / 2, barY - 12);
    }
    ctx.restore();

    // 2. Circular Ultimate Button in bottom-right corner
    const btnX = canvas.width - 80;
    const btnY = canvas.height - 80;
    const btnR = 30;
    
    ctx.save();
    // Outer border ring
    ctx.strokeStyle = isUltActive ? '#ff00ea' : (isUltReady ? '#ff00ea' : 'rgba(0, 243, 255, 0.25)');
    ctx.lineWidth = 2;
    if (isUltReady || isUltActive) {
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 15;
    } else {
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 4;
    }
    ctx.beginPath();
    ctx.arc(btnX, btnY, btnR + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Inner filled core indicating charge
    ctx.fillStyle = isUltActive ? '#ff00ea' : (isUltReady ? '#ff00ea' : 'rgba(0, 243, 255, 0.08)');
    ctx.beginPath();
    ctx.arc(btnX, btnY, btnR * (isUltActive ? 1.0 : chargeRatio), 0, Math.PI * 2);
    ctx.fill();

    // Icon (lightning bolt)
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isUltActive ? '#fff' : (isUltReady ? '#fff' : 'rgba(0, 243, 255, 0.4)');
    ctx.fillText('⚡', btnX, btnY);
    ctx.restore();
    // 3. Circular Bomb Button in bottom-left corner
    const bombBtnX = 80;
    const bombBtnY = canvas.height - 80;
    const bombBtnR = 30;
    
    ctx.save();
    ctx.strokeStyle = player.bombs > 0 ? '#ffb700' : 'rgba(255, 183, 0, 0.25)';
    ctx.lineWidth = 2;
    if (player.bombs > 0) {
        ctx.shadowColor = '#ffb700';
        ctx.shadowBlur = 15;
    } else {
        ctx.shadowColor = 'rgba(255, 183, 0, 0.2)';
        ctx.shadowBlur = 4;
    }
    ctx.beginPath();
    ctx.arc(bombBtnX, bombBtnY, bombBtnR + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = player.bombs > 0 ? 'rgba(255, 183, 0, 0.2)' : 'rgba(255, 183, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(bombBtnX, bombBtnY, bombBtnR, 0, Math.PI * 2);
    ctx.fill();
    
    // Cooldown visual sweep overlay
    if (player.bombCooldownTimer > 0) {
        ctx.save();
        const cooldownRatio = player.bombCooldownTimer / 0.6;
        ctx.beginPath();
        ctx.moveTo(bombBtnX, bombBtnY);
        ctx.arc(bombBtnX, bombBtnY, bombBtnR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownRatio);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
        ctx.restore();
    }
    
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = player.bombs > 0 ? '#fff' : 'rgba(255, 183, 0, 0.4)';
    ctx.fillText('💣', bombBtnX, bombBtnY);
    
    // Draw bomb count badge
    if (player.bombs > 0) {
        ctx.beginPath();
        ctx.arc(bombBtnX + 18, bombBtnY - 18, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3300';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillText(player.bombs, bombBtnX + 18, bombBtnY - 18);
    }
    ctx.restore();
    // Fullscreen Impact Flash Overlay
    if (flashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = Math.min(0.8, flashAlpha);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
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
    powerups = [];
    particles = [];
    floatingTexts = [];
    gridRipples = [];
    bombRings = [];
    comboCount = 0;
    comboTimer = 0;
    gameTime = 0;
    killCount = 0;
    spawnTimer = 0;
    bossSpawnedAt.clear();
    
    // Juicing resets
    shakeTime = 0;
    shakeIntensity = 0;
    shakeX = 0;
    shakeY = 0;
    flashAlpha = 0;
    frames = 0;

    uiTime.textContent = '00:00';
    uiLevel.textContent = '1';
    uiKills.textContent = '0';

    if (window.audioFX) {
        window.audioFX.init();
        window.audioFX.startMusic();
    }

    gameState = 'PLAYING';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMenu.classList.remove('hidden');
        if (window.audioFX) window.audioFX.stopMusic();
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseMenu.classList.add('hidden');
        if (window.audioFX) window.audioFX.startMusic();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function quitGame() {
    gameState = 'MENU';
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    if (window.audioFX) window.audioFX.stopMusic();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (window.audioFX) {
        window.audioFX.stopMusic();
        window.audioFX.playGameOver();
    }
    
    // Screen rumble on death
    triggerShake(30, 1.0);
    flashAlpha = 0.8;
    flashColor = 'rgba(255, 0, 85, 0.6)';

    document.getElementById('go-time').textContent = formatTime(gameTime);
    document.getElementById('go-kills').textContent = killCount;
    document.getElementById('go-level').textContent = player.level;
    
    gameOverMenu.classList.remove('hidden');
}

// Stop music on return to hub clicks
document.querySelectorAll('.hub-btn, .hub-over-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.audioFX) window.audioFX.stopMusic();
    });
});

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
