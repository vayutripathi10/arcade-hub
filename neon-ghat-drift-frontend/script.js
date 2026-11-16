// ============================================================================
// NEON GHAT DRIFT: MOUNTAIN DASH — Arcade Hub
// Option A: Winding Mountain Ribbon Tap-to-Drift + Precision Touge Controls
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HUD & UI Elements
const uiScore = document.getElementById('ui-score');
const uiHairpins = document.getElementById('ui-hairpins');
const uiCenterStat = document.getElementById('ui-center-stat');
const uiCombo = document.getElementById('ui-combo');
const uiCoins = document.getElementById('ui-coins');
const uiZoneBadge = document.getElementById('ui-zone-badge');
const uiTrophyCount = document.getElementById('ui-trophy-count');
const uiDriftPill = document.getElementById('ui-drift-pill');
const uiDriftLabel = document.getElementById('ui-drift-label');
const uiDriftPts = document.getElementById('ui-drift-pts');
const uiTrophyToast = document.getElementById('ui-trophy-toast');
const toastIcon = document.getElementById('toast-icon');
const toastTitle = document.getElementById('toast-title');
const uiNitroFill = document.getElementById('ui-nitro-fill');
const btnNitro = document.getElementById('btn-nitro');
const btnDriftHold = document.getElementById('btn-drift-hold');
const uiShieldBadge = document.getElementById('ui-shield-badge');
const btnPause = document.getElementById('btn-pause');
const btnMute = document.getElementById('btn-mute');
const btnFs = document.getElementById('btn-fs');
const btnTrophies = document.getElementById('btn-trophies');

// Menus
const mainMenu = document.getElementById('mainMenu');
const trophyModal = document.getElementById('trophyModal');
const gameOverMenu = document.getElementById('gameOverMenu');
const pauseMenu = document.getElementById('pauseMenu');
const hudLayer = document.getElementById('hud');

// ============================================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER (Catchy Engine, Drift Screech, Truck Horn)
// ============================================================================
class GhatSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.engineOsc = null;
        this.engineGain = null;
        this.screechNode = null;
        this.screechFilter = null;
        this.screechGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    startContinuousAudio() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        this.stopContinuousAudio();
        try {
            const t = this.ctx.currentTime;
            // Subtle synthwave bass engine hum
            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(65, t);

            const engFilter = this.ctx.createBiquadFilter();
            engFilter.type = 'lowpass';
            engFilter.frequency.setValueAtTime(210, t);

            this.engineGain.gain.setValueAtTime(0.035, t);
            this.engineOsc.connect(engFilter);
            engFilter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);
            this.engineOsc.start(t);

            // Continuous tire screech noise generator (gain 0 when not drifting)
            const bufSize = this.ctx.sampleRate * 1.5;
            const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            this.screechNode = this.ctx.createBufferSource();
            this.screechNode.buffer = noiseBuf;
            this.screechNode.loop = true;

            this.screechFilter = this.ctx.createBiquadFilter();
            this.screechFilter.type = 'bandpass';
            this.screechFilter.frequency.setValueAtTime(1350, t);
            this.screechFilter.Q.setValueAtTime(4.5, t);

            this.screechGain = this.ctx.createGain();
            this.screechGain.gain.setValueAtTime(0.0001, t);

            this.screechNode.connect(this.screechFilter);
            this.screechFilter.connect(this.screechGain);
            this.screechGain.connect(this.ctx.destination);
            this.screechNode.start(t);
        } catch (e) {}
    }

    updateContinuousAudio(speedRatio, isDrifting, isCliffhanger, isNitro) {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        if (this.engineOsc && this.engineGain) {
            const baseFreq = isNitro ? 115 : (62 + speedRatio * 48 + (isDrifting ? 14 : 0));
            this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
            this.engineGain.gain.setTargetAtTime(gameState === 'playing' ? 0.038 : 0.0001, t, 0.08);
        }
        if (this.screechGain && this.screechFilter) {
            const targetGain = (gameState === 'playing' && isDrifting) ? (isCliffhanger ? 0.055 : 0.032) : 0.0001;
            const targetFreq = isCliffhanger ? 1750 : 1300;
            this.screechGain.gain.setTargetAtTime(targetGain, t, 0.06);
            this.screechFilter.frequency.setTargetAtTime(targetFreq, t, 0.06);
        }
    }

    stopContinuousAudio() {
        try {
            if (this.engineOsc) { this.engineOsc.stop(); this.engineOsc.disconnect(); }
        } catch (e) {}
        try {
            if (this.screechNode) { this.screechNode.stop(); this.screechNode.disconnect(); }
        } catch (e) {}
        this.engineOsc = null;
        this.engineGain = null;
        this.screechNode = null;
        this.screechGain = null;
    }

    playApexBoost() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        [523.25, 659.25, 1046.5].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + i * 0.045);
            g.gain.setValueAtTime(0.11, t + i * 0.045);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.16);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t + i * 0.045);
            osc.stop(t + i * 0.045 + 0.17);
        });
    }

    playCoin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        [987.77, 1318.51].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.05);
            g.gain.setValueAtTime(0.12, t + i * 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.14);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t + i * 0.05);
            osc.stop(t + i * 0.05 + 0.15);
        });
    }

    // Classic Indian Ghat Truck Musical Air-Horn ("Pom-Pom-Peep-Peep!")
    playTruckHorn() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 554.37, 659.25];
        const times = [0, 0.08, 0.16, 0.26, 0.34];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + times[i]);
            g.gain.setValueAtTime(0.08, t + times[i]);
            g.gain.exponentialRampToValueAtTime(0.001, t + times[i] + 0.075);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t + times[i]);
            osc.stop(t + times[i] + 0.08);
        });
    }

    playNitro() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.38);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.44);
    }

    playShieldBounce() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    playCrash() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.55);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    playTrophyUnlock() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + i * 0.06);
            g.gain.setValueAtTime(0.13, t + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.26);
        });
    }
}

const synth = new GhatSynth();

// ============================================================================
// 2. VEHICLES, BIOMES & TROPHY MILESTONES DEFINITIONS
// ============================================================================
const VEHICLES = {
    ghat800: {
        name: '800 GT',
        color: '#00f3ff',
        secondary: '#0066ff',
        speedMult: 1.0,
        turnMult: 1.0,
        nitroMult: 1.0,
        baseShields: 1,
        reqCoins: 0,
        reqHairpins: 0
    },
    auto3w: {
        name: 'Auto-3W',
        color: '#ffd700',
        secondary: '#222222',
        speedMult: 0.98,
        turnMult: 1.22,
        nitroMult: 1.1,
        baseShields: 1,
        reqCoins: 25,
        reqHairpins: 15
    },
    suprax: {
        name: 'Supra X',
        color: '#ff007f',
        secondary: '#7a00ff',
        speedMult: 1.12,
        turnMult: 1.08,
        nitroMult: 1.25,
        baseShields: 1,
        reqCoins: 60,
        reqHairpins: 40
    },
    hornrig: {
        name: 'Horn Rig',
        color: '#39ff14',
        secondary: '#ff6600',
        speedMult: 1.05,
        turnMult: 1.05,
        nitroMult: 1.15,
        baseShields: 2,
        reqCoins: 120,
        reqHairpins: 80
    }
};

const BIOMES = [
    { name: 'MISTY FOOTHILLS', railColor: '#00f3ff', roadTint: '#0d1222', bgTop: '#04060e', bgBot: '#091326' },
    { name: 'HAIRPIN GORGE',   railColor: '#ff007f', roadTint: '#170d24', bgTop: '#090412', bgBot: '#1c0926' },
    { name: 'MONSOON RIDGE',   railColor: '#39ff14', roadTint: '#0b1b18', bgTop: '#030d0b', bgBot: '#08221c' },
    { name: 'CYBER PEAK',      railColor: '#ffd700', roadTint: '#1c150c', bgTop: '#0d0904', bgBot: '#241806' }
];

const TROPHY_MILESTONES = [
    { id: 'first_drift',  icon: '🏎️', title: 'Ghat Rookie',      desc: 'Clear your first mountain Hairpin Bend' },
    { id: 'cliffhanger',  icon: '⚡', title: 'Cliffhanger',      desc: 'Spark along the outer cliff guardrail while drifting' },
    { id: 'hairpin_10',   icon: '🏔️', title: 'Hairpin King',     desc: 'Conquer 10 Hairpin Bends in a single run' },
    { id: 'combo_10',     icon: '🔥', title: 'Tire Smoker',      desc: 'Reach a x10 Drift Chain Multiplier' },
    { id: 'near_miss_5',  icon: '🚛', title: 'Horn OK Please!',  desc: 'Pull off 5 Near-Misses past Ghat Cyber-Trucks' },
    { id: 'legend_5000',  icon: '👑', title: 'King of the Ghats',desc: 'Score 5,000+ points in a single run' }
];

// ============================================================================
// 3. PERSISTENT CAREER STATE & GAME STATE
// ============================================================================
let totalCoins = parseInt(localStorage.getItem('ghatTotalCoins')) || 0;
let totalHairpinsCareer = parseInt(localStorage.getItem('ghatTotalHairpins')) || 0;
let totalNearMissesCareer = parseInt(localStorage.getItem('ghatTotalNearMisses')) || 0;
let selectedCarKey = localStorage.getItem('ghatSelectedCar') || 'ghat800';
let unlockedTrophies = {};
try {
    unlockedTrophies = JSON.parse(localStorage.getItem('ghatTrophies') || '{}');
} catch (e) {
    unlockedTrophies = {};
}

