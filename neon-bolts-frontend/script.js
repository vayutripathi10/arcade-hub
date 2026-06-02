/* ==========================================================================
   NEON STICK & SCREWS - COMPACT RIGID PUZZLE ENGINE
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

        // Error buzz
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
        this.type = type; // 'normal', 'moving'
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

        if (isSelectedEmpty) {
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
    constructor(id, holeId) {
        this.id = id;
        this.holeId = holeId; // ID of BoardHole occupied, or null if selected
        this.x = 0;
        this.y = 0;
        this.radius = 16;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += 5 * dt;
    }

    draw(ctx, isSelected, holes) {
        ctx.save();
        let baseColor = '#ffff00'; // Yellow neon
        let shadowGlow = 8;

        if (isSelected) {
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
    constructor(length, pinA, pinB) {
        this.length = length;
        
        // Initial pin indices (indices in gameInstance.holes)
        this.pinA = pinA;
        this.pinB = pinB;

        // Coordinates of stick ends
        this.ax = 0;
        this.ay = 0;
        this.bx = 0;
        this.by = 0;

        this.theta = 0; // current angle when pivoting
        this.omega = 0; // angular velocity

        this.gravity = 980;
        this.damping = 0.994;

        this.trailHistory = [];
        this.prevWhooshTime = 0;

        this.vy = 0; // vertical velocity when falling
        this.fallRotation = 0;
        this.fallen = false;
    }

    update(dt, screws, holes, obstacles, gravityDir = 1.0) {
        if (this.fallen) return 'FALLEN';

        // 1. Check if pins still have screws in them
        if (this.pinA !== null) {
            const hasScrew = screws.some(s => s.holeId === this.pinA);
            if (!hasScrew) this.pinA = null;
        }
        if (this.pinB !== null) {
            const hasScrew = screws.some(s => s.holeId === this.pinB);
            if (!hasScrew) this.pinB = null;
        }

        // 2. LOCKED STATE (both ends pinned)
        if (this.pinA !== null && this.pinB !== null) {
            const hA = holes.find(h => h.id === this.pinA);
            const hB = holes.find(h => h.id === this.pinB);
            if (hA && hB) {
                this.ax = hA.x; this.ay = hA.y;
                this.bx = hB.x; this.by = hB.y;
            }
            this.omega = 0;
            this.trailHistory = [];
            this.vy = 0;
            return 'LOCKED';
        }

        // 3. PIVOT A STATE (only End A pinned)
        if (this.pinA !== null && this.pinB === null) {
            const pivotHole = holes.find(h => h.id === this.pinA);
            if (pivotHole) {
                const px = pivotHole.x;
                const py = pivotHole.y;
                this.ax = px; this.ay = py;

                // Sync angle from End B coordinates
                const dx = this.bx - px;
                const dy = this.by - py;
                const curTheta = Math.atan2(dx, dy * gravityDir);
                this.theta = curTheta;

                // Pendulum Torque equation: alpha = (-gravity / L) * sin(theta)
                const alpha = (-(this.gravity * gravityDir) / this.length) * Math.sin(this.theta) * gravityDir;

                const prevTheta = this.theta;
                this.omega += alpha * dt;
                this.omega *= this.damping;
                this.theta += this.omega * dt;

                if (this.theta > Math.PI * 2) this.theta -= Math.PI * 2;
                if (this.theta < -Math.PI * 2) this.theta += Math.PI * 2;

                const swingX = px + Math.sin(this.theta) * this.length;
                const swingY = py + Math.cos(this.theta) * this.length * gravityDir;

                // Obstacle wall collision detection
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
                    this.theta = prevTheta; // roll back
                    this.omega = -this.omega * 0.45;
                    synth.playBounceSFX();
                    if (colPoint) this.spawnSparks(colPoint.x, colPoint.y, '#00ffff');
                } else {
                    this.bx = swingX; this.by = swingY;
                }

                // Snap check to occupied holes
                for (let hole of holes) {
                    if (hole.id === this.pinA) continue;
                    const hasScrew = screws.some(s => s.holeId === hole.id);
                    if (hasScrew) {
                        const dist = Math.hypot(hole.x - this.bx, hole.y - this.by);
                        if (dist < 30) {
                            this.pinB = hole.id;
                            this.bx = hole.x; this.by = hole.y;
                            this.omega = 0;
                            synth.playClinkSFX();
                            this.spawnSparks(hole.x, hole.y, '#39ff14');
                            break;
                        }
                    }
                }

                const nowTime = performance.now();
                if (nowTime - this.prevWhooshTime > 300 && Math.abs(this.omega) > 1.2) {
                    synth.playWhooshSFX(this.omega);
                    this.prevWhooshTime = nowTime;
                }

                this.trailHistory.push({ x: this.bx, y: this.by, alpha: 1.0 });
                if (this.trailHistory.length > 25) this.trailHistory.shift();

                return 'PIVOT_A';
            }
        }

        // 4. PIVOT B STATE (only End B pinned)
        if (this.pinB !== null && this.pinA === null) {
            const pivotHole = holes.find(h => h.id === this.pinB);
            if (pivotHole) {
                const px = pivotHole.x;
                const py = pivotHole.y;
                this.bx = px; this.by = py;

                // Sync angle from End A coordinates
                const dx = this.ax - px;
                const dy = this.ay - py;
                const curTheta = Math.atan2(dx, dy * gravityDir);
                this.theta = curTheta;

                const alpha = (-(this.gravity * gravityDir) / this.length) * Math.sin(this.theta) * gravityDir;

                const prevTheta = this.theta;
                this.omega += alpha * dt;
                this.omega *= this.damping;
                this.theta += this.omega * dt;

                if (this.theta > Math.PI * 2) this.theta -= Math.PI * 2;
                if (this.theta < -Math.PI * 2) this.theta += Math.PI * 2;

                const swingX = px + Math.sin(this.theta) * this.length;
                const swingY = py + Math.cos(this.theta) * this.length * gravityDir;

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
                    this.theta = prevTheta;
                    this.omega = -this.omega * 0.45;
                    synth.playBounceSFX();
                    if (colPoint) this.spawnSparks(colPoint.x, colPoint.y, '#00ffff');
                } else {
                    this.ax = swingX; this.ay = swingY;
                }

                // Snap check to occupied holes
                for (let hole of holes) {
                    if (hole.id === this.pinB) continue;
                    const hasScrew = screws.some(s => s.holeId === hole.id);
                    if (hasScrew) {
                        const dist = Math.hypot(hole.x - this.ax, hole.y - this.ay);
                        if (dist < 30) {
                            this.pinA = hole.id;
                            this.ax = hole.x; this.ay = hole.y;
                            this.omega = 0;
                            synth.playClinkSFX();
                            this.spawnSparks(hole.x, hole.y, '#39ff14');
                            break;
                        }
                    }
                }

                const nowTime = performance.now();
                if (nowTime - this.prevWhooshTime > 300 && Math.abs(this.omega) > 1.2) {
                    synth.playWhooshSFX(this.omega);
                    this.prevWhooshTime = nowTime;
                }

                this.trailHistory.push({ x: this.ax, y: this.ay, alpha: 1.0 });
                if (this.trailHistory.length > 25) this.trailHistory.shift();

                return 'PIVOT_B';
            }
        }

        // 5. FALLING STATE (zero pins)
        this.trailHistory = [];
        this.vy += 980 * dt * gravityDir;
        this.ay += this.vy * dt;
        this.by += this.vy * dt;

        // Apply a slow rotation drift
        this.fallRotation += 1.5 * dt;
        const halfL = this.length / 2;
        const cx = (this.ax + this.bx) / 2;
        const cy = (this.ay + this.by) / 2;
        this.ax = cx - Math.cos(this.fallRotation) * halfL;
        this.ay = cy - Math.sin(this.fallRotation) * halfL;
        this.bx = cx + Math.cos(this.fallRotation) * halfL;
        this.by = cy + Math.sin(this.fallRotation) * halfL;

        // Check if fully off screen
        if (gravityDir === 1.0) {
            if (this.ay > 900 && this.by > 900) {
                this.fallen = true;
            }
        } else {
            if (this.ay < -100 && this.by < -100) {
                this.fallen = true;
            }
        }

        return 'FALLING';
    }

    spawnSparks(x, y, color) {
        if (window.gameInstance) {
            window.gameInstance.spawnSparks(x, y, color);
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
        // Draw pendulum trails
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

        // Draw magenta neon rod
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
        const sticks = [];
        let parMoves = 5;
        let gravityDir = 1.0;

        if (lvlNum === 1) {
            // === Level 1: Tutorial Core ===
            parMoves = 4;
            holes.push(new BoardHole(0, 200, 300));
            holes.push(new BoardHole(1, 400, 300));
            holes.push(new BoardHole(2, 300, 480));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

        } else if (lvlNum === 2) {
            // === Level 2: The Double Chain ===
            parMoves = 6;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 250, 450));
            holes.push(new BoardHole(3, 450, 450));
            holes.push(new BoardHole(4, 300, 600));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 3) {
            // === Level 3: Firewall Deflector ===
            parMoves = 5;
            holes.push(new BoardHole(0, 150, 300));
            holes.push(new BoardHole(1, 350, 300));
            holes.push(new BoardHole(2, 250, 480));
            holes.push(new BoardHole(3, 450, 480));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

            obstacles.push(new ObstacleWall(300, 200, 300, 500));

        } else if (lvlNum === 4) {
            // === Level 4: Moving Core Grid ===
            parMoves = 6;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 250, 420));
            holes.push(new BoardHole(3, 450, 420));
            holes.push(new BoardHole(4, 300, 580, 'moving')); // Shifting hole!

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 5) {
            // === Level 5: Inverted Gravity Core ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 550));
            holes.push(new BoardHole(1, 350, 550));
            holes.push(new BoardHole(2, 250, 380));
            holes.push(new BoardHole(3, 450, 380));
            holes.push(new BoardHole(4, 300, 200));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

            gravityDir = -1.0; // upwards gravity!

        } else if (lvlNum === 6) {
            // === Level 6: The Ladder Grid (Intersecting Chains) ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 150, 450));
            holes.push(new BoardHole(3, 350, 450));
            holes.push(new BoardHole(4, 250, 600));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 7) {
            // === Level 7: Pendulum Wave (Different lengths) ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 200));
            holes.push(new BoardHole(1, 270, 200));
            holes.push(new BoardHole(2, 420, 200));
            holes.push(new BoardHole(3, 150, 360));
            holes.push(new BoardHole(4, 270, 320));
            holes.push(new BoardHole(5, 420, 320));
            holes.push(new BoardHole(6, 300, 500));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));
            screws.push(new Screw(4, 4));
            screws.push(new Screw(5, 5));

            sticks.push(new NeonStick(160, 0, 3));
            sticks.push(new NeonStick(120, 1, 4));
            sticks.push(new NeonStick(120, 2, 5));

        } else if (lvlNum === 8) {
            // === Level 8: Laser Gate Escaper ===
            parMoves = 5;
            holes.push(new BoardHole(0, 160, 250));
            holes.push(new BoardHole(1, 440, 250));
            holes.push(new BoardHole(2, 300, 450));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(280, 0, 1));

            obstacles.push(new ObstacleWall(200, 300, 200, 500));
            obstacles.push(new ObstacleWall(400, 300, 400, 500));

        } else if (lvlNum === 9) {
            // === Level 9: Double Shifter Mainboard ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 150, 420, 'moving'));
            holes.push(new BoardHole(3, 350, 420, 'moving'));
            holes.push(new BoardHole(4, 300, 580));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 10) {
            // === Level 10: Inverted Ladder Matrix ===
            parMoves = 9;
            holes.push(new BoardHole(0, 150, 550));
            holes.push(new BoardHole(1, 350, 550));
            holes.push(new BoardHole(2, 150, 350));
            holes.push(new BoardHole(3, 350, 350));
            holes.push(new BoardHole(4, 250, 200));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));
            sticks.push(new NeonStick(200, 2, 3));

            gravityDir = -1.0; // upward gravity!

        } else if (lvlNum === 11) {
            // === Level 11: Diagonal X-Pattern ===
            parMoves = 6;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 150, 450));
            holes.push(new BoardHole(3, 350, 450));
            holes.push(new BoardHole(4, 250, 350));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            // Perfectly matching cross diagonal distances (len=282 diagonally)
            sticks.push(new NeonStick(282, 0, 3));
            sticks.push(new NeonStick(282, 1, 2));

        } else if (lvlNum === 12) {
            // === Level 12: Cascade Grid Core ===
            parMoves = 8;
            holes.push(new BoardHole(0, 200, 200));
            holes.push(new BoardHole(1, 400, 200));
            holes.push(new BoardHole(2, 200, 400));
            holes.push(new BoardHole(3, 400, 400));
            holes.push(new BoardHole(4, 300, 550));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));

        } else if (lvlNum === 13) {
            // === Level 13: Triangle Roof Spire ===
            parMoves = 5;
            holes.push(new BoardHole(0, 300, 200));
            holes.push(new BoardHole(1, 180, 360));
            holes.push(new BoardHole(2, 420, 360));
            holes.push(new BoardHole(3, 300, 500));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 0, 2));

        } else if (lvlNum === 14) {
            // === Level 14: Deflection Defiles ===
            parMoves = 5;
            holes.push(new BoardHole(0, 200, 200));
            holes.push(new BoardHole(1, 400, 200));
            holes.push(new BoardHole(2, 300, 400));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

            obstacles.push(new ObstacleWall(150, 300, 450, 300));

        } else if (lvlNum === 15) {
            // === Level 15: Grav-Pivot Lift ===
            parMoves = 6;
            holes.push(new BoardHole(0, 150, 450));
            holes.push(new BoardHole(1, 350, 450));
            holes.push(new BoardHole(2, 250, 250));
            holes.push(new BoardHole(3, 450, 250));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

            gravityDir = -1.0; // Inverted gravity!

        } else if (lvlNum === 16) {
            // === Level 16: The Shield ring ===
            parMoves = 10;
            holes.push(new BoardHole(0, 150, 300));
            holes.push(new BoardHole(1, 350, 300));
            holes.push(new BoardHole(2, 150, 460));
            holes.push(new BoardHole(3, 350, 460));
            holes.push(new BoardHole(4, 250, 580));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));
            sticks.push(new NeonStick(160, 0, 2));
            sticks.push(new NeonStick(160, 1, 3));

        } else if (lvlNum === 17) {
            // === Level 17: Diagonal firewall Cross ===
            parMoves = 5;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 250, 450));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

            obstacles.push(new ObstacleWall(200, 320, 400, 320));

        } else if (lvlNum === 18) {
            // === Level 18: Shifting grid conveyor ===
            parMoves = 7;
            holes.push(new BoardHole(0, 200, 200));
            holes.push(new BoardHole(1, 400, 200));
            holes.push(new BoardHole(2, 300, 380, 'moving'));
            holes.push(new BoardHole(3, 300, 540));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));

            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 2));

        } else if (lvlNum === 19) {
            // === Level 19: Zig-Zag Core ===
            parMoves = 7;
            holes.push(new BoardHole(0, 150, 200));
            holes.push(new BoardHole(1, 350, 200));
            holes.push(new BoardHole(2, 250, 360));
            holes.push(new BoardHole(3, 450, 360));
            holes.push(new BoardHole(4, 350, 520));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 20) {
            // === Level 20: Triple Inverted Core ===
            parMoves = 10;
            holes.push(new BoardHole(0, 150, 600));
            holes.push(new BoardHole(1, 350, 600));
            holes.push(new BoardHole(2, 150, 400));
            holes.push(new BoardHole(3, 350, 400));
            holes.push(new BoardHole(4, 250, 200));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));
            sticks.push(new NeonStick(200, 2, 3));

            gravityDir = -1.0; // upwards gravity!

        } else if (lvlNum === 21) {
            // === Level 21: Diamond Mainframe ===
            parMoves = 12;
            holes.push(new BoardHole(0, 300, 200));
            holes.push(new BoardHole(1, 180, 360));
            holes.push(new BoardHole(2, 420, 360));
            holes.push(new BoardHole(3, 300, 520));
            holes.push(new BoardHole(4, 300, 680));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 22) {
            // === Level 22: Pinball obstacles ===
            parMoves = 5;
            holes.push(new BoardHole(0, 200, 250));
            holes.push(new BoardHole(1, 400, 250));
            holes.push(new BoardHole(2, 300, 450));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));

            sticks.push(new NeonStick(200, 0, 1));

            obstacles.push(new ObstacleWall(100, 350, 250, 350));
            obstacles.push(new ObstacleWall(350, 350, 500, 350));

        } else if (lvlNum === 23) {
            // === Level 23: The Gatekeeper ===
            parMoves = 12;
            holes.push(new BoardHole(0, 200, 200));
            holes.push(new BoardHole(1, 400, 200));
            holes.push(new BoardHole(2, 200, 400));
            holes.push(new BoardHole(3, 400, 400));
            holes.push(new BoardHole(4, 300, 550));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 0, 2));
            sticks.push(new NeonStick(200, 1, 3));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 24) {
            // === Level 24: Conveyor Shifter grid ===
            parMoves = 8;
            holes.push(new BoardHole(0, 150, 250, 'moving'));
            holes.push(new BoardHole(1, 350, 250, 'moving'));
            holes.push(new BoardHole(2, 250, 420));
            holes.push(new BoardHole(3, 450, 420));
            holes.push(new BoardHole(4, 300, 580));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));

        } else if (lvlNum === 25) {
            // === Level 25: Hacker Grandmaster Matrix ===
            parMoves = 15;
            holes.push(new BoardHole(0, 150, 250));
            holes.push(new BoardHole(1, 350, 250));
            holes.push(new BoardHole(2, 150, 450));
            holes.push(new BoardHole(3, 350, 450));
            holes.push(new BoardHole(4, 250, 600, 'moving'));
            holes.push(new BoardHole(5, 450, 600));
            holes.push(new BoardHole(6, 300, 750));

            screws.push(new Screw(0, 0));
            screws.push(new Screw(1, 1));
            screws.push(new Screw(2, 2));
            screws.push(new Screw(3, 3));
            screws.push(new Screw(4, 4));
            screws.push(new Screw(5, 5));

            sticks.push(new NeonStick(200, 0, 1));
            sticks.push(new NeonStick(200, 2, 3));
            sticks.push(new NeonStick(200, 4, 5));

            obstacles.push(new ObstacleWall(100, 350, 500, 350));
            obstacles.push(new ObstacleWall(100, 520, 500, 520));
        }

        return {
            holes,
            screws,
            obstacles,
            sticks,
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
        this.sticks = [];
        this.particles = [];

        this.selectedScrew = null;
        this.originalHoleId = null; // for cancels

        this.activeGravityDir = 1.0;
        this.parMoves = 5;

        this.lvlManager = new GameLevelManager();

        this.virtualWidth = 600;
        this.virtualHeight = 800;
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.lastTime = 0;
        
        // Track pointer for carrying selected screws
        this.pointerX = 300;
        this.pointerY = 400;

        this.bindEvents();
        this.resizeCanvas();
        this.updateHUD();
    }

    initLevel(lvlNum) {
        this.level = lvlNum;
        this.selectedScrew = null;
        this.originalHoleId = null;
        this.particles = [];
        this.holes = [];
        this.screws = [];
        this.obstacles = [];
        this.sticks = [];

        // Core fix: make sure the HUD header is displayed!
        const hudHeader = document.querySelector('.hud-header');
        if (hudHeader) {
            hudHeader.style.display = 'grid';
        }

        const lvlAssets = this.lvlManager.getLevel(lvlNum);
        this.holes = lvlAssets.holes;
        this.screws = lvlAssets.screws;
        this.obstacles = lvlAssets.obstacles;
        this.sticks = lvlAssets.sticks;
        this.parMoves = lvlAssets.parMoves;
        this.activeGravityDir = lvlAssets.gravityDir;

        // Initialize stick ends coordinate based on initial pins
        this.sticks.forEach(stick => {
            const hA = this.holes.find(h => h.id === stick.pinA);
            const hB = this.holes.find(h => h.id === stick.pinB);
            if (hA && hB) {
                stick.ax = hA.x; stick.ay = hA.y;
                stick.bx = hB.x; stick.by = hB.y;
                stick.omega = 0;
                stick.vy = 0;
                stick.fallRotation = 0;
                stick.trailHistory = [];
                stick.fallen = false;
            }
        });

        this.syncScrewsToHoles();
        this.updateHUD();
    }

    syncScrewsToHoles() {
        this.screws.forEach(screw => {
            if (screw.holeId !== null) {
                const hole = this.holes.find(h => h.id === screw.holeId);
                if (hole) {
                    screw.x = hole.x;
                    screw.y = hole.y;
                }
            }
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());

        const getCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;
            this.pointerX = (clientX - this.offsetX) / this.scale;
            this.pointerY = (clientY - this.offsetY) / this.scale;
        };

        const handleDown = (e) => {
            e.preventDefault();
            getCoords(e);
            this.handleInteraction();
        };

        const handleMove = (e) => {
            e.preventDefault();
            getCoords(e);
        };

        const overlay = document.getElementById('interaction-overlay');
        overlay.addEventListener('pointerdown', handleDown);
        overlay.addEventListener('pointermove', handleMove);

        this.canvas.addEventListener('pointerdown', handleDown);
        this.canvas.addEventListener('pointermove', handleMove);

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

        // Share Buttons
        document.getElementById('share-twitter-btn').addEventListener('click', () => this.shareStatus('twitter'));
        document.getElementById('share-reddit-btn').addEventListener('click', () => this.shareStatus('reddit'));
        document.getElementById('share-facebook-btn').addEventListener('click', () => this.shareStatus('facebook'));
        document.getElementById('share-copy-btn').addEventListener('click', () => this.shareStatus('copy'));
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
        if (this.level < 25) {
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

    shareStatus(platform) {
        let url = 'https://arcadehubplay.com/play-neon-bolts.html';
        try {
            if (window.top && window.top.location) {
                url = window.top.location.href;
            }
        } catch (e) {
            url = document.referrer || window.location.href;
        }

        const text = `I just decrypted Core Mainframe Stage ${this.level} in Neon Screws & Bolts in ${this.moves} moves! Can you beat my score? 🔩🎮`;

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'reddit':
                window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(`${text} Play here: ${url}`).then(() => {
                    const btn = document.getElementById('share-copy-btn');
                    const origText = btn.innerHTML;
                    btn.innerHTML = '✅ Copied!';
                    setTimeout(() => {
                        btn.innerHTML = origText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
                break;
        }
    }

    showHint() {
        if (this.level === 1) {
            alert("Tutorial Hint: Click on Screw B (H1), wait for End B to swing, then click Hole 2 to lock it!");
        } else {
            alert("Hint: Unscrew pivots and move them to allow the sticks to fall down completely!");
        }
    }

    updateHUD() {
        document.getElementById('hud-level-val').textContent = this.level;
        document.getElementById('hud-moves-val').textContent = this.moves;
        document.getElementById('start-cleared-val').textContent = `${this.clearedCount} / 25`;
    }

    handleInteraction() {
        if (this.gameState !== 'PLAYING') return;

        // 1. If no screw is selected, check if user tapped a screw
        if (!this.selectedScrew) {
            let tappedScrew = null;
            this.screws.forEach(screw => {
                const dist = Math.hypot(screw.x - this.pointerX, screw.y - this.pointerY);
                if (dist <= screw.radius + 15) {
                    tappedScrew = screw;
                }
            });

            if (tappedScrew) {
                // Unscrew bolt! It is now held in pointer/hand.
                this.selectedScrew = tappedScrew;
                this.originalHoleId = tappedScrew.holeId;
                tappedScrew.holeId = null;
                this.spawnSparks(tappedScrew.x, tappedScrew.y, '#ffff00');
                synth.playTickSFX();
                this.moves++;
                this.updateHUD();
            }
        } else {
            // 2. If a screw is selected, check if player tapped an empty hole to place it
            let tappedHole = null;
            this.holes.forEach(hole => {
                const dist = Math.hypot(hole.x - this.pointerX, hole.y - this.pointerY);
                if (dist <= hole.radius + 15) {
                    tappedHole = hole;
                }
            });

            const isOccupied = this.screws.some(s => s.holeId === tappedHole?.id);

            if (tappedHole && !isOccupied) {
                // Screw is successfully inserted in the new empty hole
                this.selectedScrew.holeId = tappedHole.id;
                this.selectedScrew = null;
                this.originalHoleId = null;
                this.spawnSparks(tappedHole.x, tappedHole.y, '#39ff14');
                synth.playClinkSFX();
            } else {
                // Tapped empty space or occupied hole, return the screw to original position
                this.selectedScrew.holeId = this.originalHoleId;
                this.selectedScrew = null;
                this.originalHoleId = null;
                synth.playErrorSFX();
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

        // Sync static/moving holes coordinates to screws
        this.syncScrewsToHoles();

        // If a screw is selected, make it follow the pointer
        if (this.selectedScrew) {
            this.selectedScrew.x = this.pointerX;
            this.selectedScrew.y = this.pointerY;
        }

        // Update screws
        this.screws.forEach(s => s.update(dt));

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 2.2 * dt;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Update all sticks
        this.sticks.forEach(stick => {
            stick.update(dt, this.screws, this.holes, this.obstacles, this.activeGravityDir);
        });

        // Win check: All sticks fallen off the screen
        const allFallen = this.sticks.length > 0 && this.sticks.every(s => s.fallen);
        if (allFallen) {
            this.triggerWin();
        }
    }

    triggerWin() {
        this.gameState = 'SUCCESS';
        this.clearedCount = Math.max(this.clearedCount, this.level);
        localStorage.setItem('neonStickClearedCount', this.clearedCount);

        let rating = 1;
        if (this.moves <= this.parMoves) rating = 3;
        else if (this.moves <= this.parMoves + 2) rating = 2;

        synth.playSuccessSFX();

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
        this.holes.forEach(hole => {
            let isSnapTarget = false;
            if (this.selectedScrew) {
                // If a screw is selected, empty holes become snap targets
                const isOccupied = this.screws.some(s => s.holeId === hole.id);
                if (!isOccupied) {
                    isSnapTarget = true;
                }
            }
            hole.draw(this.ctx, isSnapTarget);
        });

        // 4. Draw Neon Sticks (magenta rods + trails)
        this.sticks.forEach(stick => {
            if (!stick.fallen) {
                stick.draw(this.ctx);
            }
        });

        // 5. Draw Screws
        this.screws.forEach(screw => {
            const isSelected = this.selectedScrew === screw;
            screw.draw(this.ctx, isSelected, this.holes);
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
        const screwB = this.screws.find(s => s.id === 1);
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

        // Inverted Gravity zone markers for stages with negative gravity direction
        if (this.activeGravityDir === -1.0) {
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
