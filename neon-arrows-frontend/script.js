// Neon Arrows Game Logic
// Rebuilt for hybrid HTML/Canvas Tap Away block slider mechanics with full UI/UX overhaul.

// Define Neon Colors & Styles
const BLOCK_COLORS = {
    red:    { bg: '#ff2d4a', glow: '#ff0022', border: '#ff6680' },
    blue:   { bg: '#0088ff', glow: '#0055ff', border: '#44aaff' },
    green:  { bg: '#00ff88', glow: '#00cc66', border: '#44ffaa' },
    yellow: { bg: '#ffdd00', glow: '#ffaa00', border: '#ffee55' },
    purple: { bg: '#aa00ff', glow: '#8800cc', border: '#cc55ff' },
    cyan:   { bg: '#00ffff', glow: '#00cccc', border: '#55ffff' },
    orange: { bg: '#ff8800', glow: '#ff6600', border: '#ffaa44' },
    pink:   { bg: '#ff44aa', glow: '#ff0088', border: '#ff88cc' }
};

const BG_INNER = '#06070a';

// Seeded LCG Random Generator
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

// 20 level configurations
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

// Web Audio API Synthesizer
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
    playBuzzer() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(100, now);
            
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(103, now); // detune texture
            
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        } catch (e) {}
    },
    playVictory() {
        this.init();
        if (isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
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

// Global Variables
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
let movesCount = 0;
let gameRunning = false;
let hintUsed = false;

// Interaction touch/hold trackers
let touchStartTime = 0;
let activeTouchBlock = null;
let hintTimeout = null;

// Camera shake parameters
let shakeIntensity = 0;
let shakeTimeRemaining = 0;

// Canvas & Grid Metrics
let canvas, ctx;
let cellSize = 60;
let offsetLeft = 0;
let offsetTop = 0;

// Loops & Delta Timers
let isAnimating = false;
let animationFrameId = null;
let lastTime = 0;

// Get Puzzle difficulty configuration
function getPuzzleDifficulty(levelIndex) {
    const level = levelIndex + 1;
    if (level <= 5)  return { maxFree: 2 };
    if (level <= 12) return { maxFree: 2 };
    if (level <= 20) return { maxFree: 1 };
    return           { maxFree: 1 };
}

// Solver validation (Checks empty space along ray)
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

function verifyDifficulty(gridWidth, gridHeight, blocks, maxFree) {
    let tempBlocks = blocks.map(b => ({ ...b }));
    while (tempBlocks.length > 0) {
        let freeList = [];
        for (const b of tempBlocks) {
            if (!isBlocked(b, tempBlocks, gridWidth, gridHeight)) {
                freeList.push(b);
            }
        }
        if (freeList.length === 0) return false;
        if (freeList.length > maxFree) return false; // Fail difficulty check
        
        // Remove first free block
        const toRemove = freeList[0];
        const idx = tempBlocks.findIndex(b => b.id === toRemove.id);
        tempBlocks.splice(idx, 1);
    }
    return true;
}

// Procedural reverse-play difficulty-constrained layout generator
function generateLevel(gridWidth, gridHeight, numBlocks, initialSeed, time3, time2, levelIdx) {
    const diff = getPuzzleDifficulty(levelIdx);
    let seed = initialSeed;
    let attempts = 0;
    
    while (attempts < 1000) {
        attempts++;
        const rng = new SeededRandom(seed);
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange', 'pink'];
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
            
            // Exit path validation
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
        
        // Validate solvability AND strict difficulty constraints
        if (blocks.length > 0 && verifyDifficulty(gridWidth, gridHeight, blocks, diff.maxFree)) {
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
    
    // Safety Fallback (Outward pointing blocks)
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

// Show PAR Moves start banner
function showParBanner(par) {
    const old = document.querySelectorAll('.par-banner');
    old.forEach(b => b.remove());
    
    const banner = document.createElement('div');
    banner.className = 'par-banner';
    banner.style.position = 'fixed';
    banner.style.top = '100px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%) scale(0.8)';
    banner.style.background = 'rgba(0, 255, 204, 0.95)';
    banner.style.color = '#000000';
    banner.style.padding = '12px 24px';
    banner.style.borderRadius = '12px';
    banner.style.fontWeight = '900';
    banner.style.fontSize = '16px';
    banner.style.zIndex = '1000';
    banner.style.boxShadow = '0 4px 25px rgba(0, 255, 204, 0.5)';
    banner.style.textTransform = 'uppercase';
    banner.style.letterSpacing = '1.5px';
    banner.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    banner.textContent = `PAR: ${par} MOVES`;
    
    document.body.appendChild(banner);
    
    requestAnimationFrame(() => {
        banner.style.transform = 'translateX(-50%) scale(1)';
    });
    
    setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateX(-50%) scale(0.8)';
        setTimeout(() => banner.remove(), 300);
    }, 2000);
}

// Trigger Hint
function triggerHint() {
    if (!gameRunning) return;
    const freeList = activeBlocks.filter(b => b.state === 'idle' && !isBlockBlocked(b, activeBlocks));
    if (freeList.length === 0) return;
    
    freeList.forEach(block => {
        const el = document.getElementById('block-' + block.id);
        if (el) {
            el.classList.add('hint-highlight');
            setTimeout(() => {
                if (el) el.classList.remove('hint-highlight');
            }, 1500);
        }
    });
    
    if (!hintUsed) {
        hintUsed = true;
        neonArrowAudio.playClick();
        
        // Float Penalty Banner
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '80px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(255, 221, 0, 0.95)';
        toast.style.color = '#000000';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '8px';
        toast.style.fontWeight = 'bold';
        toast.style.fontSize = '13px';
        toast.style.zIndex = '1000';
        toast.style.boxShadow = '0 4px 15px rgba(255, 221, 0, 0.4)';
        toast.style.textTransform = 'uppercase';
        toast.textContent = 'Hint Used: -1 Star Penalty';
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

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

// Block Collision and exit paths check
function isBlockBlocked(block, blocksList) {
    let cx = block.gridX + block.exitDir.x;
    let cy = block.gridY + block.exitDir.y;
    
    while (cx >= 0 && cx < currentGridWidth && cy >= 0 && cy < currentGridHeight) {
        // Both idle and sliding blocks block the exit path
        const other = blocksList.find(b => (b.state === 'idle' || b.state === 'sliding') && b.id !== block.id && b.gridX === cx && b.gridY === cy);
        if (other) {
            return { blocked: true, by: other };
        }
        cx += block.exitDir.x;
        cy += block.exitDir.y;
    }
    return { blocked: false };
}

// Update Block Free & Pulses DOM classes
function updateBlockFreeClasses() {
    const idleBlocks = activeBlocks.filter(b => b.state === 'idle');
    const freeBlocks = [];
    
    idleBlocks.forEach(block => {
        const check = isBlockBlocked(block, activeBlocks);
        const el = document.getElementById('block-' + block.id);
        if (el) {
            if (check.blocked) {
                el.classList.add('blocked');
                el.classList.remove('free', 'pulse-guide');
            } else {
                el.classList.add('free');
                el.classList.remove('blocked');
                freeBlocks.push(block);
            }
        }
    });
    
    // Pulse guide when exactly 1 block is unblocked
    idleBlocks.forEach(block => {
        const el = document.getElementById('block-' + block.id);
        if (el) {
            if (freeBlocks.length === 1 && freeBlocks[0].id === block.id) {
                el.classList.add('pulse-guide');
            } else {
                el.classList.remove('pulse-guide');
            }
        }
    });
}

// Render HTML Grid and Blocks DOM Elements securely (Fixes positional shifting issues)
function renderGridDOM() {
    const gridEl = document.getElementById('game-grid');
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${currentGridWidth}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${currentGridHeight}, 1fr)`;
    
    const wrapper = document.getElementById('game-wrapper');
    wrapper.style.setProperty('--cols', currentGridWidth);
    wrapper.style.setProperty('--rows', currentGridHeight);
    
    // 1. Render cell-empty background placeholders for all slots first (stays at z-index 1)
    for (let y = 0; y < currentGridHeight; y++) {
        for (let x = 0; x < currentGridWidth; x++) {
            const empty = document.createElement('div');
            empty.className = 'cell-empty';
            empty.id = `cell-${x}-${y}`;
            empty.style.gridColumnStart = x + 1;
            empty.style.gridRowStart = y + 1;
            gridEl.appendChild(empty);
        }
    }
    
    // 2. Render blocks nested inside their respective empty cells (z-index 2)
    activeBlocks.forEach(block => {
        if (block.state === 'completed') return;
        
        const el = document.createElement('div');
        el.className = 'block';
        el.id = 'block-' + block.id;
        el.setAttribute('data-color', block.color);
        
        const styleValues = BLOCK_COLORS[block.color];
        el.style.setProperty('--bg-color', styleValues.bg);
        el.style.setProperty('--border-color', styleValues.border);
        el.style.setProperty('--glow-color', styleValues.glow);
        
        let arrowChar = '→';
        if (block.exitDir.x === -1) arrowChar = '←';
        else if (block.exitDir.y === -1) arrowChar = '↑';
        else if (block.exitDir.y === 1) arrowChar = '↓';
        
        el.innerHTML = `<span class="block-arrow">${arrowChar}</span>`;
        
        // Interaction Listeners
        el.addEventListener('mousedown', (e) => onBlockTouchStart(block, e));
        el.addEventListener('touchstart', (e) => onBlockTouchStart(block, e), { passive: true });
        
        const cellEl = document.getElementById(`cell-${block.gridX}-${block.gridY}`);
        if (cellEl) {
            cellEl.appendChild(el);
        }
    });
    
    updateBlockFreeClasses();
}

// Load Level Data
function loadLevel(index) {
    if (index < 0 || index >= LEVEL_CONFIGS.length) return;
    currentLevelIndex = index;
    localStorage.setItem('neon_arrows_level', currentLevelIndex);
    
    const config = LEVEL_CONFIGS[index];
    currentGridWidth = config.gridWidth;
    currentGridHeight = config.gridHeight;
    
    const generated = generateLevel(config.gridWidth, config.gridHeight, config.numBlocks, config.seed, config.time3, config.time2, index);
    
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
    movesCount = 0;
    hintUsed = false;
    gameRunning = true;
    
    // Setup HUD
    document.getElementById('level-value').textContent = currentLevelIndex + 1;
    document.getElementById('moves-value').textContent = '0';
    document.getElementById('timer-value').textContent = '0.0s';
    document.getElementById('target-value').textContent = config.numBlocks;
    
    renderGridDOM();
    showParBanner(config.numBlocks);
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

// Interaction Listeners
function onBlockTouchStart(block, e) {
    if (e.type === 'mousedown' && 'ontouchstart' in window) {
        // Ignore duplicate mousedown events on touch devices
        return;
    }
    if (activeBlocks.some(b => b.state === 'sliding') || !gameRunning) return;
    
    activeTouchBlock = block;
    touchStartTime = performance.now();
    
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
        triggerHint();
        hintTimeout = null;
    }, 1000);
    
    const onRelease = () => {
        clearTimeout(hintTimeout);
        window.removeEventListener('mouseup', onRelease);
        window.removeEventListener('touchend', onRelease);
        
        if (!activeTouchBlock || !gameRunning) return;
        
        const elapsed = performance.now() - touchStartTime;
        if (elapsed < 1000 && hintTimeout !== null) {
            processBlockClick(activeTouchBlock);
        }
        activeTouchBlock = null;
    };
    
    window.addEventListener('mouseup', onRelease);
    window.addEventListener('touchend', onRelease);
}

function processBlockClick(block) {
    const check = isBlockBlocked(block, activeBlocks);
    if (check.blocked) {
        // blocked shake visual + audio penalty
        const el = document.getElementById('block-' + block.id);
        if (el) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 250);
        }
        
        const edgeX = block.gridX + block.exitDir.x * 0.45;
        const edgeY = block.gridY + block.exitDir.y * 0.45;
        spawnRipple(edgeX, edgeY, '#ff2d4a', 1.8);
        
        neonArrowAudio.playBuzzer();
        triggerCameraShake(4, 0.14);
    } else {
        // unblocked slider trigger
        undoHistory.push(JSON.parse(JSON.stringify(activeBlocks)));
        block.state = 'sliding';
        movesCount++;
        document.getElementById('moves-value').textContent = movesCount;
        
        const el = document.getElementById('block-' + block.id);
        if (el) {
            el.classList.add('sliding');
            el.classList.add('pressed');
            setTimeout(() => {
                if (el) el.classList.remove('pressed');
            }, 80);
        }
        
        neonArrowAudio.playSlide();
        updateBlockFreeClasses();
    }
}

// Sizing metrics
function resizeCanvas() {
    if (!canvas) return;
    const size = canvas.parentElement.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    ctx.scale(dpr, dpr);
    
    cellSize = size / currentGridWidth;
    offsetLeft = 0;
    offsetTop = 0;
}

// Initialise core setups
function initGame() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Bind buttons
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
    
    document.getElementById('undo-btn').addEventListener('click', undoMove);
    document.getElementById('mobile-undo-btn').addEventListener('click', undoMove);
    
    document.getElementById('reset-btn').addEventListener('click', resetLevel);
    document.getElementById('mobile-reset-btn').addEventListener('click', resetLevel);
    
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

// Trigger Camera Shake
function triggerCameraShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimeRemaining = duration;
}

// Animation loop
function animate(currentTime) {
    if (!isAnimating) return;
    
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    const deltaTime = Math.min(dt, 0.1);
    
    if (gameRunning) {
        elapsedTime += deltaTime;
        document.getElementById('timer-value').textContent = elapsedTime.toFixed(1) + 's';
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw particles and ripples on overlay canvas
    updateRipples(deltaTime);
    drawRipples();
    
    updateBlocksState(deltaTime);
    
    updateParticles(deltaTime);
    drawParticles();
    
    ctx.restore();
    
    animationFrameId = requestAnimationFrame(animate);
}

// Sliding state update
function updateBlocksState(deltaTime) {
    activeBlocks.forEach(block => {
        if (block.state === 'sliding') {
            block.slideOffset += 12 * deltaTime;
            
            const rx = block.gridX + block.exitDir.x * block.slideOffset;
            const ry = block.gridY + block.exitDir.y * block.slideOffset;
            
            // Translate the HTML element
            const el = document.getElementById('block-' + block.id);
            if (el) {
                const tx = block.exitDir.x * block.slideOffset * cellSize;
                const ty = block.exitDir.y * block.slideOffset * cellSize;
                
                // Vanish effect: scale down and fade out as the block slides
                if (block.slideOffset > 0.2) {
                    const progress = Math.min(1, (block.slideOffset - 0.2) / 0.8); // 0 to 1
                    el.style.opacity = 1 - progress;
                    el.style.transform = `translate(${tx}px, ${ty}px) scale(${1 - progress * 0.4})`;
                } else {
                    el.style.transform = `translate(${tx}px, ${ty}px)`;
                }
            }
            
            if (Math.random() < 0.4) {
                spawnExhaustSpark(rx, ry, block.exitDir, BLOCK_COLORS[block.color].bg);
            }
            
            const isOut = rx < -1.1 || rx > currentGridWidth + 0.1 ||
                          ry < -1.1 || ry > currentGridHeight + 0.1;
            
            if (isOut) {
                block.state = 'completed';
                if (el) el.remove();
                
                updateBlockFreeClasses(); // Refresh unblocked list when block vanishes
                
                let edgeX = Math.max(-0.5, Math.min(currentGridWidth - 0.5, rx));
                let edgeY = Math.max(-0.5, Math.min(currentGridHeight - 0.5, ry));
                spawnRipple(edgeX, edgeY, BLOCK_COLORS[block.color].bg, 2.2);
                spawnClearParticles(edgeX, edgeY, BLOCK_COLORS[block.color].bg);
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
        
        const maxUnlocked = parseInt(localStorage.getItem('neon_arrows_level') || '0', 10);
        if (currentLevelIndex === maxUnlocked) {
            localStorage.setItem('neon_arrows_level', currentLevelIndex + 1);
        }
        
        if (currentLevelIndex === 0) {
            unlockAchievement('tutorial', 'Arrows Decrypt Rookie');
        }
        
        const config = LEVEL_CONFIGS[currentLevelIndex];
        
        // Star count calculation based on Moves Count relative to Par
        let stars = 1;
        if (movesCount <= config.numBlocks) {
            stars = 3;
            unlockAchievement('perfect', 'Arrow Master Logic');
        } else if (movesCount <= config.numBlocks + 2) {
            stars = 2;
        }
        
        // Apply Hint penalty
        if (hintUsed) {
            stars = Math.max(1, stars - 1);
        }
        
        if (currentLevelIndex === LEVEL_CONFIGS.length - 1) {
            unlockAchievement('master', 'Sector Mainframe Cracker');
        }
        
        // Render completed stars
        let starsHTML = '';
        for (let i = 1; i <= 3; i++) {
            if (i <= stars) {
                starsHTML += `<span class="gold-star">⭐</span>`;
            } else {
                starsHTML += `<span class="grey-star">⭐</span>`;
            }
        }
        
        let commentary = 'ACCESS GRANTED';
        if (stars === 3) commentary = 'HACK LEVEL: ELITE';
        else if (stars === 2) commentary = 'SYSTEM BYPASSED';
        
        document.getElementById('summary-time').textContent = elapsedTime.toFixed(1) + 's';
        document.getElementById('summary-target').textContent = config.numBlocks + ' Moves';
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
    movesCount--;
    document.getElementById('moves-value').textContent = movesCount;
    
    renderGridDOM();
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
        console.warn('Achievements Integration error.', e);
    }
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

// Exhaust sparks spray backwards
function spawnExhaustSpark(rx, ry, exitDir, color) {
    const cx = offsetLeft + rx * cellSize + cellSize / 2;
    const cy = offsetTop + ry * cellSize + cellSize / 2;
    
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
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.alpha;
        
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

// draw overlay ripples
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

function drawGridMatrix() {}

// Mute status
function updateMuteUI() {
    const btn = document.getElementById('mute-btn');
    if (btn) btn.innerHTML = isMuted ? '🔇' : '🔊';
}

// Run on document load
window.addEventListener('DOMContentLoaded', () => {
    const overlaySeen = localStorage.getItem('arcade_seen_neon-arrows') === '1';
    if (overlaySeen) {
        initGame();
    }
});