function isCarUnlocked(key) {
    const cfg = VEHICLES[key];
    if (!cfg) return false;
    return totalCoins >= cfg.reqCoins || totalHairpinsCareer >= cfg.reqHairpins;
}
if (!isCarUnlocked(selectedCarKey)) {
    selectedCarKey = 'ghat800';
}

let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
let gameMode = 'endless'; // 'endless', 'timeattack', 'traffic'
let lastTime = 0;
let animationFrameId = null;

// Active Run Stats
let score = 0;
let runCoins = 0;
let hairpinsCleared = 0;
let currentCombo = 1;
let maxCombo = 1;
let comboTimer = 0;
let cliffhangersCount = 0;
let nearMissesRun = 0;
let nitroCharge = 0;       // 0 to 100
let nitroActiveTimer = 0;  // frames remaining
let shields = 1;
let shieldInvulnTimer = 0;
let timeLeft = 45;         // For timeattack mode
let timeAccum = 0;
let screenShake = 0;

// Active Drift Accumulator
let activeDriftScore = 0;
let activeDriftTime = 0;
let isCliffhangerFrame = false;

// Input State
const input = {
    driftHold: false,
    left: false,
    right: false
};

// Entities & Road Spline
const SEG_LEN = 22;
let roadSegments = [];
let genState = {
    x: 0,
    y: 0,
    angle: 0, // 0 = straight up (-Y)
    targetCurvature: 0,
    currentCurvature: 0,
    segCounter: 0,
    patternRemaining: 25,
    patternType: 'straight', // 'straight', 'sweeper', 'hairpin'
    lastTurnDir: 1,
    hairpinCounter: 0,
    currentHairpinId: 0
};

let car = {
    x: 0,
    y: 0,
    heading: 0,     // radians, 0 = straight up
    driftAngle: 0,  // visual body slip angle
    speed: 7.5,
    segIndex: 10,
    lateralOffset: 0
};

let skidMarks = [];
let particles = [];
let floatingTexts = [];
let pickups = [];
let trafficTrucks = [];
let valleyStars = [];

// ============================================================================
// 4. CANVAS SIZING & VALLEY BACKGROUND
// ============================================================================
function resizeCanvas() {
    const wrapper = document.getElementById('gameWrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = Math.max(280, rect.height);
    canvas.width = w;
    canvas.height = h;
    initValleyStars();
}
window.addEventListener('resize', resizeCanvas);

function initValleyStars() {
    valleyStars = [];
    for (let i = 0; i < 45; i++) {
        valleyStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.6,
            hue: Math.random() > 0.5 ? '#00f3ff' : (Math.random() > 0.5 ? '#ffd700' : '#ff66b2'),
            speed: Math.random() * 0.35 + 0.1
        });
    }
}

// ============================================================================
// 5. TROPHY MILESTONE SYSTEM
// ============================================================================
function unlockTrophy(id) {
    if (unlockedTrophies[id]) return;
    const def = TROPHY_MILESTONES.find(t => t.id === id);
    if (!def) return;

    unlockedTrophies[id] = Date.now();
    try {
        localStorage.setItem('ghatTrophies', JSON.stringify(unlockedTrophies));
    } catch (e) {}

    // Also unlock in global Arcade Hub achievement system
    if (window.achievements && typeof window.achievements.unlock === 'function') {
        window.achievements.unlock('ghat', id, def.title);
    }

    synth.playTrophyUnlock();
    showTrophyToast(def);
    renderTrophyUI();
}

function showTrophyToast(def) {
    if (!uiTrophyToast) return;
    toastIcon.textContent = def.icon;
    toastTitle.textContent = def.title;
    uiTrophyToast.classList.add('show');
    clearTimeout(uiTrophyToast._timer);
    uiTrophyToast._timer = setTimeout(() => {
        uiTrophyToast.classList.remove('show');
    }, 3200);
}

function renderTrophyUI() {
    const unlockedList = TROPHY_MILESTONES.filter(t => !!unlockedTrophies[t.id]);
    if (uiTrophyCount) {
        uiTrophyCount.textContent = `${unlockedList.length}/${TROPHY_MILESTONES.length}`;
    }

    const miniRow = document.getElementById('trophyMiniRow');
    if (miniRow) {
        miniRow.innerHTML = TROPHY_MILESTONES.map(t => {
            const isUn = !!unlockedTrophies[t.id];
            return `<div class="trophy-mini-pill ${isUn ? 'unlocked' : ''}" title="${t.title}: ${t.desc}">
                <span class="t-icon">${isUn ? t.icon : '🔒'}</span>
                <span class="t-name">${t.title}</span>
            </div>`;
        }).join('');
    }

    const fullGrid = document.getElementById('trophyFullGrid');
    if (fullGrid) {
        fullGrid.innerHTML = TROPHY_MILESTONES.map(t => {
            const isUn = !!unlockedTrophies[t.id];
            return `<div class="trophy-full-card ${isUn ? 'unlocked' : ''}">
                <div class="trophy-full-icon">${isUn ? t.icon : '🔒'}</div>
                <div class="trophy-full-info">
                    <h4>${t.title} ${isUn ? '✓' : ''}</h4>
                    <p>${t.desc}</p>
                </div>
            </div>`;
        }).join('');
    }
}

// ============================================================================
// 6. PROCEDURAL GHAT ROAD GENERATOR
// ============================================================================
function getCurrentBiomeIndex() {
    return Math.min(BIOMES.length - 1, Math.floor(hairpinsCleared / 3));
}

function resetRoadGenerator() {
    roadSegments = [];
    pickups = [];
    trafficTrucks = [];
    skidMarks = [];
    particles = [];
    floatingTexts = [];

    genState = {
        x: 0,
        y: 0,
        angle: 0,
        targetCurvature: 0,
        currentCurvature: 0,
        segCounter: 0,
        patternRemaining: 28,
        patternType: 'straight',
        lastTurnDir: Math.random() > 0.5 ? 1 : -1,
        hairpinCounter: 0,
        currentHairpinId: 0
    };

    for (let i = 0; i < 160; i++) {
        appendRoadSegment();
    }
}

function appendRoadSegment() {
    genState.segCounter++;
    genState.patternRemaining--;

    if (genState.patternRemaining <= 0) {
        if (genState.patternType !== 'straight') {
            // Always insert a short straight recovery zone after a corner/hairpin
            genState.patternType = 'straight';
            genState.targetCurvature = 0;
            genState.patternRemaining = 14 + Math.floor(Math.random() * 8);
            genState.currentHairpinId = 0;
        } else {
            // Choose next mountain bend!
            const dir = -genState.lastTurnDir;
            genState.lastTurnDir = dir;
            const isHairpin = Math.random() < 0.62;
            if (isHairpin) {
                genState.patternType = 'hairpin';
                genState.hairpinCounter++;
                genState.currentHairpinId = genState.hairpinCounter;
                const difficultyScale = Math.min(1.25, 1 + hairpinsCleared * 0.015);
                genState.targetCurvature = dir * (0.048 * difficultyScale);
                genState.patternRemaining = 30 + Math.floor(Math.random() * 10);
            } else {
                genState.patternType = 'sweeper';
                genState.currentHairpinId = 0;
                genState.targetCurvature = dir * 0.028;
                genState.patternRemaining = 22 + Math.floor(Math.random() * 10);
            }
        }
    }

    // Smoothly interpolate curvature
    genState.currentCurvature += (genState.targetCurvature - genState.currentCurvature) * 0.18;
    genState.angle += genState.currentCurvature;
    // Clamp max total winding angle so the mountain road generally ascends upward (-Y)
    if (genState.angle > 1.18) {
        genState.angle = 1.18;
        genState.targetCurvature = -Math.abs(genState.targetCurvature);
    } else if (genState.angle < -1.18) {
        genState.angle = -1.18;
        genState.targetCurvature = Math.abs(genState.targetCurvature);
    }

    genState.x += Math.sin(genState.angle) * SEG_LEN;
    genState.y -= Math.cos(genState.angle) * SEG_LEN;

    const halfWidth = Math.max(106, 128 - Math.min(20, hairpinsCleared * 1.1));
    const nx = Math.cos(genState.angle);
    const ny = Math.sin(genState.angle);

    const seg = {
        index: genState.segCounter,
        x: genState.x,
        y: genState.y,
        angle: genState.angle,
        curvature: genState.currentCurvature,
        halfWidth,
        nx,
        ny,
        hairpinId: genState.currentHairpinId,
        hairpinCleared: false,
        kmNumber: (genState.segCounter % 55 === 0) ? Math.floor(genState.segCounter / 55) : 0,
        hasChevron: Math.abs(genState.currentCurvature) > 0.022 && (genState.segCounter % 4 === 0),
        hasLamp: (genState.segCounter % 12 === 0),
        lampSide: (genState.segCounter % 24 === 0) ? 1 : -1,
        treeSeed: (genState.segCounter % 5 === 0) ? ((genState.segCounter * 37) % 100) / 100 : -1
    };
    roadSegments.push(seg);

    // Spawn Coins or Nitro Energy Cells along curve apexes
    if (genState.segCounter > 25 && genState.segCounter % 9 === 0 && Math.random() < 0.65) {
        const laneBias = seg.curvature !== 0
            ? -Math.sign(seg.curvature) * (halfWidth * 0.42)
            : (Math.random() - 0.5) * (halfWidth * 0.7);
        const isNitroOrb = (genState.segCounter % 45 === 0);
        pickups.push({
            x: seg.x + seg.nx * laneBias,
            y: seg.y + seg.ny * laneBias,
            type: isNitroOrb ? 'nitro' : 'coin',
            collected: false
        });
    }

    // Spawn "Horn OK Please" Cyber-Trucks
    const truckFreq = gameMode === 'traffic' ? 22 : 42;
    if (genState.segCounter > 35 && genState.segCounter % truckFreq === 0) {
        const laneSign = Math.random() > 0.5 ? 0.42 : -0.42;
        trafficTrucks.push({
            segFloat: roadSegments.length - 1,
            laneOffset: laneSign * halfWidth,
            speed: gameMode === 'traffic' ? 0.16 : 0.14,
            nearMissed: false,
            color: Math.random() > 0.5 ? '#ff6600' : '#ff007f'
        });
    }
}

