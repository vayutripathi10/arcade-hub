// === NEON ZEN SNAKE ENGINE ===
// Built with sub-grid 120 FPS linear interpolation, Web Audio Synth, and dual modes.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const multiplierContainer = document.getElementById('multiplier-container');
const multiplierElement = document.getElementById('multiplier');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');
const activePowerupsHud = document.getElementById('active-powerups-hud');

// Game Constants
const gridSize = 20;
let tileCount = 20;

// Game State
let snake = []; // elements: {x, y, px, py} (px/py are previous grid coordinates for LERP)
let food = { x: 12, y: 12 };
let powerup = null; // {x, y, type: 'chrono' | 'shield' | 'magnet', px, py}
let obstacles = []; // array of {x, y}

let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('neonSnakeHighScore') || 0;
let gameRunning = false;
let isPaused = false;
let mode = 'zen'; // 'zen' or 'arcade'

// Engine Speed Variables (in ms per grid tick)
let baseSpeed = 200; 
let currentTickSpeed = 200;
const minSpeed = 65;

// Timing & LERP variables
let lastTickTime = 0;
let moveAccumulator = 0;

// Arcade Combo Multiplier
let lastEatTime = 0;
let comboCount = 0;
let multiplier = 1.0;

// Power-Up States
let activePowerups = {
    chrono: 0, // duration remaining in ms
    shield: 0, // 1 if active, 0 if not
    magnet: 0  // duration remaining in ms
};

// Aesthetics & Particles
let particles = [];
let backdropStars = [];
let gridPulseAngle = 0;

// Web Audio API Synthesizer Context
let synthCtx = null;
let synthGain = null;
let droneOscs = [];
let droneGain = null;

highScoreElement.textContent = highScore;

// --- INITIALIZATION ---
function initGame() {
    resizeCanvas();
    
    // Hub Button
    document.getElementById('hub-btn')?.addEventListener('click', () => {
        stopSynthDrone();
        window.location.href = '../index.html';
    });

    startBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Mobile virtual controls (touch & mouse click)
    const setControl = (id, dir) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleDirection(dir); }, {passive: false});
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleDirection(dir); });
        }
    };
    setControl('upBtn', 'arrowup');
    setControl('downBtn', 'arrowdown');
    setControl('leftBtn', 'arrowleft');
    setControl('rightBtn', 'arrowright');

    // Pause Controls
    pauseBtn?.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
    btnResume?.addEventListener('click', (e) => { e.stopPropagation(); togglePause(false); });
    
    btnQuit?.addEventListener('click', (e) => {
        e.stopPropagation();
        quitToMenu();
    });

    // Mute Controller
    btnMute?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioFX) {
            window.audioFX.toggleMute();
            btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
        }
        toggleSynthVolume();
    });

    // How to Play operations
    document.getElementById('htp-btn')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.add('active');
    });
    document.getElementById('htp-close')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.remove('active');
    });

    // Mode choices on main overlay card
    document.getElementById('choose-zen')?.addEventListener('click', () => {
        selectMode('zen');
    });
    document.getElementById('choose-arcade')?.addEventListener('click', () => {
        selectMode('arcade');
    });

    // Ad Space Resize Observer
    const adBox = document.getElementById('ad-box');
    if (adBox) {
        const observer = new MutationObserver(() => {
            if (adBox.innerHTML.trim() !== '') {
                adBox.classList.add('ad-loaded');
                resizeCanvas();
            }
        });
        observer.observe(adBox, { childList: true, subtree: true });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning && !isPaused) togglePause(true);
    });

    // Prepopulate background stars
    initBackdropStars();
}

function selectMode(targetMode) {
    mode = targetMode;
    document.getElementById('choose-zen').classList.remove('active');
    document.getElementById('choose-arcade').classList.remove('active');
    if (mode === 'zen') {
        document.getElementById('choose-zen').classList.add('active');
    } else {
        document.getElementById('choose-arcade').classList.add('active');
    }
    
    // Play synthesizer confirmation tick
    playSynthChime([mode === 'zen' ? 329.63 : 440.00], 'sine', 0.15);
}

