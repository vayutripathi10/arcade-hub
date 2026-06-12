// Neon Pin Pull Game Engine - Complete Overhaul
// Targets coordinate resolution: 600x800

const gameWidth = 600;
const gameHeight = 800;

// Ball Colors Mapping
const BALL_COLORS = {
    cyan: { hex: '#00ffff', name: 'Cyan' },
    pink: { hex: '#ff2d78', name: 'Pink' },
    yellow: { hex: '#ffff00', name: 'Yellow' },
    green: { hex: '#39ff14', name: 'Green' },
    purple: { hex: '#bf00ff', name: 'Purple' },
    white: { hex: '#ffffff', name: 'White' }
};

// --- PHYSICS UTILITIES ---
function collideCircleCircle(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distSq = dx * dx + dy * dy;
    const minDist = c1.r + c2.r;
    if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        return { nx, ny, overlap };
    }
    return null;
}

function collideCircleLine(circle, x1, y1, x2, y2) {
    const dx = circle.x - x1;
    const dy = circle.y - y1;
    const lx = x2 - x1;
    const ly = y2 - y1;
    const lineLenSq = lx * lx + ly * ly;
    if (lineLenSq === 0) return null;

    let t = (dx * lx + dy * ly) / lineLenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * lx;
    const closestY = y1 + t * ly;

    const distVectorX = circle.x - closestX;
    const distVectorY = circle.y - closestY;
    const distSq = distVectorX * distVectorX + distVectorY * distVectorY;
    const radiusSq = circle.r * circle.r;

    if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const overlap = circle.r - dist;
        let nx = distVectorX / (dist || 1);
        let ny = distVectorY / (dist || 1);
        if (dist === 0) {
            nx = -ly / Math.sqrt(lineLenSq);
            ny = lx / Math.sqrt(lineLenSq);
        }
        return { nx, ny, overlap };
    }
    return null;
}

function overlaps(r1, r2) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
}

