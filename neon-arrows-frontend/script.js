// Neon Arrows Game Logic
// Handles levels, collision checking, rendering, sliding logic, achievements, and audio.

// Define Colors
const NEON_COLORS = {
    cyan: '#00ffcc',
    magenta: '#ff00ea',
    green: '#39ff14',
    yellow: '#ffff00',
    orange: '#ff5e00',
    purple: '#8a2be2',
    red: '#ff2d78'
};

const DOT_COLOR = '#1f2833';
const BG_INNER = '#0d0e12';

// Levels Definition
const LEVELS = [
    {
        // Level 1: Intro to sliding (5x5)
        gridWidth: 5,
        gridHeight: 5,
        perfectMoves: 3,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 0, y: -1}, path: [{x: 1, y: 3}, {x: 1, y: 2}, {x: 1, y: 1}] }, // Head (1,1) -> Up
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}] }, // Head (3,3) -> Down
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}] }  // Head (4,0) -> Right
        ]
    },
    {
        // Level 2: Simple Blocking (5x5)
        gridWidth: 5,
        gridHeight: 5,
        perfectMoves: 3,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 2}, {x: 2, y: 2}] }, // Head (2,2) -> Right
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}] }, // Head (3,3) -> Down
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 4}, {x: 3, y: 4}, {x: 4, y: 4}] } // Head (4,4) -> Right
        ]
    },
    {
        // Level 3: Crossroad Blocks (6x6)
        gridWidth: 6,
        gridHeight: 6,
        perfectMoves: 4,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}] }, // Head (3,1) -> Right (Blocked by L2)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 0}, {x: 4, y: 1}, {x: 4, y: 2}] }, // Head (4,2) -> Down (Blocked by L3, L4)
            { id: 'L3', color: 'yellow', exitDir: {x: -1, y: 0}, path: [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}] }, // Head (2,4) -> Left (Clear!)
            { id: 'L4', color: 'purple', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 3}, {x: 2, y: 3}, {x: 3, y: 3}, {x: 4, y: 3}] } // Head (4,3) -> Right (Clear!)
        ]
    },
    {
        // Level 4: Corner Traps (6x6)
        gridWidth: 6,
        gridHeight: 6,
        perfectMoves: 4,
        lines: [
            { id: 'L1', color: 'green', exitDir: {x: 0, y: 1}, path: [{x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3}] }, // Head (2,3) -> Down (Blocked by L2)
            { id: 'L2', color: 'purple', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 4}, {x: 2, y: 4}, {x: 3, y: 4}] }, // Head (3,4) -> Right (Blocked by L3)
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 4, y: 2}, {x: 4, y: 3}, {x: 4, y: 4}] }, // Head (4,4) -> Right (Clear!)
            { id: 'L4', color: 'orange', exitDir: {x: 0, y: 1}, path: [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 3}] }  // Head (1,3) -> Down (Blocked by L2)
        ]
    },
    {
        // Level 5: Snake Pit (7x7)
        gridWidth: 7,
        gridHeight: 7,
        perfectMoves: 5,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: -1, y: 0}, path: [{x: 1, y: 1}, {x: 2, y: 1}, {x: 2, y: 2}, {x: 1, y: 2}] }, // Head (1,2) -> Left (Clear)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: -1}, path: [{x: 3, y: 1}, {x: 3, y: 2}, {x: 4, y: 2}, {x: 4, y: 1}] }, // Head (4,1) -> Up (Clear)
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 3}, {x: 2, y: 4}, {x: 3, y: 4}, {x: 3, y: 3}] }, // Head (3,3) -> Right (Blocked by L4)
            { id: 'L4', color: 'orange', exitDir: {x: 0, y: 1}, path: [{x: 5, y: 1}, {x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4}] }, // Head (5,4) -> Down (Clear)
            { id: 'L5', color: 'purple', exitDir: {x: 0, y: -1}, path: [{x: 2, y: 5}, {x: 3, y: 5}, {x: 4, y: 5}, {x: 4, y: 4}] } // Head (4,4) -> Up (Blocked by L2, L3)
        ]
    },
    {
        // Level 6: The Cage (7x7)
        gridWidth: 7,
        gridHeight: 7,
        perfectMoves: 6,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 0, y: 1}, path: [{x: 0, y: 3}, {x: 1, y: 3}, {x: 2, y: 3}] }, // Head (2,3) -> Down (Blocked by L2)
            { id: 'L2', color: 'magenta', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 4}, {x: 3, y: 4}, {x: 4, y: 4}] }, // Head (4,4) -> Right (Blocked by L3)
            { id: 'L3', color: 'yellow', exitDir: {x: 0, y: 1}, path: [{x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4}] }, // Head (5,4) -> Down (Clear!)
            { id: 'L4', color: 'orange', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 5}, {x: 2, y: 5}, {x: 3, y: 5}, {x: 4, y: 5}] }, // Head (4,5) -> Right (Clear!)
            { id: 'L5', color: 'green', exitDir: {x: 1, y: 0}, path: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}] }, // Head (3,1) -> Right (Clear!)
            { id: 'L6', color: 'purple', exitDir: {x: 0, y: 1}, path: [{x: 2, y: 2}, {x: 3, y: 2}] } // Head (3,2) -> Down (Clear!)
        ]
    },
    {
        // Level 7: The Double Helix (8x8)
        gridWidth: 8,
        gridHeight: 8,
        perfectMoves: 7,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 1}, {x: 3, y: 1}] }, // Head (3,1) -> Right (Blocked by L2)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 0}, {x: 4, y: 1}, {x: 4, y: 2}] }, // Head (4,2) -> Down (Blocked by L3)
            { id: 'L3', color: 'yellow', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 3}, {x: 4, y: 4}, {x: 4, y: 5}] }, // Head (4,5) -> Down (Blocked by L4)
            { id: 'L4', color: 'purple', exitDir: {x: -1, y: 0}, path: [{x: 4, y: 6}, {x: 3, y: 6}, {x: 2, y: 6}] }, // Head (2,6) -> Left (Blocked by L5)
            { id: 'L5', color: 'orange', exitDir: {x: 0, y: -1}, path: [{x: 1, y: 6}, {x: 1, y: 5}, {x: 1, y: 4}] }, // Head (1,4) -> Up (Blocked by L6)
            { id: 'L6', color: 'green', exitDir: {x: 0, y: -1}, path: [{x: 1, y: 3}, {x: 1, y: 2}] }, // Head (1,2) -> Up (Clear!)
            { id: 'L7', color: 'red', exitDir: {x: 1, y: 0}, path: [{x: 3, y: 3}, {x: 3, y: 4}] } // Head (3,4) -> Right (Blocked by L3)
        ]
    },
    {
        // Level 8: Gridlock (8x8)
        gridWidth: 8,
        gridHeight: 8,
        perfectMoves: 8,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: -1, y: 0}, path: [{x: 3, y: 1}, {x: 2, y: 1}, {x: 1, y: 1}] }, // Head (1,1) -> Left (Clear!)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: -1}, path: [{x: 2, y: 3}, {x: 2, y: 2}] }, // Head (2,2) -> Up (Blocked by L1)
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 3}, {x: 1, y: 4}, {x: 2, y: 4}] }, // Head (2,4) -> Right (Blocked by L4)
            { id: 'L4', color: 'purple', exitDir: {x: 0, y: -1}, path: [{x: 3, y: 4}, {x: 3, y: 3}] }, // Head (3,3) -> Up (Blocked by L8)
            { id: 'L5', color: 'orange', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 1}, {x: 4, y: 2}] }, // Head (4,2) -> Down (Blocked by L4)
            { id: 'L6', color: 'green', exitDir: {x: 1, y: 0}, path: [{x: 4, y: 3}, {x: 5, y: 3}] }, // Head (5,3) -> Right (Clear!)
            { id: 'L7', color: 'red', exitDir: {x: 0, y: 1}, path: [{x: 5, y: 2}, {x: 5, y: 1}] }, // Head (5,1) -> Down (Blocked by L6)
            { id: 'L8', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 3, y: 0}, {x: 4, y: 0}] } // Head (4,0) -> Right (Clear!)
        ]
    },
    {
        // Level 9: Spiral Loop (9x9)
        gridWidth: 9,
        gridHeight: 9,
        perfectMoves: 9,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}] }, // Head (3,1) -> Right (Blocked by L2)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 0}, {x: 4, y: 1}, {x: 4, y: 2}] }, // Head (4,2) -> Down (Blocked by L3)
            { id: 'L3', color: 'yellow', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 3}, {x: 4, y: 4}, {x: 4, y: 5}] }, // Head (4,5) -> Down (Blocked by L4)
            { id: 'L4', color: 'purple', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 6}, {x: 4, y: 7}, {x: 4, y: 8}] }, // Head (4,8) -> Down (Clear!)
            { id: 'L5', color: 'orange', exitDir: {x: -1, y: 0}, path: [{x: 3, y: 8}, {x: 2, y: 8}, {x: 1, y: 8}] }, // Head (1,8) -> Left (Clear!)
            { id: 'L6', color: 'green', exitDir: {x: 0, y: -1}, path: [{x: 1, y: 7}, {x: 1, y: 6}, {x: 1, y: 5}] }, // Head (1,5) -> Up (Blocked by L7, L1)
            { id: 'L7', color: 'red', exitDir: {x: 0, y: -1}, path: [{x: 1, y: 4}, {x: 1, y: 3}, {x: 1, y: 2}] }, // Head (1,2) -> Up (Blocked by L1)
            { id: 'L8', color: 'cyan', exitDir: {x: 0, y: 1}, path: [{x: 2, y: 3}, {x: 2, y: 4}, {x: 2, y: 5}] }, // Head (2,5) -> Down (Blocked by L5)
            { id: 'L9', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 3, y: 3}, {x: 3, y: 4}, {x: 3, y: 5}] } // Head (3,5) -> Down (Blocked by L5)
        ]
    },
    {
        // Level 10: Master Control Program (10x10)
        gridWidth: 10,
        gridHeight: 10,
        perfectMoves: 11,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}] }, // Head (3,1) -> Right (Blocked by L2)
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 1}, {x: 4, y: 2}] }, // Head (4,2) -> Down (Blocked by L3)
            { id: 'L3', color: 'green', exitDir: {x: 1, y: 0}, path: [{x: 4, y: 3}, {x: 5, y: 3}] }, // Head (5,3) -> Right (Blocked by L4)
            { id: 'L4', color: 'yellow', exitDir: {x: 0, y: 1}, path: [{x: 6, y: 3}, {x: 6, y: 4}] }, // Head (6,4) -> Down (Blocked by L5)
            { id: 'L5', color: 'orange', exitDir: {x: -1, y: 0}, path: [{x: 6, y: 5}, {x: 5, y: 5}] }, // Head (5,5) -> Left (Blocked by L6)
            { id: 'L6', color: 'purple', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 4}, {x: 4, y: 5}] }, // Head (4,5) -> Down (Blocked by L11)
            { id: 'L7', color: 'red', exitDir: {x: -1, y: 0}, path: [{x: 3, y: 4}, {x: 2, y: 4}] }, // Head (2,4) -> Left (Blocked by L8)
            { id: 'L8', color: 'cyan', exitDir: {x: 0, y: 1}, path: [{x: 1, y: 4}, {x: 1, y: 5}] }, // Head (1,5) -> Down (Blocked by L9)
            { id: 'L9', color: 'magenta', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 6}, {x: 2, y: 6}] }, // Head (2,6) -> Right (Blocked by L10)
            { id: 'L10', color: 'yellow', exitDir: {x: 0, y: 1}, path: [{x: 3, y: 6}, {x: 3, y: 7}] }, // Head (3,7) -> Down (Clear!)
            { id: 'L11', color: 'green', exitDir: {x: -1, y: 0}, path: [{x: 5, y: 7}, {x: 4, y: 7}] } // Head (4,7) -> Left (Blocked by L10)
        ]
    },
    {
        // Level 11: The Serpent Grid (10x10)
        gridWidth: 10,
        gridHeight: 10,
        perfectMoves: 5,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 0, y: 1}, path: [{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 1, y: 4}, {x: 2, y: 4}, {x: 3, y: 4}, {x: 3, y: 5}, {x: 3, y: 6}, {x: 3, y: 7}, {x: 3, y: 8}] }, // Exits DOWN
            { id: 'L2', color: 'magenta', exitDir: {x: 1, y: 0}, path: [{x: 2, y: 9}, {x: 3, y: 9}, {x: 4, y: 9}, {x: 5, y: 9}] }, // Exits RIGHT
            { id: 'L3', color: 'yellow', exitDir: {x: 0, y: -1}, path: [{x: 8, y: 6}, {x: 8, y: 7}, {x: 8, y: 8}, {x: 8, y: 9}] }, // Exits UP
            { id: 'L4', color: 'orange', exitDir: {x: 1, y: 0}, path: [{x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}] }, // Exits RIGHT
            { id: 'L5', color: 'green', exitDir: {x: 0, y: -1}, path: [{x: 9, y: 1}, {x: 9, y: 2}, {x: 9, y: 3}, {x: 9, y: 4}] } // Exits UP
        ]
    },
    {
        // Level 12: The Spiral Maze (11x11)
        gridWidth: 11,
        gridHeight: 11,
        perfectMoves: 6,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}, {x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4}, {x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}, {x: 2, y: 3}, {x: 3, y: 3}, {x: 4, y: 3}] }, // Spiral, exits RIGHT
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 7, y: 2}, {x: 7, y: 3}, {x: 7, y: 4}, {x: 7, y: 5}] }, // Exits DOWN
            { id: 'L3', color: 'yellow', exitDir: {x: 1, y: 0}, path: [{x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}] }, // Exits RIGHT
            { id: 'L4', color: 'purple', exitDir: {x: 0, y: -1}, path: [{x: 9, y: 6}, {x: 9, y: 7}, {x: 9, y: 8}, {x: 9, y: 9}] }, // Exits UP
            { id: 'L5', color: 'orange', exitDir: {x: 1, y: 0}, path: [{x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0}] }, // Exits RIGHT
            { id: 'L6', color: 'green', exitDir: {x: 0, y: 1}, path: [{x: 10, y: 0}, {x: 10, y: 1}] } // Exits DOWN
        ]
    },
    {
        // Level 13: Grand Labyrinth Mainframe (12x12)
        gridWidth: 12,
        gridHeight: 12,
        perfectMoves: 7,
        lines: [
            { id: 'L1', color: 'cyan', exitDir: {x: 1, y: 0}, path: [{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 2, y: 3}, {x: 2, y: 4}, {x: 2, y: 5}, {x: 3, y: 5}, {x: 4, y: 5}, {x: 4, y: 6}, {x: 4, y: 7}, {x: 5, y: 7}] }, // Zig-zag, exits RIGHT
            { id: 'L2', color: 'magenta', exitDir: {x: 0, y: 1}, path: [{x: 6, y: 7}, {x: 6, y: 8}, {x: 6, y: 9}] }, // Exits DOWN
            { id: 'L3', color: 'yellow', exitDir: {x: -1, y: 0}, path: [{x: 5, y: 10}, {x: 6, y: 10}] }, // Exits LEFT
            { id: 'L4', color: 'purple', exitDir: {x: 0, y: 1}, path: [{x: 4, y: 8}, {x: 4, y: 9}, {x: 4, y: 10}] }, // Exits DOWN
            { id: 'L5', color: 'orange', exitDir: {x: 1, y: 0}, path: [{x: 3, y: 11}, {x: 4, y: 11}, {x: 5, y: 11}] }, // Exits RIGHT
            { id: 'L6', color: 'green', exitDir: {x: 0, y: -1}, path: [{x: 7, y: 9}, {x: 7, y: 10}, {x: 7, y: 11}] }, // Exits UP
            { id: 'L7', color: 'red', exitDir: {x: 1, y: 0}, path: [{x: 6, y: 3}, {x: 7, y: 3}, {x: 8, y: 3}] } // Exits RIGHT
        ]
    }
];

