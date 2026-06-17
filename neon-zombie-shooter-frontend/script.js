// 3D Neon Zombie Shooter - Core Game Engine

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmOsc = null;
        this.bgmGain = null;
        this.bgmInterval = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.startBGM();
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.ctx) {
            if (this.muted) {
                this.ctx.suspend();
            } else {
                this.ctx.resume();
            }
        }
    }

    play(type) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch(type) {
            case 'laser':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'hit':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(150, now + 0.03);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'explosion':
                // Procedural noise explosion
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.linearRampToValueAtTime(30, now + 0.35);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
            case 'collect':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
                break;
            case 'dash':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'hurt':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.setValueAtTime(90, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'levelClear':
                osc.type = 'sine';
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Major
                notes.forEach((freq, idx) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.setValueAtTime(freq, now + idx * 0.12);
                    g.gain.setValueAtTime(0.12, now + idx * 0.12);
                    g.gain.linearRampToValueAtTime(0, now + idx * 0.12 + 0.4);
                    o.start(now + idx * 0.12);
                    o.stop(now + idx * 0.12 + 0.4);
                });
                break;
            case 'gameOver':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.7);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.7);
                osc.start(now);
                osc.stop(now + 0.7);
                break;
        }
    }

    startBGM() {
        if (!this.ctx || this.bgmInterval) return;
        
        let step = 0;
        // Simple bass progression: A -> F -> C -> G
        const basslines = [
            [110, 110, 110, 110], // A2
            [87.31, 87.31, 87.31, 87.31], // F2
            [130.81, 130.81, 130.81, 130.81], // C3
            [98, 98, 98, 98] // G2
        ];

        this.bgmInterval = setInterval(() => {
            if (this.muted) return;
            const now = this.ctx.currentTime;
            
            const chordIdx = Math.floor(step / 4) % basslines.length;
            const noteIdx = step % 4;
            const freq = basslines[chordIdx][noteIdx];

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            
            osc.start(now);
            osc.stop(now + 0.25);
            
            step++;
        }, 250); // 120 BPM quarter notes
    }
}

const LEVEL_THEMES = [
    // Level 1 Theme: Cyan/Pink (Cyber Alleys)
    {
        wallBase: '#080812',
        wallGlow: '#00ffff',
        zombieBase: '#051208',
        zombieGlow: '#39ff14',
        playerBase: '#12050e',
        playerGlow: '#ff007c',
        gridPrimary: '#00ffff',
        gridSecondary: '#004444',
        dirLight: '#ff0055'
    },
    // Level 2 Theme: Orange/Purple/Cyan (Neon Labs)
    {
        wallBase: '#140505',
        wallGlow: '#ff3c00',
        zombieBase: '#0d0514',
        zombieGlow: '#b800ff',
        playerBase: '#051212',
        playerGlow: '#00ffff',
        gridPrimary: '#ff3c00',
        gridSecondary: '#441100',
        dirLight: '#ffaa00'
    },
    // Level 3 Theme: Green/Cyan/Yellow (Mainframe Core)
    {
        wallBase: '#051205',
        wallGlow: '#39ff14',
        zombieBase: '#051212',
        zombieGlow: '#00ffff',
        playerBase: '#141405',
        playerGlow: '#ffe600',
        gridPrimary: '#39ff14',
        gridSecondary: '#004400',
        dirLight: '#00aaff'
    }
];

class ZombieGame {
    constructor() {
        this.gameMode = 'classic';
        this.gameRunning = false;
        this.isPaused = false;
        this.level = 0;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        
        // Dash properties
        this.dashCooldown = 0; // cooldown timer
        this.dashDurationLeft = 0; // active duration
        this.dashVelocity = new THREE.Vector3();

        this.gridSize = 1;
        this.grid = [];
        this.walls = [];
        this.zombies = [];
        this.bullets = [];
        this.pickups = [];
        this.spawners = [];
        this.particles = [];
        this.exitPortal = null;
        
        // Spawn control
        this.lastSpawnTime = 0;
        this.spawnInterval = 2800; // ms
        this.zombiesKilled = 0;
        this.zombiesRequired = 10;

        // Visual effects
        this.cameraShake = new THREE.Vector3();
        this.muzzleFlashIntensity = 0;
        this.muzzleFlash = null;
        
        this.keys = {};
        this.mouse = new THREE.Vector2();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Flat height plane
        this.raycaster = new THREE.Raycaster();

        // Mobile joystick vectors
        this.leftJoystickVector = new THREE.Vector2();
        this.rightJoystickVector = new THREE.Vector2();
        this.isMobile = false;

        this.sfx = new SoundSynth();
    }

    async init() {
        this.sfx.init();
        this.isMobile = window.innerWidth <= 768;
        
        this.setupThree();
        this.setupInput();
        this.setupUI();
        
        await this.loadLevel(0);
        
        this.gameRunning = true;
        this.animate(0);
    }

    setupThree() {
        const container = document.getElementById('canvas-wrapper');
        container.innerHTML = ''; // clear

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#030306');
        this.scene.fog = new THREE.FogExp2('#030306', 0.04);

        // Target camera position relative to player
        this.cameraOffset = new THREE.Vector3(0, 18, 9);
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.copy(this.cameraOffset);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight('#121225', 0.7);
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight('#ff0055', 0.8);
        this.dirLight.position.set(20, 40, 20);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 100;
        const d = 25;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.scene.add(this.dirLight);

        // Grid floor helper for visual look - make the grid lines bright neon teal for clear navigation visibility
        this.gridHelper = new THREE.GridHelper(100, 50, '#00ffff', '#004444');
        this.gridHelper.position.y = -0.01;
        this.scene.add(this.gridHelper);
    }

