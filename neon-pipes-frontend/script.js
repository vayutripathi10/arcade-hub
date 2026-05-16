/**
 * Neon Pipes - Game Engine
 */

class PipeGame {
    constructor() {
        this.gridSize = 4;
        this.level = 1;
        this.score = 0;
        this.timer = 60;
        this.isPaused = false;
        this.gameRunning = false;
        this.grid = [];
        this.streak = 0;
        this.soundEnabled = true;
        
        this.initUI();
        this.initAudio();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    initUI() {
        this.gridElement = document.getElementById('pipe-grid');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.timerElement = document.getElementById('timer');
        
        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('next-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retry-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
    }

    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = null;
        
        const unlock = () => {
            if (!this.audioCtx) this.audioCtx = new AudioContext();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        };
        window.addEventListener('mousedown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.soundEnabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    sfx = {
        rotate: () => this.playTone(400, 'sine', 0.1, 0.05),
        win: () => {
            this.playTone(523, 'sine', 0.2, 0.1);
            setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 100);
            setTimeout(() => this.playTone(783, 'sine', 0.3, 0.1), 200);
        },
        fail: () => this.playTone(150, 'sawtooth', 0.4, 0.1),
        whoosh: () => this.playTone(200, 'triangle', 0.5, 0.1)
    };

    resize() {
        const container = document.querySelector('.game-container');
        const availableWidth = container.clientWidth - 40;
        const availableHeight = container.clientHeight - 40;
        const size = Math.min(60, availableWidth / this.gridSize, availableHeight / this.gridSize);
        document.documentElement.style.setProperty('--cell-size', `${size}px`);
        this.gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    }

    startGame() {
        document.getElementById('start-screen').classList.remove('active');
        this.gameRunning = true;
        this.isPaused = false;
        this.setupLevel();
        this.gameLoop();
    }

    setupLevel() {
        // Level Configuration
        if (this.level <= 3) { this.gridSize = 4; this.timer = 60; }
        else if (this.level <= 6) { this.gridSize = 5; this.timer = 75; }
        else if (this.level <= 10) { this.gridSize = 6; this.timer = 90; }
        else { this.gridSize = 8; this.timer = 120; }

        this.resize();
        this.generateGrid();
        this.renderGrid();
        this.levelElement.textContent = this.level;
        this.updateHUD();
    }

    generateGrid() {
        this.grid = [];
        // Initialize empty grid
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c] = {
                    type: 'straight',
                    rotation: 0, // 0, 1, 2, 3 (x90 deg)
                    connected: false,
                    r, c
                };
            }
        }

        // 1. Generate Solvable Path using Random Walk
        let current = { r: 0, c: 0 };
        const target = { r: this.gridSize - 1, c: this.gridSize - 1 };
        const path = [current];
        const visited = new Set(['0,0']);

        while (current.r !== target.r || current.c !== target.c) {
            const neighbors = [];
            if (current.r > 0) neighbors.push({ r: current.r - 1, c: current.c, dir: 0 }); // Up
            if (current.c < this.gridSize - 1) neighbors.push({ r: current.r, c: current.c + 1, dir: 1 }); // Right
            if (current.r < this.gridSize - 1) neighbors.push({ r: current.r + 1, c: current.c, dir: 2 }); // Down
            if (current.c > 0) neighbors.push({ r: current.r, c: current.c - 1, dir: 3 }); // Left

            // Prioritize moving towards target
            neighbors.sort((a, b) => {
                const distA = Math.abs(target.r - a.r) + Math.abs(target.c - a.c);
                const distB = Math.abs(target.r - b.r) + Math.abs(target.c - b.c);
                return distA - distB + (Math.random() - 0.5) * 2;
            });

            let moved = false;
            for (const n of neighbors) {
                if (!visited.has(`${n.r},${n.c}`)) {
                    visited.add(`${n.r},${n.c}`);
                    path.push(n);
                    current = n;
                    moved = true;
                    break;
                }
            }
            if (!moved) break; // Trapped (rare for small grids), algorithm would need reset
        }

        // 2. Assign pipe types based on path
        for (let i = 0; i < path.length; i++) {
            const curr = path[i];
            const prev = path[i - 1];
            const next = path[i + 1];
            
            const entries = [];
            if (i === 0) entries.push(3); // Source entry from left
            else entries.push((prev.dir + 2) % 4);

            if (i === path.length - 1) entries.push(1); // Target exit to right
            else entries.push(curr.dir);

            this.assignPipeType(curr.r, curr.c, entries);
        }

        // 3. Fill the rest with random pipes
        const types = ['straight', 'l', 't', 'cross'];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!visited.has(`${r},${c}`)) {
                    this.grid[r][c].type = types[Math.floor(Math.random() * types.length)];
                }
                // Random Shuffle
                this.grid[r][c].rotation = Math.floor(Math.random() * 4);
            }
        }
    }

    assignPipeType(r, c, connections) {
        connections.sort();
        const connStr = connections.join(',');
        
        // Map connections to types and rotations
        const map = {
            '0,2': { type: 'straight', rot: 0 },
            '1,3': { type: 'straight', rot: 1 },
            '0,1': { type: 'l', rot: 0 },
            '1,2': { type: 'l', rot: 1 },
            '2,3': { type: 'l', rot: 2 },
            '0,3': { type: 'l', rot: 3 },
            '0,1,2': { type: 't', rot: 0 },
            '1,2,3': { type: 't', rot: 1 },
            '0,2,3': { type: 't', rot: 2 },
            '0,1,3': { type: 't', rot: 3 },
            '0,1,2,3': { type: 'cross', rot: 0 }
        };

        const config = map[connStr] || { type: 'straight', rot: 0 };
        this.grid[r][c].type = config.type;
        this.grid[r][c].rotation = config.rot;
    }

    renderGrid() {
        this.gridElement.innerHTML = '';
        // Re-add nodes
        const source = document.createElement('div');
        source.className = 'node source-node';
        const dest = document.createElement('div');
        dest.className = 'node dest-node';
        this.gridElement.appendChild(source);
        this.gridElement.appendChild(dest);

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'pipe-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.innerHTML = this.getPipeSVG(this.grid[r][c]);
                cell.style.transform = `rotate(${this.grid[r][c].rotation * 90}deg)`;
                
                cell.addEventListener('click', () => this.rotatePipe(r, c, cell));
                this.gridElement.appendChild(cell);
            }
        }
        this.checkConnections();
    }

    getPipeSVG(pipe) {
        let paths = '';
        if (pipe.type === 'straight') {
            paths = `<path class="pipe-path" d="M 50 0 L 50 100" />
                     <path class="flow-pulse" d="M 50 0 L 50 100" />`;
        } else if (pipe.type === 'l') {
            paths = `<path class="pipe-path" d="M 50 0 Q 50 50 100 50" />
                     <path class="flow-pulse" d="M 50 0 Q 50 50 100 50" />`;
        } else if (pipe.type === 't') {
            paths = `<path class="pipe-path" d="M 50 0 L 50 100 M 50 50 L 100 50" />
                     <path class="flow-pulse" d="M 50 0 L 50 100 M 50 50 L 100 50" />`;
        } else if (pipe.type === 'cross') {
            paths = `<path class="pipe-path" d="M 50 0 L 50 100 M 0 50 L 100 50" />
                     <path class="flow-pulse" d="M 50 0 L 50 100 M 0 50 L 100 50" />`;
        }
        return `<svg viewBox="0 0 100 100" class="pipe-svg">${paths}</svg>`;
    }

    rotatePipe(r, c, element) {
        if (!this.gameRunning || this.isPaused) return;
        this.grid[r][c].rotation = (this.grid[r][c].rotation + 1) % 4;
        element.style.transform = `rotate(${this.grid[r][c].rotation * 90}deg)`;
        this.sfx.rotate();
        this.checkConnections();
    }

    getConnections(pipe) {
        const typeConns = {
            'straight': [0, 2],
            'l': [0, 1],
            't': [0, 1, 2],
            'cross': [0, 1, 2, 3]
        };
        return typeConns[pipe.type].map(dir => (dir + pipe.rotation) % 4);
    }

    checkConnections() {
        // Reset connection status
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c].connected = false;
            }
        }

        const queue = [];
        // Source is at (0,0), entering from Left (dir 3)
        const startPipe = this.grid[0][0];
        if (this.getConnections(startPipe).includes(3)) {
            startPipe.connected = true;
            queue.push({ r: 0, c: 0 });
        }

        while (queue.length > 0) {
            const curr = queue.shift();
            const currPipe = this.grid[curr.r][curr.c];
            const conns = this.getConnections(currPipe);

            const neighbors = [
                { r: curr.r - 1, c: curr.c, dir: 0, opp: 2 }, // Top
                { r: curr.r, c: curr.c + 1, dir: 1, opp: 3 }, // Right
                { r: curr.r + 1, c: curr.c, dir: 2, opp: 0 }, // Bottom
                { r: curr.r, c: curr.c - 1, dir: 3, opp: 1 }  // Left
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < this.gridSize && n.c >= 0 && n.c < this.gridSize) {
                    const nextPipe = this.grid[n.r][n.c];
                    if (!nextPipe.connected && conns.includes(n.dir) && this.getConnections(nextPipe).includes(n.opp)) {
                        nextPipe.connected = true;
                        queue.push({ r: n.r, c: n.c });
                    }
                }
            }
        }

        // Update visuals
        const cells = document.querySelectorAll('.pipe-cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            if (this.grid[r][c].connected) cell.classList.add('connected');
            else cell.classList.remove('connected');
        });

        // Check if destination is reached
        // Dest is at (last, last), exiting to Right (dir 1)
        const endPipe = this.grid[this.gridSize - 1][this.gridSize - 1];
        if (endPipe.connected && this.getConnections(endPipe).includes(1)) {
            this.handleWin();
        }
    }

    handleWin() {
        this.gameRunning = false;
        this.sfx.win();
        this.sfx.whoosh();
        this.gridElement.classList.add('flowing');
        
        const timeBonus = Math.floor(this.timer * 10);
        const levelScore = 1000 + timeBonus + (this.streak * 50);
        this.score += levelScore;
        this.streak++;

        setTimeout(() => {
            document.getElementById('summary-score').textContent = 1000;
            document.getElementById('summary-bonus').textContent = timeBonus;
            document.getElementById('complete-screen').classList.add('active');
            this.updateHUD();
        }, 1500);
    }

    handleGameOver() {
        this.gameRunning = false;
        this.sfx.fail();
        this.streak = 0;
        document.getElementById('over-screen').classList.add('active');
    }

    nextLevel() {
        this.level++;
        document.getElementById('complete-screen').classList.remove('active');
        this.gridElement.classList.remove('flowing');
        this.setupLevel();
        this.gameRunning = true;
    }

    resetLevel() {
        this.streak = 0;
        document.getElementById('over-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        this.gridElement.classList.remove('flowing');
        this.setupLevel();
        this.gameRunning = true;
    }

    togglePause() {
        if (!this.gameRunning && !this.isPaused) return;
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) pauseScreen.classList.add('active');
        else {
            pauseScreen.classList.remove('active');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    toggleMute() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('mute-btn').textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    updateHUD() {
        this.scoreElement.textContent = this.score;
        this.timerElement.textContent = Math.ceil(this.timer);
    }

    lastTime = 0;
    gameLoop(timestamp = 0) {
        if (!this.gameRunning || this.isPaused) return;
        
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.timer -= dt;
        if (this.timer <= 0) {
            this.timer = 0;
            this.updateHUD();
            this.handleGameOver();
            return;
        }

        this.updateHUD();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
    new PipeGame();
});