// Local SFX backup synthesizer
const sound = {
    playClick: () => {
        try {
            const fx = window.audioFX || (window.parent && window.parent.audioFX);
            if (fx) fx.playEat();
            else playLocalOscillator(400, 'sine', 0.05);
        } catch (e) {}
    },
    playSlide: () => {
        try {
            const fx = window.audioFX || (window.parent && window.parent.audioFX);
            if (fx) fx.playJump();
            else playLocalOscillator(150, 'triangle', 0.25, 600);
        } catch (e) {}
    },
    playBump: () => {
        try {
            const fx = window.audioFX || (window.parent && window.parent.audioFX);
            if (fx) fx.playGameOver(); // low rumble
            else playLocalOscillator(90, 'sawtooth', 0.15);
        } catch (e) {}
    },
    playVictory: () => {
        try {
            const fx = window.audioFX || (window.parent && window.parent.audioFX);
            if (fx) fx.playVictory();
            else {
                playLocalOscillator(261.63, 'square', 0.1);
                setTimeout(() => playLocalOscillator(329.63, 'square', 0.1), 100);
                setTimeout(() => playLocalOscillator(392.00, 'square', 0.1), 200);
                setTimeout(() => playLocalOscillator(523.25, 'square', 0.2), 300);
            }
        } catch (e) {}
    }
};

