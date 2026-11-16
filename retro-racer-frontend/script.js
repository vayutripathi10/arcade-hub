/**
 * AudioFX - Custom Retro Racer Synthesizer
 */
class AudioFX {
    constructor() {
        this.ctx = null; this.masterGain = null; this.compressor = null;
        this.enabled = true; this.isMuted = false;
        try { this.isMuted = localStorage.getItem('arcadeHubMuted') === 'true'; } catch (e) {}
        this.engineOsc = null; this.engineGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.compressor = this.ctx.createDynamicsCompressor();
                this.masterGain = this.ctx.createGain();
                this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.5, this.ctx.currentTime);
                this.compressor.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        try { localStorage.setItem('arcadeHubMuted', this.isMuted); } catch (e) {}
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.5, this.ctx.currentTime, 0.05);
        }
    }

    createOscillator(freq, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.compressor || this.ctx.destination);
        return { osc, gain };
    }

    playJump() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const { osc, gain } = this.createOscillator(150, 'triangle');
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        osc.start(now); osc.stop(now + 0.25);
    }

    playEat() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'square');
            gain.gain.setValueAtTime(0.32, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.16);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.17);
        });
    }

    playPetrolAlert() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [660, 880].forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'triangle');
            gain.gain.setValueAtTime(0.22, now + i * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.11 + 0.1);
            osc.start(now + i * 0.11);
            osc.stop(now + i * 0.11 + 0.11);
        });
    }

    playLowFuelBeep() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const { osc, gain } = this.createOscillator(240, 'sawtooth');
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playGameOver() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const { osc, gain } = this.createOscillator(300, 'sawtooth');
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.frequency.linearRampToValueAtTime(50, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    }

    playVictory() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'square');
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.3);
        });
    }

    playLevelUp() {
        this.playVictory();
    }

    playExplosion() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        noise.start(); noise.stop(this.ctx.currentTime + 0.5);
    }

    startEngine() {
        if (!this.enabled) return; this.init(); if (!this.ctx || this.engineOsc) return;
        const { osc, gain } = this.createOscillator(80, 'triangle');
        this.engineOsc = osc; this.engineGain = gain;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.engineOsc.start();
    }

    updateEngine(speed) {
        if (!this.engineOsc || !this.ctx) return;
        const pitch = 80 + (speed * 0.8);
        this.engineOsc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.05);
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            const osc = this.engineOsc;
            setTimeout(() => { try { osc.stop(); } catch(e){} }, 200);
            this.engineOsc = null;
        }
    }
}
window.audioFX = new AudioFX();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const uiStage = document.getElementById('ui-stage');
const uiScore = document.getElementById('ui-score');
const uiLives = document.getElementById('ui-lives');
const uiTime = document.getElementById('ui-time');
const uiSpeed = document.getElementById('ui-speed');

const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');

// Game State Guard
let gameState = 'loading'; // loading, menu, playing, paused, gameover, stage_clear
let animFrame;
let lastTime = 0;

// Game Logic State
let score = 0;
let lives = 3;
let timer = 30;
let timeAccumulator = 0;
let speed = 60;
let runDistance = 0;

// Stage System
let currentStage = 1;
let stageDistanceTarget = 2800;
let finishLineY = -1;
let finishedStage = false;

// Entities
let player = { x: 0, y: 0, w: 40, h: 80, vx: 0 };
let obstacles = [];
let particles = [];
let floatingTexts = [];
let roadOffset = 0;

// Game Juice Globals
let screenShake = 0;
let flashColor = null;
let flashDuration = 0;
let speedLines = [];

// Assets
const images = {
    player: new Image(),
    enemy: new Image(),
    petrol: new Image()
};
const finalImages = {};
let assetsLoaded = false;