function resizeCanvas() {
    const root = document.querySelector('.game-root');
    const header = document.querySelector('.header');
    const adBox = document.getElementById('ad-box');
    
    if (!root || !header) return;
    
    const availableW = root.clientWidth - 40;
    const availableH = root.clientHeight - header.offsetHeight - (adBox?.classList.contains('ad-loaded') ? adBox.offsetHeight : 0) - 40;
    
    const side = Math.min(availableW, availableH, 400);
    canvas.width = side;
    canvas.height = side;
    tileCount = Math.floor(side / gridSize);
}
window.addEventListener('resize', resizeCanvas);

// --- DYNAMIC AUDIO SYNTHESIZER ---
function initSynth() {
    if (synthCtx) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        synthCtx = new AudioCtx();
        synthGain = synthCtx.createGain();
        synthGain.connect(synthCtx.destination);
        
        const initialVol = (window.audioFX && window.audioFX.isMuted) ? 0 : 0.4;
        synthGain.gain.setValueAtTime(initialVol, synthCtx.currentTime);
    } catch (e) {
        console.warn("Synth initialization failed", e);
    }
}

function toggleSynthVolume() {
    if (!synthCtx || !synthGain) return;
    const targetVal = (window.audioFX && window.audioFX.isMuted) ? 0 : 0.4;
    synthGain.gain.setTargetAtTime(targetVal, synthCtx.currentTime, 0.1);
}

function playSynthChime(notes, type = 'sine', duration = 0.25, gainVal = 0.3) {
    initSynth();
    if (!synthCtx || (window.audioFX && window.audioFX.isMuted)) return;

    const now = synthCtx.currentTime;
    notes.forEach((freq, index) => {
        const osc = synthCtx.createOscillator();
        const gainNode = synthCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        
        gainNode.gain.setValueAtTime(gainVal, now + index * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + duration);
        
        osc.connect(gainNode);
        gainNode.connect(synthGain);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + duration + 0.05);
    });
}

function startSynthDrone() {
    initSynth();
    if (!synthCtx || (window.audioFX && window.audioFX.isMuted)) return;
    stopSynthDrone();

    const now = synthCtx.currentTime;
    droneGain = synthCtx.createGain();
    droneGain.gain.setValueAtTime(0.0, now);
    droneGain.connect(synthGain);

    // Warm pentatonic low pad drone: Zen Mode uses a calm Major chord, Arcade Mode uses minor chords
    const frequencies = mode === 'zen' ? [130.81, 164.81, 196.00] : [110.00, 130.81, 164.81]; // C major vs A minor
    
    frequencies.forEach(freq => {
        const osc = synthCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        osc.connect(droneGain);
        osc.start(now);
        droneOscs.push(osc);
    });

    droneGain.gain.linearRampToValueAtTime(0.12, now + 2.0); // Gentle fade in
}

function updateSynthDroneTempo(speedRatio) {
    if (!synthCtx || !droneOscs.length || (window.audioFX && window.audioFX.isMuted)) return;
    // Speed increases pitch drone slightly for suspense
    const now = synthCtx.currentTime;
    const baseFreqs = mode === 'zen' ? [130.81, 164.81, 196.00] : [110.00, 130.81, 164.81];
    
    droneOscs.forEach((osc, idx) => {
        const targetFreq = baseFreqs[idx] * (1.0 + (1.0 - speedRatio) * 0.15);
        osc.frequency.setTargetAtTime(targetFreq, now, 0.5);
    });
}

function stopSynthDrone() {
    if (droneGain && synthCtx) {
        try {
            const now = synthCtx.currentTime;
            droneGain.gain.linearRampToValueAtTime(0.0, now + 0.3);
            setTimeout(() => {
                droneOscs.forEach(o => { try { o.stop(); } catch(err){} });
                droneOscs = [];
                droneGain = null;
            }, 350);
        } catch(e) {}
    } else {
        droneOscs = [];
    }
}