function playLocalOscillator(startFreq, type, duration, endFreq = null) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        if (endFreq) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

// Global Game Variables
let currentLevelIndex = 0;
let currentGridWidth = 5;
let currentGridHeight = 5;
let movesCount = 0;
let isMuted = false;
let activeLines = [];
let originalLines = [];
let particles = [];
let movesHistory = [];

// Canvas Variables
let canvas, ctx;
let cellSize = 60;
let offsetLeft = 0;
let offsetTop = 0;

// Game State Loops
let isAnimating = false;
let animationFrameId = null;

// Shaking state for lines
const shakeStates = {}; // lineId -> { timeStart, duration, intensity }

// Initialization
function initGame() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Set Canvas DPI
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Bind UI Buttons
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').classList.remove('active');
        sound.playClick();
    });
    
    document.getElementById('htp-btn').addEventListener('click', () => {
        document.getElementById('htp-overlay').classList.add('active');
        sound.playClick();
    });
    
    document.getElementById('htp-close').addEventListener('click', () => {
        document.getElementById('htp-overlay').classList.remove('active');
        sound.playClick();
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.add('active');
        sound.playClick();
    });
    
    document.getElementById('resume-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.remove('active');
        sound.playClick();
    });
    
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
        document.getElementById('pause-screen').classList.remove('active');
        resetLevel();
        sound.playClick();
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
        sound.playClick();
    });
    
    document.getElementById('victory-home-btn').addEventListener('click', () => {
        document.getElementById('victory-screen').classList.remove('active');
        sound.playClick();
        window.top.location.href = '../index.html';
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        sound.playClick();
        window.top.location.href = '../index.html';
    });
    
    // Mute Logic
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
        sound.playClick();
    });
    
    // Canvas Mouse/Touch Bindings
    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    
    // Load Saved Progress or Level 1
    const savedLvl = localStorage.getItem('neon_arrows_level');
    if (savedLvl !== null) {
        currentLevelIndex = parseInt(savedLvl, 10);
        if (isNaN(currentLevelIndex) || currentLevelIndex >= LEVELS.length) {
            currentLevelIndex = 0;
        }
    }
    
    loadLevel(currentLevelIndex);
    
    // Start Game Loops
    isAnimating = true;
    animate();
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
    
    // Maintain square layout for the grid console
    const size = Math.min(w, h, 650);
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    ctx.scale(dpr, dpr);
    
    // Recalculate cell sizes
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

