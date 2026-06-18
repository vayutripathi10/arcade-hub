/* ==========================================================
   NEON DICE DESTINY - CORE GAME ENGINE
   ========================================================== */

// --- Global State ---
let gameState = {
    target: 30,
    total: 0,
    round: 1,
    rolls: [],
    gameActive: false,
    rolling: false,
    score: 0,
    personalBest: null,
    muted: localStorage.getItem('arcadeHubMuted') === 'true',
    history: []
};

// --- Web Audio API Synthesizer ---
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.rattleInterval = null;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    playClick() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.02);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }

    playClunk() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        // Two oscillators for a complex heavy mechanical lock sound
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(110, t);
        osc1.frequency.linearRampToValueAtTime(40, t + 0.12);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(75, t);
        osc2.frequency.linearRampToValueAtTime(30, t + 0.15);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc1.start();
        osc2.start();
        osc1.stop(t + 0.2);
        osc2.stop(t + 0.2);
    }

    playThud() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.start();
        osc.stop(t + 0.12);
    }

    startRattle(speedFactor) {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx || this.rattleInterval) return;

        const triggerRattle = () => {
            if (gameState.muted || !gameState.rolling) {
                this.stopRattle();
                return;
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280 + Math.random() * 100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);

            // Reschedule at a variable speed (simulating slow-down)
            let nextDelay = 55 + Math.random() * 40;
            if (threeScene && threeScene.dice[0]) {
                const vel = Math.abs(threeScene.dice[0].vy) + Math.abs(threeScene.dice[1].vy);
                nextDelay = Math.max(45, Math.min(220, 250 - vel * 18));
            }
            this.rattleInterval = setTimeout(triggerRattle, nextDelay);
        };

        this.rattleInterval = setTimeout(triggerRattle, 50);
    }

    stopRattle() {
        if (this.rattleInterval) {
            clearTimeout(this.rattleInterval);
            this.rattleInterval = null;
        }
    }

    playPipReveal() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.1);
            gain.gain.setValueAtTime(0.08, t + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.2);

            osc.start(t + idx * 0.1);
            osc.stop(t + idx * 0.1 + 0.25);
        });
    }

    playTick() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.015);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.02);
    }

    playDrumrollAndCrash(callback) {
        if (gameState.muted) {
            if (callback) callback();
            return;
        }
        this.init();
        if (!this.ctx) {
            if (callback) callback();
            return;
        }

        const t = this.ctx.currentTime;
        
        // 1. Drumroll (Low noise modulation)
        const bufferSize = this.ctx.sampleRate * 0.8; // 0.8s
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(150, t);
        noiseFilter.Q.setValueAtTime(4.0, t);

        const noiseGain = this.ctx.createGain();
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseGain.gain.setValueAtTime(0.0, t);
        noiseGain.gain.linearRampToValueAtTime(0.12, t + 0.6);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        noiseNode.start(t);
        noiseNode.stop(t + 0.8);

        // 2. Cymbal Crash (Decaying white noise with highpass)
        setTimeout(() => {
            if (gameState.muted) return;
            const ct = this.ctx.currentTime;
            const crashBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.5, this.ctx.sampleRate);
            const crashData = crashBuffer.getChannelData(0);
            for (let i = 0; i < crashBuffer.length; i++) {
                crashData[i] = Math.random() * 2 - 1;
            }

            const crashSource = this.ctx.createBufferSource();
            crashSource.buffer = crashBuffer;

            const crashFilter = this.ctx.createBiquadFilter();
            crashFilter.type = 'highpass';
            crashFilter.frequency.setValueAtTime(2000, ct);

            const crashGain = this.ctx.createGain();
            crashSource.connect(crashFilter);
            crashFilter.connect(crashGain);
            crashGain.connect(this.ctx.destination);

            crashGain.gain.setValueAtTime(0.2, ct);
            crashGain.gain.exponentialRampToValueAtTime(0.001, ct + 1.2);

            crashSource.start(ct);
            crashSource.stop(ct + 1.5);
            
            if (callback) callback();
        }, 750);
    }

    playFanfare() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const notes = [
            { f: 523.25, start: 0.0, dur: 0.15 }, // C5
            { f: 659.25, start: 0.15, dur: 0.15 }, // E5
            { f: 783.99, start: 0.3, dur: 0.15 }, // G5
            { f: 1046.50, start: 0.45, dur: 0.6 } // C6
        ];

        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(n.f, t + n.start);

            gain.gain.setValueAtTime(0.12, t + n.start);
            gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);

            osc.start(t + n.start);
            osc.stop(t + n.start + n.dur);
        });
    }

    playWahWah() {
        if (gameState.muted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(110, t + 0.8);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.8);
        filter.Q.setValueAtTime(8.0, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.start(t);
        osc.stop(t + 0.85);
    }
}

const sfx = new SoundSynth();

