// Neon Cypher Core Game Engine
// TARGET_WORDS and VALID_GUESSES are globally declared in dictionary.js

// Setup timezone-safe Epoch Date for synchronized Daily calculation
const EPOCH_DATE = new Date("2026-05-26T00:00:00Z").getTime();
const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;

// Audio Context Centralizer (Lazy initialized on first user interaction)
let audioCtx = null;
let soundEnabled = true;

// Active State Registry
let gameState = {
    mode: 'daily', // 'daily' or 'practice'
    secretWord: '',
    currentRow: 0,
    currentCol: 0,
    boardState: ['', '', '', '', '', ''],
    gameStatus: 'playing', // 'playing', 'won', 'lost'
    dailyIndex: 0,
    lang: 'en' // 'en' or 'hi'
};

// Statistics Storage Schemas
const DEFAULT_STATS = {
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDateIndex: -1
};

// Load Stats from Storage
function loadStats(mode) {
    const key = `neon-cypher-stats-${mode}-${gameState.lang}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { ...DEFAULT_STATS };
}

// Save Stats to Storage
function saveStats(mode, stats) {
    localStorage.setItem(`neon-cypher-stats-${mode}-${gameState.lang}`, JSON.stringify(stats));
}

// ----------------------------------------------------
// Web Audio Synth Engine
// ----------------------------------------------------
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTapSound() {
    if (!soundEnabled) return;
    initAudio();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.warn('Audio synthesis tap failed', e);
    }
}

function playSuccessMelody() {
    if (!soundEnabled) return;
    initAudio();
    try {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            const timeOffset = index * 0.12;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + timeOffset);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, audioCtx.currentTime + timeOffset + 0.2);
            
            gain.gain.setValueAtTime(0.0, audioCtx.currentTime + timeOffset);
            gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + timeOffset + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + 0.25);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + timeOffset);
            osc.stop(audioCtx.currentTime + timeOffset + 0.25);
        });
    } catch (e) {
        console.warn('Audio synthesis success failed', e);
    }
}

function playErrorSound() {
    if (!soundEnabled) return;
    initAudio();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
        console.warn('Audio synthesis error failed', e);
    }
}

// ----------------------------------------------------
// Toast & UI helper utilities
// ----------------------------------------------------
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    // Smooth transition
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 250);
    }, duration);
}

// Helper to compute daily word index based on UTC midnight
function getDailyWordIndex() {
    const nowUTC = Date.now();
    const daysPassed = Math.floor((nowUTC - EPOCH_DATE) / MILLISECONDS_IN_A_DAY);
    return Math.max(0, daysPassed);
}

// Calculate remaining countdown to next UTC midnight
function updateCountdown() {
    const timerEl = document.getElementById('next-cypher-timer');
    if (!timerEl) return;
    
    const now = Date.now();
    const nextMidnight = Math.ceil((now - EPOCH_DATE) / MILLISECONDS_IN_A_DAY) * MILLISECONDS_IN_A_DAY + EPOCH_DATE;
    const diff = nextMidnight - now;
    
    if (diff <= 0) {
        timerEl.textContent = "00:00:00";
        return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const format = (num) => String(num).padStart(2, '0');
    timerEl.textContent = `${format(hours)}:${format(minutes)}:${format(seconds)}`;
}

// Initialize countdown interval
setInterval(updateCountdown, 1000);

// ----------------------------------------------------
// Core Initialization & LocalStorage Resume Logic
// ----------------------------------------------------
// Helper to retrieve active language dictionary arrays
function getActiveDictionaries() {
    if (gameState.lang === 'hi') {
        return {
            targets: window.HINDI_TARGET_WORDS || [],
            validations: window.HINDI_VALID_GUESSES || []
        };
    }
    return {
        targets: window.TARGET_WORDS || [],
        validations: window.VALID_GUESSES || []
    };
}

// Translate UI components dynamically based on selected language
function updateLanguageUI() {
    const isHi = gameState.lang === 'hi';
    
    // Update terminal back button
    const backBtn = document.getElementById('header-back-link');
    if (backBtn) {
        backBtn.innerHTML = isHi ? '<span class="btn-arrow">&larr;</span> टर्मिनल हब' : '<span class="btn-arrow">&larr;</span> TERMINAL HUB';
    }
    
    // Update header tooltips/titles
    const helpBtn = document.getElementById('help-trigger-btn');
    if (helpBtn) {
        helpBtn.title = isHi ? "कैसे खेलें" : "How to Play";
        helpBtn.setAttribute('aria-label', isHi ? "कैसे खेलें" : "How to Play");
    }
    const statsBtn = document.getElementById('stats-trigger-btn');
    if (statsBtn) {
        statsBtn.title = isHi ? "आंकड़े" : "Statistics";
        statsBtn.setAttribute('aria-label', isHi ? "आंकड़े" : "Statistics");
    }
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
        audioBtn.title = isHi ? (soundEnabled ? "आवाज़ बंद करें" : "आवाज़ चालू करें") : (soundEnabled ? "Mute Synth" : "Enable Synth");
        audioBtn.setAttribute('aria-label', isHi ? "आवाज़ टॉगल करें" : "Toggle Synth Sound");
    }
    
    // Update Mode Buttons
    const modeDailyBtn = document.getElementById('mode-daily-btn');
    if (modeDailyBtn) {
        modeDailyBtn.textContent = isHi ? "डेली साइफ़र" : "DAILY CYPHER";
    }
    const modePracticeBtn = document.getElementById('mode-practice-btn');
    if (modePracticeBtn) {
        modePracticeBtn.textContent = isHi ? "प्रैक्टिस हैक" : "PRACTICE HACK";
    }
    

    
    // Update Instructions Modal content
    const instTitle = document.getElementById('instructions-title');
    if (instTitle) {
        instTitle.textContent = isHi ? "डिक्रिप्शन मैनुअल" : "DECRYPTION MANUAL";
    }
    const instSub1 = document.getElementById('instructions-subtitle-1');
    if (instSub1) {
        instSub1.textContent = isHi ? "साइफ़र कैसे क्रैक करें:" : "HOW TO CRACK THE CYPHER:";
    }
    const instText1 = document.getElementById('instructions-text-1');
    if (instText1) {
        instText1.textContent = isHi ? "6 प्रयासों में 5-अक्षरों वाले दैनिक पासकोड को क्रैक करें। प्रत्येक अनुमान एक मान्य 5-अक्षरों का शब्द (Hinglish/Hindi) होना चाहिए।" : "Crack the 5-letter daily passcode in 6 attempts. Each guess must be a valid 5-letter spelling packet.";
    }
    const instSub2 = document.getElementById('instructions-subtitle-2');
    if (instSub2) {
        instSub2.textContent = isHi ? "डिक्रिप्शन फ़ीडबैक संकेत:" : "DECRYPTION FEEDBACK KEY:";
    }
    
    const instExampleCorrect = document.getElementById('instructions-example-correct');
    if (instExampleCorrect) {
        instExampleCorrect.innerHTML = isHi ? "<strong>हरा साइबर ग्लो:</strong> अक्षर पासकोड में है और <strong>सही स्थान</strong> पर है।" : "<strong>GREEN CYBER GLOW</strong>: The letter is in the security passcode and placed in the <strong>correct node</strong>.";
    }
    const instExamplePresent = document.getElementById('instructions-example-present');
    if (instExamplePresent) {
        instExamplePresent.innerHTML = isHi ? "<strong>पीला ग्लो:</strong> अक्षर पासकोड में है लेकिन <strong>गलत स्थान</strong> पर है।" : "<strong>GOLD GLOW</strong>: The letter is in the security passcode but in an <strong>incorrect node</strong>.";
    }
    const instExampleAbsent = document.getElementById('instructions-example-absent');
    if (instExampleAbsent) {
        instExampleAbsent.innerHTML = isHi ? "<strong>डार्क ग्रे:</strong> अक्षर दैनिक सुरक्षा पासकोड में <strong>मौजूद नहीं</strong> है।" : "<strong>STEEL DARK</strong>: The letter is <strong>not present</strong> in the daily security passcode.";
    }
    
    const instText2 = document.getElementById('instructions-text-2');
    if (instText2) {
        instText2.innerHTML = isHi ? "एक सिंक्रोनाइज़्ड वैश्विक पासकोड दैनिक <strong>00:00 UTC</strong> पर तैयार होता है। लगातार जीत हासिल करें और शेयर करें!" : "A synchronized global mainframe packet is compiled daily at <strong>00:00 UTC</strong>. Earn decryption streaks and share your results on social platforms to compete!";
    }
    
    const instStartBtn = document.getElementById('instructions-start-btn');
    if (instStartBtn) {
        instStartBtn.textContent = isHi ? "हैक शुरू करें" : "ENGAGE HACK";
    }
    
    // Update Stats labels
    const lblPlayed = document.getElementById('lbl-played');
    if (lblPlayed) {
        lblPlayed.textContent = isHi ? "खेला गया" : "Played";
    }
    const lblSuccess = document.getElementById('lbl-success');
    if (lblSuccess) {
        lblSuccess.textContent = isHi ? "सफलता" : "Success";
    }
    const lblStreak = document.getElementById('lbl-streak');
    if (lblStreak) {
        lblStreak.textContent = isHi ? "लगातार जीत" : "Streak";
    }
    const lblMaxStreak = document.getElementById('lbl-max-streak');
    if (lblMaxStreak) {
        lblMaxStreak.textContent = isHi ? "अधिकतम जीत" : "Max Streak";
    }
}

// Core Initialization & LocalStorage Resume Logic
function initGame(mode) {
    gameState.mode = mode;
    gameState.currentRow = 0;
    gameState.currentCol = 0;
    gameState.boardState = ['', '', '', '', '', ''];
    gameState.gameStatus = 'playing';
    
    // Update translation text for the entire UI
    updateLanguageUI();
    
    // Clear keyboard and board visuals
    clearVisualBoard();
    clearVisualKeyboard();
    
    const dicts = getActiveDictionaries();
    
    if (mode === 'daily') {
        const todayIndex = getDailyWordIndex();
        gameState.dailyIndex = todayIndex;
        
        // Pick daily word deterministically from active target words list
        const targetWordIndex = todayIndex % dicts.targets.length;
        gameState.secretWord = dicts.targets[targetWordIndex].toUpperCase();
        
        const badgeText = gameState.lang === 'hi' ? `डेली हैक #${todayIndex + 1}` : `DAILY MODE #${todayIndex + 1}`;
        document.getElementById('active-mode-badge').textContent = badgeText;
        document.getElementById('practice-replay-box').classList.add('hidden');
        
        // Attempt to resume daily saved state to allow page-reloads
        resumeDailyState();
    } else {
        // Unlimited Practice Mode picking random target word
        const randomIdx = Math.floor(Math.random() * dicts.targets.length);
        gameState.secretWord = dicts.targets[randomIdx].toUpperCase();
        
        const badgeText = gameState.lang === 'hi' ? "प्रैक्टिस मोड सक्रिय" : "PRACTICE HACK ACTIVE";
        document.getElementById('active-mode-badge').textContent = badgeText;
        document.getElementById('practice-replay-box').classList.remove('hidden');
    }
    
    // Close completed stats modal if active
    document.getElementById('stats-modal').classList.add('hidden');
    
    // Trigger help modal if first time player
    if (!localStorage.getItem('neon-cypher-visited')) {
        document.getElementById('instructions-modal').classList.remove('hidden');
        localStorage.setItem('neon-cypher-visited', 'true');
    }
}

