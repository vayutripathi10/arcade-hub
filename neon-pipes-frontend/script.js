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
        this.gameMode = 'classic'; // 'classic' or 'perfect'
        this.grid = [];
        this.streak = 0;
        this.soundEnabled = true;
        this.hintUsed = false;
        this.isHinting = false;
        
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
        this.modeLabel = document.getElementById('mode-label');
        
        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.showModeSelection());
        
        document.getElementById('home-btn').addEventListener('click', () => {
            this.gameRunning = false;
            this.gridElement.innerHTML = '';
            document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
            document.getElementById('mode-screen').classList.add('active');
            if (this.hintInterval) clearInterval(this.hintInterval);
        });

        document.getElementById('select-classic').addEventListener('click', () => this.startGame('classic'));
        document.getElementById('select-perfect').addEventListener('click', () => this.startGame('perfect'));

        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('next-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retry-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        
        // HTP Modal
        document.getElementById('htp-btn').addEventListener('click', () => {
            document.getElementById('htp-overlay').classList.add('active');
        });
        document.getElementById('htp-close').addEventListener('click', () => {
            document.getElementById('htp-overlay').classList.remove('active');
        });

        // Sharing
        const share = (p) => this.shareScore(p);
        document.getElementById('share-wa').addEventListener('click', (e) => { e.preventDefault(); share('wa'); });
        document.getElementById('share-x').addEventListener('click', (e) => { e.preventDefault(); share('x'); });
        document.getElementById('over-share-wa').addEventListener('click', (e) => { e.preventDefault(); share('wa'); });
        document.getElementById('over-share-x').addEventListener('click', (e) => { e.preventDefault(); share('x'); });
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

    showModeSelection() {
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('mode-screen').classList.add('active');
    }

    async startGame(mode) {
        document.getElementById('mode-screen').classList.remove('active');
        this.gameMode = mode;
        this.gameRunning = true;
        this.isPaused = false;
        await this.setupLevel();
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    async setupLevel() {
        // New Level Configuration
        if (this.gameMode === 'perfect') {
            if (this.level <= 2) { this.gridSize = 3; this.timer = 80; }
            else if (this.level <= 4) { this.gridSize = 5; this.timer = 120; }
            else if (this.level <= 6) { this.gridSize = 7; this.timer = 180; }
            else { this.gridSize = 9; this.timer = 240; }
        } else {
            if (this.level <= 2) { this.gridSize = 3; this.timer = 60; }
            else if (this.level <= 5) { this.gridSize = 4; this.timer = 75; }
            else if (this.level <= 8) { this.gridSize = 5; this.timer = 90; }
            else { this.gridSize = 6; this.timer = 120; }
        }

        this.modeLabel.textContent = `MODE: ${this.gameMode.toUpperCase()}`;
        this.modeLabel.style.color = this.gameMode === 'perfect' ? 'var(--neon-pink)' : 'var(--neon-cyan)';

        this.hintUsed = false;
        const hintBtn = document.getElementById('hint-btn');
        hintBtn.disabled = false;
        hintBtn.textContent = '💡';

        this.resize();
        
        if (this.gameMode === 'perfect') {
            await this.generatePerfectGridAsync();
        } else {
            this.generateGrid();
        }

        this.renderGrid();
        this.levelElement.textContent = this.level;
        this.updateHUD();
    }

    async generatePerfectGridAsync() {
        let success = false;
        const loader = document.getElementById('loading-overlay');
        if(loader) loader.classList.add('active');

        for (let retry = 0; retry < 10; retry++) {
            await new Promise(r => setTimeout(r, 50)); // Yield to paint spinner
            
            this.grid = [];
            const connections = Array.from({ length: this.gridSize }, () => 
                Array.from({ length: this.gridSize }, () => [0, 0, 0, 0])
            );
            
            if (this.generatePerfectPath(connections)) {
                connections[0][0][3] = 1; // Source from left
                connections[this.gridSize-1][this.gridSize-1][1] = 1; // Dest to right
                this.mapConnectionsToPipes(connections);
                success = true;
                break;
            }
        }

        if (!success) {
            console.warn("Failed to generate Perfect Path after 10 retries. Falling back to Classic Path.");
            this.generateGrid(true); // force classic
        }

        if(loader) loader.classList.remove('active');
    }

    generateGrid(forceClassic = false) {
        this.grid = [];
        const connections = Array.from({ length: this.gridSize }, () => 
            Array.from({ length: this.gridSize }, () => [0, 0, 0, 0])
        );

        if (this.gameMode === 'perfect' && !forceClassic) {
            // Should not be called directly for perfect mode anymore
            return;
        }

        this.generateClassicPath(connections);
        connections[0][0][3] = 1; // Source from left
        connections[this.gridSize-1][this.gridSize-1][1] = 1; // Dest to right
        this.mapConnectionsToPipes(connections);
    }

    mapConnectionsToPipes(connections) {
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                const conn = connections[r][c];
                const { type, baseRotation } = this.determinePipeType(conn);
                this.grid[r][c] = {
                    type,
                    targetRotation: baseRotation,
                    rotation: Math.floor(Math.random() * 4),
                    connected: false,
                    r, c
                };
            }
        }
    }

    generateClassicPath(connections) {
        const path = [];
        let curr = { r: 0, c: 0 };
        const target = { r: this.gridSize - 1, c: this.gridSize - 1 };
        const visited = new Set(['0,0']);
        path.push(curr);

        while (curr.r !== target.r || curr.c !== target.c) {
            const neighbors = [
                { r: curr.r - 1, c: curr.c, dir: 0, opp: 2 },
                { r: curr.r, c: curr.c + 1, dir: 1, opp: 3 },
                { r: curr.r + 1, c: curr.c, dir: 2, opp: 0 },
                { r: curr.r, c: curr.c - 1, dir: 3, opp: 1 }
            ].filter(n => n.r >= 0 && n.r < this.gridSize && n.c >= 0 && n.c < this.gridSize);

            neighbors.sort((a, b) => {
                const distA = Math.abs(target.r - a.r) + Math.abs(target.c - a.c);
                const distB = Math.abs(target.r - b.r) + Math.abs(target.c - b.c);
                return distA - distB + (Math.random() - 0.5);
            });

            let moved = false;
            for (const n of neighbors) {
                if (!visited.has(`${n.r},${n.c}`)) {
                    connections[curr.r][curr.c][n.dir] = 1;
                    connections[n.r][n.c][n.opp] = 1;
                    visited.add(`${n.r},${n.c}`);
                    curr = { r: n.r, c: n.c };
                    path.push(curr);
                    moved = true;
                    break;
                }
            }
            if (!moved) break;
        }

        // Branching: Connect all other cells to the network
        const unvisited = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!visited.has(`${r},${c}`)) unvisited.push({ r, c });
            }
        }
        
        while (unvisited.length > 0) {
            const idx = Math.floor(Math.random() * unvisited.length);
            const u = unvisited[idx];
            const neighbors = [
                { r: u.r - 1, c: u.c, dir: 0, opp: 2 },
                { r: u.r, c: u.c + 1, dir: 1, opp: 3 },
                { r: u.r + 1, c: u.c, dir: 2, opp: 0 },
                { r: u.r, c: u.c - 1, dir: 3, opp: 1 }
            ].filter(n => n.r >= 0 && n.r < this.gridSize && n.c >= 0 && n.c < this.gridSize);

            const vNeighbor = neighbors.find(n => visited.has(`${n.r},${n.c}`));
            if (vNeighbor) {
                connections[u.r][u.c][vNeighbor.opp] = 1;
                connections[vNeighbor.r][vNeighbor.c][vNeighbor.dir] = 1;
                visited.add(`${u.r},${u.c}`);
                unvisited.splice(idx, 1);
            } else {
                unvisited.push(unvisited.splice(idx, 1)[0]);
            }
        }
    }

    generatePerfectPath(connections) {
        const target = { r: this.gridSize - 1, c: this.gridSize - 1 };
        const totalCells = this.gridSize * this.gridSize;
        let attempts = 0;
        
        const visited = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(false));
        let pathFound = false;

        const getNeighbors = (rr, cc) => {
            return [
                { r: rr - 1, c: cc, dir: 0, opp: 2 },
                { r: rr, c: cc + 1, dir: 1, opp: 3 },
                { r: rr + 1, c: cc, dir: 2, opp: 0 },
                { r: rr, c: cc - 1, dir: 3, opp: 1 }
            ].filter(d => d.r >= 0 && d.r < this.gridSize && d.c >= 0 && d.c < this.gridSize && !visited[d.r][d.c]);
        };

        const dfs = (r, c, count) => {
            if (attempts > 500000) return false;
            if (pathFound) return true;

            if (count === totalCells) {
                if (r === target.r && c === target.c) {
                    pathFound = true;
                    return true;
                }
                return false;
            }
            if (r === target.r && c === target.c) return false; // Must hit target last

            visited[r][c] = true;
            
            const dirs = getNeighbors(r, c);

            // Warnsdorff's heuristic
            dirs.sort((a, b) => {
                const onwardA = getNeighbors(a.r, a.c).length;
                const onwardB = getNeighbors(b.r, b.c).length;
                if (onwardA !== onwardB) return onwardA - onwardB;
                return Math.random() - 0.5;
            });

            for (const d of dirs) {
                attempts++;
                if (dfs(d.r, d.c, count + 1)) {
                    connections[r][c][d.dir] = 1;
                    connections[d.r][d.c][d.opp] = 1;
                    return true;
                }
            }
            visited[r][c] = false;
            return false;
        };

        return dfs(0, 0, 1);
    }

    determinePipeType(conn) {
        const count = conn.reduce((a, b) => a + b, 0);
        const s = conn.join('');

        // Cross
        if (count === 4) return { type: 'cross', baseRotation: 0 };
        // T-Shape
        if (count === 3) {
            if (s === '1110') return { type: 't', baseRotation: 0 };
            if (s === '0111') return { type: 't', baseRotation: 1 };
            if (s === '1011') return { type: 't', baseRotation: 2 };
            if (s === '1101') return { type: 't', baseRotation: 3 };
        }
        // Straight or L
        if (count === 2) {
            if (s === '1010') return { type: 'straight', baseRotation: 0 };
            if (s === '0101') return { type: 'straight', baseRotation: 1 };
            if (s === '1100') return { type: 'l', baseRotation: 0 };
            if (s === '0110') return { type: 'l', baseRotation: 1 };
            if (s === '0011') return { type: 'l', baseRotation: 2 };
            if (s === '1001') return { type: 'l', baseRotation: 3 };
        }
        // End-Cap
        if (count === 1) {
            if (s === '1000') return { type: 'cap', baseRotation: 0 };
            if (s === '0100') return { type: 'cap', baseRotation: 1 };
            if (s === '0010') return { type: 'cap', baseRotation: 2 };
            if (s === '0001') return { type: 'cap', baseRotation: 3 };
        }
        return { type: 'cap', baseRotation: 0 };
    }

    renderGrid() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.setProperty('--grid-size', this.gridSize);
        
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
        } else if (pipe.type === 'cap') {
            paths = `<path class="pipe-path" d="M 50 0 L 50 50" />
                     <path class="flow-pulse" d="M 50 0 L 50 50" />`;
        }
        return `<svg viewBox="0 0 100 100" class="pipe-svg">${paths}</svg>`;
    }

    rotatePipe(r, c, element) {
        if (!this.gameRunning || this.isPaused || this.isHinting) return;
        this.grid[r][c].rotation = (this.grid[r][c].rotation + 1) % 4;
        element.style.transform = `rotate(${this.grid[r][c].rotation * 90}deg)`;
        this.sfx.rotate();
        this.checkConnections();
    }

    getConnections(pipe) {
        let base;
        if (pipe.type === 'straight') base = [1, 0, 1, 0];
        else if (pipe.type === 'l') base = [1, 1, 0, 0];
        else if (pipe.type === 't') base = [1, 1, 1, 0];
        else if (pipe.type === 'cross') base = [1, 1, 1, 1];
        else if (pipe.type === 'cap') base = [1, 0, 0, 0];

        // Rotate the bitmask
        const rot = pipe.rotation;
        const result = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            if (base[i] === 1) result[(i + rot) % 4] = 1;
        }
        return result; // [top, right, bottom, left]
    }

    checkConnections() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c].connected = false;
            }
        }

        const queue = [];
        // Source node connects to (0,0) from the left
        const startPipe = this.grid[0][0];
        if (this.getConnections(startPipe)[3] === 1) {
            startPipe.connected = true;
            queue.push({ r: 0, c: 0 });
        }

        while (queue.length > 0) {
            const curr = queue.shift();
            const currConns = this.getConnections(this.grid[curr.r][curr.c]);

            const dirs = [
                { r: curr.r - 1, c: curr.c, dir: 0, opp: 2 }, // Top
                { r: curr.r, c: curr.c + 1, dir: 1, opp: 3 }, // Right
                { r: curr.r + 1, c: curr.c, dir: 2, opp: 0 }, // Bottom
                { r: curr.r, c: curr.c - 1, dir: 3, opp: 1 }  // Left
            ];

            for (const d of dirs) {
                if (d.r >= 0 && d.r < this.gridSize && d.c >= 0 && d.c < this.gridSize) {
                    const nextPipe = this.grid[d.r][d.c];
                    if (!nextPipe.connected && currConns[d.dir] === 1 && this.getConnections(nextPipe)[d.opp] === 1) {
                        nextPipe.connected = true;
                        queue.push({ r: d.r, c: d.c });
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
        const endPipe = this.grid[this.gridSize - 1][this.gridSize - 1];
        const destReached = endPipe.connected && this.getConnections(endPipe)[1] === 1;

        if (this.gameMode === 'perfect') {
            const allPipesConnected = this.grid.flat().every(p => p.connected);
            if (destReached && allPipesConnected) {
                this.handleWin();
            }
        } else {
            if (destReached) {
                this.handleWin();
            }
        }
    }

    handleWin() {
        this.gameRunning = false;
        this.sfx.win();
        this.sfx.whoosh();
        this.gridElement.classList.add('flowing');
        
        const timeBonus = this.hintUsed ? 0 : Math.floor(this.timer * 10);
        const levelScore = 1000 + timeBonus + (this.streak * 50);
        this.score += levelScore;
        this.streak++;

        setTimeout(() => {
            document.getElementById('summary-score').textContent = levelScore;
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

    async nextLevel() {
        this.level++;
        document.getElementById('complete-screen').classList.remove('active');
        this.gridElement.classList.remove('flowing');
        await this.setupLevel();
        this.lastTime = performance.now();
        this.gameRunning = true;
        this.gameLoop(this.lastTime);
    }

    async resetLevel() {
        this.streak = 0;
        document.getElementById('over-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        this.gridElement.classList.remove('flowing');
        await this.setupLevel();
        this.lastTime = performance.now();
        this.gameRunning = true;
        this.gameLoop(this.lastTime);
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

    showHint() {
        if (!this.gameRunning || this.isPaused || this.hintUsed || this.isHinting) return;
        
        this.hintUsed = true;
        this.isHinting = true;
        const hintBtn = document.getElementById('hint-btn');
        hintBtn.disabled = true;
        hintBtn.textContent = '💡';

        const overlay = document.getElementById('hint-overlay');
        overlay.classList.add('active');

        // Store current rotations
        const originalRotations = this.grid.map(row => row.map(p => p.rotation));

        // Show solved state
        const cells = document.querySelectorAll('.pipe-cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            cell.style.transform = `rotate(${this.grid[r][c].targetRotation * 90}deg)`;
            cell.classList.add('connected');
        });

        let timeLeft = 2;
        this.hintInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(this.hintInterval);
                this.hintInterval = null;
                overlay.classList.remove('active');
                
                // Restore state
                cells.forEach(cell => {
                    const r = parseInt(cell.dataset.r);
                    const c = parseInt(cell.dataset.c);
                    this.grid[r][c].rotation = originalRotations[r][c];
                    cell.style.transform = `rotate(${this.grid[r][c].rotation * 90}deg)`;
                });
                this.isHinting = false;
                this.checkConnections();
            } else {
                overlay.textContent = `Hint: ${timeLeft}...`;
            }
        }, 1000);
    }

    shareScore(platform) {
        const text = `I just connected the flow in Neon Pipes at Arcade Hub! Score: ${this.score}, Level: ${this.level}. Can you beat me?`;
        const url = 'https://arcadehubplay.com/neon-pipes-frontend/index.html';
        if (platform === 'x') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'wa') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        }
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