// ============================================================================
// 7. GAME FLOW & INITIALIZATION
// ============================================================================
function initGame(mode) {
    synth.init();
    resizeCanvas();

    gameMode = mode || 'endless';
    const carCfg = VEHICLES[selectedCarKey] || VEHICLES.ghat800;

    score = 0;
    runCoins = 0;
    hairpinsCleared = 0;
    currentCombo = 1;
    maxCombo = 1;
    comboTimer = 0;
    cliffhangersCount = 0;
    nearMissesRun = 0;
    nitroCharge = 25; // Start with 25% Nitro
    nitroActiveTimer = 0;
    shields = carCfg.baseShields;
    shieldInvulnTimer = 0;
    timeLeft = 45;
    timeAccum = 0;
    screenShake = 0;
    activeDriftScore = 0;
    activeDriftTime = 0;

    resetRoadGenerator();

    const startSeg = roadSegments[8];
    car = {
        x: startSeg.x,
        y: startSeg.y,
        heading: startSeg.angle,
        driftAngle: 0,
        speed: 7.4 * carCfg.speedMult,
        segIndex: 8,
        lateralOffset: 0,
        lastClearedHairpinId: 0
    };

    input.driftHold = false;
    input.left = false;
    input.right = false;

    mainMenu.classList.add('hidden');
    trophyModal.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    hudLayer.classList.remove('hud-hidden');

    gameState = 'playing';
    updateHubButton();
    updateHUD();
    synth.startContinuousAudio();

    lastTime = performance.now();
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(loop);
    }
}

function triggerNitro() {
    if (gameState !== 'playing') return;
    if (nitroCharge < 100 || nitroActiveTimer > 0) return;
    nitroCharge = 0;
    nitroActiveTimer = 260; // ~4.3 seconds of Overdrive Nitro
    synth.playNitro();
    screenShake = 12;
    spawnFloatingText(car.x, car.y - 30, '🌈 OVERDRIVE NITRO! 3x SCORE! 🌈', '#ffd700', 22);
    updateHUD();
}

// ============================================================================
// 8. PHYSICS & UPDATE LOOP
// ============================================================================
function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