// --- GAME LOGIC ---
function startGame() {
    if (gameRunning) return;
    
    if (window.audioFX) {
        window.audioFX.init();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    initSynth();
    
    // Reset snake positioning with LERP support
    snake = [
        { x: 6, y: 10, px: 6, py: 10 },
        { x: 5, y: 10, px: 5, py: 10 },
        { x: 4, y: 10, px: 4, py: 10 }
    ];
    
    obstacles = [];
    powerup = null;
    dx = 1; dy = 0; nextDx = 1; nextDy = 0;
    score = 0; 
    baseSpeed = mode === 'zen' ? 180 : 200;
    currentTickSpeed = baseSpeed;
    scoreElement.textContent = score;
    
    // Combo multiplier
    comboCount = 0;
    multiplier = 1.0;
    multiplierContainer.style.display = mode === 'arcade' ? 'flex' : 'none';
    multiplierElement.textContent = '1.0x';

    // Power-up durations
    activePowerups.chrono = 0;
    activePowerups.shield = 0;
    activePowerups.magnet = 0;
    updatePowerupsHud();

    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    
    generateFood();
    
    lastTickTime = performance.now();
    moveAccumulator = 0;
    
    // Audio Drone initialization
    startSynthDrone();
    playSynthChime(mode === 'zen' ? [261.63, 329.63, 392.00] : [220.00, 277.18, 329.63], 'triangle', 0.4);

    requestAnimationFrame(gameLoop);
}

function quitToMenu() {
    gameRunning = false;
    isPaused = false;
    pauseMenu.classList.add('hidden');
    document.getElementById('shareContainer')?.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    activePowerupsHud.innerHTML = '';
    
    stopSynthDrone();
    
    snake = [];
    score = 0;
    scoreElement.textContent = score;
    drawFrame(0);
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '];
    
    if (gameKeys.includes(key)) e.preventDefault();

    if (!gameRunning) {
        if (key === ' ' || key === 'enter' || gameKeys.includes(key)) startGame();
        return;
    }
    if (isPaused) return;
    
    handleDirection(key);
}

function handleDirection(key) {
    if (!gameRunning || isPaused) return;

    if ((key === 'arrowup' || key === 'w') && dy === 0) { nextDx = 0; nextDy = -1; }
    else if ((key === 'arrowdown' || key === 's') && dy === 0) { nextDx = 0; nextDy = 1; }
    else if ((key === 'arrowleft' || key === 'a') && dx === 0) { nextDx = -1; nextDy = 0; }
    else if ((key === 'arrowright' || key === 'd') && dx === 0) { nextDx = 1; nextDy = 0; }
}

function togglePause(forcePause) {
    if (!gameRunning) return;
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        pauseMenu.classList.remove('hidden');
        if (droneGain && synthCtx) {
            droneGain.gain.setValueAtTime(0.02, synthCtx.currentTime); // Soften drone during pause
        }
    } else {
        pauseMenu.classList.add('hidden');
        lastTickTime = performance.now();
        if (droneGain && synthCtx) {
            droneGain.gain.setValueAtTime(0.12, synthCtx.currentTime);
        }
        requestAnimationFrame(gameLoop);
    }
}

