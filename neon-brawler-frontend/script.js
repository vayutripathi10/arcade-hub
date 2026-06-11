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
if (highScore > 0 && highScore < 1000) {
    highScore = highScore * 100;
    localStorage.setItem('brawlerHighScore', highScore);
}
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
let crescentWaves = [];
let laserBeams = [];
let berserkRings = [];
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
let kills = 0;
let warningText = 'WARNING: BOSS INCOMING';

// Berserk Mode State
let comboStreak = 0;
let berserkTimer = 0;
const BERSERK_DURATION = 300; // 5 seconds

// Dropped Weapons State
let activeWeapon = null; // null, 'katana', 'laserstaff'
let weaponCharges = 0;
let weaponDropActive = false;
let weaponDropX = 0;
let weaponDropY = 0;
let weaponDropType = 'katana';
let weaponDropTimer = 0;

// Combo Finisher State
let consecutiveAttacks = 0;
let lastAttackDirection = null;
let lastAttackTime = 0;

// Juice Overhaul State variables
let currentWave = 1;
let enemiesSpawnedInWave = 0;
let enemiesKilledInWave = 0;
let waveEnemiesToKill = 8;
let waveBannerTimer = 0;
let waveBannerText = "";
let bulletTimeTimer = 0;
let cameraScale = 1.0;
let comboScale = 1.0;
let comboBreakTimer = 0;
let comboBreakX = 0;
let comboBreakY = 0;
let displayedScore = 0;
let lastBossName = "";
let bossEntranceTimer = 0;
let bossHealthBarY = -50;
let vignetteIntensity = 0;
let heartParticles = [];
let multiKillTimer = 0;
let multiKillCount = 0;
let lightningStrikeTimer = 0;
let lightningStrikes = [];
let freezeFrames = 0;
let powerUpBannerTimer = 0;
let powerUpBannerText = "";
let powerUpBannerColor = "#ffffff";
let speedLines = [];
let screenTint = null;
let lastLifeWarningPulse = 0;

const STAGE_COLORS = ['#00ffcc', '#bc13fe', '#ff3366'];
let HIT_RANGE = 140; 
const KILL_RANGE = 35; 
const BOSS_THRESHOLD = 30; // Boss every 30 kills!
const getBasePlayerY = () => CANVAS_H / 2 + 50;

const brawlerAudio = {
    ctx: null,
    heartbeatInterval: null,
    
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    isMuted() {
        if (window.audioFX) return window.audioFX.isMuted;
        return false;
    },
    
    playPunch(isHeavy = false) {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        
        const startFreq = isHeavy ? 100 : 180;
        const endFreq = isHeavy ? 40 : 60;
        const duration = isHeavy ? 0.15 : 0.08;
        
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    },
    
    playWhiff() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    },
    
    playComboIncrement(comboCount) {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const baseFreq = 261.63; // C4
        const multiplier = 1 + (comboCount % 12) * 0.0833;
        const freq = baseFreq * multiplier;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
    },
    
    playComboBreak() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
    },
    
    playEnemyDeath() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
    },
    
    playBossRoar() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.linearRampToValueAtTime(30, now + 0.8);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(62, now);
        osc2.frequency.linearRampToValueAtTime(31, now + 0.8);
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
    },
    
    playBossHit() {
        this.playPunch(true);
    },
    
    playPowerUpCollect() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
        });
    },
    
    playPlayerDamaged() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
    },
    
    startHeartbeat() {
        this.init();
        if (this.heartbeatInterval) return;
        this.heartbeatInterval = setInterval(() => {
            if (!gameRunning || isPaused || player.lives !== 1 || this.isMuted()) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(60, now);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.1);
            
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(60, now + 0.15);
            gain2.gain.setValueAtTime(0.3, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.25);
        }, 1000);
    },
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },
    
    playLevelClear() {
        this.init();
        if (!this.ctx || this.isMuted()) return;
        
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.2, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.27);
        });
    }
};

function initGame() {
    score = 0;
    displayedScore = 0;
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
    crescentWaves = [];
    laserBeams = [];
    berserkRings = [];
    flashAlpha = 0;
    milestoneText = "";
    milestoneTimer = 0;
    kills = 0;
    warningText = 'WARNING: BOSS INCOMING';
    comboStreak = 0;
    berserkTimer = 0;
    HIT_RANGE = 140;
    activeWeapon = null;
    weaponCharges = 0;
    weaponDropActive = false;
    consecutiveAttacks = 0;
    lastAttackDirection = null;
    lastAttackTime = 0;
    
    // Reset Overhaul State variables
    currentWave = 1;
    enemiesSpawnedInWave = 0;
    enemiesKilledInWave = 0;
    waveEnemiesToKill = 8;
    waveBannerTimer = 120; // Show Wave 1 banner at start!
    waveBannerText = "WAVE 1";
    bulletTimeTimer = 0;
    cameraScale = 1.0;
    comboScale = 1.0;
    comboBreakTimer = 0;
    vignetteIntensity = 0;
    heartParticles = [];
    multiKillTimer = 0;
    multiKillCount = 0;
    lightningStrikeTimer = 0;
    lightningStrikes = [];
    freezeFrames = 0;
    powerUpBannerTimer = 0;
    powerUpBannerText = "";
    speedLines = [];
    screenTint = null;
    lastLifeWarningPulse = 0;
    
    player = {
        x: CANVAS_W / 2,
        y: getBasePlayerY(),
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
    brawlerAudio.stopHeartbeat(); // Stop heartbeat if it was running

    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    brawlerAudio.init(); // Initialize brawlerAudio context
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
    const totalHearts = Math.max(3, player.lives);
    for (let i = 0; i < totalHearts; i++) {
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

function spawnWeaponDrop() {
    weaponDropActive = true;
    weaponDropX = CANVAS_W / 2; // Spawn directly above the player
    weaponDropY = 0;
    weaponDropType = weaponDropType === 'katana' ? 'laserstaff' : 'katana';
    weaponDropTimer = 0;
}

function defeatEnemy(e, direction, isKatana = false) {
    if (e.dead) return;
    
    e.dead = true;
    e.vx = direction === 'left' ? -18 : 18;
    e.vy = -12;
    e.rotation = 0;
    e.rotationSpeed = direction === 'left' ? -0.25 : 0.25;
    
    comboStreak++;
    brawlerAudio.playComboIncrement(comboStreak); // Combo synth note!
    comboScale = 1.8; // Grow combo text scale
    
    if (comboStreak === 15 && berserkTimer <= 0) {
        berserkTimer = BERSERK_DURATION;
        HIT_RANGE = 280; // Double range
        flashAlpha = 0.6;
        flashColor = '#ff00ea'; // Fuchsia
        floatingTexts.push(new FloatingText(player.x, player.y - 50, "BERSERK ACTIVE!", '#ff00ea'));
        brawlerAudio.playPowerUpCollect(); // play fuchsia power up sound
    }
    
    kills++;
    enemiesKilledInWave++;
    
    // Multi-kill every 10 kills
    if (kills % 10 === 0 && kills > 0) {
        floatingTexts.push(new FloatingText(e.x, e.y - 60, "MULTI-KILL!", '#ff3366'));
        spawnDeathParticles(e.x, e.y - 20, '#ffffff');
        spawnDeathParticles(e.x, e.y - 20, STAGE_COLORS[currentStage]);
    }
    
    if (kills > 0 && kills % 30 === 0 && !bossActive) {
        if (Math.random() > 0.5) {
            triggerDragonBoss();
        } else {
            triggerBoss();
        }
    }
    
    // Check weapon drops trigger (every 20 kills)
    if (kills > 0 && kills % 20 === 0) {
        spawnWeaponDrop();
    }
    
    // Check extra life trigger (every 40 kills)
    if (kills > 0 && kills % 40 === 0) {
        player.lives++;
        updateLivesUI();
        floatingTexts.push(new FloatingText(player.x, player.y - 65, "EXTRA LIFE +1", '#ff0055'));
        brawlerAudio.playPowerUpCollect();
    }
    
    // Score based on multipliers
    let comboMult = 1;
    if (comboStreak >= 20) comboMult = 5;
    else if (comboStreak >= 10) comboMult = 3;
    else if (comboStreak >= 5) comboMult = 2;
    else if (comboStreak >= 3) comboMult = 1.5;
    
    const waveMult = 1 + Math.floor((currentWave - 1) / 5);
    const basePoints = (berserkTimer > 0) ? 2 : 1;
    const pointsGained = Math.floor(basePoints * comboMult * waveMult);
    score += pointsGained;
    
    // Floating point indicator
    floatingTexts.push(new FloatingText(e.x, e.y - 35, "+" + (pointsGained * 100), STAGE_COLORS[currentStage]));
    
    // Milestone check
    if ([500, 1000, 2000].includes(score)) {
        score += 100;
        milestoneText = "MILESTONE! +100 BONUS";
        milestoneTimer = 180;
        brawlerAudio.playPowerUpCollect();
    } else if ([10, 25, 50, 75, 100].includes(score)) {
        if (score === 10) milestoneText = "10 STREAK: WARM UP!";
        else if (score === 25) milestoneText = "25 STREAK: UNSTOPPABLE!";
        else if (score === 50) milestoneText = "50 STREAK: DOMINATING!";
        else if (score === 75) milestoneText = "75 STREAK: SKY BRAWLER!";
        else if (score === 100) milestoneText = "100 STREAK: ASCENDED GOD!";
        milestoneTimer = 120;
        brawlerAudio.playPowerUpCollect();
    }
    
    // Handle Katana Cut Splitting
    const enemyColor = e.color || STAGE_COLORS[currentStage];
    if (isKatana) {
        enemies.splice(enemies.indexOf(e), 1); // remove from active
        
        // Spawn dead upper half
        enemies.push({
            x: e.x,
            y: e.y,
            vx: direction === 'left' ? -20 : 20,
            vy: -15,
            rotation: 0,
            rotationSpeed: direction === 'left' ? -0.35 : 0.35,
            dead: true,
            type: 'deadUpper',
            side: e.side,
            color: enemyColor,
            life: 1.0,
            decay: 0.04
        });
        
        // Spawn dead lower half
        enemies.push({
            x: e.x,
            y: e.y,
            vx: direction === 'left' ? -14 : 14,
            vy: -8,
            rotation: 0,
            rotationSpeed: direction === 'left' ? -0.15 : 0.15,
            dead: true,
            type: 'deadLower',
            side: e.side,
            color: enemyColor,
            life: 1.0,
            decay: 0.04
        });
        
        // Neon Red Blood Spray
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: e.x,
                y: e.y - 15,
                vx: (direction === 'left' ? -1 : 1) * (6 + Math.random() * 12) + (Math.random() - 0.5) * 5,
                vy: -4 - Math.random() * 10,
                life: 0.8 + Math.random() * 0.4,
                decay: 0.04,
                color: '#ff003c', // glowing blood red!
                isBlood: true
            });
        }
        
        impactRings.push(new ImpactRing(e.x, e.y, '#ff003c'));
        brawlerAudio.playEnemyDeath();
    } else {
        // Standard death particles and impact rings
        spawnDeathParticles(e.x, e.y, enemyColor);
        impactRings.push(new ImpactRing(e.x, e.y, enemyColor));
        brawlerAudio.playEnemyDeath();
    }
    
    // Wave complete transition
    if (enemiesKilledInWave >= waveEnemiesToKill && !bossActive) {
        brawlerAudio.playLevelClear();
        currentWave++;
        enemiesSpawnedInWave = 0;
        enemiesKilledInWave = 0;
        
        if (currentWave === 5 || currentWave === 10 || currentWave === 15) {
            waveEnemiesToKill = 12; // Danger waves
            waveBannerText = "DANGER WAVE " + currentWave;
        } else if (currentWave === 6 || currentWave === 11 || currentWave === 16) {
            waveEnemiesToKill = 2; // Breathing room
            waveBannerText = "BREATHING ROOM";
        } else {
            waveEnemiesToKill = 8 + currentWave * 2;
            waveBannerText = "WAVE " + currentWave;
        }
        waveBannerTimer = 120;
        floatingTexts.push(new FloatingText(player.x, player.y - 60, waveBannerText + " START!", '#00ffcc'));
    }
    
    // Evolution / Stage Logic
    if (score > 0 && score % 50 === 0) {
        currentStage = Math.min(2, Math.floor(score / 50));
        comboGlow = 30;
        if (navigator.vibrate) navigator.vibrate(100);
    }
}