function update(dt) {
    const carCfg = VEHICLES[selectedCarKey] || VEHICLES.ghat800;

    if (shieldInvulnTimer > 0) shieldInvulnTimer -= dt;
    if (nitroActiveTimer > 0) {
        nitroActiveTimer -= dt;
        if (nitroActiveTimer < 0) nitroActiveTimer = 0;
    }

    // Time Attack Countdown
    if (gameMode === 'timeattack') {
        timeAccum += dt;
        if (timeAccum >= 60) {
            timeAccum -= 60;
            timeLeft--;
            updateHUD();
            if (timeLeft <= 0) {
                endRun('⏱️ Time Up!', 'Push harder through the hairpin apexes!');
                return;
            }
        }
    }

    // Combo decay timer
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0 && !input.driftHold) {
            currentCombo = 1;
            updateHUD();
        }
    }

    // Current & Lookahead Road Segments
    const currSeg = roadSegments[car.segIndex] || roadSegments[0];
    const lookSeg = roadSegments[Math.min(roadSegments.length - 1, car.segIndex + 7)] || currSeg;

    // Target speed scales gently with progress & Nitro
    const progressionBoost = Math.min(2.6, hairpinsCleared * 0.09);
    const baseTargetSpeed = (7.4 + progressionBoost) * carCfg.speedMult;
    const targetSpeed = nitroActiveTimer > 0 ? baseTargetSpeed * 1.38 : baseTargetSpeed;
    car.speed += (targetSpeed - car.speed) * 0.08 * dt;

    // Determine Steering & Drift Behavior
    const isManualSteer = input.left || input.right;
    const isDriftingNow = input.driftHold || (isManualSteer && Math.abs(lookSeg.curvature) > 0.012);

    if (nitroActiveTimer > 0) {
        // Nitro Overdrive assists steering smoothly along the ideal road line
        const desiredHeading = lookSeg.angle - (car.lateralOffset * 0.0045);
        car.heading += normalizeAngle(desiredHeading - car.heading) * 0.22 * dt;
        car.driftAngle += (lookSeg.curvature * 14 - car.driftAngle) * 0.18 * dt;
    } else if (input.driftHold) {
        // Option A: Tap & Hold to Drift!
        // Automatically drifts into the upcoming corner direction, plus allows fine A/D nudge
        let curveDir = Math.sign(lookSeg.curvature);
        if (Math.abs(lookSeg.curvature) < 0.005) {
            curveDir = Math.sign(currSeg.curvature) || -Math.sign(car.lateralOffset) || 1;
        }
        const manualBias = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const desiredHeading = lookSeg.angle - (car.lateralOffset * 0.0032) + manualBias * 0.22;
        const turnRate = 0.14 * carCfg.turnMult;
        car.heading += normalizeAngle(desiredHeading - car.heading) * turnRate * dt;

        // Pronounced tail-out drift slip angle
        const targetSlip = (curveDir * 0.58 + manualBias * 0.25) * carCfg.turnMult;
        car.driftAngle += (targetSlip - car.driftAngle) * 0.16 * dt;
        btnDriftHold?.classList.add('drifting-active');
    } else {
        btnDriftHold?.classList.remove('drifting-active');
        // Released Drift: Check if we just finished a sustained corner drift for a Perfect Apex Boost!
        if (activeDriftTime >= 24 && activeDriftScore >= 30) {
            const bonus = Math.round(activeDriftScore + 80 * currentCombo);
            score += bonus;
            currentCombo = Math.min(20, currentCombo + 1);
            if (currentCombo > maxCombo) maxCombo = currentCombo;
            if (currentCombo >= 10) unlockTrophy('combo_10');
            comboTimer = 240;
            nitroCharge = Math.min(100, nitroCharge + 10 * carCfg.nitroMult);
            synth.playApexBoost();
            spawnFloatingText(car.x, car.y - 26, `🚀 APEX DRIFT +${bonus} (x${currentCombo})`, '#00f3ff', 19);
            updateHUD();
        }
        activeDriftScore = 0;
        activeDriftTime = 0;

        // Manual Left/Right steering or gentle self-centering on straightaways
        const manualDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (manualDir !== 0) {
            car.heading += manualDir * 0.046 * carCfg.turnMult * dt;
            car.driftAngle += (manualDir * 0.28 - car.driftAngle) * 0.15 * dt;
        } else {
            // Smoothly align with current road tangent when not drifting
            const alignDiff = normalizeAngle(currSeg.angle - car.heading);
            car.heading += alignDiff * 0.085 * dt;
            car.driftAngle *= Math.pow(0.82, dt);
        }
    }

    // Advance car position in world space
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.y -= Math.cos(car.heading) * car.speed * dt;

    // Find closest road segment ahead/around car
    let bestIdx = car.segIndex;
    let bestDistSq = Infinity;
    const searchEnd = Math.min(roadSegments.length - 1, car.segIndex + 12);
    for (let i = Math.max(0, car.segIndex - 2); i <= searchEnd; i++) {
        const s = roadSegments[i];
        const dx = car.x - s.x;
        const dy = car.y - s.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestIdx = i;
        }
    }
    car.segIndex = bestIdx;
    const seg = roadSegments[car.segIndex];

    // Append new road segments ahead and trim old segments behind
    while (roadSegments.length - car.segIndex < 120) {
        appendRoadSegment();
    }
    if (car.segIndex > 35) {
        const removeCount = car.segIndex - 25;
        roadSegments.splice(0, removeCount);
        car.segIndex -= removeCount;
        trafficTrucks.forEach(tr => { tr.segFloat -= removeCount; });
        trafficTrucks = trafficTrucks.filter(tr => tr.segFloat > 2);
    }

    // Compute signed lateral offset from road centerline
    const relX = car.x - seg.x;
    const relY = car.y - seg.y;
    car.lateralOffset = relX * seg.nx + relY * seg.ny;
    const normOffset = Math.abs(car.lateralOffset) / seg.halfWidth;

    // Check Hairpin Clear Milestone!
    if (seg.hairpinId > 0 && seg.hairpinId !== car.lastClearedHairpinId) {
        // Check if next segment exits the hairpin
        const nextCheck = roadSegments[Math.min(roadSegments.length - 1, car.segIndex + 3)];
        if (nextCheck && nextCheck.hairpinId === 0) {
            car.lastClearedHairpinId = seg.hairpinId;
            hairpinsCleared++;
            totalHairpinsCareer++;
            localStorage.setItem('ghatTotalHairpins', totalHairpinsCareer);

            const hairpinPts = 200 * currentCombo;
            score += hairpinPts;
            if (gameMode === 'timeattack') {
                timeLeft = Math.min(60, timeLeft + 6);
                spawnFloatingText(car.x, car.y - 45, `🏔️ HAIRPIN #${hairpinsCleared} CLEARED! +6s`, '#39ff14', 20);
                if (hairpinsCleared >= 12) {
                    score += timeLeft * 150;
                    endRun('🏆 PASS CONQUERED!', `All 12 Hairpins Cleared with ${timeLeft}s spare!`);
                    return;
                }
            } else {
                spawnFloatingText(car.x, car.y - 45, `🏔️ HAIRPIN #${hairpinsCleared} (+${hairpinPts})`, '#39ff14', 20);
            }

            unlockTrophy('first_drift');
            if (hairpinsCleared >= 10) unlockTrophy('hairpin_10');
            updateHUD();
        }
    }

    // Scoring & Cliffhanger Check during Drift
    isCliffhangerFrame = false;
    if (isDriftingNow || Math.abs(car.driftAngle) > 0.22) {
        activeDriftTime += dt;
        comboTimer = 210;
        const isCliff = normOffset >= 0.65 && normOffset <= 1.02;
        isCliffhangerFrame = isCliff;

        const rate = (isCliff ? 5.2 : 2.4) * (nitroActiveTimer > 0 ? 3 : 1);
        activeDriftScore += rate * dt;
        score += Math.round(rate * dt);
        nitroCharge = Math.min(100, nitroCharge + (isCliff ? 0.42 : 0.18) * carCfg.nitroMult * dt);

        if (isCliff) {
            cliffhangersCount++;
            unlockTrophy('cliffhanger');
            // Golden cliff guardrail sparks!
            for (let s = 0; s < 2; s++) {
                particles.push({
                    x: car.x + (Math.random() - 0.5) * 14,
                    y: car.y + (Math.random() - 0.5) * 14,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    color: Math.random() > 0.4 ? '#ffd700' : '#ff007f',
                    size: Math.random() * 3.5 + 2,
                    life: 1.0
                });
            }
        }

        // Continuous Dual-Tire Skid Ribbons & Volumetric Drift Smoke
        const visualAngle = car.heading + car.driftAngle;
        const rearX = car.x - Math.sin(visualAngle) * 18;
        const rearY = car.y + Math.cos(visualAngle) * 18;
        const perpX = Math.cos(visualAngle) * 12.5;
        const perpY = Math.sin(visualAngle) * 12.5;
        const lx = rearX - perpX;
        const ly = rearY - perpY;
        const rx = rearX + perpX;
        const ry = rearY + perpY;
        const trailCol = nitroActiveTimer > 0
            ? `hsl(${Math.floor((Date.now() * 0.5) % 360)}, 100%, 60%)`
            : (isCliff ? '#ff007f' : carCfg.color);

        if (car._lastSkidX1 !== undefined && Math.hypot(lx - car._lastSkidX1, ly - car._lastSkidY1) < 48) {
            skidMarks.push({
                px1: car._lastSkidX1, py1: car._lastSkidY1,
                x1: lx, y1: ly,
                px2: car._lastSkidX2, py2: car._lastSkidY2,
                x2: rx, y2: ry,
                color: trailCol,
                alpha: 0.72
            });
            if (skidMarks.length > 240) skidMarks.shift();
        }
        car._lastSkidX1 = lx; car._lastSkidY1 = ly;
        car._lastSkidX2 = rx; car._lastSkidY2 = ry;

        // Billowy tire smoke clouds from both rear tires
        if (Math.random() < 0.65) {
            const sidePick = Math.random() > 0.5 ? 1 : -1;
            particles.push({
                x: rearX + sidePick * perpX + (Math.random() - 0.5) * 4,
                y: rearY + sidePick * perpY + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 1.4,
                vy: (Math.random() - 0.5) * 1.4,
                color: isCliff ? 'rgba(255, 160, 220, 0.35)' : 'rgba(200, 225, 255, 0.28)',
                size: Math.random() * 5 + 5,
                grow: 0.35,
                life: 0.85
            });
        }

        if (uiDriftPill) {
            uiDriftPill.classList.add('active');
            uiDriftPill.classList.toggle('cliff-mode', isCliff);
            uiDriftLabel.textContent = isCliff ? '⚡ CLIFFHANGER 2x!' : '🔥 DRIFTING';
            uiDriftPts.textContent = `+${Math.round(activeDriftScore)}`;
        }
    } else {
        car._lastSkidX1 = undefined;
        if (uiDriftPill) uiDriftPill.classList.remove('active', 'cliff-mode');
    }

    // Check Guardrail / Cliff Edge Collision
    if (normOffset > 1.0) {
        if (nitroActiveTimer > 0 || shields > 0 || shieldInvulnTimer > 0) {
            if (nitroActiveTimer <= 0 && shieldInvulnTimer <= 0) {
                shields--;
                shieldInvulnTimer = 75;
                synth.playShieldBounce();
                screenShake = 14;
                spawnFloatingText(car.x, car.y - 30, '🛡️ GUARDRAIL BUMPER SAVE!', '#ffd700', 20);
            }
            // Bounce back onto the road
            const pushSign = Math.sign(car.lateralOffset);
            car.lateralOffset = pushSign * seg.halfWidth * 0.72;
            car.x = seg.x + seg.nx * car.lateralOffset;
            car.y = seg.y + seg.ny * car.lateralOffset;
            car.heading = seg.angle - pushSign * 0.18;
            updateHUD();
        } else {
            // Plunge off the mountain cliff!
            synth.playCrash();
            screenShake = 22;
            endRun('💥 CLIFF WIPEOUT!', 'You smashed through the mountain guardrail!');
            return;
        }
    }

    // Update Pickups (Coins & Nitro Cells)
    pickups.forEach(p => {
        if (p.collected) return;
        const d = Math.hypot(car.x - p.x, car.y - p.y);
        if (d < 34) {
            p.collected = true;
            if (p.type === 'nitro') {
                nitroCharge = Math.min(100, nitroCharge + 40);
                score += 150;
                synth.playApexBoost();
                spawnFloatingText(p.x, p.y, '⚡ +40% NITRO!', '#00f3ff', 18);
            } else {
                runCoins++;
                totalCoins++;
                localStorage.setItem('ghatTotalCoins', totalCoins);
                score += 50 * currentCombo;
                synth.playCoin();
                spawnFloatingText(p.x, p.y, `🪙 +${50 * currentCombo}`, '#ffd700', 17);
            }
            updateHUD();
        }
    });
    pickups = pickups.filter(p => !p.collected && p.y < car.y + 300);

    // Update Traffic Cyber-Trucks
    for (let i = 0; i < trafficTrucks.length; i++) {
        const tr = trafficTrucks[i];
        tr.segFloat += tr.speed * dt;
        const tIdx = Math.min(roadSegments.length - 1, Math.max(0, Math.floor(tr.segFloat)));
        const tSeg = roadSegments[tIdx];
        if (!tSeg) continue;
        tr.x = tSeg.x + tSeg.nx * tr.laneOffset;
        tr.y = tSeg.y + tSeg.ny * tr.laneOffset;
        tr.angle = tSeg.angle;

        const distToCar = Math.hypot(car.x - tr.x, car.y - tr.y);
        if (distToCar < 28) {
            if (nitroActiveTimer > 0 || shieldInvulnTimer > 0) {
                // Smash truck out of the way during Nitro!
                tr.segFloat = -999;
                score += 250;
                screenShake = 10;
                spawnFloatingText(car.x, car.y - 30, '💥 NITRO TRUCK SMASH! +250', '#ffd700', 20);
            } else if (shields > 0) {
                shields--;
                shieldInvulnTimer = 75;
                tr.segFloat = -999;
                synth.playShieldBounce();
                screenShake = 14;
                spawnFloatingText(car.x, car.y - 30, '🛡️ SHIELD ABSORBED TRUCK!', '#ffd700', 20);
                updateHUD();
            } else {
                synth.playCrash();
                screenShake = 22;
                endRun('🚛 TRAFFIC COLLISION!', 'Watch out for Horn-OK-Please Cyber-Trucks!');
                return;
            }
        } else if (!tr.nearMissed && distToCar < 66 && car.y <= tr.y + 18) {
            tr.nearMissed = true;
            nearMissesRun++;
            totalNearMissesCareer++;
            localStorage.setItem('ghatTotalNearMisses', totalNearMissesCareer);
            const nmPts = 150 * currentCombo;
            score += nmPts;
            nitroCharge = Math.min(100, nitroCharge + 15);
            synth.playTruckHorn();
            spawnFloatingText(tr.x, tr.y - 20, `🚛 HORN OK! NEAR MISS +${nmPts}`, '#39ff14', 19);
            if (nearMissesRun >= 5 || totalNearMissesCareer >= 5) {
                unlockTrophy('near_miss_5');
            }
            updateHUD();
        }
    }

    // Check 5,000 Score Trophy
    if (score >= 5000) {
        unlockTrophy('legend_5000');
    }

    // Update Particles & Floating Texts
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.grow) p.size += p.grow * dt;
        p.life -= (p.grow ? 0.032 : 0.045) * dt;
    });
    particles = particles.filter(p => p.life > 0);

    skidMarks.forEach(s => { s.alpha -= 0.0035 * dt; });
    skidMarks = skidMarks.filter(s => s.alpha > 0.05);

    floatingTexts.forEach(ft => {
        ft.y -= 1.4 * dt;
        ft.life -= 0.026 * dt;
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    synth.updateContinuousAudio(
        Math.min(1, (car.speed - 6) / 5),
        isDriftingNow,
        isCliffhangerFrame,
        nitroActiveTimer > 0
    );
}

function spawnFloatingText(x, y, text, color, size = 18) {
    floatingTexts.push({ x, y, text, color, size, life: 1.0 });
}

// ============================================================================
// 9. RENDERING ENGINE (Cyberpunk Ghat Ribbon, Guardrails, Trucks, Car)
// ============================================================================
function draw() {
    const biome = BIOMES[getCurrentBiomeIndex()];

    // 1. Deep Mountain Valley Gradient Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, biome.bgTop);
    grad.addColorStop(1, biome.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Distant Valley Lights / Fireflies Parallax
    ctx.save();
    valleyStars.forEach(st => {
        if (gameState === 'playing') {
            st.y += st.speed * (car.speed * 0.25);
            if (st.y > canvas.height) {
                st.y = 0;
                st.x = Math.random() * canvas.width;
            }
        }
        ctx.fillStyle = st.hue;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    ctx.save();

    // Screen Shake
    if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
        screenShake *= 0.88;
        if (screenShake < 0.4) screenShake = 0;
    }

    // Camera Transform: Center car at (canvas.width / 2, canvas.height * 0.74)
    const camX = canvas.width / 2 - car.x;
    const camY = canvas.height * 0.74 - car.y;
    ctx.translate(camX, camY);

    // 3. Draw Winding Mountain Road Ribbon & Environment
    if (roadSegments.length > 2) {
        // 3a. Outer Rocky Mountain Cliff Ledge & Drop Shadow
        ctx.beginPath();
        for (let i = 0; i < roadSegments.length; i++) {
            const s = roadSegments[i];
            const lx = s.x - s.nx * (s.halfWidth + 28);
            const ly = s.y - s.ny * (s.halfWidth + 28);
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
        }
        for (let i = roadSegments.length - 1; i >= 0; i--) {
            const s = roadSegments[i];
            const rx = s.x + s.nx * (s.halfWidth + 28);
            const ry = s.y + s.ny * (s.halfWidth + 28);
            ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(4, 6, 14, 0.85)';
        ctx.fill();

        // 3b. Gravel / Stone Shoulder Verge
        ctx.beginPath();
        for (let i = 0; i < roadSegments.length; i++) {
            const s = roadSegments[i];
            const lx = s.x - s.nx * (s.halfWidth + 9);
            const ly = s.y - s.ny * (s.halfWidth + 9);
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
        }
        for (let i = roadSegments.length - 1; i >= 0; i--) {
            const s = roadSegments[i];
            const rx = s.x + s.nx * (s.halfWidth + 9);
            const ry = s.y + s.ny * (s.halfWidth + 9);
            ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fillStyle = '#141929';
        ctx.fill();

        // 3c. Main Asphalt Surface
        ctx.beginPath();
        for (let i = 0; i < roadSegments.length; i++) {
            const s = roadSegments[i];
            const lx = s.x - s.nx * s.halfWidth;
            const ly = s.y - s.ny * (s.halfWidth);
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
        }
        for (let i = roadSegments.length - 1; i >= 0; i--) {
            const s = roadSegments[i];
            const rx = s.x + s.nx * s.halfWidth;
            const ry = s.y + s.ny * s.halfWidth;
            ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fillStyle = biome.roadTint;
        ctx.fill();

        // 3d. Red & White Touge Apex Rumble Curbs on Curves
        for (let i = 0; i < roadSegments.length - 1; i++) {
            const s1 = roadSegments[i];
            const s2 = roadSegments[i + 1];
            if (Math.abs(s1.curvature) > 0.015) {
                const curbCol = (s1.index % 2 === 0) ? '#ff2a55' : '#e2e8f0';
                [-1, 1].forEach(side => {
                    ctx.beginPath();
                    ctx.moveTo(s1.x + side * s1.nx * (s1.halfWidth - 3), s1.y + side * s1.ny * (s1.halfWidth - 3));
                    ctx.lineTo(s2.x + side * s2.nx * (s2.halfWidth - 3), s2.y + side * s2.ny * (s2.halfWidth - 3));
                    ctx.strokeStyle = curbCol;
                    ctx.lineWidth = 6;
                    ctx.stroke();
                });
            }
        }

        // 3e. Cliffhanger Outer Danger Zones (Subtle Glowing Strips)
        ['left', 'right'].forEach(side => {
            const sign = side === 'left' ? -1 : 1;
            ctx.beginPath();
            for (let i = 0; i < roadSegments.length; i++) {
                const s = roadSegments[i];
                const px = s.x + sign * s.nx * (s.halfWidth * 0.78);
                const py = s.y + sign * s.ny * (s.halfWidth * 0.78);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.13)';
            ctx.lineWidth = 16;
            ctx.stroke();
        });

        // 3f. Double Center Yellow/Gold Ghat Highway Line + Side White Edge Lines
        ['leftEdge', 'rightEdge'].forEach(edge => {
            const sign = edge === 'leftEdge' ? -1 : 1;
            ctx.beginPath();
            for (let i = 0; i < roadSegments.length; i++) {
                const s = roadSegments[i];
                const ex = s.x + sign * s.nx * (s.halfWidth - 7);
                const ey = s.y + sign * s.ny * (s.halfWidth - 7);
                if (i === 0) ctx.moveTo(ex, ey);
                else ctx.lineTo(ex, ey);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < roadSegments.length; i++) {
            const s = roadSegments[i];
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
        ctx.lineWidth = 3;
        ctx.setLineDash([18, 20]);
        ctx.stroke();
        ctx.restore();

        // 3g. Glowing Left & Right Neon Guardrails with Steel Posts
        const railCol = nitroActiveTimer > 0
            ? `hsl(${Math.floor((Date.now() * 0.4) % 360)}, 100%, 60%)`
            : biome.railColor;

        ['left', 'right'].forEach(side => {
            const sign = side === 'left' ? -1 : 1;
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < roadSegments.length; i++) {
                const s = roadSegments[i];
                const gx = s.x + sign * s.nx * s.halfWidth;
                const gy = s.y + sign * s.ny * s.halfWidth;
                if (i === 0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.strokeStyle = railCol;
            ctx.lineWidth = 4.5;
            ctx.shadowBlur = 14;
            ctx.shadowColor = railCol;
            ctx.stroke();
            ctx.restore();
        });

        // 3h. Roadside Mountain Pines, Streetlamps, KM Milestones & Chevrons
        for (let i = 0; i < roadSegments.length; i++) {
            const s = roadSegments[i];

            // Roadside Deodar / Pine Tree Silhouettes
            if (s.treeSeed >= 0) {
                const tSide = s.treeSeed > 0.5 ? 1 : -1;
                const distOut = s.halfWidth + 36 + (s.treeSeed * 26);
                const tx = s.x + tSide * s.nx * distOut;
                const ty = s.y + tSide * s.ny * distOut;
                ctx.save();
                ctx.translate(tx, ty);
                // Tree canopy layers
                ctx.fillStyle = '#071521';
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#0c2436';
                ctx.beginPath();
                ctx.arc(-2, -2, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Roadside Glowing Sodium/Neon Ghat Streetlamp
            if (s.hasLamp) {
                const lx = s.x + s.lampSide * s.nx * (s.halfWidth + 8);
                const ly = s.y + s.lampSide * s.ny * (s.halfWidth + 8);
                const poolX = s.x + s.lampSide * s.nx * (s.halfWidth * 0.65);
                const poolY = s.y + s.lampSide * s.ny * (s.halfWidth * 0.65);
                ctx.save();
                const lampGrad = ctx.createRadialGradient(poolX, poolY, 2, poolX, poolY, 34);
                lampGrad.addColorStop(0, 'rgba(255, 190, 80, 0.16)');
                lampGrad.addColorStop(1, 'rgba(255, 190, 80, 0)');
                ctx.fillStyle = lampGrad;
                ctx.beginPath();
                ctx.arc(poolX, poolY, 34, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffbe50';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffbe50';
                ctx.beginPath();
                ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (s.kmNumber > 0) {
                const mx = s.x - s.nx * (s.halfWidth + 24);
                const my = s.y - s.ny * (s.halfWidth + 24);
                ctx.save();
                ctx.translate(mx, my);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-11, -6, 22, 14);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, -6, 11, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 8px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(`KM ${s.kmNumber}`, 0, 4);
                ctx.restore();
            }

            if (s.hasChevron) {
                const outerSign = s.curvature > 0 ? -1 : 1;
                const cx = s.x + outerSign * s.nx * (s.halfWidth + 18);
                const cy = s.y + outerSign * s.ny * (s.halfWidth + 18);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(s.angle);
                ctx.fillStyle = '#111';
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1.5;
                ctx.fillRect(-13, -7, 26, 14);
                ctx.strokeRect(-13, -7, 26, 14);
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffd700';
                ctx.font = 'bold 11px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(s.curvature > 0 ? '>>>' : '<<<', 0, 4);
                ctx.restore();
            }
        }
    }

    // 4. Draw Connected Neon Tire Skid Tracks
    skidMarks.forEach(sk => {
        ctx.save();
        ctx.strokeStyle = sk.color;
        ctx.globalAlpha = sk.alpha;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (sk.px1 !== undefined) {
            ctx.moveTo(sk.px1, sk.py1);
            ctx.lineTo(sk.x1, sk.y1);
            ctx.moveTo(sk.px2, sk.py2);
            ctx.lineTo(sk.x2, sk.y2);
        } else {
            ctx.moveTo(sk.x1, sk.y1);
            ctx.lineTo(sk.x1 + 1, sk.y1 + 1);
            ctx.moveTo(sk.x2, sk.y2);
            ctx.lineTo(sk.x2 + 1, sk.y2 + 1);
        }
        ctx.stroke();
        ctx.restore();
    });

    // 5. Draw Pickups (Coins & Nitro Orbs)
    pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'nitro') {
            ctx.fillStyle = '#00f3ff';
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#00f3ff';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#04060a';
            ctx.font = 'bold 12px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', 0, 4);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    });

    // 6. Draw Detailed "Horn OK Please" Ghat Cyber-Trucks
    trafficTrucks.forEach(tr => {
        if (tr.x === undefined) return;
        drawTrafficTruck(tr);
    });

    // 7. Draw Smoke & Sparks (Behind/Around Car)
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (!p.grow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 8. Draw Player Drift Vehicle
    drawPlayerCar();

    // 9. Draw Floating Callouts
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = `900 ${ft.size}px Outfit`;
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    ctx.restore();
}

function drawTrafficTruck(tr) {
    ctx.save();
    ctx.translate(tr.x, tr.y);
    ctx.rotate(tr.angle);

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(-21, -34, 42, 68, 8);
    ctx.fill();

    // 6 Protruding Heavy Truck Tires
    ctx.fillStyle = '#08090d';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    const wheelY = [-20, 8, 21];
    wheelY.forEach(wy => {
        ctx.fillRect(-20, wy - 5, 4, 10);
        ctx.strokeRect(-20, wy - 5, 4, 10);
        ctx.fillRect(16, wy - 5, 4, 10);
        ctx.strokeRect(16, wy - 5, 4, 10);
    });

    // Front Headlight Cones
    const hGrad = ctx.createLinearGradient(0, -32, 0, -90);
    hGrad.addColorStop(0, 'rgba(255, 230, 140, 0.25)');
    hGrad.addColorStop(1, 'rgba(255, 230, 140, 0)');
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.moveTo(-14, -32);
    ctx.lineTo(-28, -90);
    ctx.lineTo(28, -90);
    ctx.lineTo(14, -32);
    ctx.closePath();
    ctx.fill();

    // Chrome Front Bullbar Bumper
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -32);
    ctx.lineTo(16, -32);
    ctx.stroke();

    // Sculpted Driver Cab (Front Section)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = tr.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -31);
    ctx.lineTo(15, -31);
    ctx.lineTo(17, -12);
    ctx.lineTo(-17, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Split Front Windshield
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-13, -27, 11, 6);
    ctx.fillRect(2, -27, 11, 6);

    // Side Mirrors
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -24); ctx.lineTo(-21, -22);
    ctx.moveTo(16, -24);  ctx.lineTo(21, -22);
    ctx.stroke();

    // Colorful Indian Truck Cab Crown Lights
    ['#00f3ff', '#ffd700', '#39ff14', '#ff007f', '#00f3ff'].forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.fillRect(-12 + idx * 5.5, -20, 3.5, 3.5);
    });

    // Corrugated Decorated Cargo Bed (Rear Section)
    const bedGrad = ctx.createLinearGradient(-18, -11, 18, -11);
    bedGrad.addColorStop(0, '#140c1c');
    bedGrad.addColorStop(0.5, '#271736');
    bedGrad.addColorStop(1, '#140c1c');
    ctx.fillStyle = bedGrad;
    ctx.strokeStyle = tr.color;
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = tr.color;
    ctx.beginPath();
    ctx.roundRect(-17, -11, 34, 41, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cargo Roof Ribs & Colorful Truck-Art Inner Panel
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-12, -6, 24, 26);
    for (let ry = -2; ry <= 16; ry += 6) {
        ctx.beginPath();
        ctx.moveTo(-16, ry);
        ctx.lineTo(16, ry);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
    }

    // "HORN OK" Rear Signplate & Red Brake Tail-Lights
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 6.5px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('HORN OK', 0, 26);

    ctx.fillStyle = '#ff0044';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0044';
    ctx.fillRect(-15, 28, 7, 3);
    ctx.fillRect(8, 28, 7, 3);

    ctx.restore();
}

function drawWheel(x, y, w, h, angle, rimColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Rubber Tire
    ctx.fillStyle = '#090b10';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
    ctx.fill();
    ctx.stroke();
    // Glowing Alloy Rim Edge
    ctx.fillStyle = rimColor;
    ctx.fillRect(-w / 2 + 0.5, -h * 0.22, 1.5, h * 0.44);
    ctx.fillRect(w / 2 - 2, -h * 0.22, 1.5, h * 0.44);
    ctx.restore();
}

function drawPlayerCar() {
    const carCfg = VEHICLES[selectedCarKey] || VEHICLES.ghat800;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.heading + car.driftAngle);

    const primaryCol = nitroActiveTimer > 0
        ? `hsl(${Math.floor((Date.now() * 0.6) % 360)}, 100%, 60%)`
        : carCfg.color;
    const secondaryCol = carCfg.secondary;

    // 1. Shield Energy Bubble (if active)
    if (shields > 0 || shieldInvulnTimer > 0) {
        ctx.save();
        ctx.strokeStyle = shieldInvulnTimer > 0 ? '#ffd700' : 'rgba(57, 255, 20, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 2. Dual Volumetric Xenon Headlight Cones
    const beamGrad = ctx.createLinearGradient(0, -24, 0, -155);
    beamGrad.addColorStop(0, 'rgba(0, 243, 255, 0.34)');
    beamGrad.addColorStop(0.6, 'rgba(0, 243, 255, 0.08)');
    beamGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-12, -24);
    ctx.lineTo(-48, -155);
    ctx.lineTo(-4, -155);
    ctx.lineTo(-5, -24);
    ctx.moveTo(5, -24);
    ctx.lineTo(4, -155);
    ctx.lineTo(48, -155);
    ctx.lineTo(12, -24);
    ctx.closePath();
    ctx.fill();

    // 3. Soft Neon Underglow Aura beneath Chassis
    ctx.save();
    const underGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    underGrad.addColorStop(0, primaryCol);
    underGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = underGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Twin Exhaust Turbo Backfire Flames (During Drift or Nitro)
    if (nitroActiveTimer > 0 || Math.abs(car.driftAngle) > 0.2) {
        const flameLen = nitroActiveTimer > 0 ? (20 + Math.random() * 14) : (8 + Math.random() * 8);
        const flameCol = nitroActiveTimer > 0 ? '#00f3ff' : '#ff6600';
        [-6, 6].forEach(ex => {
            ctx.save();
            ctx.fillStyle = flameCol;
            ctx.shadowBlur = 12;
            ctx.shadowColor = flameCol;
            ctx.beginPath();
            ctx.moveTo(ex - 2.5, 25);
            ctx.lineTo(ex, 25 + flameLen);
            ctx.lineTo(ex + 2.5, 25);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    // Counter-steer angle for the front wheels!
    const steerWheelAngle = Math.max(-0.48, Math.min(0.48, -car.driftAngle * 0.65));

    // ========================================================================
    // VEHICLE MODEL A: CYBER AUTO-3W (Authentic 3-Wheeler Rickshaw Silhouette)
    // ========================================================================
    if (selectedCarKey === 'auto3w') {
        // Single Steerable Front Wheel + Dual Rear Wheels
        drawWheel(0, -23, 5.5, 11, steerWheelAngle, primaryCol);
        drawWheel(-14.5, 14, 6, 12, 0, primaryCol);
        drawWheel(14.5, 14, 6, 12, 0, primaryCol);

        // Front Mudguard & Fork Nose
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-5, -27, 10, 11, 4);
        ctx.fill();
        ctx.stroke();

        // Sculpted Triangular-Front Rickshaw Body Chassis
        ctx.fillStyle = '#141418';
        ctx.strokeStyle = primaryCol;
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = primaryCol;
        ctx.beginPath();
        ctx.moveTo(-7, -18);
        ctx.lineTo(7, -18);
        ctx.lineTo(14, -4);
        ctx.lineTo(15, 21);
        ctx.lineTo(-15, 21);
        ctx.lineTo(-14, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Curved Front Driver Windshield & Handlebar Bar
        ctx.fillStyle = 'rgba(0, 243, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(-9, -14);
        ctx.quadraticCurveTo(0, -18, 9, -14);
        ctx.lineTo(11, -8);
        ctx.lineTo(-11, -8);
        ctx.closePath();
        ctx.fill();

        // Yellow & Black Ribbed Canopy Roof
        const roofGrad = ctx.createLinearGradient(-13, 0, 13, 0);
        roofGrad.addColorStop(0, '#cca300');
        roofGrad.addColorStop(0.5, '#ffe033');
        roofGrad.addColorStop(1, '#cca300');
        ctx.fillStyle = roofGrad;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-12.5, -7, 25, 25, 6);
        ctx.fill();
        ctx.stroke();

        // Canopy Seam Ribs
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.2;
        [-1, 6, 13].forEach(ry => {
            ctx.beginPath();
            ctx.moveTo(-11.5, ry);
            ctx.lineTo(11.5, ry);
            ctx.stroke();
        });

        // Dual Round Chrome Headlamps + Rear Brake Lights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8.5, -16, 2.2, 0, Math.PI * 2);
        ctx.arc(8.5, -16, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0044';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0044';
        ctx.fillRect(-12, 20, 6, 2.5);
        ctx.fillRect(6, 20, 6, 2.5);

        ctx.restore();
        return;
    }

    // ========================================================================
    // VEHICLE MODEL B: HORN-OK RIG (Muscular 6-Wheel Racing Mountain Truck)
    // ========================================================================
    if (selectedCarKey === 'hornrig') {
        drawWheel(-16.5, -15, 6, 11, steerWheelAngle, primaryCol);
        drawWheel(16.5, -15, 6, 11, steerWheelAngle, primaryCol);
        drawWheel(-17, 8, 6.5, 11, 0, primaryCol);
        drawWheel(17, 8, 6.5, 11, 0, primaryCol);
        drawWheel(-17, 19, 6.5, 11, 0, primaryCol);
        drawWheel(17, 19, 6.5, 11, 0, primaryCol);

        // Chrome Front Bullbar
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-15, -26);
        ctx.lineTo(15, -26);
        ctx.stroke();

        // Muscular Cab + Rear Bed Silhouette
        const rigGrad = ctx.createLinearGradient(-16, 0, 16, 0);
        rigGrad.addColorStop(0, '#0b2912');
        rigGrad.addColorStop(0.5, '#194d25');
        rigGrad.addColorStop(1, '#0b2912');
        ctx.fillStyle = rigGrad;
        ctx.strokeStyle = primaryCol;
        ctx.lineWidth = 2.4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = primaryCol;
        ctx.beginPath();
        ctx.roundRect(-15.5, -24, 31, 49, 5);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cab Windshield & Dual Chrome Roof Horns
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-12, -20, 24, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-9, -13, 3, 6);
        ctx.fillRect(6, -13, 3, 6);

        // Decorated Orange/Gold Truck Art Cargo Deck
        ctx.fillStyle = secondaryCol;
        ctx.fillRect(-12, -4, 24, 25);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -2, 20, 21);

        ctx.fillStyle = '#ff0044';
        ctx.fillRect(-13, 23, 7, 3);
        ctx.fillRect(6, 23, 7, 3);

        ctx.restore();
        return;
    }

    // ========================================================================
    // VEHICLE MODELS C & D: GHAT 800 GT & TOUGE SUPRA X (Sculpted Sports Cars)
    // ========================================================================
    const isSupra = selectedCarKey === 'suprax';

    // 4 Protruding Rubber Tires (Front wheels visibly counter-steer!)
    drawWheel(-15.5, -14.5, 6, 12, steerWheelAngle, primaryCol);
    drawWheel(15.5, -14.5, 6, 12, steerWheelAngle, primaryCol);
    drawWheel(-16.2, 14.5, 6.8, 13, 0, primaryCol);
    drawWheel(16.2, 14.5, 6.8, 13, 0, primaryCol);

    // Front Carbon Aero Splitter Lip
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = primaryCol;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-11, -25);
    ctx.quadraticCurveTo(0, -28.5, 11, -25);
    ctx.lineTo(13, -22);
    ctx.lineTo(-13, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sculpted Hourglass Sports Car Body (Flared Fenders + Pinched Doors)
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#091326');
    bodyGrad.addColorStop(0.25, isSupra ? '#3b0a2c' : '#0f2942');
    bodyGrad.addColorStop(0.5, isSupra ? '#611046' : '#163e63');
    bodyGrad.addColorStop(0.75, isSupra ? '#3b0a2c' : '#0f2942');
    bodyGrad.addColorStop(1, '#091326');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = primaryCol;
    ctx.lineWidth = 2.4;
    ctx.shadowBlur = 14;
    ctx.shadowColor = primaryCol;

    ctx.beginPath();
    ctx.moveTo(-9, -25);               // Front left nose corner
    ctx.quadraticCurveTo(0, -27, 9, -25); // Curved front bumper
    ctx.lineTo(14.5, -19);             // Front-right fender flare start
    ctx.lineTo(15, -10);               // Front-right wheel arch
    ctx.lineTo(12.5, -2);              // Pinched right door waist
    ctx.lineTo(13, 7);                 // Rear-right intake flare
    ctx.lineTo(15.5, 12);              // Rear-right widebody arch
    ctx.lineTo(14.5, 22);              // Rear-right quarter panel
    ctx.lineTo(10, 25);                // Rear-right bumper corner
    ctx.lineTo(-10, 25);               // Rear-left bumper corner
    ctx.lineTo(-14.5, 22);             // Rear-left quarter panel
    ctx.lineTo(-15.5, 12);             // Rear-left widebody arch
    ctx.lineTo(-13, 7);                // Rear-left intake flare
    ctx.lineTo(-12.5, -2);             // Pinched left door waist
    ctx.lineTo(-15, -10);              // Front-left wheel arch
    ctx.lineTo(-14.5, -19);            // Front-left fender flare
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dual Center Racing Stripes along Hood & Trunk
    ctx.fillStyle = secondaryCol;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-4.5, -24.5, 3, 48);
    ctx.fillRect(1.5, -24.5, 3, 48);
    ctx.globalAlpha = 1.0;

    // Sculpted Hood Lines & Vents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -23); ctx.lineTo(-10, -11);
    ctx.moveTo(8, -23);  ctx.lineTo(10, -11);
    ctx.stroke();

    // Hood Air Scoop / Intercooler Vent
    ctx.fillStyle = '#05070e';
    ctx.beginPath();
    ctx.moveTo(-5, -18);
    ctx.lineTo(5, -18);
    ctx.lineTo(6.5, -14);
    ctx.lineTo(-6.5, -14);
    ctx.closePath();
    ctx.fill();

    // Protruding Side Wing Mirrors (Left & Right)
    ctx.fillStyle = primaryCol;
    ctx.beginPath();
    ctx.moveTo(-12.5, -7); ctx.lineTo(-17.5, -5.5); ctx.lineTo(-16.5, -3.5); ctx.lineTo(-12.5, -4.5);
    ctx.moveTo(12.5, -7);  ctx.lineTo(17.5, -5.5);  ctx.lineTo(16.5, -3.5);  ctx.lineTo(12.5, -4.5);
    ctx.closePath();
    ctx.fill();

    // Wrap-Around Angled Front Windshield Glass
    const glassGrad = ctx.createLinearGradient(-10, -11, 10, -2);
    glassGrad.addColorStop(0, '#0f172a');
    glassGrad.addColorStop(0.45, '#38bdf8');
    glassGrad.addColorStop(1, '#0c192c');
    ctx.fillStyle = glassGrad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9.5, -11);
    ctx.quadraticCurveTo(0, -12.5, 9.5, -11);
    ctx.lineTo(11, -3.5);
    ctx.quadraticCurveTo(0, -4.5, -11, -3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Roof Panel
    ctx.fillStyle = '#0b1324';
    ctx.strokeStyle = primaryCol;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-9.5, -3.5, 19, 12, 3);
    ctx.fill();
    ctx.stroke();

    // Fastback Rear Window with GT Louvers
    ctx.fillStyle = '#09101d';
    ctx.beginPath();
    ctx.moveTo(-9, 9);
    ctx.lineTo(9, 9);
    ctx.lineTo(7.5, 17.5);
    ctx.lineTo(-7.5, 17.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    [11.5, 14, 16.2].forEach(ly => {
        ctx.beginPath();
        ctx.moveTo(-7.5, ly);
        ctx.lineTo(7.5, ly);
        ctx.stroke();
    });

    // Rear GT Wing Spoiler Mounted on Struts
    ctx.fillStyle = '#05070d';
    ctx.strokeStyle = isSupra ? '#00f3ff' : primaryCol;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-6.5, 19.5, 2, 3.5);
    ctx.fillRect(4.5, 19.5, 2, 3.5);
    ctx.beginPath();
    ctx.roundRect(-14.5, 21, 29, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // Angled Xenon Headlight Lenses (Front)
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(-12.5, -21); ctx.lineTo(-7.5, -23.5); ctx.lineTo(-8, -20.5); ctx.closePath();
    ctx.moveTo(12.5, -21);  ctx.lineTo(7.5, -23.5);  ctx.lineTo(8, -20.5);  ctx.closePath();
    ctx.fill();

    // Glowing LED Afterburner Tail-Light Bar (Rear)
    ctx.fillStyle = '#ff0044';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0044';
    ctx.fillRect(-12.5, 23.5, 8.5, 2.5);
    ctx.fillRect(4, 23.5, 8.5, 2.5);

    ctx.restore();
}

// ============================================================================
// 10. MAIN LOOP, HUD & MENU CONTROLLERS
// ============================================================================
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const rawDt = timestamp - lastTime;
    lastTime = timestamp;
    const dt = Math.min(rawDt / 16.67, 2.5);

    if (gameState === 'playing') {
        update(dt);
    }
    draw();
    animationFrameId = requestAnimationFrame(loop);
}

function updateHUD() {
    if (uiScore) uiScore.textContent = score.toLocaleString();
    if (uiCombo) uiCombo.textContent = `x${currentCombo}`;
    if (uiCoins) uiCoins.textContent = (totalCoins).toLocaleString();

    if (gameMode === 'timeattack') {
        if (uiCenterStat) {
            uiCenterStat.innerHTML = `TIME: <span id="ui-hairpins">${timeLeft}s</span> (${hairpinsCleared}/12)`;
        }
    } else {
        if (uiCenterStat) {
            uiCenterStat.innerHTML = `HAIRPINS: <span id="ui-hairpins">${hairpinsCleared}</span>`;
        }
    }

    const biome = BIOMES[getCurrentBiomeIndex()];
    if (uiZoneBadge) {
        uiZoneBadge.textContent = biome.name;
        uiZoneBadge.style.borderColor = biome.railColor;
        uiZoneBadge.style.color = biome.railColor;
    }

    if (uiNitroFill) {
        const pct = nitroActiveTimer > 0 ? (nitroActiveTimer / 260) * 100 : nitroCharge;
        uiNitroFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
    if (btnNitro) {
        const isReady = nitroCharge >= 100 && nitroActiveTimer <= 0;
        btnNitro.classList.toggle('ready', isReady);
        btnNitro.textContent = nitroActiveTimer > 0 ? '🌈 OVERDRIVE!' : (isReady ? '⚡ NITRO READY!' : `⚡ ${Math.floor(nitroCharge)}%`);
    }

    if (uiShieldBadge) {
        uiShieldBadge.textContent = `🛡️ ${shields}`;
        uiShieldBadge.style.opacity = shields > 0 ? '1' : '0.45';
    }
}

function getRankForBest(best) {
    if (best >= 5000) return { label: '★ Ghat King', cls: 'rank-legend' };
    if (best >= 2500) return { label: '⚡ Touge Master', cls: 'rank-master' };
    if (best >= 800)  return { label: '🏎️ Drifter', cls: 'rank-drifter' };
    return { label: 'Rookie', cls: '' };
}

function refreshMenuAndGarage() {
    ['endless', 'timeattack', 'traffic'].forEach(m => {
        const bestVal = parseInt(localStorage.getItem(`ghatBest_${m}`)) || 0;
        const bestEl = document.getElementById(`best-${m}`);
        const rankEl = document.getElementById(`rank-${m}`);
        if (bestEl) bestEl.textContent = `🏆 Best: ${bestVal.toLocaleString()}`;
        if (rankEl) {
            const r = getRankForBest(bestVal);
            rankEl.textContent = r.label;
            rankEl.className = 'mode-rank' + (r.cls ? ' ' + r.cls : '');
        }
    });

    const walletEl = document.getElementById('menu-total-coins');
    if (walletEl) walletEl.textContent = totalCoins.toLocaleString();

    const careerHpEl = document.getElementById('ui-total-hairpins');
    if (careerHpEl) careerHpEl.textContent = `🏔️ ${totalHairpinsCareer} Hairpins Career`;

    document.querySelectorAll('.car-btn').forEach(btn => {
        const key = btn.getAttribute('data-car');
        const cfg = VEHICLES[key];
        if (!cfg) return;
        const unlocked = isCarUnlocked(key);
        btn.classList.toggle('locked', !unlocked);
        btn.classList.toggle('active', key === selectedCarKey && unlocked);
        const reqEl = document.getElementById(`car-req-${key}`);
        if (reqEl) {
            if (key === selectedCarKey && unlocked) reqEl.textContent = 'EQUIPPED';
            else if (unlocked) reqEl.textContent = '✓ READY';
            else reqEl.textContent = `🔒 ${cfg.reqCoins}🪙`;
        }
    });

    renderTrophyUI();
}

function endRun(title, subtitle) {
    gameState = 'gameover';
    synth.stopContinuousAudio();
    hudLayer.classList.add('hud-hidden');
    updateHubButton();

    const bestKey = `ghatBest_${gameMode}`;
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) {
        best = score;
        localStorage.setItem(bestKey, best);
    }

    document.getElementById('go-title').textContent = title || 'Cliff Wipeout!';
    document.getElementById('go-subtitle').textContent = subtitle || 'Master the hairpin release timing!';
    document.getElementById('go-score').textContent = score.toLocaleString();
    document.getElementById('go-best').textContent = best.toLocaleString();
    document.getElementById('go-hairpins').textContent = hairpinsCleared;
    document.getElementById('go-combo').textContent = `x${maxCombo}`;
    document.getElementById('go-cliffhangers').textContent = cliffhangersCount;
    document.getElementById('go-coins').textContent = `+${runCoins}`;

    refreshMenuAndGarage();
    gameOverMenu.classList.remove('hidden');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        synth.stopContinuousAudio();
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        synth.startContinuousAudio();
        lastTime = performance.now();
    }
}

function updateHubButton() {
    const btn = document.getElementById('hud-hub-btn');
    if (!btn) return;
    if (gameState === 'menu') {
        btn.textContent = '← Arcade Hub';
        refreshMenuAndGarage();
    } else {
        btn.textContent = '← Garage';
    }
}

function returnToArcadeHub() {
    try {
        if (window.top && window.top !== window && window.top.document && window.top.document.getElementById('sonora-hub-frame')) {
            window.top.document.getElementById('sonora-hub-frame').src = 'index.html';
            return;
        }
    } catch (e) {}
    try {
        if (window.parent && window.parent !== window) {
            window.parent.location.href = '../index.html';
            return;
        }
    } catch (e) {}
    window.location.href = '../index.html';
}

// ============================================================================
// 11. INPUT LISTENERS (Touch, Mouse, Keyboard, UI Buttons)
// ============================================================================
function setDriftHold(val) {
    input.driftHold = val;
    if (btnDriftHold) btnDriftHold.classList.toggle('drifting-active', val);
}

// Canvas Pointer Events (Tap & Hold to Drift; Double-Tap for Nitro)
let lastTapTime = 0;
canvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastTapTime < 260 && nitroCharge >= 100) {
        triggerNitro();
    }
    lastTapTime = now;
    setDriftHold(true);
});
window.addEventListener('pointerup', () => {
    if (input.driftHold) setDriftHold(false);
});
window.addEventListener('pointercancel', () => {
    if (input.driftHold) setDriftHold(false);
});

