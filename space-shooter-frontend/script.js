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

// --- Spaceship Sprite & Chroma Key Transparentizer ---
const spaceshipSprite = new Image();
spaceshipSprite.src = 'player_ship.png';
let spaceshipCanvas = null; // Cached transparent canvas version

function processSpaceshipSprite() {
    if (!spaceshipSprite.complete) return;
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = spaceshipSprite.width;
        tempCanvas.height = spaceshipSprite.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(spaceshipSprite, 0, 0);
        
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        
        // Remove black background (colors close to black)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // If color is very dark (r, g, b all below 15)
            if (r < 15 && g < 15 && b < 15) {
                data[i+3] = 0; // Transparent
            }
        }
        tempCtx.putImageData(imgData, 0, 0);
        spaceshipCanvas = tempCanvas;
    } catch (e) {
        console.warn("Failed to transparentize spaceship sprite, falling back to raw image:", e);
        spaceshipCanvas = spaceshipSprite;
    }
}
spaceshipSprite.onload = processSpaceshipSprite;
if (spaceshipSprite.complete) {
    processSpaceshipSprite();
}

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

// Juice System variables
let gridRipples = [];
let gridOffset = 0;
let flashAlpha = 0;
let flashActive = false;
let flashColor = '#fff';
let timeDilation = 1.0;
let slowMoTimer = 0;

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

// --- 3D Projection Utilities ---
function rotateX(x, y, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x, y: y * cos - z * sin, z: y * sin + z * cos };
}
function rotateY(x, y, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x * cos + z * sin, y: y, z: -x * sin + z * cos };
}
function rotateZ(x, y, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x * cos - y * sin, y: x * sin + y * cos, z: z };
}
function project3D(v, rotX, rotY, rotZ, scale, offsetX, offsetY) {
    let r = rotateX(v.x, v.y, v.z, rotX);
    r = rotateY(r.x, r.y, r.z, rotY);
    r = rotateZ(r.x, r.y, r.z, rotZ);
    const d = 260; // Camera distance / focal length
    const distZ = 120; // Shift depth back to avoid division by zero
    const pZ = r.z + distZ;
    const px = (r.x * d) / pZ;
    const py = (r.y * d) / pZ;
    return {
        x: px * scale + offsetX,
        y: -py * scale + offsetY,
        z: r.z
    };
}
function getFaceAverageZ(face, vertices, rotX, rotY, rotZ) {
    let zSum = 0;
    face.forEach(idx => {
        const v = vertices[idx];
        let r = rotateX(v.x, v.y, v.z, rotX);
        r = rotateY(r.x, r.y, r.z, rotY);
        r = rotateZ(r.x, r.y, r.z, rotZ);
        zSum += r.z;
    });
    return zSum / face.length;
}