// --- 26 COHESIVE MAIN FRAME LEVELS CONFIGURATION ---
const LEVELS = [
    // --- TUTORIALS (1 - 3) ---
    {
        id: 1,
        desc: "Level 1: Separation Logic",
        par: 2,
        hints: ["pin1", "pin2"],
        walls: [
            { x1: 150, y1: 150, x2: 150, y2: 600 },
            { x1: 450, y1: 150, x2: 450, y2: 600 },
            { x1: 300, y1: 150, x2: 300, y2: 450 },
            { x1: 150, y1: 600, x2: 170, y2: 680 },
            { x1: 300, y1: 450, x2: 280, y2: 600 },
            { x1: 280, y1: 600, x2: 260, y2: 680 },
            { x1: 300, y1: 450, x2: 320, y2: 600 },
            { x1: 320, y1: 600, x2: 340, y2: 680 },
            { x1: 450, y1: 600, x2: 430, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 380, w: 150, direction: "left" },
            { id: "pin2", x: 300, y: 380, w: 150, direction: "right" }
        ],
        buckets: [
            { color: "cyan", x: 205, w: 90 },
            { color: "yellow", x: 395, w: 90 }
        ],
        balls: [
            { color: "cyan", x: 200, y: 220 },
            { color: "cyan", x: 225, y: 240 },
            { color: "cyan", x: 210, y: 300 },
            { color: "yellow", x: 380, y: 220 },
            { color: "yellow", x: 410, y: 240 },
            { color: "yellow", x: 390, y: 300 }
        ]
    },
    {
        id: 2,
        desc: "Level 2: Chain Link Gate",
        par: 2,
        hints: ["pin1", "pin2"],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 400 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 300, w: 150, direction: "left" },
            { id: "pin2", x: 150, y: 450, w: 300, direction: "right", blockedBy: ["pin1"] }
        ],
        buckets: [
            { color: "yellow", x: 300, w: 120 }
        ],
        balls: [
            { color: "yellow", x: 210, y: 150 },
            { color: "yellow", x: 380, y: 220 }
        ]
    },
    {
        id: 3,
        desc: "Level 3: Neutral Infection",
        par: 2,
        hints: ["pin_top", "pin_bottom"],
        walls: [
            { x1: 200, y1: 100, x2: 200, y2: 600 },
            { x1: 400, y1: 100, x2: 400, y2: 600 },
            { x1: 200, y1: 600, x2: 230, y2: 680 },
            { x1: 400, y1: 600, x2: 370, y2: 680 }
        ],
        pins: [
            { id: "pin_top", x: 200, y: 250, w: 200, direction: "right" },
            { id: "pin_bottom", x: 200, y: 480, w: 200, direction: "left" }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 120 }
        ],
        balls: [
            { color: "cyan", x: 280, y: 150 },
            { color: "white", x: 270, y: 410 },
            { color: "white", x: 310, y: 430 }
        ]
    },
    // --- INTRODUCTION (4 - 6) ---
    {
        id: 4,
        desc: "Level 4: Triple Chain Lock",
        par: 3,
        hints: ["pin1", "pin2", "pin3"],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 220, w: 250, direction: "left" },
            { id: "pin2", x: 200, y: 340, w: 250, direction: "right", blockedBy: ["pin1"] },
            { id: "pin3", x: 150, y: 460, w: 300, direction: "left", blockedBy: ["pin2"] }
        ],
        buckets: [
            { color: "green", x: 300, w: 120 }
        ],
        balls: [
            { color: "green", x: 280, y: 140 },
            { color: "green", x: 310, y: 170 }
        ]
    },
    {
        id: 5,
        desc: "Level 5: Sieve Sorting",
        par: 3,
        hints: ["pin_left", "pin_right", "pin_gate"],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 500 },
            { x1: 500, y1: 100, x2: 500, y2: 500 },
            { x1: 100, y1: 500, x2: 220, y2: 620 },
            { x1: 500, y1: 500, x2: 380, y2: 620 },
            { x1: 220, y1: 620, x2: 220, y2: 700 },
            { x1: 380, y1: 620, x2: 380, y2: 700 },
            { x1: 300, y1: 100, x2: 300, y2: 350 }
        ],
        pins: [
            { id: "pin_left", x: 100, y: 350, w: 200, direction: "left" },
            { id: "pin_right", x: 300, y: 350, w: 200, direction: "right" },
            { id: "pin_gate", x: 220, y: 620, w: 160, direction: "right" }
        ],
        buckets: [
            { color: "pink", x: 300, w: 140 }
        ],
        balls: [
            { color: "pink", x: 190, y: 150 },
            { color: "pink", x: 420, y: 180 }
        ]
    },
    {
        id: 6,
        desc: "Level 6: Parallel Plungers",
        par: 4,
        hints: ["pinA", "pinB", "pinC", "pinMain"],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 550 },
            { x1: 500, y1: 100, x2: 500, y2: 550 },
            { x1: 230, y1: 100, x2: 230, y2: 400 },
            { x1: 370, y1: 100, x2: 370, y2: 400 },
            { x1: 100, y1: 550, x2: 150, y2: 680 },
            { x1: 500, y1: 550, x2: 450, y2: 680 }
        ],
        pins: [
            { id: "pinA", x: 100, y: 320, w: 130, direction: "left" },
            { id: "pinB", x: 230, y: 320, w: 140, direction: "right" },
            { id: "pinC", x: 370, y: 320, w: 130, direction: "right" },
            { id: "pinMain", x: 100, y: 480, w: 400, direction: "left" }
        ],
        buckets: [
            { color: "cyan", x: 200, w: 100 },
            { color: "purple", x: 400, w: 100 }
        ],
        balls: [
            { color: "cyan", x: 160, y: 200 },
            { color: "purple", x: 440, y: 200 }
        ]
    },
    // --- MIXED COLORS (7 - 9) ---
    {
        id: 7,
        desc: "Level 7: Double Sort Platform",
        par: 2,
        hints: ["pin_top", "pin_bottom"],
        walls: [
            { x1: 180, y1: 100, x2: 180, y2: 600 },
            { x1: 420, y1: 100, x2: 420, y2: 600 },
            { x1: 180, y1: 600, x2: 230, y2: 680 },
            { x1: 420, y1: 600, x2: 370, y2: 680 }
        ],
        pins: [
            { id: "pin_top", x: 180, y: 300, w: 240, direction: "right" },
            { id: "pin_bottom", x: 180, y: 480, w: 240, direction: "left" }
        ],
        buckets: [
            { color: "yellow", x: 250, w: 90 },
            { color: "cyan", x: 350, w: 90 }
        ],
        balls: [
            { color: "yellow", x: 220, y: 150 },
            { color: "cyan", x: 360, y: 150 },
            { color: "yellow", x: 250, y: 180 },
            { color: "cyan", x: 320, y: 180 }
        ]
    },
    {
        id: 8,
        desc: "Level 8: Separator Chute",
        par: 3,
        hints: ["pin1", "pin2", "pin3"],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 350 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 280, w: 150, direction: "left" },
            { id: "pin2", x: 300, y: 280, w: 150, direction: "right" },
            { id: "pin3", x: 150, y: 460, w: 300, direction: "left", blockedBy: ["pin2"] }
        ],
        buckets: [
            { color: "pink", x: 220, w: 100 },
            { color: "green", x: 380, w: 100 }
        ],
        balls: [
            { color: "pink", x: 220, y: 160 },
            { color: "green", x: 380, y: 160 },
            { color: "pink", x: 210, y: 200 },
            { color: "green", x: 390, y: 200 }
        ]
    },
    {
        id: 9,
        desc: "Level 9: Tri-color Separation",
        par: 4,
        hints: ["pin1", "pin2", "pin3", "pin4"],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 230, y1: 100, x2: 230, y2: 450 },
            { x1: 370, y1: 100, x2: 370, y2: 450 },
            { x1: 100, y1: 600, x2: 155, y2: 680 },
            { x1: 500, y1: 600, x2: 445, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 100, y: 250, w: 130, direction: "left" },
            { id: "pin2", x: 230, y: 250, w: 140, direction: "left", blockedBy: ["pin1"] },
            { id: "pin3", x: 370, y: 250, w: 130, direction: "right", blockedBy: ["pin2"] },
            { id: "pin4", x: 100, y: 400, w: 400, direction: "left", blockedBy: ["pin3"] }
        ],
        buckets: [
            { color: "cyan", x: 180, w: 80 },
            { color: "pink", x: 300, w: 80 },
            { color: "yellow", x: 420, w: 80 }
        ],
        balls: [
            { color: "cyan", x: 150, y: 150 },
            { color: "pink", x: 300, y: 150 },
            { color: "yellow", x: 450, y: 150 }
        ]
    },
    // --- GRAVITY CHAMBERS (10 - 12) ---
    {
        id: 10,
        desc: "Level 10: Horizontal Drift",
        par: 2,
        hints: ["pin_gate", "pin_exit"],
        gravityZones: [
            { x: 100, y: 200, w: 400, h: 250, dx: 0.45, dy: 0 } // rightwards wind
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 100, y1: 600, x2: 240, y2: 680 },
            { x1: 500, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin_gate", x: 100, y: 350, w: 200, direction: "left" },
            { id: "pin_exit", x: 100, y: 500, w: 400, direction: "right", blockedBy: ["pin_gate"] }
        ],
        buckets: [
            { color: "purple", x: 300, w: 120 }
        ],
        balls: [
            { color: "purple", x: 200, y: 155 },
            { color: "purple", x: 220, y: 185 }
        ]
    },
    {
        id: 11,
        desc: "Level 11: Vortex Sorting",
        par: 3,
        hints: ["pin1", "pin2", "pin3"],
        gravityZones: [
            { x: 150, y: 150, w: 150, h: 300, dx: -0.4, dy: 0.1 }, // left
            { x: 300, y: 150, w: 150, h: 300, dx: 0.4, dy: 0.1 }  // right
        ],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 400 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 280, w: 150, direction: "left" },
            { id: "pin2", x: 300, y: 280, w: 150, direction: "right" },
            { id: "pin3", x: 150, y: 480, w: 300, direction: "left" }
        ],
        buckets: [
            { color: "yellow", x: 220, w: 90 },
            { color: "green", x: 380, w: 90 }
        ],
        balls: [
            { color: "yellow", x: 210, y: 150 },
            { color: "green", x: 390, y: 150 }
        ]
    },
    {
        id: 12,
        desc: "Level 12: Anti-Gravity Decryptor",
        par: 3,
        hints: ["p1", "p2", "p3"],
        gravityZones: [
            { x: 100, y: 350, w: 400, h: 180, dx: 0, dy: -0.6 } // reverse gravity chamber
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 100, y1: 650, x2: 240, y2: 700 },
            { x1: 500, y1: 650, x2: 360, y2: 700 }
        ],
        pins: [
            { id: "p1", x: 100, y: 300, w: 400, direction: "right" },
            { id: "p2", x: 100, y: 420, w: 400, direction: "left", blockedBy: ["p1"] },
            { id: "p3", x: 100, y: 550, w: 400, direction: "right", blockedBy: ["p2"] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 140 }
        ],
        balls: [
            { color: "cyan", x: 290, y: 220 },
            { color: "cyan", x: 310, y: 240 }
        ]
    },
    // --- GATE PINS (13 - 15) ---
    {
        id: 13,
        desc: "Level 13: Switching Mainframe",
        par: 2,
        hints: ["pinA", "pinB"],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 220, y2: 680 },
            { x1: 450, y1: 600, x2: 380, y2: 680 },
            // Gate toggled wall: disappears when pinA is pulled
            { x1: 150, y1: 380, x2: 300, y2: 380, gatePinId: "pinA" }
        ],
        pins: [
            { id: "pinA", x: 150, y: 250, w: 300, direction: "right" },
            { id: "pinB", x: 150, y: 480, w: 300, direction: "left", blockedBy: ["pinA"] }
        ],
        buckets: [
            { color: "pink", x: 300, w: 140 }
        ],
        balls: [
            { color: "pink", x: 280, y: 160 },
            { color: "pink", x: 310, y: 180 }
        ]
    },
    {
        id: 14,
        desc: "Level 14: Redirect Switch",
        par: 3,
        hints: ["pin1", "pin2", "pin3"],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 100, y1: 600, x2: 240, y2: 685 },
            { x1: 500, y1: 600, x2: 360, y2: 685 },
            // Appears only after pin1 is pulled
            { x1: 250, y1: 420, x2: 500, y2: 420, gatePinId: "pin1", reverseGate: true }
        ],
        pins: [
            { id: "pin1", x: 100, y: 280, w: 200, direction: "left" },
            { id: "pin2", x: 300, y: 280, w: 200, direction: "right" },
            { id: "pin3", x: 100, y: 500, w: 400, direction: "left" }
        ],
        buckets: [
            { color: "green", x: 300, w: 120 }
        ],
        balls: [
            { color: "green", x: 200, y: 150 },
            { color: "green", x: 400, y: 150 }
        ]
    },
    {
        id: 15,
        desc: "Level 15: Cross Bypass Gate",
        par: 3,
        hints: ["pL", "pR", "pB"],
        walls: [
            { x1: 120, y1: 100, x2: 120, y2: 600 },
            { x1: 480, y1: 100, x2: 480, y2: 600 },
            { x1: 120, y1: 600, x2: 230, y2: 680 },
            { x1: 480, y1: 600, x2: 370, y2: 680 },
            // Gates:
            { x1: 120, y1: 420, x2: 240, y2: 420, gatePinId: "pL" },
            { x1: 360, y1: 420, x2: 480, y2: 420, gatePinId: "pR" }
        ],
        pins: [
            { id: "pL", x: 120, y: 280, w: 180, direction: "left" },
            { id: "pR", x: 300, y: 280, w: 180, direction: "right" },
            { id: "pB", x: 120, y: 520, w: 360, direction: "left", blockedBy: ["pL", "pR"] }
        ],
        buckets: [
            { color: "purple", x: 300, w: 140 }
        ],
        balls: [
            { color: "purple", x: 210, y: 180 },
            { color: "purple", x: 390, y: 180 }
        ]
    },
    // --- TIMED PINS (16 - 18) ---
    {
        id: 16,
        desc: "Level 16: Auto-Release Core",
        par: 3,
        hints: ["pin1", "pin2", "pin3"],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 220, w: 300, direction: "right" },
            // Auto-pulls after 3 seconds:
            { id: "pin2", x: 150, y: 350, w: 300, direction: "left", timer: 3 },
            { id: "pin3", x: 150, y: 480, w: 300, direction: "right" }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 120 }
        ],
        balls: [
            { color: "cyan", x: 290, y: 140 },
            { color: "white", x: 280, y: 280 }
        ]
    },
    {
        id: 17,
        desc: "Level 17: Panic Chrono Chute",
        par: 3,
        hints: ["p1", "p2", "p3"],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 100, y1: 600, x2: 240, y2: 680 },
            { x1: 500, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "p1", x: 100, y: 250, w: 400, direction: "right" },
            { id: "p2", x: 100, y: 380, w: 400, direction: "left", timer: 4 },
            { id: "p3", x: 100, y: 500, w: 400, direction: "right", timer: 6 }
        ],
        buckets: [
            { color: "yellow", x: 300, w: 140 }
        ],
        balls: [
            { color: "yellow", x: 290, y: 150 },
            { color: "white", x: 310, y: 320 }
        ]
    },
    {
        id: 18,
        desc: "Level 18: Time Trap Core",
        par: 4,
        hints: ["pA", "pB", "pMain", "pGate"],
        walls: [
            { x1: 120, y1: 100, x2: 120, y2: 600 },
            { x1: 480, y1: 100, x2: 480, y2: 600 },
            { x1: 120, y1: 600, x2: 230, y2: 680 },
            { x1: 480, y1: 600, x2: 370, y2: 680 }
        ],
        pins: [
            { id: "pA", x: 120, y: 220, w: 180, direction: "left" },
            { id: "pB", x: 300, y: 220, w: 180, direction: "right", timer: 3 },
            { id: "pMain", x: 120, y: 380, w: 360, direction: "left" },
            { id: "pGate", x: 120, y: 510, w: 360, direction: "right", timer: 8 }
        ],
        buckets: [
            { color: "pink", x: 300, w: 150 }
        ],
        balls: [
            { color: "pink", x: 210, y: 150 },
            { color: "white", x: 390, y: 150 }
        ]
    },
    // --- BOUNCERS (19 - 21) ---
    {
        id: 19,
        desc: "Level 19: Bumper Rebound",
        par: 2,
        hints: ["pin_left", "pin_right"],
        bouncers: [
            { x1: 150, y1: 320, x2: 300, y2: 370 } // deflects balls rightwards
        ],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 230, y2: 680 },
            { x1: 450, y1: 600, x2: 370, y2: 680 }
        ],
        pins: [
            { id: "pin_left", x: 150, y: 250, w: 300, direction: "left" },
            { id: "pin_right", x: 150, y: 480, w: 300, direction: "right" }
        ],
        buckets: [
            { color: "green", x: 300, w: 120 }
        ],
        balls: [
            { color: "green", x: 220, y: 150 },
            { color: "green", x: 240, y: 170 }
        ]
    },
    {
        id: 20,
        desc: "Level 20: Pinball Sorcery",
        par: 3,
        hints: ["p1", "p2", "p3"],
        bouncers: [
            { x1: 180, y1: 300, x2: 280, y2: 340 },
            { x1: 420, y1: 380, x2: 320, y2: 420 }
        ],
        walls: [
            { x1: 120, y1: 100, x2: 120, y2: 600 },
            { x1: 480, y1: 100, x2: 480, y2: 600 },
            { x1: 120, y1: 600, x2: 240, y2: 680 },
            { x1: 480, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "p1", x: 120, y: 240, w: 360, direction: "right" },
            { id: "p2", x: 120, y: 450, w: 360, direction: "left" },
            { id: "p3", x: 120, y: 550, w: 360, direction: "right" }
        ],
        buckets: [
            { color: "purple", x: 300, w: 130 }
        ],
        balls: [
            { color: "purple", x: 300, y: 150 }
        ]
    },
    {
        id: 21,
        desc: "Level 21: Reflex Chambers",
        par: 3,
        hints: ["pA", "pB", "pMain"],
        bouncers: [
            { x1: 150, y1: 280, x2: 250, y2: 280 },
            { x1: 350, y1: 280, x2: 450, y2: 280 }
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 420 },
            { x1: 100, y1: 600, x2: 220, y2: 680 },
            { x1: 500, y1: 600, x2: 380, y2: 680 }
        ],
        pins: [
            { id: "pA", x: 100, y: 350, w: 200, direction: "left" },
            { id: "pB", x: 300, y: 350, w: 200, direction: "right" },
            { id: "pMain", x: 100, y: 500, w: 400, direction: "left" }
        ],
        buckets: [
            { color: "yellow", x: 300, w: 150 }
        ],
        balls: [
            { color: "yellow", x: 200, y: 150 },
            { color: "yellow", x: 400, y: 150 }
        ]
    },
    // --- SPLITTERS (22 - 25) ---
    {
        id: 22,
        desc: "Level 22: Binary Split Core",
        par: 2,
        hints: ["pin1", "pin2"],
        splitters: [
            { x: 300, y: 400, r: 24 }
        ],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 300, w: 300, direction: "left" },
            { id: "pin2", x: 150, y: 520, w: 300, direction: "right", blockedBy: ["pin1"] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 140 }
        ],
        balls: [
            { color: "cyan", x: 300, y: 180 }
        ]
    },
    {
        id: 23,
        desc: "Level 23: Duplication Mainframe",
        par: 3,
        hints: ["p1", "p2", "p3"],
        splitters: [
            { x: 200, y: 380, r: 24 },
            { x: 400, y: 380, r: 24 }
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 300 },
            { x1: 100, y1: 600, x2: 240, y2: 680 },
            { x1: 500, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "p1", x: 100, y: 250, w: 200, direction: "left" },
            { id: "p2", x: 300, y: 250, w: 200, direction: "right" },
            { id: "p3", x: 100, y: 480, w: 400, direction: "left" }
        ],
        buckets: [
            { color: "pink", x: 300, w: 150 }
        ],
        balls: [
            { color: "pink", x: 200, y: 150 },
            { color: "pink", x: 400, y: 150 }
        ]
    },
    {
        id: 24,
        desc: "Level 24: Four-way Dispersion",
        par: 3,
        hints: ["pinA", "pinB", "pinC"],
        splitters: [
            { x: 300, y: 380, r: 28 }
        ],
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 170, y2: 680 },
            { x1: 450, y1: 600, x2: 430, y2: 680 }
        ],
        pins: [
            { id: "pinA", x: 150, y: 250, w: 300, direction: "right" },
            { id: "pinB", x: 150, y: 480, w: 150, direction: "left", blockedBy: ["pinA"] },
            { id: "pinC", x: 300, y: 480, w: 150, direction: "right", blockedBy: ["pinA"] }
        ],
        buckets: [
            { color: "yellow", x: 205, w: 90 },
            { color: "cyan", x: 395, w: 90 }
        ],
        balls: [
            { color: "yellow", x: 270, y: 160 },
            { color: "cyan", x: 330, y: 160 }
        ]
    },
    {
        id: 25,
        desc: "Level 25: Cascade Routing Core",
        par: 3,
        hints: ["p1", "p2", "p3"],
        splitters: [
            { x: 300, y: 320, r: 24 },
            { x: 200, y: 480, r: 20 },
            { x: 400, y: 480, r: 20 }
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 100, y1: 650, x2: 240, y2: 710 },
            { x1: 500, y1: 650, x2: 360, y2: 710 }
        ],
        pins: [
            { id: "p1", x: 100, y: 220, w: 400, direction: "left" },
            { id: "p2", x: 100, y: 400, w: 400, direction: "right", blockedBy: ["p1"] },
            { id: "p3", x: 100, y: 560, w: 400, direction: "left", blockedBy: ["p2"] }
        ],
        buckets: [
            { color: "green", x: 300, w: 150 }
        ],
        balls: [
            { color: "green", x: 300, y: 140 }
        ]
    },
    // --- MAXIMUM COMPLEXITY COMBINED CORE (26+) ---
    {
        id: 26,
        desc: "Level 26: Master Encryption main",
        par: 4,
        hints: ["pL", "pR", "pGate", "pMain"],
        timerLimit: 40,
        splitters: [
            { x: 300, y: 350, r: 24 }
        ],
        bouncers: [
            { x1: 120, y1: 500, x2: 200, y2: 520 },
            { x1: 480, y1: 500, x2: 400, y2: 520 }
        ],
        gravityZones: [
            { x: 100, y: 200, w: 400, h: 120, dx: -0.3, dy: 0 }
        ],
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 100, y1: 650, x2: 240, y2: 710 },
            { x1: 500, y1: 650, x2: 360, y2: 710 },
            // gate activated wall:
            { x1: 200, y1: 580, x2: 400, y2: 580, gatePinId: "pGate" }
        ],
        pins: [
            { id: "pL", x: 100, y: 220, w: 200, direction: "left" },
            { id: "pR", x: 300, y: 220, w: 200, direction: "right", timer: 8 },
            { id: "pGate", x: 100, y: 450, w: 400, direction: "right" },
            { id: "pMain", x: 100, y: 600, w: 400, direction: "left", blockedBy: ["pGate"] }
        ],
        buckets: [
            { color: "cyan", x: 220, w: 90 },
            { color: "pink", x: 380, w: 90 }
        ],
        balls: [
            { color: "cyan", x: 250, y: 150 },
            { color: "pink", x: 350, y: 150 }
        ]
    }
];