// --- ANIMATION & PHYSICS GAME LOOP ---
function gameLoop(timestamp) {
    if (!gameRunning || isPaused) return;
    
    const deltaTime = timestamp - lastTickTime;
    lastTickTime = timestamp;
    
    // Scale accumulated frame updates according to the active speed setting
    moveAccumulator += deltaTime;
    
    if (moveAccumulator >= currentTickSpeed) {
        updatePhysics();
        moveAccumulator = 0;
    }
    
    // Linear Interpolation progress fraction
    const progress = Math.min(1.0, moveAccumulator / currentTickSpeed);
    
    // Update non-physics visuals (particles decay, star floating, screen rotations)
    updateVisuals(deltaTime);
    
    // Draw LERP-smoothed canvas elements
    drawFrame(progress);
    
    requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    // 1. Check Power-Ups durations
    if (activePowerups.chrono > 0) {
        activePowerups.chrono -= currentTickSpeed;
        if (activePowerups.chrono <= 0) {
            activePowerups.chrono = 0;
            playSynthChime([392.00, 261.63], 'sine', 0.2, 0.2); // Expire chime
        }
    }
    if (activePowerups.magnet > 0) {
        activePowerups.magnet -= currentTickSpeed;
        if (activePowerups.magnet <= 0) {
            activePowerups.magnet = 0;
            playSynthChime([349.23, 220.00], 'sine', 0.2, 0.2); // Expire chime
        }
    }
    updatePowerupsHud();

    // Calculate current speed parameter
    let tickSpeed = baseSpeed;
    if (activePowerups.chrono > 0) {
        tickSpeed = Math.floor(baseSpeed * 1.65); // Time slowdown factor 1.65x duration increase
    }
    currentTickSpeed = tickSpeed;

    // Adjust synthesized sound frequencies
    const speedRatio = Math.max(0.3, (currentTickSpeed - minSpeed) / 200);
    updateSynthDroneTempo(speedRatio);

    dx = nextDx; dy = nextDy;

    // 2. Pulse Magnet Attraction (Arcade Mode only)
    if (mode === 'arcade' && activePowerups.magnet > 0 && (dx !== 0 || dy !== 0)) {
        pullMagnetCollectables();
    }

    // Cache current segments as previous coordinates for LERPing
    snake.forEach(part => {
        part.px = part.x;
        part.py = part.y;
    });

    if (powerup) {
        powerup.px = powerup.x;
        powerup.py = powerup.y;
    }

    // 3. Move snake head
    let nextHeadX = snake[0].x + dx;
    let nextHeadY = snake[0].y + dy;

    if (mode === 'zen') {
        // Border wrapping
        nextHeadX = (nextHeadX + tileCount) % tileCount;
        nextHeadY = (nextHeadY + tileCount) % tileCount;
    } else {
        // Deadly boundaries
        if (nextHeadX < 0 || nextHeadX >= tileCount || nextHeadY < 0 || nextHeadY >= tileCount) {
            if (activePowerups.shield > 0) {
                popZenShield();
                // Bounce back / wrap safely to preserve loop
                nextHeadX = (nextHeadX + tileCount) % tileCount;
                nextHeadY = (nextHeadY + tileCount) % tileCount;
            } else {
                triggerGameOver();
                return;
            }
        }
    }

    const head = { x: nextHeadX, y: nextHeadY, px: snake[0].x, py: snake[0].y };

    // 4. Check obstacle collisions (Arcade Mode)
    if (mode === 'arcade') {
        const hitObstacle = obstacles.find(o => o.x === head.x && o.y === head.y);
        if (hitObstacle) {
            if (activePowerups.shield > 0) {
                popZenShield();
                // Remove hit obstacle to clear way
                obstacles = obstacles.filter(o => o !== hitObstacle);
            } else {
                triggerGameOver();
                return;
            }
        }
    }

    // 5. Check self body-collisions
    if (dx !== 0 || dy !== 0) {
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                if (mode === 'zen') {
                    // ZEN MODE SLICE: Slices the body at collision point!
                    sliceZenTail(i);
                    break;
                } else {
                    if (activePowerups.shield > 0) {
                        popZenShield();
                    } else {
                        triggerGameOver();
                        return;
                    }
                }
            }
        }
    }

    snake.unshift(head);

    // 6. Food collision check
    if (head.x === food.x && head.y === food.y) {
        scoreFoodBit();
    } else if (powerup && head.x === powerup.x && head.y === powerup.y) {
        scorePowerupCanister();
    } else {
        snake.pop();
    }

    // Spawn power-ups and progressive obstacles in arcade mode
    if (mode === 'arcade') {
        manageArcadeEcosystem();
    }
}

