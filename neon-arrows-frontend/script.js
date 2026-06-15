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
// 20 hand-crafted level configurations containing walls and sticky rotators for strategic depth
const LEVEL_CONFIGS = [
    // Level 1: Intro (3x3)
    {
        gridWidth: 3, gridHeight: 3, parMoves: 3,
        blocks: [
            { id: 'b1', x: 0, y: 0, color: 'cyan', exitDir: { x: -1, y: 0 } },
            { id: 'b2', x: 2, y: 2, color: 'pink', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 0, y: 2, color: 'yellow', exitDir: { x: 0, y: 1 } }
        ],
        walls: [], rotators: []
    },
    // Level 2: Intersecting paths (3x3)
    {
        gridWidth: 3, gridHeight: 3, parMoves: 4,
        blocks: [
            { id: 'b1', x: 1, y: 1, color: 'blue', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 2, y: 1, color: 'red', exitDir: { x: 0, y: -1 } },
            { id: 'b3', x: 0, y: 0, color: 'green', exitDir: { x: -1, y: 0 } },
            { id: 'b4', x: 0, y: 2, color: 'purple', exitDir: { x: 0, y: 1 } }
        ],
        walls: [], rotators: []
    },
    // Level 3: Obstacle Wall (3x3)
    {
        gridWidth: 3, gridHeight: 3, parMoves: 3,
        blocks: [
            { id: 'b1', x: 0, y: 1, color: 'green', exitDir: { x: 0, y: -1 } },
            { id: 'b2', x: 2, y: 1, color: 'orange', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 1, y: 2, color: 'red', exitDir: { x: 0, y: 1 } }
        ],
        walls: [{ x: 1, y: 1 }],
        rotators: []
    },
    // Level 4: Simple Rotator (3x3)
    {
        gridWidth: 3, gridHeight: 3, parMoves: 4,
        blocks: [
            { id: 'b1', x: 1, y: 2, color: 'cyan', exitDir: { x: 0, y: -1 } },
            { id: 'b2', x: 0, y: 0, color: 'pink', exitDir: { x: -1, y: 0 } }
        ],
        walls: [],
        rotators: [{ x: 1, y: 1, dir: { x: 1, y: 0 } }]
    },
    // Level 5: Basic Maze (4x4)
    {
        gridWidth: 4, gridHeight: 4, parMoves: 5,
        blocks: [
            { id: 'b1', x: 0, y: 1, color: 'yellow', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 2, y: 3, color: 'purple', exitDir: { x: 0, y: -1 } },
            { id: 'b3', x: 3, y: 0, color: 'blue', exitDir: { x: 1, y: 0 } }
        ],
        walls: [{ x: 0, y: 2 }, { x: 3, y: 3 }],
        rotators: [{ x: 2, y: 1, dir: { x: 0, y: -1 } }]
    },
    // Level 6: Rotator Sequencing (4x4)
    {
        gridWidth: 4, gridHeight: 4, parMoves: 5,
        blocks: [
            { id: 'b1', x: 0, y: 2, color: 'orange', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 2, y: 0, color: 'green', exitDir: { x: 0, y: 1 } },
            { id: 'b3', x: 3, y: 2, color: 'red', exitDir: { x: 1, y: 0 } }
        ],
        walls: [{ x: 1, y: 1 }],
        rotators: [{ x: 2, y: 2, dir: { x: 0, y: -1 } }]
    },
    // Level 7: The Double Turn (4x4)
    {
        gridWidth: 4, gridHeight: 4, parMoves: 4,
        blocks: [
            { id: 'b1', x: 0, y: 3, color: 'pink', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 1, y: 0, color: 'blue', exitDir: { x: 0, y: -1 } }
        ],
        walls: [{ x: 1, y: 2 }],
        rotators: [
            { x: 2, y: 3, dir: { x: 0, y: -1 } },
            { x: 2, y: 1, dir: { x: -1, y: 0 } }
        ]
    },
    // Level 8: Wall Blockade (4x4)
    {
        gridWidth: 4, gridHeight: 4, parMoves: 6,
        blocks: [
            { id: 'b1', x: 0, y: 1, color: 'red', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 0, y: 2, color: 'blue', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 3, y: 0, color: 'green', exitDir: { x: 0, y: -1 } }
        ],
        walls: [{ x: 1, y: 0 }, { x: 1, y: 3 }],
        rotators: [
            { x: 2, y: 1, dir: { x: 0, y: -1 } },
            { x: 2, y: 2, dir: { x: 0, y: 1 } }
        ]
    },
    // Level 9: Central Crossroads (5x5)
    {
        gridWidth: 5, gridHeight: 5, parMoves: 5,
        blocks: [
            { id: 'b1', x: 2, y: 4, color: 'purple', exitDir: { x: 0, y: -1 } },
            { id: 'b2', x: 0, y: 2, color: 'cyan', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 4, y: 2, color: 'yellow', exitDir: { x: -1, y: 0 } }
        ],
        walls: [{ x: 1, y: 1 }, { x: 3, y: 3 }],
        rotators: [{ x: 2, y: 2, dir: { x: -1, y: 0 } }]
    },
    // Level 10: Labyrinth (5x5)
    {
        gridWidth: 5, gridHeight: 5, parMoves: 7,
        blocks: [
            { id: 'b1', x: 1, y: 1, color: 'orange', exitDir: { x: 0, y: 1 } },
            { id: 'b2', x: 3, y: 3, color: 'green', exitDir: { x: -1, y: 0 } },
            { id: 'b3', x: 4, y: 1, color: 'blue', exitDir: { x: -1, y: 0 } }
        ],
        walls: [{ x: 2, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 2 }],
        rotators: [{ x: 1, y: 3, dir: { x: 0, y: -1 } }]
    },
    // Level 11: Bottleneck Grid (5x5)
    {
        gridWidth: 5, gridHeight: 5, parMoves: 6,
        blocks: [
            { id: 'b1', x: 0, y: 2, color: 'red', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 2, y: 0, color: 'yellow', exitDir: { x: 0, y: 1 } },
            { id: 'b3', x: 4, y: 2, color: 'purple', exitDir: { x: -1, y: 0 } },
            { id: 'b4', x: 2, y: 4, color: 'cyan', exitDir: { x: 0, y: -1 } }
        ],
        walls: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
        rotators: [{ x: 2, y: 2, dir: { x: 1, y: 0 } }]
    },
    // Level 12: Maze Matrix (5x5)
    {
        gridWidth: 5, gridHeight: 5, parMoves: 7,
        blocks: [
            { id: 'b1', x: 0, y: 0, color: 'blue', exitDir: { x: 0, y: 1 } },
            { id: 'b2', x: 0, y: 4, color: 'pink', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 4, y: 4, color: 'green', exitDir: { x: 0, y: -1 } }
        ],
        walls: [{ x: 1, y: 1 }, { x: 3, y: 3 }],
        rotators: [
            { x: 0, y: 2, dir: { x: 1, y: 0 } },
            { x: 2, y: 4, dir: { x: 0, y: -1 } }
        ]
    },
    // Level 13: Spiral (6x6)
    {
        gridWidth: 6, gridHeight: 6, parMoves: 8,
        blocks: [
            { id: 'b1', x: 1, y: 1, color: 'orange', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 4, y: 4, color: 'cyan', exitDir: { x: 0, y: -1 } },
            { id: 'b3', x: 1, y: 4, color: 'red', exitDir: { x: -1, y: 0 } }
        ],
        walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
        rotators: [
            { x: 4, y: 1, dir: { x: 0, y: 1 } },
            { x: 1, y: 4, dir: { x: -1, y: 0 } }
        ]
    },
    // Level 14: Loop Back (6x6)
    {
        gridWidth: 6, gridHeight: 6, parMoves: 9,
        blocks: [
            { id: 'b1', x: 0, y: 1, color: 'yellow', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 2, y: 2, color: 'purple', exitDir: { x: 0, y: 1 } }
        ],
        walls: [{ x: 2, y: 0 }, { x: 3, y: 3 }],
        rotators: [
            { x: 4, y: 1, dir: { x: 0, y: 1 } },
            { x: 4, y: 4, dir: { x: -1, y: 0 } },
            { x: 1, y: 4, dir: { x: 0, y: -1 } }
        ]
    },
    // Level 15: Tight Corridors (6x6)
    {
        gridWidth: 6, gridHeight: 6, parMoves: 8,
        blocks: [
            { id: 'b1', x: 1, y: 0, color: 'green', exitDir: { x: 0, y: 1 } },
            { id: 'b2', x: 4, y: 5, color: 'pink', exitDir: { x: 0, y: -1 } },
            { id: 'b3', x: 0, y: 3, color: 'blue', exitDir: { x: 1, y: 0 } }
        ],
        walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
        rotators: [
            { x: 1, y: 4, dir: { x: 1, y: 0 } },
            { x: 4, y: 1, dir: { x: -1, y: 0 } }
        ]
    },
    // Level 16: Interceptor (7x7)
    {
        gridWidth: 7, gridHeight: 7, parMoves: 10,
        blocks: [
            { id: 'b1', x: 3, y: 6, color: 'red', exitDir: { x: 0, y: -1 } },
            { id: 'b2', x: 0, y: 3, color: 'cyan', exitDir: { x: 1, y: 0 } },
            { id: 'b3', x: 6, y: 3, color: 'yellow', exitDir: { x: -1, y: 0 } },
            { id: 'b4', x: 3, y: 0, color: 'orange', exitDir: { x: 0, y: 1 } }
        ],
        walls: [
            { x: 1, y: 1 }, { x: 5, y: 1 },
            { x: 1, y: 5 }, { "x": 5, "y": 5 }
        ],
        rotators: [{ x: 3, y: 3, dir: { x: -1, y: 0 } }]
    },
    // Level 17: Obstacle Grid (7x7)
    {
        gridWidth: 7, gridHeight: 7, parMoves: 9,
        blocks: [
            { id: 'b1', x: 1, y: 1, color: 'purple', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 5, y: 5, color: 'green', exitDir: { x: -1, y: 0 } },
            { id: 'b3', x: 3, y: 3, color: 'blue', exitDir: { x: 0, y: 1 } }
        ],
        walls: [
            { x: 3, y: 0 }, { x: 0, y: 3 }, { x: 6, y: 3 }
        ],
        rotators: [
            { x: 5, y: 1, dir: { x: 0, y: 1 } },
            { x: 1, y: 5, dir: { x: 0, y: -1 } }
        ]
    },
    // Level 18: Four Corners (8x8)
    {
        gridWidth: 8, gridHeight: 8, parMoves: 12,
        blocks: [
            { id: 'b1', x: 1, y: 2, color: 'cyan', exitDir: { x: 0, y: 1 } },
            { id: 'b2', x: 5, y: 1, color: 'pink', exitDir: { x: -1, y: 0 } },
            { id: 'b3', x: 6, y: 5, color: 'yellow', exitDir: { x: 1, y: 0 } },
            { id: 'b4', x: 2, y: 6, color: 'orange', exitDir: { x: 1, y: 0 } }
        ],
        walls: [
            { x: 3, y: 3 }, { x: 4, y: 3 },
            { x: 3, y: 4 }, { x: 4, y: 4 }
        ],
        rotators: [
            { x: 1, y: 6, dir: { x: -1, y: 0 } },
            { x: 6, y: 6, dir: { x: 0, y: -1 } },
            { x: 6, y: 1, dir: { x: -1, y: 0 } },
            { x: 1, y: 1, dir: { x: 0, y: 1 } }
        ]
    },
    // Level 19: The Gauntlet (9x9)
    {
        gridWidth: 9, gridHeight: 9, parMoves: 10,
        blocks: [
            { id: 'b1', x: 0, y: 4, color: 'red', exitDir: { x: 1, y: 0 } },
            { id: 'b2', x: 8, y: 4, color: 'blue', exitDir: { x: -1, y: 0 } },
            { id: 'b3', x: 4, y: 0, color: 'green', exitDir: { x: 0, y: 1 } }
        ],
        walls: [
            { x: 2, y: 1 }, { x: 6, y: 2 },
            { x: 2, y: 6 }, { x: 6, y: 6 }
        ],
        rotators: [
            { x: 4, y: 4, dir: { x: 0, y: -1 } },
            { x: 4, y: 2, dir: { x: -1, y: 0 } },
            { x: 4, y: 6, dir: { x: 1, y: 0 } }
        ]
    },
    // Level 20: Mainframe Core (10x10)
    {
        gridWidth: 10, gridHeight: 10, parMoves: 14,
        blocks: [
            { id: 'b1', x: 1, y: 2, color: 'purple', exitDir: { x: 0, y: 1 } },
            { id: 'b2', x: 7, y: 1, color: 'cyan', exitDir: { x: -1, y: 0 } },
            { id: 'b3', x: 8, y: 7, color: 'pink', exitDir: { x: 0, y: -1 } },
            { id: 'b4', x: 2, y: 8, color: 'yellow', exitDir: { x: 1, y: 0 } }
        ],
        walls: [
            { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 3, y: 3 }, { x: 6, y: 6 }
        ],
        rotators: [
            { x: 8, y: 1, dir: { x: 1, y: 0 } },
            { x: 8, y: 8, dir: { x: -1, y: 0 } },
            { x: 1, y: 8, dir: { x: 0, y: -1 } },
            { x: 1, y: 1, dir: { x: 1, y: 0 } }
        ]
    }
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
    return           { maxFree: 1 }; // Hard levels (13-20): exactly 1 free option at each step
}