function attack(direction) {
    if (!gameRunning || isPaused || player.state === 'dead') return;
    
    player.state = direction === 'left' ? 'attackLeft' : 'attackRight';
    player.timer = 8; 

    // Adjust attack range depending on weapon & Berserk
    let currentHitRange = HIT_RANGE;
    if (berserkTimer > 0) {
        currentHitRange = 280;
    } else if (activeWeapon === 'katana') {
        currentHitRange = 210; // +50% range
    }

    // Spawn attack slash arc
    const arcX = player.x + (direction === 'left' ? -25 : 25);
    const arcY = player.y - 20;
    slashArcs.push(new SlashArc(arcX, arcY, activeWeapon === 'katana' ? '#ff3300' : (activeWeapon === 'laserstaff' ? '#bc13fe' : STAGE_COLORS[currentStage]), direction));
    
    // Check for Combo Finisher Wave trigger (Idea 3)
    let isFinisher = false;
    if (direction === lastAttackDirection && Date.now() - lastAttackTime < 450) {
        consecutiveAttacks++;
        if (consecutiveAttacks === 3) {
            isFinisher = true;
            consecutiveAttacks = 0;
        }
    } else {
        consecutiveAttacks = 1;
        lastAttackDirection = direction;
    }
    lastAttackTime = Date.now();

    if (isFinisher) {
        crescentWaves.push(new CrescentWave(player.x, player.y - 20, '#ffffff', direction));
        floatingTexts.push(new FloatingText(player.x, player.y - 40, "FINISHER!", '#ffffff'));
        screenShake = 12;
    }

    // If Laser Staff is active, shoot staff wave (Idea 2)
    if (activeWeapon === 'laserstaff') {
        laserBeams.push(new LaserBeam(player.x, player.y - 20, '#bc13fe', direction));
        weaponCharges--;
        if (weaponCharges <= 0) {
            activeWeapon = null;
            powerUpBannerText = "POWER UP EXPIRED";
            powerUpBannerTimer = 120;
            screenTint = { color: '#bc13fe', alpha: 0.1 };
        }
    }

    // If Berserk is active, release expanding shockwave ring (Idea 1)
    if (berserkTimer > 0) {
        berserkRings.push(new BerserkRing(player.x, player.y));
    }

    // Boss projectile reflection check
    if (bossActive && boss) {
        boss.projectiles.forEach(p => {
            if (!p.reflected && ((direction === 'left' && p.x < player.x) || (direction === 'right' && p.x > player.x))) {
                let dist = Math.abs(p.x - player.x);
                if (dist < currentHitRange) {
                    p.reflected = true;
                    // Calculate vector to boss
                    const dx = boss.x - p.x;
                    const dy = boss.y - p.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const speed = 15; // Reflected speed
                    p.vx = (dx / len) * speed;
                    p.vy = (dy / len) * speed;
                    
                    screenShake = 5;
                    impactRings.push(new ImpactRing(p.x, p.y, '#00ffff'));
                    brawlerAudio.playPunch(true);
                }
            }
        });
    }

    // Deal direct damage to brawler boss
    if (bossActive && boss && warningTimer <= 0) {
        let dist = Math.abs(boss.x - player.x);
        let side = boss.x < player.x ? 'left' : 'right';
        if (side === direction && dist < currentHitRange) {
            // Check for perfect strike timing!
            const isPerfect = dist >= 105 && dist <= 140;
            let damageDealt = isPerfect ? 0.4 : 0.2;
            if (activeWeapon === 'katana') {
                damageDealt = isPerfect ? 3.0 : 1.5; // Katana deals more damage
            }
            boss.health -= damageDealt;
            
            // Hit juice for boss
            boss.flashTimer = 5; // Flash white
            spawnHitSparks(boss.x, boss.y - 40, boss.color);
            freezeFrames = 3; // AAA hit freeze
            screenShake = isPerfect ? 15 : 10; // Shake
            brawlerAudio.playBossHit();
            
            impactRings.push(new ImpactRing(boss.x, boss.y - 40, '#ff3300'));
            
            if (boss.health <= 0) {
                boss.die();
            } else {
                floatingTexts.push(new FloatingText(boss.x, boss.y - 60, activeWeapon === 'katana' ? (isPerfect ? "CRITICAL SLASH!" : "SLASH!") : (isPerfect ? "CRITICAL HIT!" : "HIT!"), '#ffff00'));
            }
            return;
        }
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
    
    if (closestEnemy && closestDist < currentHitRange) {
        // Block check: Katana ignores block/shield
        if (closestEnemy.type === 'elite' && closestEnemy.hp > 1 && activeWeapon !== 'katana') {
            // Shield blocks normal attacks
            spawnParticles(closestEnemy.x, closestEnemy.y, '#ffffff');
            floatingTexts.push(new FloatingText(closestEnemy.x, closestEnemy.y - 30, "BLOCK", '#ffffff'));
            brawlerAudio.playWhiff(); // play block / whiff sound
            screenShake = 4;
            return;
        }

        // Check for perfect strike timing!
        const isPerfect = closestDist >= 105 && closestDist <= 140;
        let damageDealt = isPerfect ? 2 : 1;
        
        if (activeWeapon === 'katana') {
            damageDealt = isPerfect ? 4 : 2; // Katana deals double damage
        }
        
        closestEnemy.hp -= damageDealt;
        
        // Hit juice for enemy
        closestEnemy.flashTimer = 5; // flash white for 80ms
        spawnHitSparks(closestEnemy.x, closestEnemy.y - 20, STAGE_COLORS[currentStage]);
        freezeFrames = 3; // AAA hit stop
        screenShake = isPerfect ? 8 : 4; // screen micro-shake
        brawlerAudio.playPunch(isPerfect); // punch sound
        
        if (closestEnemy.hp <= 0) {
            defeatEnemy(closestEnemy, direction, activeWeapon === 'katana');
            
            if (activeWeapon === 'katana') {
                weaponCharges--;
                if (weaponCharges <= 0) {
                    activeWeapon = null;
                    powerUpBannerText = "POWER UP EXPIRED";
                    powerUpBannerTimer = 120;
                    screenTint = { color: '#ff3300', alpha: 0.1 };
                }
            }
        } else {
            // Hit feedback
            floatingTexts.push(new FloatingText(closestEnemy.x, closestEnemy.y - 30, isPerfect ? "CRITICAL!" : "HIT", '#ffff00'));
            
            // Push back slightly (knockback with smooth slide)
            closestEnemy.knockbackX = direction === 'left' ? -20 : 20;
        }
    } else {
        brawlerAudio.playWhiff(); // Whiff whoosh sound
    }
}

function takeDamage() {
    if (player.invulnerable || !gameRunning || player.state === 'dead') return;
    
    player.lives--;
    updateLivesUI();
    player.invulnerable = true;
    player.invulnTimer = 90; // 1.5s invulerability
    screenShake = 22; // rapid camera rumble
    
    flashAlpha = 0.85;
    flashColor = 'rgba(255, 0, 0, 0.45)'; // red screen flash
    vignetteIntensity = 0.9; // screen edge vignette pulse
    
    brawlerAudio.playPlayerDamaged(); // distorted impact audio
    
    if (comboStreak >= 3) {
        // Combo break!
        brawlerAudio.playComboBreak();
        comboBreakTimer = 90; // Show COMBO BREAKER! text for 1.5s
        comboBreakX = player.x;
        comboBreakY = player.y - 60;
        
        // Explode combo text particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: player.x,
                y: player.y - 60,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14,
                life: 1.0,
                decay: 0.05,
                color: '#ffcc00'
            });
        }
    }
    comboStreak = 0;
    
    // Heart break shard particles at player torso
    for (let i = 0; i < 15; i++) {
        heartParticles.push({
            x: player.x,
            y: player.y - 20,
            vx: (Math.random() - 0.5) * 10,
            vy: -4 - Math.random() * 6,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.02,
            color: '#ff3366',
            size: 4 + Math.random() * 6
        });
    }
    
    if (player.lives === 1) {
        brawlerAudio.startHeartbeat(); // Subtle heartbeat pulse
    }
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    spawnParticles(player.x, player.y - 20, '#ff0000');
    
    if (player.lives <= 0) {
        brawlerAudio.stopHeartbeat();
        gameOver();
    }
}