// Bottom Hold-to-Drift Button
if (btnDriftHold) {
    btnDriftHold.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (gameState === 'playing') setDriftHold(true);
    });
}

// Nitro Button
if (btnNitro) {
    btnNitro.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerNitro();
    });
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'playing') {
            e.preventDefault();
            setDriftHold(true);
        }
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        input.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        input.right = true;
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameState === 'playing') {
            e.preventDefault();
            triggerNitro();
        }
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
            e.preventDefault();
            togglePause();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        setDriftHold(false);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        input.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        input.right = false;
    }
});

// Mode Selection Buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        initGame(btn.getAttribute('data-mode'));
    });
});

// Garage Vehicle Selection
document.querySelectorAll('.car-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-car');
        if (isCarUnlocked(key)) {
            selectedCarKey = key;
            localStorage.setItem('ghatSelectedCar', key);
            synth.playApexBoost();
            refreshMenuAndGarage();
        } else {
            synth.playShieldBounce();
        }
    });
});

// Trophy Modal Controls
function openTrophyModal() {
    renderTrophyUI();
    trophyModal.classList.remove('hidden');
}
function closeTrophyModal() {
    trophyModal.classList.add('hidden');
}
btnTrophies?.addEventListener('click', openTrophyModal);
document.getElementById('btn-open-trophies')?.addEventListener('click', openTrophyModal);
document.getElementById('btn-close-trophies')?.addEventListener('click', closeTrophyModal);
document.getElementById('btn-back-from-trophies')?.addEventListener('click', closeTrophyModal);