// Fast difficulty and solvability check using BFS
function checkLevelDifficultyBFS(gridWidth, gridHeight, blocks, maxFree) {
    const numBlocks = blocks.length;
    const startState = blocks.map(b => b.id).sort().join(',');
    
    const queue = [[startState, []]];
    const visited = new Set();
    visited.add(startState);
    
    let solutionPath = null;
    let maxFreeSeen = 0;
    
    let visitedCount = 0;
    const maxStatesLimit = 2000;
    
    while (queue.length > 0) {
        visitedCount++;
        if (visitedCount > maxStatesLimit) {
            return null; // Too branchy/unstructured, reject
        }
        
        const [currentState, path] = queue.shift();
        
        if (currentState === '') {
            solutionPath = path;
            break;
        }
        
        const remainingIds = currentState.split(',');
        const remainingBlocks = blocks.filter(b => remainingIds.includes(b.id));
        
        // Find free blocks in the current state
        const freeBlocks = remainingBlocks.filter(b => {
            let cx = b.gridX + b.exitDir.x;
            let cy = b.gridY + b.exitDir.y;
            while (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
                if (remainingIds.some(id => {
                    const other = blocks.find(ob => ob.id === id);
                    return other && other.id !== b.id && other.gridX === cx && other.gridY === cy;
                })) {
                    return false;
                }
                cx += b.exitDir.x;
                cy += b.exitDir.y;
            }
            return true;
        });
        
        if (freeBlocks.length === 0) {
            continue; // Dead end
        }
        
        // If there are more free options than allowed, reject this branch or level
        if (freeBlocks.length > maxFree) {
            return null; // Too easy, reject
        }
        
        maxFreeSeen = Math.max(maxFreeSeen, freeBlocks.length);
        
        for (const fb of freeBlocks) {
            const nextIds = remainingIds.filter(id => id !== fb.id).sort().join(',');
            if (!visited.has(nextIds)) {
                visited.add(nextIds);
                queue.push([nextIds, [...path, fb.id]]);
            }
        }
    }
    
    if (!solutionPath) return null; // Unsolvable
    
    return {
        path: solutionPath,
        maxFreeOptions: maxFreeSeen
    };
}