// --- CLASSES ---

class Ball {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.baseR = 11 + Math.random() * 3.5; // Organic variation in sizes
        this.r = this.baseR;
        this.colorKey = color;
        this.color = BALL_COLORS[color] ? BALL_COLORS[color].hex : '#ffffff';
        this.vx = 0;
        this.vy = 0;
        this.collected = false;
        this.trail = [];
        
        // Squash and Stretch Animation timers
        this.bounceTimer = 0;
        this.squashX = 1.0;
        this.squashY = 1.0;
    }

    updateBounce() {
        if (this.bounceTimer > 0) {
            this.bounceTimer--;
            // Oscillating compression/expansion
            const ratio = this.bounceTimer / 8;
            this.squashY = 1.0 - 0.28 * ratio;
            this.squashX = 1.0 + 0.18 * ratio;
        } else {
            this.squashX = 1.0;
            this.squashY = 1.0;
        }
    }

    triggerBounce() {
        this.bounceTimer = 8;
    }
}

class Pin {
    constructor(config) {
        this.id = config.id;
        this.x = config.x;
        this.y = config.y;
        this.w = config.w;
        this.h = 14; 
        this.direction = config.direction; // "left" or "right"
        this.blockedBy = config.blockedBy || [];
        this.slideOffset = 0;
        this.isPulling = false;
        this.isRemoved = false;
        this.pullSpeed = 10;
        this.shakeTimer = 0;
        this.timer = config.timer || 0; // Countdown timer auto pull
        this.glowingTrail = [];
    }