// Save Daily current board to recover if user refreshes browser page (isolated per language)
function saveDailyState() {
    if (gameState.mode !== 'daily') return;
    const saveObj = {
        dailyIndex: gameState.dailyIndex,
        boardState: gameState.boardState,
        currentRow: gameState.currentRow,
        gameStatus: gameState.gameStatus,
        secretWord: gameState.secretWord,
        lang: gameState.lang
    };
    localStorage.setItem(`neon-cypher-daily-state-${gameState.lang}`, JSON.stringify(saveObj));
}

// Resume Daily current board on page reload (isolated per language)
function resumeDailyState() {
    const saved = localStorage.getItem(`neon-cypher-daily-state-${gameState.lang}`);
    if (!saved) return;
    
    try {
        const saveObj = JSON.parse(saved);
        // Only recover if the daily index matches today's index and matching secret
        if (saveObj.dailyIndex === gameState.dailyIndex && saveObj.secretWord === gameState.secretWord && saveObj.lang === gameState.lang) {
            gameState.boardState = saveObj.boardState;
            gameState.currentRow = saveObj.currentRow;
            gameState.gameStatus = saveObj.gameStatus;
            
            // Re-render board inputs and key colors instantly
            renderRecoveredBoard();
        } else {
            localStorage.removeItem(`neon-cypher-daily-state-${gameState.lang}`);
        }
    } catch (e) {
        console.warn('Failed to recover daily state', e);
    }
}

