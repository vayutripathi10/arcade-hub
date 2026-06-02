// Neon Pin Pull Game Engine
// Coordinates target gameplay resolution: 600x800

let gameWidth = 600;
let gameHeight = 800;

// Ball Colors Mapping
const BALL_COLORS = {
    cyan: { hex: '#00ffff', name: 'Cyan' },
    pink: { hex: '#ff2d78', name: 'Pink' },
    yellow: { hex: '#ffff00', name: 'Yellow' },
    green: { hex: '#39ff14', name: 'Green' },
    purple: { hex: '#bf00ff', name: 'Purple' },
    white: { hex: '#ffffff', name: 'White' }
};

// Collision Utilities
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

// ----------------------------------------------------
// 20 HAND-CRAFTED MAIN FRAME LEVELS CONFIGURATION
// ----------------------------------------------------
const LEVELS = [
    // --- TUTORIALS (1 - 3) ---
    {
        id: 1,
        desc: "Level 1: Simple Separation",
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
            { id: "pin1", x: 150, y: 380, w: 150, direction: "left", blockedBy: [] },
            { id: "pin2", x: 300, y: 380, w: 150, direction: "right", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 205, w: 90 },
            { color: "yellow", x: 395, w: 90 }
        ],
        balls: [
            { color: "cyan", x: 200, y: 220 },
            { color: "cyan", x: 225, y: 240 },
            { color: "cyan", x: 190, y: 260 },
            { color: "cyan", x: 240, y: 280 },
            { color: "cyan", x: 210, y: 300 },
            { color: "yellow", x: 380, y: 220 },
            { color: "yellow", x: 410, y: 240 },
            { color: "yellow", x: 370, y: 260 },
            { color: "yellow", x: 420, y: 280 },
            { color: "yellow", x: 390, y: 300 }
        ]
    },
    {
        id: 2,
        desc: "Level 2: Dual Gates",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 500 },
            { x1: 150, y1: 600, x2: 240, y2: 690 },
            { x1: 450, y1: 600, x2: 360, y2: 690 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 320, w: 150, direction: "left", blockedBy: [] },
            { id: "pin2", x: 300, y: 450, w: 150, direction: "right", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 100 }
        ],
        balls: [
            { color: "cyan", x: 210, y: 150 },
            { color: "cyan", x: 230, y: 180 },
            { color: "cyan", x: 190, y: 210 },
            { color: "cyan", x: 380, y: 250 },
            { color: "cyan", x: 410, y: 280 },
            { color: "cyan", x: 370, y: 310 }
        ]
    },
    {
        id: 3,
        desc: "Level 3: Order matters!",
        walls: [
            { x1: 200, y1: 100, x2: 200, y2: 600 },
            { x1: 400, y1: 100, x2: 400, y2: 600 },
            { x1: 200, y1: 600, x2: 230, y2: 680 },
            { x1: 400, y1: 600, x2: 370, y2: 680 },
            { x1: 300, y1: 680, x2: 300, y2: 700 }
        ],
        pins: [
            { id: "pin_top", x: 200, y: 250, w: 200, direction: "right", blockedBy: [] },
            { id: "pin_bottom", x: 200, y: 480, w: 200, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 120 }
        ],
        balls: [
            { color: "cyan", x: 280, y: 150 },
            { color: "cyan", x: 320, y: 170 },
            { color: "cyan", x: 300, y: 190 },
            { color: "white", x: 270, y: 350 },
            { color: "white", x: 310, y: 370 },
            { color: "white", x: 290, y: 390 }
        ]
    },
    // --- MEDIUM (4 - 8) ---
    {
        id: 4,
        desc: "Level 4: Interlock",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 400 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 300, w: 150, direction: "left", blockedBy: [] },
            { id: "pin2", x: 150, y: 450, w: 300, direction: "right", blockedBy: ["pin1"] } // pin 1 blocks pin 2
        ],
        buckets: [
            { color: "yellow", x: 300, w: 120 }
        ],
        balls: [
            { color: "yellow", x: 210, y: 150 },
            { color: "yellow", x: 230, y: 180 },
            { color: "yellow", x: 380, y: 220 },
            { color: "yellow", x: 390, y: 250 }
        ]
    },
    {
        id: 5,
        desc: "Level 5: Funnel Sorting",
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
            { id: "pin_left", x: 100, y: 350, w: 200, direction: "left", blockedBy: [] },
            { id: "pin_right", x: 300, y: 350, w: 200, direction: "right", blockedBy: [] },
            { id: "pin_gate", x: 220, y: 620, w: 160, direction: "right", blockedBy: [] }
        ],
        buckets: [
            { color: "pink", x: 300, w: 140 }
        ],
        balls: [
            { color: "pink", x: 190, y: 150 },
            { color: "pink", x: 220, y: 180 },
            { color: "pink", x: 390, y: 150 },
            { color: "pink", x: 420, y: 180 }
        ]
    },
    {
        id: 6,
        desc: "Level 6: Blocked Path",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin1", x: 150, y: 250, w: 250, direction: "left", blockedBy: [] },
            { id: "pin2", x: 200, y: 350, w: 250, direction: "right", blockedBy: ["pin1"] },
            { id: "pin3", x: 150, y: 480, w: 300, direction: "left", blockedBy: ["pin2"] }
        ],
        buckets: [
            { color: "green", x: 300, w: 120 }
        ],
        balls: [
            { color: "green", x: 280, y: 150 },
            { color: "green", x: 310, y: 180 },
            { color: "green", x: 290, y: 200 }
        ]
    },
    {
        id: 7,
        desc: "Level 7: Three Chambers",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 550 },
            { x1: 500, y1: 100, x2: 500, y2: 550 },
            { x1: 230, y1: 100, x2: 230, y2: 400 },
            { x1: 370, y1: 100, x2: 370, y2: 400 },
            { x1: 100, y1: 550, x2: 150, y2: 680 },
            { x1: 500, y1: 550, x2: 450, y2: 680 }
        ],
        pins: [
            { id: "pinA", x: 100, y: 320, w: 130, direction: "left", blockedBy: [] },
            { id: "pinB", x: 230, y: 320, w: 140, direction: "right", blockedBy: [] },
            { id: "pinC", x: 370, y: 320, w: 130, direction: "right", blockedBy: [] },
            { id: "pinMain", x: 100, y: 480, w: 400, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 200, w: 100 },
            { color: "purple", x: 400, w: 100 }
        ],
        balls: [
            { color: "cyan", x: 160, y: 200 },
            { color: "cyan", x: 180, y: 230 },
            { color: "purple", x: 420, y: 200 },
            { color: "purple", x: 440, y: 230 }
        ]
    },
    {
        id: 8,
        desc: "Level 8: Crossing Lanes",
        walls: [
            { x1: 180, y1: 100, x2: 180, y2: 600 },
            { x1: 420, y1: 100, x2: 420, y2: 600 },
            { x1: 180, y1: 600, x2: 230, y2: 680 },
            { x1: 420, y1: 600, x2: 370, y2: 680 }
        ],
        pins: [
            { id: "pin_left", x: 180, y: 250, w: 120, direction: "left", blockedBy: [] },
            { id: "pin_right", x: 300, y: 250, w: 120, direction: "right", blockedBy: [] },
            { id: "pin_gate", x: 180, y: 480, w: 240, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "yellow", x: 300, w: 120 }
        ],
        balls: [
            { color: "yellow", x: 230, y: 150 },
            { color: "yellow", x: 360, y: 150 },
            { color: "white", x: 300, y: 180 } // must be colored or fails
        ]
    },
    // --- HARD (9 - 15) ---
    {
        id: 9,
        desc: "Level 9: Cascade Trap",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 300 },
            { x1: 300, y1: 350, x2: 300, y2: 500 },
            { x1: 150, y1: 600, x2: 240, y2: 680 },
            { x1: 450, y1: 600, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pinA", x: 150, y: 250, w: 150, direction: "left", blockedBy: [] },
            { id: "pinB", x: 300, y: 250, w: 150, direction: "right", blockedBy: [] },
            { id: "pinC", x: 150, y: 420, w: 300, direction: "right", blockedBy: ["pinB"] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 120 }
        ],
        balls: [
            { color: "cyan", x: 210, y: 160 },
            { color: "cyan", x: 380, y: 160 }
        ]
    },
    {
        id: 10,
        desc: "Level 10: Maze flow",
        walls: [
            { x1: 120, y1: 100, x2: 120, y2: 650 },
            { x1: 480, y1: 100, x2: 480, y2: 650 },
            { x1: 120, y1: 220, x2: 350, y2: 300 },
            { x1: 250, y1: 450, x2: 480, y2: 370 },
            { x1: 120, y1: 650, x2: 230, y2: 700 },
            { x1: 480, y1: 650, x2: 370, y2: 700 }
        ],
        pins: [
            { id: "pin1", x: 350, y: 300, w: 130, direction: "right", blockedBy: [] },
            { id: "pin2", x: 120, y: 450, w: 130, direction: "left", blockedBy: [] },
            { id: "pin3", x: 120, y: 580, w: 360, direction: "right", blockedBy: [] }
        ],
        buckets: [
            { color: "green", x: 300, w: 140 }
        ],
        balls: [
            { color: "green", x: 200, y: 150 },
            { color: "green", x: 230, y: 180 },
            { color: "green", x: 210, y: 210 }
        ]
    },
    {
        id: 11,
        desc: "Level 11: Color Crossover",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 450 },
            { x1: 150, y1: 600, x2: 175, y2: 680 },
            { x1: 450, y1: 600, x2: 425, y2: 680 }
        ],
        pins: [
            { id: "pinL", x: 150, y: 350, w: 150, direction: "left", blockedBy: [] },
            { id: "pinR", x: 300, y: 350, w: 150, direction: "right", blockedBy: [] },
            { id: "pinX", x: 150, y: 500, w: 300, direction: "right", blockedBy: ["pinR"] }
        ],
        buckets: [
            { color: "purple", x: 220, w: 90 },
            { color: "yellow", x: 380, w: 90 }
        ],
        balls: [
            { color: "purple", x: 200, y: 200 },
            { color: "yellow", x: 400, y: 200 }
        ]
    },
    {
        id: 12,
        desc: "Level 12: Interlocking Chains",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 100, y1: 650, x2: 225, y2: 700 },
            { x1: 500, y1: 650, x2: 375, y2: 700 }
        ],
        pins: [
            { id: "pin1", x: 100, y: 200, w: 200, direction: "left", blockedBy: [] },
            { id: "pin2", x: 200, y: 320, w: 200, direction: "right", blockedBy: ["pin1"] },
            { id: "pin3", x: 300, y: 440, w: 200, direction: "right", blockedBy: ["pin2"] },
            { id: "pin4", x: 100, y: 560, w: 400, direction: "left", blockedBy: ["pin3"] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 150 }
        ],
        balls: [
            { color: "cyan", x: 200, y: 130 },
            { color: "cyan", x: 230, y: 150 }
        ]
    },
    {
        id: 13,
        desc: "Level 13: Funnel Squeeze",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 450 },
            { x1: 500, y1: 100, x2: 500, y2: 450 },
            { x1: 100, y1: 450, x2: 240, y2: 550 },
            { x1: 500, y1: 450, x2: 360, y2: 550 },
            { x1: 240, y1: 550, x2: 240, y2: 700 },
            { x1: 360, y1: 550, x2: 360, y2: 700 }
        ],
        pins: [
            { id: "pin_top", x: 100, y: 300, w: 400, direction: "right", blockedBy: [] },
            { id: "pin_gate", x: 240, y: 550, w: 120, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "pink", x: 300, w: 100 }
        ],
        balls: [
            { color: "pink", x: 280, y: 180 },
            { color: "pink", x: 310, y: 210 },
            { color: "pink", x: 290, y: 240 }
        ]
    },
    {
        id: 14,
        desc: "Level 14: Parallel tracks",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 230, y1: 100, x2: 230, y2: 500 },
            { x1: 370, y1: 100, x2: 370, y2: 500 },
            { x1: 100, y1: 600, x2: 225, y2: 680 },
            { x1: 500, y1: 600, x2: 375, y2: 680 }
        ],
        pins: [
            { id: "p1", x: 100, y: 350, w: 130, direction: "left", blockedBy: [] },
            { id: "p2", x: 230, y: 350, w: 140, direction: "right", blockedBy: [] },
            { id: "p3", x: 370, y: 350, w: 130, direction: "right", blockedBy: [] },
            { id: "pMain", x: 100, y: 520, w: 400, direction: "left", blockedBy: ["p2"] }
        ],
        buckets: [
            { color: "yellow", x: 300, w: 150 }
        ],
        balls: [
            { color: "yellow", x: 160, y: 200 },
            { color: "yellow", x: 300, y: 200 },
            { color: "yellow", x: 440, y: 200 }
        ]
    },
    {
        id: 15,
        desc: "Level 15: Drop and Roll",
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 520 },
            { x1: 450, y1: 100, x2: 450, y2: 520 },
            { x1: 150, y1: 350, x2: 350, y2: 450 }, // diagonal wall
            { x1: 150, y1: 520, x2: 240, y2: 680 },
            { x1: 450, y1: 520, x2: 360, y2: 680 }
        ],
        pins: [
            { id: "pin_top", x: 150, y: 280, w: 300, direction: "right", blockedBy: [] },
            { id: "pin_bottom", x: 150, y: 520, w: 300, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 300, w: 120 }
        ],
        balls: [
            { color: "cyan", x: 220, y: 150 },
            { color: "cyan", x: 250, y: 180 },
            { color: "cyan", x: 230, y: 200 }
        ]
    },
    // --- EXPERT (16 - 20) ---
    {
        id: 16,
        desc: "Level 16: Interlinked Mainframe",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 600 },
            { x1: 500, y1: 100, x2: 500, y2: 600 },
            { x1: 230, y1: 100, x2: 230, y2: 450 },
            { x1: 370, y1: 100, x2: 370, y2: 450 },
            { x1: 100, y1: 600, x2: 155, y2: 680 },
            { x1: 500, y1: 600, x2: 445, y2: 680 }
        ],
        pins: [
            { id: "pinA", x: 100, y: 250, w: 130, direction: "left", blockedBy: [] },
            { id: "pinB", x: 230, y: 250, w: 140, direction: "right", blockedBy: ["pinA"] },
            { id: "pinC", x: 370, y: 250, w: 130, direction: "right", blockedBy: ["pinB"] },
            { id: "pinD", x: 100, y: 400, w: 400, direction: "left", blockedBy: ["pinC"] }
        ],
        buckets: [
            { color: "green", x: 200, w: 90 },
            { color: "purple", x: 400, w: 90 }
        ],
        balls: [
            { color: "green", x: 160, y: 150 },
            { color: "purple", x: 300, y: 150 },
            { color: "green", x: 440, y: 150 }
        ]
    },
    {
        id: 17,
        desc: "Level 17: Triple Sort Core",
        walls: [
            { x1: 120, y1: 100, x2: 120, y2: 600 },
            { x1: 480, y1: 100, x2: 480, y2: 600 },
            { x1: 240, y1: 100, x2: 240, y2: 420 },
            { x1: 360, y1: 100, x2: 360, y2: 420 },
            { x1: 120, y1: 600, x2: 140, y2: 680 },
            { x1: 480, y1: 600, x2: 460, y2: 680 }
        ],
        pins: [
            { id: "pinL", x: 120, y: 300, w: 120, direction: "left", blockedBy: [] },
            { id: "pinM", x: 240, y: 300, w: 120, direction: "right", blockedBy: [] },
            { id: "pinR", x: 360, y: 300, w: 120, direction: "right", blockedBy: [] },
            { id: "pinMain", x: 120, y: 480, w: 360, direction: "left", blockedBy: [] }
        ],
        buckets: [
            { color: "cyan", x: 180, w: 80 },
            { color: "pink", x: 300, w: 80 },
            { color: "yellow", x: 420, w: 80 }
        ],
        balls: [
            { color: "cyan", x: 180, y: 180 },
            { color: "pink", x: 300, y: 180 },
            { color: "yellow", x: 420, y: 180 }
        ]
    },
    {
        id: 18,
        desc: "Level 18: Gravity Well Maze",
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 100, y1: 250, x2: 350, y2: 300 },
            { x1: 250, y1: 420, x2: 500, y2: 470 },
            { x1: 100, y1: 650, x2: 230, y2: 700 },
            { x1: 500, y1: 650, x2: 370, y2: 700 }
        ],
        pins: [
            { id: "pin1", x: 350, y: 300, w: 150, direction: "right", blockedBy: [] },
            { id: "pin2", x: 100, y: 420, w: 150, direction: "left", blockedBy: ["pin1"] },
            { id: "pin3", x: 100, y: 560, w: 400, direction: "right", blockedBy: [] }
        ],
        buckets: [
            { color: "green", x: 300, w: 140 }
        ],
        balls: [
            { color: "green", x: 200, y: 150 },
            { color: "green", x: 230, y: 170 }
        ]
    },
    {
        id: 19,
        desc: "Level 19: Time Squeeze",
        timerLimit: 25, // 25 seconds time pressure
        walls: [
            { x1: 150, y1: 100, x2: 150, y2: 600 },
            { x1: 450, y1: 100, x2: 450, y2: 600 },
            { x1: 300, y1: 100, x2: 300, y2: 450 },
            { x1: 150, y1: 600, x2: 225, y2: 680 },
            { x1: 450, y1: 600, x2: 375, y2: 680 }
        ],
        pins: [
            { id: "p1", x: 150, y: 320, w: 150, direction: "left", blockedBy: [] },
            { id: "p2", x: 300, y: 320, w: 150, direction: "right", blockedBy: [] },
            { id: "pBottom", x: 150, y: 490, w: 300, direction: "right", blockedBy: ["p1", "p2"] }
        ],
        buckets: [
            { color: "purple", x: 300, w: 150 }
        ],
        balls: [
            { color: "purple", x: 210, y: 180 },
            { color: "purple", x: 390, y: 180 }
        ]
    },
    {
        id: 20,
        desc: "Level 20: The Grand Mainframe",
        timerLimit: 30, // 30 seconds limit
        walls: [
            { x1: 100, y1: 100, x2: 100, y2: 650 },
            { x1: 500, y1: 100, x2: 500, y2: 650 },
            { x1: 230, y1: 100, x2: 230, y2: 480 },
            { x1: 370, y1: 100, x2: 370, y2: 480 },
            { x1: 100, y1: 650, x2: 140, y2: 710 },
            { x1: 500, y1: 650, x2: 460, y2: 710 }
        ],
        pins: [
            { id: "pinL", x: 100, y: 220, w: 130, direction: "left", blockedBy: [] },
            { id: "pinM", x: 230, y: 220, w: 140, direction: "right", blockedBy: ["pinL"] },
            { id: "pinR", x: 370, y: 220, w: 130, direction: "right", blockedBy: ["pinM"] },
            { id: "pinGateL", x: 100, y: 380, w: 130, direction: "left", blockedBy: ["pinR"] },
            { id: "pinGateR", x: 370, y: 380, w: 130, direction: "right", blockedBy: ["pinGateL"] },
            { id: "pinMain", x: 100, y: 520, w: 400, direction: "left", blockedBy: ["pinGateR"] }
        ],
        buckets: [
            { color: "cyan", x: 180, w: 80 },
            { color: "yellow", x: 300, w: 80 },
            { color: "pink", x: 420, w: 80 }
        ],
        balls: [
            { color: "cyan", x: 160, y: 150 },
            { color: "yellow", x: 300, y: 150 },
            { color: "pink", x: 440, y: 150 }
        ]
    }
];