function startWhenReady() {
    const assetList = [images.player, images.enemy, images.petrol];
    let loadedCount = 0;
    const total = assetList.length;

    const onAssetLoad = () => {
        loadedCount++;
        if (loadedCount === total) {
            assetsLoaded = true;
            finalImages.player = makeTransparent(images.player);
            finalImages.enemy = makeTransparent(images.enemy);
            finalImages.petrol = makeTransparent(images.petrol);
            initUI();
            
            const wasPending = (gameState === 'playing_pending');
            if (wasPending) {
                initGame();
            } else {
                gameState = 'menu';
                resize();
            }
            animFrame = requestAnimationFrame(loop);
        }
    };

    assetList.forEach(img => {
        if (img.complete) onAssetLoad();
        else {
            img.onload = onAssetLoad;
            img.onerror = onAssetLoad; // Don't block on error
        }
    });
}

function makeTransparent(img) {
    if (!img || img.width === 0 || img.height === 0) {
        return img;
    }
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tCtx.drawImage(img, 0, 0);
        const imgData = tCtx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 50 && data[i+1] > 200 && data[i+2] < 50) data[i+3] = 0;
        }
        tCtx.putImageData(imgData, 0, 0);
        return tempCanvas;
    } catch(e) {
        console.warn("makeTransparent failed:", e);
        return img;
    }
}

// Screen bounds
let roadWidth = 300;
let grassWidth = 50;

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    
    // Internal logical resolution (Fixed)
    canvas.width = 400;
    canvas.height = 700;
    
    // Display scaling (Maintain Aspect Ratio)
    const containerRatio = rect.width / rect.height;
    const gameRatio = canvas.width / canvas.height;
    
    if (containerRatio > gameRatio) {
        // Container is wider than game
        canvas.style.height = rect.height + "px";
        canvas.style.width = (rect.height * gameRatio) + "px";
    } else {
        // Container is taller than game
        canvas.style.width = rect.width + "px";
        canvas.style.height = (rect.width / gameRatio) + "px";
    }
    
    roadWidth = canvas.width * 0.85; 
    grassWidth = (canvas.width - roadWidth) / 2;
    
    if (gameState === 'menu' || gameState === 'loading') {
        player.x = canvas.width / 2;
        player.y = canvas.height - 150;
    }
}
window.addEventListener('resize', resize);

// Monitor wrapper size changes (e.g. when ads load, screen rotates, overlay toggles) to dynamically adjust canvas aspect ratio
try {
    const resizeObserver = new ResizeObserver(() => {
        resize();
    });
    const wrapperElement = document.getElementById('gameWrapper');
    if (wrapperElement) {
        resizeObserver.observe(wrapperElement);
    }
} catch (e) {
    console.warn("ResizeObserver not supported:", e);
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
            if (window.parent.parent && window.parent.parent !== window.parent && window.parent.parent.document && window.parent.parent.document.getElementById('sonora-hub-frame')) {
                window.parent.parent.document.getElementById('sonora-hub-frame').src = 'index.html';
                return;
            }
            window.parent.location.href = '../index.html';
            return;
        }
    } catch (e) {}
    window.location.href = '../index.html';
}

function initUI() {
    // Hub Button
    document.getElementById('hub-btn')?.addEventListener('click', () => {
        console.log('hub clicked');
        returnToArcadeHub();
    });

    document.getElementById('btn-start').addEventListener('click', initGame);
    document.getElementById('btn-restart').addEventListener('click', initGame);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    
    document.getElementById('btn-menu').addEventListener('click', () => {
        gameOverMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameState = 'menu';
    });
    
    document.getElementById('btn-quit').addEventListener('click', () => {
        pauseMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameState = 'menu';
        document.getElementById('btn-pause').classList.add('hidden');
    });

    const btnMute = document.getElementById('btn-mute');
    if (btnMute && window.audioFX) {
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioFX) {
            window.audioFX.init();
            window.audioFX.toggleMute();
            btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
            console.log('sound toggled, muted:', window.audioFX.isMuted);
        } else {
            console.warn('audioFX not found');
        }
    });

    document.getElementById('btn-howtoplay').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
    document.getElementById('btn-close-htp').addEventListener('click', () => howToPlayModal.classList.add('hidden'));

    // Ad Observer
    const adBox = document.getElementById('ad-box');
    if (adBox) {
        const observer = new MutationObserver(() => {
            if (adBox.innerHTML.trim() !== '') adBox.classList.add('ad-loaded');
        });
        observer.observe(adBox, { childList: true, subtree: true });
    }
}