function pullMagnetCollectables() {
    const headX = snake[0].x;
    const headY = snake[0].y;

    // Pull food closer
    let distFood = Math.max(Math.abs(headX - food.x), Math.abs(headY - food.y));
    if (distFood > 0 && distFood <= 3) {
        let stepX = Math.sign(headX - food.x);
        let stepY = Math.sign(headY - food.y);
        food.x += stepX;
        food.y += stepY;
    }

    // Pull powerup closer
    if (powerup) {
        let distPU = Math.max(Math.abs(headX - powerup.x), Math.abs(headY - powerup.y));
        if (distPU > 0 && distPU <= 3) {
            let stepX = Math.sign(headX - powerup.x);
            let stepY = Math.sign(headY - powerup.y);
            powerup.x += stepX;
            powerup.y += stepY;
        }
    }
}

function popZenShield() {
    activePowerups.shield = 0;
    updatePowerupsHud();
    playSynthChime([880.00, 587.33], 'square', 0.25, 0.4); // Shield break alert
    if (navigator.vibrate) navigator.vibrate([40, 40]);
    spawnParticleExplosion(snake[0].x, snake[0].y, '#ff00ea', 16);
}

function sliceZenTail(index) {
    const slicedLength = snake.length - index;
    snake = snake.slice(0, index);
    
    // Play a delightful harmonic synth drop chord
    playSynthChime([293.66, 220.00, 146.83], 'triangle', 0.5, 0.3);
    
    if (navigator.vibrate) navigator.vibrate(30);
    spawnParticleExplosion(snake[snake.length - 1].x, snake[snake.length - 1].y, '#00f3ff', 12);
}

function scoreFoodBit() {
    let scoreAdd = 10;
    
    // Combo multiplier calculations (Arcade only)
    if (mode === 'arcade') {
        const now = performance.now();
        if (now - lastEatTime < 3500) { // 3.5s window
            comboCount++;
            multiplier = 1.0 + (comboCount * 0.2);
            if (multiplier > 3.0) multiplier = 3.0; // cap combo at 3x
        } else {
            comboCount = 0;
            multiplier = 1.0;
        }
        lastEatTime = now;
        
        scoreAdd = Math.floor(10 * multiplier);
        multiplierElement.textContent = multiplier.toFixed(1) + 'x';
        if (comboCount > 0) {
            multiplierContainer.style.transform = 'scale(1.2)';
            setTimeout(() => { multiplierContainer.style.transform = 'scale(1.0)'; }, 150);
        }
    }

    score += scoreAdd;
    scoreElement.textContent = score;

    // Check achievement unlock
    if (window.achievements) {
        if (score >= 10) window.achievements.unlock('snake', '10', 'Hungry Snake');
        if (score >= 100) window.achievements.unlock('snake', '25', 'Neon Predator');
        if (score >= 200) window.achievements.unlock('snake', '50', 'Zen Dragon');
    }

    // Eating sound chords (pentatonic chime depending on combo count)
    const melodyIndex = comboCount % 5;
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
    const chimeFreq = baseFreqs[melodyIndex];
    
    playSynthChime([chimeFreq, chimeFreq * 1.5], 'sine', 0.22, 0.35);
    
    if (navigator.vibrate) navigator.vibrate(20);
    
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('neonSnakeHighScore', highScore);
    }

    // Visual particles
    spawnParticleExplosion(food.x, food.y, mode === 'zen' ? '#00f3ff' : '#ff00ea', 12);
    
    generateFood();

    // Gradually speed up
    if (baseSpeed > minSpeed) {
        baseSpeed -= mode === 'zen' ? 3 : 5;
        if (baseSpeed < minSpeed) baseSpeed = minSpeed;
    }
}

