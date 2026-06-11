// Neon Arrows Game Logic
// Rebuilt for block-sliding Tap Away mechanics with high-fidelity visual and auditory juice.

// Define Neon Colors
const NEON_COLORS = {
    cyan: '#00ffcc',
    magenta: '#ff00ea',
    green: '#39ff14',
    yellow: '#ffff00',
    orange: '#ff5e00',
    purple: '#8a2be2',
    red: '#ff2d78'
};

const BG_INNER = '#06070a';

// LCG Seeded Random Generator for deterministic, solvable stage layouts
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
    choose(arr) {
        return arr[this.nextInt(0, arr.length)];
    }
}

// 20 progressive level configurations
const LEVEL_CONFIGS = [
    { gridWidth: 3, gridHeight: 3, numBlocks: 5, seed: 2001, time3: 8, time2: 15 },
    { gridWidth: 3, gridHeight: 3, numBlocks: 7, seed: 2002, time3: 10, time2: 18 },
    { gridWidth: 3, gridHeight: 3, numBlocks: 9, seed: 2003, time3: 12, time2: 22 },
    { gridWidth: 4, gridHeight: 4, numBlocks: 8, seed: 2004, time3: 15, time2: 28 },
    { gridWidth: 4, gridHeight: 4, numBlocks: 11, seed: 2005, time3: 18, time2: 32 },
    { gridWidth: 4, gridHeight: 4, numBlocks: 14, seed: 2006, time3: 20, time2: 36 },
    { gridWidth: 5, gridHeight: 5, numBlocks: 15, seed: 2007, time3: 22, time2: 40 },
    { gridWidth: 5, gridHeight: 5, numBlocks: 18, seed: 2008, time3: 25, time2: 45 },
    { gridWidth: 5, gridHeight: 5, numBlocks: 21, seed: 2009, time3: 28, time2: 50 },
    { gridWidth: 6, gridHeight: 6, numBlocks: 24, seed: 2010, time3: 32, time2: 58 },
    { gridWidth: 6, gridHeight: 6, numBlocks: 28, seed: 2011, time3: 35, time2: 65 },
    { gridWidth: 6, gridHeight: 6, numBlocks: 32, seed: 2012, time3: 38, time2: 70 },
    { gridWidth: 7, gridHeight: 7, numBlocks: 32, seed: 2013, time3: 42, time2: 78 },
    { gridWidth: 7, gridHeight: 7, numBlocks: 38, seed: 2014, time3: 45, time2: 85 },
    { gridWidth: 7, gridHeight: 7, numBlocks: 42, seed: 2015, time3: 50, time2: 92 },
    { gridWidth: 8, gridHeight: 8, numBlocks: 44, seed: 2016, time3: 55, time2: 105 },
    { gridWidth: 8, gridHeight: 8, numBlocks: 50, seed: 2017, time3: 60, time2: 115 },
    { gridWidth: 9, gridHeight: 9, numBlocks: 54, seed: 2018, time3: 68, time2: 130 },
    { gridWidth: 9, gridHeight: 9, numBlocks: 62, seed: 2019, time3: 75, time2: 145 },
    { gridWidth: 10, gridHeight: 10, numBlocks: 70, seed: 2020, time3: 90, time2: 170 }
];

// Centralized High-Fidelity Synthesizer
const neonArrowAudio = {
    ctx: null,
    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
    },
    playClick() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    },
    playSlide() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    },
    playBump() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.setValueAtTime(80, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {}
    },
    playVictory() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C5, E5, G5, C6, E6
            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.1;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.1, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.3);
            });
        } catch (e) {}
    }
};

// Global Game Variables
let currentLevelIndex = 0;
let currentGridWidth = 3;
let currentGridHeight = 3;
let isMuted = false;
let activeBlocks = [];
let originalBlocks = [];
let particles = [];
let ripples = [];
let undoHistory = [];
let elapsedTime = 0;
let gameRunning = false;

// Camera shake variables
let shakeIntensity = 0;
let shakeTimeRemaining = 0;