// Reset visual elements on row/mode change
function clearVisualBoard() {
    const tiles = document.querySelectorAll('.grid-tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.className = 'grid-tile';
        tile.style.animation = '';
    });
}

function clearVisualKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.className = key.classList.contains('double-width-key') ? 'key double-width-key' : 'key';
    });
}

// Render inputs from recovered localstorage
function renderRecoveredBoard() {
    for (let r = 0; r < gameState.boardState.length; r++) {
        const word = gameState.boardState[r];
        if (!word) continue;
        
        // Fill tiles
        for (let c = 0; c < 5; c++) {
            const tile = document.getElementById(`tile-${r}-${c}`);
            tile.textContent = word[c];
            
            if (r < gameState.currentRow || (r === gameState.currentRow && gameState.gameStatus !== 'playing')) {
                // Determine colors
                const char = word[c];
                const secretChar = gameState.secretWord[c];
                
                tile.classList.add('flipped');
                if (char === secretChar) {
                    tile.classList.add('correct');
                    updateKeyboardKey(char, 'correct');
                } else if (gameState.secretWord.includes(char)) {
                    // Check occurrences
                    tile.classList.add('present');
                    updateKeyboardKey(char, 'present');
                } else {
                    tile.classList.add('absent');
                    updateKeyboardKey(char, 'absent');
                }
            }
        }
    }
    
    // If daily game was completed, display stats popup after a brief delay
    if (gameState.gameStatus !== 'playing') {
        setTimeout(() => {
            showStatsModal();
        }, 800);
    }
}