function scorePowerupCanister() {
    const type = powerup.type;
    powerup = null;

    playSynthChime([523.25, 659.25, 783.99, 1046.50], 'square', 0.3, 0.4); // Powerup obtain chord
    if (navigator.vibrate) navigator.vibrate([20, 20]);

    if (type === 'chrono') {
        activePowerups.chrono = 6000; // 6 seconds duration
        spawnParticleExplosion(snake[0].x, snake[0].y, '#00f3ff', 16);
    } else if (type === 'shield') {
        activePowerups.shield = 1;
        spawnParticleExplosion(snake[0].x, snake[0].y, '#ff00ea', 16);
    } else if (type === 'magnet') {
        activePowerups.magnet = 6000; // 6 seconds duration
        spawnParticleExplosion(snake[0].x, snake[0].y, '#ffd700', 16);
    }
    updatePowerupsHud();
}

function manageArcadeEcosystem() {
    // 1. Obstacles progressive spawning
    const targetObstacles = Math.min(6, Math.floor(score / 50) * 2);
    if (obstacles.length < targetObstacles) {
        spawnNewObstacle();
    }

    // 2. Power-ups random spawner (12% chance every food, or spawned by timer if none active)
    if (!powerup && Math.random() < 0.05 && score > 20) {
        spawnPowerup();
    }
}

function generateFood() {
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    
    // Ensure food doesn't overlap snake, powerups, or obstacles
    const hitObstacle = obstacles.some(o => o.x === food.x && o.y === food.y);
    const hitSnake = snake.some(p => p.x === food.x && p.y === food.y);
    const hitPU = powerup && powerup.x === food.x && powerup.y === food.y;

    if (hitObstacle || hitSnake || hitPU) {
        generateFood();
    }
}

function spawnPowerup() {
    const px = Math.floor(Math.random() * tileCount);
    const py = Math.floor(Math.random() * tileCount);

    const hitObstacle = obstacles.some(o => o.x === px && o.y === py);
    const hitSnake = snake.some(p => p.x === px && p.y === py);
    const hitFood = food.x === px && food.y === py;

    if (hitObstacle || hitSnake || hitFood) {
        return; // Try again next tick
    }

    const types = ['chrono', 'shield', 'magnet'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    powerup = { x: px, y: py, px: px, py: py, type: randomType };
}

function spawnNewObstacle() {
    const ox = Math.floor(Math.random() * tileCount);
    const oy = Math.floor(Math.random() * tileCount);

    const hitObstacle = obstacles.some(o => o.x === ox && o.y === oy);
    const hitSnake = snake.some(p => Math.abs(p.x - ox) <= 2 && Math.abs(p.y - oy) <= 2); // safe distance from head
    const hitFood = food.x === ox && food.y === oy;

    if (hitObstacle || hitSnake || hitFood) {
        return;
    }
    obstacles.push({ x: ox, y: oy });
}

function updatePowerupsHud() {
    activePowerupsHud.innerHTML = '';
    
    if (activePowerups.chrono > 0) {
        createPowerupHudEl('chrono', '⏱️ Chrono', activePowerups.chrono / 6000);
    }
    if (activePowerups.shield > 0) {
        createPowerupHudEl('shield', '🛡️ Shield', 1.0);
    }
    if (activePowerups.magnet > 0) {
        createPowerupHudEl('magnet', '🧲 Magnet', activePowerups.magnet / 6000);
    }
}

function createPowerupHudEl(cls, label, fillRatio) {
    const el = document.createElement('div');
    el.className = `powerup-bar ${cls}`;
    el.innerHTML = `
        <span class="powerup-bar-icon">
            ${cls === 'chrono' ? '⏱️' : cls === 'shield' ? '🛡️' : '🧲'}
        </span>
        <div class="powerup-bar-info">
            <span class="powerup-bar-name">${label}</span>
            <div class="powerup-bar-track">
                <div class="powerup-bar-fill" style="width: ${fillRatio * 100}%"></div>
            </div>
        </div>
    `;
    activePowerupsHud.appendChild(el);
}

function triggerGameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
    
    // Terminate drone chord
    stopSynthDrone();

    // Play a descending cyberpunk bass drop chord
    playSynthChime([146.83, 110.00, 73.42], 'sawtooth', 0.7, 0.45);
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('overlay').querySelector('h2').textContent = "Neural Overload";
    document.getElementById('overlay').querySelector('p.subtitle').textContent = `Sync connection severed. Final Score: ${score}`;
    
    const shareContainer = document.getElementById('shareContainer');
    if (shareContainer) shareContainer.classList.remove('hidden');
    
    startBtn.textContent = "Re-Sync Neural Link";
}