// cyberSweep removed


function triggerBoss() {
    bossActive = true;
    warningTimer = 180; // 3 seconds
    warningText = 'WARNING: BOSS INCOMING';
    bulletTimeTimer = 90; // 1.5s bullet time
    screenShake = 15;
    
    const bossNames = ["SHADOW TITAN", "BLOOD REAPER", "DARK OVERLORD"];
    lastBossName = bossNames[Math.floor(Math.random() * bossNames.length)];
    
    boss = new Wyrm();
    brawlerAudio.playBossRoar();
}

function triggerDragonBoss() {
    bossActive = true;
    warningTimer = 180; // 3 seconds
    warningText = 'WARNING: BOSS INCOMING';
    bulletTimeTimer = 90; // 1.5s bullet time
    screenShake = 15;
    
    const bossNames = ["SHADOW TITAN", "BLOOD REAPER", "DARK OVERLORD"];
    lastBossName = bossNames[Math.floor(Math.random() * bossNames.length)];
    
    boss = new Dragon();
    brawlerAudio.playBossRoar();
}

class Wyrm {
    constructor() {
        this.x = -200;
        this.y = player.y - 120;
        this.health = 30;
        this.maxHealth = 30;
        this.projectiles = [];
        this.lastShot = 0;
        this.sinOffset = 0;
        this.active = false;
        this.color = '#ff00ff';
        this.flashTimer = 0;
        this.segments = [];
        for(let i=0; i<10; i++) this.segments.push({x: -200, y: this.y});
    }

    update(deltaTime) {
        if (warningTimer > 0) {
            // Smoothly slide in from left towards the center of screen
            this.x += 4.5 * deltaTime;
            this.y = player.y - 120;
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
            for(let i=this.segments.length-1; i>0; i--) {
                this.segments[i].x += (this.segments[i-1].x - this.segments[i].x) * 0.2 * deltaTime;
                this.segments[i].y += (this.segments[i-1].y - this.segments[i].y) * 0.2 * deltaTime;
            }
            return;
        }
        this.active = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
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
            p.y += (p.vy || 0) * deltaTime;
            
            // Reflected hit boss
            if (p.reflected) {
                let dx = p.x - this.x;
                let dy = p.y - this.y;
                if (Math.sqrt(dx*dx + dy*dy) < 60) {
                    this.health -= 5;
                    this.projectiles.splice(i, 1);
                    screenShake = 15;
                    if (this.health <= 0) this.die();
                    continue;
                }
            }

            // Hit player
            const closestY = Math.max(player.y - 50, Math.min(player.y + 15, p.y));
            const distY = Math.abs(p.y - closestY);
            const distX = Math.abs(p.x - player.x);
            if (!p.reflected && distX < 30 && distY < 20) {
                takeDamage();
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.x < -100 || p.x > CANVAS_W + 100) this.projectiles.splice(i, 1);
        }
    }

    fire() {
        const targetX = player.x;
        const targetY = player.y - 20;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 8;
        const vx = dist > 0 ? (dx / dist) * speed : -speed;
        const vy = dist > 0 ? (dy / dist) * speed : 0;

        this.projectiles.push({
            x: this.x,
            y: this.y,
            vx: vx,
            vy: vy,
            reflected: false,
            color: '#00ffff'
        });
    }

    die() {
        bossActive = false;
        score += 500;
        
        flashAlpha = 1.0;
        flashColor = '#ffffff';
        screenShake = 25;
        
        for (let i = 0; i < 55; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                color: this.color,
                bounces: 2,
                isDeathParticle: true
            });
        }
        
        floatingTexts.push(new FloatingText(this.x, this.y - 80, "BOSS DEFEATED! +50000", '#ffd700'));
        brawlerAudio.playLevelClear();
        
        boss = null;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.flashTimer > 0 ? '#ffffff' : this.color;
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

class Dragon {
    constructor() {
        this.x = CANVAS_W + 150;
        this.y = getBasePlayerY();
        this.vx = -3.5;
        this.vy = 0;
        this.isJumping = false;
        this.health = 60;
        this.maxHealth = 60;
        this.projectiles = [];
        this.lastShot = 0;
        this.active = false;
        this.color = '#ff3300'; // Neon orange/red
        this.jumpCooldown = 0;
        this.flashTimer = 0;
    }