// Load Level
function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    currentLevelIndex = index;
    localStorage.setItem('neon_arrows_level', currentLevelIndex);
    
    const levelData = LEVELS[index];
    currentGridWidth = levelData.gridWidth;
    currentGridHeight = levelData.gridHeight;
    movesCount = 0;
    movesHistory = [];
    particles = [];
    
    // Deep copy level lines
    activeLines = levelData.lines.map(line => ({
        id: line.id,
        color: line.color,
        exitDir: { x: line.exitDir.x, y: line.exitDir.y },
        path: line.path.map(pt => ({ x: pt.x, y: pt.y })),
        slideOffset: 0,
        state: 'idle' // idle, sliding, completed
    }));
    
    originalLines = JSON.parse(JSON.stringify(activeLines));
    
    // Update HTML HUD stats
    document.getElementById('level-value').textContent = currentLevelIndex + 1;
    document.getElementById('moves-value').textContent = movesCount;
    document.getElementById('perfect-value').textContent = levelData.perfectMoves;
    
    // Recalculate dimensions
    const size = parseFloat(canvas.style.width);
    calculateGridMetrics(size);
}

function resetLevel() {
    loadLevel(currentLevelIndex);
    sound.playClick();
}

function loadNextLevel() {
    if (currentLevelIndex + 1 < LEVELS.length) {
        loadLevel(currentLevelIndex + 1);
    } else {
        // Complete game, show final screen
        document.getElementById('victory-screen').classList.add('active');
        sound.playVictory();
    }
}