// Canvas Variables
let canvas, ctx;
let cellSize = 60;
let offsetLeft = 0;
let offsetTop = 0;

// Game Loop Flags
let isAnimating = false;
let animationFrameId = null;
let lastTime = 0;

// Dynamic Level Selection Modal Setup
function showLevelSelect() {
    gameRunning = false;
    const grid = document.getElementById('level-select-grid');
    grid.innerHTML = '';
    
    const maxUnlocked = parseInt(localStorage.getItem('neon_arrows_level') || '0', 10);
    
    const LEVELS_TOTAL = LEVEL_CONFIGS.length;
    for (let idx = 0; idx < LEVELS_TOTAL; idx++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        
        if (idx < maxUnlocked) {
            btn.classList.add('completed');
            btn.innerHTML = `${idx + 1}<span style="font-size: 8px; margin-left: 2px;">✔</span>`;
        } else if (idx === maxUnlocked) {
            btn.textContent = idx + 1;
        } else {
            btn.classList.add('locked');
            btn.innerHTML = `${idx + 1}<span style="font-size: 8px; margin-left: 2px;">🔒</span>`;
        }
        
        btn.addEventListener('click', () => {
            if (idx > maxUnlocked) {
                neonArrowAudio.playBump();
                return;
            }
            neonArrowAudio.playClick();
            document.getElementById('level-select-screen').classList.remove('active');
            loadLevel(idx);
            
            // Resume main game animation loop
            if (!isAnimating) {
                isAnimating = true;
                lastTime = performance.now();
                requestAnimationFrame(animate);
            }
        });
        
        grid.appendChild(btn);
    }
    
    document.getElementById('level-select-screen').classList.add('active');
}

// Initialization
function initGame() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Bind Interface Overlays
    document.getElementById('start-btn').addEventListener('click', () => {
        neonArrowAudio.init();
        document.getElementById('start-screen').classList.remove('active');
        showLevelSelect();
        neonArrowAudio.playClick();
    });
    
    document.getElementById('abort-to-hub-btn').addEventListener('click', () => {
        neonArrowAudio.playClick();
        window.top.location.href = '../index.html';
    });
    
    document.getElementById('htp-btn').addEventListener('click', () => {
        document.getElementById('htp-overlay').classList.add('active');
        neonArrowAudio.playClick();
    });
    
    document.getElementById('htp-close').addEventListener('click', () => {
        document.getElementById('htp-overlay').classList.remove('active');
        neonArrowAudio.playClick();
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.add('active');
        gameRunning = false;
        neonArrowAudio.playClick();
    });
    
    document.getElementById('resume-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.remove('active');
        gameRunning = true;
        lastTime = performance.now();
        neonArrowAudio.playClick();
    });
    
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.remove('active');
        resetLevel();
        neonArrowAudio.playClick();
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => {
        undoMove();
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        resetLevel();
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        document.getElementById('complete-screen').classList.remove('active');
        loadNextLevel();
        neonArrowAudio.playClick();
    });
    
    document.getElementById('victory-home-btn').addEventListener('click', () => {
        document.getElementById('victory-screen').classList.remove('active');
        neonArrowAudio.playClick();
        window.top.location.href = '../index.html';
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        neonArrowAudio.playClick();
        showLevelSelect();
    });
    
    // Mute Switch logic
    const savedMute = localStorage.getItem('arcadeHubMuted') === 'true';
    isMuted = savedMute;
    updateMuteUI();
    document.getElementById('mute-btn').addEventListener('click', () => {
        const fx = window.audioFX || (window.parent && window.parent.audioFX);
        if (fx) {
            fx.toggleMute();
            isMuted = fx.isMuted;
        } else {
            isMuted = !isMuted;
            localStorage.setItem('arcadeHubMuted', isMuted);
        }
        updateMuteUI();
        neonArrowAudio.playClick();
    });
    
    // Canvas Input Bindings
    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    
    // Load level based on save progress
    const savedLvl = localStorage.getItem('neon_arrows_level');
    if (savedLvl !== null) {
        currentLevelIndex = parseInt(savedLvl, 10);
        if (isNaN(currentLevelIndex) || currentLevelIndex >= LEVEL_CONFIGS.length) {
            currentLevelIndex = 0;
        }
    }
    
    loadLevel(currentLevelIndex);
    
    isAnimating = true;
    lastTime = performance.now();
    requestAnimationFrame(animate);
}

