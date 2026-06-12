const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiScore = document.getElementById('ui-score');
const uiKills = document.getElementById('ui-kills');
const uiCombo = document.getElementById('ui-combo');
const comboSpan = uiCombo?.querySelector('span');

// HP Elements
const playerHealthBar = document.getElementById('player-health-bar');
const playerHpVal = document.getElementById('player-hp-val');
const bossHealthStrip = document.getElementById('boss-health-strip');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossHpVal = document.getElementById('boss-hp-val');

const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');
const btnMute = document.getElementById('btn-mute');
const btnPauseHUD = document.getElementById('btn-pause-hud');

// Navigation
document.querySelectorAll('.btn-hub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('arcade hub clicked');
    });
});

// Game State
let gameState = 'menu'; // menu, playing, paused, gameover
let lastTime = 0;
let score = 0;
let stageStartScore = 0;
let kills = 0;
let timeSinceLastInput = 0;

// Stage System
let currentStage = 1;
const TOTAL_STAGES = 15;
let stageTargetKills = 5;
let stageKills = 0;

const stageMenuElement = document.getElementById('stageMenu');
const stageGridElement = document.getElementById('stage-grid');
const btnBackStages = document.getElementById('btn-back-stages');
const stageClearOverlayElement = document.getElementById('stageClearOverlay');

// Camera / World / FX
const groundY = 450;
let shakeTime = 0;
let screenShake = 0;
let flashAlpha = 0;
let flashColor = '#ffffff';

// Environment
let stars = [];
let clouds = [];
let groundScroll = 0;
let gridYOffset = 0;
const STAR_COUNT = 60;
const CLOUD_COUNT = 4;

// Custom Visual FX
let slashArcs = [];
let impactRings = [];
let playerGhosts = [];
let ghostSpawnTimer = 0;

// Weapon Drops
let weaponDrop = null;
let playerWeapon = null; // 'sword' or null
let weaponCharges = 0;
let lastWeaponSpawnKills = -1;
let bossLowHPSwordTriggered = false;
let playerLowHPSwordTriggered = false;

// Combo System
let comboCount = 0;
let comboTimer = 0;
const COMBO_WINDOW = 600; // ms

// Audio Helper
function playSound(type) {
    if (!window.audioFX) return;
    try {
        if (type === 'hit' && window.audioFX.playEat) window.audioFX.playEat();
        if (type === 'heavy' && window.audioFX.playExplosion) window.audioFX.playExplosion();
        if (type === 'swing' && window.audioFX.playJump) window.audioFX.playJump();
        if (type === 'gameover' && window.audioFX.playGameOver) window.audioFX.playGameOver();
    } catch(e) {}
}

// Landscape Orientation Prompt Handler
const dismissBtn = document.getElementById('dismissLandscapeBtn');
const landscapePrompt = document.getElementById('landscapePrompt');
let sessionInitiated = false;

function beginGameSession() {
    sessionInitiated = true;
    const isPortraitActive = (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) &&
                             (landscapePrompt && !landscapePrompt.classList.contains('dismissed'));
                             
    if (!isPortraitActive) {
        showStageMenu();
    }
}

dismissBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    landscapePrompt?.classList.add('dismissed');
    window.dispatchEvent(new Event('resize'));
    if (sessionInitiated) {
        showStageMenu();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > window.innerHeight) {
        if (landscapePrompt && !landscapePrompt.classList.contains('dismissed')) {
            landscapePrompt.classList.add('dismissed');
            if (sessionInitiated) {
                showStageMenu();
            }
        }
    }
});

// Environment Helpers
function generateEnvironment() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (groundY - 120),
            size: Math.random() * 2 + 0.5,
            alpha: Math.random(),
            speed: 0.01 + Math.random() * 0.02
        });
    }
    clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 40 + Math.random() * 120,
            width: 80 + Math.random() * 100,
            height: 30 + Math.random() * 15,
            speed: 0.05 + Math.random() * 0.1
        });
    }
}

function updateEnvironment(deltaTime) {
    const theme = getStageTheme(currentStage);
    if (theme.bgStyle === 'stars') {
        // Twinkle stars
        stars.forEach(s => {
            s.alpha += s.speed * deltaTime;
            if (s.alpha > 1 || s.alpha < 0) {
                s.speed = -s.speed;
            }
        });
    } else if (theme.bgStyle === 'matrix') {
        // Fall down like code rain
        stars.forEach(s => {
            s.y += (1.5 + s.size * 2) * deltaTime;
            if (s.y > groundY - 20) {
                s.y = Math.random() * -100;
                s.x = Math.random() * canvas.width;
            }
        });
    } else if (theme.bgStyle === 'meteor') {
        // Move diagonally down-left
        stars.forEach(s => {
            s.x -= (2 + s.size * 3) * deltaTime;
            s.y += (1 + s.size * 1.5) * deltaTime;
            if (s.y > groundY - 20 || s.x < 0) {
                s.y = Math.random() * -100;
                s.x = Math.random() * canvas.width + 100;
            }
        });
    }
    // Move clouds
    clouds.forEach(c => {
        c.x -= c.speed * deltaTime;
        if (c.x + c.width < 0) {
            c.x = canvas.width;
            c.y = 40 + Math.random() * 120;
        }
    });
}

function drawRealCloud(x, y, width, height) {
    ctx.beginPath();
    let r = height / 2;
    // Left cap
    ctx.arc(x + r, y + height - r, r, Math.PI * 0.5, Math.PI * 1.5);
    // Top-left puff
    ctx.arc(x + width * 0.35, y + height - r * 1.4, r * 1.2, Math.PI, Math.PI * 1.85);
    // Top-right puff
    ctx.arc(x + width * 0.65, y + height - r * 1.5, r * 1.4, Math.PI * 1.3, Math.PI * 2);
    // Right cap
    ctx.arc(x + width - r, y + height - r, r, Math.PI * 1.5, Math.PI * 0.5);
    // Flat bottom line
    ctx.lineTo(x + r, y + height);
    ctx.closePath();
    ctx.fill();
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Visual FX Classes
class SlashArc {
    constructor(x, y, dir, type, color) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.type = type;
        this.color = color;
        this.maxLife = type === 'attack4' ? 250 : 150; // ms
        this.life = this.maxLife;
    }
    
    update(deltaTime) {
        this.life -= deltaTime * 16.67;
    }
    
    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.dir, 1);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        
        ctx.globalAlpha = Math.max(0, 1 - progress);
        
        if (this.type === 'attack1') {
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(40 * progress, 0);
            ctx.stroke();
            
            // Inner white core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(40 * progress, 0);
            ctx.stroke();
        } else if (this.type === 'attack2') {
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(10, 0, 35, -Math.PI / 3, Math.PI / 3, false);
            ctx.stroke();
            
            // Inner white core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(10, 0, 35, -Math.PI / 3, Math.PI / 3, false);
            ctx.stroke();
        } else if (this.type === 'attack3') {
            // Uppercut slash: upward vertical-curved arc
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(15, -15, 40, -Math.PI / 2, 0, false);
            ctx.stroke();
            
            // Inner white core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(15, -15, 40, -Math.PI / 2, 0, false);
            ctx.stroke();
        } else if (this.type === 'attack4') {
            ctx.lineWidth = 10;
            const radius = 20 + progress * 50;
            ctx.beginPath();
            ctx.arc(0, 0, radius, -Math.PI * 0.8, Math.PI * 0.8, false);
            ctx.stroke();
            
            // Inner white core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, radius, -Math.PI * 0.8, Math.PI * 0.8, false);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class ImpactRing {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 5;
        this.maxRadius = 40 + Math.random() * 20;
        this.life = 200; // ms
        this.maxLife = 200;
    }
    
    update(deltaTime) {
        this.life -= deltaTime * 16.67;
        const progress = 1 - (this.life / this.maxLife);
        this.radius = progress * this.maxRadius;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * (this.life / this.maxLife);
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner white core
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1 * (this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Entities
class Entity {
    constructor(x, color, isBoss = false) {
        this.x = x;
        this.y = groundY;
        this.vx = 0;
        this.vy = 0;
        this.dir = 1; // 1 = right, -1 = left
        this.color = color;
        this.state = 'idle'; // idle, run, attack1, attack2, attack3, hit, dead
        this.stateFrame = 0;
        
        if (color === '#0ff') {
            this.maxHp = 100;
        } else if (isBoss) {
            this.maxHp = 150 + (currentStage - 1) * 50;
        } else {
            this.maxHp = 30 + (currentStage - 1) * 5;
        }
        this.hp = this.maxHp;
        this.isBoss = isBoss;
        
        this.hitStun = 0;
        this.attackHitbox = null; 
        this.laserTimer = 0;
        this.bossStage = isBoss ? currentStage : 0;
    }
}

class LaserBall {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.vx = dir * 6;
        this.radius = 15;
        this.damage = 20;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        if (this.x < -50 || this.x > canvas.width + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let player;
let enemies = [];
let particles = [];
let floatingTexts = [];
let laserBalls = [];

// Input
const keys = { right: false, left: false, down: false, up: false };
let attackQueued = false;

window.addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (!keys.down) attackQueued = true;
        keys.down = true;
    }
    if (e.code === 'Escape' && gameState === 'playing') togglePause();
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
});

// Mobile Controls
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; }, {passive:false});
document.getElementById('btn-left').addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; }, {passive:false});
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; }, {passive:false});
document.getElementById('btn-right').addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; }, {passive:false});
document.getElementById('btn-attack').addEventListener('touchstart', (e) => { e.preventDefault(); attackQueued = true; keys.down = true; }, {passive:false});
document.getElementById('btn-attack').addEventListener('touchend', (e) => { e.preventDefault(); keys.down = false; }, {passive:false});
const btnJump = document.getElementById('btn-jump');
if (btnJump) {
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.up = true; }, {passive:false});
    btnJump.addEventListener('touchend', (e) => { e.preventDefault(); keys.up = false; }, {passive:false});
}

