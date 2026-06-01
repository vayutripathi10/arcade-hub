/* ==========================================================================
   NEON SCREWS & BOLTS - CORE GAME ENGINE
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
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Short metallic click / screw turn
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    playClinkSFX() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High metallic chime on screw insertion
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(580, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
    }

    playFallSFX() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Descending slide when a plate drops off
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
    }

    playSuccessSFX() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
        });
    }
}

const synth = new AudioSynthManager();

// --------------------------------------------------------------------------
// 2. PHYSICS PUZZLE ENGINE CLASSES
// --------------------------------------------------------------------------

class BoardHole {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 16;
    }

    draw(ctx, isSelectedEmpty) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (isSelectedEmpty) {
            // Empty and selectable
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.fillStyle = 'rgba(0, 255, 255, 0.08)';
            ctx.fill();
        } else {
            // Normal empty hole
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
    }
}

class Screw {
    constructor(id, holeId) {
        this.id = id;
        this.holeId = holeId;
        this.x = 0; // updated in sync
        this.y = 0;
        this.radius = 18;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += 5 * dt;
    }

    draw(ctx, isSelected) {
        ctx.save();
        const baseColor = '#ffff00'; // Neon Yellow
        
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isSelected ? 15 + Math.sin(this.pulse) * 4 : 8;
        ctx.fillStyle = isSelected ? '#ffffff' : baseColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        // Draw bolt outer ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw screw thread detail
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cross pattern in middle
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 5);
        ctx.lineTo(this.x + 5, this.y + 5);
        ctx.moveTo(this.x + 5, this.y - 5);
        ctx.lineTo(this.x - 5, this.y + 5);
        ctx.stroke();

        ctx.restore();
    }
}

class NeonPlate {
    constructor(id, width, height, type, holeBindings, color, startX, startY) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.type = type; // 'rectangle' or 'circle'
        this.holeBindings = holeBindings; // list of initial relative attachments: [{ dx, dy, holeId }]
        this.color = color; // e.g. '#ff2d78' (pink), '#00ffff' (cyan)
        
        this.x = startX;
        this.y = startY;
        this.theta = 0; // rotation angle
        
        this.vx = 0;
        this.vy = 0;
        this.omega = 0; // angular velocity
        
        this.fallen = false;
        this.mass = 1.0;
        this.gravity = 950;
        this.damping = 0.988; // pivot friction
    }

    update(dt, holes, screws) {
        if (this.fallen) return;

        // 1. Determine active screws pinning this plate
        let activePins = [];
        this.holeBindings.forEach(binding => {
            // Find if there is a screw placed at this hole
            const matchingScrew = screws.find(s => s.holeId === binding.holeId);
            if (matchingScrew) {
                // Determine board hole coordinate
                const matchingHole = holes.find(h => h.id === binding.holeId);
                if (matchingHole) {
                    activePins.push({
                        holeId: binding.holeId,
                        relX: binding.dx,
                        relY: binding.dy,
                        px: matchingHole.x,
                        py: matchingHole.y
                    });
                }
            }
        });

        // 2. Resolve kinematics based on pin counts
        if (activePins.length >= 2) {
            // LOCKED STATE: Plate is completely rigid.
            // Center of mass y and rotation are fixed.
            this.vx = 0;
            this.vy = 0;
            this.omega = 0;

            // Recalculate original/centroid position to prevent rounding drifts
            let sumX = 0, sumY = 0, sumRelX = 0, sumRelY = 0;
            activePins.forEach(pin => {
                sumX += pin.px;
                sumY += pin.py;
                sumRelX += pin.relX;
                sumRelY += pin.relY;
            });
            this.x = sumX / activePins.length - (sumRelX / activePins.length);
            this.y = sumY / activePins.length - (sumRelY / activePins.length);
            this.theta = 0; // locked alignment

        } else if (activePins.length === 1) {
            // PIVOT STATE: Rotating around a single pin coordinate
            const pin = activePins[0];
            
            // Calculate distance from pivot to center of mass
            const r = Math.sqrt(pin.relX * pin.relX + pin.relY * pin.relY);

            if (r > 1) {
                // Pivot dynamics: Torque = I * alpha
                // Restore swing torque pull towards center of gravity (moves downwards)
                const rxWorld = this.x - pin.px;
                const alpha = (this.gravity * rxWorld) / (r * r);

                // Integrate
                this.omega += alpha * dt;
                this.omega *= this.damping;
                this.theta += this.omega * dt;

                // Restrict extreme angles just to keep canvas readable
                if (this.theta > Math.PI * 2) this.theta -= Math.PI * 2;
                if (this.theta < -Math.PI * 2) this.theta += Math.PI * 2;

                // Sync CM position based on new rotation angle around the pivot
                const cosT = Math.cos(this.theta);
                const sinT = Math.sin(this.theta);
                const rotDx = pin.relX * cosT - pin.relY * sinT;
                const rotDy = pin.relX * sinT + pin.relY * cosT;
                
                this.x = pin.px - rotDx;
                this.y = pin.py - rotDy;
            } else {
                // If pivot is directly at the center of mass, no pendulum swing
                this.x = pin.px;
                this.y = pin.py;
                this.omega = 0;
            }
            this.vx = 0;
            this.vy = 0;

        } else {
            // FREE FALL STATE: Gravity drop
            if (this.vy === 0) {
                // Play falling SFX once
                synth.playFallSFX();
            }

            this.vy += this.gravity * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Simple falling rotation
            this.theta += 1.5 * dt;

            // Mark as fallen once fully off-screen
            if (this.y - this.height > 850) {
                this.fallen = true;
            }
        }
    }

    draw(ctx) {
        if (this.fallen) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.theta);

        // Styling: Translucent glowing glassmorphism plate
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.fillStyle = `rgba(${this.hexToRgb(this.color)}, 0.16)`;

        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner circle detail
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Rounded Rectangle
            this.roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 12);
            ctx.fill();
            ctx.stroke();

            // Structure lines to look premium/engineered
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 10, 0);
            ctx.lineTo(this.width / 2 - 10, 0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
            : '0, 255, 255';
    }
}

// --------------------------------------------------------------------------
// 3. MAIN GAME CORE STATE MACHINE
// --------------------------------------------------------------------------

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.level = 1;
        this.moves = 0;
        this.clearedCount = 0;
        this.gameState = 'START'; // START, PLAYING, SUCCESS

        this.holes = [];
        this.screws = [];
        this.plates = [];
        this.particles = [];

        this.selectedScrew = null;

        this.lastTime = 0;
        this.virtualWidth = 600;
        this.virtualHeight = 800;
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

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
        this.plates = [];

        const centerX = 300;
        const centerY = 400;

        if (lvlNum === 1) {
            // === LEVEL 1: TUTORIAL CORES ===
            // H0: (200, 320)
            // H1: (400, 320)
            // H2: (300, 480) (Empty)
            this.holes.push(new BoardHole(0, 200, 320));
            this.holes.push(new BoardHole(1, 400, 320));
            this.holes.push(new BoardHole(2, 300, 480));

            // Screws at 0 and 1
            this.screws.push(new Screw(0, 0));
            this.screws.push(new Screw(1, 1));

            // 1 Long Horizontal Plate holding by H0 and H1
            // CM: (300, 320)
            // Att0: relative (-100, 0) maps to H0
            // Att1: relative (100, 0) maps to H1
            this.plates.push(new NeonPlate(
                0, 280, 40, 'rectangle',
                [
                    { dx: -100, dy: 0, holeId: 0 },
                    { dx: 100, dy: 0, holeId: 1 }
                ],
                '#00ffff', // cyan
                300, 320
            ));

        } else if (lvlNum === 2) {
            // === LEVEL 2: PIVOT GRAVITY SWING ===
            // 3 Holes arranged vertically + 1 empty to the side
            // H0: (300, 220)
            // H1: (300, 380)
            // H2: (300, 540)
            // H3: (420, 380) (Empty)
            this.holes.push(new BoardHole(0, 300, 220));
            this.holes.push(new BoardHole(1, 300, 380));
            this.holes.push(new BoardHole(2, 300, 540));
            this.holes.push(new BoardHole(3, 420, 380));

            // Screws initially at H0 and H1
            this.screws.push(new Screw(0, 0));
            this.screws.push(new Screw(1, 1));

            // Long bar pinned vertically by H0 and H1
            this.plates.push(new NeonPlate(
                0, 40, 240, 'rectangle',
                [
                    { dx: 0, dy: -80, holeId: 0 },
                    { dx: 0, dy: 80, holeId: 1 }
                ],
                '#ff2d78', // pink
                300, 300
            ));

        } else if (lvlNum === 3) {
            // === LEVEL 3: OVERLAPPING SHIELDS ===
            // H0: (200, 250), H1: (400, 250)
            // H2: (300, 400), H3: (300, 550) (Empty)
            this.holes.push(new BoardHole(0, 200, 250));
            this.holes.push(new BoardHole(1, 400, 250));
            this.holes.push(new BoardHole(2, 300, 400));
            this.holes.push(new BoardHole(3, 300, 550));

            // Screws at 0, 1, 2. Hole 3 is empty
            this.screws.push(new Screw(0, 0));
            this.screws.push(new Screw(1, 1));
            this.screws.push(new Screw(2, 2));

            // Plate 0 (Top Layer, Pink): Pinned by H0 and H2
            this.plates.push(new NeonPlate(
                0, 40, 220, 'rectangle',
                [
                    { dx: -50, dy: -75, holeId: 0 },
                    { dx: 50, dy: 75, holeId: 2 }
                ],
                '#ff2d78',
                250, 325
            ));

            // Plate 1 (Bottom Layer, Cyan): Pinned by H1 and H2
            this.plates.push(new NeonPlate(
                1, 40, 220, 'rectangle',
                [
                    { dx: 50, dy: -75, holeId: 1 },
                    { dx: -50, dy: 75, holeId: 2 }
                ],
                '#00ffff',
                350, 325
            ));

        } else if (lvlNum === 4) {
            // === LEVEL 4: HACKER GRID ===
            // A cluster of 5 holes forming a cross, with 1 empty
            // H0: (200, 250), H1: (400, 250)
            // H2: (200, 450), H3: (400, 450)
            // H4: (300, 350) (Empty center)
            this.holes.push(new BoardHole(0, 200, 250));
            this.holes.push(new BoardHole(1, 400, 250));
            this.holes.push(new BoardHole(2, 200, 450));
            this.holes.push(new BoardHole(3, 400, 450));
            this.holes.push(new BoardHole(4, 300, 350));

            // Screws at 0, 1, 2, 3
            this.screws.push(new Screw(0, 0));
            this.screws.push(new Screw(1, 1));
            this.screws.push(new Screw(2, 2));
            this.screws.push(new Screw(3, 3));

            // 2 Large overlapping bars:
            // Pink bar horizontal at top (H0 - H1)
            this.plates.push(new NeonPlate(
                0, 260, 45, 'rectangle',
                [
                    { dx: -100, dy: 0, holeId: 0 },
                    { dx: 100, dy: 0, holeId: 1 }
                ],
                '#ff2d78',
                300, 250
            ));

            // Cyan bar horizontal at bottom (H2 - H3)
            this.plates.push(new NeonPlate(
                1, 260, 45, 'rectangle',
                [
                    { dx: -100, dy: 0, holeId: 2 },
                    { dx: 100, dy: 0, holeId: 3 }
                ],
                '#00ffff',
                300, 450
            ));

        } else if (lvlNum === 5) {
            // === LEVEL 5: GRAND CPU MAINFRAME ===
            // Circular central secure gear held by outer shield bars
            // H0: (300, 200), H1: (180, 350), H2: (420, 350)
            // H3: (180, 500), H4: (420, 500), H5: (300, 650) (Empty)
            this.holes.push(new BoardHole(0, 300, 200));
            this.holes.push(new BoardHole(1, 180, 350));
            this.holes.push(new BoardHole(2, 420, 350));
            this.holes.push(new BoardHole(3, 180, 500));
            this.holes.push(new BoardHole(4, 420, 500));
            this.holes.push(new BoardHole(5, 300, 650));

            // Screws initially at 0, 1, 2, 3, 4
            this.screws.push(new Screw(0, 0));
            this.screws.push(new Screw(1, 1));
            this.screws.push(new Screw(2, 2));
            this.screws.push(new Screw(3, 3));
            this.screws.push(new Screw(4, 4));

            // Big Central Circle Core pinned by H1 and H2
            this.plates.push(new NeonPlate(
                0, 260, 260, 'circle',
                [
                    { dx: -120, dy: 0, holeId: 1 },
                    { dx: 120, dy: 0, holeId: 2 }
                ],
                '#ffff00', // yellow mainframe
                300, 350
            ));

            // Top Triangle Cap pinned by H0 and H1
            this.plates.push(new NeonPlate(
                1, 200, 35, 'rectangle',
                [
                    { dx: 60, dy: -75, holeId: 0 },
                    { dx: -60, dy: 75, holeId: 1 }
                ],
                '#ff2d78',
                240, 275
            ));

            // Bottom Core link pinned by H3 and H4
            this.plates.push(new NeonPlate(
                2, 260, 45, 'rectangle',
                [
                    { dx: -120, dy: 0, holeId: 3 },
                    { dx: 120, dy: 0, holeId: 4 }
                ],
                '#00ffff',
                300, 500
            ));
        }

        this.syncScrewsToHoles();
        this.updateHUD();
    }

    syncScrewsToHoles() {
        this.screws.forEach(screw => {
            const matchingHole = this.holes.find(h => h.id === screw.holeId);
            if (matchingHole) {
                screw.x = matchingHole.x;
                screw.y = matchingHole.y;
            }
        });
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

        // Aspect fit virtual 600x800 coordinate inside actual viewport
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
        this.clearedCount = 0;
        this.initLevel(1);

        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('success-screen').classList.remove('active');
        document.querySelector('.hud-header').style.display = 'grid';

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resetLevel() {
        this.moves = 0;
        this.initLevel(this.level);
        document.getElementById('success-screen').classList.remove('active');
        if (this.gameState === 'SUCCESS') {
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
            // Secured mainframe fully!
            this.level = 1;
            this.gameState = 'START';
            document.getElementById('success-screen').classList.remove('active');
            document.getElementById('start-screen').classList.add('active');
            document.querySelector('.hud-header').style.display = 'none';
        }
    }

    updateHUD() {
        document.getElementById('hud-level-val').textContent = this.level;
        document.getElementById('hud-moves-val').textContent = this.moves;
        document.getElementById('start-cleared-val').textContent = `${this.clearedCount} / 5`;
    }

    handleInteraction(e) {
        if (this.gameState !== 'PLAYING') return;

        // Transform mouse/touch coordinates back to virtual 600x800 grid
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const virtualX = (clientX - this.offsetX) / this.scale;
        const virtualY = (clientY - this.offsetY) / this.scale;

        // 1. If no screw is selected, check if user tapped an occupied screw bolt
        if (!this.selectedScrew) {
            let tappedScrew = null;
            this.screws.forEach(screw => {
                const dist = Math.hypot(screw.x - virtualX, screw.y - virtualY);
                if (dist <= screw.radius + 10) {
                    tappedScrew = screw;
                }
            });

            if (tappedScrew) {
                this.selectedScrew = tappedScrew;
                this.spawnSparks(tappedScrew.x, tappedScrew.y, '#ffff00');
                synth.playTickSFX();
            }
        } else {
            // 2. If a screw is selected, check if user tapped an unoccupied/empty hole
            let tappedHole = null;
            this.holes.forEach(hole => {
                const dist = Math.hypot(hole.x - virtualX, hole.y - virtualY);
                if (dist <= hole.radius + 15) {
                    tappedHole = hole;
                }
            });

            // Ensure the tapped hole is actually empty
            const isOccupied = this.screws.some(s => s.holeId === tappedHole?.id);

            if (tappedHole && !isOccupied) {
                // Relocate the active screw!
                this.selectedScrew.holeId = tappedHole.id;
                this.syncScrewsToHoles();
                this.spawnSparks(tappedHole.x, tappedHole.y, '#00ffff');
                synth.playClinkSFX();

                this.selectedScrew = null;
                this.moves++;
                this.updateHUD();
            } else {
                // If tapped elsewhere or on another occupied hole, deselect active screw
                this.selectedScrew = null;
                synth.playTickSFX();
            }
        }
    }

    spawnSparks(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            this.particles.push({
                x: x,
                y: y,
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
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 2.5 * dt;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Update screws pulse glow
        this.screws.forEach(s => s.update(dt));

        // Update plates pivot physics & falls
        this.plates.forEach(p => p.update(dt, this.holes, this.screws));

        // Check level win condition: all plates have fallen off
        const allFallen = this.plates.every(p => p.fallen);
        if (allFallen && this.plates.length > 0) {
            this.triggerWin();
        }
    }

    triggerWin() {
        this.gameState = 'SUCCESS';
        this.clearedCount = Math.max(this.clearedCount, this.level);
        
        // Save level score stats
        const currentBest = parseInt(localStorage.getItem(`neonBoltsBestLvl${this.level}`)) || 999;
        if (this.moves < currentBest) {
            localStorage.setItem(`neonBoltsBestLvl${this.level}`, this.moves);
        }

        synth.playSuccessSFX();
        
        document.getElementById('success-level-val').textContent = this.level;
        document.getElementById('success-moves-val').textContent = this.moves;
        document.getElementById('success-screen').classList.add('active');
        this.updateHUD();
    }

    draw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Center-fit workspace rendering
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw structural mainboard board grid lines in background
        this.drawBackgroundGrid();

        // 1. Draw Board Holes
        this.holes.forEach(hole => {
            const isSelectedEmpty = this.selectedScrew !== null && !this.screws.some(s => s.holeId === hole.id);
            hole.draw(this.ctx, isSelectedEmpty);
        });

        // 2. Draw Vector Plates
        this.plates.forEach(plate => plate.draw(this.ctx));

        // 3. Draw Screws
        this.screws.forEach(screw => {
            const isSelected = this.selectedScrew === screw;
            screw.draw(this.ctx, isSelected);
        });

        // 4. Draw Glow Spark Particles
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

        this.ctx.restore();
    }

    drawBackgroundGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        // Draw structural vertical lines
        for (let x = 40; x < this.virtualWidth; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 40);
            this.ctx.lineTo(x, this.virtualHeight - 40);
            this.ctx.stroke();
        }

        // Draw horizontal grid lines
        for (let y = 40; y < this.virtualHeight; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(40, y);
            this.ctx.lineTo(this.virtualWidth - 40, y);
            this.ctx.stroke();
        }

        // Cyberpunk inner circuit vectors
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.04)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(100, 150);
        this.ctx.lineTo(500, 150);
        this.ctx.lineTo(500, 650);
        this.ctx.lineTo(100, 650);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.restore();
    }
}

// Global instantiation hook
let gameInstance = null;
function initGame() {
    if (!gameInstance) {
        gameInstance = new GameEngine();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // If compliance overlay bypassed immediately or returning PWA, initialize instantly
    if (!document.body.classList.contains('show-info-overlay')) {
        initGame();
    }
});