// --- RENDERING & PARTICLE ENGINE ---
function initBackdropStars() {
    backdropStars = [];
    for (let i = 0; i < 28; i++) {
        backdropStars.push({
            x: Math.random() * 400,
            y: Math.random() * 400,
            radius: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.05 + 0.02,
            glow: Math.random() * 0.5 + 0.5
        });
    }
}

function spawnParticleExplosion(gridX, gridY, color, count) {
    const startX = gridX * gridSize + gridSize / 2;
    const startY = gridY * gridSize + gridSize / 2;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        particles.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 1.5,
            alpha: 1.0,
            decay: Math.random() * 0.04 + 0.02,
            color: color
        });
    }
}

function updateVisuals(dt) {
    // 1. Floating backdrop stars
    const slideDx = dx * 0.05;
    const slideDy = dy * 0.05;
    backdropStars.forEach(s => {
        s.x -= slideDx;
        s.y -= slideDy;
        
        // boundary wrapping inside canvas coordinates
        if (s.x < 0) s.x = 400;
        if (s.x > 400) s.x = 0;
        if (s.y < 0) s.y = 400;
        if (s.y > 400) s.y = 0;
    });

    // 2. Pulse angle
    gridPulseAngle += 0.02;

    // 3. Particles physics
    particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(idx, 1);
        }
    });
}