function updateMuteUI() {
    const btn = document.getElementById('mute-btn');
    if (btn) {
        btn.innerHTML = isMuted ? '🔇' : '🔊';
    }
}

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    const size = Math.min(w, h, 650);
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    ctx.scale(dpr, dpr);
    calculateGridMetrics(size);
}

function calculateGridMetrics(canvasSize) {
    const margin = 50;
    const available = canvasSize - margin * 2;
    const maxDim = Math.max(currentGridWidth, currentGridHeight);
    cellSize = available / maxDim;
    
    offsetLeft = margin + (available - currentGridWidth * cellSize) / 2;
    offsetTop = margin + (available - currentGridHeight * cellSize) / 2;
}

// Check Solvability helper
function isBlocked(block, blocksList, gridWidth, gridHeight) {
    let cx = block.x + block.exitDir.x;
    let cy = block.y + block.exitDir.y;
    while (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
        for (const other of blocksList) {
            if (other.id === block.id) continue;
            if (other.x === cx && other.y === cy) {
                return true;
            }
        }
        cx += block.exitDir.x;
        cy += block.exitDir.y;
    }
    return false;
}

function isSolvable(gridWidth, gridHeight, blocks) {
    let tempBlocks = blocks.map(b => ({ ...b }));
    let progress = true;
    while (progress && tempBlocks.length > 0) {
        progress = false;
        for (let i = 0; i < tempBlocks.length; i++) {
            let b = tempBlocks[i];
            if (!isBlocked(b, tempBlocks, gridWidth, gridHeight)) {
                tempBlocks.splice(i, 1);
                progress = true;
                break;
            }
        }
    }
    return tempBlocks.length === 0;
}

// Fixed reverse-play generation algorithm
function generateLevel(gridWidth, gridHeight, numBlocks, initialSeed, time3, time2) {
    let seed = initialSeed;
    let attempts = 0;
    while (attempts < 500) {
        attempts++;
        const rng = new SeededRandom(seed);
        const colors = ['cyan', 'magenta', 'green', 'yellow', 'orange', 'purple', 'red'];
        const dirs = [
            { x: 0, y: -1 }, // UP
            { x: 0, y: 1 },  // DOWN
            { x: -1, y: 0 }, // LEFT
            { x: 1, y: 0 }   // RIGHT
        ];
        
        let blocks = [];
        let occupied = new Set();
        
        let allCells = [];
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                allCells.push({ x, y });
            }
        }
        
        let placed = 0;
        let cellAttempts = 0;
        
        while (placed < numBlocks && cellAttempts < 2000) {
            cellAttempts++;
            let emptyCells = allCells.filter(c => !occupied.has(`${c.x},${c.y}`));
            if (emptyCells.length === 0) break;
            
            let cell = rng.choose(emptyCells);
            let dir = rng.choose(dirs);
            
            // Verify path in exitDir (dir) to check if any already placed blocks are blocking
            let dx = dir.x;
            let dy = dir.y;
            let cx = cell.x + dx;
            let cy = cell.y + dy;
            let clear = true;
            
            while (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
                if (occupied.has(`${cx},${cy}`)) {
                    clear = false;
                    break;
                }
                cx += dx;
                cy += dy;
            }
            
            if (clear) {
                let color = rng.choose(colors);
                blocks.push({
                    id: 'B' + placed,
                    x: cell.x,
                    y: cell.y,
                    color: color,
                    exitDir: { x: dir.x, y: dir.y }
                });
                occupied.add(`${cell.x},${cell.y}`);
                placed++;
            }
        }
        
        if (blocks.length > 0 && isSolvable(gridWidth, gridHeight, blocks)) {
            return {
                gridWidth: gridWidth,
                gridHeight: gridHeight,
                time3Stars: time3,
                time2Stars: time2,
                blocks: blocks
            };
        }
        seed = (seed + 1) % 1000000;
    }
    
    // Safety Fallback (Always solvable layout, blocks point outward)
    let blocks = [];
    let placed = 0;
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (placed >= numBlocks) break;
            let dx = x < gridWidth / 2 ? -1 : 1;
            blocks.push({
                id: 'B' + placed,
                x: x,
                y: y,
                color: 'cyan',
                exitDir: { x: dx, y: 0 }
            });
            placed++;
        }
    }
    return {
        gridWidth: gridWidth,
        gridHeight: gridHeight,
        time3Stars: time3,
        time2Stars: time2,
        blocks: blocks
    };
}