// ----------------------------------------------------
// Keystroke & Input handling state machine
// ----------------------------------------------------
function handleKeyPress(key) {
    if (document.body.classList.contains('show-info-overlay')) return;
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentRow >= 6) {
        gameState.gameStatus = 'lost';
        return;
    }
    initAudio();
    
    const keyUpper = key.toUpperCase();
    
    if (keyUpper === 'BACKSPACE' || keyUpper === 'DELETE') {
        handleBackspace();
    } else if (keyUpper === 'ENTER') {
        handleSubmitRow();
    } else if (/^[A-Z]$/.test(keyUpper)) {
        handleLetterInput(keyUpper);
    }
}

function handleLetterInput(letter) {
    if (gameState.currentCol >= 5) return;
    playTapSound();
    
    const row = gameState.currentRow;
    const col = gameState.currentCol;
    
    gameState.boardState[row] = (gameState.boardState[row] || '') + letter;
    
    const tile = document.getElementById(`tile-${row}-${col}`);
    tile.textContent = letter;
    tile.classList.add('pop-in');
    
    gameState.currentCol++;
}

function handleBackspace() {
    if (gameState.currentCol <= 0) return;
    playTapSound();
    
    const row = gameState.currentRow;
    gameState.currentCol--;
    const col = gameState.currentCol;
    
    const word = gameState.boardState[row];
    gameState.boardState[row] = word.substring(0, word.length - 1);
    
    const tile = document.getElementById(`tile-${row}-${col}`);
    tile.textContent = '';
    tile.classList.remove('pop-in');
}