    update(deltaTime) {
        if (warningTimer > 0) {
            // Smoothly slide in from right towards the screen
            this.x += this.vx * deltaTime;
            this.y = getBasePlayerY();
            return;
        }
        this.active = true;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;

        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }

        // Move horizontally
        this.x += this.vx * deltaTime;
        
        // Apply gravity if jumping
        if (this.isJumping) {
            this.vy += 0.5 * deltaTime; // gravity
            this.y += this.vy * deltaTime;
            
            const groundY = getBasePlayerY();
            if (this.y >= groundY) {
                this.y = groundY;
                this.vy = 0;
                this.isJumping = false;
                // Switch direction of movement
                this.vx = this.x < player.x ? 3.0 : -3.0;
            }
        } else {
            // Stand on ground
            this.y = getBasePlayerY();
            
            // Constantly face and walk towards player on ground
            this.vx = this.x < player.x ? 3.0 : -3.0;
            
            // Check if close to player to trigger jump over player (with cooldown)
            const distToPlayer = Math.abs(this.x - player.x);
            if (distToPlayer < 160 && !this.isJumping && this.jumpCooldown <= 0) {
                this.isJumping = true;
                this.vy = -14; // High jump force
                // Keep moving in current direction to cross over player
                this.vx = this.x < player.x ? 6 : -6; 
                this.jumpCooldown = 180; // 3 seconds cooldown
            }
        }

        // Keep inside canvas bounds (turn around if goes too far off-screen)
        if (this.x < -100) {
            this.x = -100;
            this.vx = 3.5;
        } else if (this.x > CANVAS_W + 100) {
            this.x = CANVAS_W + 100;
            this.vx = -3.5;
        }

        // Deal contact damage to player
        if (Math.abs(this.x - player.x) < 50 && Math.abs(this.y - player.y) < 60) {
            takeDamage();
        }

        // Shoot fireballs (neon energy fists) towards player
        if (Date.now() - this.lastShot > 2000 && !this.isJumping) {
            this.lastShot = Date.now();
            this.fire();
        }

        // Drop weapons occasionally during boss fight (every 6 seconds / 360 frames)
        if (frameCount % 360 === 0) {
            spawnWeaponDrop();
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Trail particles
            if (Math.random() < 0.25) {
                particles.push({
                    x: p.x,
                    y: p.y + (Math.random() - 0.5) * 8,
                    vx: -p.vx * 0.1 + (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 0.5,
                    color: p.color
                });
            }

            // Reflected hit check on Boss
            if (p.reflected) {
                let dx = p.x - this.x;
                let dy = p.y - (this.y - 40); // Target torso/head of giant
                if (Math.sqrt(dx * dx + dy * dy) < 70) {
                    this.health -= 10;
                    this.projectiles.splice(i, 1);
                    screenShake = 15;
                    flashAlpha = 0.3;
                    flashColor = '#ff3300';
                    if (this.health <= 0) this.die();
                    continue;
                }
            }

            // Hit player check
            const closestY = Math.max(player.y - 50, Math.min(player.y + 15, p.y));
            const distY = Math.abs(p.y - closestY);
            const distX = Math.abs(p.x - player.x);
            if (!p.reflected && distX < 30 && distY < 20) {
                takeDamage();
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.x < -100 || p.x > CANVAS_W + 100) this.projectiles.splice(i, 1);
        }
    }

    fire() {
        let side = this.x < player.x ? 1 : -1;
        this.projectiles.push({
            x: this.x + side * 40,
            y: this.y - 50, // Fist height
            vx: side * 9,
            vy: 0,
            reflected: false,
            color: '#ff6600' // Fire orange!
        });
    }

    die() {
        bossActive = false;
        score += 800;
        
        flashAlpha = 1.0;
        flashColor = '#ffffff';
        screenShake = 28;
        
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: this.x,
                y: this.y - 30,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.5) * 18,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.025,
                color: this.color,
                bounces: 2,
                isDeathParticle: true
            });
        }
        
        impactRings.push(new ImpactRing(this.x, this.y - 30, '#ff3300'));
        impactRings.push(new ImpactRing(this.x, this.y - 30, '#ffcc00'));
        
        floatingTexts.push(new FloatingText(this.x, this.y - 80, "BOSS DEFEATED! +80000", '#ffd700'));
        brawlerAudio.playLevelClear();
        
        boss = null;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.flashTimer > 0 ? '#ffffff' : this.color;
        ctx.lineWidth = 12; // Extra thick lines for the GIANT!
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let bx = this.x;
        let by = this.y;

        // Render stick figure but scaled up
        ctx.beginPath();
        ctx.arc(bx, by - 100, 22, 0, Math.PI * 2); // Head (y-100)
        ctx.moveTo(bx, by - 78); ctx.lineTo(bx, by - 25); // Spine
        ctx.moveTo(bx, by - 25); ctx.lineTo(bx - 35, by + 15); // L Leg
        ctx.moveTo(bx, by - 25); ctx.lineTo(bx + 35, by + 15); // R Leg

        // Arms based on movement/jump state
        if (this.isJumping) {
            ctx.moveTo(bx, by - 60); ctx.lineTo(bx - 45, by - 90); // Raised arm L
            ctx.moveTo(bx, by - 60); ctx.lineTo(bx + 45, by - 90); // Raised arm R
        } else {
            let time = performance.now() / 100;
            let stride = Math.sin(time + this.x) * 20;
            ctx.moveTo(bx, by - 60); ctx.lineTo(bx - stride - 20, by - 40); // Arm L
            ctx.moveTo(bx, by - 60); ctx.lineTo(bx + stride + 20, by - 40); // Arm R
        }
        ctx.stroke();

        // Projectiles
        this.projectiles.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Premium Boss Health Bar
        const bw = 360;
        const bh = 14;
        const bxBar = (CANVAS_W - bw) / 2;
        const byBar = 55;

        // Draw boss name label
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText("GIANT BRAWLER", CANVAS_W / 2, byBar - 10);

        // Draw background
        ctx.fillStyle = 'rgba(255, 51, 0, 0.1)';
        ctx.fillRect(bxBar, byBar, bw, bh);

        // Draw neon border
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 2;
        ctx.strokeRect(bxBar, byBar, bw, bh);

        // Draw active health fill
        if (this.health > 0) {
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(bxBar, byBar, bw * (this.health / this.maxHealth), bh);
        }

        ctx.restore();
    }
}

class CrescentWave {
    constructor(x, y, color, direction) {
        this.x = x;
        this.y = y;
        this.vx = direction === 'left' ? -12 : 12;
        this.color = color;
        this.direction = direction;
        this.life = 1.0;
        this.width = 15;
        this.height = 70;
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.life -= 0.03 * deltaTime;
        
        // Collision check with enemies
        for (let e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - this.x) < 40) {
                e.hp -= 2;
                e.vx = this.vx * 1.5; // High knockback
                if (e.hp <= 0) {
                    defeatEnemy(e, this.direction);
                } else {
                    spawnParticles(e.x, e.y, this.color);
                }
            }
        }

        // Collision check with boss
        if (bossActive && boss) {
            let dx = this.x - boss.x;
            let dy = this.y - (boss.y - 45);
            if (Math.sqrt(dx * dx + dy * dy) < 65) {
                boss.health -= 1.5; // Deals 1.5 damage
                screenShake = 10;
                spawnParticles(boss.x, boss.y - 45, this.color);
                impactRings.push(new ImpactRing(boss.x, boss.y - 45, this.color));
                this.life = 0; // dissipate
                if (boss.health <= 0) boss.die();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Draw crescent moon arc
        const startY = this.y - this.height/2;
        const endY = this.y + this.height/2;
        if (this.direction === 'left') {
            ctx.moveTo(this.x + this.width, startY);
            ctx.quadraticCurveTo(this.x - this.width, this.y, this.x + this.width, endY);
        } else {
            ctx.moveTo(this.x - this.width, startY);
            ctx.quadraticCurveTo(this.x + this.width, this.y, this.x - this.width, endY);
        }
        ctx.stroke();
        ctx.restore();
    }
}