// --- Three.js 3D Viewport Manager ---
class DiceViewport {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dice = [];
        this.particles = [];
        this.isAnimating = false;
        
        // Target orientations to face numbers up
        // material indices: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z
        // mapped face: 1=+Y, 6=-Y, 3=+X, 4=-X, 2=+Z, 5=-Z
        this.faceRotations = {
            1: { x: 0, z: 0 },
            6: { x: Math.PI, z: 0 },
            2: { x: -Math.PI / 2, z: 0 },
            5: { x: Math.PI / 2, z: 0 },
            3: { x: 0, z: Math.PI / 2 },
            4: { x: 0, z: -Math.PI / 2 }
        };

        this.init();
    }

    init() {
        // Dimensions
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2('#06070a', 0.08);

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, 7.8, 6.2);
        this.camera.lookAt(0, -0.5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor('#06070a', 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Clean container and insert canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight('#181a30', 0.8);
        this.scene.add(ambient);

        const spotlight = new THREE.SpotLight('#ffffff', 1.8);
        spotlight.position.set(0, 10, 4);
        spotlight.angle = Math.PI / 4;
        spotlight.penumbra = 0.5;
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        spotlight.shadow.camera.near = 2;
        spotlight.shadow.camera.far = 15;
        spotlight.shadow.bias = -0.001;
        this.scene.add(spotlight);

        // Grid Floor
        const gridHelper = new THREE.GridHelper(20, 20, '#00ffcc', '#0c0d16');
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        const floorGeo = new THREE.PlaneGeometry(30, 30);
        const floorMat = new THREE.MeshStandardMaterial({
            color: '#06070a',
            roughness: 0.85,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Create Dice Materials procedures
        const diceMaterials = [];
        for (let i = 1; i <= 6; i++) {
            diceMaterials.push(new THREE.MeshStandardMaterial({
                map: this.createDiceFaceTexture(i),
                roughness: 0.25,
                metalness: 0.75
            }));
        }

        // Box geometry
        const dieGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

        // Build 2 Dice inside Groups
        for (let i = 0; i < 2; i++) {
            const group = new THREE.Group();
            
            // Map textures: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z
            // we assign: 3, 4, 1, 6, 2, 5
            const materials = [
                diceMaterials[2], // +X: 3
                diceMaterials[3], // -X: 4
                diceMaterials[0], // +Y: 1
                diceMaterials[5], // -Y: 6
                diceMaterials[1], // +Z: 2
                diceMaterials[4]  // -Z: 5
            ];

            const dieMesh = new THREE.Mesh(dieGeo, materials);
            dieMesh.castShadow = true;
            dieMesh.receiveShadow = true;
            
            group.add(dieMesh);
            this.scene.add(group);

            this.dice.push({
                group: group,
                mesh: dieMesh,
                x: i === 0 ? -1.3 : 1.3,
                y: 0.5,
                z: 0.0,
                vx: 0,
                vy: 0,
                vz: 0,
                wx: 0,
                wy: 0,
                wz: 0,
                bounceCount: 0,
                targetVal: 1,
                state: 'idle'
            });
        }

        // Set initial idle positions
        this.resetDice();

        // Listen for viewport resizes
        window.addEventListener('resize', () => this.onResize());
        
        // Start animation loop
        this.isAnimating = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.animate(t));
    }

    createDiceFaceTexture(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Dark slate base
        ctx.fillStyle = '#0c0d14';
        ctx.fillRect(0, 0, 128, 128);

        // Cyber glows
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 122, 122);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(6, 6, 116, 116);

        // Draw pips
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;

        const pips = [];
        const r = 8.5;
        const c = 64;
        const l = 32;
        const h = 96;

        if (number === 1) {
            pips.push([c, c]);
        } else if (number === 2) {
            pips.push([l, l], [h, h]);
        } else if (number === 3) {
            pips.push([l, l], [c, c], [h, h]);
        } else if (number === 4) {
            pips.push([l, l], [l, h], [h, l], [h, h]);
        } else if (number === 5) {
            pips.push([l, l], [l, h], [c, c], [h, l], [h, h]);
        } else if (number === 6) {
            pips.push([l, l], [l, c], [l, h], [h, l], [h, c], [h, h]);
        }

        for (const [px, py] of pips) {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    onResize() {
        if (!this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    resetDice() {
        this.dice.forEach((d, idx) => {
            d.x = idx === 0 ? -1.2 : 1.2;
            d.y = 0.5;
            d.z = 0.0;
            d.vx = 0;
            d.vy = 0;
            d.vz = 0;
            d.wx = 0;
            d.wy = 0;
            d.wz = 0;
            d.bounceCount = 0;
            d.state = 'idle';
            
            d.group.position.set(d.x, d.y, d.z);
            d.group.rotation.set(0, idx === 0 ? 0.3 : -0.3, 0);
            d.mesh.rotation.set(0, 0, 0);
        });
        
        // Reset camera position
        this.camera.position.set(0, 7.8, 6.2);
        this.camera.lookAt(0, -0.5, 0);
    }

    launchRoll(val1, val2) {
        gameState.rolling = true;
        sfx.startRattle();

        this.dice[0].targetVal = val1;
        this.dice[1].targetVal = val2;

        this.dice.forEach((d, idx) => {
            d.state = 'rolling';
            d.bounceCount = 0;
            
            // Random start position near top-back
            d.x = idx === 0 ? -1.8 : 1.8;
            d.y = 4.2;
            d.z = -2.5;

            // Roll vectors
            d.vx = idx === 0 ? (2.8 + Math.random() * 2) : (-2.8 - Math.random() * 2);
            d.vy = 1.0 + Math.random() * 1.5;
            d.vz = 3.5 + Math.random() * 2;

            // Rotation vectors
            d.wx = (12 + Math.random() * 12) * (Math.random() < 0.5 ? 1 : -1);
            d.wy = (12 + Math.random() * 12) * (Math.random() < 0.5 ? 1 : -1);
            d.wz = (12 + Math.random() * 12) * (Math.random() < 0.5 ? 1 : -1);

            d.group.position.set(d.x, d.y, d.z);
            
            // Pre-seed inner mesh to map alignments immediately
            const rot = this.faceRotations[d.targetVal];
            d.mesh.rotation.set(rot.x, 0, rot.z);
        });

        // Slow camera tracking effect
        this.camera.position.set(0, 8.5, 7.0);
    }

    spawnThudParticles(x, z) {
        // Glowing cyan particles
        const pCount = 12;
        for (let i = 0; i < pCount; i++) {
            const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const mat = new THREE.MeshBasicMaterial({
                color: '#00ffcc',
                transparent: true,
                opacity: 0.95
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(x + (Math.random() - 0.5) * 0.4, 0.05, z + (Math.random() - 0.5) * 0.4);
            
            const angle = Math.random() * Math.PI * 2;
            const spd = 2.0 + Math.random() * 3.5;
            
            this.scene.add(p);
            this.particles.push({
                mesh: p,
                vx: Math.cos(angle) * spd,
                vy: 2.0 + Math.random() * 4.0,
                vz: Math.sin(angle) * spd,
                alpha: 0.95,
                life: 0.6 + Math.random() * 0.4
            });
        }
    }

    animate(currentTime) {
        if (!this.isAnimating) return;

        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap dt to prevent frame gaps
        dt = Math.min(dt, 0.1);

        if (gameState.rolling) {
            this.updatePhysics(dt);
        }
        
        this.updateParticles(dt);

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        requestAnimationFrame((t) => this.animate(t));
    }

    updatePhysics(dt) {
        const gravity = -17.5;
        const bounceLoss = 0.4;
        const friction = 0.92;
        const sizeRadius = 0.55; // Settle limits
        
        let allDone = true;

        this.dice.forEach((d) => {
            if (d.state === 'rolling') {
                allDone = false;
                
                // 1. Move position
                d.vy += gravity * dt;
                d.x += d.vx * dt;
                d.y += d.vy * dt;
                d.z += d.vz * dt;

                // 2. Rotate group
                d.group.rotation.x += d.wx * dt;
                d.group.rotation.y += d.wy * dt;
                d.group.rotation.z += d.wz * dt;

                d.group.position.set(d.x, d.y, d.z);

                // 3. Ground thuds
                if (d.y < sizeRadius && d.vy < 0) {
                    d.y = sizeRadius;
                    d.vy = -d.vy * bounceLoss;
                    
                    // friction
                    d.vx *= 0.65;
                    d.vz *= 0.65;
                    d.wx *= 0.5;
                    d.wy *= 0.5;
                    d.wz *= 0.5;

                    d.bounceCount++;
                    sfx.playThud();
                    this.spawnThudParticles(d.x, d.z);

                    // Stop condition
                    if (d.bounceCount >= 3 || (Math.abs(d.vy) < 0.6 && Math.abs(d.vx) < 0.6)) {
                        d.state = 'settling';
                        d.targetY = sizeRadius;
                        // Choose a random horizontal rotation spin
                        d.targetSpinY = Math.random() * Math.PI * 2;
                    }
                }

                // 4. Bound limits
                if (d.x < -3.2) { d.x = -3.2; d.vx = -d.vx * 0.5; }
                if (d.x > 3.2) { d.x = 3.2; d.vx = -d.vx * 0.5; }
                if (d.z < -3.2) { d.z = -3.2; d.vz = -d.vz * 0.5; }
                if (d.z > 3.2) { d.z = 3.2; d.vz = -d.vz * 0.5; }

            } else if (d.state === 'settling') {
                allDone = false;
                
                // Slow motion settling effect: interpolate group rotations to 0 on X and Z
                // while letting Y settle on the targetSpinY
                d.group.rotation.x = THREE.MathUtils.lerp(d.group.rotation.x, 0, 0.16);
                d.group.rotation.z = THREE.MathUtils.lerp(d.group.rotation.z, 0, 0.16);
                
                // Wrap rotation.y logic
                d.group.rotation.y = THREE.MathUtils.lerp(d.group.rotation.y, d.targetSpinY, 0.16);

                // Position lerp
                d.x = THREE.MathUtils.lerp(d.x, d.x > 0 ? 0.95 : -0.95, 0.14);
                d.z = THREE.MathUtils.lerp(d.z, 0, 0.14);
                d.y = THREE.MathUtils.lerp(d.y, d.targetY, 0.14);

                d.group.position.set(d.x, d.y, d.z);

                const diffX = Math.abs(d.group.rotation.x % (Math.PI * 2));
                const diffZ = Math.abs(d.group.rotation.z % (Math.PI * 2));

                if (diffX < 0.02 && diffZ < 0.02 && Math.abs(d.y - d.targetY) < 0.02) {
                    d.group.rotation.x = 0;
                    d.group.rotation.z = 0;
                    d.group.rotation.y = d.targetSpinY;
                    d.group.position.set(d.x > 0 ? 0.95 : -0.95, d.targetY, 0);
                    d.state = 'done';
                }
            }
        });

        // Camera track back
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 0.05);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 7.8, 0.05);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 6.2, 0.05);

        if (allDone) {
            gameState.rolling = false;
            sfx.stopRattle();
            
            // Brief 200ms freeze frame before revealing numbers
            setTimeout(() => {
                onRollSettled();
            }, 200);
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.vy -= 9.8 * dt; // Gravity

            p.life -= dt;
            p.alpha = Math.max(0, p.life);
            p.mesh.material.opacity = p.alpha;
            p.mesh.scale.setScalar(p.alpha);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}

let threeScene = null;

// --- Proximity Scoring Setup ---
function calculateProximityScore(diff) {
    if (diff === 0) return 10;
    if (diff === 1) return 9;
    if (diff === 2) return 8;
    if (diff === 3) return 7;
    if (diff <= 5) return 6;
    if (diff <= 8) return 5;
    if (diff <= 12) return 4;
    if (diff <= 18) return 3;
    if (diff <= 25) return 2;
    if (diff <= 35) return 1;
    return 0;
}

// --- Tier Quotations Database ---
const QUOTE_DATABASE = {
    10: [
        "The universe bends to your will! 🌌",
        "Are you even human?! LEGENDARY! 👑",
        "Today is definitely your day! ✨",
        "The dice gods bow to you! 🎲"
    ],
    9: [
        "So close to perfection! Almost divine! 🔥",
        "One pip away from destiny! Incredible!",
        "The stars were almost perfectly aligned! ⭐"
    ],
    8: [
        "You have the gift! Excellent read! 🎯",
        "Your instincts are sharp as a blade!",
        "Fortune clearly favors you today! 💫"
    ],
    7: [
        "Great call! You know these dice well!",
        "Solid read! The dice respected you today!",
        "Lucky? No — this was pure skill! 💪"
    ],
    6: [
        "Not bad at all! You felt the energy!",
        "Good read — the dice were mostly with you!",
        "Respectable! You've done this before haven't you?"
    ],
    5: [
        "Right in the middle — the dice are undecided about you! 😄",
        "Half lucky, half not — pretty balanced karma!",
        "The dice are testing your patience!"
    ],
    4: [
        "The dice had other plans today! 🎲",
        "Not your best round — the numbers escaped you!",
        "The dice laughed a little... but so should you! 😂"
    ],
    3: [
        "Ouch! The dice were NOT feeling it today!",
        "You just missed by a mile! Tomorrow will be better!",
        "The universe is sending you a message... try again! 😅"
    ],
    2: [
        "Were you even trying? Just kidding — bad luck!",
        "The dice went rogue on you completely!",
        "Somewhere, a dice is laughing at you right now 😂"
    ],
    1: [
        "Wow. Just... wow. The dice have abandoned you!",
        "That was a disaster — but an entertaining one! 🙈",
        "Fortune has left the chat! 😭"
    ],
    0: [
        "The dice have declared war on you! 💀",
        "Historically bad. Frame this result. 🖼️",
        "Not even close! The dice are filing a restraining order! 😂",
        "0 out of 10 — even the dice feel bad for you!"
    ]
};

// --- Game Engine Logic & Screens Transitions ---
function initGame() {
    // Canvas Setup
    threeScene = new DiceViewport('three-canvas-container');

    // Load High Score
    loadBestScore();

    // Bind Interaction Events
    bindTargetPicker();
    bindActions();
}

function bindTargetPicker() {
    const slider = document.getElementById('target-slider');
    const digits = document.getElementById('target-digits-val');
    const btnMinus = document.getElementById('picker-minus');
    const btnPlus = document.getElementById('picker-plus');

    const updateDisplay = (val) => {
        if (gameState.gameActive) return;
        gameState.target = parseInt(val, 10);
        digits.textContent = gameState.target;
        slider.value = gameState.target;
        
        // Probability hint check
        const hint = document.getElementById('prob-text');
        if (gameState.target <= 10) {
            hint.className = 'very-easy';
            hint.textContent = 'Very Easy 🟢';
        } else if (gameState.target <= 25) {
            hint.className = 'moderate';
            hint.textContent = 'Moderate 🟢';
        } else if (gameState.target <= 40) {
            hint.className = 'achievable';
            hint.textContent = 'Achievable 🟡';
        } else if (gameState.target <= 55) {
            hint.className = 'ambitious';
            hint.textContent = 'Ambitious 🔴';
        } else {
            hint.className = 'legendary';
            hint.textContent = 'Legendary Challenge 💀';
        }
    };

    slider.addEventListener('input', (e) => {
        updateDisplay(e.target.value);
        sfx.playTick();
    });

    btnMinus.addEventListener('click', () => {
        if (gameState.target > 2) {
            updateDisplay(gameState.target - 1);
            sfx.playClick();
        }
    });

    btnPlus.addEventListener('click', () => {
        if (gameState.target < 60) {
            updateDisplay(gameState.target + 1);
            sfx.playClick();
        }
    });
}

function bindActions() {
    // Lock Target
    document.getElementById('btn-lock-target').addEventListener('click', () => {
        lockTarget();
    });

    // Roll Dice
    document.getElementById('btn-roll-dice').addEventListener('click', () => {
        triggerRoll();
    });

    // Return Home HUD
    document.getElementById('hud-home-btn').addEventListener('click', () => {
        sfx.playClick();
        resetToTargetSelect();
    });

    // Mute HUD
    const muteBtn = document.getElementById('hud-mute-btn');
    muteBtn.addEventListener('click', () => {
        gameState.muted = !gameState.muted;
        localStorage.setItem('arcadeHubMuted', gameState.muted);
        muteBtn.textContent = gameState.muted ? '🔇' : '🔊';
        showToast(gameState.muted ? "Muted" : "Sound Unmuted");
        sfx.playClick();
    });
    // Set initial mute display
    muteBtn.textContent = gameState.muted ? '🔇' : '🔊';

    // Play Again / Change Target
    document.getElementById('btn-play-again').addEventListener('click', () => {
        sfx.playClick();
        restartGameWithSameTarget();
    });

    document.getElementById('btn-change-target').addEventListener('click', () => {
        sfx.playClick();
        resetToTargetSelect();
    });

    // Leaderboard display
    document.getElementById('btn-show-leaderboard').addEventListener('click', () => {
        sfx.playClick();
        showLeaderboard();
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
        sfx.playClick();
        showScreen('screen-target-select');
    });

    // Share buttons
    document.getElementById('share-wa').addEventListener('click', () => shareWhatsApp());
    document.getElementById('share-x').addEventListener('click', () => shareX());
    document.getElementById('share-social').addEventListener('click', () => shareSocialGeneric());
}

function lockTarget() {
    sfx.playClunk();
    
    // Animate padlock & lock pickers
    const padlock = document.getElementById('target-padlock');
    const digits = document.getElementById('target-digits-val');
    const card = document.querySelector('.target-picker-card');
    
    padlock.classList.add('visible');
    digits.classList.add('locked');
    card.classList.add('locked');
    
    document.getElementById('target-slider').disabled = true;
    document.getElementById('picker-minus').disabled = true;
    document.getElementById('picker-plus').disabled = true;
    document.getElementById('btn-lock-target').disabled = true;

    // Slam animation & transition
    setTimeout(() => {
        gameState.gameActive = true;
        gameState.total = 0;
        gameState.round = 1;
        gameState.rolls = [];

        // Update HUD
        document.getElementById('hud-target-val').textContent = gameState.target;
        document.getElementById('hud-total-val').textContent = "0";
        document.getElementById('hud-round-pill').textContent = "ROUND 1/5";
        
        // Update Game screen stats
        document.getElementById('stat-gap').textContent = `NEED ${gameState.target} MORE`;
        document.getElementById('stat-commentary').textContent = "Ready for Roll 1";
        document.getElementById('progress-target-label').textContent = `Target: ${gameState.target}`;
        
        // Position progress marker
        const marker = document.getElementById('target-marker');
        marker.style.left = `${(gameState.target / 60) * 100}%`;
        
        // Progress Fill resets
        const fill = document.getElementById('progress-fill');
        fill.style.width = '0%';
        fill.classList.remove('overflow');

        document.getElementById('game-hud').classList.remove('hidden');
        showScreen('screen-game');
        
        // Ensure screen transitions are completed before resizing
        setTimeout(() => {
            if (threeScene) {
                threeScene.onResize();
                threeScene.resetDice();
            }
        }, 50);
    }, 900);
}

function triggerRoll() {
    if (gameState.rolling || !gameState.gameActive) return;
    sfx.playClick();

    // Pulse button animation
    const rollBtn = document.getElementById('btn-roll-dice');
    rollBtn.classList.add('pressed');
    setTimeout(() => rollBtn.classList.remove('pressed'), 100);

    // Final countdown transition overlay for round 5
    if (gameState.round === 5) {
        const overlay = document.getElementById('countdown-overlay');
        overlay.classList.add('visible');
        overlay.textContent = "3";
        sfx.playTick();
        
        setTimeout(() => {
            overlay.textContent = "2";
            sfx.playTick();
            setTimeout(() => {
                overlay.textContent = "1";
                sfx.playTick();
                setTimeout(() => {
                    overlay.classList.remove('visible');
                    executeRoll();
                }, 500);
            }, 600);
        }, 600);
    } else {
        executeRoll();
    }
}

function executeRoll() {
    // Roll values
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = d1 + d2;
    
    gameState.rolls.push({ d1, d2, sum: rollSum });
    
    // Launch WebGL roll
    threeScene.launchRoll(d1, d2);
}

function onRollSettled() {
    const currentRoll = gameState.rolls[gameState.round - 1];
    
    // Accumulate total
    gameState.total += currentRoll.sum;
    
    // Trigger tick sound reveal
    sfx.playPipReveal();
    
    // Visual indicators
    const flyout = document.getElementById('roll-flyout');
    flyout.textContent = `+${currentRoll.sum}`;
    flyout.classList.add('animate');
    setTimeout(() => flyout.classList.remove('animate'), 1200);

    // Tick increment UI
    let displayTotal = parseInt(document.getElementById('hud-total-val').textContent, 10);
    const targetVal = gameState.total;
    const tickInterval = setInterval(() => {
        if (displayTotal < targetVal) {
            displayTotal++;
            document.getElementById('hud-total-val').textContent = displayTotal;
            sfx.playTick();
        } else {
            clearInterval(tickInterval);
        }
    }, 45);

    // Update Progress bar width
    const fill = document.getElementById('progress-fill');
    const pct = Math.min(100, (gameState.total / 60) * 100);
    fill.style.width = `${pct}%`;
    if (gameState.total > gameState.target) {
        fill.classList.add('overflow');
    }

    // Gap update
    const gap = gameState.target - gameState.total;
    const gapEl = document.getElementById('stat-gap');
    if (gap > 0) {
        gapEl.textContent = `NEED ${gap} MORE`;
    } else if (gap === 0) {
        gapEl.textContent = `TARGET MET!`;
    } else {
        gapEl.textContent = `OVERFLOW: +${Math.abs(gap)}`;
    }

    // Probability & motivational updates
    updateTensionHUD(gap);

    // Round progression check
    if (gameState.round < 5) {
        gameState.round++;
        setTimeout(() => {
            document.getElementById('hud-round-pill').textContent = `ROUND ${gameState.round}/5`;
            threeScene.resetDice();
        }, 1500);
    } else {
        // Round 5 finished - Go to Score reveal
        gameState.gameActive = false;
        setTimeout(() => {
            revealFinalScore();
        }, 1800);
    }
}

function updateTensionHUD(gap) {
    const commentary = document.getElementById('stat-commentary');
    const status = document.getElementById('stat-status');
    const roundsLeft = 5 - gameState.round;

    // Commentary tags
    if (gameState.round === 1) {
        if (gap < gameState.target - 7) {
            commentary.textContent = "Good start!";
        } else {
            commentary.textContent = "Slow beginning...";
        }
    } else if (gameState.round === 2) {
        if (gap < (gameState.target * 0.6)) {
            commentary.textContent = "Keep going!";
        } else {
            commentary.textContent = "You're behind pace";
        }
    } else if (gameState.round === 3) {
        if (gap < (gameState.target * 0.4)) {
            commentary.textContent = "Halfway there!";
        } else {
            commentary.textContent = "Need big numbers!";
        }
    } else if (gameState.round === 4) {
        if (gap <= 12) {
            commentary.textContent = "One roll left!";
        } else {
            commentary.textContent = "Need a miracle!";
        }
    }

    // Probability signals
    // Average remaining needed per roll
    if (roundsLeft > 0) {
        const avgNeeded = gap / roundsLeft;
        if (avgNeeded >= 2 && avgNeeded <= 12) {
            if (avgNeeded >= 5 && avgNeeded <= 9) {
                status.innerHTML = `<span class="indicator-dot green"></span>On track 🟢`;
            } else {
                status.innerHTML = `<span class="indicator-dot yellow"></span>Getting tight 🟡`;
            }
        } else {
            status.innerHTML = `<span class="indicator-dot red"></span>Long shot 🔴`;
        }
    } else {
        if (gap === 0) {
            status.innerHTML = `<span class="indicator-dot green"></span>PERFECT 🟢`;
        } else if (Math.abs(gap) <= 3) {
            status.innerHTML = `<span class="indicator-dot yellow"></span>Close match 🟡`;
        } else {
            status.innerHTML = `<span class="indicator-dot red"></span>Off target 🔴`;
        }
    }
}

function revealFinalScore() {
    document.getElementById('game-hud').classList.add('hidden');
    showScreen('screen-score');

    // Slide columns animation resets
    const colTarget = document.getElementById('col-target');
    const colTotal = document.getElementById('col-total');
    const spark = document.getElementById('spark-node');
    
    colTarget.classList.remove('reveal');
    colTotal.classList.remove('reveal');
    spark.classList.remove('flash');

    // 1. Drumroll start
    sfx.playDrumrollAndCrash(() => {
        // Spark hit & slide column reveal
        colTarget.classList.add('reveal');
        colTotal.classList.add('reveal');
        spark.classList.add('flash');
        
        // Set reveals
        document.getElementById('reveal-target').textContent = gameState.target;
        document.getElementById('reveal-total').textContent = gameState.total;

        // Proximity calculation
        const diff = Math.abs(gameState.target - gameState.total);
        document.getElementById('reveal-diff').textContent = diff;

        // Score tick calculation
        const finalScore = calculateProximityScore(diff);
        gameState.score = finalScore;
        
        let displayScore = 0;
        const scoreEl = document.getElementById('reveal-score');
        
        const tickScore = setInterval(() => {
            if (displayScore < finalScore) {
                displayScore++;
                scoreEl.textContent = displayScore;
                sfx.playTick();
            } else {
                clearInterval(tickScore);
                revealStarsAndQuotation(finalScore, diff);
            }
        }, 60);
    });
}

function revealStarsAndQuotation(score, diff) {
    // Star rating calculations: 1-3=1star, 4-6=2star, 7-10=3star
    let activeStars = 0;
    if (score >= 7) activeStars = 3;
    else if (score >= 4) activeStars = 2;
    else if (score >= 1) activeStars = 1;

    const starContainers = document.querySelectorAll('#reveal-stars .star');
    starContainers.forEach((s, idx) => {
        s.classList.remove('active');
        if (idx < activeStars) {
            setTimeout(() => {
                s.classList.add('active');
                sfx.playClick();
            }, (idx + 1) * 250);
        }
    });

    // Quotation reveal
    const quotes = QUOTE_DATABASE[score];
    const finalQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    const quoteEl = document.getElementById('reveal-quote');
    quoteEl.textContent = '';
    
    // Typewriter effect
    let charIdx = 0;
    const typeInterval = setInterval(() => {
        if (charIdx < finalQuote.length) {
            quoteEl.textContent += finalQuote.charAt(charIdx);
            charIdx++;
        } else {
            clearInterval(typeInterval);
        }
    }, 25);

    // Save High Score stats
    saveBestScore(score, gameState.target, finalQuote);

    // Juice Effects (Perfect score or Low score)
    if (score === 10) {
        // Perfect 10/10 celebration
        setTimeout(() => {
            sfx.playFanfare();
            document.body.classList.add('gold-flash');
            document.getElementById('perfect-celebration').classList.add('visible');
            
            // Remove overlays on click
            document.getElementById('perfect-celebration').onclick = () => {
                document.getElementById('perfect-celebration').classList.remove('visible');
                document.body.classList.remove('gold-flash');
            };
        }, 1200);
    } else if (score <= 2) {
        // Low score commiseration
        setTimeout(() => {
            sfx.playWahWah();
            document.body.classList.add('gray-sad');
            
            // Dice look "ashamed" (apply vibration shake style)
            const wrapper = document.getElementById('viewport-wrapper');
            wrapper.classList.add('ashamed-shake');

            setTimeout(() => {
                document.body.classList.remove('gray-sad');
                wrapper.classList.remove('ashamed-shake');
            }, 2000);
        }, 1000);
    }
}

// --- Local Storage Management ---
function saveBestScore(score, target, quote) {
    const saved = localStorage.getItem('neonDiceDestinyBest');
    let best = { score: 0, target: 30, quote: "" };
    if (saved) {
        try {
            best = JSON.parse(saved);
        } catch (e) {}
    }

    if (score >= best.score) {
        best.score = score;
        best.target = target;
        best.quote = quote;
        localStorage.setItem('neonDiceDestinyBest', JSON.stringify(best));
    }
    
    loadBestScore();
}

function loadBestScore() {
    const saved = localStorage.getItem('neonDiceDestinyBest');
    const display = document.getElementById('best-score-val');
    if (saved) {
        try {
            const best = JSON.parse(saved);
            display.textContent = `${best.score}/10 (Target: ${best.target})`;
        } catch (e) {
            display.textContent = "No record";
        }
    } else {
        display.textContent = "No record";
    }
}

function showLeaderboard() {
    const saved = localStorage.getItem('neonDiceDestinyBest');
    
    const scoreVal = document.getElementById('lead-best-score');
    const targetVal = document.getElementById('lead-best-target');
    const rollsVal = document.getElementById('lead-total-rolls');
    const quoteVal = document.getElementById('lead-best-quote');

    if (saved) {
        try {
            const best = JSON.parse(saved);
            scoreVal.textContent = `${best.score}/10`;
            targetVal.textContent = best.target;
            quoteVal.textContent = `"${best.quote}"`;
        } catch(e) {}
    } else {
        scoreVal.textContent = "None";
        targetVal.textContent = "None";
        quoteVal.textContent = "No destiny locked yet. Play a game to record your path!";
    }
    
    // Approximate count based on rounds played
    rollsVal.textContent = parseInt(localStorage.getItem('neonDiceTotalRolls') || '0', 10);
    
    showScreen('screen-leaderboard');
}

// --- Screen Router ---
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
    }
}

function resetToTargetSelect() {
    gameState.gameActive = false;
    gameState.rolling = false;
    
    // Unlock pickers
    const padlock = document.getElementById('target-padlock');
    const digits = document.getElementById('target-digits-val');
    const card = document.querySelector('.target-picker-card');
    
    padlock.classList.remove('visible');
    digits.classList.remove('locked');
    card.classList.remove('locked');
    
    document.getElementById('target-slider').disabled = false;
    document.getElementById('picker-minus').disabled = false;
    document.getElementById('picker-plus').disabled = false;
    document.getElementById('btn-lock-target').disabled = false;
    
    document.getElementById('game-hud').classList.add('hidden');
    showScreen('screen-target-select');
    
    if (threeScene) {
        threeScene.resetDice();
    }
}

function restartGameWithSameTarget() {
    gameState.gameActive = true;
    gameState.total = 0;
    gameState.round = 1;
    gameState.rolls = [];

    // Increment roll statistics tracker
    let totalRolls = parseInt(localStorage.getItem('neonDiceTotalRolls') || '0', 10);
    totalRolls += 5;
    localStorage.setItem('neonDiceTotalRolls', totalRolls);

    // Reset HUD
    document.getElementById('hud-total-val').textContent = "0";
    document.getElementById('hud-round-pill').textContent = "ROUND 1/5";
    
    // Reset Game Stats
    document.getElementById('stat-gap').textContent = `NEED ${gameState.target} MORE`;
    document.getElementById('stat-commentary').textContent = "Ready for Roll 1";
    
    const fill = document.getElementById('progress-fill');
    fill.style.width = '0%';
    fill.classList.remove('overflow');

    document.getElementById('game-hud').classList.remove('hidden');
    showScreen('screen-game');
    
    // Ensure screen transitions are completed before resizing
    setTimeout(() => {
        if (threeScene) {
            threeScene.onResize();
            threeScene.resetDice();
        }
    }, 50);
}

// --- Notification Toast ---
function showToast(msg) {
    const toast = document.getElementById('sound-toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 1500);
}

// --- Social Share Creators ---
function shareWhatsApp() {
    const text = `I rolled a proximity score of ${gameState.score}/10 in Neon Dice Destiny! My target was ${gameState.target} and I rolled a total of ${gameState.total}. Can you beat my alignment? 🎲 Play now at: https://arcadehubplay.com/play-neon-dice-destiny`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

function shareX() {
    const text = `I rolled a proximity score of ${gameState.score}/10 in Neon Dice Destiny! Target: ${gameState.target} | Total: ${gameState.total}. Can you match the dice gods? 🎲 @ArcadeHub https://arcadehubplay.com/play-neon-dice-destiny`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
}

function shareSocialGeneric() {
    const text = `I rolled a proximity score of ${gameState.score}/10 in Neon Dice Destiny! Target: ${gameState.target} | Total: ${gameState.total}. Can you match the dice gods? 🎲`;
    const url = 'https://arcadehubplay.com/play-neon-dice-destiny';
    
    if (navigator.share) {
        navigator.share({
            title: 'Neon Dice Destiny',
            text: text,
            url: url
        }).catch(() => {});
    } else {
        // Clipboard fallback
        navigator.clipboard.writeText(`${text} Play now: ${url}`)
            .then(() => showToast("Copied share text to clipboard!"))
            .catch(() => showToast("Failed to copy link"));
    }
}

// Start trigger on page load
window.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if overlay is already seen
    const overlaySeen = localStorage.getItem('arcade_seen_neon-dice-destiny') === '1';
    if (overlaySeen) {
        initGame();
    }
});