    get bounds() {
        return {
            x: this.x + (this.direction === 'right' ? this.slideOffset : -this.slideOffset),
            y: this.y - 7,
            w: this.w,
            h: 14
        };
    }
}

class Particle {
    constructor(x, y, color, speed = 8, lifeDec = 0.035) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.6) * speed;
        this.life = 1.0;
        this.size = Math.random() * 3.5 + 2;
        this.lifeDec = lifeDec;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 0.08 * deltaTime; // subtle gravity drop
        this.life -= this.lifeDec * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.vy = -1.5;
        this.life = 1.0;
    }

    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.life -= 0.02 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// --- GAME SYSTEM ENGINE ---

class PinPullGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevelIndex = 0;
        
        this.balls = [];
        this.walls = [];
        this.pins = [];
        this.buckets = [];
        this.particles = [];
        this.floatingTexts = [];
        this.gravityZones = [];
        this.bouncers = [];
        this.splitters = [];
        
        this.gameState = 'START'; 
        this.lastTime = 0;
        this.gravity = 0.32;
        this.restitution = 0.35;
        
        this.totalBallsCount = 0;
        this.collectedCount = 0;
        this.pullsCount = 0;
        this.score = 0;
        this.coins = 50;
        this.lastPullTime = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        // Camera shake variables
        this.shakeTime = 0;
        this.shakeForce = 0;

        // Bucket animations states
        this.bucketFlashTimes = {}; // bucketColor -> time
        this.bucketFlashColors = {}; // bucketColor -> color
        this.bucketFills = {}; // bucketColor -> height proportion
        
        // Undo states history stack (stores JSON string snapshots)
        this.undoStack = [];

        this.unlockedLevels = 1;
        this.loadProgress();
        this.initUI();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame((t) => this.loop(t));
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('neonPinPullProgress');
            if (saved) this.unlockedLevels = parseInt(saved) || 1;
            const savedCoins = localStorage.getItem('neonPinPullCoins');
            if (savedCoins) this.coins = parseInt(savedCoins) || 50;
            const savedScore = localStorage.getItem('neonPinPullScore');
            if (savedScore) this.score = parseInt(savedScore) || 0;
        } catch(e) {}
    }

    saveProgress() {
        try {
            localStorage.setItem('neonPinPullProgress', this.unlockedLevels);
            localStorage.setItem('neonPinPullCoins', this.coins);
            localStorage.setItem('neonPinPullScore', this.score);
        } catch(e) {}
    }

    initUI() {
        // Level Selector Grid population
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';
        
        // Add Daily Challenge level card at start
        const dailyBtn = document.createElement('button');
        dailyBtn.className = 'level-btn daily';
        dailyBtn.innerHTML = '🌞';
        dailyBtn.title = "Daily Challenge Mainframe";
        dailyBtn.addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.startDailyChallenge();
        });
        grid.appendChild(dailyBtn);

        for (let i = 1; i <= 26; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            if (i > this.unlockedLevels) {
                btn.className += ' locked';
                btn.disabled = true;
            } else if (i < this.unlockedLevels) {
                btn.className += ' completed';
            }
            btn.addEventListener('click', () => {
                if (i <= this.unlockedLevels) {
                    if (window.audioFX) window.audioFX.playWhoosh();
                    this.startLevel(i - 1);
                }
            });
            grid.appendChild(btn);
        }

        // Gameplay buttons actions
        document.getElementById('playBtn').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.startLevel(this.unlockedLevels - 1);
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.togglePause(false);
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.startLevel(this.currentLevelIndex);
        });

        document.getElementById('btn-restart-success').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.startLevel(this.currentLevelIndex);
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.startLevel(this.currentLevelIndex);
        });
        document.getElementById('btn-next').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            if (this.currentLevelIndex !== -1 && this.currentLevelIndex < 25) {
                document.getElementById('successMenu').classList.add('hidden');
                this.startLevel(this.currentLevelIndex + 1);
            } else {
                this.gameState = 'START';
                document.getElementById('successMenu').classList.add('hidden');
                document.getElementById('startMenu').classList.remove('hidden');
                this.initUI();
            }
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.gameState = 'START';
            document.getElementById('pauseMenu').classList.add('hidden');
            document.getElementById('startMenu').classList.remove('hidden');
            this.initUI();
        });

        document.getElementById('btn-quit-fail').addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            this.gameState = 'START';
            document.getElementById('failMenu').classList.add('hidden');
            document.getElementById('startMenu').classList.remove('hidden');
            this.initUI();
        });

        document.getElementById('hub-btn')?.addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            window.top.location.href = '../index.html';
        });

        document.getElementById('btn-pause')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.gameState === 'PLAYING') this.togglePause(true);
        });

        // Coins hint purchase button
        document.getElementById('btn-hint')?.addEventListener('click', () => {
            const isFree = !this.freeHintUsed;
            if (isFree || this.coins >= 5) {
                if (!isFree) {
                    this.coins -= 5;
                    this.saveProgress();
                }
                this.startLevel(this.currentLevelIndex);
                if (isFree) {
                    this.freeHintUsed = true;
                }
                this.showNextMoveHint();
                if (isFree) {
                    this.spawnFloatingText(300, 300, "FREE HINT ACTIVATED!", "#ffd700");
                }
            } else {
                this.spawnFloatingText(300, 300, "NEED 5 COINS FOR HINT", "#ff4444");
                if (window.audioFX && typeof window.audioFX.playBuzz === 'function') window.audioFX.playBuzz();
            }
        });

        // HUD control buttons
        document.getElementById('btn-undo').addEventListener('click', () => this.triggerUndo());
        document.getElementById('btn-hud-hint').addEventListener('click', () => this.purchaseHUDHint());
    }

    startDailyChallenge() {
        // Daily challenge has a pseudo-random seed based on day date
        const today = new Date().toDateString();
        // Construct level 26 config with mixed styles
        this.startLevel(-1); // Start daily challenge
        document.getElementById('hud-level').textContent = "DAILY CHALLENGE";
        this.spawnFloatingText(300, 350, "DAILY ENCRYPTION INITIATED", "#ffd700");
    }

    startLevel(index) {
        if (index === -1) {
            this.currentLevelIndex = -1;
            index = 25;
        } else {
            this.currentLevelIndex = index;
        }
        const config = LEVELS[index];
        
        // Deep copy parameters
        this.walls = JSON.parse(JSON.stringify(config.walls));
        this.pins = config.pins.map(p => new Pin(p));
        this.buckets = JSON.parse(JSON.stringify(config.buckets));
        this.balls = config.balls.map(b => new Ball(b.x, b.y, b.color));
        this.gravityZones = JSON.parse(JSON.stringify(config.gravityZones || []));
        this.bouncers = JSON.parse(JSON.stringify(config.bouncers || []));
        this.splitters = JSON.parse(JSON.stringify(config.splitters || []));
        
        this.particles = [];
        this.floatingTexts = [];
        this.undoStack = [];
        this.freeHintUsed = false;
        
        this.totalBallsCount = this.balls.length;
        this.collectedCount = 0;
        this.pullsCount = 0;
        this.lastPullTime = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        // Init bucket animation values
        this.buckets.forEach(bk => {
            this.bucketFlashTimes[bk.color] = 0;
            this.bucketFlashColors[bk.color] = '';
            this.bucketFills[bk.color] = 0;
        });

        this.gameState = 'PLAYING';
        
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('successMenu').classList.add('hidden');
        document.getElementById('failMenu').classList.add('hidden');
        document.getElementById('btn-pause').classList.remove('hidden');

        // Show hints indicator
        const hintText = document.getElementById('hint-text');
        if (index === 0) {
            hintText.classList.remove('hidden');
            setTimeout(() => hintText.classList.add('hidden'), 3500);
        } else {
            hintText.classList.add('hidden');
        }

        // Show par banner at bottom
        this.spawnFloatingText(300, 160, `PAR: ${config.par} PULLS`, '#00ffff');

        this.updateHUD();
        this.lastTime = performance.now();
    }

    updateHUD() {
        const levelName = this.currentLevelIndex === -1 ? "DAILY CHALLENGE" : `LEVEL ${this.currentLevelIndex + 1}`;
        document.getElementById('hud-level').textContent = levelName;
        document.getElementById('hud-balls').textContent = `BALLS: ${this.collectedCount}/${this.totalBallsCount}`;
        document.getElementById('hud-coins').textContent = this.coins;
    }

    saveUndoState() {
        // Capture a snapshot of pins, balls, and buckets
        const snapshot = {
            balls: this.balls.map(b => ({
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                baseR: b.baseR,
                r: b.r,
                colorKey: b.colorKey,
                color: b.color,
                collected: b.collected,
                trail: [...b.trail]
            })),
            pins: this.pins.map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                w: p.w,
                h: p.h,
                direction: p.direction,
                blockedBy: [...p.blockedBy],
                slideOffset: p.slideOffset,
                isPulling: p.isPulling,
                isRemoved: p.isRemoved,
                timer: p.timer
            })),
            collectedCount: this.collectedCount,
            pullsCount: this.pullsCount,
            bucketFills: { ...this.bucketFills }
        };
        this.undoStack.push(JSON.stringify(snapshot));
        if (this.undoStack.length > 2) {
            this.undoStack.shift(); // Max 2 undos
        }
    }

    triggerUndo() {
        if (this.undoStack.length === 0) {
            this.spawnFloatingText(300, 300, "NO UNDO AVAILABLE", "#ff4444");
            if (window.audioFX && typeof window.audioFX.playBuzz === 'function') window.audioFX.playBuzz();
            return;
        }
        
        // Restore last snapshot
        const snapshotStr = this.undoStack.pop();
        const snapshot = JSON.parse(snapshotStr);
        
        this.balls = snapshot.balls.map(sb => {
            const b = new Ball(sb.x, sb.y, sb.colorKey);
            b.vx = sb.vx;
            b.vy = sb.vy;
            b.r = sb.r;
            b.baseR = sb.baseR;
            b.collected = sb.collected;
            b.trail = sb.trail;
            return b;
        });

        this.pins = snapshot.pins.map(sp => {
            const p = new Pin(sp);
            p.slideOffset = sp.slideOffset;
            p.isPulling = sp.isPulling;
            p.isRemoved = sp.isRemoved;
            return p;
        });

        this.collectedCount = snapshot.collectedCount;
        this.pullsCount = snapshot.pullsCount;
        this.bucketFills = snapshot.bucketFills;
        
        this.spawnFloatingText(300, 300, "UNDO TRIGGERED", "#ffff00");
        if (window.audioFX) window.audioFX.playWhoosh();
        this.updateHUD();
    }

    purchaseHUDHint() {
        const isFree = !this.freeHintUsed;
        if (isFree || this.coins >= 5) {
            if (!isFree) {
                this.coins -= 5;
                this.saveProgress();
            } else {
                this.freeHintUsed = true;
            }
            this.showNextMoveHint();
            if (isFree) {
                this.spawnFloatingText(300, 300, "FREE HINT ACTIVATED!", "#ffd700");
            }
            this.updateHUD();
        } else {
            this.spawnFloatingText(300, 300, "NEED 5 COINS FOR HINT", "#ff4444");
            if (window.audioFX && typeof window.audioFX.playBuzz === 'function') window.audioFX.playBuzz();
        }
    }

    showNextMoveHint() {
        const config = this.currentLevelIndex === -1 ? LEVELS[25] : LEVELS[this.currentLevelIndex];
        if (!config) return;
        
        // Highlight first remaining correct pin
        const nextCorrectId = config.hints.find(id => {
            const pin = this.pins.find(p => p.id === id);
            return pin && !pin.isRemoved && !pin.isPulling;
        });

        if (nextCorrectId) {
            const pin = this.pins.find(p => p.id === nextCorrectId);
            if (pin) {
                pin.shakeTimer = 30; // Shakes to invite click
                this.spawnFloatingText(pin.x + pin.w/2, pin.y - 20, "NEXT PULL!", "#ffd700");
                if (window.audioFX) window.audioFX.playWhoosh();
            }
        }
    }

    isPinBlocked(pin) {
        if (pin.blockedBy && pin.blockedBy.length > 0) {
            const hasBlocked = pin.blockedBy.some(id => {
                const other = this.pins.find(p => p.id === id);
                return other && !other.isRemoved;
            });
            if (hasBlocked) return true;
        }

        // Bounding box overlaps along the sliding path
        const pullPath = this.getPullPath(pin);
        return this.pins.some(other => {
            if (other === pin || other.isRemoved) return false;
            return overlaps(pullPath, other.bounds);
        });
    }

    getPullPath(pin) {
        if (pin.direction === 'right') {
            return { x: pin.x, y: pin.y - 8, w: gameWidth - pin.x, h: 16 };
        } else {
            return { x: 0, y: pin.y - 8, w: pin.x + pin.w, h: 16 };
        }
    }

    triggerCameraShake(force, time) {
        this.shakeForce = force;
        this.shakeTime = time;
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }

    togglePause(paused) {
        if (paused) {
            this.gameState = 'PAUSED';
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else {
            this.gameState = 'PLAYING';
            document.getElementById('pauseMenu').classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    resize() {
        const wrapper = document.querySelector('.game-wrapper');
        if (!wrapper) return;
        
        let layoutW = wrapper.clientWidth;
        let layoutH = wrapper.clientHeight;
        
        if (layoutW > layoutH * (600/800)) {
            layoutW = layoutH * (600/800);
        } else {
            layoutH = layoutW / (600/800);
        }
        
        this.canvas.style.width = `${layoutW}px`;
        this.canvas.style.height = `${layoutH}px`;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = layoutW * dpr;
        this.canvas.height = layoutH * dpr;
    }

    loop(timestamp) {
        const deltaTime = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 1.5) : 1;
        this.lastTime = timestamp;

        if (this.gameState === 'PLAYING') {
            this.update(deltaTime);
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        // Continuous roll rumble control
        let ballsMoving = this.balls.some(b => !b.collected && (Math.abs(b.vx) + Math.abs(b.vy) > 0.4));
        if (ballsMoving && window.audioFX && typeof window.audioFX.startRollRumble === 'function') {
            window.audioFX.startRollRumble();
        } else if (!ballsMoving && window.audioFX && typeof window.audioFX.stopRollRumble === 'function') {
            window.audioFX.stopRollRumble();
        }

        // Camera shake countdown
        if (this.shakeTime > 0) {
            this.shakeTime -= deltaTime * 16.67;
        }

        // Combo timer countdown
        if (this.comboTimer > 0) {
            this.comboTimer -= (deltaTime * 16.67) / 1000;
            if (this.comboTimer <= 0) {
                this.comboMultiplier = 1;
                document.getElementById('combo-alert').classList.add('hidden');
            }
        }

        // Timed Pins countdown auto-pull logic
        this.pins.forEach(p => {
            if (!p.isRemoved && !p.isPulling && p.timer > 0) {
                p.timer -= (deltaTime * 16.67) / 1000;
                if (p.timer <= 0) {
                    p.timer = 0;
                    p.isPulling = true;
                    if (window.audioFX) window.audioFX.playWhoosh();
                }
            }
        });

        // 1. Animate sliding pins
        this.pins.forEach(p => {
            if (p.isPulling) {
                p.slideOffset += p.pullSpeed * deltaTime;
                
                // Add glowing trail coordinates
                let trailX = p.direction === 'right' ? p.x + p.w + p.slideOffset : p.x - p.slideOffset;
                p.glowingTrail.push({ x: trailX, y: p.y });
                if (p.glowingTrail.length > 8) p.glowingTrail.shift();

                if (p.slideOffset >= p.w) {
                    p.slideOffset = p.w;
                    p.isPulling = false;
                    p.isRemoved = true;
                    // Spawn cyan sparks at final pull edge
                    for (let k = 0; k < 8; k++) {
                        this.particles.push(new Particle(trailX, p.y, '#00ffff', 6, 0.05));
                    }
                }
            }
            if (p.shakeTimer > 0) {
                p.shakeTimer -= deltaTime;
            }
        });

        // 2. Physics logic (Sub-stepping integration)
        const steps = 4;
        for (let s = 0; s < steps; s++) {
            this.balls.forEach(b => {
                if (b.collected) return;

                // Update squash/stretch compression animations
                b.updateBounce();

                // Gravity logic & local zones direction overrides
                let zoneGravX = 0;
                let zoneGravY = this.gravity;
                
                this.gravityZones.forEach(z => {
                    if (b.x >= z.x && b.x <= z.x + z.w && b.y >= z.y && b.y <= z.y + z.h) {
                        zoneGravX = z.dx;
                        zoneGravY = z.dy;
                    }
                });

                b.vx += zoneGravX * deltaTime;
                b.vy += zoneGravY * deltaTime;
                
                b.vx = Math.max(-12, Math.min(12, b.vx));
                b.vy = Math.max(-12, Math.min(12, b.vy));

                b.x += b.vx * (deltaTime / steps);
                b.y += b.vy * (deltaTime / steps);

                b.vx *= 0.985;
                b.vy *= 0.99;
            });

            // Circle-to-Circle collision
            for (let i = 0; i < this.balls.length; i++) {
                const b1 = this.balls[i];
                if (b1.collected) continue;
                for (let j = i + 1; j < this.balls.length; j++) {
                    const b2 = this.balls[j];
                    if (b2.collected) continue;

                    const col = collideCircleCircle(b1, b2);
                    if (col) {
                        const { nx, ny, overlap } = col;
                        b1.x -= nx * overlap * 0.5;
                        b1.y -= ny * overlap * 0.5;

                        b2.x += nx * overlap * 0.5;
                        b2.y += ny * overlap * 0.5;

                        // Color transfer on whites
                        if (b1.colorKey !== 'white' && b2.colorKey === 'white') {
                            b2.colorKey = b1.colorKey;
                            b2.color = BALL_COLORS[b1.colorKey].hex;
                            // Spawn mixed color sparkles
                            for (let k = 0; k < 4; k++) this.particles.push(new Particle(b2.x, b2.y, b2.color, 4, 0.05));
                        } else if (b2.colorKey !== 'white' && b1.colorKey === 'white') {
                            b1.colorKey = b2.colorKey;
                            b1.color = BALL_COLORS[b2.colorKey].hex;
                            for (let k = 0; k < 4; k++) this.particles.push(new Particle(b1.x, b1.y, b1.color, 4, 0.05));
                        }

                        const rvx = b2.vx - b1.vx;
                        const rvy = b2.vy - b1.vy;
                        const velAlongNormal = rvx * nx + rvy * ny;
                        if (velAlongNormal < 0) {
                            const impulse = -(1 + this.restitution) * velAlongNormal / 2;
                            b1.vx -= impulse * nx;
                            b1.vy -= impulse * ny;
                            b2.vx += impulse * nx;
                            b2.vy += impulse * ny;
                            b1.triggerBounce();
                            b2.triggerBounce();
                        }
                    }
                }
            }

            // Circle-to-Wall collision
            this.balls.forEach(b => {
                if (b.collected) return;
                
                // Static walls collision check (also respects dynamic gate wall triggers)
                this.walls.forEach(w => {
                    // Check if gate pin condition filters it out
                    if (w.gatePinId) {
                        const p = this.pins.find(pin => pin.id === w.gatePinId);
                        if (w.reverseGate) {
                            // Wall active ONLY after pin is removed
                            if (!p || !p.isRemoved) return;
                        } else {
                            // Wall active ONLY while pin is active (default)
                            if (p && p.isRemoved) return;
                        }
                    }

                    const col = collideCircleLine(b, w.x1, w.y1, w.x2, w.y2);
                    if (col) {
                        const { nx, ny, overlap } = col;
                        b.x += nx * overlap;
                        b.y += ny * overlap;

                        const dot = b.vx * nx + b.vy * ny;
                        if (dot < 0) {
                            b.vx -= (1 + this.restitution) * dot * nx;
                            b.vy -= (1 + this.restitution) * dot * ny;
                            b.triggerBounce();
                            
                            // Collide sparks
                            if (Math.abs(dot) > 2.5) {
                                this.particles.push(new Particle(b.x, b.y, b.color, 3, 0.06));
                            }
                        }
                    }
                });

                // Bouncer segments collisions (High elastic bounces)
                this.bouncers.forEach(w => {
                    const col = collideCircleLine(b, w.x1, w.y1, w.x2, w.y2);
                    if (col) {
                        const { nx, ny, overlap } = col;
                        b.x += nx * overlap;
                        b.y += ny * overlap;

                        const dot = b.vx * nx + b.vy * ny;
                        if (dot < 0) {
                            const bouncerRestitution = 0.85; // Extra bouncer rebound bounce
                            b.vx -= (1 + bouncerRestitution) * dot * nx;
                            b.vy -= (1 + bouncerRestitution) * dot * ny;
                            b.triggerBounce();
                            this.triggerCameraShake(3, 100);
                            
                            // Spawn neon bumper sparkles
                            for (let k = 0; k < 6; k++) {
                                this.particles.push(new Particle(b.x, b.y, '#ff00ff', 7, 0.06));
                            }
                            if (window.audioFX && typeof window.audioFX.playBumper === 'function') {
                                window.audioFX.playBumper();
                            }
                        }
                    }
                });

                // Circle-to-Pin sliding barrier collision check
                this.pins.forEach(p => {
                    if (p.isRemoved) return;
                    let pX1, pX2;
                    if (p.direction === 'right') {
                        pX1 = p.x + p.slideOffset;
                        pX2 = p.x + p.w;
                    } else {
                        pX1 = p.x;
                        pX2 = p.x + p.w - p.slideOffset;
                    }

                    if (pX1 < pX2) {
                        const col = collideCircleLine(b, pX1, p.y, pX2, p.y);
                        if (col) {
                            const { nx, ny, overlap } = col;
                            b.x += nx * overlap;
                            b.y += ny * overlap;

                            const dot = b.vx * nx + b.vy * ny;
                            if (dot < 0) {
                                b.vx -= (1 + 0.25) * dot * nx;
                                b.vy -= (1 + 0.25) * dot * ny;
                                b.triggerBounce();
                            }
                        }
                    }
                });
            });
        }

        // 3. Splitters overlap logic
        this.splitters.forEach(sp => {
            for (let i = this.balls.length - 1; i >= 0; i--) {
                const b = this.balls[i];
                if (b.collected) continue;
                
                const dx = b.x - sp.x;
                const dy = b.y - sp.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < sp.r + b.r) {
                    // Clone ball: split into 2 smaller ones
                    const b1 = new Ball(sp.x - 12, sp.y - 12, b.colorKey);
                    const b2 = new Ball(sp.x + 12, sp.y - 12, b.colorKey);
                    
                    b1.r = Math.max(7, b.r * 0.65);
                    b2.r = Math.max(7, b.r * 0.65);
                    
                    b1.vx = -4.5; b1.vy = -3;
                    b2.vx = 4.5;  b2.vy = -3;
                    
                    this.balls.splice(i, 1); // delete parent
                    this.balls.push(b1, b2);
                    this.totalBallsCount = this.balls.length; // recount
                    
                    if (window.audioFX && typeof window.audioFX.playSplit === 'function') {
                        window.audioFX.playSplit();
                    }
                    
                    // Spawn splitter neon core sparkles
                    for (let k = 0; k < 10; k++) {
                        this.particles.push(new Particle(sp.x, sp.y, b.color, 8, 0.07));
                    }
                    this.spawnFloatingText(sp.x, sp.y - 20, "SPLIT!", "#ffd700");
                    this.updateHUD();
                }
            }
        });

        // 4. Update trails coordinates
        this.balls.forEach(b => {
            if (b.collected) return;
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 5) b.trail.shift();

            if (b.y > gameHeight + 100) {
                this.levelFail("BALLS FELL OUT OF MAIN CONTROL FRAME!");
            }
        });

        // 5. Goal Buckets verification
        this.balls.forEach(b => {
            if (b.collected) return;
            
            if (b.y >= 680) {
                const bucket = this.buckets.find(bk => {
                    return b.x >= bk.x - bk.w/2 && b.x <= bk.x + bk.w/2;
                });

                if (bucket) {
                    if (bucket.color === b.colorKey) {
                        b.collected = true;
                        this.collectedCount++;
                        this.updateHUD();
                        
                        // Collect Juice animation states
                        this.bucketFlashTimes[bucket.color] = 12; // active flash frames count
                        this.bucketFlashColors[bucket.color] = b.color;
                        this.bucketFills[bucket.color] = Math.min(1.0, this.bucketFills[bucket.color] + (1 / this.totalBallsCount));
                        
                        if (window.audioFX) window.audioFX.playCollect();
                        
                        // Spawn collect sparkles
                        for (let k = 0; k < 12; k++) {
                            this.particles.push(new Particle(b.x, b.y, b.color, 7, 0.04));
                        }
                        
                        // Float score +10 popup
                        this.spawnFloatingText(b.x, b.y - 30, "+10", b.color);
                        this.score += 10;
                        this.coins += 2; // Earn coins!
                        this.saveProgress();

                    } else {
                        // Color contamination fail
                        this.bucketFlashTimes[bucket.color] = 18;
                        this.bucketFlashColors[bucket.color] = '#ff0000'; // Flash red
                        this.levelFail(`MAIN CONTAMINATION DETECTED! ${b.colorKey.toUpperCase()} BALL ENTERED ${bucket.color.toUpperCase()} BUCKET.`);
                    }
                } else if (b.y >= 750) {
                    this.levelFail("BALLS DEVIATED OUTSIDE INTENT SYSTEM BUCKETS!");
                }
            }
        });

        // 6. Complete stage verification
        if (this.collectedCount === this.totalBallsCount && this.totalBallsCount > 0) {
            this.levelSuccess();
        }

        // 7. Update sparkles particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 8. Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(deltaTime);
            if (this.floatingTexts[i].life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    levelSuccess() {
        this.gameState = 'SUCCESS';
        document.getElementById('btn-pause').classList.add('hidden');
        
        // Remove all remaining pins visual flying off screen
        this.pins.forEach((p, idx) => {
            if (!p.isRemoved) {
                p.isPulling = true;
                p.pullSpeed = 20; // Fast exit
            }
        });

        // Calculate stars based on par pulls comparison
        const config = this.currentLevelIndex === -1 ? LEVELS[25] : LEVELS[this.currentLevelIndex];
        let starsCount = 3;
        if (config) {
            const extraPulls = this.pullsCount - config.par;
            if (extraPulls <= 0) starsCount = 3;
            else if (extraPulls === 1) starsCount = 2;
            else starsCount = 1;
        }
        
        let starsStr = '⭐'.repeat(starsCount);

        // Unlock next sector
        if (this.currentLevelIndex !== -1 && this.currentLevelIndex + 1 >= this.unlockedLevels) {
            this.unlockedLevels = Math.min(26, this.currentLevelIndex + 2);
            this.saveProgress();
        }

        // Coins bonus reward
        this.coins += starsCount * 5;
        this.saveProgress();

        // Unlock Trophy checks
        if (this.currentLevelIndex === 25 && window.achievements) {
            window.achievements.unlock('neon_pin_pull', 'complete_all', 'Cyberspace Master');
            this.triggerAchievementUnlocked("CYBERSPACE MASTER");
        }
        if (starsCount === 3 && window.achievements) {
            this.triggerAchievementUnlocked("FIRST PERFECT SOLVE!");
        }

        document.getElementById('starsDisplay').textContent = starsStr;
        document.getElementById('successMessage').textContent = `Mainframe secure! Pulls: ${this.pullsCount} (Par: ${config ? config.par : 0})`;
        
        if (window.audioFX) window.audioFX.playVictory();
        setTimeout(() => {
            document.getElementById('successMenu').classList.remove('hidden');
        }, 1000);
    }

    triggerAchievementUnlocked(name) {
        if (window.audioFX && typeof window.audioFX.playAchievement === 'function') {
            window.audioFX.playAchievement();
        }
        const toast = document.getElementById('achievement-popup');
        const achName = document.getElementById('ach-name');
        if (toast && achName) {
            achName.textContent = name;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3500);
        }
    }

    levelFail(msg) {
        this.gameState = 'FAIL';
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('failMessage').textContent = msg;
        if (window.audioFX) window.audioFX.playWrong();
        
        // Trigger red alert border pulse
        this.triggerCameraShake(6, 400);

        setTimeout(() => {
            document.getElementById('failMenu').classList.remove('hidden');
        }, 800);
    }

    draw() {
        // High-DPI Scaling matrix
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const dpr = window.devicePixelRatio || 1;
        const scaleX = (this.canvas.width / dpr) / gameWidth;
        const scaleY = (this.canvas.height / dpr) / gameHeight;
        
        // Apply camera shake translation matrix
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (this.shakeTime > 0) {
            shakeOffsetX = (Math.random() - 0.5) * this.shakeForce;
            shakeOffsetY = (Math.random() - 0.5) * this.shakeForce;
        }

        this.ctx.scale(dpr * scaleX, dpr * scaleY);
        this.ctx.translate(shakeOffsetX, shakeOffsetY);

        // 1. Draw Grid BG
        this.ctx.fillStyle = '#050508';
        this.ctx.fillRect(0, 0, gameWidth, gameHeight);

        // Slow animated ambient background shift per level group
        let gridPulse = Math.sin(performance.now() * 0.001) * 0.04 + 0.06;
        let gridColor = 'rgba(0, 243, 255, ' + gridPulse + ')'; // Cyan default
        if (this.currentLevelIndex >= 9 && this.currentLevelIndex < 18) {
            gridColor = 'rgba(191, 0, 255, ' + gridPulse + ')'; // Purple mid
        } else if (this.currentLevelIndex >= 18) {
            gridColor = 'rgba(255, 45, 120, ' + gridPulse + ')'; // Red/Pink late
        }

        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1.2;
        const gridStep = 45;
        for (let x = 0; x < gameWidth; x += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, gameHeight); this.ctx.stroke();
        }
        for (let y = 0; y < gameHeight; y += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(gameWidth, y); this.ctx.stroke();
        }

        // Very faint background particles dust floating upward
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 8; i++) {
            let px = (Math.sin(performance.now() * 0.0003 + i) * 0.5 + 0.5) * gameWidth;
            let py = ((performance.now() * 0.04 + i * 100) % gameHeight);
            this.ctx.beginPath();
            this.ctx.arc(px, gameHeight - py, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 2. Draw Gravity Zones
        this.gravityZones.forEach(z => {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.04)';
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
            this.ctx.lineWidth = 1.5;
            this.ctx.fillRect(z.x, z.y, z.w, z.h);
            this.ctx.strokeRect(z.x, z.y, z.w, z.h);
            
            // Draw gravity direction flow lines
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.18)';
            this.ctx.setLineDash([4, 6]);
            this.ctx.lineWidth = 1.5;
            let arrowStr = z.dy < 0 ? '▲' : z.dy > 0 ? '▼' : z.dx < 0 ? '◀' : '▶';
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.35)';
            this.ctx.font = 'bold 16px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Draw indicators inside the zone
            this.ctx.fillText(arrowStr + " GRAVITY FLOW " + arrowStr, z.x + z.w/2, z.y + z.h/2);
            this.ctx.restore();
        });

        // 3. Draw Splitters
        this.splitters.forEach(sp => {
            this.ctx.save();
            // Outer glowing splitting shield rings
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = '#ffd700';
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.fillStyle = '#101116';
            
            this.ctx.beginPath();
            this.ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Inner graphic
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(sp.x - 10, sp.y);
            this.ctx.lineTo(sp.x + 10, sp.y);
            this.ctx.moveTo(sp.x, sp.y - 10);
            this.ctx.lineTo(sp.x, sp.y + 10);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 4. Draw Buckets
        this.buckets.forEach(bk => {
            this.ctx.save();
            const hex = BALL_COLORS[bk.color] ? BALL_COLORS[bk.color].hex : '#ffffff';
            
            // Bucket collection flash animations
            let flashVal = 0;
            if (this.bucketFlashTimes[bk.color] > 0) {
                this.bucketFlashTimes[bk.color]--;
                flashVal = this.bucketFlashTimes[bk.color] / 12;
            }

            const flashColor = this.bucketFlashColors[bk.color] || hex;
            this.ctx.shadowBlur = 15 + (flashVal * 15);
            this.ctx.shadowColor = flashColor;
            this.ctx.strokeStyle = flashColor;
            this.ctx.lineWidth = 4 + (flashVal * 2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(bk.x - bk.w/2, 680);
            this.ctx.lineTo(bk.x - bk.w/2, 750);
            this.ctx.lineTo(bk.x + bk.w/2, 750);
            this.ctx.lineTo(bk.x + bk.w/2, 680);
            this.ctx.stroke();
            
            // Draw Bucket Fill Level Visual Progress
            const fillHeight = 70 * (this.bucketFills[bk.color] || 0);
            if (fillHeight > 0) {
                this.ctx.fillStyle = hex;
                this.ctx.globalAlpha = 0.35 + (flashVal * 0.35);
                this.ctx.fillRect(bk.x - bk.w/2 + 4, 750 - fillHeight, bk.w - 8, fillHeight);
                this.ctx.globalAlpha = 1.0;
            }

            // Draw expanding light rings when correct ball collected
            if (flashVal > 0 && flashColor !== '#ff0000') {
                this.ctx.strokeStyle = hex;
                this.ctx.globalAlpha = flashVal;
                this.ctx.beginPath();
                this.ctx.arc(bk.x, 715, bk.w * (1 + (1 - flashVal) * 1.5), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0;
            }

            // Label text
            this.ctx.fillStyle = flashColor;
            this.ctx.font = 'bold 11px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bk.color.toUpperCase(), bk.x, 736);
            this.ctx.restore();
        });

        // 5. Draw Static Walls & Gate Barriers
        this.ctx.save();
        this.ctx.strokeStyle = '#1e1b30';
        this.ctx.lineWidth = 6;
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = '#000000';
        this.ctx.lineCap = 'round';
        this.walls.forEach(w => {
            // Filter gates active state
            if (w.gatePinId) {
                const p = this.pins.find(pin => pin.id === w.gatePinId);
                if (w.reverseGate) {
                    if (!p || !p.isRemoved) return;
                } else {
                    if (p && p.isRemoved) return;
                }
                // Gates glow purple/pink to distinguish them from standard static walls
                this.ctx.strokeStyle = '#ff2d78';
                this.ctx.shadowColor = '#ff2d78';
            } else {
                this.ctx.strokeStyle = '#1e1b30';
                this.ctx.shadowColor = '#1e1b30';
            }
            this.ctx.beginPath();
            this.ctx.moveTo(w.x1, w.y1);
            this.ctx.lineTo(w.x2, w.y2);
            this.ctx.stroke();
        });
        this.ctx.restore();

        // 6. Draw Bouncers (neon magenta bumpers)
        this.bouncers.forEach(b => {
            this.ctx.save();
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 7;
            this.ctx.shadowBlur = 16;
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(b.x1, b.y1);
            this.ctx.lineTo(b.x2, b.y2);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 7. Draw Pins (3D pill rounded shapes with glowing breathing cues)
        this.pins.forEach(p => {
            if (p.isRemoved) return;
            
            this.ctx.save();
            let shakeX = 0;
            if (p.shakeTimer > 0) {
                shakeX = Math.sin(p.shakeTimer * 1.5) * 5;
            }
            this.ctx.translate(shakeX, 0);

            const blocked = this.isPinBlocked(p);
            let glowPulse = Math.sin(performance.now() * 0.007) * 0.15 + 0.85;
            let pinColor = blocked ? 'rgba(255, 45, 120, ' + glowPulse + ')' : 'rgba(57, 255, 20, ' + glowPulse + ')';
            let strokeColor = blocked ? '#ff2d78' : '#39ff14';

            this.ctx.shadowBlur = blocked ? 15 : 10;
            this.ctx.shadowColor = strokeColor;
            
            // Draw glowing sliding trail line
            if (p.glowingTrail.length > 0) {
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(p.glowingTrail[0].x, p.glowingTrail[0].y);
                p.glowingTrail.forEach(pt => this.ctx.lineTo(pt.x, pt.y));
                this.ctx.stroke();
            }

            // Draw Pin Body rounded pill path
            let pX1, pX2;
            if (p.direction === 'right') {
                pX1 = p.x + p.slideOffset;
                pX2 = p.x + p.w;
            } else {
                pX1 = p.x;
                pX2 = p.x + p.w - p.slideOffset;
            }

            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(pX1, p.y);
            this.ctx.lineTo(pX2, p.y);
            this.ctx.stroke();

            // Draw pin circular arrow cap (the handle)
            let capX = p.direction === 'right' ? p.x + p.w + p.slideOffset : p.x - p.slideOffset;
            this.ctx.fillStyle = '#0a0b10';
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(capX, p.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw arrow indicator on the cap
            this.ctx.fillStyle = strokeColor;
            this.ctx.font = 'bold 12px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const arrow = p.direction === 'right' ? '➔' : '⬅';
            this.ctx.fillText(arrow, capX, p.y);

            // Lock padlock overlay or timer countdown display
            if (blocked) {
                this.ctx.fillText('🔒', capX, p.y - 14);
            } else if (p.timer > 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 9px Outfit';
                this.ctx.fillText(Math.ceil(p.timer).toString() + "s", capX, p.y - 14);
            }
            this.ctx.restore();
        });

        // 8. Draw Balls (radial sphere shading and glow trails)
        this.balls.forEach(b => {
            if (b.collected) return;
            this.ctx.save();
            
            // Motion fading trail
            this.ctx.globalAlpha = 0.22;
            b.trail.forEach((t, i) => {
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, b.r * (i / b.trail.length), 0, Math.PI*2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;

            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = b.color;
            
            // Apply squash/stretch scaling matrix
            this.ctx.translate(b.x, b.y);
            this.ctx.scale(b.squashX, b.squashY);

            // Sphere radial gradient for premium 3D shading
            const radGrad = this.ctx.createRadialGradient(-b.r/3, -b.r/3, 1, 0, 0, b.r);
            radGrad.addColorStop(0, '#ffffff'); // shiny highlight spot
            radGrad.addColorStop(0.35, b.color);
            radGrad.addColorStop(1, '#050508');
            
            this.ctx.fillStyle = radGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, b.r, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // 9. Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));

        // 10. Draw Floating Texts
        this.floatingTexts.forEach(f => f.draw(this.ctx));
    }

    handleTap(clientX, clientY) {
        if (this.gameState !== 'PLAYING') return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = gameWidth / rect.width;
        const scaleY = gameHeight / rect.height;
        const tapX = (clientX - rect.left) * scaleX;
        const tapY = (clientY - rect.top) * scaleY;

        for (let i = 0; i < this.pins.length; i++) {
            const p = this.pins[i];
            if (p.isRemoved || p.isPulling) continue;
            
            let capX = p.direction === 'right' ? p.x + p.w + p.slideOffset : p.x - p.slideOffset;
            const dist = Math.sqrt((tapX - capX)**2 + (tapY - p.y)**2);
            
            if (dist <= 28) {
                if (this.isPinBlocked(p)) {
                    p.shakeTimer = 20; 
                    this.triggerCameraShake(4, 150);
                    this.spawnFloatingText(capX, p.y - 20, "BLOCKED!", "#ff0055");
                    if (window.audioFX && typeof window.audioFX.playBuzz === 'function') {
                        window.audioFX.playBuzz();
                    }
                } else {
                    // Pull pin: save undo state snapshot first!
                    this.saveUndoState();

                    p.isPulling = true;
                    this.pullsCount++;
                    
                    // Combo multiplier calculation
                    const now = performance.now();
                    const diff = (now - this.lastPullTime) / 1000;
                    this.lastPullTime = now;

                    if (diff < 1.2 && this.pullsCount > 1) {
                        this.comboMultiplier = Math.min(4, this.comboMultiplier + 1);
                        this.comboTimer = 2.0; // 2 seconds to extend combo
                        
                        // Show combo banner
                        const banner = document.getElementById('combo-alert');
                        if (banner) {
                            banner.textContent = `COMBO X${this.comboMultiplier}`;
                            banner.classList.remove('hidden');
                        }
                        this.spawnFloatingText(capX, p.y - 22, `COMBO X${this.comboMultiplier}!`, '#ff2d78');
                        
                        if (window.audioFX && typeof window.audioFX.playCollect === 'function') {
                            window.audioFX.playCollect();
                        }
                    } else {
                        if (window.audioFX) window.audioFX.playWhoosh();
                    }
                }
                break;
            }
        }
    }
}

// --- BOOTSTRAP INITIALIZATION ---
let gameInstance = null;
function initGame() {
    if (!gameInstance) {
        gameInstance = new PinPullGame();
        
        gameInstance.canvas.addEventListener('mousedown', (e) => {
            gameInstance.handleTap(e.clientX, e.clientY);
        });

        gameInstance.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            gameInstance.handleTap(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
    }
}