function resize() {
    const root = document.querySelector('.game-root');
    const header = document.querySelector('.header');
    const pStrip = document.getElementById('player-health-strip');
    const bStrip = document.getElementById('boss-health-strip');
    
    // Total available height is root clientHeight
    const totalH = root.clientHeight;
    const headerH = header?.offsetHeight || 0;
    const pStripH = pStrip?.offsetHeight || 0;
    const bStripH = (bStrip && !bStrip.classList.contains('hidden')) ? bStrip.offsetHeight : 0;
    
    const physicalWidth = root.clientWidth;
    const physicalHeight = totalH - headerH - pStripH - bStripH;
    
    // Enforce a minimum logical coordinate space for brawling:
    // Minimum logical width = 800px (to prevent enemies spawning too close and give dodge room)
    // Minimum logical height = 520px (to prevent the ground and player falling off the canvas in landscape)
    let scale = 1.0;
    
    if (physicalWidth < 800) {
        scale = physicalWidth / 800;
    }
    
    const minLogicalHeight = 520;
    if (physicalHeight / scale < minLogicalHeight) {
        scale = physicalHeight / minLogicalHeight;
    }
    
    canvas.width = physicalWidth / scale;
    canvas.height = physicalHeight / scale;
    
    generateEnvironment();
    
    if (window.innerWidth <= 800) {
        document.getElementById('mobile-controls').classList.remove('hidden');
    } else {
        document.getElementById('mobile-controls').classList.add('hidden');
    }
}
window.addEventListener('resize', resize);
// Initial call
setTimeout(resize, 100);

function getBossColor(stageNum) {
    const colors = [
        '#ff0055', // Stage 1: Crimson
        '#ffd700', // Stage 2: Gold
        '#00ff66', // Stage 3: Green
        '#00ffff', // Stage 4: Cyan
        '#cc00ff', // Stage 5: Purple
        '#ff6600', // Stage 6: Orange
        '#e2e8f0', // Stage 7: Silver Scarf
        '#ffff00', // Stage 8: Yellow
        '#ff3333', // Stage 9: Light Crimson
        '#00ff00', // Stage 10: Lime
        '#7c3aed', // Stage 11: Violet
        '#e11d48', // Stage 12: Rose Spikes
        '#f97316', // Stage 13: Solar Orange
        '#38bdf8', // Stage 14: Diamond Blue
        '#ff007f'  // Stage 15: Cyber Emperor
    ];
    return colors[(stageNum - 1) % colors.length];
}

// Stage Configuration
function getStageConfig(stageNum) {
    const targetKills = 5 + (stageNum - 1) * 3;
    const hasBoss = true;
    return { targetKills, hasBoss };
}

function getStageTheme(stageNum) {
    const themes = {
        1: {
            skyGradient: ['#0a0518', '#1b0e35', '#3d163d', '#65113d'],
            sunColor: ['#ffe600', '#ff5a00', '#ff0077'],
            sunGlow: '#ff0077',
            gridColor: 'rgba(255, 0, 255, 0.25)',
            gridHorizon: '#ff00ff',
            enemyColor: '#f0f',
            bgStyle: 'stars'
        },
        2: {
            skyGradient: ['#020b14', '#051b2d', '#08334e', '#0b4d6b'],
            sunColor: ['#00ffff', '#0ea5e9', '#0284c7'],
            sunGlow: '#00ffff',
            gridColor: 'rgba(0, 255, 255, 0.25)',
            gridHorizon: '#00ffff',
            enemyColor: '#0ea5e9',
            bgStyle: 'stars'
        },
        3: {
            skyGradient: ['#050c05', '#0e2411', '#183b1c', '#225527'],
            sunColor: ['#a3ff00', '#22c55e', '#15803d'],
            sunGlow: '#22c55e',
            gridColor: 'rgba(34, 197, 94, 0.25)',
            gridHorizon: '#22c55e',
            enemyColor: '#22c55e',
            bgStyle: 'stars'
        },
        4: {
            skyGradient: ['#0c0402', '#240d05', '#451a09', '#63250e'],
            sunColor: ['#f59e0b', '#ea580c', '#b91c1c'],
            sunGlow: '#ea580c',
            gridColor: 'rgba(234, 88, 12, 0.25)',
            gridHorizon: '#ea580c',
            enemyColor: '#f97316',
            bgStyle: 'stars'
        },
        5: {
            skyGradient: ['#02021e', '#080c38', '#121b5c', '#1e2b85'],
            sunColor: ['#38bdf8', '#3b82f6', '#1d4ed8'],
            sunGlow: '#3b82f6',
            gridColor: 'rgba(59, 130, 246, 0.25)',
            gridHorizon: '#3b82f6',
            enemyColor: '#60a5fa',
            bgStyle: 'stars'
        },
        6: {
            skyGradient: ['#020804', '#051c09', '#0d3814', '#155720'],
            sunColor: ['#86efac', '#22c55e', '#166534'],
            sunGlow: '#22c55e',
            gridColor: 'rgba(34, 197, 94, 0.25)',
            gridHorizon: '#22c55e',
            enemyColor: '#86efac',
            bgStyle: 'matrix'
        },
        7: {
            skyGradient: ['#0c0902', '#241a05', '#3d2b07', '#573d0a'],
            sunColor: ['#fef08a', '#eab308', '#a16207'],
            sunGlow: '#eab308',
            gridColor: 'rgba(234, 179, 8, 0.25)',
            gridHorizon: '#eab308',
            enemyColor: '#fef08a',
            bgStyle: 'matrix'
        },
        8: {
            skyGradient: ['#0c0204', '#24050c', '#3d0714', '#570a1d'],
            sunColor: ['#fecdd3', '#f43f5e', '#be123c'],
            sunGlow: '#f43f5e',
            gridColor: 'rgba(244, 63, 94, 0.25)',
            gridHorizon: '#f43f5e',
            enemyColor: '#fecdd3',
            bgStyle: 'matrix'
        },
        9: {
            skyGradient: ['#06020c', '#140524', '#24073d', '#350a57'],
            sunColor: ['#f5d0fe', '#d946ef', '#a21caf'],
            sunGlow: '#d946ef',
            gridColor: 'rgba(217, 70, 239, 0.25)',
            gridHorizon: '#d946ef',
            enemyColor: '#f5d0fe',
            bgStyle: 'matrix'
        },
        10: {
            skyGradient: ['#020617', '#0f172a', '#1e293b', '#334155'],
            sunColor: ['#e2e8f0', '#94a3b8', '#475569'],
            sunGlow: '#94a3b8',
            gridColor: 'rgba(148, 163, 184, 0.25)',
            gridHorizon: '#94a3b8',
            enemyColor: '#cbd5e1',
            bgStyle: 'matrix'
        },
        11: {
            skyGradient: ['#05051a', '#0d0c35', '#161355', '#241a7c'],
            sunColor: ['#c084fc', '#8b5cf6', '#6d28d9'],
            sunGlow: '#8b5cf6',
            gridColor: 'rgba(139, 92, 246, 0.25)',
            gridHorizon: '#8b5cf6',
            enemyColor: '#c084fc',
            bgStyle: 'meteor'
        },
        12: {
            skyGradient: ['#180202', '#380505', '#5a0707', '#7f0a0a'],
            sunColor: ['#f87171', '#ef4444', '#b91c1c'],
            sunGlow: '#ef4444',
            gridColor: 'rgba(239, 68, 68, 0.25)',
            gridHorizon: '#ef4444',
            enemyColor: '#f87171',
            bgStyle: 'meteor'
        },
        13: {
            skyGradient: ['#021212', '#052929', '#083f3f', '#0b5656'],
            sunColor: ['#2dd4bf', '#14b8a6', '#0f766e'],
            sunGlow: '#14b8a6',
            gridColor: 'rgba(20, 184, 166, 0.25)',
            gridHorizon: '#14b8a6',
            enemyColor: '#2dd4bf',
            bgStyle: 'meteor'
        },
        14: {
            skyGradient: ['#140702', '#2a0e05', '#441407', '#5f1a0a'],
            sunColor: ['#fdba74', '#f97316', '#c2410c'],
            sunGlow: '#f97316',
            gridColor: 'rgba(249, 115, 22, 0.25)',
            gridHorizon: '#f97316',
            enemyColor: '#fdba74',
            bgStyle: 'meteor'
        },
        15: {
            skyGradient: ['#000000', '#180018', '#300030', '#480048'],
            sunColor: ['#ec4899', '#db2777', '#be185d'],
            sunGlow: '#db2777',
            gridColor: 'rgba(219, 39, 119, 0.25)',
            gridHorizon: '#db2777',
            enemyColor: '#ec4899',
            bgStyle: 'meteor'
        }
    };
    return themes[stageNum] || themes[1];
}