// Input handling
const keys = { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false };
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
    if (e.code === 'Escape' && gameState === 'playing') togglePause();
});
window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

let touchX = null;
canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
canvas.addEventListener('touchmove', e => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    player.x += (currentX - touchX) * 1.5;
    touchX = currentX;
}, {passive:false});
canvas.addE// Stage & Fuel Alignment Globals
let fuel = 100; // 0 to 100%
let fuelDrainPerUnit = 0.06;
let petrolSchedule = [];
let nextPetrolIndex = 0;
let requiredPetrolCount = 2;
let totalStagePetrolCount = 2;
let collectedPetrolThisStage = 0;
let missedPetrolThisStage = 0;
let outOfFuelStopTimer = 0;
let lowFuelBeepTimer = 0;
const PETROL_REFILL_AMOUNT = 46; // +46% fuel per Petrol Truck

function configureStageFuelAndSchedule(stage) {
    currentStage = stage;
    stageDistanceTarget = 2600 + (stage - 1) * 600;
    runDistance = 0;
    finishLineY = -1;
    finishedStage = false;
    obstacles = [];
    outOfFuelStopTimer = 0;
    collectedPetrolThisStage = 0;
    missedPetrolThisStage = 0;
    nextPetrolIndex = 0;

    // Stage 1: Give exactly 2 Petrol Trucks; player MUST collect both (2/2) to finish Stage 1!
    // Stage 2+: Give requiredPetrolCount + 1 extra backup Petrol Truck!
    if (stage === 1) {
        requiredPetrolCount = 2;
        totalStagePetrolCount = 2;
    } else {
        requiredPetrolCount = 2 + Math.floor((stage - 1) / 2);
        totalStagePetrolCount = requiredPetrolCount + 1; // +1 extra truck in Stage 2+
    }

    // Always start each stage with a full 100% Fuel Tank
    fuel = 100;

    // Calculate fuel drain rate so that:
    // - Collecting (requiredPetrolCount - 1) trucks leaves the player ~18% short of the finish line (car slows & stops!).
    // - Collecting requiredPetrolCount trucks lets the player cross the finish line with ~22% fuel to spare!
    const totalFuelNeededForStage = 100 + (requiredPetrolCount * PETROL_REFILL_AMOUNT) - 24;
    fuelDrainPerUnit = totalFuelNeededForStage / stageDistanceTarget;

    // Schedule Petrol Trucks at evenly spaced distance milestones along the stage
    petrolSchedule = [];
    if (stage === 1) {
        petrolSchedule.push(stageDistanceTarget * 0.30);
        petrolSchedule.push(stageDistanceTarget * 0.64);
    } else {
        for (let i = 0; i < totalStagePetrolCount; i++) {
            const frac = (i + 0.65) / (totalStagePetrolCount + 0.45);
            petrolSchedule.push(stageDistanceTarget * frac);
        }
    }
}

function initGame() {
    if (!assetsLoaded) {
        gameState = 'playing_pending';
        mainMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        pauseMenu.classList.add('hidden');
        document.getElementById('btn-pause').classList.remove('hidden');
        return;
    }
    score = 0;
    lives = 3;
    speed = 65;
    particles = [];
    floatingTexts = [];
    roadOffset = 0;
    screenShake = 0;
    flashColor = null;
    flashDuration = 0;
    speedLines = [];

    configureStageFuelAndSchedule(1);
    timer = Math.ceil(fuel);

    player.x = canvas.width / 2;
    player.y = canvas.height - 150;

    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');

    gameState = 'playing';
    if (window.audioFX) {
        window.audioFX.init();
        window.audioFX.playJump();
        if (window.audioFX.startEngine) window.audioFX.startEngine();
    }
    lastTime = performance.now();
}

function startNextStage() {
    configureStageFuelAndSchedule(currentStage);
    speed = Math.max(speed, 75);
    gameState = 'playing';
    if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    lastTime = performance.now();
    updateHUD();
}