// Pause / Resume / Restart / Menu
btnPause?.addEventListener('click', togglePause);
document.getElementById('btn-resume')?.addEventListener('click', togglePause);
document.getElementById('btn-restart')?.addEventListener('click', () => initGame(gameMode));

function goToGarageMenu() {
    synth.stopContinuousAudio();
    gameState = 'menu';
    hudLayer.classList.add('hud-hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    trophyModal.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    updateHubButton();
}
document.getElementById('btn-menu')?.addEventListener('click', goToGarageMenu);
document.getElementById('btn-quit')?.addEventListener('click', goToGarageMenu);

document.getElementById('hud-hub-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === 'menu') {
        returnToArcadeHub();
    } else {
        goToGarageMenu();
    }
});

// Mute Toggle
btnMute?.addEventListener('click', () => {
    synth.muted = !synth.muted;
    btnMute.textContent = synth.muted ? '🔇' : '🔊';
    if (synth.muted) synth.stopContinuousAudio();
    else if (gameState === 'playing') synth.startContinuousAudio();
});

// Social Share
function shareScore(platform) {
    const text = `I just drifted through ${hairpinsCleared} hairpin bends and scored ${score.toLocaleString()} (Max Combo x${maxCombo}) in Neon Ghat Drift: Mountain Dash 🏔️🏎️ at Arcade Hub! Can you beat my time?`;
    const url = 'https://arcadehubplay.com/play-neon-ghat-drift';
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
}
document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));

// Fullscreen Controller
function updateInGameFsUI(isFS) {
    if (btnFs) {
        btnFs.textContent = isFS ? '✕' : '⛶';
        btnFs.title = isFS ? 'Exit Fullscreen' : 'Toggle Fullscreen';
    }
}
btnFs?.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
        if (window.parent && window.parent !== window && typeof window.parent.toggleFullscreen === 'function') {
            window.parent.toggleFullscreen();
            return;
        }
    } catch (err) {}
    try {
        window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN' }, '*');
    } catch (err) {}
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
        document.exitFullscreen?.().catch(() => {});
    }
});
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'FULLSCREEN_CHANGE') {
        updateInGameFsUI(!!e.data.isFullscreen);
    }
});
document.addEventListener('fullscreenchange', () => {
    updateInGameFsUI(!!document.fullscreenElement);
});

// Boot Background Demo Road & Menu UI
resizeCanvas();
resetRoadGenerator();
car.x = roadSegments[8].x;
car.y = roadSegments[8].y;
refreshMenuAndGarage();
updateHubButton();
animationFrameId = requestAnimationFrame(loop);