function handleSubmitRow() {
    if (gameState.currentCol < 5) {
        const errorText = gameState.lang === 'hi' ? "अधूरा शब्द" : "INCOMPLETE ENCRYPTION";
        showToast(errorText);
        playErrorSound();
        shakeRow(gameState.currentRow);
        return;
    }
    
    const row = gameState.currentRow;
    const guess = gameState.boardState[row].toUpperCase();
    
    const dicts = getActiveDictionaries();
    
    // Verify guess against active spelling validation list
    if (!dicts.validations.includes(guess.toLowerCase())) {
        const invalidText = gameState.lang === 'hi' ? "गलत शब्द" : "INVALID ENCRYPTION PACKET";
        showToast(invalidText);
        playErrorSound();
        shakeRow(row);
        return;
    }
    
    revealRowGuesses(row, guess);
}

// Row shake animation feedback
function shakeRow(rowIdx) {
    const rowEl = document.getElementById(`row-${rowIdx}`);
    rowEl.classList.add('shake');
    setTimeout(() => {
        rowEl.classList.remove('shake');
    }, 400);
}

// Interactive Staggered 3D Tile Flip Reveals
function revealRowGuesses(rowIdx, guess) {
    gameState.gameStatus = 'evaluating'; // Pause inputs
    
    const secretWord = gameState.secretWord;
    let correctCount = 0;
    
    // Track matching target instances to avoid duplicate yellow markers
    let targetLetterCounts = {};
    for (let c of secretWord) {
        targetLetterCounts[c] = (targetLetterCounts[c] || 0) + 1;
    }
    
    let statuses = Array(5).fill('absent');
    
    // Pass 1: Tag Exact Greens
    for (let c = 0; c < 5; c++) {
        if (guess[c] === secretWord[c]) {
            statuses[c] = 'correct';
            targetLetterCounts[guess[c]]--;
            correctCount++;
        }
    }
    
    // Pass 2: Tag Yellows vs Greys
    for (let c = 0; c < 5; c++) {
        if (statuses[c] === 'correct') continue;
        
        const char = guess[c];
        if (secretWord.includes(char) && targetLetterCounts[char] > 0) {
            statuses[c] = 'present';
            targetLetterCounts[char]--;
        }
    }
    
    // Stagger flip visual updates over index delays
    for (let c = 0; c < 5; c++) {
        const tile = document.getElementById(`tile-${rowIdx}-${c}`);
        const status = statuses[c];
        const letter = guess[c];
        
        setTimeout(() => {
            tile.classList.add('flipped');
            tile.classList.add(status);
            
            // Play a micro-tap on individual card flips
            playTapSound();
            
            // Render virtual key class state
            updateKeyboardKey(letter, status);
            
            // Check final row resolve on last tile flip completion
            if (c === 4) {
                resolveGameState(correctCount);
            }
        }, c * 200);
    }
}

function updateKeyboardKey(letter, status) {
    const keyEl = document.getElementById(`key-${letter.toLowerCase()}`);
    if (!keyEl) return;
    
    if (status === 'correct') {
        keyEl.className = 'key correct';
    } else if (status === 'present' && !keyEl.classList.contains('correct')) {
        keyEl.className = 'key present';
    } else if (status === 'absent' && !keyEl.classList.contains('correct') && !keyEl.classList.contains('present')) {
        keyEl.className = 'key absent';
    }
}