// ----------------------------------------------------
// ENTITIES & PHYSICS CLASSES
// ----------------------------------------------------
class Ball {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.r = 14;
        this.colorKey = color;
        this.color = BALL_COLORS[color] ? BALL_COLORS[color].hex : '#ffffff';
        this.vx = 0;
        this.vy = 0;
        this.collected = false;
        this.trail = [];
    }
}

class Pin {
    constructor(config) {
        this.id = config.id;
        this.x = config.x;
        this.y = config.y;
        this.w = config.w;
        this.h = 14; // visual height
        this.direction = config.direction; // "left" or "right"
        this.blockedBy = config.blockedBy || [];
        this.slideOffset = 0;
        this.isPulling = false;
        this.isRemoved = false;
        this.pullSpeed = 8;
        this.shakeTimer = 0;
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
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.size = Math.random() * 4 + 2;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 0.1 * deltaTime; // gravity pull on sparks
        this.life -= 0.03 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// ----------------------------------------------------
// GAME SYSTEM CONTROLLER
// ----------------------------------------------------
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
        
        this.gameState = 'START'; // START, PLAYING, PAUSED, SUCCESS, FAIL
        this.lastTime = 0;
        this.gravity = 0.35;
        this.restitution = 0.3;
        this.totalBallsCount = 0;
        this.collectedCount = 0;
        
        this.mistakesCount = 0;
        this.timerRemaining = 0;
        this.timerActive = false;
        
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
            if (saved) {
                this.unlockedLevels = parseInt(saved) || 1;
            }
        } catch(e) {}
    }

    saveProgress() {
        try {
            localStorage.setItem('neonPinPullProgress', this.unlockedLevels);
        } catch(e) {}
    }

    initUI() {
        // Render Level Selector Grid
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
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

        // Start / Setup actions
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
            if (this.currentLevelIndex < 19) {
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

        // Hub Exit Button
        document.getElementById('hub-btn')?.addEventListener('click', () => {
            if (window.audioFX) window.audioFX.playWhoosh();
            window.top.location.href = '../index.html';
        });

        // Pause / Audio Triggers
        document.getElementById('btn-pause')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.gameState === 'PLAYING') this.togglePause(true);
        });

        document.getElementById('btn-mute')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.audioFX) {
                const muted = window.audioFX.toggleMute();
                document.getElementById('btn-mute').innerHTML = muted ? '🔇' : '🔊';
            }
        });

        // Hint System
        document.getElementById('btn-hint')?.addEventListener('click', () => {
            // Restart the level to make it playable and dismiss the failure screen
            this.startLevel(this.currentLevelIndex);
            
            // Costs 1 star: set mistakes to 2 so they get max 1 star
            this.mistakesCount = 2;
            
            // Find and shake the first correct pin to pull
            const hint = this.getFirstMoveHint();
            if (hint) {
                const hintPin = this.pins.find(p => p.id === hint);
                if (hintPin) {
                    hintPin.shakeTimer = 40; // visual indicator bounce
                    if (window.audioFX) window.audioFX.playWhoosh();
                }
            }
        });

        // Social sharing
        const shareScore = (platform) => {
            const text = `I just decrypted Level ${this.currentLevelIndex + 1} of Neon Pin Pull! 🔱 Let the neon flow at Arcade Hub:`;
            const url = 'https://arcadehubplay.com';
            if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            } else if (platform === 'whatsapp') {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
            }
        };

        document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
        document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));
    }

    getFirstMoveHint() {
        // Basic solver hint logic: returns the first unremoved, unblocked pin
        const freePin = this.pins.find(p => !p.isRemoved && !this.isPinBlocked(p));
        return freePin ? freePin.id : null;
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
        
        // Target layout aspect ratio: 3:4 (600x800)
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

    startLevel(index) {
        this.currentLevelIndex = index;
        const config = LEVELS[index];
        
        // Deep copy level configurations
        this.walls = JSON.parse(JSON.stringify(config.walls));
        this.pins = config.pins.map(p => new Pin(p));
        this.buckets = JSON.parse(JSON.stringify(config.buckets));
        this.balls = config.balls.map(b => new Ball(b.x, b.y, b.color));
        this.particles = [];
        
        this.totalBallsCount = this.balls.length;
        this.collectedCount = 0;
        this.mistakesCount = 0;
        
        this.timerActive = !!config.timerLimit;
        if (this.timerActive) {
            this.timerRemaining = config.timerLimit;
        }

        this.gameState = 'PLAYING';
        
        // Hide overlays
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

        this.updateHUD();
        this.lastTime = performance.now();
    }

    updateHUD() {
        document.getElementById('hud-level').textContent = `LEVEL ${this.currentLevelIndex + 1}`;
        if (this.timerActive) {
            document.getElementById('hud-balls').textContent = `TIME: ${Math.ceil(this.timerRemaining)}s`;
        } else {
            document.getElementById('hud-balls').textContent = `BALLS: ${this.collectedCount}/${this.totalBallsCount}`;
        }
    }

    isPinBlocked(pin) {
        // 1. Check configuration-defined logical blocks
        if (pin.blockedBy && pin.blockedBy.length > 0) {
            const hasBlocked = pin.blockedBy.some(id => {
                const other = this.pins.find(p => p.id === id);
                return other && !other.isRemoved;
            });
            if (hasBlocked) return true;
        }

        // 2. Check physical bounding box overlaps on pull paths
        const pullPath = this.getPullPath(pin);
        return this.pins.some(other => {
            if (other === pin) return false;
            if (other.isRemoved) return false;
            
            // Check overlapping rectangle bounds
            const bounds = other.bounds;
            return overlaps(pullPath, bounds);
        });
    }

    getPullPath(pin) {
        // Generates pull path rectangle geometry extending from pin edge to boundary
        if (pin.direction === 'right') {
            return {
                x: pin.x,
                y: pin.y - 12,
                w: gameWidth - pin.x,
                h: 24
            };
        } else {
            return {
                x: 0,
                y: pin.y - 12,
                w: pin.x + pin.w,
                h: 24
            };
        }
    }

    loop(timestamp) {
        const deltaTime = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 3) : 1;
        this.lastTime = timestamp;

        if (this.gameState === 'PLAYING') {
            this.update(deltaTime);
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        // 1. Time restriction countdown
        if (this.timerActive) {
            this.timerRemaining -= (deltaTime * 16.67) / 1000;
            this.updateHUD();
            if (this.timerRemaining <= 0) {
                this.timerRemaining = 0;
                this.levelFail("SECURITY LOCKDOWN! OUT OF TIME.");
                return;
            }
        }

        // 2. Animate sliding pins
        this.pins.forEach(p => {
            if (p.isPulling) {
                p.slideOffset += p.pullSpeed * deltaTime;
                if (p.slideOffset >= p.w) {
                    p.slideOffset = p.w;
                    p.isPulling = false;
                    p.isRemoved = true;
                }
            }
            if (p.shakeTimer > 0) {
                p.shakeTimer -= deltaTime;
            }
        });

        // 3. Update physics system (gravity, bouncing, collisions)
        const physicsIterations = 4;
        for (let step = 0; step < physicsIterations; step++) {
            // Apply gravity and move balls
            this.balls.forEach(b => {
                if (!b.collected) {
                    b.vy += this.gravity * deltaTime;
                    b.vy = Math.min(b.vy, 12); // cap speeds
                    b.vx = Math.min(Math.max(b.vx, -12), 12);
                    
                    b.x += b.vx * deltaTime;
                    b.y += b.vy * deltaTime;
                    
                    b.vx *= 0.98;
                    b.vy *= 0.99;
                }
            });

            // Circle-to-Circle (ball-to-ball) overlaps
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
                        
                        // Color transfer logic for neutral (white) balls
                        if (b1.colorKey !== 'white' && b2.colorKey === 'white') {
                            b2.colorKey = b1.colorKey;
                            b2.color = BALL_COLORS[b1.colorKey].hex;
                        } else if (b2.colorKey !== 'white' && b1.colorKey === 'white') {
                            b1.colorKey = b2.colorKey;
                            b1.color = BALL_COLORS[b2.colorKey].hex;
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
                        }
                    }
                }
            }

            // Circle-to-Wall bounds check
            this.balls.forEach(b => {
                if (b.collected) return;
                this.walls.forEach(w => {
                    const col = collideCircleLine(b, w.x1, w.y1, w.x2, w.y2);
                    if (col) {
                        const { nx, ny, overlap } = col;
                        b.x += nx * overlap;
                        b.y += ny * overlap;
                        
                        const dot = b.vx * nx + b.vy * ny;
                        if (dot < 0) {
                            b.vx -= (1 + this.restitution) * dot * nx;
                            b.vy -= (1 + this.restitution) * dot * ny;
                        }
                    }
                });

                // Circle-to-Pin sliding barrier check
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
                            }
                        }
                    }
                });
            });
        }

        // 4. Stacking and tracking trail lines
        this.balls.forEach(b => {
            if (b.collected) return;
            // Append trail coordinates
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 5) b.trail.shift();
            
            // Check boundary out of bounds
            if (b.y > gameHeight + 100) {
                this.levelFail("BALLS LOST OUT OF CORE BOUNDARIES!");
            }
        });

        // 5. Goal Buckets verification
        this.balls.forEach(b => {
            if (b.collected) return;
            
            // Reaches bucket trigger threshold (bottom of columns, above buckets)
            if (b.y >= 680) {
                // Find matching bucket
                const bucket = this.buckets.find(bk => {
                    return b.x >= bk.x - bk.w/2 && b.x <= bk.x + bk.w/2;
                });
                
                if (bucket) {
                    if (bucket.color === b.colorKey) {
                        // Correct collect!
                        b.collected = true;
                        this.collectedCount++;
                        this.updateHUD();
                        if (window.audioFX) window.audioFX.playCollect();
                        
                        // Spawn neon sparkles
                        for (let k = 0; k < 12; k++) {
                            this.particles.push(new Particle(b.x, b.y, b.color));
                        }
                    } else {
                        // Incorrect mix
                        this.levelFail(`COLORS MIXED! ${b.colorKey.toUpperCase()} BALL REACHED ${bucket.color.toUpperCase()} BUCKET.`);
                    }
                } else if (b.y >= 750) {
                    // Missed all buckets
                    this.levelFail("BALLS CRASHED OUTSIDE INTENT CORE BUCKETS.");
                }
            }
        });

        // 6. Complete stage verification
        if (this.collectedCount === this.totalBallsCount) {
            this.levelSuccess();
        }

        // 7. Update sparkles particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    levelSuccess() {
        this.gameState = 'SUCCESS';
        document.getElementById('btn-pause').classList.add('hidden');
        
        // Calculate stars
        let starsStr = '⭐⭐⭐';
        if (this.mistakesCount >= 3) starsStr = '⭐';
        else if (this.mistakesCount >= 1) starsStr = '⭐⭐';
        
        // Unlock next sector
        if (this.currentLevelIndex + 1 >= this.unlockedLevels) {
            this.unlockedLevels = Math.min(20, this.currentLevelIndex + 2);
            this.saveProgress();
        }

        document.getElementById('starsDisplay').textContent = starsStr;
        document.getElementById('successMessage').textContent = `Mainframe decryption complete! mistakes: ${this.mistakesCount}`;
        
        // Unlock Trophy if clearing Level 20
        if (this.currentLevelIndex === 19 && window.achievements) {
            window.achievements.unlock('neon_pin_pull', 'complete_all', 'Cyberspace Master');
        }

        if (window.audioFX) window.audioFX.playVictory();
        setTimeout(() => {
            document.getElementById('successMenu').classList.remove('hidden');
        }, 800);
    }

    levelFail(msg) {
        this.gameState = 'FAIL';
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('failMessage').textContent = msg;
        if (window.audioFX) window.audioFX.playWrong();
        setTimeout(() => {
            document.getElementById('failMenu').classList.remove('hidden');
        }, 800);
    }

    draw() {
        // Clear canvas using high-DPI scaling matrix
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const dpr = window.devicePixelRatio || 1;
        const scaleX = (this.canvas.width / dpr) / gameWidth;
        const scaleY = (this.canvas.height / dpr) / gameHeight;
        this.ctx.scale(dpr * scaleX, dpr * scaleY);

        // 1. Draw Grid BG
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, gameWidth, gameHeight);

        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)';
        this.ctx.lineWidth = 1;
        const gridStep = 40;
        for (let x = 0; x < gameWidth; x += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, gameHeight); this.ctx.stroke();
        }
        for (let y = 0; y < gameHeight; y += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(gameWidth, y); this.ctx.stroke();
        }

        // 2. Draw Buckets
        this.buckets.forEach(bk => {
            this.ctx.save();
            const hex = BALL_COLORS[bk.color] ? BALL_COLORS[bk.color].hex : '#ffffff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = hex;
            this.ctx.strokeStyle = hex;
            this.ctx.lineWidth = 4;
            
            // Draw bucket outline (u-shape)
            this.ctx.beginPath();
            this.ctx.moveTo(bk.x - bk.w/2, 680);
            this.ctx.lineTo(bk.x - bk.w/2, 750);
            this.ctx.lineTo(bk.x + bk.w/2, 750);
            this.ctx.lineTo(bk.x + bk.w/2, 680);
            this.ctx.stroke();
            
            // Label
            this.ctx.fillStyle = hex;
            this.ctx.font = 'bold 11px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bk.color.toUpperCase(), bk.x, 740);
            this.ctx.restore();
        });

        // 3. Draw Static Walls
        this.ctx.save();
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 6;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#1a1a2e';
        this.ctx.lineCap = 'round';
        this.walls.forEach(w => {
            this.ctx.beginPath();
            this.ctx.moveTo(w.x1, w.y1);
            this.ctx.lineTo(w.x2, w.y2);
            this.ctx.stroke();
        });
        this.ctx.restore();

        // 4. Draw Pins
        this.pins.forEach(p => {
            if (p.isRemoved) return;
            
            this.ctx.save();
            
            // Calculate shake offsets
            let shakeX = 0;
            if (p.shakeTimer > 0) {
                shakeX = Math.sin(p.shakeTimer * 1.5) * 5;
            }

            this.ctx.translate(shakeX, 0);

            const blocked = this.isPinBlocked(p);
            const color = blocked ? '#ff4444' : '#ffffff';
            
            this.ctx.shadowBlur = blocked ? 12 : 8;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            
            // Calculate remaining bar points
            let pX1, pX2;
            if (p.direction === 'right') {
                pX1 = p.x + p.slideOffset;
                pX2 = p.x + p.w;
            } else {
                pX1 = p.x;
                pX2 = p.x + p.w - p.slideOffset;
            }

            // Draw line
            this.ctx.beginPath();
            this.ctx.moveTo(pX1, p.y);
            this.ctx.lineTo(pX2, p.y);
            this.ctx.stroke();

            // Draw pin circular arrow cap (the handle)
            // If pulling right, cap is on left (starting point)
            // If pulling left, cap is on right (ending point)
            let capX = p.direction === 'right' ? p.x + p.slideOffset : p.x + p.w - p.slideOffset;
            
            // Only draw cap if the pin is still visual
            if ((p.direction === 'right' && capX < p.x + p.w) || (p.direction === 'left' && capX > p.x)) {
                this.ctx.fillStyle = '#0a0a0f';
                this.ctx.beginPath();
                this.ctx.arc(capX, p.y, 14, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Draw arrow indicator on the cap
                this.ctx.fillStyle = color;
                this.ctx.font = 'bold 12px Outfit';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const arrow = p.direction === 'right' ? '➔' : '⬅';
                this.ctx.fillText(arrow, capX, p.y);

                // Block lock icon overlay
                if (blocked) {
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.font = 'bold 10px Outfit';
                    this.ctx.fillText('🔒', capX, p.y - 12);
                }
            }

            this.ctx.restore();
        });

        // 5. Draw Balls
        this.balls.forEach(b => {
            if (b.collected) return;
            this.ctx.save();
            
            // Draw motion trail
            this.ctx.globalAlpha = 0.25;
            b.trail.forEach((t, i) => {
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, b.r * (i / b.trail.length), 0, Math.PI*2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;

            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = b.color;
            this.ctx.fillStyle = b.color;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Shiny neon inner white center dot
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(b.x - 4, b.y - 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // 6. Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));
    }

    handleTap(clientX, clientY) {
        if (this.gameState !== 'PLAYING') return;

        // Map touch coordinate to canvas layout coordinate space
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const scaleX = gameWidth / rect.width;
        const scaleY = gameHeight / rect.height;
        const tapX = (clientX - rect.left) * scaleX;
        const tapY = (clientY - rect.top) * scaleY;

        // Detect if tapped any pin handle cap
        for (let i = 0; i < this.pins.length; i++) {
            const p = this.pins[i];
            if (p.isRemoved || p.isPulling) continue;
            
            let capX = p.direction === 'right' ? p.x + p.slideOffset : p.x + p.w - p.slideOffset;
            const dist = Math.sqrt((tapX - capX)**2 + (tapY - p.y)**2);
            
            if (dist <= 26) {
                // Check if blocked by other pins
                if (this.isPinBlocked(p)) {
                    p.shakeTimer = 20; // shake pin
                    this.mistakesCount++;
                    if (window.audioFX) window.audioFX.playThud();
                } else {
                    p.isPulling = true;
                    if (window.audioFX) window.audioFX.playWhoosh();
                }
                break;
            }
        }
    }
}

// Overlapping rectangle bounds checking utility
function overlaps(r1, r2) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
}

// ----------------------------------------------------
// BOOTSTRAP INITIALIZATION
// ----------------------------------------------------
let gameInstance = null;
function initGame() {
    if (!gameInstance) {
        gameInstance = new PinPullGame();
        
        // Touch/Click listeners
        gameInstance.canvas.addEventListener('mousedown', (e) => {
            gameInstance.handleTap(e.clientX, e.clientY);
        });

        gameInstance.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            gameInstance.handleTap(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
    }
}