function spawnScheduledPetrolTruck() {
    const lanes = 3;
    const laneWidth = roadWidth / lanes;

    // Pick a lane that isn't blocked by a nearby enemy car at the top
    const candidateLanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    let chosenLane = candidateLanes[0];
    for (const ln of candidateLanes) {
        const laneCenterX = grassWidth + ln * laneWidth + laneWidth / 2;
        const blocked = obstacles.some(o => o.active && o.y < 160 && Math.abs(o.x - laneCenterX) < laneWidth * 0.6);
        if (!blocked) {
            chosenLane = ln;
            break;
        }
    }

    const x = grassWidth + (chosenLane * laneWidth) + (laneWidth / 2);
    // Clear any overlapping enemy at spawn height so petrol truck is never hidden inside an enemy car
    obstacles.forEach(o => {
        if (o.active && o.type === 'enemy' && o.y < 80 && Math.abs(o.x - x) < laneWidth * 0.7) {
            o.active = false;
        }
    });

    obstacles.push({
        type: 'petrol',
        lane: chosenLane,
        x: x,
        y: -110,
        w: 40,
        h: 76,
        vx: 0,
        speed: 35,
        active: true,
        crashed: false
    });

    if (window.audioFX && window.audioFX.playPetrolAlert) {
        window.audioFX.playPetrolAlert();
    }
    spawnFloatingText(canvas.width / 2, 115, '⛽ PETROL TRUCK AHEAD! HIT IT!', '#00ffcc');
}

function spawnEnemyObstacle() {
    for (const obs of obstacles) {
        if (obs.active && obs.y < 65) return;
    }
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    const lane = Math.floor(Math.random() * lanes);
    const variance = (Math.random() - 0.5) * (laneWidth * 0.65);
    const x = grassWidth + (lane * laneWidth) + (laneWidth / 2) + variance;

    // Do not spawn an enemy right on top of an active petrol truck
    const nearPetrol = obstacles.some(o => o.active && o.type === 'petrol' && o.y < 180 && Math.abs(o.x - x) < laneWidth * 0.85);
    if (nearPetrol) return;

    let vx = 0;
    if (currentStage >= 2 && Math.random() < 0.35) {
        vx = (Math.random() > 0.5 ? 1 : -1) * (25 + (currentStage * 12));
    }

    obstacles.push({
        type: 'enemy',
        x: x,
        y: -100,
        w: 35,
        h: 70,
        vx: vx,
        speed: speed * 0.38 + (Math.random() * 18) + (currentStage * 4),
        active: true,
        crashed: false
    });
}

function updateHUD() {
    if (uiStage) uiStage.textContent = currentStage;
    uiScore.textContent = Math.floor(score);
    uiLives.textContent = lives;
    const fuelPct = Math.max(0, Math.ceil(fuel));
    timer = fuelPct;
    uiTime.textContent = fuelPct + '%';
    uiSpeed.textContent = Math.floor(speed);

    if (fuelPct <= 25) uiTime.style.color = '#ff0055';
    else if (fuelPct <= 50) uiTime.style.color = '#ffaa00';
    else uiTime.style.color = '#00ffcc';

    const pFill = document.getElementById('ui-progress-fill');
    if (pFill) {
        let pct = Math.min(100, Math.max(0, (runDistance / stageDistanceTarget) * 100));
        pFill.style.width = pct + '%';
    }
}

function gameOver(reasonText) {
    gameState = 'gameover';
    document.getElementById('btn-pause').classList.add('hidden');
    if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();

    const bestKey = 'retroRacerBest';
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) {
        best = Math.floor(score);
        localStorage.setItem(bestKey, best);
    }

    document.getElementById('go-score').textContent = Math.floor(score);
    document.getElementById('go-best').textContent = best;
    document.getElementById('go-title').textContent = reasonText || ((lives <= 0) ? 'CRASHED OUT!' : 'OUT OF PETROL!');

    if (score > 5000 && window.achievements) window.achievements.unlock('racer', 'score_5000', 'Speed Demon');

    gameOverMenu.classList.remove('hidden');
    if (window.audioFX && window.audioFX.playGameOver) window.audioFX.playGameOver();
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
        if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    }
}