// --- Classes ---

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.reset();
        this.color = '#00ffcc';
        this.shootCooldown = 280;
        this.lastShot = 0;
        this.lives = 3;
        this.shield = false;
        this.speedBoost = false;
        this.speedBoostTimer = 0;
        this.invulnerable = false;
        this.invulnTimer = 0;
        
        // Juice properties
        this.minWeaponTier = 1; // Unlocked permanently by boss progression
        this.weaponTier = 1;
        this.trail = [];

        // 3D Model definition (fallback when image is not loaded)
        this.vertices = [
            { x: 0, y: 0, z: 25 },    // 0: Nose (front tip)
            { x: 0, y: 5, z: 5 },     // 1: Cockpit top
            { x: -20, y: -4, z: -15 }, // 2: Left wingtip
            { x: 20, y: -4, z: -15 },  // 3: Right wingtip
            { x: 0, y: -6, z: -20 },   // 4: Bottom center rear
            { x: 0, y: 12, z: -20 },   // 5: Tail fin top
            { x: -6, y: -3, z: -20 },  // 6: Left engine corner
            { x: 6, y: -3, z: -20 }    // 7: Right engine corner
        ];
        this.faces = [
            [0, 1, 2], [0, 3, 1], [0, 2, 4], [0, 4, 3],
            [1, 5, 2], [3, 5, 1], [2, 6, 4], [4, 7, 3],
            [5, 6, 2], [5, 3, 7], [6, 7, 5], [4, 6, 7]
        ];
        this.rotY = 0;
        this.roll = 0;
        this.pitch = 0.2;
    }

    reset() {
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 80;
        this.vx = 0;
        this.vy = 0;
        this.speed = 6;
        this.roll = 0;
        this.pitch = 0.2;
        this.weaponTier = this.minWeaponTier || 1;
    }

    update(deltaTime) {
        // Keyboard movement
        const moveSpeed = this.speed * deltaTime;
        let rollTarget = 0;
        let pitchTarget = 0.2; // slight nose down normally

        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.x -= moveSpeed;
            rollTarget = -0.45;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.x += moveSpeed;
            rollTarget = 0.45;
        }
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.y -= moveSpeed;
            pitchTarget = 0.45;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.y += moveSpeed;
            pitchTarget = -0.15;
        }

        // Interpolate roll/pitch smooth transition
        this.roll = this.roll * 0.82 + rollTarget * 0.18;
        this.pitch = this.pitch * 0.82 + pitchTarget * 0.18;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;

        // Exhaust Particles
        if (gameRunning && Math.random() < 0.65 * deltaTime) {
            const px = this.x + this.width / 2 + (Math.random() - 0.5) * 8;
            const py = this.y + this.height - 3;
            // Spawn flame particles shooting downwards
            particles.push(new Particle(px, py, this.color, (Math.random() - 0.5) * 2, 4 + Math.random() * 2, Math.random() * 2.5 + 1.5, 0.04));
        }

        // Motion Trails
        this.trail.push({ x: this.x, y: this.y, roll: this.roll, pitch: this.pitch });
        if (this.trail.length > 8) this.trail.shift();

        // Auto-shoot
        const now = Date.now();
        const cooldown = this.speedBoost ? this.shootCooldown / 2.2 : this.shootCooldown;
        if (now - this.lastShot > cooldown && gameRunning) {
            this.shoot();
            this.lastShot = now;
        }

        // Powerup Timers
        if (this.speedBoost) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedBoost = false;
                this.weaponTier = Math.max(this.minWeaponTier, this.weaponTier - 1);
            }
        }

        // Invulnerability Timer
        if (this.invulnerable) {
            this.invulnTimer -= deltaTime;
            if (this.invulnTimer <= 0) this.invulnerable = false;
        }
    }

    shoot() {
        const bulletColor = this.weaponTier >= 5 ? '#ff0055' : (this.weaponTier === 4 ? '#ff00ff' : (this.weaponTier === 3 ? '#ffcc00' : (this.weaponTier === 2 ? '#00ff66' : '#00ffcc')));
        
        if (this.weaponTier === 1) {
            bullets.push(new Bullet(this.x + this.width / 2, this.y, 0, -12, bulletColor));
        } else if (this.weaponTier === 2) {
            bullets.push(new Bullet(this.x + 8, this.y, 0, -12, bulletColor));
            bullets.push(new Bullet(this.x + this.width - 8, this.y, 0, -12, bulletColor));
        } else if (this.weaponTier === 3) {
            bullets.push(new Bullet(this.x + this.width / 2, this.y, 0, -12, bulletColor));
            bullets.push(new Bullet(this.x + 4, this.y, -2.5, -11.5, bulletColor));
            bullets.push(new Bullet(this.x + this.width - 4, this.y, 2.5, -11.5, bulletColor));
        } else if (this.weaponTier === 4) {
            bullets.push(new Bullet(this.x + this.width / 2 - 8, this.y, 0, -12, bulletColor));
            bullets.push(new Bullet(this.x + this.width / 2 + 8, this.y, 0, -12, bulletColor));
            bullets.push(new Bullet(this.x, this.y, -2.5, -11.5, bulletColor, true)); // Homing
            bullets.push(new Bullet(this.x + this.width, this.y, 2.5, -11.5, bulletColor, true)); // Homing
        } else if (this.weaponTier === 5) {
            // 5-way spread + dual homing
            bullets.push(new Bullet(this.x + this.width / 2, this.y, 0, -12.5, bulletColor));
            bullets.push(new Bullet(this.x + 6, this.y, -2.5, -12, bulletColor));
            bullets.push(new Bullet(this.x + this.width - 6, this.y, 2.5, -12, bulletColor));
            bullets.push(new Bullet(this.x - 4, this.y, -4.5, -11, bulletColor, true)); // Homing
            bullets.push(new Bullet(this.x + this.width + 4, this.y, 4.5, -11, bulletColor, true)); // Homing
        } else { // Tier 6 (Hyper)
            // 6 main bullets + 2 automated wingtip missiles!
            bullets.push(new Bullet(this.x + this.width / 2 - 10, this.y, 0, -13, '#ffffff'));
            bullets.push(new Bullet(this.x + this.width / 2 + 10, this.y, 0, -13, '#ffffff'));
            bullets.push(new Bullet(this.x + 6, this.y, -3.0, -12.5, bulletColor));
            bullets.push(new Bullet(this.x + this.width - 6, this.y, 3.0, -12.5, bulletColor));
            bullets.push(new Bullet(this.x - 4, this.y, -5.5, -11.5, bulletColor, true)); // Homing
            bullets.push(new Bullet(this.x + this.width + 4, this.y, 5.5, -11.5, bulletColor, true)); // Homing
            bullets.push(new Bullet(this.x - 12, this.y, -8.0, -11.0, '#ffffff', true)); // Homing
            bullets.push(new Bullet(this.x + this.width + 12, this.y, 8.0, -11.0, '#ffffff', true)); // Homing
        }

        if (typeof playLaserSound === 'function') {
            playLaserSound(this.weaponTier);
        } else if (window.audioFX) {
            window.audioFX.playJump();
        }
        
        // Small recoil screenshake
        screenShake = Math.max(screenShake, this.weaponTier * 1.2);
        
        // Spawn small launch ripples at the gun tips
        if (typeof addGridRipple === 'function') {
            addGridRipple(this.x + this.width / 2, this.y, 4, 40, 2);
        }
    }

    draw() {
        ctx.save();
        
        const offsetX = this.x + this.width / 2;
        const offsetY = this.y + this.height / 2;

        // Draw trailing motion ghost ships in 3D wireframe or image trails
        if (this.speedBoost || this.invulnerable) {
            this.trail.forEach((t, index) => {
                const ratio = (index + 1) / this.trail.length; // 0 to 1
                ctx.save();
                ctx.globalAlpha = ratio * 0.22;
                ctx.shadowBlur = 4;
                ctx.shadowColor = this.color;
                
                const ghostX = t.x + this.width / 2;
                const ghostY = t.y + this.height / 2;

                if (spaceshipCanvas) {
                    ctx.translate(ghostX, ghostY);
                    ctx.rotate(t.roll * 0.4);
                    ctx.scale(Math.cos(t.roll * 0.8), 1.0);
                    ctx.drawImage(spaceshipCanvas, -this.width / 2, -this.height / 2, this.width, this.height);
                } else {
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1;
                    const projected = this.vertices.map(v => 
                        project3D(v, t.pitch, 0, t.roll, 1.1, ghostX, ghostY)
                    );
                    
                    this.faces.forEach(face => {
                        ctx.beginPath();
                        face.forEach((idx, i) => {
                            const p = projected[idx];
                            if (i === 0) ctx.moveTo(p.x, p.y);
                            else ctx.lineTo(p.x, p.y);
                        });
                        ctx.closePath();
                        ctx.stroke();
                    });
                }
                ctx.restore();
            });
        }

        if (spaceshipCanvas) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            if (this.invulnerable && frameCount % 10 < 5) {
                ctx.globalAlpha = 0.3; // Flicker
            }
            ctx.translate(offsetX, offsetY);
            ctx.rotate(this.roll * 0.4);
            ctx.scale(Math.cos(this.roll * 0.8), 1.0);
            ctx.drawImage(spaceshipCanvas, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.fillStyle = 'rgba(0, 255, 204, 0.15)'; // Hologram fill
            ctx.lineWidth = 2.5;

            if (this.invulnerable && frameCount % 10 < 5) {
                ctx.globalAlpha = 0.3; // Flicker
            }

            // Project spaceship vertices
            const projected = this.vertices.map(v => 
                project3D(v, this.pitch, this.rotY, this.roll, 1.1, offsetX, offsetY)
            );

            // Sort faces by depth
            const sortedFaces = this.faces.map(face => {
                const zAvg = getFaceAverageZ(face, this.vertices, this.pitch, this.rotY, this.roll);
                return { face, zAvg };
            }).sort((a, b) => b.zAvg - a.zAvg);

            // Draw sorted faces
            sortedFaces.forEach(fd => {
                ctx.beginPath();
                fd.face.forEach((idx, i) => {
                    const p = projected[idx];
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        }

        ctx.globalAlpha = 1.0;

        // Draw shield ring
        if (this.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, this.width - 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
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
    constructor(x, y, vx = 0, vy = -12, color = '#fff', isHoming = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 4;
        this.height = 15;
        this.color = color;
        this.isHoming = isHoming;

        if (isHoming) {
            this.width = 6;
            this.height = 18;
            this.color = '#ff3366'; // Distinct hot pink color for homing missiles
        }
    }

    update(deltaTime) {
        if (this.isHoming) {
            let target = null;
            let minDist = Infinity;

            // Prioritize boss if active
            if (boss && bossState === 'active') {
                target = boss;
            } else {
                // Find closest enemy
                enemies.forEach(e => {
                    const dx = (e.x + e.width / 2) - this.x;
                    const dy = (e.y + e.height / 2) - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        target = e;
                    }
                });

                // Check asteroids
                asteroids.forEach(a => {
                    const dx = a.x - this.x;
                    const dy = a.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        target = a;
                    }
                });
            }

            if (target) {
                const tx = (target.x + (target.width ? target.width / 2 : 0)) - this.x;
                const ty = (target.y + (target.height ? target.height / 2 : 0)) - this.y;
                const dist = Math.sqrt(tx * tx + ty * ty);

                if (dist > 10) {
                    const targetVx = (tx / dist) * 14;
                    const targetVy = (ty / dist) * 14;
                    // Interpolate velocity towards target
                    this.vx = this.vx * 0.88 + targetVx * 0.12;
                    this.vy = this.vy * 0.88 + targetVy * 0.12;
                }
            }
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Align bullet visual orientation with its velocity vector
        const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.restore();
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

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
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

const BOSS_TEMPLATES = [
    {
        name: "MECHA DRAGON V1",
        color: "#ff00ff", // Magenta
        baseHealth: 150,
        scale: 1.0,
        hornLength: 25,
        attackType: "dragon_v1"
    },
    {
        name: "HYPERION CRIMSON",
        color: "#ff3300", // Crimson/Orange-Red
        baseHealth: 250,
        scale: 1.25,
        hornLength: 35,
        attackType: "crimson"
    },
    {
        name: "VOID SENTINEL",
        color: "#00ff88", // Green/Emerald
        baseHealth: 400,
        scale: 1.45,
        hornLength: 45,
        attackType: "void"
    },
    {
        name: "OMEGA DOOMSDAY",
        color: "#00ffff", // Cyan/Electric Blue
        baseHealth: 600,
        scale: 1.7,
        hornLength: 55,
        attackType: "omega"
    }
];

class Boss {
    constructor() {
        const templateIndex = bossDefeatedCount % BOSS_TEMPLATES.length;
        const loopCount = Math.floor(bossDefeatedCount / BOSS_TEMPLATES.length);
        const template = BOSS_TEMPLATES[templateIndex];

        this.name = template.name + (loopCount > 0 ? ` Mk.${loopCount + 1}` : "");
        this.color = template.color;
        this.scale = template.scale * (1 + loopCount * 0.15);
        this.maxHealth = Math.floor(template.baseHealth * (1 + loopCount * 0.5));
        this.health = this.maxHealth;
        this.hornLength = template.hornLength * (1 + loopCount * 0.1);
        this.attackType = template.attackType;

        this.width = 120 * this.scale;
        this.height = 80 * this.scale;
        this.x = canvas.width / 2;
        this.y = -200; // Start off-screen
        this.phase = 1;
        this.speed = 2 * (1 + loopCount * 0.1);
        this.targetX = canvas.width / 2;
        this.lastShot = 0;
        this.lastSpawn = 0;
        this.entryFinished = false;
        this.floatOffset = 0;
        
        const s = this.scale;
        const hl = this.hornLength;

        this.segments = []; // For dragon body
        for (let i = 0; i < 5; i++) {
            this.segments.push({ x: this.x, y: this.y - (i * 30 * s), size: (40 - i * 5) * s });
        }
        
        // Laser state
        this.laserCharging = false;
        this.laserActive = false;
        this.laserTimer = 0;
        this.laserType = 'standard';

        // 3D Dragon Skull Head model
        this.vertices = [
            { x: 0 * s, y: -5 * s, z: -35 * s },             // 0: Nose tip (front)
            { x: -15 * s, y: -10 * s, z: -15 * s },          // 1: Left front jaw
            { x: 15 * s, y: -10 * s, z: -15 * s },           // 2: Right front jaw
            { x: 0 * s, y: 15 * s, z: -10 * s },             // 3: Forehead center
            { x: -25 * s, y: 5 * s, z: 0 * s },              // 4: Left eye deck
            { x: 25 * s, y: 5 * s, z: 0 * s },               // 5: Right eye deck
            { x: -35 * s - (hl - 25) * 0.8, y: 25 * s + (hl - 25) * 0.5, z: 25 * s + (hl - 25) * 0.8 }, // 6: Left horn tip
            { x: 35 * s + (hl - 25) * 0.8, y: 25 * s + (hl - 25) * 0.5, z: 25 * s + (hl - 25) * 0.8 },  // 7: Right horn tip
            { x: 0 * s, y: 20 * s, z: 20 * s },              // 8: Crown center
            { x: 0 * s, y: -15 * s, z: 15 * s },             // 9: Rear bottom jaw
            { x: 0 * s, y: 0 * s, z: 30 * s }                // 10: Spine connection
        ];
        this.faces = [
            [0, 3, 1], [0, 2, 3], // Snout top
            [0, 1, 9], [0, 9, 2], // Snout bottom
            [3, 4, 1], [3, 2, 5], // Forehead sides
            [4, 6, 8], [5, 8, 7], // Horns upper connection
            [3, 8, 4], [3, 5, 8], // Skull top plates
            [4, 9, 6], [5, 7, 9], // Jaw to horns outer
            [6, 10, 8], [7, 8, 10], // Horns to spine back
            [9, 10, 6], [9, 7, 10]  // Jaw to spine back lower
        ];
    }

    update(deltaTime) {
        // Entry
        if (!this.entryFinished) {
            this.y += 2 * deltaTime;
            if (this.y >= 100) this.entryFinished = true;
        } else {
            // Hover movement
            this.floatOffset += 0.05 * deltaTime;
            this.y = 100 + Math.sin(this.floatOffset) * 20;
            
            if (Math.abs(this.x - this.targetX) < 5) {
                this.targetX = 200 + Math.random() * (canvas.width - 400);
            }
            this.x += (this.targetX - this.x) * 0.02 * deltaTime;
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
                this.updateLaser(deltaTime);
            } else {
                this.shoot(deltaTime);
                if (this.phase === 3) this.spawnMinions(deltaTime);
            }
        }
    }

    updateLaser(deltaTime) {
        this.laserTimer -= deltaTime;
        if (this.laserCharging) {
            if (this.laserTimer <= 0) {
                this.laserCharging = false;
                this.laserActive = true;
                this.laserTimer = 150; // Fire for 2.5 seconds
                screenShake = 20;
            }
        } else if (this.laserActive) {
            // Collision with player
            const py = player.y + 20;
            const px = player.x + 20;
            
            if (py > this.y + 30) {
                if (this.laserType === 'double') {
                    // Two lasers
                    const lx1 = this.x - 35 * this.scale;
                    const lx2 = this.x + 35 * this.scale;
                    if (Math.abs(px - lx1) < 25 || Math.abs(px - lx2) < 25) {
                        handleCollision(this, 0, 'laser');
                    }
                } else if (this.laserType === 'sweep') {
                    // Sweeping laser
                    const laserEndX = this.x + Math.sin(this.laserTimer * 0.06) * 350;
                    const t = (py - (this.y + 30)) / (canvas.height - (this.y + 30));
                    const lx = this.x + t * (laserEndX - this.x);
                    if (Math.abs(px - lx) < 30) {
                        handleCollision(this, 0, 'laser');
                    }
                } else if (this.laserType === 'hyper') {
                    // Hyper laser (massive beam)
                    if (Math.abs(px - this.x) < 70 * this.scale) {
                        handleCollision(this, 0, 'laser');
                    }
                } else {
                    // Standard laser
                    if (Math.abs(px - this.x) < 40 * this.scale) {
                        handleCollision(this, 0, 'laser');
                    }
                }
            }
            
            if (this.laserTimer <= 0) {
                this.laserActive = false;
                this.laserType = 'standard';
                this.lastShot = Date.now(); // Reset cooldown
            }
        }
    }

    shoot(deltaTime) {
        const now = Date.now();
        let cooldown = 1500 - (this.phase * 300);
        if (this.attackType === 'void') cooldown -= 200;
        else if (this.attackType === 'omega') cooldown -= 300;

        if (now - this.lastShot > cooldown) {
            this.lastShot = now;
            
            if (this.attackType === 'dragon_v1') {
                if (this.phase === 1) {
                    this.fireAtPlayer(5);
                } else if (this.phase === 2) {
                    for (let angle = -0.4; angle <= 0.4; angle += 0.4) {
                        bossBullets.push(new BossBullet(this.x, this.y + 40, Math.sin(angle) * 5, 5, this.color));
                    }
                } else if (this.phase === 3) {
                    if (Math.random() > 0.6) {
                        this.laserCharging = true;
                        this.laserTimer = 90; // 1.5s charge
                        this.laserType = 'standard';
                    } else {
                        this.fireAtPlayer(6);
                    }
                }
            } else if (this.attackType === 'crimson') {
                if (this.phase === 1) {
                    // Alternating dual streams
                    const offset = (frameCount % 2 === 0) ? -25 * this.scale : 25 * this.scale;
                    bossBullets.push(new BossBullet(this.x + offset, this.y + 20, 0, 6, this.color));
                } else if (this.phase === 2) {
                    // 5-bullet fan spread
                    for (let angle = -0.8; angle <= 0.8; angle += 0.4) {
                        bossBullets.push(new BossBullet(this.x, this.y + 30, Math.sin(angle) * 5.5, Math.cos(angle) * 5.5, this.color));
                    }
                } else if (this.phase === 3) {
                    if (Math.random() > 0.6) {
                        this.laserCharging = true;
                        this.laserTimer = 75; // 1.25s charge
                        this.laserType = 'standard';
                    } else {
                        // Circle burst (8 bullets)
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle) * 5, Math.sin(angle) * 5, this.color));
                        }
                    }
                }
            } else if (this.attackType === 'void') {
                if (this.phase === 1) {
                    // Spiral pattern
                    const angle = (frameCount * 0.15);
                    bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle) * 5, Math.sin(angle) * 5, this.color));
                } else if (this.phase === 2) {
                    // Double spiral
                    const angle1 = (frameCount * 0.2);
                    const angle2 = angle1 + Math.PI;
                    bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle1) * 5.5, Math.sin(angle1) * 5.5, this.color));
                    bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle2) * 5.5, Math.sin(angle2) * 5.5, this.color));
                    if (Math.random() > 0.7) {
                        this.fireAtPlayer(6.5);
                    }
                } else if (this.phase === 3) {
                    if (Math.random() > 0.5) {
                        this.laserCharging = true;
                        this.laserTimer = 90;
                        this.laserType = 'double';
                    } else {
                        // Rapid spiral
                        for (let i = 0; i < 3; i++) {
                            const angle = (frameCount * 0.1) + (i * Math.PI / 1.5);
                            bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle) * 6, Math.sin(angle) * 6, this.color));
                        }
                    }
                }
            } else if (this.attackType === 'omega') {
                if (this.phase === 1) {
                    // Aimed 3-way burst
                    const dx = player.x + 20 - this.x;
                    const dy = player.y + 20 - this.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 10) {
                        const vx = (dx/dist) * 6;
                        const vy = (dy/dist) * 6;
                        bossBullets.push(new BossBullet(this.x, this.y + 30, vx, vy, this.color));
                        bossBullets.push(new BossBullet(this.x, this.y + 30, vx - 1.5, vy, this.color));
                        bossBullets.push(new BossBullet(this.x, this.y + 30, vx + 1.5, vy, this.color));
                    }
                } else if (this.phase === 2) {
                    if (Math.random() > 0.5) {
                        this.laserCharging = true;
                        this.laserTimer = 90;
                        this.laserType = 'sweep';
                    } else {
                        // Curtain of 7 bullets dropping down
                        for (let i = -3; i <= 3; i++) {
                            bossBullets.push(new BossBullet(this.x + i * 20 * this.scale, this.y + 30, i * 0.5, 6.5, this.color));
                        }
                    }
                } else if (this.phase === 3) {
                    if (Math.random() > 0.4) {
                        this.laserCharging = true;
                        this.laserTimer = 90;
                        this.laserType = Math.random() > 0.5 ? 'sweep' : 'hyper';
                    } else {
                        // Circle of 12 bullets
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                            bossBullets.push(new BossBullet(this.x, this.y + 30, Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, this.color));
                        }
                        this.fireAtPlayer(8);
                    }
                }
            }
        }
    }

    fireAtPlayer(speed) {
        const dx = player.x + 20 - this.x;
        const dy = player.y + 20 - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 10) {
            bossBullets.push(new BossBullet(this.x, this.y + 40, (dx/dist) * speed, (dy/dist) * speed, this.color));
        }
    }

    spawnMinions(deltaTime) {
        const now = Date.now();
        let spawnCooldown = 4000;
        if (this.attackType === 'crimson') spawnCooldown = 3500;
        else if (this.attackType === 'void') spawnCooldown = 3000;
        else if (this.attackType === 'omega') spawnCooldown = 2000;

        if (now - this.lastSpawn > spawnCooldown) {
            this.lastSpawn = now;
            
            let type = 'basic';
            if (this.attackType === 'crimson') {
                type = Math.random() > 0.4 ? 'zigzag' : 'basic';
            } else if (this.attackType === 'void') {
                const r = Math.random();
                type = r > 0.6 ? 'tank' : (r > 0.3 ? 'zigzag' : 'basic');
            } else if (this.attackType === 'omega') {
                const r = Math.random();
                type = r > 0.5 ? 'tank' : (r > 0.25 ? 'zigzag' : 'basic');
            }
            
            enemies.push(new Enemy(type));
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
        
        // Visual impact juice: time dilation, flash and screenshake
        timeDilation = 0.15;
        slowMoTimer = 90;
        flashActive = true;
        flashAlpha = 1.0;
        flashColor = '#ffffff';
        screenShake = 30;
        
        createExplosion(this.x, this.y, this.color);
        addGridRipple(this.x, this.y, 25, 200, 3.8);
        playExplosionSound('heavy');

        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 10;
            particles.push(new Particle(
                this.x + (Math.random() - 0.5) * 80 * this.scale, 
                this.y + (Math.random() - 0.5) * 80 * this.scale, 
                this.color,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                Math.random() * 4 + 2,
                0.015 + Math.random() * 0.015
            ));
        }
        bossSpawnScore += 3000;
        if(window.achievements) window.achievements.unlock('space', 'boss_slayer', 'Dragon Slayer');
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Draw 3D gyroscopic segment body cages (gyro-orbs)
        for (let i = this.segments.length - 1; i > 0; i--) {
            const seg = this.segments[i];
            ctx.save();
            ctx.globalAlpha = 1 - (i * 0.15);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            
            const rotAngle = (frameCount * 0.04) + i * 0.5;
            
            // Horizontal ring projected in 3D
            ctx.beginPath();
            for (let phi = 0; phi <= Math.PI * 2 + 0.1; phi += Math.PI / 6) {
                const pt = { x: Math.cos(phi) * seg.size, y: 0, z: Math.sin(phi) * seg.size };
                const p = project3D(pt, 0.4, rotAngle, 0.2, 1.0, seg.x, seg.y);
                if (phi === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();

            // Vertical ring projected in 3D
            ctx.beginPath();
            for (let phi = 0; phi <= Math.PI * 2 + 0.1; phi += Math.PI / 6) {
                const pt = { x: 0, y: Math.cos(phi) * seg.size, z: Math.sin(phi) * seg.size };
                const p = project3D(pt, rotAngle, 0.3, 0.1, 1.0, seg.x, seg.y);
                if (phi === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            
            ctx.restore();
        }

        // Draw 3D Dragon Skull Head
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color + '40'; // 25% opacity solid fill
        ctx.lineWidth = 2.5;

        // Nodding pitch + steering roll/yaw
        const headRotY = (this.targetX - this.x) * 0.0015;
        const headRotX = 0.3 + Math.sin(this.floatOffset * 1.5) * 0.1;

        // Project head vertices
        const projectedHead = this.vertices.map(v => 
            project3D(v, headRotX, headRotY, 0, 1.1, this.x, this.y)
        );

        // Sort faces
        const sortedHeadFaces = this.faces.map(face => {
            const zAvg = getFaceAverageZ(face, this.vertices, headRotX, headRotY, 0);
            return { face, zAvg };
        }).sort((a, b) => b.zAvg - a.zAvg);

        // Draw head
        sortedHeadFaces.forEach(fd => {
            ctx.beginPath();
            fd.face.forEach((idx, i) => {
                const p = projectedHead[idx];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw glowing laser charge nodes (eyes)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        
        // Find screen coordinates of the eyes (vertices 4 & 5)
        const eyeLeft = projectedHead[4];
        const eyeRight = projectedHead[5];
        
        ctx.beginPath();
        ctx.arc(eyeLeft.x, eyeLeft.y, 6 * this.scale, 0, Math.PI * 2);
        ctx.arc(eyeRight.x, eyeRight.y, 6 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Laser Beam
        if (this.laserCharging) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 5]);
            
            if (this.laserType === 'double') {
                const lx1 = this.x - 35 * this.scale;
                const lx2 = this.x + 35 * this.scale;
                ctx.beginPath();
                ctx.moveTo(lx1, this.y + 30);
                ctx.lineTo(lx1, canvas.height);
                ctx.moveTo(lx2, this.y + 30);
                ctx.lineTo(lx2, canvas.height);
                ctx.stroke();
            } else if (this.laserType === 'sweep') {
                const laserEndX = this.x + Math.sin(this.laserTimer * 0.06) * 350;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 30);
                ctx.lineTo(laserEndX, canvas.height);
                ctx.stroke();
            } else if (this.laserType === 'hyper') {
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 30);
                ctx.lineTo(this.x, canvas.height);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 30);
                ctx.lineTo(this.x, canvas.height);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.laserActive) {
            ctx.save();
            if (this.laserType === 'double') {
                const lx1 = this.x - 35 * this.scale;
                const lx2 = this.x + 35 * this.scale;
                [lx1, lx2].forEach(lx => {
                    const grad = ctx.createLinearGradient(lx - 20, 0, lx + 20, 0);
                    grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
                    grad.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
                    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = '#00ffff';
                    ctx.fillStyle = grad;
                    ctx.fillRect(lx - 20, this.y + 30, 40, canvas.height - this.y);
                    
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(lx - 4, this.y + 30, 8, canvas.height - this.y);
                });
            } else if (this.laserType === 'sweep') {
                const laserEndX = this.x + Math.sin(this.laserTimer * 0.06) * 350;
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#00ffff';
                
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                ctx.lineWidth = 50;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 30);
                ctx.lineTo(laserEndX, canvas.height);
                ctx.stroke();
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 30);
                ctx.lineTo(laserEndX, canvas.height);
                ctx.stroke();
            } else if (this.laserType === 'hyper') {
                const w = 120 * this.scale;
                const grad = ctx.createLinearGradient(this.x - w/2, 0, this.x + w/2, 0);
                grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
                grad.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
                grad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.7, 'rgba(0, 255, 255, 0.8)');
                grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                ctx.shadowBlur = 40;
                ctx.shadowColor = '#00ffff';
                ctx.fillStyle = grad;
                ctx.fillRect(this.x - w/2, this.y + 30, w, canvas.height - this.y);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x - 12, this.y + 30, 24, canvas.height - this.y);
            } else {
                const grad = ctx.createLinearGradient(this.x - 30, 0, this.x + 30, 0);
                grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
                grad.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
                grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#00ffff';
                ctx.fillStyle = grad;
                ctx.fillRect(this.x - 30, this.y + 30, 60, canvas.height - this.y);
                
                ctx.fillStyle = '#fff';
                ctx.fillRect(this.x - 5, this.y + 30, 10, canvas.height - this.y);
            }
            ctx.restore();
        }

        ctx.restore();
        this.drawHealthBar();
    }

    drawHealthBar() {
        const h = 10;
        const isMobile = canvas.width < 800;
        const y = isMobile ? canvas.height - 40 : 30;
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
        ctx.fillText(this.name, canvas.width / 2, y - 10);
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
        
        // 3D rotations & speeds
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        this.rotSpeedX = 0;
        this.rotSpeedY = 0;
        this.rotSpeedZ = 0;

        if (type === 'basic') {
            this.width = 30;
            this.height = 30;
            this.color = '#ff00ff';
            this.speed = 3 * currentSpeedMultiplier;
            
            // Sleek delta wing structure
            this.vertices = [
                { x: 0, y: 0, z: -15 },    // 0: Nose tip (front)
                { x: -15, y: -4, z: 12 },  // 1: Left wing back
                { x: 15, y: -4, z: 12 },   // 2: Right wing back
                { x: 0, y: 8, z: 8 },      // 3: Cockpit/fin top
                { x: 0, y: -6, z: 5 }      // 4: Bottom hull
            ];
            this.faces = [
                [0, 3, 1], // Top left
                [0, 2, 3], // Top right
                [0, 1, 4], // Bottom left
                [0, 4, 2], // Bottom right
                [1, 3, 2], // Back top
                [1, 2, 4]  // Back bottom
            ];
            this.rotSpeedY = 0.025; // Hovering rotation
        } else if (type === 'zigzag') {
            this.width = 35;
            this.height = 35;
            this.color = '#ff8c00';
            this.speed = 2.5 * currentSpeedMultiplier;
            this.isZigzag = true;
            this.startX = this.x;
            
            // Rapidly spinning octahedron (stealth diamond fighter)
            this.vertices = [
                { x: 0, y: 0, z: -18 },   // 0: Nose tip
                { x: 0, y: 0, z: 18 },    // 1: Rear tail
                { x: -15, y: 0, z: 0 },   // 2: Left wingtip
                { x: 15, y: 0, z: 0 },    // 3: Right wingtip
                { x: 0, y: 15, z: 0 },    // 4: Top fin peak
                { x: 0, y: -15, z: 0 }    // 5: Keel bottom
            ];
            this.faces = [
                [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
                [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
            ];
            this.rotSpeedZ = 0.06;
            this.rotSpeedY = 0.03;
        } else if (type === 'tank') {
            this.width = 60;
            this.height = 50;
            this.color = '#ff4444';
            this.speed = 1.5 * currentSpeedMultiplier;
            this.health = 3;
            
            // Heavy Battle Cruiser destroyer wedge
            this.vertices = [
                { x: 0, y: 0, z: -25 },    // 0: Wedge front nose
                { x: -22, y: 0, z: -5 },   // 1: Left mid wing
                { x: 22, y: 0, z: -5 },    // 2: Right mid wing
                { x: -18, y: 0, z: 20 },   // 3: Back left hull plate
                { x: 18, y: 0, z: 20 },    // 4: Back right hull plate
                { x: 0, y: 12, z: 10 },    // 5: Bridge top deck
                { x: 0, y: -10, z: 5 },    // 6: Underbelly thruster shield
                { x: 0, y: 6, z: 22 },     // 7: Exhaust nozzle top
                { x: 0, y: -6, z: 22 }     // 8: Exhaust nozzle bottom
            ];
            this.faces = [
                [0, 5, 1], [0, 2, 5], // Nose deck
                [0, 1, 6], [0, 6, 2], // Nose keel
                [1, 5, 3], [2, 4, 5], // Mid decks upper
                [1, 3, 6], [2, 6, 4], // Mid decks lower
                [5, 7, 3], [5, 4, 7], // Bridge to rear
                [6, 3, 8], [6, 8, 4], // Keel to rear
                [3, 7, 8], [3, 8, 4]  // Back nozzle plate
            ];
            this.rotSpeedX = 0.015; // Slow battleship drift
            this.rotSpeedZ = 0.005;
        }
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        if (this.isZigzag) {
            this.zigzagPhase += 0.05 * deltaTime;
            this.x = this.startX + Math.sin(this.zigzagPhase) * 100;
        }
        this.rotX += this.rotSpeedX * deltaTime;
        this.rotY += this.rotSpeedY * deltaTime;
        this.rotZ += this.rotSpeedZ * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color + '26'; // 15% opacity fill
        ctx.lineWidth = 2;

        const offsetX = this.x + this.width / 2;
        const offsetY = this.y + this.height / 2;

        // Project vertices
        const projected = this.vertices.map(v => 
            project3D(v, this.rotX, this.rotY, this.rotZ, 1.0, offsetX, offsetY)
        );

        // Sort faces by depth
        const sortedFaces = this.faces.map(face => {
            const zAvg = getFaceAverageZ(face, this.vertices, this.rotX, this.rotY, this.rotZ);
            return { face, zAvg };
        }).sort((a, b) => b.zAvg - a.zAvg);

        // Draw sorted faces
        sortedFaces.forEach(fd => {
            ctx.beginPath();
            fd.face.forEach((idx, i) => {
                const p = projected[idx];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

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
        
        // 3D rotation parameters
        this.rotX = Math.random() * Math.PI;
        this.rotY = Math.random() * Math.PI;
        this.rotZ = Math.random() * Math.PI;
        this.rotSpeedX = (Math.random() - 0.5) * 0.08;
        this.rotSpeedY = (Math.random() - 0.5) * 0.08;
        this.rotSpeedZ = (Math.random() - 0.5) * 0.08;
        
        // Generate irregular 3D polyhedron vertices
        this.vertices = [];
        this.faces = [];
        
        const latDivs = 4;
        const lonDivs = 5;
        for (let lat = 0; lat <= latDivs; lat++) {
            const theta = (lat / latDivs) * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon < lonDivs; lon++) {
                const phi = (lon / lonDivs) * Math.PI * 2;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                // Add noise to radius to make it look bumpy
                const rOffset = this.radius * (0.8 + Math.random() * 0.4);
                
                const vx = rOffset * sinTheta * cosPhi;
                const vy = rOffset * sinTheta * sinPhi;
                const vz = rOffset * cosTheta;
                this.vertices.push({ x: vx, y: vy, z: vz });
            }
        }
        
        // Connect vertices to create triangular faces
        for (let lat = 0; lat < latDivs; lat++) {
            for (let lon = 0; lon < lonDivs; lon++) {
                const nextLon = (lon + 1) % lonDivs;
                const i00 = lat * lonDivs + lon;
                const i10 = (lat + 1) * lonDivs + lon;
                const i01 = lat * lonDivs + nextLon;
                const i11 = (lat + 1) * lonDivs + nextLon;
                
                this.faces.push([i00, i01, i11]);
                this.faces.push([i00, i11, i10]);
            }
        }
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.rotX += this.rotSpeedX * deltaTime;
        this.rotY += this.rotSpeedY * deltaTime;
        this.rotZ += this.rotSpeedZ * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.strokeStyle = '#6a6a6a';
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(100, 100, 100, 0.3)';

        // Project vertices
        const projected = this.vertices.map(v => 
            project3D(v, this.rotX, this.rotY, this.rotZ, 1.0, this.x, this.y)
        );

        // Sort faces by depth
        const sortedFaces = this.faces.map(face => {
            const zAvg = getFaceAverageZ(face, this.vertices, this.rotX, this.rotY, this.rotZ);
            return { face, zAvg };
        }).sort((a, b) => b.zAvg - a.zAvg);

        // Draw sorted faces
        sortedFaces.forEach(fd => {
            ctx.beginPath();
            fd.face.forEach((idx, i) => {
                const p = projected[idx];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

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
        
        // 3D rotation parameters
        this.rotX = Math.random() * Math.PI;
        this.rotY = Math.random() * Math.PI;
        this.rotZ = Math.random() * Math.PI;
        this.rotSpeedX = 0.03;
        this.rotSpeedY = 0.04;
        this.rotSpeedZ = 0.02;

        this.vertices = [
            { x: -10, y: -10, z: -10 },
            { x: 10, y: -10, z: -10 },
            { x: 10, y: 10, z: -10 },
            { x: -10, y: 10, z: -10 },
            { x: -10, y: -10, z: 10 },
            { x: 10, y: -10, z: 10 },
            { x: 10, y: 10, z: 10 },
            { x: -10, y: 10, z: 10 }
        ];

        this.faces = [
            [0, 1, 2, 3], // Front
            [5, 4, 7, 6], // Back
            [3, 2, 6, 7], // Top
            [4, 5, 1, 0], // Bottom
            [4, 0, 3, 7], // Left
            [1, 5, 6, 2]  // Right
        ];
    }

    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.rotX += this.rotSpeedX * deltaTime;
        this.rotY += this.rotSpeedY * deltaTime;
        this.rotZ += this.rotSpeedZ * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color + '26'; // 15% opacity fill
        ctx.lineWidth = 1.5;

        const offsetX = this.x + this.width / 2;
        const offsetY = this.y + this.height / 2;

        // Project vertices
        const projected = this.vertices.map(v => 
            project3D(v, this.rotX, this.rotY, this.rotZ, 1.0, offsetX, offsetY)
        );

        // Sort faces by depth
        const sortedFaces = this.faces.map(face => {
            const zAvg = getFaceAverageZ(face, this.vertices, this.rotX, this.rotY, this.rotZ);
            return { face, zAvg };
        }).sort((a, b) => b.zAvg - a.zAvg);

        // Draw sorted faces
        sortedFaces.forEach(fd => {
            ctx.beginPath();
            fd.face.forEach((idx, i) => {
                const p = projected[idx];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw central floating abbreviation
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.fillText(this.type === 'speed' ? 'PWR' : 'SHD', offsetX, offsetY);

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, vx = null, vy = null, size = null, alphaDecay = 0.02) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size !== null ? size : (Math.random() * 4 + 2);
        this.vx = vx !== null ? vx : (Math.random() - 0.5) * 10;
        this.vy = vy !== null ? vy : (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.alphaDecay = alphaDecay;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.alpha -= this.alphaDecay * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
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

function updateStars(deltaTime) {
    stars.forEach(s => {
        s.y += s.speed * deltaTime;
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

function spawnEntity(deltaTime) {
    if (bossState !== 'none') return; // Pause normal stuff during boss flow

    if (score >= bossSpawnScore) {
        bossState = 'incoming';
        bossMessageTimer = 120; // 2 seconds
        // Upgrade weapon permanently to prepare for the boss fight!
        player.minWeaponTier = Math.min(6, player.minWeaponTier + 1);
        player.weaponTier = Math.max(player.weaponTier, player.minWeaponTier);
        return;
    }

    if (frameCount > 60) {
        frameCount = 0;
        const rand = Math.random();
        if (rand > 0.8) enemies.push(new Enemy('tank'));
        else if (rand > 0.5) enemies.push(new Enemy('zigzag'));
        else enemies.push(new Enemy('basic'));
    }
    
    // Check for asteroid spawn (using a separate timer or logic)
    if (Math.random() < 0.01 * deltaTime) {
        asteroids.push(new Asteroid());
    }
}

// Ripple class
class GridRipple {
    constructor(x, y, intensity = 15, maxRadius = 120, speed = 4) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.speed = speed;
        this.intensity = intensity;
    }
    update(deltaTime) {
        this.radius += this.speed * deltaTime;
    }
}

function addGridRipple(x, y, intensity = 15, maxRadius = 120, speed = 4) {
    gridRipples.push(new GridRipple(x, y, intensity, maxRadius, speed));
}

function drawBackgroundGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.09)';
    ctx.lineWidth = 1;

    const horizonY = -120;
    const vanishX = canvas.width / 2;
    const numDivisions = 20;

    // Perspective lines
    for (let i = 0; i <= numDivisions; i++) {
        const angle = -Math.PI / 3 + (i / numDivisions) * (Math.PI / 1.5);
        const startX = vanishX;
        const startY = horizonY;
        const endX = vanishX + Math.tan(angle) * (canvas.height - horizonY);
        const endY = canvas.height;

        ctx.beginPath();
        const steps = 10;
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            let px = startX + (endX - startX) * t;
            let py = startY + (endY - startY) * t;

            gridRipples.forEach(r => {
                const dx = px - r.x;
                const dy = py - r.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < r.radius && r.radius > 0) {
                    const factor = 1 - (dist / r.radius);
                    const force = Math.sin(r.radius * 0.1 - dist * 0.08) * r.intensity * factor;
                    px += (dx / (dist || 1)) * force;
                    py += (dy / (dist || 1)) * force;
                }
            });

            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    // Horizontal lines
    const baseGap = 20;
    const numHoriz = 16;
    for (let i = 0; i < numHoriz; i++) {
        const yOffset = ((i * baseGap + gridOffset) % (numHoriz * baseGap));
        const pyTrue = horizonY + Math.pow(yOffset / (numHoriz * baseGap), 1.6) * (canvas.height - horizonY);
        
        ctx.beginPath();
        const steps = 20;
        for (let j = 0; j <= steps; j++) {
            let px = (j / steps) * canvas.width;
            let py = pyTrue;

            gridRipples.forEach(r => {
                const dx = px - r.x;
                const dy = py - r.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < r.radius && r.radius > 0) {
                    const factor = 1 - (dist / r.radius);
                    const force = Math.sin(r.radius * 0.1 - dist * 0.08) * r.intensity * factor;
                    px += (dx / (dist || 1)) * force;
                    py += (dy / (dist || 1)) * force;
                }
            });

            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    ctx.restore();
}

// Procedural Music & Sound Synthesis Engine
const MusicSynth = {
    audioCtx: null,
    isPlaying: false,
    bpm: 115,
    step: 0,
    notes: [
        55, 55, 65.41, 65.41, 73.42, 73.42, 82.41, 82.41
    ],
    init() {
        if (this.audioCtx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
    },
    start() {
        this.init();
        if (!this.audioCtx || this.isPlaying) return;
        this.isPlaying = true;
        this.step = 0;
        
        const scheduleNextStep = () => {
            if (!this.isPlaying) return;
            const stepTime = 60 / this.bpm / 2;
            
            this.playBassNote(this.notes[this.step % this.notes.length], stepTime * 0.85);
            
            if (this.step % 2 === 1) {
                this.playHiHat(stepTime * 0.25);
            }
            
            this.step++;
            setTimeout(scheduleNextStep, stepTime * 1000);
        };
        
        scheduleNextStep();
    },
    stop() {
        this.isPlaying = false;
    },
    playBassNote(freq, duration) {
        if (window.audioFX && window.audioFX.isMuted) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(160, this.audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.audioCtx.currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    },
    playHiHat(duration) {
        if (window.audioFX && window.audioFX.isMuted) return;
        
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, this.audioCtx.currentTime);
        
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        source.start();
        source.stop(this.audioCtx.currentTime + duration);
    }
};

function playLaserSound(tier = 1) {
    if (window.audioFX && window.audioFX.isMuted) return;
    MusicSynth.init();
    const ctx = MusicSynth.audioCtx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (tier === 1) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.15);
    } else if (tier === 2) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.15);
    } else if (tier === 3) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.25);
    }
}

function playExplosionSound(intensity = 'medium') {
    if (window.audioFX && window.audioFX.isMuted) return;
    MusicSynth.init();
    const ctx = MusicSynth.audioCtx;
    if (!ctx) return;
    
    const duration = intensity === 'heavy' ? 0.75 : (intensity === 'medium' ? 0.35 : 0.18);
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(intensity === 'heavy' ? 350 : (intensity === 'medium' ? 550 : 750), ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(intensity === 'heavy' ? 0.45 : (intensity === 'medium' ? 0.3 : 0.15), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    source.start();
    source.stop(ctx.currentTime + duration);
}

function playPickupSound() {
    if (window.audioFX && window.audioFX.isMuted) return;
    MusicSynth.init();
    const ctx = MusicSynth.audioCtx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
    });
}

// --- Core Loops ---

function update(deltaTime) {
    frameCount += deltaTime;
    currentSpeedMultiplier += SPEED_INC * deltaTime;

    // Update perspective grid offset & ripples
    gridOffset = (gridOffset + 1.8 * deltaTime) % 360;
    for (let i = gridRipples.length - 1; i >= 0; i--) {
        const r = gridRipples[i];
        r.update(deltaTime);
        if (r.radius > r.maxRadius) {
            gridRipples.splice(i, 1);
        }
    }

    // Update visual camera full-screen flashes
    if (flashActive) {
        flashAlpha -= 0.03 * deltaTime;
        if (flashAlpha <= 0) {
            flashAlpha = 0;
            flashActive = false;
        }
    }

    // Accelerate MusicSynth BPM relative to wave progression/boss spawning
    if (MusicSynth.isPlaying) {
        MusicSynth.bpm = 115 + Math.min(45, (score / bossSpawnScore) * 35);
    }

    updateStars(deltaTime);
    player.update(deltaTime);

    if (screenShake > 0) screenShake *= Math.pow(0.88, deltaTime);

    bullets.forEach((b, i) => {
        b.update(deltaTime);
        if (b.y < -20 || b.x < -20 || b.x > canvas.width + 20) {
            bullets.splice(i, 1);
            return;
        }

        // Bullet hit boss
        if (bossState === 'active' && boss && boss.entryFinished) {
            const dx = b.x - boss.x;
            const dy = b.y - boss.y;
            const limitX = 60 * boss.scale;
            const limitY = 40 * boss.scale;
            if (Math.abs(dx) < limitX && Math.abs(dy) < limitY) {
                boss.takeDamage(b.isHoming ? 2 : 1);
                addGridRipple(b.x, b.y, 6, 80, 3);
                playExplosionSound('light');
                bullets.splice(i, 1);
                return;
            }
        }
    });

    bossBullets.forEach((b, i) => {
        b.update(deltaTime);
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

    if (bossMessageTimer > 0) bossMessageTimer -= deltaTime;

    if (bossState === 'incoming' && bossMessageTimer <= 0) {
        bossState = 'active';
        boss = new Boss();
    }
    
    if (bossState === 'defeated' && bossMessageTimer <= 0) {
        bossState = 'none';
        boss = null;
    }

    if (bossState === 'active' && boss) {
        boss.update(deltaTime);
        boss.segments.forEach(seg => {
            const dx = seg.x - (player.x + 20);
            const dy = seg.y - (player.y + 20);
            if (Math.sqrt(dx*dx + dy*dy) < 35 * boss.scale) {
                handleCollision(seg, 0, 'boss');
            }
        });
    }

    enemies.forEach((e, i) => {
        e.update(deltaTime);
        if (e.y > canvas.height + 50) enemies.splice(i, 1);

        // Bullet hit enemy
        bullets.forEach((b, bi) => {
            if (rectIntersect(b, e)) {
                bullets.splice(bi, 1);
                e.health--;
                if (e.health <= 0) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
                    addGridRipple(e.x + e.width / 2, e.y + e.height / 2, 10, 100, 3.5);
                    playExplosionSound(e.type === 'tank' ? 'heavy' : 'medium');
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
        a.update(deltaTime);
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
                addGridRipple(a.x, a.y, 8, 90, 3);
                playExplosionSound('medium');
                asteroids.splice(i, 1);
                score += 5;
                checkAchievements();
            }
        });
    });

    powerups.forEach((p, i) => {
        p.update(deltaTime);
        if (rectIntersect(player, p)) {
            if (p.type === 'speed') {
                player.speedBoost = true;
                player.speedBoostTimer = 300;
                player.weaponTier = Math.min(4, player.weaponTier + 1); // Upgrade gun tier!
            } else {
                player.shield = true;
            }
            playPickupSound();
            addGridRipple(p.x, p.y, 14, 110, 2.5);
            powerups.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.update(deltaTime);
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    spawnEntity(deltaTime);
    scoreElement.textContent = score;
}

function handleCollision(entity, index, type) {
    if (player.invulnerable) return; // Ignore collisions if invulnerable

    if (player.shield) {
        player.shield = false;
        player.invulnerable = true;
        player.invulnTimer = 60;
        createExplosion(player.x + 20, player.y + 20, '#00ffff');
        addGridRipple(player.x + 20, player.y + 20, 16, 120, 4);
        playExplosionSound('heavy');
        if (type === 'enemy') enemies.splice(index, 1);
        else if (type === 'asteroid') asteroids.splice(index, 1);
        return;
    }

    player.lives--;
    player.weaponTier = Math.max(player.minWeaponTier, player.weaponTier - 1); // Degrade firepower by 1 tier on hit!
    player.invulnerable = true;
    player.invulnTimer = 90; // 1.5s safety window
    createExplosion(player.x + 20, player.y + 20, '#ff0000');
    addGridRipple(player.x + 20, player.y + 20, 22, 160, 4.5);
    playExplosionSound('heavy');
    
    // Trigger impact red flash overlay
    flashActive = true;
    flashAlpha = 0.55;
    flashColor = 'rgba(255, 0, 0, 0.4)';
    screenShake = 18;

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
    drawBackgroundGrid();
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

    // Draw full-screen camera flash overlays
    if (flashActive) {
        ctx.save();
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

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
    
    if (!lastTime) lastTime = timestamp;
    const deltaTime = Math.min((timestamp - lastTime) / 16.67, 3); // Cap at 3x to avoid huge jumps
    lastTime = timestamp;

    // Decaying slow-motion timer
    if (slowMoTimer > 0) {
        slowMoTimer -= deltaTime;
        if (slowMoTimer <= 0) {
            timeDilation = 1.0;
        }
    }

    update(deltaTime * timeDilation);
    draw();
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
    gridRipples = [];
    gridOffset = 0;
    flashAlpha = 0;
    flashActive = false;
    timeDilation = 1.0;
    slowMoTimer = 0;

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
    
    // Start procedural synth soundtrack loop
    MusicSynth.start();
    
    animate(performance.now());
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
    cancelAnimationFrame(animationFrameId);
    
    // Stop soundtrack loop
    MusicSynth.stop();
    
    if (window.audioFX) window.audioFX.playGameOver();

    // Trigger full red crash flash
    flashActive = true;
    flashAlpha = 1.0;
    flashColor = '#ff0000';
    screenShake = 25;

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
    
    // Stop procedural synth soundtrack loop
    MusicSynth.stop();

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
        
        // Stop music loop when paused
        MusicSynth.stop();
    } else {
        pauseMenu.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now();
        
        // Resume music loop when resumed
        MusicSynth.start();
        
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