// Load Level Data
function loadLevel(index) {
    if (index < 0 || index >= LEVEL_CONFIGS.length) return;
    currentLevelIndex = index;
    localStorage.setItem('neon_arrows_level', currentLevelIndex);
    
    const config = LEVEL_CONFIGS[index];
    currentGridWidth = config.gridWidth;
    currentGridHeight = config.gridHeight;
    
    const generated = generateLevel(config.gridWidth, config.gridHeight, config.numBlocks, config.seed, config.time3, config.time2);
    
    activeBlocks = generated.blocks.map(b => ({
        id: b.id,
        gridX: b.x,
        gridY: b.y,
        color: b.color,
        exitDir: { x: b.exitDir.x, y: b.exitDir.y },
        slideOffset: 0,
        state: 'idle',
        shakeTime: 0,
        shakeIntensity: 0
    }));
    
    originalBlocks = JSON.parse(JSON.stringify(activeBlocks));
    undoHistory = [];
    particles = [];
    ripples = [];
    elapsedTime = 0;
    gameRunning = true;
    
    document.getElementById('level-value').textContent = currentLevelIndex + 1;
    document.getElementById('timer-value').textContent = '0.0s';
    document.getElementById('target-value').textContent = '< ' + config.time3 + 's';
    
    resizeCanvas();
}

function resetLevel() {
    loadLevel(currentLevelIndex);
    neonArrowAudio.playClick();
}

function loadNextLevel() {
    if (currentLevelIndex + 1 < LEVEL_CONFIGS.length) {
        loadLevel(currentLevelIndex + 1);
    } else {
        document.getElementById('victory-screen').classList.add('active');
        neonArrowAudio.playVictory();
    }
}

// Trigger Camera Shake
function triggerCameraShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimeRemaining = duration;
}

// Main Draw and Update Loop
function animate(currentTime) {
    if (!isAnimating) return;
    
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Guard against large frame steps when browser tab is inactive
    const deltaTime = Math.min(dt, 0.1);
    
    if (gameRunning) {
        elapsedTime += deltaTime;
        document.getElementById('timer-value').textContent = elapsedTime.toFixed(1) + 's';
    }
    
    // Clear Board
    ctx.fillStyle = BG_INNER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply camera shake if active
    ctx.save();
    if (shakeTimeRemaining > 0) {
        shakeTimeRemaining -= deltaTime;
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        if (shakeTimeRemaining <= 0) {
            shakeIntensity = 0;
        }
    }
    
    // Render Board Grid
    drawGridMatrix();
    
    // Update and Draw ripples
    updateRipples(deltaTime);
    drawRipples();
    
    // Update and Draw blocks
    updateBlocksState(deltaTime);
    drawBlocks();
    
    // Update and Draw particles
    updateParticles(deltaTime);
    drawParticles();
    
    ctx.restore();
    
    animationFrameId = requestAnimationFrame(animate);
}

