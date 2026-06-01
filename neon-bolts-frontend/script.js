/* ==========================================================================
   NEON STICK & SCREWS - COMPLETE OVERHAULED ENGINE
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. WEB AUDIO SYNTHESIZER MANAGER
// --------------------------------------------------------------------------
class AudioSynthManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            if (this.ctx) this.ctx.suspend();
        } else {
            this.init();
            if (this.ctx) this.ctx.resume();
        }
        return this.isMuted;
    }

    playTickSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Metallic unscrewing tick
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playClinkSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Satisfying snap/click insertion
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1100, now);
        osc1.frequency.exponentialRampToValueAtTime(450, now + 0.12);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(320, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.10);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
    }

    playErrorSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Error buzz for locked clicks
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playFallSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Stick falling crash buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.45);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
    }

    playWhooshSFX(speed) {
        if (this.isMuted || !this.ctx || Math.abs(speed) < 1.0) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Pendulum swing whoosh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180 + Math.min(200, Math.abs(speed) * 35), now);
        
        const vol = Math.min(0.05, Math.abs(speed) * 0.015);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playSuccessSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 major triad

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.38);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.45);
        });
    }

    playBounceSFX() {
        if (this.isMuted) return;
        this.init(); this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Metallic bounce clank
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
}

const synth = new AudioSynthManager();

// --------------------------------------------------------------------------
// 2. CYBERSPACE MAINBOARD ASSET CLASSES
// --------------------------------------------------------------------------

class BoardHole {
    constructor(id, x, y, type = 'normal') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.origX = x; // for moving server cores
        this.type = type; // 'normal', 'goal'
        this.radius = 16;
    }

    update(time) {
        if (this.type === 'moving') {
            // Oscillate slowly horizontally
            this.x = this.origX + Math.sin(time * 1.8) * 55;
        }
    }

    draw(ctx, isSelectedEmpty) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.type === 'goal') {
            // Goal hole (green pulsing)
            const pulse = 8 + Math.sin(performance.now() * 0.008) * 3;
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = pulse;
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(57, 255, 20, 0.12)';
            ctx.fill();
        } else if (isSelectedEmpty) {
            // Empty and snap targets
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.fillStyle = 'rgba(0, 255, 255, 0.08)';
            ctx.fill();
        } else {
            // Standard Empty Hole (cyan dashed border)
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fill();
            ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.restore();
    }
}

class Screw {
    constructor(id, holeId, endName) {
        this.id = id;
        this.holeId = holeId; // null if carried on stick tip
        this.endName = endName; // 'EndA' or 'EndB'
        this.x = 0;
        this.y = 0;
        this.radius = 16;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += 5 * dt;
    }

    draw(ctx, isSelected, isLocked) {
        ctx.save();
        let baseColor = '#ffff00'; // Yellow neon
        let shadowGlow = 8;

        if (isLocked) {
            baseColor = '#ff4444'; // Red lock alert
            shadowGlow = 12 + Math.sin(this.pulse) * 3;
        } else if (isSelected) {
            baseColor = '#ffffff';
            shadowGlow = 16 + Math.sin(this.pulse) * 4;
        }

        ctx.shadowColor = baseColor;
        ctx.shadowBlur = shadowGlow;
        ctx.fillStyle = isSelected ? '#ffffff' : baseColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        // Draw bolt flange ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw the inner mechanical thread vector
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mechanical cross inner pattern
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y - 4);
        ctx.lineTo(this.x + 4, this.y + 4);
        ctx.moveTo(this.x + 4, this.y - 4);
        ctx.lineTo(this.x - 4, this.y + 4);
        ctx.stroke();

        // Draw lock symbol 🔒 if single screw is locked
        if (isLocked) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', this.x, this.y + 1);
        }

        ctx.restore();
    }
}

class ObstacleWall {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        ctx.restore();
    }
}

// --------------------------------------------------------------------------
// 3. CORE 2D RIGID PIVOT PHYSICS SOLVER
// --------------------------------------------------------------------------

class NeonStick {
    constructor(length) {
        this.length = length;
        
        // Coordinates of stick ends
        this.ax = 150;
        this.ay = 300;
        this.bx = 350;
        this.by = 300;

        this.theta = 0; // current angle when pivoting
        this.omega = 0; // angular velocity

        this.gravity = 980;
        this.damping = 0.994;

        this.trailHistory = [];
        this.prevWhooshTime = 0;
    }

    update(dt, screws, holes, obstacles, gravityDir = 1.0) {
        // Sync carried/unlocked screws to swing tips
        const screwA = screws.find(s => s.endName === 'EndA');
        const screwB = screws.find(s => s.endName === 'EndB');

        const activePins = [];
        if (screwA && screwA.holeId !== null) activePins.push({ name: 'EndA', screw: screwA });
        if (screwB && screwB.holeId !== null) activePins.push({ name: 'EndB', screw: screwB });

        // 1. LOCKED STATE (both screws inserted)
        if (activePins.length >= 2) {
            const hA = holes.find(h => h.id === screwA.holeId);
            const hB = holes.find(h => h.id === screwB.holeId);
            if (hA && hB) {
                this.ax = hA.x; this.ay = hA.y;
                this.bx = hB.x; this.by = hB.y;
            }
            this.omega = 0;
            this.trailHistory = [];

            // Screw positions follow wall holes exactly
            screwA.x = this.ax; screwA.y = this.ay;
            screwB.x = this.bx; screwB.y = this.by;
            return 'LOCKED';
        }

        // 2. PIVOT STATE (exactly 1 screw inserted)
        if (activePins.length === 1) {
            const pin = activePins[0];
            const isAPinned = pin.name === 'EndA';
            const pivotHole = holes.find(h => h.id === pin.screw.holeId);

            if (pivotHole) {
                const px = pivotHole.x;
                const py = pivotHole.y;

                if (isAPinned) {
                    this.ax = px; this.ay = py;
                } else {
                    this.bx = px; this.by = py;
                }

                // If starting a fresh pendulum swing, calculate the initial theta
                const freeEndName = isAPinned ? 'EndB' : 'EndA';
                const fx = isAPinned ? this.bx : this.ax;
                const fy = isAPinned ? this.by : this.ay;

                // Angle is relative to vertical direction (based on active gravity vector direction)
                const dx = fx - px;
                const dy = fy - py;

                // Adjust angle for inverted gravity zones (gravityDir = -1.0 means gravity pulls UPWARDS)
                const adjustedDy = dy * gravityDir;
                const curTheta = Math.atan2(dx, adjustedDy);

                this.theta = curTheta;

                // 2D Pendulum Equation: alpha = (-gravity / L) * sin(theta)
                const alpha = (-(this.gravity * gravityDir) / this.length) * Math.sin(this.theta) * gravityDir;

                // Integrate
                const prevTheta = this.theta;
                this.omega += alpha * dt;
                this.omega *= this.damping;
                this.theta += this.omega * dt;

                // Bound angle
                if (this.theta > Math.PI * 2) this.theta -= Math.PI * 2;
                if (this.theta < -Math.PI * 2) this.theta += Math.PI * 2;

                // Recalculate free end candidate coordinates
                const swingX = px + Math.sin(this.theta) * this.length;
                const swingY = py + Math.cos(this.theta) * this.length * gravityDir;

                let nextAx = isAPinned ? px : swingX;
                let nextAy = isAPinned ? py : swingY;
                let nextBx = isAPinned ? swingX : px;
                let nextBy = isAPinned ? swingY : py;

                // 3. CYAN OBSTACLE COLLISION DETECTION (Elastic Bouncing)
                let collided = false;
                let colPoint = null;

                for (let wall of obstacles) {
                    const hit = this.lineIntersects(
                        { x: px, y: py },
                        { x: swingX, y: swingY },
                        { x: wall.x1, y: wall.y1 },
                        { x: wall.x2, y: wall.y2 }
                    );
                    if (hit) {
                        collided = true;
                        colPoint = hit;
                        break;
                    }
                }

                if (collided) {
                    // Elastic rebound bounce
                    this.theta = prevTheta; // roll back
                    this.omega = -this.omega * 0.45; // reverse and damp
                    synth.playBounceSFX();
                    
                    // Spawn sparks at crash point
                    if (colPoint) {
                        this.spawnSparks(colPoint.x, colPoint.y);
                    }
                } else {
                    // Kinematics accept
                    this.ax = nextAx; this.ay = nextAy;
                    this.bx = nextBx; this.by = nextBy;
                }

                // Sync screws
                screwA.x = this.ax; screwA.y = this.ay;
                screwB.x = this.bx; screwB.y = this.by;

                // Play periodic swing swooshes
                const nowTime = performance.now();
                if (nowTime - this.prevWhooshTime > 300 && Math.abs(this.omega) > 1.2) {
                    synth.playWhooshSFX(this.omega);
                    this.prevWhooshTime = nowTime;
                }

                // Add to pink pendulum fading trails
                this.trailHistory.push({ x: swingX, y: swingY, alpha: 1.0 });
                if (this.trailHistory.length > 25) this.trailHistory.shift();

                return 'SWINGING';
            }
        }

        // 4. FALLING STATE (zero screws inserted)
        this.trailHistory = [];
        return 'FALLING';
    }

    spawnSparks(x, y) {
        if (window.gameInstance) {
            window.gameInstance.spawnSparks(x, y, '#00ffff');
        }
    }

    lineIntersects(a, b, c, d) {
        const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (det === 0) return null; // parallel
        const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
        const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: a.x + t * (b.x - a.x),
                y: a.y + t * (b.y - a.y)
            };
        }
        return null;
    }

    draw(ctx) {
        // 1. Draw Pendulum trail dots (fading pink dots)
        this.trailHistory.forEach(trail => {
            trail.alpha -= 0.03;
            if (trail.alpha > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ff2d78';
                ctx.globalAlpha = trail.alpha;
                ctx.shadowColor = '#ff2d78';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.restore();
            }
        });
        this.trailHistory = this.trailHistory.filter(t => t.alpha > 0);

        // 2. Draw active stick (pink/magenta neon rod)
        ctx.save();
        ctx.shadowColor = '#ff2d78';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ff2d78';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.ax, this.ay);
        ctx.lineTo(this.bx, this.by);
        ctx.stroke();

        // Inner white light core for extra high-fidelity glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.ax, this.ay);
        ctx.lineTo(this.bx, this.by);
        ctx.stroke();
        ctx.restore();
    }
}

// --------------------------------------------------------------------------
// 4. LEVEL PUZZLE COMPILER & SCENARIOS
// --------------------------------------------------------------------------

class GameLevelManager {
    constructor() {
        this.virtualWidth = 600;
        this.virtualHeight = 800;
    }

    getLevel(lvlNum) {
        const holes = [];
        const screws = [];
        const obstacles = [];
        const goals = [];
        let parMoves = 5;
        let gravityDir = 1.0; // 1.0 is standard downward, -1.0 is inverted upward

        if (lvlNum === 1) {
            // === LEVEL 1: TUTORIAL Grapples ===
            parMoves = 4;
            // Static holes spacing matching stick length (L=200)
            holes.push(new BoardHole(0, 150, 300));
            holes.push(new BoardHole(1, 350, 300));
            holes.push(new BoardHole(2, 250, 480));
            holes.push(new BoardHole(3, 450, 480, 'goal')); // Goal End B
            holes.push(new BoardHole(4, 250, 600, 'goal')); // Goal End A

            // Screws at 0 and 1
            screws.push(new Screw(0, 0, 'EndA'));
            screws.push(new Screw(1, 1, 'EndB'));

            // No walls for tutorial

        } else if (lvlNum === 2) {
            // === LEVEL 2: PEN-SWING TIMING ===
            parMoves = 5;
            holes.push(new BoardHole(0, 300, 200));
            holes.push(new BoardHole(1, 300, 400));
            holes.push(new BoardHole(2, 120, 300));
            holes.push(new BoardHole(3, 480, 300));
            holes.push(new BoardHole(4, 120, 500, 'goal'));
            holes.push(new BoardHole(5, 300, 600, 'goal'));

            screws.push(new Screw(0, 0, 'EndA'));
            screws.push(new Screw(1, 1, 'EndB'));

        } else if (lvlNum === 3) {
            // === LEVEL 3: FIREWALL BARRIERS ===
            parMoves = 7;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 250, 420));
            holes.push(new BoardHole(3, 450, 420));
            holes.push(new BoardHole(4, 250, 600, 'goal'));
            holes.push(new BoardHole(5, 450, 600, 'goal'));

            screws.push(new Screw(0, 0, 'EndA'));
            screws.push(new Screw(1, 1, 'EndB'));

            // Cyan Obstacles wall segment placing right in between
            obstacles.push(new ObstacleWall(300, 200, 300, 500));

        } else if (lvlNum === 4) {
            // === LEVEL 4: MOVING SERVER CORE ===
            parMoves = 6;
            holes.push(new BoardHole(0, 200, 200));
            holes.push(new BoardHole(1, 400, 200));
            holes.push(new BoardHole(2, 300, 380, 'moving')); // Shifting hole!
            holes.push(new BoardHole(3, 150, 550, 'goal'));
            holes.push(new BoardHole(4, 350, 550, 'goal'));

            screws.push(new Screw(0, 0, 'EndA'));
            screws.push(new Screw(1, 1, 'EndB'));

            // Divider firewall
            obstacles.push(new ObstacleWall(100, 450, 500, 450));

        } else if (lvlNum === 5) {
            // === LEVEL 5: GRAND GRAVITY REVERSAL ZONE ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 550));
            holes.push(new BoardHole(1, 350, 550));
            holes.push(new BoardHole(2, 250, 380));
            holes.push(new BoardHole(3, 450, 380));
            holes.push(new BoardHole(4, 250, 200, 'goal')); // Goal is at top!
            holes.push(new BoardHole(5, 450, 200, 'goal'));

            screws.push(new Screw(0, 0, 'EndA'));
            screws.push(new Screw(1, 1, 'EndB'));

            // Inverted gravity!
            gravityDir = -1.0; // Gravity pulls UP!

            // Cyber obstacles guarding the goal
            obstacles.push(new ObstacleWall(100, 280, 280, 280));
            obstacles.push(new ObstacleWall(320, 280, 500, 280));
        }

        return {
            holes,
            screws,
            obstacles,
            parMoves,
            gravityDir
        };
    }
}

// --------------------------------------------------------------------------
// 5. MAIN SYSTEM MANAGER & EVENT WIRE-UP
// --------------------------------------------------------------------------

class GameStateCoordinator {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.level = 1;
        this.moves = 0;
        this.clearedCount = parseInt(localStorage.getItem('neonStickClearedCount')) || 0;
        this.gameState = 'START'; // START, PLAYING, SUCCESS, FAIL

        this.holes = [];
        this.screws = [];
        this.obstacles = [];
        this.particles = [];

        this.selectedScrew = null;
        this.activeGravityDir = 1.0;
        this.parMoves = 5;

        // Stick (L = 200)
        this.stick = new NeonStick(200);
        this.lvlManager = new GameLevelManager();

        this.virtualWidth = 600;
        this.virtualHeight = 800;
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.lastTime = 0;
        this.gravityZoneActive = false;

        this.bindEvents();
        this.resizeCanvas();
        this.updateHUD();
    }

    initLevel(lvlNum) {
        this.level = lvlNum;
        this.selectedScrew = null;
        this.particles = [];
        this.holes = [];
        this.screws = [];
        this.obstacles = [];

        const lvlAssets = this.lvlManager.getLevel(lvlNum);
        this.holes = lvlAssets.holes;
        this.screws = lvlAssets.screws;
        this.obstacles = lvlAssets.obstacles;
        this.parMoves = lvlAssets.parMoves;
        this.activeGravityDir = lvlAssets.gravityDir;

        // Reset stick coordinates matching original screws
        const screwA = this.screws.find(s => s.endName === 'EndA');
        const screwB = this.screws.find(s => s.endName === 'EndB');
        const hA = this.holes.find(h => h.id === screwA.holeId);
        const hB = this.holes.find(h => h.id === screwB.holeId);

        if (hA && hB) {
            this.stick.ax = hA.x; this.stick.ay = hA.y;
            this.stick.bx = hB.x; this.stick.by = hB.y;
            this.stick.theta = 0;
            this.stick.omega = 0;
            this.stick.trailHistory = [];
        }

        this.syncScrewsToStick();
        this.updateHUD();
    }

    syncScrewsToStick() {
        const screwA = this.screws.find(s => s.endName === 'EndA');
        const screwB = this.screws.find(s => s.endName === 'EndB');
        if (screwA && screwB) {
            screwA.x = this.stick.ax; screwA.y = this.stick.ay;
            screwB.x = this.stick.bx; screwB.y = this.stick.by;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());

        const touchHandler = (e) => {
            e.preventDefault();
            this.handleInteraction(e);
        };

        const overlay = document.getElementById('interaction-overlay');
        overlay.addEventListener('pointerdown', touchHandler);
        this.canvas.addEventListener('pointerdown', touchHandler);

        document.getElementById('start-play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('hud-reset-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('help-close-btn').addEventListener('click', () => {
            document.getElementById('help-screen').classList.remove('active');
        });
        document.getElementById('hud-help-btn').addEventListener('click', () => {
            document.getElementById('help-screen').classList.add('active');
        });
        document.getElementById('hud-sound-btn').addEventListener('click', () => {
            const muted = synth.toggleMute();
            document.getElementById('hud-sound-btn').textContent = muted ? '🔇' : '🔊';
        });

        // Fail Buttons
        document.getElementById('fail-retry-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('fail-hint-btn').addEventListener('click', () => this.showHint());

        // Success Buttons
        document.getElementById('success-next-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('success-replay-btn').addEventListener('click', () => this.resetLevel());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const scaleX = w / this.virtualWidth;
        const scaleY = h / this.virtualHeight;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = (w - this.virtualWidth * this.scale) / 2;
        this.offsetY = (h - this.virtualHeight * this.scale) / 2;
    }

    startGame() {
        synth.init();
        this.gameState = 'PLAYING';
        this.moves = 0;
        this.initLevel(1);

        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('success-screen').classList.remove('active');
        document.getElementById('fail-screen').classList.remove('active');
        document.querySelector('.hud-header').style.display = 'grid';

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resetLevel() {
        this.moves = 0;
        this.initLevel(this.level);
        document.getElementById('success-screen').classList.remove('active');
        document.getElementById('fail-screen').classList.remove('active');
        if (this.gameState === 'SUCCESS' || this.gameState === 'FAIL') {
            this.gameState = 'PLAYING';
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    nextLevel() {
        if (this.level < 5) {
            this.level++;
            this.moves = 0;
            this.initLevel(this.level);
            document.getElementById('success-screen').classList.remove('active');
            this.gameState = 'PLAYING';
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        } else {
            // Mainframe fully decrypted!
            this.level = 1;
            this.gameState = 'START';
            document.getElementById('success-screen').classList.remove('active');
            document.getElementById('start-screen').classList.add('active');
            document.querySelector('.hud-header').style.display = 'none';
        }
    }

    showHint() {
        if (this.level === 1) {
            alert("Tutorial Hint: Click on Screw B (H1), wait for End B to swing directly onto empty Hole 2, then click Hole 2 to lock it!");
        } else {
            alert("Hint: Swing to build momentum, and snap when passing within 40px of cyan holes!");
        }
    }

    updateHUD() {
        document.getElementById('hud-level-val').textContent = this.level;
        document.getElementById('hud-moves-val').textContent = this.moves;
        document.getElementById('start-cleared-val').textContent = `${this.clearedCount} / 5`;
    }

    handleInteraction(e) {
        if (this.gameState !== 'PLAYING') return;

        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const virtualX = (clientX - this.offsetX) / this.scale;
        const virtualY = (clientY - this.offsetY) / this.scale;

        // Check if there is only exactly 1 screw inserted (pivot state)
        const activePins = this.screws.filter(s => s.holeId !== null);
        const isPivotState = activePins.length === 1;

        // 1. If no screw is selected, check if user clicked an occupied screw bolt
        if (!this.selectedScrew) {
            let tappedScrew = null;
            this.screws.forEach(screw => {
                const dist = Math.hypot(screw.x - virtualX, screw.y - virtualY);
                if (dist <= screw.radius + 12) {
                    tappedScrew = screw;
                }
            });

            if (tappedScrew) {
                // LAST SCREW PROTECTION: If only 1 screw remains, lock it!
                if (isPivotState && tappedScrew.holeId !== null) {
                    synth.playErrorSFX();
                    this.spawnSparks(tappedScrew.x, tappedScrew.y, '#ff4444');
                    return; // locked 🔒
                }

                // Unscrew bolt! It becomes carried on its stick end.
                this.selectedScrew = tappedScrew;
                this.selectedScrew.holeId = null; // detaches from wall!
                this.spawnSparks(tappedScrew.x, tappedScrew.y, '#ffff00');
                synth.playTickSFX();
                this.moves++;
                this.updateHUD();
            }
        } else {
            // 2. If a screw is selected/carried, check if player tapped any empty hole
            let tappedHole = null;
            this.holes.forEach(hole => {
                const dist = Math.hypot(hole.x - virtualX, hole.y - virtualY);
                if (dist <= hole.radius + 15) {
                    tappedHole = hole;
                }
            });

            // Target hole empty check
            const isOccupied = this.screws.some(s => s.holeId === tappedHole?.id);

            if (tappedHole && !isOccupied) {
                // SNAPPING CHECK: Tapped hole must be within 40px radius of active screw end coordinates
                const stickEndCoordinate = this.selectedScrew.endName === 'EndA' ? 
                    { x: this.stick.ax, y: this.stick.ay } : { x: this.stick.bx, y: this.stick.by };

                const snapDist = Math.hypot(tappedHole.x - stickEndCoordinate.x, tappedHole.y - stickEndCoordinate.y);

                if (snapDist <= 40) {
                    // Screw snaps and locks into the new hole!
                    this.selectedScrew.holeId = tappedHole.id;
                    this.selectedScrew = null;
                    this.spawnSparks(tappedHole.x, tappedHole.y, '#39ff14');
                    synth.playClinkSFX();

                    // Check if both ends occupy designated target goal holes to win
                    this.checkVictoryCondition();
                } else {
                    // Out of snapping range, deselect active screw, it remains carried
                    synth.playErrorSFX();
                }
            } else {
                // Clicked out of range, deselect active carried screw
                this.selectedScrew = null;
                synth.playTickSFX();
            }
        }
    }

    checkVictoryCondition() {
        const activePins = this.screws.filter(s => s.holeId !== null);
        if (activePins.length === 2) {
            // Both screws must occupy 'goal' holes to win
            const hA = this.holes.find(h => h.id === this.screws[0].holeId);
            const hB = this.holes.find(h => h.id === this.screws[1].holeId);
            
            if (hA && hB && hA.type === 'goal' && hB.type === 'goal') {
                this.triggerWin();
            }
        }
    }

    spawnSparks(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 110;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 1,
                alpha: 1.0,
                color: color
            });
        }
    }

    gameLoop(time) {
        if (this.gameState !== 'PLAYING') return;

        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        const timestamp = performance.now() * 0.001;

        // Update moving holes
        this.holes.forEach(hole => hole.update(timestamp));

        // Update screws
        this.screws.forEach(s => s.update(dt));

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 2.2 * dt;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Update stick rigid pendulum kinematics
        const stickStatus = this.stick.update(dt, this.screws, this.holes, this.obstacles, this.activeGravityDir);

        if (stickStatus === 'FALLING') {
            this.triggerFail();
        }
    }

    triggerFail() {
        this.gameState = 'FAIL';
        synth.playFallSFX();
        document.getElementById('fail-screen').classList.add('active');
        document.querySelector('.hud-header').style.display = 'none';
    }

    triggerWin() {
        this.gameState = 'SUCCESS';
        this.clearedCount = Math.max(this.clearedCount, this.level);
        localStorage.setItem('neonStickClearedCount', this.clearedCount);

        // Star rating calculation based on par
        let rating = 1;
        if (this.moves <= this.parMoves) rating = 3;
        else if (this.moves <= this.parMoves + 2) rating = 2;

        synth.playSuccessSFX();

        // Render success overlays stars
        document.getElementById('star-1').className = 'star-item' + (rating >= 1 ? ' active-star' : '');
        document.getElementById('star-2').className = 'star-item' + (rating >= 2 ? ' active-star' : '');
        document.getElementById('star-3').className = 'star-item' + (rating >= 3 ? ' active-star' : '');

        document.getElementById('success-level-val').textContent = this.level;
        document.getElementById('success-moves-val').textContent = this.moves;
        document.getElementById('success-screen').classList.add('active');
        document.querySelector('.hud-header').style.display = 'none';
        this.updateHUD();
    }

    draw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Center fit scaling translation
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // 1. Draw structural cyberspace background grid
        this.drawBackgroundGrid();

        // 2. Draw Obstacle Walls (cyan firewalls)
        this.obstacles.forEach(wall => wall.draw(this.ctx));

        // 3. Draw Board Holes
        const activePins = this.screws.filter(s => s.holeId !== null);
        const isPivotState = activePins.length === 1;

        this.holes.forEach(hole => {
            // Hole is snap target if player is holding a screw and it is empty within snap range
            let isSnapTarget = false;
            if (this.selectedScrew) {
                const stickEnd = this.selectedScrew.endName === 'EndA' ?
                    { x: this.stick.ax, y: this.stick.ay } : { x: this.stick.bx, y: this.stick.by };
                const dist = Math.hypot(hole.x - stickEnd.x, hole.y - stickEnd.y);
                const isOccupied = this.screws.some(s => s.holeId === hole.id);
                if (dist <= 40 && !isOccupied) {
                    isSnapTarget = true;
                }
            }
            hole.draw(this.ctx, isSnapTarget);
        });

        // 4. Draw Neon Stick (magenta rod + trails)
        if (this.gameState !== 'FAIL') {
            this.stick.draw(this.ctx);
        }

        // 5. Draw Screws (yellow bolts + locks🔒)
        this.screws.forEach(screw => {
            const isSelected = this.selectedScrew === screw;
            const isLocked = isPivotState && screw.holeId !== null;
            screw.draw(this.ctx, isSelected, isLocked);
        });

        // 6. Draw fading Sparks
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw arrow hint in level 1
        if (this.level === 1 && this.gameState === 'PLAYING' && this.moves === 0 && !this.selectedScrew) {
            this.drawTutorialHint();
        }

        this.ctx.restore();
    }

    drawTutorialHint() {
        const screwB = this.screws.find(s => s.endName === 'EndB');
        if (screwB) {
            this.ctx.save();
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2.5;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(screwB.x, screwB.y, 25, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '13px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText('TAP SCREW TO UNSCREW', screwB.x, screwB.y - 35);
            this.ctx.restore();
        }
    }

    drawBackgroundGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = '#0d1b2e';
        this.ctx.lineWidth = 1.5;

        // Vertical lines
        for (let x = 40; x < this.virtualWidth; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 40);
            this.ctx.lineTo(x, this.virtualHeight - 40);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 40; y < this.virtualHeight; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(40, y);
            this.ctx.lineTo(this.virtualWidth - 40, y);
            this.ctx.stroke();
        }

        // Cyber zone limits
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(80, 100);
        this.ctx.lineTo(520, 100);
        this.ctx.lineTo(520, 700);
        this.ctx.lineTo(80, 700);
        this.ctx.closePath();
        this.ctx.stroke();

        // Inverted Gravity zone markers for Level 5
        if (this.level === 5) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
            this.ctx.fillRect(80, 100, 440, 600);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '14px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText('▲ INVERTED GRAVITY FIELD ▲', 300, 140);
        }

        this.ctx.restore();
    }
}

// Global instantiation hook
let gameInstance = null;
function initGame() {
    if (!gameInstance) {
        gameInstance = new GameStateCoordinator();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('show-info-overlay')) {
        initGame();
    }
});