// Fallback: Guaranteed solvable layout containing all 4 directions pointing outwards from border
function generateFallbackLevel(gridWidth, gridHeight, numBlocks, time3, time2) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange', 'pink'];
    let blocks = [];
    let placed = 0;
    
    const borderCells = [];
    for (let x = 0; x < gridWidth; x++) borderCells.push({ x, y: 0 });
    for (let x = 0; x < gridWidth; x++) borderCells.push({ x, y: gridHeight - 1 });
    for (let y = 1; y < gridHeight - 1; y++) borderCells.push({ x: 0, y });
    for (let y = 1; y < gridHeight - 1; y++) borderCells.push({ x: gridWidth - 1, y });
    
    const insideCells = [];
    for (let x = 1; x < gridWidth - 1; x++) {
        for (let y = 1; y < gridHeight - 1; y++) {
            insideCells.push({ x, y });
        }
    }
    
    function getQuadrantDir(x, y) {
        if (y < gridHeight / 2) {
            if (x < gridWidth / 2) {
                return { x: 0, y: -1 }; // UP
            } else {
                return { x: 1, y: 0 };  // RIGHT
            }
        } else {
            if (x < gridWidth / 2) {
                return { x: -1, y: 0 }; // LEFT
            } else {
                return { x: 0, y: 1 };  // DOWN
            }
        }
    }
    
    for (const cell of borderCells) {
        if (placed >= numBlocks) break;
        blocks.push({
            id: 'B' + placed,
            x: cell.x,
            y: cell.y,
            color: colors[placed % colors.length],
            exitDir: getQuadrantDir(cell.x, cell.y)
        });
        placed++;
    }
    
    for (const cell of insideCells) {
        if (placed >= numBlocks) break;
        blocks.push({
            id: 'B' + placed,
            x: cell.x,
            y: cell.y,
            color: colors[placed % colors.length],
            exitDir: getQuadrantDir(cell.x, cell.y)
        });
        placed++;
    }
    
    return {
        gridWidth: gridWidth,
        gridHeight: gridHeight,
        time3Stars: time3,
        time2Stars: time2,
        blocks: blocks
    };
}