function drawFrame(progress) {
    // Clear arena with custom grid base
    ctx.fillStyle = '#030407';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const canvasScale = canvas.width / 400;

    // Draw backdrop stars
    backdropStars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.glow * s.glow * 0.35})`;
        ctx.beginPath();
        ctx.arc(s.x * canvasScale, s.y * canvasScale, s.radius * canvasScale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw grid background line wires
    const pIntensity = Math.sin(gridPulseAngle) * 0.02 + 0.03;
    ctx.strokeStyle = `rgba(255, 0, 234, ${pIntensity})`;
    ctx.lineWidth = 1;
    const spacing = canvas.width / tileCount;

    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath(); ctx.moveTo(i * spacing, 0); ctx.lineTo(i * spacing, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * spacing); ctx.lineTo(canvas.width, i * spacing); ctx.stroke();
    }

    // Draw obstacles (Arcade Mode only)
    if (mode === 'arcade') {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff2b2b';
        ctx.fillStyle = 'rgba(255, 43, 43, 0.8)';
        
        obstacles.forEach(o => {
            const ox = o.x * spacing + 1;
            const oy = o.y * spacing + 1;
            const oSize = spacing - 2;
            
            // Neon red tech block
            ctx.fillRect(ox, oy, oSize, oSize);
            ctx.strokeStyle = '#ffb2b2';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + 2, oy + 2, oSize - 4, oSize - 4);
        });
    }

    // Draw active Power-up canisters
    if (powerup) {
        // LERP position support
        let lerpX = powerup.px + (powerup.x - powerup.px) * progress;
        let lerpY = powerup.py + (powerup.y - powerup.py) * progress;

        let glowColor = '#ffd700'; // yellow magnet
        if (powerup.type === 'chrono') glowColor = '#00f3ff'; // cyan chrono
        if (powerup.type === 'shield') glowColor = '#ff00ea'; // pink shield

        ctx.shadowBlur = 18;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = glowColor;

        const pX = lerpX * spacing + spacing / 2;
        const pY = lerpY * spacing + spacing / 2;
        const pRadius = spacing / 2 - 2;

        ctx.beginPath();
        ctx.arc(pX, pY, pRadius, 0, Math.PI * 2);
        ctx.fill();

        // White glowing Core symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(spacing * 0.7)}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let sym = '🧲';
        if (powerup.type === 'chrono') sym = '⏱️';
        if (powerup.type === 'shield') sym = '🛡️';
        ctx.fillText(sym, pX, pY);
    }

    // Draw glowing Food bit
    ctx.shadowBlur = 16 + Math.sin(gridPulseAngle * 2) * 6;
    ctx.shadowColor = mode === 'zen' ? '#00f3ff' : '#ff00ea';
    ctx.fillStyle = mode === 'zen' ? '#00f3ff' : '#ff00ea';

    const foodX = food.x * spacing + spacing / 2;
    const foodY = food.y * spacing + spacing / 2;
    const fRadius = spacing / 2 - 4;

    ctx.beginPath();
    ctx.arc(foodX, foodY, fRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw white core dot
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(foodX, foodY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake gradient body with smooth interpolation
    ctx.shadowBlur = 12;
    
    snake.forEach((part, index) => {
        const isHead = index === 0;
        
        // Calculate interpolation positions with boundary wrap math
        let diffX = part.x - part.px;
        if (Math.abs(diffX) > 1) {
            diffX = diffX > 0 ? diffX - tileCount : diffX + tileCount;
        }
        let renderX = (part.px + diffX * progress) * spacing;

        let diffY = part.y - part.py;
        if (Math.abs(diffY) > 1) {
            diffY = diffY > 0 ? diffY - tileCount : diffY + tileCount;
        }
        let renderY = (part.py + diffY * progress) * spacing;

        // Custom cyberpunk color gradients
        const bodyRatio = index / snake.length;
        ctx.fillStyle = isHead ? '#00f3ff' : interpolateNeonColor('#00f3ff', '#ff00ea', bodyRatio);
        ctx.shadowColor = isHead ? '#00f3ff' : '#ff00ea';

        const size = isHead ? spacing - 2 : spacing - (4 + bodyRatio * 4);
        const offset = (spacing - size) / 2;
        const x = renderX + offset;
        const y = renderY + offset;
        const radius = isHead ? 6 : 4;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, size, size, radius);
        } else {
            ctx.rect(x, y, size, size);
        }
        ctx.fill();

        // Extra: Zen Shield rotating protective ring
        if (isHead && activePowerups.shield > 0) {
            ctx.strokeStyle = '#ff00ea';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#ff00ea';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(renderX + spacing/2, renderY + spacing/2, spacing * 1.1, gridPulseAngle, gridPulseAngle + Math.PI * 0.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(renderX + spacing/2, renderY + spacing/2, spacing * 1.1, gridPulseAngle + Math.PI, gridPulseAngle + Math.PI * 1.8);
            ctx.stroke();
        }
    });

    ctx.shadowBlur = 0;

    // Draw active particle trails
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x * canvasScale, p.y * canvasScale, p.radius * canvasScale, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0; // reset
}

function interpolateNeonColor(color1, color2, ratio) {
    // simple lerp hex converter for cyan '#00f3ff' and magenta '#ff00ea'
    const r1 = 0, g1 = 243, b1 = 255;
    const r2 = 255, g2 = 0, b2 = 234;

    const r = Math.floor(r1 + (r2 - r1) * ratio);
    const g = Math.floor(g1 + (g2 - g1) * ratio);
    const b = Math.floor(b1 + (b2 - b1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

// Canvas Polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
        this.beginPath(); this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r);
        this.closePath(); return this;
    };
}

// --- SOCIAL SHARING ---
function shareScore(platform) {
    const text = `I just synced a score of ${score} points in Neon Zen Snake (${mode === 'zen' ? 'Zen Mode' : 'Arcade Mode'}) 🐍 on Arcade Hub! Challenge my cyberspace score:`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));

// Initialize everything on boot
initGame();
drawFrame(0);