class LaserBeam {
    constructor(x, y, color, direction) {
        this.x = x;
        this.y = y;
        this.vx = direction === 'left' ? -15 : 15;
        this.color = color;
        this.direction = direction;
        this.life = 1.0;
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.life -= 0.04 * deltaTime;
        
        // Collision check with enemies
        for (let e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - this.x) < 50) {
                e.hp -= 2;
                e.vx = this.vx * 1.2;
                if (e.hp <= 0) {
                    defeatEnemy(e, this.direction);
                } else {
                    spawnParticles(e.x, e.y, this.color);
                }
            }
        }

        // Collision check with boss
        if (bossActive && boss) {
            let dx = this.x - boss.x;
            let dy = this.y - (boss.y - 45);
            if (Math.sqrt(dx * dx + dy * dy) < 65) {
                boss.health -= 1.5; // Deals 1.5 damage
                screenShake = 8;
                spawnParticles(boss.x, boss.y - 45, this.color);
                impactRings.push(new ImpactRing(boss.x, boss.y - 45, this.color));
                this.life = 0; // dissipate
                if (boss.health <= 0) boss.die();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 40);
        ctx.lineTo(this.x, this.y + 20);
        ctx.stroke();
        ctx.restore();
    }
}

class BerserkRing {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.maxR = 300;
        this.color = '#ff00ea'; // Hot pink berserk color
        this.life = 1.0;
        this.hitBoss = false;
    }
    update(deltaTime) {
        this.r += 12 * deltaTime;
        this.life = 1.0 - (this.r / this.maxR);
        
        // Damage check
        for (let e of enemies) {
            if (e.dead) continue;
            let dist = Math.abs(e.x - this.x);
            if (dist < this.r && dist > this.r - 30) {
                e.hp -= 1;
                e.vx = (e.x < this.x ? -15 : 15);
                if (e.hp <= 0) {
                    defeatEnemy(e, e.x < this.x ? 'left' : 'right');
                } else {
                    spawnParticles(e.x, e.y, this.color);
                }
            }
        }

        // Damage check on boss
        if (bossActive && boss && !this.hitBoss) {
            let dist = Math.abs(boss.x - this.x);
            if (dist < this.r && dist > this.r - 40) {
                this.hitBoss = true;
                boss.health -= 1.0; // Deals 1.0 damage
                screenShake = 8;
                spawnParticles(boss.x, boss.y - 45, this.color);
                if (boss.health <= 0) boss.die();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 10, this.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
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
        
        // Calculate pulse based on combo level
        const pulseSpeed = (comboStreak >= 10) ? 0.012 : 0.004;
        const pulseAmp = (comboStreak >= 10) ? 0.15 : 0.05;
        const pulse = 1.0 + Math.sin(performance.now() * pulseSpeed + this.x) * pulseAmp;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity * pulse;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.2, this.size * 0.8 * pulse, 0, Math.PI * 2);
        ctx.arc(this.x - this.size * 0.6, this.y - this.size * 0.1, this.size * 0.7 * pulse, 0, Math.PI * 2);
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

function createEnemy(forceStageColor = false, speedScale = 1.0) {
    if (bossActive) return;
    let side = Math.random() > 0.5 ? 'left' : 'right';
    const eliteChance = Math.min(0.6, 0.1 + currentWave * 0.05);
    let type = (score > 30 || currentWave > 1) && Math.random() < eliteChance ? 'elite' : 'basic';
    
    const waveSpeedMultiplier = (1.0 + (currentWave - 1) * 0.12) * speedScale;
    const vx = (side === 'left' ? 3.5 : -3.5) * waveSpeedMultiplier;
    
    enemies.push({
        x: side === 'left' ? -30 : CANVAS_W + 30,
        y: player.y,
        vx: vx,
        vy: 0,
        knockbackX: 0,
        side: side,
        dead: false,
        hp: type === 'elite' ? 2 : 1,
        type: type,
        flashTimer: 0,
        color: forceStageColor ? '#ff3366' : STAGE_COLORS[currentStage]
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

function spawnDeathParticles(x, y, color) {
    const count = 15 + Math.floor(Math.random() * 6); // 15-20 particles
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: -4 - Math.random() * 6,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.02,
            color: color,
            bounces: 1, // bounces off the ground once
            isDeathParticle: true
        });
    }
}

function spawnHitSparks(x, y, color) {
    const count = 8 + Math.floor(Math.random() * 5); // 8-12 particles
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            life: 1.0,
            decay: 0.15 + Math.random() * 0.05, // fades out in ~200ms
            color: color,
            isSpark: true
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
    
    if (score * 100 > highScore) {
        highScore = score * 100;
        localStorage.setItem('brawlerHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    document.getElementById('overlayTitle').textContent = "Knockout!";
    document.getElementById('overlayMessage').innerHTML = `Final Streak: ${score * 100}<br>You were overwhelmed!`;
    document.getElementById('shareContainer').classList.remove('hidden');
    startBtn.textContent = "Fight Again";
    overlay.classList.remove('hidden');
}

function triggerLightningStrike() {
    const startX = Math.random() * CANVAS_W;
    const segments = [];
    let curX = startX;
    let curY = 0;
    const targetY = getBasePlayerY() + 20;
    
    while (curY < targetY) {
        const nextX = curX + (Math.random() - 0.5) * 45;
        const nextY = curY + 15 + Math.random() * 25;
        segments.push({
            x1: curX,
            y1: curY,
            x2: nextX,
            y2: Math.min(targetY, nextY)
        });
        curX = nextX;
        curY = nextY;
    }
    
    lightningStrikes.push({
        segments: segments,
        life: 15 // 15 frames duration
    });
    
    // Screen feedback
    screenShake = Math.max(screenShake, 8);
    flashAlpha = 0.35;
    flashColor = '#00ffff';
}

function update(deltaTime) {
    // Berserk timer update
    if (berserkTimer > 0) {
        berserkTimer -= deltaTime;
        if (berserkTimer <= 0) {
            HIT_RANGE = 140; // Revert attack range
        }
    }

    // Update weapon drop physics (float down to deck Y)
    if (weaponDropActive) {
        const deckY = getBasePlayerY() + 15;
        if (weaponDropY < deckY) {
            weaponDropY += 3.0 * deltaTime;
        } else {
            weaponDropY = deckY;
        }
        
        // Check pickup distance
        if (Math.abs(player.x - weaponDropX) < 45 && Math.abs(player.y - weaponDropY) < 50) {
            activeWeapon = weaponDropType;
            weaponCharges = 15;
            weaponDropActive = false;
            
            // Pickup feedback
            flashAlpha = 0.4;
            flashColor = weaponDropType === 'katana' ? '#ff3300' : '#bc13fe';
            floatingTexts.push(new FloatingText(player.x, player.y - 45, weaponDropType === 'katana' ? "NEON KATANA ACQUIRED!" : "LASER STAFF ACQUIRED!", flashColor));
            
            if (window.audioFX && typeof window.audioFX.playLevelUp === 'function') {
                window.audioFX.playLevelUp();
            }
        }
    }

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

    // Decay juice overhaul state timers
    if (waveBannerTimer > 0) {
        waveBannerTimer -= deltaTime;
    }
    if (bulletTimeTimer > 0) {
        bulletTimeTimer -= deltaTime;
        if (bulletTimeTimer < 0) bulletTimeTimer = 0;
    }
    if (warningTimer > 0) {
        warningTimer -= deltaTime;
        if (warningTimer < 0) warningTimer = 0;
    }
    if (powerUpBannerTimer > 0) {
        powerUpBannerTimer -= deltaTime;
    }
    if (comboBreakTimer > 0) {
        comboBreakTimer -= deltaTime;
    }
    if (multiKillTimer > 0) {
        multiKillTimer -= deltaTime;
    }
    if (vignetteIntensity > 0) {
        vignetteIntensity -= 0.015 * deltaTime;
        if (vignetteIntensity < 0) vignetteIntensity = 0;
    }
    if (comboScale > 1.0) {
        comboScale -= 0.04 * deltaTime;
        if (comboScale < 1.0) comboScale = 1.0;
    }
    if (screenTint && screenTint.alpha > 0) {
        screenTint.alpha -= 0.015 * deltaTime;
    }

    // Score HUD counting up tick
    if (displayedScore < score * 100) {
        const diff = (score * 100) - displayedScore;
        const increment = Math.ceil(diff * 0.15 * deltaTime);
        displayedScore += increment;
        if (displayedScore > score * 100) displayedScore = score * 100;
        scoreEl.textContent = displayedScore;
    }

    // Camera scale (zoom out 5% during boss fights)
    let targetCameraScale = bossActive ? 0.95 : 1.0;
    if (cameraScale !== targetCameraScale) {
        if (cameraScale < targetCameraScale) {
            cameraScale += 0.005 * deltaTime;
            if (cameraScale > targetCameraScale) cameraScale = targetCameraScale;
        } else {
            cameraScale -= 0.005 * deltaTime;
            if (cameraScale < targetCameraScale) cameraScale = targetCameraScale;
        }
    }

    // Lightning strike checks & updates
    if (lightningStrikeTimer > 0) {
        lightningStrikeTimer -= deltaTime;
    } else if (comboStreak >= 10 || bossActive) {
        if (Math.random() < 0.005 * deltaTime) {
            triggerLightningStrike();
            lightningStrikeTimer = 180;
        }
    }
    for (let i = lightningStrikes.length - 1; i >= 0; i--) {
        lightningStrikes[i].life -= deltaTime;
        if (lightningStrikes[i].life <= 0) {
            lightningStrikes.splice(i, 1);
        }
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

    // Update custom weapon waves
    crescentWaves.forEach(w => w.update(deltaTime));
    crescentWaves = crescentWaves.filter(w => w.life > 0);
    
    laserBeams.forEach(w => w.update(deltaTime));
    laserBeams = laserBeams.filter(w => w.life > 0);
    
    berserkRings.forEach(r => r.update(deltaTime));
    berserkRings = berserkRings.filter(r => r.life > 0);

    // Wave spawning engine when not fighting boss
    if (!bossActive) {
        const isDangerWave = (currentWave === 5 || currentWave === 10 || currentWave === 15);
        const isBreathingRoom = (currentWave === 6 || currentWave === 11 || currentWave === 16);
        
        if (isDangerWave && enemiesSpawnedInWave === 0) {
            // Spawn all at once
            for (let k = 0; k < waveEnemiesToKill; k++) {
                createEnemy();
                enemiesSpawnedInWave++;
            }
            screenShake = Math.max(screenShake, 15);
        } else if (enemiesSpawnedInWave < waveEnemiesToKill) {
            spawnTimer += deltaTime;
            const currentSpawnInterval = isBreathingRoom ? spawnInterval * 2 : spawnInterval;
            if (spawnTimer >= currentSpawnInterval) {
                createEnemy();
                enemiesSpawnedInWave++;
                spawnTimer = 0;
            }
        }
    } else if (boss) {
        boss.update(deltaTime);

        // Spawn small normal enemies during Dragon boss fight to make it more complex
        if (boss instanceof Dragon && warningTimer <= 0) {
            if (frameCount % 210 === 0) {
                let side = Math.random() > 0.5 ? 'left' : 'right';
                const vx = (side === 'left' ? 3.5 : -3.5) * (1.0 + (currentWave - 1) * 0.12);
                enemies.push({
                    x: side === 'left' ? -30 : CANVAS_W + 30,
                    y: player.y,
                    vx: vx,
                    vy: 0,
                    knockbackX: 0,
                    side: side,
                    dead: false,
                    hp: 1,
                    type: 'basic',
                    flashTimer: 0,
                    color: STAGE_COLORS[currentStage]
                });
            }
        }

        // Provide weapon (neon katana) when boss health falls below 30%
        if (boss.health / boss.maxHealth <= 0.3 && !boss.droppedSwordAt30) {
            boss.droppedSwordAt30 = true;
            spawnWeaponDrop();
            floatingTexts.push(new FloatingText(player.x, player.y - 70, "NEON KATANA DROPPED!", '#ff3300'));
        }
    }
    
    // Update enemies list
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        if (e.dead) {
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
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
            // Decaying knockback slide for non-dead enemies
            if (e.knockbackX) {
                e.x += e.knockbackX * deltaTime;
                e.knockbackX *= Math.pow(0.8, deltaTime);
                if (Math.abs(e.knockbackX) < 0.1) e.knockbackX = 0;
            }
            
            // Standard move
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            
            let dist = Math.abs(e.x - player.x);
            if (dist < KILL_RANGE) {
                takeDamage();
                if (e.hp > 0) { // Push back slightly
                    e.x += e.side === 'left' ? -50 * deltaTime : 50 * deltaTime; 
                }
            }
        }
    }
    
    // Update general particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime;
        if (p.isBlood) {
            p.vy += 0.4 * deltaTime; // blood falling gravity
        } else if (p.isDeathParticle || p.isSpark) {
            p.vy += 0.3 * deltaTime; // gravity for death/sparks
        }
        p.y += p.vy * deltaTime;
        
        // Ground bounce for death particles
        const groundY = getBasePlayerY() + 20;
        if (p.y >= groundY) {
            p.y = groundY;
            if (p.bounces > 0) {
                p.vy = -p.vy * 0.5;
                p.bounces--;
            } else {
                p.vy = 0;
                p.vx *= 0.8; // friction
            }
        }
        
        p.life -= (p.decay || 0.04) * deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update heart shards
    for (let i = heartParticles.length - 1; i >= 0; i--) {
        const hp = heartParticles[i];
        hp.x += hp.vx * deltaTime;
        hp.vy += 0.3 * deltaTime; // gravity
        hp.y += hp.vy * deltaTime;
        hp.life -= hp.decay * deltaTime;
        if (hp.life <= 0) {
            heartParticles.splice(i, 1);
        }
    }
}

function draw() {
    // Clear the full canvas context first (in untransformed space)
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Draw the background sky gradient in untransformed space so it always covers the full screen
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    let baseColor1 = '#04020a';
    let baseColor2 = '#0b061e';
    let baseColor3 = '#3a1146'; // twilight violet
    let baseColor4 = '#d44b68'; // sunset pink
    let baseColor5 = '#1c1c3c'; // horizon blue

    if (bossActive) {
        baseColor1 = '#020005';
        baseColor2 = '#04010a';
        baseColor3 = '#180424'; // deep purple-black
        baseColor4 = '#420a1c'; // blood crimson
        baseColor5 = '#090515';
    } else if (comboStreak >= 3) {
        const shift = Math.min(1.0, comboStreak / 20);
        baseColor3 = `hsl(${280 - shift * 120}, 65%, 18%)`; 
        baseColor4 = `hsl(${340 - shift * 60}, 75%, 45%)`;
    }
    
    skyGrad.addColorStop(0, baseColor1);
    skyGrad.addColorStop(0.3, baseColor2);
    skyGrad.addColorStop(0.65, baseColor3);
    skyGrad.addColorStop(0.85, baseColor4);
    skyGrad.addColorStop(1.0, baseColor5);
    
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Now apply camera transformations for the entities and environment
    ctx.save();
    
    if (screenShake > 1) {
        ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
    }
    
    if (cameraScale !== 1.0) {
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
        ctx.scale(cameraScale, cameraScale);
        ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
    }
    
    // Boss fight dark red fog rolling in from sides
    if (bossActive) {
        ctx.save();
        const gradLeft = ctx.createLinearGradient(0, 0, CANVAS_W * 0.35, 0);
        gradLeft.addColorStop(0, 'rgba(120, 10, 25, 0.35)');
        gradLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradLeft;
        ctx.fillRect(0, 0, CANVAS_W * 0.35, CANVAS_H);

        const gradRight = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W * 0.65, 0);
        gradRight.addColorStop(0, 'rgba(120, 10, 25, 0.35)');
        gradRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradRight;
        ctx.fillRect(CANVAS_W * 0.65, 0, CANVAS_W * 0.35, CANVAS_H);
        ctx.restore();
    }
    
    // 2. Draw stars
    stars.forEach(s => s.draw(ctx));
    
    // 2.5 Draw lightning energy crackles
    if (lightningStrikes.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2.5;
        
        lightningStrikes.forEach(l => {
            ctx.globalAlpha = Math.min(1.0, Math.max(0, l.life / 10));
            ctx.beginPath();
            l.segments.forEach(seg => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();
        });
        ctx.restore();
    }

    // 2.7 Draw Speed Lines at high combos
    if (comboStreak >= 10) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        for (let i = 0; i < 5; i++) {
            const y = 50 + (i * 40) + Math.sin(performance.now() / 50 + i) * 10;
            const x = (performance.now() * 2.5 + i * 200) % (CANVAS_W + 200) - 100;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 120, y);
            ctx.stroke();
        }
        ctx.restore();
    }
    
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
    
    // Rhythm ground glow
    ctx.save();
    const groundPulse = 5 + Math.sin(performance.now() / 200) * 4;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = groundPulse;
    ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 200) * 0.15;
    ctx.shadowBlur = groundPulse * 3;
    ctx.shadowColor = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, deckY);
    ctx.lineTo(CANVAS_W, deckY);
    ctx.stroke();
    ctx.restore();
    
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

    // Draw custom weapon waves/rings
    crescentWaves.forEach(w => w.draw(ctx));
    laserBeams.forEach(w => w.draw(ctx));
    berserkRings.forEach(r => r.draw(ctx));

    // Draw falling/resting weapon drop chests
    if (weaponDropActive) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = weaponDropType === 'katana' ? '#ff3300' : '#bc13fe';
        ctx.fillStyle = weaponDropType === 'katana' ? '#ff3300' : '#bc13fe';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Draw a diamond shape at weaponDropX, weaponDropY
        ctx.beginPath();
        ctx.moveTo(weaponDropX, weaponDropY - 12);
        ctx.lineTo(weaponDropX + 10, weaponDropY);
        ctx.lineTo(weaponDropX, weaponDropY + 12);
        ctx.lineTo(weaponDropX - 10, weaponDropY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw float text/glow label above
        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.fillText(weaponDropType === 'katana' ? 'KATANA' : 'STAFF', weaponDropX, weaponDropY - 20);
        ctx.restore();
    }

    // Range Indicator (glowing floor segment under player)
    ctx.fillStyle = currentStage > 0 ? `rgba(${currentStage === 1 ? '188, 19, 254' : '255, 51, 102'}, 0.05)` : 'rgba(0, 255, 204, 0.03)';
    ctx.fillRect(player.x - HIT_RANGE, player.y - 40, HIT_RANGE*2, 60);

    // Warning
    if (warningTimer > 0) {
        ctx.font = '700 40px Outfit, sans-serif';
        ctx.fillStyle = warningTimer % 20 < 10 ? '#ff0000' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(warningText, CANVAS_W/2, CANVAS_H/2);
    }

    // Draw impact rings
    impactRings.forEach(ir => ir.draw(ctx));

    const pColor = player.state === 'dead' ? '#555' : STAGE_COLORS[currentStage];
    ctx.save();
    if (activeWeapon === 'katana' && player.state !== 'dead') {
        ctx.translate(player.x, player.y);
        ctx.scale(1.15, 1.15);
        ctx.translate(-player.x, -player.y);
    }
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
    
    const breathY = (player.state === 'idle') ? Math.sin(performance.now() / 250) * 2.2 : 0;
    
    ctx.beginPath();
    ctx.arc(px, py - 40 + breathY, 10, 0, Math.PI * 2); // Head (bobs)
    ctx.moveTo(px, py - 30 + breathY); ctx.lineTo(px, py - 10 + breathY * 0.5); // Spine (stretches)
    ctx.moveTo(px, py - 10 + breathY * 0.5); ctx.lineTo(px - 15, py + 15); // L Leg (grounded)
    ctx.moveTo(px, py - 10 + breathY * 0.5); ctx.lineTo(px + 15, py + 15); // R Leg (grounded)
    
    if (player.state === 'attackLeft') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 45, py - 20); // punch L
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 15, py - 5);  // off arm
    } else if (player.state === 'attackRight') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 45, py - 20); // punch R
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 15, py - 5);  // off arm
    } else {
        ctx.moveTo(px, py - 20 + breathY * 0.8); ctx.lineTo(px - 20, py - 10 + breathY * 0.4); // idle arm L
        ctx.moveTo(px, py - 20 + breathY * 0.8); ctx.lineTo(px + 20, py - 10 + breathY * 0.4); // idle arm R
    }
    ctx.stroke();
    ctx.restore();

    // Draw held weapon
    if (activeWeapon && player.state !== 'dead') {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        if (activeWeapon === 'katana') {
            ctx.strokeStyle = '#ff3300';
            ctx.shadowColor = '#ff3300';
            if (player.state === 'attackLeft') {
                // Katana slash left
                ctx.beginPath();
                ctx.moveTo(px - 38, py - 22);
                ctx.lineTo(px - 72, py - 34);
                ctx.stroke();
                // Hilt
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(px - 28, py - 15);
                ctx.lineTo(px - 38, py - 22);
                ctx.stroke();
            } else if (player.state === 'attackRight') {
                // Katana slash right
                ctx.beginPath();
                ctx.moveTo(px + 38, py - 22);
                ctx.lineTo(px + 72, py - 34);
                ctx.stroke();
                // Hilt
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(px + 28, py - 15);
                ctx.lineTo(px + 38, py - 22);
                ctx.stroke();
            } else {
                // Idle - Katana on back
                ctx.beginPath();
                ctx.moveTo(px - 8, py - 32);
                ctx.lineTo(px + 12, py - 12);
                ctx.stroke();
                // Hilt
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(px + 8, py - 16);
                ctx.lineTo(px + 12, py - 12);
                ctx.stroke();
            }
        } else if (activeWeapon === 'laserstaff') {
            ctx.strokeStyle = '#bc13fe';
            ctx.shadowColor = '#bc13fe';
            if (player.state === 'attackLeft') {
                // Laser staff left
                ctx.beginPath();
                ctx.moveTo(px - 45, py - 35);
                ctx.lineTo(px - 25, py - 5);
                ctx.stroke();
                // Glowing tips
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px - 45, py - 35, 2, 0, Math.PI * 2);
                ctx.arc(px - 25, py - 5, 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (player.state === 'attackRight') {
                // Laser staff right
                ctx.beginPath();
                ctx.moveTo(px + 45, py - 35);
                ctx.lineTo(px + 25, py - 5);
                ctx.stroke();
                // Glowing tips
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px + 45, py - 35, 2, 0, Math.PI * 2);
                ctx.arc(px + 25, py - 5, 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Idle staff on back
                ctx.beginPath();
                ctx.moveTo(px - 10, py - 35);
                ctx.lineTo(px + 10, py - 5);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

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
        let eColor;
        if (e.flashTimer > 0) {
            eColor = '#ffffff';
        } else if (e.type === 'deadUpper' || e.type === 'deadLower') {
            eColor = e.color || '#ff3366';
        } else {
            eColor = e.dead ? '#333' : (e.type === 'elite' ? '#ffcc00' : '#ff3366');
        }
        
        ctx.save();
        ctx.shadowBlur = e.dead ? 10 : 15;
        ctx.shadowColor = eColor;
        ctx.strokeStyle = eColor;
        ctx.lineWidth = e.type === 'elite' ? 6.5 : 5.0; // Make enemies thick & bold!
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Bobbing sway for walking enemies
        const swayY = (!e.dead) ? Math.sin(performance.now() / 150 + e.x * 0.05) * 3 : 0;
        ctx.translate(e.x, e.y - 10 + swayY);
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

        if (e.type === 'deadUpper') {
            // Render only head, upper spine, arms
            ctx.arc(0, -30, 9, 0, Math.PI * 2); // Head
            ctx.moveTo(0, -21); ctx.lineTo(0, -10); // Upper Spine
            ctx.moveTo(0, -10); ctx.lineTo(-20, -20); // Dead arm L
            ctx.moveTo(0, -10); ctx.lineTo(20, -20); // Dead arm R
        } else if (e.type === 'deadLower') {
            // Render only legs, lower spine
            ctx.moveTo(0, -10); ctx.lineTo(0, 0); // Lower Spine
            ctx.moveTo(0, 0); ctx.lineTo(-stride, 25); // Leg 1
            ctx.moveTo(0, 0); ctx.lineTo(stride, 25); // Leg 2
        } else {
            // Standard full stickman
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
        ctx.arc(p.x, p.y, p.isDust ? 6 : 4, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Draw heart particles (heartbreak shards)
    ctx.save();
    for (let hp of heartParticles) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = hp.color;
        ctx.fillStyle = hp.color;
        ctx.globalAlpha = hp.life;
        ctx.beginPath();
        ctx.fillRect(hp.x - hp.size/2, hp.y - hp.size/2, hp.size, hp.size);
    }
    ctx.restore();

    // Draw attack slash arcs
    slashArcs.forEach(sa => sa.draw(ctx));

    // Draw floating texts
    floatingTexts.forEach(ft => ft.draw(ctx));

    // Restore context to exit camera shake/zoom transformed space (HUD & overlays are untransformed)
    ctx.restore();

    // Combo break shattered text
    if (comboBreakTimer > 0) {
        ctx.save();
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 25;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const progress = (90 - comboBreakTimer) / 90;
        const scale = 1.0 + progress * 0.15;
        ctx.globalAlpha = comboBreakTimer > 20 ? 1.0 : comboBreakTimer / 20;
        ctx.translate(comboBreakX, comboBreakY);
        ctx.scale(scale, scale);
        ctx.fillText("COMBO BREAKER!", 0, 0);
        ctx.restore();
    }

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

    // Power-up Banner Title slam-in
    if (powerUpBannerTimer > 0) {
        ctx.save();
        ctx.font = 'bold 32px "Outfit", sans-serif';
        ctx.fillStyle = powerUpBannerColor;
        ctx.shadowColor = powerUpBannerColor;
        ctx.shadowBlur = 25;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const progress = (120 - powerUpBannerTimer) / 120;
        let scale = 1.0;
        if (progress < 0.25) {
            scale = 2.5 - (progress / 0.25) * 1.5;
        }
        ctx.globalAlpha = powerUpBannerTimer > 20 ? 1.0 : powerUpBannerTimer / 20;
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 80);
        ctx.scale(scale, scale);
        ctx.fillText(powerUpBannerText, 0, 0);
        ctx.restore();
    }

    // Wave Banner text slam-in and fade
    if (waveBannerTimer > 0) {
        ctx.save();
        ctx.font = 'bold 44px "Outfit", sans-serif';
        ctx.fillStyle = waveBannerText.includes('DANGER') ? '#ff3300' : '#00ffcc';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 30;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const progress = (120 - waveBannerTimer) / 120;
        let scale = 1.0;
        if (progress < 0.2) {
            scale = 3.0 - (progress / 0.2) * 2.0; // Slam in from large
        }
        ctx.globalAlpha = waveBannerTimer > 30 ? 1.0 : waveBannerTimer / 30;
        
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.scale(scale, scale);
        ctx.fillText(waveBannerText, 0, 0);
        ctx.restore();
    }

    // Combo Counter at Center-Screen
    if (comboStreak >= 3) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.translate(CANVAS_W / 2, 115);
        ctx.scale(comboScale, comboScale);
        
        let comboColor = '#ffffff';
        if (comboStreak >= 20) {
            comboColor = `hsl(${(performance.now() / 4) % 360}, 100%, 65%)`; // rainbow HSL flash
        } else if (comboStreak >= 15) {
            comboColor = '#ff3300';
        } else if (comboStreak >= 10) {
            comboColor = '#ff9900';
        } else if (comboStreak >= 5) {
            comboColor = '#ffff00';
        }
        
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.fillStyle = comboColor;
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 20;
        ctx.fillText(`${comboStreak} COMBO`, 0, 0);
        ctx.restore();
    }

    // Draw active weapon and Berserk HUD indicators
    ctx.save();
    let hudY = 70; // Position below HTML header
    
    // 0. Global Multiplier HUD (Idea 9)
    const waveMult = 1 + Math.floor((currentWave - 1) / 5);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ MULTIPLIER: x${waveMult}`, 25, hudY);
    hudY += 22;

    // 1. Berserk Indicator
    if (berserkTimer > 0) {
        const secondsLeft = (berserkTimer / 60).toFixed(1);
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ea';
        ctx.fillStyle = '#ff00ea';
        
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🔥 BERSERK: ${secondsLeft}s`, 25, hudY);
        
        // Progress bar
        ctx.fillStyle = 'rgba(255, 0, 234, 0.2)';
        ctx.fillRect(25, hudY + 6, 120, 5);
        ctx.fillStyle = '#ff00ea';
        ctx.fillRect(25, hudY + 6, 120 * (berserkTimer / BERSERK_DURATION), 5);
        
        hudY += 26;
    }
    
    // 2. Weapon Charges Indicator
    if (activeWeapon) {
        const isKatana = activeWeapon === 'katana';
        const weaponColor = isKatana ? '#ff3300' : '#bc13fe';
        const weaponName = isKatana ? 'NEON KATANA' : 'LASER STAFF';
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = weaponColor;
        ctx.fillStyle = weaponColor;
        
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚔️ ${weaponName}: ${weaponCharges} hits`, 25, hudY);
        
        // Progress bar for weapon charges (max 15 charges)
        ctx.fillStyle = isKatana ? 'rgba(255, 51, 0, 0.2)' : 'rgba(188, 19, 254, 0.2)';
        ctx.fillRect(25, hudY + 6, 120, 5);
        ctx.fillStyle = weaponColor;
        ctx.fillRect(25, hudY + 6, 120 * (weaponCharges / 15), 5);
    }
    ctx.restore();

    // Screen Tint for powerups
    if (screenTint && screenTint.alpha > 0.01) {
        ctx.save();
        ctx.fillStyle = screenTint.color;
        ctx.globalAlpha = screenTint.alpha;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
    }

    // Red Vignette Pulse (damage or low health)
    let finalVignetteAlpha = vignetteIntensity;
    if (player && player.lives === 1 && gameRunning && !isPaused) {
        finalVignetteAlpha = Math.max(vignetteIntensity, 0.2 + Math.abs(Math.sin(performance.now() / 400)) * 0.3);
    }
    if (finalVignetteAlpha > 0.01) {
        ctx.save();
        const vignette = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_H/3, CANVAS_W/2, CANVAS_H/2, CANVAS_W/1.8);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(255, 0, 51, ${Math.min(0.75, finalVignetteAlpha)})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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
}

let frameCount = 0;
function loop(timestamp = 0) {
    if (isPaused) return;
    if (gameRunning) {
        frameId = requestAnimationFrame(loop);
        if (!lastTime) lastTime = timestamp;
        let dt = timestamp - lastTime;
        lastTime = timestamp;
        
        let deltaTime = Math.min(dt / 16.67, 3);
        
        // Bullet time slowdown
        if (bulletTimeTimer > 0) {
            deltaTime *= 0.2;
        }
        
        // Hit freeze frame (AAA Hit Stop)
        if (freezeFrames > 0) {
            freezeFrames--;
            draw();
            return;
        }
        
        frameCount++;
        update(deltaTime);
        draw();
    } else if (player && player.state === 'dead') {
        draw();
    }
}

startBtn.addEventListener('click', initGame);

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    if (!gameRunning) {
        if(e.key === ' ' || e.key === 'Enter') initGame();
        return;
    }
    if (isPaused) return;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') attack('left');
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') attack('right');
});
leftZone.addEventListener('mousedown', () => attack('left'));
rightZone.addEventListener('mousedown', () => attack('right'));
leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('left'); }, {passive: false});
leftZone.addEventListener('touchend', (e) => { e.preventDefault(); }, {passive: false});
rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('right'); }, {passive: false});
rightZone.addEventListener('touchend', (e) => { e.preventDefault(); }, {passive: false});

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
    displayedScore = 0;
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
    const text = `I just reached a streak of ${score * 100} in Neon Brawler 🥊 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}
tweetBtn.addEventListener('click', () => shareScore('twitter'));
waBtn.addEventListener('click', () => shareScore('whatsapp'));

// Dismiss Force Landscape Prompt
const dismissBtn = document.getElementById('dismissLandscapeBtn');
const landscapePrompt = document.getElementById('landscapePrompt');
dismissBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    landscapePrompt?.classList.add('dismissed');
    window.dispatchEvent(new Event('resize'));
});

// Reset dismissed state if screen is rotated back to landscape
window.addEventListener('resize', () => {
    if (window.innerWidth > window.innerHeight) {
        landscapePrompt?.classList.remove('dismissed');
    }
});

// Idle screen initialization
player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle', lives: 3 };
updateLivesUI();
generateEnvironment();
draw();