function update(deltaTime) {
    if (screenShake > 0) screenShake -= deltaTime * 0.5;
    if (flashDuration > 0) flashDuration -= deltaTime;

    if (gameState !== 'playing') return;

    const dtSeconds = deltaTime * 0.01667;
    const maxSpeed = Math.min(230, 140 + (currentStage * 18));

    // Speed & Fuel Physics:
    // If fuel > 0, accelerate up to cruising speed (or slightly reduced power when fuel <= 20%).
    // If fuel <= 0, the engine sputters and the car gradually slows down and stops!
    if (fuel > 0) {
        outOfFuelStopTimer = 0;
        const lowFuelFactor = fuel <= 20 ? 0.78 : 1.0;
        const targetSpd = Math.min(maxSpeed, 95 + (score / 120)) * lowFuelFactor;
        speed += (targetSpd - speed) * 0.08 * deltaTime;

        if (fuel <= 22) {
            lowFuelBeepTimer += dtSeconds;
            if (lowFuelBeepTimer >= 1.1) {
                lowFuelBeepTimer = 0;
                if (window.audioFX && window.audioFX.playLowFuelBeep) window.audioFX.playLowFuelBeep();
            }
        }
    } else {
        // Out of petrol: gradually decelerate to 0 MPH!
        fuel = 0;
        speed = Math.max(0, speed - 34 * dtSeconds);

        // Sputtering dark exhaust smoke while slowing down
        if (speed > 2 && Math.random() < 0.35 * deltaTime) {
            particles.push({
                x: player.x + (Math.random() - 0.5) * 16,
                y: player.y + player.h / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: 1.5 + Math.random() * 1.5,
                life: 0.9,
                color: 'rgba(90, 90, 90, 0.65)',
                size: Math.random() * 6 + 4
            });
        }

        if (speed <= 0.8) {
            speed = 0;
            outOfFuelStopTimer += dtSeconds;
            if (outOfFuelStopTimer >= 0.85) {
                gameOver('OUT OF PETROL!');
                return;
            }
        }
    }

    if (window.audioFX && window.audioFX.updateEngine) {
        window.audioFX.updateEngine(speed);
    }

    // Steering responsiveness scales so a completely stopped car cannot slide sideways across lanes
    const steerRatio = Math.min(1, Math.max(0.15, speed / 55));
    if (keys.ArrowLeft || keys.KeyA) player.x -= 5.2 * steerRatio * deltaTime;
    if (keys.ArrowRight || keys.KeyD) player.x += 5.2 * steerRatio * deltaTime;

    if (player.x < grassWidth + player.w / 2) player.x = grassWidth + player.w / 2;
    if (player.x > canvas.width - grassWidth - player.w / 2) player.x = canvas.width - grassWidth - player.w / 2;

    const scrollAmount = speed * (deltaTime / 6.0);
    roadOffset += scrollAmount;

    // Distance advances proportional to actual car speed!
    const distDelta = (speed / 95) * 105 * dtSeconds;
    runDistance += distDelta;

    // Drain fuel proportional to distance traveled
    if (fuel > 0 && !finishedStage) {
        fuel = Math.max(0, fuel - distDelta * fuelDrainPerUnit);
    }

    // Check Scheduled Petrol Truck Spawns for this Stage
    if (nextPetrolIndex < petrolSchedule.length && runDistance >= petrolSchedule[nextPetrolIndex]) {
        nextPetrolIndex++;
        spawnScheduledPetrolTruck();
    }

    // Spawn finish line 80 units of distance early so it rolls down naturally with the road
    if (runDistance >= stageDistanceTarget - 80 && !finishedStage) {
        if (finishLineY === -1) {
            finishLineY = player.y - 800;
        }
        finishLineY += scrollAmount;

        if (finishLineY > player.y && !finishedStage) {
            finishedStage = true;
            gameState = 'stage_clear';
            if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
            if (window.audioFX && window.audioFX.playVictory) window.audioFX.playVictory();
            score += 1000 * currentStage;
            setTimeout(() => {
                gameState = 'stage_starting';
                currentStage++;
                setTimeout(startNextStage, 2000);
            }, 2000);
            return;
        }
    } else if (speed > 25) {
        if (Math.random() < (0.018 + (speed / 12000))) spawnEnemyObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        if (!obs.active) {
            obstacles.splice(i, 1);
            continue;
        }
        // Obstacles move down screen based on road scroll speed
        const relScroll = obs.type === 'petrol'
            ? Math.max(1.6, speed * 0.038) * deltaTime
            : Math.max(1.2, speed * 0.048) * deltaTime;
        obs.y += relScroll;

        if (obs.y > canvas.height + 90) {
            if (obs.type === 'petrol' && !obs.crashed) {
                missedPetrolThisStage++;
                spawnFloatingText(canvas.width / 2, player.y - 60, '⚠️ MISSED PETROL TRUCK!', '#ff3355');
            }
            obs.active = false;
            continue;
        }

        if (obs.vx) {
            obs.x += obs.vx * dtSeconds;
            if (obs.x < grassWidth + obs.w) { obs.x = grassWidth + obs.w; obs.vx *= -1; }
            if (obs.x > canvas.width - grassWidth - obs.w) { obs.x = canvas.width - grassWidth - obs.w; obs.vx *= -1; }
        }

        if (!obs.crashed) {
            const padding = obs.type === 'petrol' ? 4 : 10; // Generous hitbox for collecting Petrol Trucks
            if (Math.abs(player.x - obs.x) < (player.w / 2 + obs.w / 2 - padding) &&
                Math.abs(player.y - obs.y) < (player.h / 2 + obs.h / 2 - padding)) {
                obs.crashed = true;
                if (obs.type === 'enemy') {
                    lives--;
                    if (window.audioFX && window.audioFX.playExplosion) window.audioFX.playExplosion();
                    createExplosion(player.x, player.y - player.h / 2);
                    obs.active = false;

                    screenShake = 12;
                    flashColor = 'rgba(255, 0, 85, 0.45)';
                    flashDuration = 10;

                    if (lives <= 0) {
                        gameOver('CRASHED OUT!');
                        return;
                    }
                } else if (obs.type === 'petrol') {
                    fuel = Math.min(100, fuel + PETROL_REFILL_AMOUNT);
                    collectedPetrolThisStage++;
                    score += 250;
                    obs.active = false;
                    if (window.audioFX && window.audioFX.playEat) window.audioFX.playEat();
                    spawnFloatingText(player.x, player.y - 45, `⛽ +PETROL! (${collectedPetrolThisStage}/${requiredPetrolCount})`, '#00ffcc');

                    flashColor = 'rgba(0, 255, 204, 0.28)';
                    flashDuration = 7;

                    if (window.achievements) window.achievements.unlock('racer', 'fuel_up', 'Gas Guzzler');
                }
            }
        }
    }

    // Update speed lines
    for (let i = speedLines.length - 1; i >= 0; i--) {
        let line = speedLines[i];
        line.y += line.speed * deltaTime;
        if (line.y > canvas.height + 100) speedLines.splice(i, 1);
    }

    if (speed > 110 && Math.random() < 0.15 * deltaTime) {
        const isLeft = Math.random() > 0.5;
        const minX = isLeft ? 5 : canvas.width - grassWidth + 5;
        const maxX = isLeft ? grassWidth - 5 : canvas.width - 5;
        const x = minX + Math.random() * (maxX - minX);
        speedLines.push({
            x: x,
            y: -150,
            length: 40 + Math.random() * 60,
            speed: speed * 0.15 + Math.random() * 5
        });
    }

    // Exhaust flames when fuel > 0 and moving fast
    if (fuel > 0 && speed > 40 && Math.random() < 0.3 * deltaTime) {
        const lx = player.x - 12;
        const rx = player.x + 12;
        const ly = player.y + player.h / 2;
        particles.push({
            x: lx, y: ly,
            vx: (Math.random() - 0.5) * 1,
            vy: 2 + Math.random() * 2,
            life: 0.6 + Math.random() * 0.4,
            color: Math.random() > 0.4 ? '#ff3300' : '#ffaa00',
            size: Math.random() * 3 + 2
        });
        particles.push({
            x: rx, y: ly,
            vx: (Math.random() - 0.5) * 1,
            vy: 2 + Math.random() * 2,
            life: 0.6 + Math.random() * 0.4,
            color: Math.random() > 0.4 ? '#ff3300' : '#ffaa00',
            size: Math.random() * 3 + 2
        });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.y += speed * 0.008 * deltaTime;
        p.life -= 0.02 * deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let t = floatingTexts[i];
        t.y -= 1 * deltaTime;
        t.life -= 0.018 * deltaTime;
        if (t.life <= 0) floatingTexts.splice(i, 1);
    }

    score += speed * dtSeconds;
    updateHUD();
}