// ----------------------------------------------------
// Resolve Round Outcomes & Streak Computations
// ----------------------------------------------------
function resolveGameState(correctCount) {
    const guess = gameState.boardState[gameState.currentRow];
    
    if (correctCount === 5) {
        gameState.gameStatus = 'won';
        playSuccessMelody();
        bobSuccessRow(gameState.currentRow);
        updateStreaks(true);
        saveDailyState();
        
        setTimeout(() => {
            const winText = gameState.lang === 'hi' ? "शाबाश! हैक सफल!" : "MAINFRAME BYPASSED!";
            showToast(winText);
            showStatsModal();
        }, 1200);
    } else {
        gameState.currentRow++;
        gameState.currentCol = 0;
        
        if (gameState.currentRow >= 6) {
            gameState.gameStatus = 'lost';
            playErrorSound();
            updateStreaks(false);
            saveDailyState();
            
            setTimeout(() => {
                const failText = gameState.lang === 'hi' ? `हैक असफल! सही शब्द: ${gameState.secretWord}` : `DECRYPTION FAILED. KEY: ${gameState.secretWord}`;
                showToast(failText);
                showStatsModal();
            }, 1200);
        } else {
            // Keep playing next row
            gameState.gameStatus = 'playing';
            saveDailyState();
        }
    }
}

// SUCCESS wave bobbing animation
function bobSuccessRow(rowIdx) {
    for (let c = 0; c < 5; c++) {
        const tile = document.getElementById(`tile-${rowIdx}-${c}`);
        setTimeout(() => {
            tile.style.animation = 'tileBob 0.6s ease-in-out';
        }, c * 100);
    }
}

// Streaks and Achievements logic integration
function updateStreaks(didWin) {
    const mode = gameState.mode;
    const stats = loadStats(mode);
    
    if (mode === 'daily') {
        // Prevent registering multi hits on same UTC daily word
        if (stats.lastPlayedDateIndex === gameState.dailyIndex) {
            return;
        }
        stats.lastPlayedDateIndex = gameState.dailyIndex;
    }
    
    stats.played++;
    if (didWin) {
        stats.won++;
        stats.streak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
        
        // Save score count
        const attempt = gameState.currentRow; // 0-indexed row index
        stats.distribution[attempt]++;
    } else {
        stats.streak = 0;
    }
    
    saveStats(mode, stats);
    
    // Proactively check and unlock Arcade Hub Global achievements
    checkAchievementsUnlock(stats);
}

// Integrates with Arcade Hub dynamic global Achievements API
function checkAchievementsUnlock(stats) {
    try {
        if (typeof window.unlockAchievement === 'function') {
            if (stats.won >= 1) window.unlockAchievement('neon_cypher_first_hack');
            if (stats.streak >= 5) window.unlockAchievement('neon_cypher_streak_5');
            if (stats.played >= 10) window.unlockAchievement('neon_cypher_played_10');
        }
    } catch (err) {
        console.warn('Achievements API not initialized', err);
    }
}