    setupInput() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            if (key === 'shift' && this.dashCooldown <= 0) {
                this.triggerDash();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse aiming
        window.addEventListener('mousemove', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        // Shooting inputs
        window.addEventListener('mousedown', (e) => {
            if (!this.gameRunning || this.isPaused) return;
            if (e.button === 0) {
                this.shootBullet();
            } else if (e.button === 2 && this.dashCooldown <= 0) {
                this.triggerDash();
            }
        });

        // Touch Joysticks
        if (this.isMobile) {
            this.bindJoystick('joystick-left', this.leftJoystickVector);
            this.bindJoystick('joystick-right', this.rightJoystickVector);
        }
    }

    bindJoystick(elementId, vectorOut) {
        const el = document.getElementById(elementId);
        const handle = el.querySelector('.joystick-handle');
        const radius = el.clientWidth / 2;

        let activeTouchId = null;

        const onTouchStart = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (activeTouchId === null) {
                    activeTouchId = touch.identifier;
                    updateHandle(touch.clientX, touch.clientY);
                    break;
                }
            }
        };

        const onTouchMove = (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (touch.identifier === activeTouchId) {
                    updateHandle(touch.clientX, touch.clientY);
                    break;
                }
            }
        };

        const onTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === activeTouchId) {
                    activeTouchId = null;
                    handle.style.transform = 'translate(-50%, -50%)';
                    vectorOut.set(0, 0);
                    break;
                }
            }
        };

        const updateHandle = (clientX, clientY) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + radius;
            const centerY = rect.top + radius;

            let dx = clientX - centerX;
            let dy = clientY - centerY;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius) {
                dx = (dx / dist) * radius;
                dy = (dy / dist) * radius;
            }

            handle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            vectorOut.set(dx / radius, -dy / radius); // Flip Y to match standard Cartesian coordinates
        };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    setupUI() {
        document.getElementById('pause-btn').onclick = () => this.togglePause();
        document.getElementById('resume-btn').onclick = () => this.togglePause();
        document.getElementById('mute-btn').onclick = () => {
            this.sfx.muted = !this.sfx.muted;
            this.sfx.setMuted(this.sfx.muted);
            document.getElementById('mute-btn').textContent = this.sfx.muted ? '🔇' : '🔊';
        };

        const exitToHub = () => {
            this.sfx.play('collect');
            if (window.top !== window.self) {
                window.top.location.href = '../index.html';
            } else {
                window.location.href = '../index.html';
            }
        };
        document.getElementById('pause-exit-btn').onclick = exitToHub;
        document.getElementById('over-exit-btn').onclick = exitToHub;

        document.getElementById('retry-btn').onclick = () => this.resetLevel();
        document.getElementById('next-btn').onclick = () => this.nextLevel();

        // Share Buttons
        document.getElementById('over-share-wa').onclick = () => {
            const text = `I scored ${this.score} in Neon Zombie Shooter on Arcade Hub! Can you beat my record?`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        };
        document.getElementById('over-share-x').onclick = () => {
            const text = `Just scored ${this.score} in 3D Neon Zombie Shooter on Arcade Hub! 🔥 #HTML5 #Gaming`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        };
    }

    async loadLevel(levelIndex) {
        this.level = levelIndex % GAME_MAPS.length;
        const levelData = GAME_MAPS[this.level];
        this.grid = levelData.grid;
        this.gridSize = this.grid.length;

        // Reset game list arrays
        this.walls.forEach(w => this.scene.remove(w));
        this.zombies.forEach(z => this.scene.remove(z.mesh));
        this.bullets.forEach(b => this.scene.remove(b.mesh));
        this.pickups.forEach(p => this.scene.remove(p.mesh));
        this.spawners = [];
        this.walls = [];
        this.zombies = [];
        this.bullets = [];
        this.pickups = [];

        // Level requirements
        this.zombiesKilled = 0;
        this.zombiesRequired = 8 + this.level * 6;
        this.spawnInterval = Math.max(1200, 2600 - this.level * 400);

        this.updateHUD();

        // Create player and map elements
        const theme = LEVEL_THEMES[this.level];

        // Recreate floor grid helper with theme colors
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
        this.gridHelper = new THREE.GridHelper(100, 50, theme.gridPrimary, theme.gridSecondary);
        this.gridHelper.position.y = -0.01;
        this.scene.add(this.gridHelper);

        // Update lighting colors
        if (this.dirLight) {
            this.dirLight.color.set(theme.dirLight);
        }

        const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: theme.wallBase,
            emissive: theme.wallGlow,
            emissiveIntensity: 0.05,
            shininess: 15
        });

        // Custom glow overlay for neon aesthetic edges
        const glowMaterial = new THREE.LineBasicMaterial({ color: theme.wallGlow });

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const val = this.grid[r][c];
                // World coordinates: grid center is at (0,0)
                const x = c - this.gridSize / 2 + 0.5;
                const z = r - this.gridSize / 2 + 0.5;

                if (val === 1 || val === 2) {
                    // Wall
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, 1, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    this.scene.add(wall);
                    this.walls.push(wall);

                    // Emissive wire outline helper
                    const edges = new THREE.EdgesGeometry(wallGeometry);
                    const line = new THREE.LineSegments(edges, glowMaterial);
                    line.position.copy(wall.position);
                    this.scene.add(line);
                    this.walls.push(line); // push outline to walls to clean up together
                } else if (val === 3) {
                    // Spawner vent location
                    this.spawners.push({ x, z });
                    
                    // Simple vent ring
                    const ringGeom = new THREE.RingGeometry(0.4, 0.48, 16);
                    const ringMat = new THREE.MeshBasicMaterial({ color: '#ff2d78', side: THREE.DoubleSide });
                    const vent = new THREE.Mesh(ringGeom, ringMat);
                    vent.rotation.x = Math.PI / 2;
                    vent.position.set(x, 0.02, z);
                    this.scene.add(vent);
                } else if (val === 4) {
                    // Player starting point
                    this.spawnPlayer(x, z);
                } else if (val === 5) {
                    // Exit Portal point
                    this.spawnPortal(x, z);
                }
            }
        }

        // Muzzle Flash pointlight setup (mounted to gun tip)
        if (!this.muzzleFlash) {
            this.muzzleFlash = new THREE.PointLight(theme.playerGlow, 0, 5);
            this.scene.add(this.muzzleFlash);
        } else {
            this.muzzleFlash.color.set(theme.playerGlow);
        }
    }

    spawnPlayer(x, z) {
        if (this.player) {
            this.scene.remove(this.player);
        }

        const theme = LEVEL_THEMES[this.level];

        // Create player Group to assemble humanoid voxel cyborg
        this.player = new THREE.Group();
        this.player.position.set(x, 0.0, z); // base on ground
        this.scene.add(this.player);

        const outlineMaterial = new THREE.LineBasicMaterial({ color: theme.playerGlow });

        // 1. Torso
        const torsoGeom = new THREE.BoxGeometry(0.5, 0.7, 0.3);
        const torsoMat = new THREE.MeshPhongMaterial({
            color: theme.playerBase,
            emissive: theme.playerGlow,
            emissiveIntensity: 0.15,
            shininess: 30
        });
        const torso = new THREE.Mesh(torsoGeom, torsoMat);
        torso.position.y = 0.85; // centered vertically
        torso.castShadow = true;
        this.player.add(torso);
        torso.add(new THREE.LineSegments(new THREE.EdgesGeometry(torsoGeom), outlineMaterial));

        // 2. Head
        const headGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const headMat = new THREE.MeshPhongMaterial({
            color: theme.playerBase,
            emissive: theme.playerGlow,
            emissiveIntensity: 0.1,
            shininess: 30
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.35;
        head.castShadow = true;
        this.player.add(head);
        head.add(new THREE.LineSegments(new THREE.EdgesGeometry(headGeom), outlineMaterial));

        // Visor glow
        const visorGeometry = new THREE.BoxGeometry(0.24, 0.08, 0.32);
        const visorMaterial = new THREE.MeshBasicMaterial({ color: theme.playerGlow });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 0.04, 0.12);
        head.add(visor);

        // 3. Legs
        const legGeom = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        const legMat = new THREE.MeshPhongMaterial({
            color: theme.playerBase,
            emissive: theme.playerGlow,
            emissiveIntensity: 0.08,
            shininess: 20
        });
        
        const leftLeg = new THREE.Mesh(legGeom, legMat);
        leftLeg.position.set(-0.15, 0.25, 0);
        leftLeg.castShadow = true;
        this.player.add(leftLeg);
        leftLeg.add(new THREE.LineSegments(new THREE.EdgesGeometry(legGeom), outlineMaterial));

        const rightLeg = new THREE.Mesh(legGeom, legMat);
        rightLeg.position.set(0.15, 0.25, 0);
        rightLeg.castShadow = true;
        this.player.add(rightLeg);
        rightLeg.add(new THREE.LineSegments(new THREE.EdgesGeometry(legGeom), outlineMaterial));

        // 4. Arms
        const armGeom = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const armMat = new THREE.MeshPhongMaterial({
            color: theme.playerBase,
            emissive: theme.playerGlow,
            emissiveIntensity: 0.08,
            shininess: 20
        });

        const leftArm = new THREE.Mesh(armGeom, armMat);
        leftArm.position.set(-0.35, 0.85, 0);
        leftArm.castShadow = true;
        this.player.add(leftArm);
        leftArm.add(new THREE.LineSegments(new THREE.EdgesGeometry(armGeom), outlineMaterial));

        const rightArm = new THREE.Mesh(armGeom, armMat);
        rightArm.position.set(0.35, 0.85, 0);
        rightArm.castShadow = true;
        this.player.add(rightArm);
        rightArm.add(new THREE.LineSegments(new THREE.EdgesGeometry(armGeom), outlineMaterial));

        // 5. Blaster Gun Cylinder (mounted forward on player torso level)
        const gunGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
        gunGeometry.rotateX(Math.PI / 2);
        const gunMaterial = new THREE.MeshPhongMaterial({
            color: theme.playerBase,
            emissive: theme.playerGlow,
            emissiveIntensity: 0.3,
            shininess: 20
        });
        this.gun = new THREE.Mesh(gunGeometry, gunMaterial);
        this.gun.position.set(0.24, 0.85, 0.4);
        this.player.add(this.gun);
        this.gun.add(new THREE.LineSegments(new THREE.EdgesGeometry(gunGeometry), outlineMaterial));

        // Add player headlight/glow point light that casts colored light on surrounding walls/zombies
        this.playerLight = new THREE.PointLight(theme.playerGlow, 1.8, 8.0);
        this.playerLight.position.set(0, 1.0, 0);
        this.player.add(this.playerLight);
    }

    spawnPortal(x, z) {
        if (this.exitPortal) {
            this.scene.remove(this.exitPortal.mesh);
        }

        const geom = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32);
        const mat = new THREE.MeshBasicMaterial({ color: '#ffe600', wireframe: true });
        const portalMesh = new THREE.Mesh(geom, mat);
        portalMesh.position.set(x, 0.07, z);
        this.scene.add(portalMesh);

        // Inner glowing core
        const coreGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: '#ff2d78', transparent: true, opacity: 0.25 });
        const core = new THREE.Mesh(coreGeom, coreMat);
        core.position.y = 0.05;
        portalMesh.add(core);

        this.exitPortal = {
            mesh: portalMesh,
            x,
            z,
            active: false
        };
    }

    spawnZombie() {
        if (this.spawners.length === 0) return;
        const spawner = this.spawners[Math.floor(Math.random() * this.spawners.length)];

        const theme = LEVEL_THEMES[this.level];

        // Create zombie Group to assemble humanoid voxel zombie
        const mesh = new THREE.Group();
        mesh.position.set(spawner.x, 0.0, spawner.z); // base on ground
        this.scene.add(mesh);

        const outlineMaterial = new THREE.LineBasicMaterial({ color: theme.zombieGlow });

        // 1. Torso
        const torsoGeom = new THREE.BoxGeometry(0.46, 0.66, 0.28);
        const torsoMat = new THREE.MeshPhongMaterial({
            color: theme.zombieBase,
            emissive: theme.zombieGlow,
            emissiveIntensity: 0.15,
            shininess: 10
        });
        const torso = new THREE.Mesh(torsoGeom, torsoMat);
        torso.name = 'torso';
        torso.position.y = 0.8;
        torso.castShadow = true;
        mesh.add(torso);
        torso.add(new THREE.LineSegments(new THREE.EdgesGeometry(torsoGeom), outlineMaterial));

        // 2. Head
        const headGeom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
        const headMat = new THREE.MeshPhongMaterial({
            color: theme.zombieBase,
            emissive: theme.zombieGlow,
            emissiveIntensity: 0.1,
            shininess: 10
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.name = 'head';
        head.position.y = 1.27;
        head.castShadow = true;
        mesh.add(head);
        head.add(new THREE.LineSegments(new THREE.EdgesGeometry(headGeom), outlineMaterial));

        // Visor/Eye glow
        const eyeGeom = new THREE.BoxGeometry(0.24, 0.08, 0.3);
        const eyeMat = new THREE.MeshBasicMaterial({ color: theme.zombieGlow });
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.name = 'eye';
        eye.position.set(0, 0.04, 0.1);
        head.add(eye);

        // 3. Legs
        const legGeom = new THREE.BoxGeometry(0.16, 0.46, 0.16);
        const legMat = new THREE.MeshPhongMaterial({
            color: theme.zombieBase,
            emissive: theme.zombieGlow,
            emissiveIntensity: 0.08,
            shininess: 10
        });

        const leftLeg = new THREE.Mesh(legGeom, legMat);
        leftLeg.name = 'leftLeg';
        leftLeg.position.set(-0.14, 0.23, 0);
        leftLeg.castShadow = true;
        mesh.add(leftLeg);
        leftLeg.add(new THREE.LineSegments(new THREE.EdgesGeometry(legGeom), outlineMaterial));

        const rightLeg = new THREE.Mesh(legGeom, legMat);
        rightLeg.name = 'rightLeg';
        rightLeg.position.set(0.14, 0.23, 0);
        rightLeg.castShadow = true;
        mesh.add(rightLeg);
        rightLeg.add(new THREE.LineSegments(new THREE.EdgesGeometry(legGeom), outlineMaterial));

        // 4. Zombie arms reaching forward!
        const armGeom = new THREE.BoxGeometry(0.14, 0.14, 0.5);
        const armMat = new THREE.MeshPhongMaterial({
            color: theme.zombieBase,
            emissive: theme.zombieGlow,
            emissiveIntensity: 0.08,
            shininess: 10
        });

        const leftArm = new THREE.Mesh(armGeom, armMat);
        leftArm.name = 'leftArm';
        leftArm.position.set(-0.3, 0.9, 0.2);
        leftArm.castShadow = true;
        mesh.add(leftArm);
        leftArm.add(new THREE.LineSegments(new THREE.EdgesGeometry(armGeom), outlineMaterial));

        const rightArm = new THREE.Mesh(armGeom, armMat);
        rightArm.name = 'rightArm';
        rightArm.position.set(0.3, 0.9, 0.2);
        rightArm.castShadow = true;
        mesh.add(rightArm);
        rightArm.add(new THREE.LineSegments(new THREE.EdgesGeometry(armGeom), outlineMaterial));

        // Add theme-colored glow point light to zombie
        const zombieLight = new THREE.PointLight(theme.zombieGlow, 1.2, 5.0);
        zombieLight.position.set(0, 0.8, 0);
        mesh.add(zombieLight);

        // Health scale factor (zombies get slightly tougher each level)
        const maxHp = 1 + this.level;
        this.zombies.push({
            mesh,
            hp: maxHp,
            maxHp: maxHp,
            speed: 1.8 + this.level * 0.25,
            lastAttackTime: 0
        });

        // Play zombie roar hum
        this.sfx.play('hit');
    }

    shootBullet() {
        if (this.ammo <= 0) {
            this.sfx.play('hurt');
            return;
        }

        this.ammo--;
        this.updateHUD();

        // Calculate aim direction vector
        let targetDir = new THREE.Vector3();
        if (this.isMobile && this.rightJoystickVector.length() > 0.1) {
            targetDir.set(this.rightJoystickVector.x, 0, -this.rightJoystickVector.y).normalize();
        } else {
            // Find intersection on ground height plane
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.plane, intersectPoint);
            targetDir.subVectors(intersectPoint, this.player.position);
            targetDir.y = 0;
            targetDir.normalize();
        }

        // Rotate player to face target direction
        const angle = Math.atan2(targetDir.x, targetDir.z);
        this.player.rotation.y = angle;

        const theme = LEVEL_THEMES[this.level];

        // Bullet projectile mesh setup - double the size for high visibility on mobile screens
        const bulletGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
        bulletGeom.rotateX(Math.PI / 2);
        const bulletMat = new THREE.MeshBasicMaterial({ color: theme.playerGlow });
        const bulletMesh = new THREE.Mesh(bulletGeom, bulletMat);
        
        // Spawn slightly forward from the gun tip coordinate
        const bulletPos = new THREE.Vector3(0.24, 0, 0.8).applyMatrix4(this.player.matrixWorld);
        bulletMesh.position.copy(bulletPos);
        bulletMesh.rotation.copy(this.player.rotation);
        this.scene.add(bulletMesh);

        this.bullets.push({
            mesh: bulletMesh,
            dir: targetDir.clone(),
            speed: 16
        });

        // Add physical muzzle flash mesh for direct visual impact
        const flashGeom = new THREE.SphereGeometry(0.25, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: theme.playerGlow });
        const flashMesh = new THREE.Mesh(flashGeom, flashMat);
        flashMesh.position.copy(bulletPos);
        this.scene.add(flashMesh);
        
        // Add particle with short life to animate decay in loop
        this.particles.push({
            mesh: flashMesh,
            vel: new THREE.Vector3(0, 0, 0),
            life: 0.08 // 80ms flash duration
        });

        // Trigger flash point light
        this.muzzleFlashIntensity = 3.5;
        this.muzzleFlash.color.set(theme.playerGlow);
        this.muzzleFlash.position.copy(bulletPos);

        this.sfx.play('laser');
    }

    triggerDash() {
        this.sfx.play('dash');
        
        // Find direction of dash
        let dashDir = new THREE.Vector3();
        if (this.isMobile && this.leftJoystickVector.length() > 0.1) {
            dashDir.set(this.leftJoystickVector.x, 0, -this.leftJoystickVector.y).normalize();
        } else {
            if (this.keys['w'] || this.keys['arrowup']) dashDir.z -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) dashDir.z += 1;
            if (this.keys['a'] || this.keys['arrowleft']) dashDir.x -= 1;
            if (this.keys['d'] || this.keys['arrowright']) dashDir.x += 1;
        }

        if (dashDir.length() === 0) {
            // Default to where player is looking
            dashDir.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y).normalize();
        } else {
            dashDir.normalize();
        }

        this.dashDurationLeft = 0.15; // 150ms dash burst
        this.dashCooldown = 1.8; // 1.8 seconds cooldown
        this.dashVelocity.copy(dashDir).multiplyScalar(22); // High velocity vector
    }

    spawnSparks(x, y, z, color, count = 6) {
        // Larger spark size for high visibility on mobile screens
        const geom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        const mat = new THREE.MeshBasicMaterial({ color });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 6,
                    Math.random() * 5 + 2,
                    (Math.random() - 0.5) * 6
                ),
                life: 0.4 // 400ms life
            });
        }
    }

    spawnPickup(x, z) {
        // 25% chance to drop Ammo (Blue) or Health (Green)
        if (Math.random() > 0.28) return;

        const theme = LEVEL_THEMES[this.level];
        const type = Math.random() > 0.4 ? 'ammo' : 'health';
        const color = type === 'ammo' ? theme.playerGlow : theme.zombieGlow;

        const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = new THREE.MeshPhongMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.6,
            shininess: 30
        });
        const mesh = new THREE.Mesh(geom, mat);

        // Add outline to pickups for neon gem look
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
        mesh.add(line);
        mesh.position.set(x, 0.3, z);
        this.scene.add(mesh);

        this.pickups.push({
            mesh,
            type,
            x,
            z,
            time: 0
        });
    }

    animate(timestamp) {
        if (!this.gameRunning) return;
        requestAnimationFrame((t) => this.animate(t));

        if (this.isPaused) return;

        const delta = Math.min(0.1, (timestamp - this.lastTime) / 1000) || 0.016;
        this.lastTime = timestamp;

        this.updatePlayer(delta);
        this.updateZombies(delta, timestamp);
        this.updateProjectiles(delta);
        this.updateFX(delta);
        
        this.renderer.render(this.scene, this.camera);
    }

    updatePlayer(delta) {
        // Cooldown updates
        if (this.dashCooldown > 0) {
            this.dashCooldown -= delta;
            const progress = Math.max(0, Math.min(100, (1 - (this.dashCooldown / 1.8)) * 100));
            document.getElementById('dash-bar').style.width = progress + '%';
        }

        let moveDir = new THREE.Vector3();
        
        if (this.dashDurationLeft > 0) {
            // Underactive dash state
            moveDir.copy(this.dashVelocity);
            this.dashDurationLeft -= delta;
            
            // Spawn short dash trace particles
            if (Math.random() > 0.5) {
                this.spawnSparks(this.player.position.x, this.player.position.y, this.player.position.z, '#ff2d78', 2);
            }
        } else {
            // Standard keyboard movement inputs
            if (this.isMobile) {
                if (this.leftJoystickVector.length() > 0.1) {
                    moveDir.set(this.leftJoystickVector.x, 0, -this.leftJoystickVector.y);
                }
            } else {
                if (this.keys['w'] || this.keys['arrowup']) moveDir.z -= 1;
                if (this.keys['s'] || this.keys['arrowdown']) moveDir.z += 1;
                if (this.keys['a'] || this.keys['arrowleft']) moveDir.x -= 1;
                if (this.keys['d'] || this.keys['arrowright']) moveDir.x += 1;
            }

            if (moveDir.length() > 0) {
                moveDir.normalize().multiplyScalar(4.2); // Base speed
            }

            // Aim look rotation (Auto-firing mapping for mobile)
            if (this.isMobile) {
                if (this.rightJoystickVector.length() > 0.2) {
                    const aimAngle = Math.atan2(this.rightJoystickVector.x, -this.rightJoystickVector.y);
                    this.player.rotation.y = aimAngle;
                    
                    // Periodic auto shoot
                    if (!this.lastAutoShoot || timestamp - this.lastAutoShoot > 220) {
                        this.shootBullet();
                        this.lastAutoShoot = timestamp;
                    }
                } else if (moveDir.length() > 0) {
                    // Face movement direction if not actively aiming
                    this.player.rotation.y = Math.atan2(moveDir.x, moveDir.z);
                }
            } else {
                // Raycast mouse collision plane to rotate player towards cursor on desktops
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersect = new THREE.Vector3();
                if (this.raycaster.ray.intersectPlane(this.plane, intersect)) {
                    const dx = intersect.x - this.player.position.x;
                    const dz = intersect.z - this.player.position.z;
                    this.player.rotation.y = Math.atan2(dx, dz);
                }
            }
        }

        // Apply movement velocity with slide-collisions check
        const nextX = this.player.position.x + moveDir.x * delta;
        const nextZ = this.player.position.z + moveDir.z * delta;

        // Grid boundaries check
        const limit = this.gridSize / 2 - 0.5;
        let finalX = Math.max(-limit, Math.min(limit, nextX));
        let finalZ = Math.max(-limit, Math.min(limit, nextZ));

        // Slide wall collision detection (AABB vs bounding circle)
        const playerRadius = 0.30;
        for (let i = 0; i < this.walls.length; i += 2) { // iterate by 2 because of outline segments
            const wall = this.walls[i];
            const wx = wall.position.x;
            const wz = wall.position.z;

            // Simple distance check
            const dx = Math.abs(finalX - wx);
            const dz = Math.abs(finalZ - wz);

            if (dx < 0.5 + playerRadius && dz < 0.5 + playerRadius) {
                // Collision! Slide along the non-colliding axis
                if (Math.abs(this.player.position.x - wx) >= 0.5 + playerRadius) {
                    finalX = this.player.position.x; // Block X movement
                } else {
                    finalZ = this.player.position.z; // Block Z movement
                }
            }
        }

        this.player.position.x = finalX;
        this.player.position.z = finalZ;

        // Camera follow with lag interpolation (lerp)
        const targetCamPos = this.player.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetCamPos, 0.08);
        
        // Apply camera shake decay
        this.cameraShake.multiplyScalar(0.9);
        this.camera.position.add(this.cameraShake);
        
        this.camera.lookAt(this.player.position);

        // Pickups intersection checks
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            const dist = this.player.position.distanceTo(pickup.mesh.position);
            if (dist < 0.8) {
                this.sfx.play('collect');
                if (pickup.type === 'ammo') {
                    this.ammo = Math.min(this.maxAmmo, this.ammo + 10);
                } else if (pickup.type === 'health') {
                    this.health = Math.min(this.maxHealth, this.health + 25);
                }
                this.updateHUD();
                
                // Remove pickup
                this.scene.remove(pickup.mesh);
                this.pickups.splice(i, 1);
            }
        }

        // Win Destination portal checks
        if (this.exitPortal && this.exitPortal.active) {
            const dist = this.player.position.distanceTo(this.exitPortal.mesh.position);
            if (dist < 0.9) {
                this.handleWin();
            }
        }
    }

    updateZombies(delta, timestamp) {
        // Spawning zombies periodically
        if (this.gameRunning && this.zombiesKilled < this.zombiesRequired) {
            const timeSinceLastSpawn = Date.now() - this.lastSpawnTime;
            if (timeSinceLastSpawn > this.spawnInterval && this.zombies.length < 12) {
                this.spawnZombie();
                this.lastSpawnTime = Date.now();
            }
        }

        // Activate portal when required kills achieved
        if (this.zombiesKilled >= this.zombiesRequired && this.exitPortal && !this.exitPortal.active) {
            const theme = LEVEL_THEMES[this.level];
            this.exitPortal.active = true;
            this.exitPortal.mesh.material.color.set(theme.playerGlow); // Glow player color when active
            document.getElementById('direction-arrow-hud').classList.remove('hidden');
            this.sfx.play('levelClear');
        }

        // Update each zombie
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];

            // Direction to player
            const dir = new THREE.Vector3().subVectors(this.player.position, zombie.mesh.position);
            dir.y = 0;
            const dist = dir.length();

            // Rotate zombie to face player
            zombie.mesh.rotation.y = Math.atan2(dir.x, dir.z);

            // Move zombie forward
            if (dist > 0.4) {
                dir.normalize();
                
                // Steering raycast to slide around walls
                let steerDir = dir.clone();
                for (let j = 0; j < this.walls.length; j += 2) {
                    const wall = this.walls[j];
                    const wDist = zombie.mesh.position.distanceTo(wall.position);
                    if (wDist < 1.35) {
                        // Nudge away from wall
                        const avoidVec = new THREE.Vector3().subVectors(zombie.mesh.position, wall.position).normalize();
                        steerDir.add(avoidVec.multiplyScalar(0.7)).normalize();
                    }
                }

                // Axis slide updates
                const nextX = zombie.mesh.position.x + steerDir.x * zombie.speed * delta;
                const nextZ = zombie.mesh.position.z + steerDir.z * zombie.speed * delta;

                // Wall bounds checks for zombie
                let allowedX = nextX;
                let allowedZ = nextZ;
                const zRadius = 0.28;

                for (let j = 0; j < this.walls.length; j += 2) {
                    const wall = this.walls[j];
                    const dx = Math.abs(allowedX - wall.position.x);
                    const dz = Math.abs(allowedZ - wall.position.z);
                    if (dx < 0.5 + zRadius && dz < 0.5 + zRadius) {
                        if (Math.abs(zombie.mesh.position.x - wall.position.x) >= 0.5 + zRadius) {
                            allowedX = zombie.mesh.position.x;
                        } else {
                            allowedZ = zombie.mesh.position.z;
                        }
                    }
                }

                zombie.mesh.position.x = allowedX;
                zombie.mesh.position.z = allowedZ;
            }

            // Damage player on touch
            if (dist < 0.72) {
                const now = Date.now();
                if (now - zombie.lastAttackTime > 900) { // attack rate limit (900ms)
                    zombie.lastAttackTime = now;
                    this.damagePlayer(10);
                }
            }
        }
    }

    updateProjectiles(delta) {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.mesh.position.addScaledVector(bullet.dir, bullet.speed * delta);

            // Boundaries check
            const limit = this.gridSize / 2;
            if (Math.abs(bullet.mesh.position.x) > limit || Math.abs(bullet.mesh.position.z) > limit) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
                continue;
            }

            let bulletHit = false;

            // Collision check: bullet vs walls
            for (let j = 0; j < this.walls.length; j += 2) {
                const wall = this.walls[j];
                const dx = Math.abs(bullet.mesh.position.x - wall.position.x);
                const dz = Math.abs(bullet.mesh.position.z - wall.position.z);

                if (dx < 0.5 && dz < 0.5) {
                    const theme = LEVEL_THEMES[this.level];
                    this.spawnSparks(bullet.mesh.position.x, bullet.mesh.position.y, bullet.mesh.position.z, theme.wallGlow, 4);
                    this.sfx.play('hit');
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    bulletHit = true;
                    break;
                }
            }

            if (bulletHit) continue;

            // Collision check: bullet vs zombies
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                const dist = bullet.mesh.position.distanceTo(zombie.mesh.position);

                if (dist < 0.65) {
                    const theme = LEVEL_THEMES[this.level];
                    // Reduce zombie health
                    zombie.hp--;
                    this.spawnSparks(bullet.mesh.position.x, bullet.mesh.position.y, bullet.mesh.position.z, theme.zombieGlow, 5);
                    this.sfx.play('hit');

                    // Hit flash effect - traverse group meshes to flash all voxel parts
                    zombie.mesh.traverse(child => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissive.set('#ffffff');
                            child.material.emissiveIntensity = 0.9;
                        }
                    });
                    setTimeout(() => {
                        if (zombie.mesh) {
                            zombie.mesh.traverse(child => {
                                if (child.isMesh && child.material && child.material.emissive) {
                                    child.material.emissive.set(theme.zombieGlow);
                                    child.material.emissiveIntensity = (child.name === 'eye') ? 1.0 : 0.5;
                                }
                            });
                        }
                    }, 80);

                    // Clean up bullet
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    bulletHit = true;

                    // Handle zombie death
                    if (zombie.hp <= 0) {
                        this.score += 100;
                        this.zombiesKilled++;
                        this.updateHUD();
                        this.sfx.play('explosion');
                        this.spawnSparks(zombie.mesh.position.x, zombie.mesh.position.y, zombie.mesh.position.z, theme.zombieGlow, 16);
                        
                        // Drop pickup ammo/medkits
                        this.spawnPickup(zombie.mesh.position.x, zombie.mesh.position.z);

                        this.scene.remove(zombie.mesh);
                        this.zombies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }

    updateFX(delta) {
        // Muzzle flash decay
        if (this.muzzleFlashIntensity > 0) {
            this.muzzleFlashIntensity -= delta * 12;
            this.muzzleFlash.intensity = Math.max(0, this.muzzleFlashIntensity);
        }

        // Particle updates
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.addScaledVector(p.vel, delta);
            p.vel.y -= 9.8 * delta; // apply gravity
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Exit Portal rotations
        if (this.exitPortal) {
            this.exitPortal.mesh.rotation.y += delta * 1.5;
            this.exitPortal.mesh.children.forEach(c => c.rotation.y -= delta * 3.0);
        }

        // Pickup floating / spinning animations
        this.pickups.forEach(p => {
            p.time += delta;
            p.mesh.rotation.y += delta * 2;
            p.mesh.position.y = 0.3 + Math.sin(p.time * 4) * 0.08;
        });

        // Exit portal direction helper arrow positioning
        if (this.exitPortal && this.exitPortal.active) {
            const arrowEl = document.querySelector('#direction-arrow-hud .arrow');
            
            // Calculate angle from player to portal relative to camera orientation
            const pPos = new THREE.Vector2(this.player.position.x, this.player.position.z);
            const ePos = new THREE.Vector2(this.exitPortal.x, this.exitPortal.z);
            const relativeVec = new THREE.Vector2().subVectors(ePos, pPos);
            
            // Get camera heading direction angle
            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            const camAngle = Math.atan2(camDir.x, camDir.z);

            // Vector heading angle
            const vecAngle = Math.atan2(relativeVec.x, relativeVec.y);
            const relativeAngle = vecAngle - camAngle + Math.PI;

            // Rotate HTML Arrow
            if (arrowEl) {
                arrowEl.style.transform = `rotate(${relativeAngle}rad)`;
            }
        }
    }

    damagePlayer(amount) {
        if (this.dashDurationLeft > 0) return; // Invulnerable while dashing!

        this.health = Math.max(0, this.health - amount);
        this.updateHUD();

        // Shake camera
        this.cameraShake.set(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 1.2
        );

        this.sfx.play('hurt');

        if (this.health <= 0) {
            this.handleGameOver();
        }
    }

    updateHUD() {
        // HP Bar
        const hpPercent = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
        document.getElementById('hp-bar').style.width = hpPercent + '%';

        // Ammo Bar
        const ammoPercent = Math.max(0, Math.min(100, (this.ammo / this.maxAmmo) * 100));
        document.getElementById('ammo-bar').style.width = ammoPercent + '%';
        document.getElementById('ammo-counter').textContent = `${this.ammo}/${this.maxAmmo}`;

        // Score
        document.getElementById('score').textContent = String(this.score).padStart(6, '0');

        // Level Name and Progress
        const levelData = GAME_MAPS[this.level];
        document.getElementById('level-num').textContent = this.level + 1;
        document.getElementById('level-name').textContent = levelData.name;
    }

    togglePause() {
        if (!this.gameRunning) return;
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    handleWin() {
        this.gameRunning = false;
        this.sfx.play('levelClear');
        
        // Calculate scores
        const hpBonus = this.health * 10;
        this.score += 1000 + hpBonus;
        this.updateHUD();

        document.getElementById('level-score').textContent = '1000';
        document.getElementById('hp-bonus').textContent = `+${hpBonus}`;
        document.getElementById('complete-screen').classList.remove('hidden');
    }

    handleGameOver() {
        this.gameRunning = false;
        this.sfx.play('gameOver');
        document.getElementById('over-score').textContent = this.score;
        document.getElementById('over-screen').classList.remove('hidden');
    }

    async nextLevel() {
        document.getElementById('complete-screen').classList.add('hidden');
        document.getElementById('direction-arrow-hud').classList.add('hidden');
        
        this.health = Math.min(this.maxHealth, this.health + 40); // Restore partial health on level clear
        this.ammo = this.maxAmmo; // Reload

        await this.loadLevel(this.level + 1);
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    async resetLevel() {
        document.getElementById('over-screen').classList.add('hidden');
        document.getElementById('direction-arrow-hud').classList.add('hidden');
        
        this.health = this.maxHealth;
        this.ammo = this.maxAmmo;
        this.score = Math.max(0, this.score - 500); // Small score penalty on retry

        await this.loadLevel(this.level);
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }
}

// Global script bindings
let gameInstance = null;
function initGame() {
    if (gameInstance) return;
    gameInstance = new ZombieGame();
    gameInstance.init();
}

window.addEventListener('resize', () => {
    if (gameInstance && gameInstance.renderer) {
        const container = document.getElementById('canvas-wrapper');
        gameInstance.camera.aspect = container.clientWidth / container.clientHeight;
        gameInstance.camera.updateProjectionMatrix();
        gameInstance.renderer.setSize(container.clientWidth, container.clientHeight);
    }
});