// Stage Progress LocalStorage Helpers
function loadStageProgress() {
    const saved = localStorage.getItem('stickfighter_progress');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) {}
    }
    return { unlockedStage: 1, stars: {} };
}

function saveStageProgress(stage, earnedStars) {
    const progress = loadStageProgress();
    const currentStars = progress.stars[stage] || 0;
    if (earnedStars > currentStars) {
        progress.stars[stage] = earnedStars;
    }
    if (stage === progress.unlockedStage && stage < TOTAL_STAGES) {
        progress.unlockedStage = stage + 1;
    }
    localStorage.setItem('stickfighter_progress', JSON.stringify(progress));
}

// Show Stage Selection screen
function showStageMenu() {
    gameState = 'menu';
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    if (stageClearOverlayElement) stageClearOverlayElement.classList.add('hidden');
    if (stageMenuElement) stageMenuElement.classList.remove('hidden');
    
    const progress = loadStageProgress();
    if (stageGridElement) {
        stageGridElement.innerHTML = '';
        for (let s = 1; s <= TOTAL_STAGES; s++) {
            const isUnlocked = s <= progress.unlockedStage;
            const starsEarned = progress.stars[s] || 0;
            
            const card = document.createElement('button');
            card.className = `stage-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            if (!isUnlocked) card.disabled = true;
            
            let cardHTML = `<span class="stage-num">${s}</span>`;
            if (isUnlocked) {
                cardHTML += `<div class="stage-stars">`;
                for (let star = 1; star <= 3; star++) {
                    cardHTML += `<span class="star ${star <= starsEarned ? 'filled' : ''}">★</span>`;
                }
                cardHTML += `</div>`;
            } else {
                cardHTML += `<span class="lock-icon">🔒</span>`;
            }
            
            card.innerHTML = cardHTML;
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    if (stageMenuElement) stageMenuElement.classList.add('hidden');
                    startStage(s);
                });
            }
            stageGridElement.appendChild(card);
        }
    }
}

// Start specific stage
function startStage(stageNum) {
    currentStage = stageNum;
    const config = getStageConfig(stageNum);
    stageTargetKills = config.targetKills;
    stageKills = 0;
    
    if (stageNum === 1) {
        score = 0;
        stageStartScore = 0;
    } else {
        score = stageStartScore;
    }
    
    initGame();
    
    spawnFloatingText(canvas.width / 2, 200, `STAGE ${currentStage}`, "#00ffff");
    setTimeout(() => {
        spawnFloatingText(canvas.width / 2, 230, `TARGET: ${stageTargetKills} KILLS`, "#ffd700");
    }, 400);
}

function drawTinyStickman(ctx, color) {
    ctx.clearRect(0, 0, 24, 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    
    // Head
    ctx.beginPath();
    ctx.arc(12, 6, 3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Spine
    ctx.beginPath();
    ctx.moveTo(12, 9);
    ctx.lineTo(12, 16);
    ctx.stroke();
    
    // Arms
    ctx.beginPath();
    ctx.moveTo(7, 11);
    ctx.lineTo(17, 11);
    ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.moveTo(12, 16);
    ctx.lineTo(8, 22);
    ctx.moveTo(12, 16);
    ctx.lineTo(16, 22);
    ctx.stroke();
}

function hexToRgba(hex, opacity) {
    hex = hex.replace('#', '');
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return hex;
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function animateClearScreenIcons() {
    const grid = document.getElementById('clear-icon-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const countText = document.getElementById('clear-defeated-count');
    if (countText) countText.textContent = '0';
    
    const theme = getStageTheme(currentStage);
    const count = stageKills;
    
    grid.style.setProperty('--ripple-color', theme.enemyColor);
    
    if (count > 24) {
        // xCount style
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.gap = '12px';
        wrapper.style.fontSize = '1.8rem';
        wrapper.style.color = theme.enemyColor;
        wrapper.style.fontWeight = 'bold';
        
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        canvas.style.width = '24px';
        canvas.style.height = '24px';
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        drawTinyStickman(ctx, theme.enemyColor);
        
        wrapper.appendChild(canvas);
        const text = document.createElement('span');
        text.textContent = `x${count}`;
        wrapper.appendChild(text);
        grid.appendChild(wrapper);
        
        wrapper.style.position = 'relative';
        const edge = Math.floor(Math.random() * 4);
        let startX = 0, startY = 0;
        if (edge === 0) startX = -400;
        else if (edge === 1) startX = 400;
        else if (edge === 2) startY = -400;
        else startY = 400;
        
        wrapper.style.transform = `translate(${startX}px, ${startY}px) scale(0.3)`;
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        setTimeout(() => {
            wrapper.style.transform = 'translate(0, 0) scale(1)';
            wrapper.style.opacity = '1';
            playSound('swing');
            
            setTimeout(() => {
                playSound('hit');
                // Count up animation
                let current = 0;
                const step = Math.max(1, Math.floor(count / 20));
                const timer = setInterval(() => {
                    current = Math.min(count, current + step);
                    if (countText) {
                        countText.textContent = current;
                        countText.style.transform = 'scale(1.3)';
                        countText.style.transition = 'transform 0.05s ease';
                        setTimeout(() => {
                            countText.style.transform = 'scale(1)';
                        }, 50);
                    }
                    if (current >= count) {
                        clearInterval(timer);
                    } else {
                        playSound('hit');
                    }
                }, 60);
            }, 600);
        }, 150);
    } else {
        // Individual icons
        let staggerInterval = 120;
        if (count <= 5) {
            staggerInterval = 300;
        } else if (count <= 10) {
            staggerInterval = 200;
        }
        
        for (let i = 0; i < count; i++) {
            const cell = document.createElement('div');
            cell.className = 'clear-enemy-icon-wrapper';
            cell.style.position = 'relative';
            cell.style.width = '28px';
            cell.style.height = '28px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.background = 'rgba(255, 255, 255, 0.02)';
            cell.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            cell.style.borderRadius = '6px';
            cell.style.boxSizing = 'border-box';
            cell.style.setProperty('--ripple-color', theme.enemyColor);
            
            const canvas = document.createElement('canvas');
            canvas.width = 24;
            canvas.height = 24;
            canvas.style.width = '24px';
            canvas.style.height = '24px';
            canvas.style.display = 'block';
            canvas.style.boxSizing = 'border-box';
            canvas.style.margin = 'auto';
            canvas.style.pointerEvents = 'none';
            
            const ctx = canvas.getContext('2d');
            drawTinyStickman(ctx, theme.enemyColor);
            
            cell.appendChild(canvas);
            grid.appendChild(cell);
            
            const edge = Math.floor(Math.random() * 4);
            let startX = 0, startY = 0;
            const distRange = 400 + Math.random() * 200;
            if (edge === 0) { startX = -distRange; startY = (Math.random() - 0.5) * 300; }
            else if (edge === 1) { startX = distRange; startY = (Math.random() - 0.5) * 300; }
            else if (edge === 2) { startX = (Math.random() - 0.5) * 300; startY = -distRange; }
            else { startX = (Math.random() - 0.5) * 300; startY = distRange; }
            
            canvas.style.transform = `translate(${startX}px, ${startY}px) scale(0.3)`;
            canvas.style.opacity = '0';
            canvas.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease';
            
            const staggerTime = i * staggerInterval;
            setTimeout(() => {
                canvas.style.transform = 'translate(0, 0) scale(1)';
                canvas.style.opacity = '1';
                playSound('swing');
                
                setTimeout(() => {
                    playSound('hit');
                    
                    cell.classList.add('landed', 'ripple');
                    cell.style.background = hexToRgba(theme.enemyColor, 0.1);
                    cell.style.borderColor = hexToRgba(theme.enemyColor, 0.4);
                    cell.style.boxShadow = `0 0 10px ${hexToRgba(theme.enemyColor, 0.4)}`;
                    
                    setTimeout(() => {
                        cell.classList.remove('landed');
                    }, 250);
                    
                    if (countText) {
                        countText.textContent = i + 1;
                        countText.style.transform = 'scale(1.3)';
                        countText.style.transition = 'transform 0.05s ease';
                        setTimeout(() => {
                            countText.style.transform = 'scale(1)';
                        }, 55);
                    }
                }, 600);
            }, staggerTime);
        }
    }
}

// Handle stage complete
function stageComplete() {
    gameState = 'gameover'; // Pause updates
    
    const isPerfect = (player.hp >= player.maxHp);
    const perfectBonus = isPerfect ? 500 : 0;
    if (isPerfect) score += 500;
    stageStartScore = score;
    
    let earnedStars = 1;
    if (isPerfect) earnedStars = 3;
    else {
        const hpPercent = player.hp / player.maxHp;
        if (hpPercent >= 0.7) earnedStars = 3;
        else if (hpPercent >= 0.3) earnedStars = 2;
    }
    
    saveStageProgress(currentStage, earnedStars);
    
    const clearTitle = document.getElementById('clear-title');
    if (clearTitle) clearTitle.textContent = `⚡ STAGE ${currentStage} CLEAR! ⚡`;
    
    const clearDefeated = document.getElementById('clear-defeated-count');
    if (clearDefeated) clearDefeated.textContent = stageKills;
    
    const clearPerfect = document.getElementById('clear-perfect-bonus');
    if (clearPerfect) clearPerfect.textContent = isPerfect ? "+500" : "+0";
    
    const clearStarsContainer = document.getElementById('clear-stars');
    if (clearStarsContainer) {
        clearStarsContainer.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            clearStarsContainer.innerHTML += `<span class="clear-star ${i <= earnedStars ? 'filled' : ''}">★</span>`;
        }
    }
    
    if (stageClearOverlayElement) stageClearOverlayElement.classList.remove('hidden');
    playSound('heavy');
    
    // Run grid stagger animation
    animateClearScreenIcons();
}

function spawnEnemy() {
    const config = getStageConfig(currentStage);
    const theme = getStageTheme(currentStage);
    
    const hasBossActive = enemies.some(e => e.isBoss);
    
    if (!hasBossActive && stageKills === config.targetKills - 1) {
        // Spawn boss only when all other enemies are dead
        if (enemies.length === 0) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = canvas.width / 2 + (side * (canvas.width/2 + 50));
            enemies.push(new Entity(x, getBossColor(currentStage), true));
            spawnFloatingText(canvas.width/2, 200, "WARNING: BOSS INCOMING", getBossColor(currentStage));
            playSound('heavy');
            bossLowHPSwordTriggered = false;
            playerLowHPSwordTriggered = false;
            
            // Show Boss Strip
            if (bossHealthStrip) {
                bossHealthStrip.classList.remove('hidden');
                if (bossHealthBar) bossHealthBar.style.width = '100%';
                resize();
            }
        }
        return;
    }
    
    if (hasBossActive) {
        // Boss is active. Cap small enemies to 2.
        const normalEnemiesCount = enemies.filter(e => !e.isBoss).length;
        if (normalEnemiesCount >= 2) return;
    } else {
        // Boss is not active. Cap normal enemies using standard stage logic.
        const cap = Math.min(6, 2 + Math.floor(stageKills / 4));
        if (enemies.length >= cap) return;
        // Leave room for boss (normal enemies can only spawn if stageKills + enemies.length < targetKills - 1)
        if (stageKills + enemies.length >= config.targetKills - 1) return;
    }
    
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = canvas.width / 2 + (side * (canvas.width/2 + 50));
    enemies.push(new Entity(x, theme.enemyColor, false));
}

function initGame() {
    player = new Entity(canvas.width/2, '#0ff', false);
    
    enemies = [];
    particles = [];
    floatingTexts = [];
    laserBalls = [];
    score = stageStartScore;
    kills = 0;
    comboCount = 0;
    comboTimer = 0;
    shakeTime = 0;
    screenShake = 0;
    flashAlpha = 0;
    
    slashArcs = [];
    impactRings = [];
    playerGhosts = [];
    ghostSpawnTimer = 0;
    
    weaponDrop = null;
    playerWeapon = null;
    weaponCharges = 0;
    lastWeaponSpawnKills = -1;
    bossLowHPSwordTriggered = false;
    playerLowHPSwordTriggered = false;
    
    generateEnvironment();
    
    updateHUD();
    if (bossHealthStrip) bossHealthStrip.classList.add('hidden');
    resize();
    
    gameState = 'playing';
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    
    spawnEnemy();
    lastTime = performance.now();
    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
}

function gameOver() {
    gameState = 'gameover';
    const finalScore = document.getElementById('final-score');
    if (finalScore) finalScore.textContent = Math.floor(score);
    const finalKills = document.getElementById('final-kills');
    if (finalKills) finalKills.textContent = kills;
    gameOverMenu.classList.remove('hidden');
    playSound('gameover');
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

function drawStickman(ctx, ent) {
    const scale = ent.isBoss ? 1.5 : 1;
    const x = ent.x;
    const y = ent.y;
    const dir = ent.dir; 
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir * scale, scale); 
    
    ctx.strokeStyle = ent.hitStun > 0 ? '#fff' : ent.color;
    ctx.lineWidth = ent.isBoss ? 10 : 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let headOffset = {x:0,y:-80};
    let l_arm = {x:0, y:-50}, l_hand = {x:0, y:0};
    let r_arm = {x:0, y:-50}, r_hand = {x:0, y:0};
    let l_leg = {x:0, y:-30}, l_foot = {x:-10, y:0};
    let r_leg = {x:0, y:-30}, r_foot = {x:10, y:0};
    
    const t = performance.now() / 150;
    
    if (ent.y < groundY && ent.state !== 'hit' && !ent.state.startsWith('attack')) {
        l_hand = {x: -20, y: -50};
        r_hand = {x: 20, y: -50};
        l_foot = {x: -15, y: -15};
        r_foot = {x: 5, y: -20};
        headOffset.y = -85;
    }
    else if (ent.state === 'idle') {
        l_hand = {x:-15, y:-20}; r_hand = {x:15, y:-20};
        headOffset.y += Math.sin(t)*2;
    } 
    else if (ent.state === 'run') {
        const str = Math.sin(t*2) * 20;
        l_foot = {x: -str, y: Math.min(0, str)};
        r_foot = {x: str, y: Math.min(0, -str)};
        l_hand = {x: str, y: -40};
        r_hand = {x: -str, y: -40};
        headOffset.x = 10;
        headOffset.y += Math.abs(str)*0.2;
    }
    else if (ent.state === 'attack1') { 
        l_hand = {x: 40, y: -50}; 
        r_hand = {x: -10, y: -30};
        headOffset.x = 15;
    }
    else if (ent.state === 'attack2') { 
        r_hand = {x: -10, y: -40}; 
        l_hand = {x: 10, y: -30};
        l_foot = {x: 45, y: -45};
        r_foot = {x: -10, y: 0};
        headOffset.x = -5;
    }
    else if (ent.state === 'attack3') { 
        l_hand = {x: -10, y: -30};
        r_hand = {x: 20, y: -90};
        headOffset.x = 10;
        headOffset.y = -75;
    }
    else if (ent.state === 'attack4') { 
        ctx.translate(0, -20); 
        ctx.rotate(-1.4); 
        l_hand = {x: 0, y: -20};
        r_hand = {x: -20, y: -40};
        r_foot = {x: -10, y: 20}; 
        l_foot = {x: 10, y: 60}; 
        headOffset = {x: 0, y: -60}; 
    }
    else if (ent.state === 'hit') {
        headOffset = {x: -20, y: -70};
        l_hand = {x: -30, y: -80};
        r_hand = {x: -10, y: -90};
        l_foot = {x: -20, y: -10};
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = ent.color;
    
    ctx.beginPath();
    ctx.moveTo(0, headOffset.y + 10);
    ctx.lineTo(0, -30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(headOffset.x, headOffset.y, 12, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = ent.hitStun > 0 ? '#fff' : ent.color;
    ctx.fill();
    
    // Draw unique boss decorations per stage
    if (ent.isBoss && ent.hp > 0) {
        ctx.save();
        ctx.strokeStyle = ent.hitStun > 0 ? '#fff' : ent.color;
        ctx.fillStyle = ent.hitStun > 0 ? '#fff' : ent.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = ent.color;

        const stage = ent.bossStage;
        if (stage === 1) {
            // Headband
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 12, headOffset.y - 2);
            ctx.lineTo(headOffset.x + 12, headOffset.y - 2);
            ctx.stroke();
            // Tails
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 10, headOffset.y - 2);
            ctx.lineTo(headOffset.x - 22, headOffset.y + 4);
            ctx.lineTo(headOffset.x - 20, headOffset.y + 12);
            ctx.stroke();
        } else if (stage === 2) {
            // Royal Crown
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 10, headOffset.y - 10);
            ctx.lineTo(headOffset.x - 10, headOffset.y - 20);
            ctx.lineTo(headOffset.x - 5, headOffset.y - 14);
            ctx.lineTo(headOffset.x, headOffset.y - 22);
            ctx.lineTo(headOffset.x + 5, headOffset.y - 14);
            ctx.lineTo(headOffset.x + 10, headOffset.y - 20);
            ctx.lineTo(headOffset.x + 10, headOffset.y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (stage === 3) {
            // Horns
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 6, headOffset.y - 10);
            ctx.quadraticCurveTo(headOffset.x - 12, headOffset.y - 18, headOffset.x - 16, headOffset.y - 16);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headOffset.x + 6, headOffset.y - 10);
            ctx.quadraticCurveTo(headOffset.x + 12, headOffset.y - 18, headOffset.x + 16, headOffset.y - 16);
            ctx.stroke();
        } else if (stage === 4) {
            // Glowing Cyber Visor
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 4, headOffset.y - 2);
            ctx.lineTo(headOffset.x + 12, headOffset.y - 2);
            ctx.stroke();
            ctx.restore();
        } else if (stage === 5) {
            // Mohawk Hair
            ctx.beginPath();
            for (let angle = -Math.PI/2 - 0.5; angle <= -Math.PI/2 + 0.5; angle += 0.25) {
                const hx = headOffset.x + Math.cos(angle) * 12;
                const hy = headOffset.y + Math.sin(angle) * 12;
                const tx = headOffset.x + Math.cos(angle) * 22;
                const ty = headOffset.y + Math.sin(angle) * 22;
                ctx.moveTo(hx, hy);
                ctx.lineTo(tx, ty);
            }
            ctx.stroke();
        } else if (stage === 6) {
            // Samurai crest
            ctx.beginPath();
            ctx.arc(headOffset.x, headOffset.y - 16, 8, 0, Math.PI, true);
            ctx.stroke();
        } else if (stage === 7) {
            // Scarf wrapping neck
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, -66);
            ctx.lineTo(headOffset.x - 12, headOffset.y + 12);
            ctx.moveTo(0, -66);
            ctx.lineTo(headOffset.x - 18, headOffset.y + 24);
            ctx.stroke();
        } else if (stage === 8) {
            // Lightning bolt crest
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 4, headOffset.y - 12);
            ctx.lineTo(headOffset.x - 10, headOffset.y - 24);
            ctx.lineTo(headOffset.x, headOffset.y - 20);
            ctx.lineTo(headOffset.x - 4, headOffset.y - 32);
            ctx.stroke();
        } else if (stage === 9) {
            // Giant demon horns
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 8, headOffset.y - 8);
            ctx.quadraticCurveTo(headOffset.x - 22, headOffset.y - 25, headOffset.x - 14, headOffset.y - 30);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headOffset.x + 8, headOffset.y - 8);
            ctx.quadraticCurveTo(headOffset.x + 22, headOffset.y - 25, headOffset.x + 14, headOffset.y - 30);
            ctx.stroke();
        } else if (stage === 10) {
            // Sunglasses
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.fillRect(headOffset.x - 2, headOffset.y - 5, 6, 4);
            ctx.fillRect(headOffset.x + 6, headOffset.y - 5, 6, 4);
            ctx.strokeStyle = ent.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(headOffset.x - 2, headOffset.y - 5, 6, 4);
            ctx.strokeRect(headOffset.x + 6, headOffset.y - 5, 6, 4);
            ctx.beginPath();
            ctx.moveTo(headOffset.x + 4, headOffset.y - 3);
            ctx.lineTo(headOffset.x + 6, headOffset.y - 3);
            ctx.stroke();
        } else if (stage === 11) {
            // Wizard Hat
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 16, headOffset.y - 10);
            ctx.lineTo(headOffset.x + 16, headOffset.y - 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 10, headOffset.y - 10);
            ctx.lineTo(headOffset.x, headOffset.y - 32);
            ctx.lineTo(headOffset.x + 10, headOffset.y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (stage === 12) {
            // Shoulder Spikes
            ctx.beginPath();
            ctx.moveTo(-10, -50);
            ctx.lineTo(-24, -62);
            ctx.lineTo(-6, -45);
            ctx.moveTo(10, -50);
            ctx.lineTo(24, -62);
            ctx.lineTo(6, -45);
            ctx.stroke();
        } else if (stage === 13) {
            // Solar halo
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(headOffset.x, headOffset.y - 18, 10, 0, Math.PI * 2);
            ctx.stroke();
        } else if (stage === 14) {
            // Full helmet face shield grid
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 10, headOffset.y - 6);
            ctx.lineTo(headOffset.x + 10, headOffset.y - 6);
            ctx.lineTo(headOffset.x + 6, headOffset.y + 6);
            ctx.lineTo(headOffset.x - 6, headOffset.y + 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (stage === 15) {
            // Supreme cyber emperor crown + cape
            ctx.beginPath();
            ctx.moveTo(headOffset.x - 8, headOffset.y - 10);
            ctx.lineTo(headOffset.x - 16, headOffset.y - 25);
            ctx.lineTo(headOffset.x - 4, headOffset.y - 16);
            ctx.lineTo(headOffset.x, headOffset.y - 30);
            ctx.lineTo(headOffset.x + 4, headOffset.y - 16);
            ctx.lineTo(headOffset.x + 16, headOffset.y - 25);
            ctx.lineTo(headOffset.x + 8, headOffset.y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Cape trailing down
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-12, -48);
            ctx.lineTo(-25, 0);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -50); ctx.lineTo(l_arm.x, l_arm.y); ctx.lineTo(l_hand.x, l_hand.y); 
    ctx.moveTo(0, -50); ctx.lineTo(r_arm.x, r_arm.y); ctx.lineTo(r_hand.x, r_hand.y); 
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(l_leg.x, l_leg.y); ctx.lineTo(l_foot.x, l_foot.y); 
    ctx.moveTo(0, -30); ctx.lineTo(r_leg.x, r_leg.y); ctx.lineTo(r_foot.x, r_foot.y); 
    ctx.stroke();

    // Draw hand nubs (boxing gloves) like reference image
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = ent.color;
    ctx.fillStyle = ent.hitStun > 0 ? '#fff' : ent.color;
    
    ctx.beginPath();
    ctx.arc(l_hand.x, l_hand.y, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(r_hand.x, r_hand.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw Held Weapon (Neon Sword)
    if (ent === player && playerWeapon === 'sword' && ent.hp > 0) {
        ctx.save();
        let hand = (ent.state === 'attack1') ? l_hand : r_hand;
        ctx.translate(hand.x, hand.y);
        
        let swordAngle = -Math.PI / 4; 
        if (ent.state === 'attack1' || ent.state === 'attack2' || ent.state === 'attack3') {
            swordAngle = Math.PI / 6; 
        } else if (ent.state === 'attack4') {
            swordAngle = -Math.PI / 1.5; 
        }
        ctx.rotate(swordAngle);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff3300';
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -32);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, -5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.restore();
    
    if (ent !== player && ent.hp > 0 && !ent.isBoss) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(ent.x - 20, ent.y - (100 * scale), 40, 5);
        ctx.fillStyle = ent.color;
        ctx.fillRect(ent.x - 20, ent.y - (100 * scale), (ent.hp/ent.maxHp)*40, 5);
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x+(Math.random()*20-10), y: y+(Math.random()*20-10), text, color, life: 1.0 });
}
function createHitSparks(x, y, color) {
    for (let i=0; i<10; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*15, 
            vy: (Math.random()-0.5)*15 - 5,
            life: 1.0, color
        });
    }
}

function createBloodSpray(x, y, dir) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: dir * (Math.random() * 12 + 4) + (Math.random() - 0.5) * 3,
            vy: -Math.random() * 6 - 2,
            life: 0.8 + Math.random() * 0.6,
            color: '#ff003c'
        });
    }
}

function executeAttack(ent) {
    if (ent.state.startsWith('attack') || ent.hitStun > 0) return;
    
    let attackType = 'attack1';
    let damage = 5;
    let knockback = 5;
    let atkTime = 200;
    
    if (ent === player) {
        comboTimer = COMBO_WINDOW;
        comboCount++;
        playSound('swing');
        
        if (playerWeapon === 'sword') {
            weaponCharges--;
            if (weaponCharges <= 0) {
                playerWeapon = null;
                playSound('heavy');
                spawnFloatingText(player.x, player.y - 100, "SWORD BROKE!", "#ff003c");
                createHitSparks(player.x, player.y - 40, '#ff003c');
            }
        }
        
        if (comboCount === 1) {
            attackType = 'attack1'; damage = 5; knockback = 5; atkTime = 200;
        } else if (comboCount === 2) {
            attackType = 'attack2'; damage = 10; knockback = 8; atkTime = 300;
        } else if (comboCount === 3) {
            attackType = 'attack3'; damage = 15; knockback = 12; atkTime = 350;
        } else if (comboCount >= 4) {
            attackType = 'attack4'; damage = 25; knockback = 30; atkTime = 500;
            comboCount = 0; 
            ent.vy = -5; 
            ent.vx = ent.dir * 18; 
        }
    } else {
        if (ent.isBoss) { 
            const rand = Math.random();
            attackType = rand > 0.6 ? 'attack3' : (rand > 0.3 ? 'attack2' : 'attack1'); 
            damage = 10 + (currentStage - 1) * 2; 
            knockback = 15 + (currentStage - 1) * 1; 
            atkTime = Math.max(300, 450 - (currentStage - 1) * 10); 
        } else { 
            attackType = Math.random() > 0.5 ? 'attack2' : 'attack1';
            damage = 5; knockback = 5; 
        }
        playSound('swing');
    }
    
    ent.state = attackType;
    ent.stateFrame = atkTime;
    
    const isSword = (ent === player && playerWeapon === 'sword');
    ent.attackHitbox = {
        offsetX: isSword ? 55 : 40,
        offsetY: -45,
        w: (attackType === 'attack4' ? 80 : 50) * (isSword ? 1.4 : 1),
        h: (attackType === 'attack4' ? 60 : 50) * (isSword ? 1.2 : 1),
        type: attackType,
        damage, knockback,
        active: true
    };
    
    // Spawn custom Slash Arc
    const slashColor = isSword ? '#ff6600' : ent.color;
    const slashX = ent.x + ent.dir * (ent.isBoss ? 55 : (isSword ? 50 : 35));
    const slashY = ent.y + (attackType === 'attack4' ? -40 : -50);
    slashArcs.push(new SlashArc(slashX, slashY, ent.dir, attackType, slashColor));
    
    if (attackType === 'attack4' && ent === player) {
        screenShake = 15;
    }
}

function checkHitbox(attacker, defender) {
    if (!attacker.attackHitbox || !attacker.attackHitbox.active) return false;
    if (defender.hitStun > 0) return false; 
    
    const h = attacker.attackHitbox;
    const hx = attacker.x + (attacker.dir * h.offsetX);
    const hy = attacker.y + h.offsetY;

    const defW = defender.isBoss ? 40 : 20;
    if (Math.abs(hx - defender.x) < (h.w/2 + defW) && 
        Math.abs(hy - (defender.y - 40)) < (h.h/2 + 40)) {
        
        if (h.type !== 'attack4') attacker.attackHitbox.active = false; 
        
        let finalDamage = h.damage;
        let isPlayerSwordHit = (attacker === player && playerWeapon === 'sword');
        if (isPlayerSwordHit) {
            finalDamage = defender.isBoss ? 75 : h.damage * 1.8;
        }
        
        defender.hp -= finalDamage;
        if (attacker === player && h.type === 'attack4') {
            flashAlpha = 0.35;
            flashColor = '#ffffff';
            screenShake = 20;
        }
        defender.hitStun = 300; 
        
        if (h.type === 'attack3') {
            defender.vy = -12; 
            defender.vx = attacker.dir * 4;
        } else {
            defender.vx = attacker.dir * h.knockback; 
        }
        defender.state = 'hit';
        
        const sparkColor = isPlayerSwordHit ? '#ff6600' : attacker.color;
        createHitSparks(defender.x, defender.y - 40, sparkColor);
        if (isPlayerSwordHit) {
            createBloodSpray(defender.x, defender.y - 40, attacker.dir);
        }
        impactRings.push(new ImpactRing(defender.x, defender.y - 40, sparkColor));
        
        screenShake = Math.max(screenShake, h.knockback > 10 ? 15 : 6);
        playSound(h.knockback > 10 ? 'heavy' : 'hit');
        
        if (defender === player) {
            comboCount = 0; 
            flashAlpha = 0.25;
            flashColor = '#ff003c';
            screenShake = 12;
        } else {
            spawnFloatingText(defender.x, defender.y - 80, finalDamage, "#ff0");
            
            if (comboCount > 1 && uiCombo) {
                uiCombo.classList.remove('hidden');
                if (comboSpan) comboSpan.textContent = comboCount;
            }
        }
        updateHUD();
        return true;
    }
    return false;
}

function update(deltaTime) {
    if (shakeTime > 0) shakeTime -= deltaTime * 16.67;
    if (screenShake > 0.1) screenShake *= Math.pow(0.85, deltaTime);
    else screenShake = 0;
    
    if (flashAlpha > 0) {
        flashAlpha -= 0.05 * deltaTime;
        if (flashAlpha < 0) flashAlpha = 0;
    }
    
    updateEnvironment(deltaTime);
    gridYOffset = (gridYOffset + 0.005 * deltaTime) % 1;
    
    let playerSpeedX = 0;
    if (player.hitStun <= 0 && !player.state.startsWith('attack')) {
        const speed = 4.16;
        if (keys.left) playerSpeedX = -speed;
        else if (keys.right) playerSpeedX = speed;
    }
    const totalMovement = playerSpeedX + player.vx;
    groundScroll += totalMovement * 0.8 * deltaTime;
    
    // Weapon Drop Logic
    if (kills > 0 && kills % 10 === 0 && lastWeaponSpawnKills !== kills) {
        lastWeaponSpawnKills = kills;
        weaponDrop = {
            x: player.x,
            y: -50,
            vy: 5,
            active: true,
            color: '#ff3300',
            glowColor: '#ff6600',
            onGround: false
        };
        spawnFloatingText(player.x, 100, "WEAPON INCOMING!", "#ff6600");
    }
    
    if (weaponDrop && weaponDrop.active) {
        if (!weaponDrop.onGround) {
            weaponDrop.y += weaponDrop.vy * deltaTime;
            if (weaponDrop.y >= groundY) {
                weaponDrop.y = groundY;
                weaponDrop.onGround = true;
                weaponDrop.vy = 0;
            }
        } else {
            // Slide towards player
            const dx = player.x - weaponDrop.x;
            if (Math.abs(dx) > 5) {
                weaponDrop.x += Math.sign(dx) * 2 * deltaTime;
            }
        }
        
        // Collision detection
        const distToPlayer = Math.abs(weaponDrop.x - player.x);
        if (distToPlayer < 50 && Math.abs(weaponDrop.y - player.y) < 50) {
            playerWeapon = 'sword';
            weaponCharges = 15;
            weaponDrop = null;
            playSound('heavy');
            spawnFloatingText(player.x, player.y - 100, "NEON SWORD!", "#ff6600");
            createHitSparks(player.x, player.y - 40, '#ff6600');
            flashAlpha = 0.25;
            flashColor = '#ff6600';
            screenShake = 10;
        }
    }
    
    // Update visual FX lists
    slashArcs.forEach(sa => sa.update(deltaTime));
    slashArcs = slashArcs.filter(sa => sa.life > 0);
    
    impactRings.forEach(ir => ir.update(deltaTime));
    impactRings = impactRings.filter(ir => ir.life > 0);
    
    playerGhosts.forEach(g => {
        g.life -= 0.04 * deltaTime;
    });
    playerGhosts = playerGhosts.filter(g => g.life > 0);
    
    ghostSpawnTimer -= deltaTime * 16.67;
    if (ghostSpawnTimer <= 0) {
        const isHighSpeed = Math.abs(player.vx) > 3 || player.state === 'run' || player.state === 'attack3';
        if (isHighSpeed && player.hp > 0) {
            playerGhosts.push({
                x: player.x,
                y: player.y,
                dir: player.dir,
                state: player.state,
                stateFrame: player.stateFrame,
                color: player.color,
                life: 1.0,
                isBoss: player.isBoss
            });
            ghostSpawnTimer = 60; // spawn every 60ms
        }
    }
    
    if (comboTimer > 0) {
        comboTimer -= deltaTime * 16.67;
        if (comboTimer <= 0) {
            comboCount = 0;
            uiCombo?.classList.add('hidden');
        }
    }
    
    if (Math.random() < 0.06 * deltaTime) spawnEnemy();
    
    if (keys.up && player.y === groundY && player.hitStun <= 0) {
        player.vy = -16;
        playSound('swing');
    }

    if (player.hitStun <= 0 && !player.state.startsWith('attack')) {
        const speed = 4.16; // 250 / 60 approx
        const isAirborne = player.y < groundY;
        if (keys.left) { 
            player.x -= speed * deltaTime; 
            player.dir = -1; 
            player.state = isAirborne ? 'jump' : 'run'; 
        }
        else if (keys.right) { 
            player.x += speed * deltaTime; 
            player.dir = 1; 
            player.state = isAirborne ? 'jump' : 'run'; 
        }
        else { 
            player.state = isAirborne ? 'jump' : 'idle'; 
        }
        
        player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    }
    
    if (attackQueued) {
        attackQueued = false;
        executeAttack(player);
    }
    
    if (player.hitStun > 0) {
        player.hitStun -= deltaTime * 16.67;
        if (player.hitStun <= 0) player.state = (player.y < groundY) ? 'jump' : 'idle';
    }
    if (player.state.startsWith('attack')) {
        player.stateFrame -= deltaTime * 16.67;
        if (player.stateFrame <= 0) {
            player.state = (player.y < groundY) ? 'jump' : 'idle';
            if (player.attackHitbox) player.attackHitbox.active = false;
        }
    }
    
    player.x += player.vx * deltaTime;
    player.vx *= Math.pow(0.8, deltaTime); 
    player.y += player.vy * deltaTime;
    if (player.y < groundY) player.vy += 1.0 * deltaTime; // 60/60 = 1.0
    else { player.y = groundY; player.vy = 0; }
    
    enemies.forEach(e => checkHitbox(player, e));
    
    let activeBoss = enemies.find(e => e.isBoss);
    if (activeBoss) {
        const bossPercent = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
        if (bossHealthBar) bossHealthBar.style.width = bossPercent + "%";
        if (bossHpVal) bossHpVal.textContent = `${Math.ceil(activeBoss.hp)}/${activeBoss.maxHp}`;
        
        // 1. Boss HP drops below 30% trigger
        if (bossPercent <= 30 && !bossLowHPSwordTriggered) {
            bossLowHPSwordTriggered = true;
            if (playerWeapon !== 'sword') {
                playerWeapon = 'sword';
                weaponCharges = 15;
                playSound('heavy');
                spawnFloatingText(player.x, player.y - 120, "FINISH HIM! SWORD ENABLED", "#ff3300");
                createHitSparks(player.x, player.y - 40, '#ff3300');
                flashAlpha = 0.3;
                flashColor = '#ff3300';
            }
        }
        
        // 2. Player HP drops below 30% trigger during boss fight
        const playerPercent = (player.hp / player.maxHp) * 100;
        if (playerPercent <= 30 && player.hp > 0 && !playerLowHPSwordTriggered) {
            playerLowHPSwordTriggered = true;
            playerWeapon = 'sword';
            weaponCharges = 20; // extra charges for survival
            player.hp = Math.min(player.maxHp, player.hp + 40); // heal +40 HP to help survive
            playSound('heavy');
            spawnFloatingText(player.x, player.y - 120, "CLUTCH TIME! SWORD + HEALTH INCOMING!", "#00ff66");
            createHitSparks(player.x, player.y - 40, '#00ff66');
            flashAlpha = 0.3;
            flashColor = '#00ff66';
        }
    } else {
        if (bossHealthStrip && !bossHealthStrip.classList.contains('hidden')) {
            bossHealthStrip.classList.add('hidden');
            resize();
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        if (e.hp <= 0) {
            kills++;
            if (!e.isBoss && enemies.some(ent => ent.isBoss)) {
                // Small helper enemies killed during boss fight do not advance stage progression
            } else {
                stageKills++;
            }
            if (kills % 40 === 0) {
                player.hp = Math.min(player.maxHp, player.hp + 40);
                spawnFloatingText(player.x, player.y - 100, "+40 HP!", "#00ff66");
                playSound('heavy');
            }
            score += e.isBoss ? 50 : 10;
            if (e.isBoss) {
                if (window.achievements) window.achievements.unlock('stickfighter', 'boss_kill', 'Giant Slayer');
                weaponDrop = {
                    x: e.x,
                    y: e.y - 15,
                    vy: 0,
                    active: true,
                    color: '#ff3300',
                    glowColor: '#ff6600',
                    onGround: true
                };
                spawnFloatingText(e.x, e.y - 100, "SWORD DROPPED!", "#ff6600");
            }
            createHitSparks(e.x, e.y-40, e.color);
            
            if (stageKills >= stageTargetKills) {
                setTimeout(stageComplete, 800);
            }
            
            if (e.isBoss && bossHealthStrip) {
                if (bossHealthBar) bossHealthBar.style.width = '0%';
                setTimeout(() => {
                    bossHealthStrip.classList.add('hidden');
                    resize();
                }, 500);
            }
            
            enemies.splice(i, 1);
            updateHUD();
            continue;
        }
        
        if (e.isBoss && currentStage === 15) {
            e.laserTimer -= deltaTime * 16.67;
            if (e.laserTimer <= 0 && e.hitStun <= 0 && !e.state.startsWith('attack')) {
                const dir = player.x > e.x ? 1 : -1;
                laserBalls.push(new LaserBall(e.x + dir * 40, groundY - 15, dir));
                e.laserTimer = 2500 + Math.random() * 1000;
                e.state = 'attack1';
                e.stateFrame = 350;
                playSound('swing');
                spawnFloatingText(e.x, e.y - 120, "LASER BALL!", "#ff0055");
            }
        }

        if (e.hitStun > 0) {
            e.hitStun -= deltaTime * 16.67;
            if (e.hitStun <= 0) e.state = 'idle';
        }
        else if (e.state.startsWith('attack')) {
            e.stateFrame -= deltaTime * 16.67;
            if (e.stateFrame <= 0) {
                e.state = 'idle';
                if (e.attackHitbox) e.attackHitbox.active = false;
            }
        }
        else {
            const dist = player.x - e.x;
            const reach = e.isBoss ? 70 : 50;
            const speedFactor = 1 + (currentStage - 1) * 0.08;
            const attackFactor = 1 + (currentStage - 1) * 0.04;
            if (Math.abs(dist) > reach) {
                const baseSpeed = e.isBoss ? 1.67 : 1.33;
                const speed = baseSpeed * speedFactor;
                e.dir = dist > 0 ? 1 : -1;
                e.x += e.dir * speed * deltaTime;
                e.state = 'run';
            } else {
                e.state = 'idle';
                e.dir = dist > 0 ? 1 : -1;
                const baseAttackProb = e.isBoss ? 0.18 : 0.12;
                if (Math.random() < (baseAttackProb * attackFactor * deltaTime)) {
                    executeAttack(e);
                }
            }
        }
        
        e.x += e.vx * deltaTime;
        e.vx *= Math.pow(0.8, deltaTime);
        e.y += e.vy * deltaTime;
        if (e.y < groundY) e.vy += 1.0 * deltaTime;
        else { e.y = groundY; e.vy = 0; }
        
        checkHitbox(e, player);
    }
    
    // Update and check Laser Balls collision
    laserBalls.forEach(ball => {
        ball.update(deltaTime);
        if (ball.active && player && player.hp > 0) {
            const dx = ball.x - player.x;
            const playerHeight = 80;
            const playerWidth = 30;
            if (ball.x > player.x - playerWidth && ball.x < player.x + playerWidth &&
                ball.y > player.y - playerHeight && ball.y < player.y) {
                
                player.hp -= ball.damage;
                player.hitStun = 300;
                player.state = 'hit';
                player.vx = Math.sign(ball.vx) * 8; // knockback
                ball.active = false;
                
                createHitSparks(player.x, player.y - 40, '#ff0055');
                impactRings.push(new ImpactRing(player.x, player.y - 40, '#ff0055'));
                flashAlpha = 0.3;
                flashColor = '#ff0055';
                screenShake = 15;
                playSound('heavy');
                spawnFloatingText(player.x, player.y - 100, `-${ball.damage} HP`, '#ff0055');
                updateHUD();
            }
        }
    });
    laserBalls = laserBalls.filter(ball => ball.active);

    if (player.hp <= 0 && gameState === 'playing') {
        gameOver();
    }
    
    particles.forEach(p => { p.x += p.vx * deltaTime; p.y += p.vy * deltaTime; p.vy += 0.5 * deltaTime; p.life -= (deltaTime * 0.01667); });
    particles = particles.filter(p => p.life > 0);
    
    floatingTexts.forEach(t => { t.y -= 1 * deltaTime; t.life -= (deltaTime * 0.01667); });
    floatingTexts = floatingTexts.filter(t => t.life > 0);
}

function updateHUD() {
    if (uiScore) uiScore.textContent = Math.floor(score);
    if (uiKills) {
        if (gameState === 'playing' || gameState === 'paused') {
            uiKills.textContent = `${stageKills}/${stageTargetKills}`;
        } else {
            uiKills.textContent = kills;
        }
    }
    const uiStage = document.getElementById('ui-stage');
    if (uiStage) uiStage.textContent = currentStage;
    
    if (playerHealthBar && player) {
        const playerPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        playerHealthBar.style.width = playerPercent + "%";
        if (playerHpVal) playerHpVal.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const theme = getStageTheme(currentStage);
    
    // 1. Draw static sky elements (Sky Gradient, Stars, Sunset Sun, Clouds)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, theme.skyGradient[0]);
    skyGrad.addColorStop(0.4, theme.skyGradient[1]);
    skyGrad.addColorStop(0.7, theme.skyGradient[2]);
    skyGrad.addColorStop(1, theme.skyGradient[3]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, groundY);
    
    stars.forEach(s => {
        ctx.save();
        if (theme.bgStyle === 'stars') {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, s.alpha))})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        } else if (theme.bgStyle === 'matrix') {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ff3c';
            ctx.fillStyle = `rgba(0, 255, 60, ${0.3 + s.alpha * 0.7})`;
            ctx.fillRect(s.x, s.y, s.size * 1.5, s.size * 8);
        } else if (theme.bgStyle === 'meteor') {
            ctx.strokeStyle = `rgba(143, 0, 255, ${0.4 + s.alpha * 0.6})`;
            ctx.lineWidth = s.size;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + s.size * 6, s.y - s.size * 3);
            ctx.stroke();
        }
        ctx.restore();
    });
    
    const sunR = 80;
    const sunX = canvas.width / 2;
    const sunY = groundY;
    
    ctx.save();
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY);
    sunGrad.addColorStop(0, theme.sunColor[0]);
    sunGrad.addColorStop(0.5, theme.sunColor[1]);
    sunGrad.addColorStop(1, theme.sunColor[2]);
    ctx.fillStyle = sunGrad;
    ctx.shadowBlur = 35;
    ctx.shadowColor = theme.sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, Math.PI, 0, false);
    ctx.fill();
    ctx.restore();
    
    for (let i = 1; i <= 6; i++) {
        const thickness = 2 + i * 0.8;
        const ly = sunY - i * 11;
        ctx.fillStyle = theme.skyGradient[0];
        ctx.fillRect(sunX - sunR - 10, ly, (sunR + 10) * 2, thickness);
    }
    
    clouds.forEach(c => {
        ctx.save();
        ctx.fillStyle = theme.gridHorizon + '14';
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.gridHorizon + '33';
        drawRealCloud(c.x, c.y, c.width, c.height);
        ctx.restore();
    });
    
    // 2. Shake camera for entities & ground
    ctx.save();
    let shakeAmt = Math.max(screenShake, (shakeTime > 0 ? 10 : 0));
    if (shakeAmt > 0) {
        ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
    }
    
    // 3. Draw Normal Grid Ground (2D scrolling grid, no 3D perspective)
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    ctx.save();
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1.5;
    
    // Flat vertical lines
    const stepX = 100;
    const startX = -stepX - (groundScroll % stepX);
    for (let x = startX; x < canvas.width + stepX; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Flat horizontal lines
    const stepY = 25;
    for (let y = groundY + stepY; y < canvas.height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();
    
    ctx.strokeStyle = theme.gridHorizon;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = theme.gridHorizon;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw Weapon Drop
    if (weaponDrop && weaponDrop.active) {
        ctx.save();
        ctx.translate(weaponDrop.x, weaponDrop.y - 15);
        const spinAngle = (performance.now() / 250);
        ctx.rotate(spinAngle);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = weaponDrop.glowColor;
        ctx.strokeStyle = weaponDrop.color;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(5, 5);
        ctx.stroke();
        
        ctx.restore();
        
        ctx.save();
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillStyle = '#ff6600';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff3300';
        ctx.fillText("SWORD", weaponDrop.x, weaponDrop.y - 30);
        ctx.restore();
    }
    
    // Draw Player Ghost Trails
    playerGhosts.forEach(g => {
        ctx.save();
        ctx.globalAlpha = g.life * 0.3;
        
        const tempEnt = {
            x: g.x,
            y: g.y,
            dir: g.dir,
            state: g.state,
            stateFrame: g.stateFrame,
            color: '#00ffff',
            isBoss: g.isBoss,
            hitStun: 0,
            hp: 0,
            maxHp: 1
        };
        drawStickman(ctx, tempEnt);
        ctx.restore();
    });
    
    // Draw Entities
    enemies.forEach(e => drawStickman(ctx, e));
    if (player) drawStickman(ctx, player);
    
    // Draw combat visual effects
    slashArcs.forEach(sa => sa.draw(ctx));
    impactRings.forEach(ir => ir.draw(ctx));
    
    // Draw Laser Balls
    laserBalls.forEach(ball => ball.draw(ctx));
    
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;
    
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.shadowBlur = 5; ctx.shadowColor = '#000';
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;
    
    ctx.restore(); // Restore shake camera translate
    
    if (flashAlpha > 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    const deltaTime = Math.min(dt / 16.67, 3);
    
    if (gameState === 'playing') {
        update(deltaTime);
    }
    draw();
    
    requestAnimationFrame(loop);
}

document.getElementById('btn-start').addEventListener('click', showStageMenu);
document.getElementById('btn-restart').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    startStage(currentStage);
});

document.getElementById('btn-howtoplay').addEventListener('click', () => { howToPlayModal.classList.remove('hidden'); });
document.querySelector('.close-btn').addEventListener('click', () => { howToPlayModal.classList.add('hidden'); });

btnBackStages?.addEventListener('click', () => {
    stageMenuElement.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

document.getElementById('btn-next-stage')?.addEventListener('click', () => {
    if (stageClearOverlayElement) stageClearOverlayElement.classList.add('hidden');
    if (currentStage < TOTAL_STAGES) {
        startStage(currentStage + 1);
    } else {
        showStageMenu();
    }
});

document.getElementById('btn-replay-stage')?.addEventListener('click', () => {
    if (stageClearOverlayElement) stageClearOverlayElement.classList.add('hidden');
    startStage(currentStage);
});

document.getElementById('btn-menu-stages')?.addEventListener('click', () => {
    if (stageClearOverlayElement) stageClearOverlayElement.classList.add('hidden');
    showStageMenu();
});

document.getElementById('btn-quit').addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    showStageMenu();
});
document.getElementById('btn-quit-end').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    showStageMenu();
});

document.getElementById('btn-resume').addEventListener('click', togglePause);
btnPauseHUD?.addEventListener('click', togglePause);

btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioFX) {
        window.audioFX.toggleMute();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
});

// Idle initialization
player = new Entity(window.innerWidth/2, '#0ff', false);
updateHUD();
resize();
draw();
requestAnimationFrame(loop);