function drawGridMatrix() {
    // Fill inner board matrix backdrop
    ctx.fillStyle = '#08090d';
    ctx.fillRect(offsetLeft, offsetTop, currentGridWidth * cellSize, currentGridHeight * cellSize);
    
    // Draw cells wires
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= currentGridWidth; x++) {
        const lx = offsetLeft + x * cellSize;
        ctx.beginPath();
        ctx.moveTo(lx, offsetTop);
        ctx.lineTo(lx, offsetTop + currentGridHeight * cellSize);
        ctx.stroke();
    }
    for (let y = 0; y <= currentGridHeight; y++) {
        const ly = offsetTop + y * cellSize;
        ctx.beginPath();
        ctx.moveTo(offsetLeft, ly);
        ctx.lineTo(offsetLeft + currentGridWidth * cellSize, ly);
        ctx.stroke();
    }
    
    // Main Console Neon Glow frame
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.strokeRect(offsetLeft, offsetTop, currentGridWidth * cellSize, currentGridHeight * cellSize);
    ctx.shadowBlur = 0;
}

// Rounded rect path helper
function drawRoundedRectPath(x, y, size, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + size - r, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + r);
    ctx.lineTo(x + size, y + size - r);
    ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
    ctx.lineTo(x + r, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBlocks() {
    const now = performance.now();
    const pulse = Math.sin(now / 150) * 3;
    
    activeBlocks.forEach(block => {
        if (block.state === 'completed') return;
        
        const rx = block.gridX + block.exitDir.x * block.slideOffset;
        const ry = block.gridY + block.exitDir.y * block.slideOffset;
        
        // Block wiggle shake offset
        let wx = 0, wy = 0;
        if (block.shakeTime > 0) {
            const angle = block.shakeTime * 60;
            const damp = block.shakeTime / 0.25;
            wx = Math.sin(angle) * block.shakeIntensity * damp;
            wy = Math.cos(angle * 1.5) * block.shakeIntensity * damp;
        }
        
        const bx = offsetLeft + rx * cellSize + wx;
        const by = offsetTop + ry * cellSize + wy;
        
        const padding = 5;
        const size = cellSize - 2 * padding;
        const color = NEON_COLORS[block.color] || '#ffffff';
        
        // 1. Draw 3D shadow face
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        drawRoundedRectPath(bx + padding, by + padding + 5, size, 8);
        ctx.fill();
        
        // 2. Draw 3D side extrusion (darker color border)
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.45;
        drawRoundedRectPath(bx + padding, by + padding + 4, size, 8);
        ctx.stroke();
        ctx.restore();
        
        // 3. Draw main block top face (Gradient glass fill)
        ctx.save();
        const grad = ctx.createLinearGradient(bx + padding, by + padding, bx + padding + size, by + padding + size);
        grad.addColorStop(0, 'rgba(28, 30, 38, 0.94)');
        grad.addColorStop(1, 'rgba(10, 11, 14, 0.98)');
        ctx.fillStyle = grad;
        drawRoundedRectPath(bx + padding, by + padding, size, 8);
        ctx.fill();
        
        // 4. Border glowing outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + pulse;
        drawRoundedRectPath(bx + padding, by + padding, size, 8);
        ctx.stroke();
        ctx.restore();
        
        // Draw proper glowing vector arrow
        drawArrowInBlock(bx + cellSize / 2, by + cellSize / 2, block.exitDir, color, 8 + pulse);
    });
}

function drawArrowInBlock(cx, cy, exitDir, color, glowBlur) {
    ctx.save();
    ctx.translate(cx, cy);
    
    let angle = 0;
    if (exitDir.x === 1 && exitDir.y === 0) angle = 0;          // RIGHT
    else if (exitDir.x === 0 && exitDir.y === 1) angle = Math.PI / 2; // DOWN
    else if (exitDir.x === -1 && exitDir.y === 0) angle = Math.PI;    // LEFT
    else if (exitDir.x === 0 && exitDir.y === -1) angle = -Math.PI / 2; // UP
    ctx.rotate(angle);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = glowBlur;
    
    // Draw proper vector arrow ->
    ctx.beginPath();
    // Arrow stem
    ctx.moveTo(-11, 0);
    ctx.lineTo(9, 0);
    // Arrowhead pointer
    ctx.moveTo(2, -7);
    ctx.lineTo(9, 0);
    ctx.lineTo(2, 7);
    ctx.stroke();
    
    ctx.restore();
}

// Particle System updates
function spawnClearParticles(gridX, gridY, color) {
    const cx = offsetLeft + gridX * cellSize + cellSize / 2;
    const cy = offsetTop + gridY * cellSize + cellSize / 2;
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 3 + Math.random() * 3,
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}

function spawnExhaustSpark(rx, ry, exitDir, color) {
    const cx = offsetLeft + rx * cellSize + cellSize / 2;
    const cy = offsetTop + ry * cellSize + cellSize / 2;
    
    // Spray backwards
    const bx = -exitDir.x;
    const by = -exitDir.y;
    
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
        x: cx - exitDir.x * (cellSize / 4),
        y: cy - exitDir.y * (cellSize / 4),
        vx: bx * speed + (Math.random() - 0.5) * 1.2,
        vy: by * speed + (Math.random() - 0.5) * 1.2,
        color: color,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.85,
        decay: 0.04 + Math.random() * 0.04
    });
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// Expanding Ripples System
function spawnRipple(gridX, gridY, color, speedScale = 1.0) {
    ripples.push({
        x: offsetLeft + gridX * cellSize + cellSize / 2,
        y: offsetTop + gridY * cellSize + cellSize / 2,
        color: color,
        radius: 0,
        maxRadius: cellSize * 1.8,
        alpha: 1.0,
        speed: cellSize * 5 * speedScale
    });
}