// ----------------------------------------------------
// UI Completing Modal & Charts Renditions
// ----------------------------------------------------
function showStatsModal() {
    const stats = loadStats(gameState.mode);
    
    document.getElementById('stat-played').textContent = stats.played;
    
    const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
    document.getElementById('stat-win-pct').textContent = `${pct}%`;
    document.getElementById('stat-streak').textContent = stats.streak;
    document.getElementById('stat-max-streak').textContent = stats.maxStreak;
    
    // Set headers
    const titleEl = document.getElementById('stats-modal-title');
    const distTitle = document.querySelector('.distribution-title');
    const countdownLbl = document.querySelector('.countdown-lbl');
    const shareBtn = document.getElementById('share-btn');
    const replayBtn = document.getElementById('practice-replay-btn');
    
    if (gameState.lang === 'hi') {
        if (gameState.gameStatus === 'won') {
            titleEl.innerHTML = "हैक <span class='glow-span'>सफल हुआ!</span>";
        } else if (gameState.gameStatus === 'lost') {
            titleEl.innerHTML = "हैक <span style='color:var(--magenta-glow);text-shadow:0 0 10px rgba(255,0,85,0.4)'>असफल हुआ</span>";
        } else {
            titleEl.textContent = "हैक आंकड़े";
        }
        if (distTitle) distTitle.textContent = "प्रयासों की संख्या";
        if (countdownLbl) countdownLbl.textContent = "अगला हैक";
        if (shareBtn) shareBtn.innerHTML = "शेयर करें &#128229;";
        if (replayBtn) replayBtn.textContent = "नया हैक शुरू करें";
    } else {
        if (gameState.gameStatus === 'won') {
            titleEl.innerHTML = "DECRYPTION <span class='glow-span'>SUCCESSFUL</span>";
        } else if (gameState.gameStatus === 'lost') {
            titleEl.innerHTML = "DECRYPTION <span style='color:var(--magenta-glow);text-shadow:0 0 10px rgba(255,0,85,0.4)'>FAILED</span>";
        } else {
            titleEl.textContent = "DECRYPTION STATISTICS";
        }
        if (distTitle) distTitle.textContent = "DECRYPTION ATTEMPTS";
        if (countdownLbl) countdownLbl.textContent = "NEXT CYPHER IN";
        if (shareBtn) shareBtn.innerHTML = "SHARE DECRYPTION &#128229;";
        if (replayBtn) replayBtn.textContent = "DECRYPT NEW WORD";
    }
    
    // Fill attempt chart bars
    const maxVal = Math.max(...stats.distribution, 1);
    for (let i = 1; i <= 6; i++) {
        const barEl = document.getElementById(`bar-${i}`);
        const count = stats.distribution[i - 1];
        const widthPct = Math.max(8, (count / maxVal) * 100);
        
        barEl.style.width = `${widthPct}%`;
        barEl.textContent = count;
        
        // Highlight correct active attempt bar
        if (gameState.gameStatus === 'won' && gameState.currentRow === (i - 1)) {
            barEl.classList.add('active');
        } else {
            barEl.classList.remove('active');
        }
    }
    
    // Hide or show Share elements based on mode
    if (gameState.mode === 'daily') {
        document.querySelector('.modal-footer-flex').classList.remove('hidden');
    } else {
        document.querySelector('.modal-footer-flex').classList.add('hidden');
    }
    
    // Update active timer display immediately
    updateCountdown();
    
    document.getElementById('stats-modal').classList.remove('hidden');
}

// ----------------------------------------------------
// Social Copy Sharing Clipboard Assembly
// ----------------------------------------------------
function copyShareGrid() {
    if (gameState.gameStatus === 'playing') return;
    
    const isWin = gameState.gameStatus === 'won';
    const scoreText = isWin ? `${gameState.currentRow + 1}/6` : 'X/6';
    const titleText = gameState.mode === 'daily' 
        ? `Neon Cypher Daily #${gameState.dailyIndex + 1} - ${scoreText}` 
        : `Neon Cypher Practice - ${scoreText}`;
    
    let gridString = '';
    
    for (let r = 0; r <= gameState.currentRow; r++) {
        if (r >= 6) break;
        const guess = gameState.boardState[r];
        if (!guess) continue;
        
        let rowEmojis = '';
        for (let c = 0; c < 5; c++) {
            const tile = document.getElementById(`tile-${r}-${c}`);
            if (tile.classList.contains('correct')) {
                rowEmojis += '🟢';
            } else if (tile.classList.contains('present')) {
                rowEmojis += '🟡';
            } else {
                rowEmojis += '⚫';
            }
        }
        gridString += '\n' + rowEmojis;
    }
    
    const finalShareText = `${titleText}${gridString}\n\nPlay instantly at ArcadeHubPlay.com! 🔐`;
    
    // Copy to system clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(finalShareText).then(() => {
            showToast("SHARE PATTERN COPIED TO CLIPBOARD!");
        }).catch(err => {
            fallbackClipboardCopy(finalShareText);
        });
    } else {
        fallbackClipboardCopy(finalShareText);
    }
}

function fallbackClipboardCopy(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // prevent scroll placement jump
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("SHARE PATTERN COPIED!");
    } catch (err) {
        console.error('Fallback clipboard copy failed', err);
        showToast("COPY FAILED. SECURE BOARD BLOCKED.");
    }
}

// Expose language selection + play action globally for landing page triggers
window.selectLanguageAndPlay = function(lang) {
    gameState.lang = lang;
    localStorage.setItem('neon-cypher-lang', lang);
    

    
    // Re-initialize game boards under active daily/practice states
    initGame(gameState.mode);
    
    // Proceed to the mainframe game board
    if (typeof continueToGame === 'function') {
        continueToGame();
    }
};