// Math logic to fetch E(t) - Point along the extended path
function getPointOnPath(t, path, exitDir) {
    const N = path.length - 1;
    if (t <= N) {
        const i = Math.floor(t);
        const frac = t - i;
        if (i >= N) return { x: path[N].x, y: path[N].y };
        const p1 = path[i];
        const p2 = path[i + 1];
        return {
            x: p1.x + frac * (p2.x - p1.x),
            y: p1.y + frac * (p2.y - p1.y)
        };
    } else {
        const extra = t - N;
        const head = path[N];
        return {
            x: head.x + extra * exitDir.x,
            y: head.y + extra * exitDir.y
        };
    }
}

// Draw Loop
function animate() {
    if (!isAnimating) return;
    
    ctx.fillStyle = BG_INNER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Grid Dots
    drawGridDots();
    
    // 2. Update and Draw Lines
    updateLinesState();
    drawLines();
    
    // 3. Update and Draw Particles
    updateParticles();
    drawParticles();
    
    animationFrameId = requestAnimationFrame(animate);
}

function drawGridDots() {
    ctx.fillStyle = DOT_COLOR;
    for (let x = 0; x < currentGridWidth; x++) {
        for (let y = 0; y < currentGridHeight; y++) {
            const cx = offsetLeft + x * cellSize + cellSize / 2;
            const cy = offsetTop + y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawLines() {
    activeLines.forEach(line => {
        if (line.state === 'completed') return;
        
        const path = line.path;
        const N = path.length - 1;
        const offset = line.slideOffset;
        const color = NEON_COLORS[line.color] || '#ffffff';
        
        // Sample points to draw
        const drawPoints = [];
        const startT = offset;
        const endT = offset + N;
        
        // Start point
        drawPoints.push(getPointOnPath(startT, path, line.exitDir));
        
        // Intermediate integers
        const startInt = Math.ceil(startT);
        const endInt = Math.floor(endT);
        for (let k = startInt; k <= endInt; k++) {
            drawPoints.push(getPointOnPath(k, path, line.exitDir));
        }
        
        // End point
        drawPoints.push(getPointOnPath(endT, path, line.exitDir));
        
        // Calculate shake offset if shaking
        let sx = 0, sy = 0;
        if (shakeStates[line.id]) {
            const s = shakeStates[line.id];
            const elapsed = Date.now() - s.timeStart;
            if (elapsed < s.duration) {
                const angle = elapsed * 0.08;
                const damp = 1 - elapsed / s.duration;
                sx = Math.sin(angle) * s.intensity * damp;
                sy = Math.cos(angle * 1.3) * s.intensity * damp;
            } else {
                delete shakeStates[line.id];
            }
        }
        
        // Convert grid coords to canvas coords
        const canvasPoints = drawPoints.map(pt => ({
            x: offsetLeft + pt.x * cellSize + cellSize / 2 + sx,
            y: offsetTop + pt.y * cellSize + cellSize / 2 + sy
        }));
        
        // 1. Draw Outer Glowing Shadow
        ctx.strokeStyle = color;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
            ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.stroke();
        
        // Reset shadow for inner tube
        ctx.shadowBlur = 0;
        
        // 2. Draw Inner Core Tube
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
            ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.stroke();
        
        // 3. Draw Arrowhead Indicator at the End (Head)
        const headPt = canvasPoints[canvasPoints.length - 1];
        const lastPt = canvasPoints[canvasPoints.length - 2] || canvasPoints[0];
        
        // Get direction of head segment
        let angle = Math.atan2(headPt.y - lastPt.y, headPt.x - lastPt.x);
        if (canvasPoints.length === 2 && headPt.x === lastPt.x && headPt.y === lastPt.y) {
            angle = Math.atan2(line.exitDir.y, line.exitDir.x);
        }
        
        drawArrowhead(headPt.x, headPt.y, angle, color);
    });
}

function drawArrowhead(x, y, angle, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Particle Engine
function spawnClearParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: offsetLeft + x * cellSize + cellSize / 2,
            y: offsetTop + y * cellSize + cellSize / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 3 + Math.random() * 3,
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}

function updateParticles() {
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
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

// Collision Check
function isLineBlocked(line, activeList) {
    const path = line.path;
    const head = path[path.length - 1];
    const dx = line.exitDir.x;
    const dy = line.exitDir.y;
    
    let cx = head.x + dx;
    let cy = head.y + dy;
    
    while (cx >= 0 && cx < currentGridWidth && cy >= 0 && cy < currentGridHeight) {
        for (const other of activeList) {
            if (other.id === line.id || other.state === 'completed') continue;
            for (const pt of other.path) {
                if (pt.x === cx && pt.y === cy) {
                    return { blocked: true, by: other };
                }
            }
        }
        cx += dx;
        cy += dy;
    }
    return { blocked: false };
}

// Tap Event Handlers
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
    if (isAnimatingLines()) return; // Lock inputs during transitions
    
    // Get Grid Coords from tap position
    const gridX = Math.floor((canvasX - offsetLeft) / cellSize);
    const gridY = Math.floor((canvasY - offsetTop) / cellSize);
    
    // Find clicked line
    const clicked = activeLines.find(line => {
        if (line.state !== 'idle') return false;
        return line.path.some(pt => pt.x === gridX && pt.y === gridY);
    });
    
    if (!clicked) return;
    
    // Check if blocked
    const result = isLineBlocked(clicked, activeLines);
    if (result.blocked) {
        // Trigger shake
        shakeStates[clicked.id] = {
            timeStart: Date.now(),
            duration: 250,
            intensity: 7
        };
        sound.playBump();
    } else {
        // Trigger slide
        clicked.state = 'sliding';
        movesCount++;
        document.getElementById('moves-value').textContent = movesCount;
        
        // Save history for Undo
        movesHistory.push(JSON.parse(JSON.stringify(activeLines)));
        
        sound.playSlide();
    }
}

function isAnimatingLines() {
    return activeLines.some(line => line.state === 'sliding');
}

// Update sliding positions
function updateLinesState() {
    activeLines.forEach(line => {
        if (line.state === 'sliding') {
            // Slide speed factor
            line.slideOffset += 0.15;
            
            // Spawn trail particles at the head
            const N = line.path.length - 1;
            const headCoord = getPointOnPath(line.slideOffset + N, line.path, line.exitDir);
            if (headCoord.x >= 0 && headCoord.x < currentGridWidth && headCoord.y >= 0 && headCoord.y < currentGridHeight) {
                particles.push({
                    x: offsetLeft + headCoord.x * cellSize + cellSize / 2,
                    y: offsetTop + headCoord.y * cellSize + cellSize / 2,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    color: NEON_COLORS[line.color],
                    size: 2 + Math.random() * 2,
                    alpha: 0.8,
                    decay: 0.04
                });
            }
            
            // Check if fully exited the grid
            // Exit condition: tail (offset) goes past the screen boundary
            const tailCoord = getPointOnPath(line.slideOffset, line.path, line.exitDir);
            const isOut = tailCoord.x < -0.5 || tailCoord.x >= currentGridWidth + 0.5 ||
                          tailCoord.y < -0.5 || tailCoord.y >= currentGridHeight + 0.5;
            
            if (isOut) {
                line.state = 'completed';
                
                // Particle burst at final grid location before disappearing
                const lastIdx = line.path.length - 1;
                spawnClearParticles(line.path[lastIdx].x, line.path[lastIdx].y, NEON_COLORS[line.color]);
                
                checkVictory();
            }
        }
    });
}

function checkVictory() {
    const allCleared = activeLines.every(line => line.state === 'completed');
    if (allCleared) {
        sound.playVictory();
        
        // Unlock Achievements
        if (currentLevelIndex === 0) {
            unlockAchievement('tutorial', 'Arrows Decrypt Rookie');
        }
        
        const perfectTarget = LEVELS[currentLevelIndex].perfectMoves;
        if (movesCount <= perfectTarget) {
            unlockAchievement('perfect', 'Arrow Master Logic');
            document.getElementById('perfect-badge').style.display = 'block';
        } else {
            document.getElementById('perfect-badge').style.display = 'none';
        }
        
        if (currentLevelIndex === LEVELS.length - 1) {
            unlockAchievement('master', 'Sector Mainframe Cracker');
        }
        
        // Show Complete Screen Overlay
        document.getElementById('summary-moves').textContent = movesCount;
        document.getElementById('summary-perfect').textContent = perfectTarget;
        
        setTimeout(() => {
            document.getElementById('complete-screen').classList.add('active');
        }, 600);
    }
}

function undoMove() {
    if (isAnimatingLines() || movesHistory.length === 0) return;
    activeLines = movesHistory.pop();
    movesCount--;
    document.getElementById('moves-value').textContent = movesCount;
    sound.playClick();
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

// Run on Load
window.addEventListener('DOMContentLoaded', () => {
    // Only initialize when pre-game overlay is clicked to maintain Ads Compliance
    const overlaySeen = localStorage.getItem('arcade_seen_neon-arrows') === '1';
    if (overlaySeen) {
        initGame();
    }
});