function updateRipples(deltaTime) {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed * deltaTime;
        r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
        if (r.radius >= r.maxRadius || r.alpha <= 0) {
            ripples.splice(i, 1);
        }
    }
}

function drawRipples() {
    ctx.save();
    for (const r of ripples) {
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 3;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

// Block Collision and exit paths check
function isBlockBlocked(block, blocksList) {
    let cx = block.gridX + block.exitDir.x;
    let cy = block.gridY + block.exitDir.y;
    
    while (cx >= 0 && cx < currentGridWidth && cy >= 0 && cy < currentGridHeight) {
        const other = blocksList.find(b => b.state !== 'completed' && b.id !== block.id && b.gridX === cx && b.gridY === cy);
        if (other) {
            return { blocked: true, by: other };
        }
        cx += block.exitDir.x;
        cy += block.exitDir.y;
    }
    return { blocked: false };
}

// Touch/Click Interaction coordinates mapping
function handleCanvasTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    processSelection(x, y);
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    processSelection(x, y);
}

function processSelection(canvasX, canvasY) {
    if (activeBlocks.some(b => b.state === 'sliding') || !gameRunning) return;
    
    // Scale coordinate space to cells
    const gridX = Math.floor((canvasX - offsetLeft) / cellSize);
    const gridY = Math.floor((canvasY - offsetTop) / cellSize);
    
    const clicked = activeBlocks.find(b => b.state === 'idle' && b.gridX === gridX && b.gridY === gridY);
    if (!clicked) return;
    
    const check = isBlockBlocked(clicked, activeBlocks);
    if (check.blocked) {
        // Block collision wiggle
        clicked.shakeTime = 0.25;
        clicked.shakeIntensity = 6;
        
        // Spawn mini error ripple on block leading edge
        const edgeX = clicked.gridX + clicked.exitDir.x * 0.45;
        const edgeY = clicked.gridY + clicked.exitDir.y * 0.45;
        spawnRipple(edgeX, edgeY, '#ff2d78', 1.8);
        
        neonArrowAudio.playBump();
        triggerCameraShake(3, 0.12);
    } else {
        // Slide block off screen
        undoHistory.push(JSON.parse(JSON.stringify(activeBlocks)));
        clicked.state = 'sliding';
        neonArrowAudio.playSlide();
    }
}

// Update sliding transitions
function updateBlocksState(deltaTime) {
    activeBlocks.forEach(block => {
        // Local shake timers decay
        if (block.shakeTime > 0) {
            block.shakeTime = Math.max(0, block.shakeTime - deltaTime);
        }
        
        if (block.state === 'sliding') {
            block.slideOffset += 12 * deltaTime;
            
            const rx = block.gridX + block.exitDir.x * block.slideOffset;
            const ry = block.gridY + block.exitDir.y * block.slideOffset;
            
            if (Math.random() < 0.4) {
                spawnExhaustSpark(rx, ry, block.exitDir, NEON_COLORS[block.color]);
            }
            
            // Check out-of-grid condition
            const isOut = rx < -1.1 || rx > currentGridWidth + 0.1 ||
                          ry < -1.1 || ry > currentGridHeight + 0.1;
            
            if (isOut) {
                block.state = 'completed';
                
                // Edge exits effects
                let edgeX = Math.max(-0.5, Math.min(currentGridWidth - 0.5, rx));
                let edgeY = Math.max(-0.5, Math.min(currentGridHeight - 0.5, ry));
                spawnRipple(edgeX, edgeY, NEON_COLORS[block.color], 2.2);
                spawnClearParticles(edgeX, edgeY, NEON_COLORS[block.color]);
                triggerCameraShake(6, 0.15);
                
                checkVictory();
            }
        }
    });
}

function checkVictory() {
    const allCleared = activeBlocks.every(b => b.state === 'completed');
    if (allCleared) {
        gameRunning = false;
        neonArrowAudio.playVictory();
        
        // Local storage sector unlock logic
        const maxUnlocked = parseInt(localStorage.getItem('neon_arrows_level') || '0', 10);
        if (currentLevelIndex === maxUnlocked) {
            localStorage.setItem('neon_arrows_level', currentLevelIndex + 1);
        }
        
        // Achievements trigger
        if (currentLevelIndex === 0) {
            unlockAchievement('tutorial', 'Arrows Decrypt Rookie');
        }
        
        const config = LEVEL_CONFIGS[currentLevelIndex];
        let stars = 1;
        if (elapsedTime <= config.time3) {
            stars = 3;
            unlockAchievement('perfect', 'Arrow Master Logic');
        } else if (elapsedTime <= config.time2) {
            stars = 2;
        }
        
        if (currentLevelIndex === LEVEL_CONFIGS.length - 1) {
            unlockAchievement('master', 'Sector Mainframe Cracker');
        }
        
        // Stars display creation
        let starsHTML = '';
        for (let i = 1; i <= 3; i++) {
            if (i <= stars) {
                starsHTML += `<span class="gold-star">⭐</span>`;
            } else {
                starsHTML += `<span class="grey-star">⭐</span>`;
            }
        }
        
        // Complete commentaries
        let commentary = 'ACCESS GRANTED';
        if (stars === 3) commentary = 'HACK LEVEL: ELITE';
        else if (stars === 2) commentary = 'SYSTEM BYPASSED';
        
        document.getElementById('summary-time').textContent = elapsedTime.toFixed(1) + 's';
        document.getElementById('summary-target').textContent = config.time3 + 's';
        document.getElementById('star-rating-display').innerHTML = starsHTML;
        document.getElementById('star-commentary').textContent = commentary;
        
        setTimeout(() => {
            document.getElementById('complete-screen').classList.add('active');
        }, 550);
    }
}

function undoMove() {
    if (activeBlocks.some(b => b.state === 'sliding') || undoHistory.length === 0 || !gameRunning) return;
    activeBlocks = undoHistory.pop();
    neonArrowAudio.playClick();
}

function unlockAchievement(id, title) {
    try {
        if (window.achievements) {
            window.achievements.unlock('arrows', id, title);
        } else if (window.parent && window.parent.achievements) {
            window.parent.achievements.unlock('arrows', id, title);
        }
    } catch (e) {
        console.warn('Achievements Integration: Blocked or parent inaccessible.', e);
    }
}

// Run on document load
window.addEventListener('DOMContentLoaded', () => {
    const overlaySeen = localStorage.getItem('arcade_seen_neon-arrows') === '1';
    if (overlaySeen) {
        initGame();
    }
});