// ----------------------------------------------------
// UI Bindings & Modals Event listeners
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Standard Hub Compliance Click Agree
    const complianceBtn = document.getElementById('compliance-agree-btn');
    if (complianceBtn) {
        complianceBtn.addEventListener('click', () => {
            initAudio();
            document.getElementById('compliance-overlay').classList.add('hidden');
        });
    }
    
    // Modals bindings
    document.getElementById('help-trigger-btn').addEventListener('click', () => {
        initAudio();
        document.getElementById('instructions-modal').classList.remove('hidden');
    });
    
    document.getElementById('instructions-close-btn').addEventListener('click', () => {
        document.getElementById('instructions-modal').classList.add('hidden');
    });
    
    document.getElementById('instructions-start-btn').addEventListener('click', () => {
        initAudio();
        document.getElementById('instructions-modal').classList.add('hidden');
    });
    
    document.getElementById('stats-trigger-btn').addEventListener('click', () => {
        initAudio();
        showStatsModal();
    });
    
    document.getElementById('stats-close-btn').addEventListener('click', () => {
        document.getElementById('stats-modal').classList.add('hidden');
    });
    
    // Mode toggling
    document.getElementById('mode-daily-btn').addEventListener('click', (e) => {
        if (gameState.mode === 'daily') return;
        initAudio();
        document.getElementById('mode-practice-btn').classList.remove('active');
        e.target.classList.add('active');
        initGame('daily');
    });
    
    document.getElementById('mode-practice-btn').addEventListener('click', (e) => {
        if (gameState.mode === 'practice') return;
        initAudio();
        document.getElementById('mode-daily-btn').classList.remove('active');
        e.target.classList.add('active');
        initGame('practice');
    });
    
    // Unlimited practice restart triggers
    document.getElementById('practice-replay-btn').addEventListener('click', () => {
        initAudio();
        initGame('practice');
    });
    
    // Copy to clipboard CTA
    document.getElementById('share-btn').addEventListener('click', () => {
        copyShareGrid();
    });
    
    // Audio toggler
    const audioBtn = document.getElementById('audio-toggle-btn');
    audioBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        audioBtn.textContent = soundEnabled ? '🔊' : '🔇';
        audioBtn.title = soundEnabled ? 'Mute Synth' : 'Enable Synth';
        if (soundEnabled) {
            initAudio();
            playTapSound();
        }
    });

    // Handle physical keyboard typings
    document.addEventListener('keydown', (e) => {
        if (document.body.classList.contains('show-info-overlay')) return;
        
        // Ignore typing when instructions modal or statistics completions are open
        if (document.getElementById('instructions-modal').offsetHeight > 0) return;
        if (document.getElementById('stats-modal').offsetHeight > 0) return;
        
        handleKeyPress(e.key);
    });

    // Handle onscreen virtual clicks
    const keys = document.querySelectorAll('.key');
    keys.forEach(k => {
        k.addEventListener('click', (e) => {
            const pressedKey = e.currentTarget.getAttribute('data-key');
            handleKeyPress(pressedKey);
        });
    });

    // Hub Back Link click listener to open Language Choice Landing Overlay
    const backLink = document.getElementById('header-back-link');
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            initAudio();
            playTapSound();
            
            // Show the pre-game selection overlay
            document.body.classList.add('show-info-overlay');
            const overlay = document.getElementById('game-info-overlay');
            if (overlay) {
                overlay.style.display = 'block';
            }
        });
    }

    // Recover saved language preference
    const savedLang = localStorage.getItem('neon-cypher-lang') || 'en';
    gameState.lang = savedLang;

    // Prevent double-tap zoom on virtual keys, header controls, and mode buttons on mobile screens
    let lastTouchEnd = 0;
    const touchSelector = '.key, .header-icon-btn, .mode-btn, .compliance-btn, .share-btn, .modal-btn, .continue-game-btn';
    document.querySelectorAll(touchSelector).forEach(button => {
        button.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    });

    // Launch default Daily mode instantly
    initGame('daily');
});