// Procedural reverse-play difficulty-constrained layout generator
function generateLevel(gridWidth, gridHeight, numBlocks, initialSeed, time3, time2, levelIdx) {
    const diff = getPuzzleDifficulty(levelIdx);
    let seed = initialSeed;
    let attempts = 0;
    
    const dirs = [
        { x: 0, y: -1 }, // UP
        { x: 0, y: 1 },  // DOWN
        { x: -1, y: 0 }, // LEFT
        { x: 1, y: 0 }   // RIGHT
    ];
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange', 'pink'];
    
    while (attempts < 1000) {
        attempts++;
        const rng = new SeededRandom(seed);
        
        let blocks = [];
        let occupied = new Set();
        
        let placed = 0;
        let cellAttempts = 0;
        
        while (placed < numBlocks && cellAttempts < 2000) {
            cellAttempts++;
            
            let rx = rng.nextInt(0, gridWidth);
            let ry = rng.nextInt(0, gridHeight);
            
            if (occupied.has(`${rx},${ry}`)) continue;
            
            let dir = rng.choose(dirs);
            
            let cx = rx + dir.x;
            let cy = ry + dir.y;
            let pathClear = true;
            
            while (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
                if (occupied.has(`${cx},${cy}`)) {
                    pathClear = false;
                    break;
                }
                cx += dir.x;
                cy += dir.y;
            }
            
            if (pathClear) {
                blocks.push({
                    id: 'B' + placed,
                    gridX: rx,
                    gridY: ry,
                    color: rng.choose(colors),
                    exitDir: { x: dir.x, y: dir.y }
                });
                occupied.add(`${rx},${ry}`);
                placed++;
            }
        }
        
        if (blocks.length === numBlocks) {
            // Check if all 4 directions are represented
            const directionsRepresented = new Set(blocks.map(b => `${b.exitDir.x},${b.exitDir.y}`));
            const allDirsPresent = numBlocks < 4 || directionsRepresented.size === 4;
            
            if (allDirsPresent) {
                const solveResult = checkLevelDifficultyBFS(gridWidth, gridHeight, blocks, diff.maxFree);
                if (solveResult) {
                    return {
                        gridWidth: gridWidth,
                        gridHeight: gridHeight,
                        time3Stars: time3,
                        time2Stars: time2,
                        blocks: blocks.map(b => ({
                            id: b.id,
                            x: b.gridX,
                            y: b.gridY,
                            color: b.color,
                            exitDir: { x: b.exitDir.x, y: b.exitDir.y }
                        }))
                    };
                }
            }
        }
        seed = (seed + 1) % 1000000;
    }
    
    return generateFallbackLevel(gridWidth, gridHeight, numBlocks, time3, time2);
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
    const freeList = activeBlocks.filter(b => b.state === 'idle' && !isBlockBlocked(b, activeBlocks).blocked);
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
// Calculate where a block will end up when launched
function calculateBlockDestination(block, blocksList, config) {
    if (!config) return { state: 'exit' };
    let cx = block.gridX;
    let cy = block.gridY;
    let dx = block.exitDir.x;
    let dy = block.exitDir.y;
    
    while (true) {
        cx += dx;
        cy += dy;
        
        // Out of bounds means it exits cleanly
        if (cx < 0 || cx >= config.gridWidth || cy < 0 || cy >= config.gridHeight) {
            return { state: 'exit' };
        }
        
        // Hits an obstacle wall
        const hasWall = config.walls && config.walls.some(w => w.x === cx && w.y === cy);
        if (hasWall) {
            return { state: 'blocked', x: cx, y: cy };
        }
        
        // Hits another active block
        const otherBlock = blocksList.find(b => b.id !== block.id && b.state !== 'completed' && b.gridX === cx && b.gridY === cy);
        if (otherBlock) {
            return { state: 'blocked', x: cx, y: cy, by: otherBlock };
        }
        
        // Hits a redirect rotator
        const rotator = config.rotators && config.rotators.find(r => r.x === cx && r.y === cy);
        if (rotator) {
            return { state: 'stopped', x: cx, y: cy, nextDir: rotator.dir };
        }
    }
}

// Block Collision and exit paths check
function isBlockBlocked(block, blocksList) {
    const config = LEVEL_CONFIGS[currentLevelIndex];
    const dest = calculateBlockDestination(block, blocksList, config);
    if (dest.state === 'blocked') {
        return { blocked: true, by: dest.by };
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
    
    const config = LEVEL_CONFIGS[currentLevelIndex];
    // 1. Render cell-empty background placeholders for all slots first (stays at z-index 1)
    for (let y = 0; y < currentGridHeight; y++) {
        for (let x = 0; x < currentGridWidth; x++) {
            const empty = document.createElement('div');
            empty.className = 'cell-empty';
            empty.id = `cell-${x}-${y}`;
            empty.style.gridColumnStart = x + 1;
            empty.style.gridRowStart = y + 1;
            
            const isWall = config && config.walls && config.walls.some(w => w.x === x && w.y === y);
            const rotator = config && config.rotators && config.rotators.find(r => r.x === x && r.y === y);
            
            if (isWall) {
                empty.classList.add('cell-wall');
            } else if (rotator) {
                empty.classList.add('cell-rotator');
                let arrowChar = '→';
                if (rotator.dir.x === -1) arrowChar = '←';
                else if (rotator.dir.y === -1) arrowChar = '↑';
                else if (rotator.dir.y === 1) arrowChar = '↓';
                empty.innerHTML = `<div class="rotator-disk"></div><span class="rotator-arrow">${arrowChar}</span>`;
            }
            
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
    
    activeBlocks = config.blocks.map(b => ({
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
    document.getElementById('target-value').textContent = config.parMoves;
    
    renderGridDOM();
    showParBanner(config.parMoves);
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
            
            // Cache destination if not cached
            if (!block.dest) {
                const config = LEVEL_CONFIGS[currentLevelIndex];
                block.dest = calculateBlockDestination(block, activeBlocks, config);
            }
            
            const dest = block.dest;
            let slideDistance = 999;
            if (dest.state === 'stopped') {
                slideDistance = Math.abs(dest.x - block.gridX) + Math.abs(dest.y - block.gridY);
            }
            
            // Limit slideOffset to slideDistance
            const currentOffset = Math.min(block.slideOffset, slideDistance);
            
            const rx = block.gridX + block.exitDir.x * currentOffset;
            const ry = block.gridY + block.exitDir.y * currentOffset;
            
            // Translate the HTML element
            const el = document.getElementById('block-' + block.id);
            if (el) {
                const tx = block.exitDir.x * currentOffset * cellSize;
                const ty = block.exitDir.y * currentOffset * cellSize;
                
                if (dest.state === 'exit') {
                    // Vanish effect for exiting blocks
                    if (currentOffset > 0.2) {
                        const progress = Math.min(1, (currentOffset - 0.2) / 0.8);
                        el.style.opacity = 1 - progress;
                        el.style.transform = `translate(${tx}px, ${ty}px) scale(${1 - progress * 0.4})`;
                    } else {
                        el.style.transform = `translate(${tx}px, ${ty}px)`;
                    }
                } else {
                    // Regular translation for stopping blocks
                    el.style.transform = `translate(${tx}px, ${ty}px)`;
                }
            }
            
            if (Math.random() < 0.4) {
                spawnExhaustSpark(rx, ry, block.exitDir, BLOCK_COLORS[block.color].bg);
            }
            
            if (dest.state === 'stopped' && block.slideOffset >= slideDistance) {
                // Reached the rotator tile!
                block.gridX = dest.x;
                block.gridY = dest.y;
                block.exitDir = { x: dest.nextDir.x, y: dest.nextDir.y };
                block.slideOffset = 0;
                block.state = 'idle';
                delete block.dest;
                
                neonArrowAudio.playSlide();
                renderGridDOM(); // Move block to the new parent cell in DOM
            } else if (dest.state === 'exit') {
                const isOut = rx < -1.1 || rx > currentGridWidth + 0.1 ||
                              ry < -1.1 || ry > currentGridHeight + 0.1;
                
                if (isOut) {
                    block.state = 'completed';
                    if (el) el.remove();
                    delete block.dest;
                    
                    updateBlockFreeClasses(); // Refresh unblocked list when block vanishes
                    
                    let edgeX = Math.max(-0.5, Math.min(currentGridWidth - 0.5, rx));
                    let edgeY = Math.max(-0.5, Math.min(currentGridHeight - 0.5, ry));
                    spawnRipple(edgeX, edgeY, BLOCK_COLORS[block.color].bg, 2.2);
                    spawnClearParticles(edgeX, edgeY, BLOCK_COLORS[block.color].bg);
                    triggerCameraShake(6, 0.15);
                    
                    checkVictory();
                }
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
        if (movesCount <= config.parMoves) {
            stars = 3;
            unlockAchievement('perfect', 'Arrow Master Logic');
        } else if (movesCount <= config.parMoves + 2) {
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
        document.getElementById('summary-target').textContent = config.parMoves + ' Moves';
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