function createExplosion(x, y) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
            life: 1.0, color: Math.random() > 0.5 ? '#ff6600' : '#ff0000', size: Math.random() * 6 + 4
        });
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1.0 });
}

function draw() {
    ctx.save();

    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
    }

    ctx.fillStyle = '#00a800';
    ctx.fillRect(0, 0, grassWidth, canvas.height);
    ctx.fillRect(canvas.width - grassWidth, 0, grassWidth, canvas.height);

    ctx.fillStyle = '#3a3d45';
    ctx.fillRect(grassWidth, 0, roadWidth, canvas.height);

    let dashLen = 40;
    let gapLen = 40;
    if (speed > 120 && speed <= 180) {
        dashLen = 80;
        gapLen = 80;
    } else if (speed > 180) {
        dashLen = 160;
        gapLen = 100;
    }
    const period = dashLen + gapLen;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([dashLen, gapLen]);
    ctx.lineDashOffset = -(roadOffset % period);

    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    for (let i = 1; i < lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(grassWidth + i * laneWidth, 0);
        ctx.lineTo(grassWidth + i * laneWidth, canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    if (finishLineY > -1) {
        const sqSize = 25;
        let toggle = false;
        for (let x = grassWidth; x < canvas.width - grassWidth; x += sqSize) {
            for (let y = finishLineY; y < finishLineY + sqSize * 3; y += sqSize) {
                ctx.fillStyle = toggle ? '#ffffff' : '#000000';
                ctx.fillRect(x, y, Math.min(sqSize, canvas.width - grassWidth - x), sqSize);
                toggle = !toggle;
            }
            toggle = !toggle;
        }
    }

    // Draw Obstacles & Highlighted Petrol Trucks
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
    let activePetrolObs = null;

    for (const obs of obstacles) {
        if (obs.type === 'petrol') {
            activePetrolObs = obs;
            ctx.save();
            // Glowing green/gold target ring beneath Petrol Truck so user knows to collide with it!
            ctx.strokeStyle = pulse > 0.5 ? '#00ffcc' : '#ffd700';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#00ffcc';
            ctx.beginPath();
            ctx.ellipse(obs.x, obs.y, obs.w * 0.72, obs.h * 0.64, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        const img = obs.type === 'enemy' ? finalImages.enemy : finalImages.petrol;
        if (img) {
            ctx.drawImage(img, obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
        }

        // Prominent floating "⛽ PETROL" indicator badge directly above the Petrol Truck!
        if (obs.type === 'petrol') {
            ctx.save();
            const bounceOffset = Math.sin(Date.now() * 0.012) * 4;
            const badgeY = obs.y - obs.h / 2 - 26 + bounceOffset;

            // Pill background
            ctx.fillStyle = 'rgba(0, 20, 15, 0.92)';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffcc';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(obs.x - 42, badgeY - 14, 84, 22, 6);
            } else {
                ctx.rect(obs.x - 42, badgeY - 14, 84, 22);
            }
            ctx.fill();
            ctx.stroke();

            // "⛽ PETROL" Label
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffd700';
            ctx.font = '900 11px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⛽ PETROL', obs.x, badgeY + 1);

            // Pointer arrow pointing down to the truck
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.fillText('▼', obs.x, badgeY + 14);
            ctx.restore();
        }
    }

    // Draw Player Car
    if (finalImages.player) {
        ctx.drawImage(finalImages.player, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
    }

    // Draw Speed Lines
    if (speed > 120) {
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
        ctx.lineWidth = 1.5;
        for (const line of speedLines) {
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x, line.y + line.length);
            ctx.stroke();
        }
    }

    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // On-Canvas Top Fuel Bar & Stage Petrol Requirement Tracker
    if (gameState === 'playing' || gameState === 'paused') {
        ctx.save();
        // Top HUD Status Strip on Road
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(grassWidth + 6, 8, roadWidth - 12, 34);
        ctx.strokeStyle = fuel <= 25 ? '#ff0055' : 'rgba(0, 255, 204, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(grassWidth + 6, 8, roadWidth - 12, 34);

        // Fuel Bar Track
        const barX = grassWidth + 14;
        const barY = 26;
        const barW = 135;
        const barH = 10;
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barW, barH);

        const fuelColor = fuel <= 25 ? '#ff0055' : (fuel <= 50 ? '#ffaa00' : '#00ffcc');
        ctx.fillStyle = fuelColor;
        ctx.fillRect(barX, barY, barW * (Math.max(0, fuel) / 100), barH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⛽ FUEL: ${Math.ceil(fuel)}%`, barX, 21);

        // Stage Petrol Truck Goal Counter on Right
        ctx.textAlign = 'right';
        const reqDone = collectedPetrolThisStage >= requiredPetrolCount;
        ctx.fillStyle = reqDone ? '#00ff88' : '#ffd700';
        ctx.font = '800 10.5px "Outfit", sans-serif';
        ctx.fillText(`STAGE ${currentStage} PETROL: ${collectedPetrolThisStage}/${requiredPetrolCount}`, grassWidth + roadWidth - 14, 21);

        ctx.fillStyle = '#cccccc';
        ctx.font = '600 9px "Outfit", sans-serif';
        ctx.fillText(reqDone ? '✓ FUEL READY FOR FINISH' : 'HIT ⛽ TRUCK TO REFUEL', grassWidth + roadWidth - 14, 34);

        // Incoming Petrol Truck Lane Indicator Banner
        if (activePetrolObs && activePetrolObs.y < player.y) {
            ctx.fillStyle = pulse > 0.5 ? '#00ffcc' : '#ffd700';
            ctx.font = '900 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▼ ⛽ PETROL TRUCK IN LANE — COLLIDE TO REFUEL! ▼', canvas.width / 2, 58);
        }

        // Low Fuel / Out of Petrol Slowdown Warning
        if (fuel <= 0) {
            ctx.fillStyle = 'rgba(255, 0, 60, 0.88)';
            ctx.fillRect(grassWidth + 16, player.y - 95, roadWidth - 32, 32);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 12.5px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(speed > 1 ? '⛽ OUT OF PETROL! SLOWING DOWN...' : '🛑 OUT OF PETROL — STOPPED!', canvas.width / 2, player.y - 75);
        } else if (fuel <= 22 && pulse > 0.35) {
            ctx.fillStyle = '#ff3355';
            ctx.font = '900 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ LOW PETROL! CATCH NEXT ⛽ PETROL TRUCK!', canvas.width / 2, player.y - 68);
        }
        ctx.restore();
    }

    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    for (const t of floatingTexts) {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;

    if (gameState === 'stage_clear' || gameState === 'stage_starting') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        let msg = gameState === 'stage_clear' ? `STAGE ${currentStage} CLEAR!` : `STAGE ${currentStage} STARTING...`;
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2 - 12);
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        const subMsg = gameState === 'stage_clear'
            ? `⛽ Petrol Collected: ${collectedPetrolThisStage}/${requiredPetrolCount} • Bonus +${1000 * currentStage}`
            : `Collect at least ${2 + Math.floor((currentStage - 1) / 2)} ⛽ Petrol Trucks to finish Stage ${currentStage}!`;
        ctx.fillText(subMsg, canvas.width / 2, canvas.height / 2 + 18);
    }

    ctx.restore();

    if (flashDuration > 0 && flashColor) {
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    const deltaTime = Math.min(dt / 16.67, 3);
    
    if (gameState !== 'loading') {
        update(deltaTime);
        draw();
    }
    animFrame = requestAnimationFrame(loop);
}

// Asset pre-load
images.player.src = 'player.png';
images.enemy.src = 'enemy.png';
images.petrol.src = 'petrol.png';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
} else {
    startWhenReady();
}
