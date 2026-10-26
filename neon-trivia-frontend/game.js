/**
 * NEON AI MIND SPRINT — DAILY AI TRIVIA
 * Real-time question synthesis via Google Gemini API
 * Zero server / Zero database storage
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. STATE & STORAGE
    // -------------------------------------------------------------------------
    const STATE = {
        mode: 'daily', // 'daily' or 'practice'
        category: 'cricket',
        language: 'en', // 'en' | 'hi'
        questions: [],
        currentQIndex: 0,
        score: 0,
        speedPoints: 0,
        timerVal: 15,
        timerInterval: null,
        isAnswering: false,
        soundEnabled: true,
        answersRecord: [], // [{ q, selected, correct, isCorrect, fact }]
        apiKey: localStorage.getItem('gemini_api_key') || '',
        streak: parseInt(localStorage.getItem('neon_trivia_streak') || '0', 10),
        lastDailyDate: localStorage.getItem('neon_trivia_last_daily') || ''
    };

    // Category Prompt Descriptions
    const CATEGORIES = {
        'cricket': {
            name: 'Cricket',
            prompt: 'Cricket records, IPL statistics, ICC World Cups, historic centuries, and legendary international players'
        },
        'bollywood': {
            name: 'Bollywood Cinema',
            prompt: 'Bollywood & Hindi cinema, famous movie dialogues, historic blockbusters, actors, music directors, and National Film Awards'
        },
        'football': {
            name: 'World Football',
            prompt: 'International football, FIFA World Cups, UEFA Champions League, Premier League, legendary Ballon d\'Or winners, and iconic goals'
        },
        'current-affairs': {
            name: 'Current Affairs & GK',
            prompt: 'Modern world current affairs, global science breakthroughs, space exploration milestones, international summits, and world records'
        },
        'history': {
            name: 'World & Indian History',
            prompt: 'World and Indian history, ancient empires (Mughal, Maurya, Roman), freedom movements, historic revolutions, and ancient monuments'
        },
        'tech-science': {
            name: 'Tech & Future Science',
            prompt: 'Technology, Artificial Intelligence, computing pioneers, astrophysics, robotics, quantum mechanics, and futuristic innovations'
        },
        'random': {
            name: 'Surprise Mix',
            prompt: 'A diverse, engaging mix across Bollywood cinema, Cricket, Football, World History, Science, and Current Affairs'
        }
    };

    // -------------------------------------------------------------------------
    // 2. WEB AUDIO API SYNTHESIZER
    // -------------------------------------------------------------------------
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        if (!STATE.soundEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        try {
            if (type === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'tick') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'correct') {
                // Ascending triumphant cyber chime (C5 -> E5 -> G5 -> C6)
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.07);
                    osc.stop(now + idx * 0.07 + 0.25);
                });
            } else if (type === 'wrong') {
                // Dissonant cyber buzz
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.28);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'victory') {
                // Fanfare chords
                const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                chords.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.1);
                    gain.gain.setValueAtTime(0.2, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.4);
                });
            }
        } catch (e) {
            console.warn('Audio playback glitch', e);
        }
    }

    // -------------------------------------------------------------------------
    // 3. OFFLINE PROCEDURAL QUESTION GENERATOR (FALLBACK & ZERO-KEY MODE)
    // -------------------------------------------------------------------------
    const OFFLINE_BANKS = {
        cricket: [
            {
                q: "Who holds the record for the highest individual score in an ODI innings?",
                opts: { A: "Rohit Sharma (264)", B: "Martin Guptill (237*)", C: "Virender Sehwag (219)", D: "Chris Gayle (215)" },
                ans: "A",
                fact: "Rohit Sharma scored a historic 264 off 173 balls against Sri Lanka at Eden Gardens in 2014."
            },
            {
                q: "Which country won the inaugural ICC Men's T20 World Cup in 2007?",
                opts: { A: "Pakistan", B: "India", C: "Australia", D: "West Indies" },
                ans: "B",
                fact: "India, captained by MS Dhoni, defeated Pakistan by 5 runs in a thrilling final in Johannesburg."
            },
            {
                q: "Who is the only bowler in international cricket to take 800 Test wickets?",
                opts: { A: "Shane Warne", B: "James Anderson", C: "Muttiah Muralitharan", D: "Anil Kumble" },
                ans: "C",
                fact: "Sri Lankan spin wizard Muttiah Muralitharan claimed his 800th wicket with his final delivery in Test cricket in 2010."
            },
            {
                q: "Who scored the fastest century in ODI cricket history off just 31 balls?",
                opts: { A: "Shahid Afridi", B: "AB de Villiers", C: "Corey Anderson", D: "Glenn Maxwell" },
                ans: "B",
                fact: "South African legend AB de Villiers blasted a 31-ball hundred against the West Indies at Johannesburg in 2015."
            },
            {
                q: "Which team won the inaugural Indian Premier League (IPL) in 2008?",
                opts: { A: "Chennai Super Kings", B: "Rajasthan Royals", C: "Mumbai Indians", D: "Kolkata Knight Riders" },
                ans: "B",
                fact: "Led by Shane Warne, underdog Rajasthan Royals beat Chennai Super Kings in the final over of the 2008 IPL final."
            },
            {
                q: "Who was the first batsman to score a double century in Men's One Day Internationals?",
                opts: { A: "Virender Sehwag", B: "Sachin Tendulkar", C: "Rohit Sharma", D: "Chris Gayle" },
                ans: "B",
                fact: "Sachin Tendulkar scored 200 not out against South Africa at Gwalior on February 24, 2010."
            },
            {
                q: "Which bowler took 10 wickets in a single Test innings for India against Pakistan in 1999?",
                opts: { A: "Kapil Dev", B: "Anil Kumble", C: "Harbhajan Singh", D: "Ravichandran Ashwin" },
                ans: "B",
                fact: "Anil Kumble achieved the historic feat of 10 for 74 at Feroz Shah Kotla, New Delhi."
            }
        ],
        bollywood: [
            {
                q: "Which iconic film featured the legendary dialogue: 'Mogambo khush hua'?",
                opts: { A: "Sholay", B: "Mr. India", C: "Don", D: "Deewaar" },
                ans: "B",
                fact: "The late Amrish Puri immortalized the line as the supervillain Mogambo in Shekhar Kapur's 1987 classic Mr. India."
            },
            {
                q: "Who directed the 2001 milestone film 'Dil Chahta Hai'?",
                opts: { A: "Karan Johar", B: "Farhan Akhtar", C: "Anurag Kashyap", D: "Zoya Akhtar" },
                ans: "B",
                fact: "Farhan Akhtar made his acclaimed directorial debut with Dil Chahta Hai, redefining contemporary Indian cinema."
            },
            {
                q: "Which Indian song made history by winning the Academy Award (Oscar) for Best Original Song in 2023?",
                opts: { A: "Jai Ho", B: "Naatu Naatu", C: "Chaiyya Chaiyya", D: "Kesariya" },
                ans: "B",
                fact: "Composed by M.M. Keeravani with lyrics by Chandrabose, RRR's energetic track Naatu Naatu won the prestigious Oscar."
            },
            {
                q: "Who played the lead role of the visionary teacher Ram Shankar Nikumbh in 'Taare Zameen Par'?",
                opts: { A: "Aamir Khan", B: "Shah Rukh Khan", C: "Salman Khan", D: "Akshay Kumar" },
                ans: "A",
                fact: "Aamir Khan both directed and starred as the compassionate art teacher Ram Shankar Nikumbh in Taare Zameen Par."
            },
            {
                q: "In 'Sholay' (1975), what was the name of Basanti's famous horse-drawn carriage mare?",
                opts: { A: "Bijlee", B: "Dhanno", C: "Chameli", D: "Kajri" },
                ans: "B",
                fact: "Hema Malini's character Basanti famously shouted 'Chal Dhanno, aaj teri Basanti ki izzat ka sawaal hai!'"
            },
            {
                q: "Which was India's first indigenous full-length feature film, released in 1913?",
                opts: { A: "Alam Ara", B: "Raja Harishchandra", C: "Kisan Kanya", D: "Achhut Kanya" },
                ans: "B",
                fact: "Directed by Dadasaheb Phalke, Raja Harishchandra marked the dawn of Indian cinema."
            }
        ],
        football: [
            {
                q: "Which nation has won the FIFA Men's World Cup the most times (5 titles)?",
                opts: { A: "Germany", B: "Italy", C: "Brazil", D: "Argentina" },
                ans: "C",
                fact: "Brazil won the World Cup in 1958, 1962, 1970, 1994, and 2002."
            },
            {
                q: "Who is the all-time top goalscorer in the UEFA Champions League?",
                opts: { A: "Lionel Messi", B: "Cristiano Ronaldo", C: "Robert Lewandowski", D: "Karim Benzema" },
                ans: "B",
                fact: "Cristiano Ronaldo leads with 140 Champions League goals scored across Manchester United, Real Madrid, and Juventus."
            },
            {
                q: "Which country won the FIFA Men's World Cup in Qatar 2022?",
                opts: { A: "France", B: "Argentina", C: "Croatia", D: "Morocco" },
                ans: "B",
                fact: "Argentina defeated France in an epic penalty shootout (3-3 aet) led by Lionel Messi's brace."
            },
            {
                q: "Which club has won the most UEFA Champions League / European Cup titles?",
                opts: { A: "AC Milan", B: "Bayern Munich", C: "Real Madrid", D: "Liverpool" },
                ans: "C",
                fact: "Real Madrid holds a record 15 European Cup / Champions League titles."
            },
            {
                q: "Who was awarded the FIFA Golden Ball as the best player at the 2014 World Cup?",
                opts: { A: "James Rodríguez", B: "Lionel Messi", C: "Thomas Müller", D: "Arjen Robben" },
                ans: "B",
                fact: "Lionel Messi received the Golden Ball after steering Argentina to the 2014 World Cup final."
            }
        ],
        'current-affairs': [
            {
                q: "Which country successfully landed its Chandrayaan-3 mission near the Moon's South Pole in 2023?",
                opts: { A: "United States", B: "India", C: "Russia", D: "China" },
                ans: "B",
                fact: "ISRO's Chandrayaan-3 made India the first nation to soft-land near the lunar south polar region on August 23, 2023."
            },
            {
                q: "Who was officially sworn in as the Secretary-General of the United Nations in 2017?",
                opts: { A: "Ban Ki-moon", B: "António Guterres", C: "Kofi Annan", D: "Tedros Adhanom" },
                ans: "B",
                fact: "Former Portuguese Prime Minister António Guterres took office as UN Secretary-General in January 2017."
            },
            {
                q: "Which city hosted the 2024 Summer Olympic Games?",
                opts: { A: "Tokyo", B: "Paris", C: "Los Angeles", D: "London" },
                ans: "B",
                fact: "Paris hosted the XXXIII Olympic Summer Games, featuring an opening ceremony along the River Seine."
            },
            {
                q: "Which company unveiled the revolutionary transformer model architecture in their 2017 paper 'Attention Is All You Need'?",
                opts: { A: "OpenAI", B: "Google", C: "Microsoft", D: "Meta" },
                ans: "B",
                fact: "Google Brain and Google Research researchers authored the groundbreaking Transformer paper that powers all modern LLMs."
            }
        ],
        history: [
            {
                q: "Who was the founder of the Maurya Empire in ancient India?",
                opts: { A: "Ashoka the Great", B: "Chandragupta Maurya", C: "Samudragupta", D: "Harsha" },
                ans: "B",
                fact: "Chandragupta Maurya founded the Maurya Empire around 322 BCE with the strategic guidance of Chanakya."
            },
            {
                q: "In which year did India officially gain independence from British rule?",
                opts: { A: "1942", B: "1947", C: "1950", D: "1948" },
                ans: "B",
                fact: "India attained freedom at the stroke of midnight on August 15, 1947."
            },
            {
                q: "Which historic monument in Agra was commissioned by Mughal Emperor Shah Jahan as a mausoleum for his wife Mumtaz?",
                opts: { A: "Fatehpur Sikri", B: "Taj Mahal", C: "Red Fort", D: "Qutub Minar" },
                ans: "B",
                fact: "Constructed with white Makrana marble, the Taj Mahal was designated a UNESCO World Heritage Site in 1983."
            },
            {
                q: "Which famous event in 1789 marked the beginning of the French Revolution?",
                opts: { A: "Battle of Waterloo", B: "Storming of the Bastille", C: "Signing of the Magna Carta", D: "Treaty of Versailles" },
                ans: "B",
                fact: "On July 14, 1789, Parisian citizens stormed the medieval fortress of the Bastille, igniting the revolution."
            }
        ],
        'tech-science': [
            {
                q: "What does the 'GPT' acronym in modern AI models stand for?",
                opts: { A: "General Purpose Transformer", B: "Generative Pre-trained Transformer", C: "Graphic Processing Technology", D: "Global Predictive Tensor" },
                ans: "B",
                fact: "Generative Pre-trained Transformers represent neural network architectures trained on vast token sequences."
            },
            {
                q: "Which planet in our solar system has the highest number of recognized moons?",
                opts: { A: "Jupiter", B: "Saturn", C: "Neptune", D: "Uranus" },
                ans: "B",
                fact: "Saturn leads with over 140 officially recognized moons, surpassing Jupiter."
            },
            {
                q: "Who is widely recognized as the world's first computer programmer for writing an algorithm for Babbage's Analytical Engine?",
                opts: { A: "Alan Turing", B: "Ada Lovelace", C: "Grace Hopper", D: "John von Neumann" },
                ans: "B",
                fact: "English mathematician Ada Lovelace published the first machine algorithm in 1843."
            },
            {
                q: "What Web API allows browser games to execute hardware-accelerated shaders directly on client GPUs?",
                opts: { A: "WebGL & WebGPU", B: "WebRTC", C: "WebSockets", D: "Service Workers" },
                ans: "A",
                fact: "WebGPU provides low-level graphics and compute access matching Metal, DirectX 12, and Vulkan."
            }
        ]
    };

    function getOfflineQuestions(category) {
        let pool = [];
        if (category === 'random') {
            Object.keys(OFFLINE_BANKS).forEach(key => {
                pool = pool.concat(OFFLINE_BANKS[key]);
            });
        } else if (OFFLINE_BANKS[category]) {
            pool = OFFLINE_BANKS[category].slice();
        } else {
            pool = OFFLINE_BANKS.cricket.slice();
        }

        // Shuffle pool
        const shuffled = pool.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        return selected.map((item, idx) => ({
            id: idx + 1,
            question: item.q,
            options: item.opts,
            answer: item.ans,
            fact: item.fact
        }));
    }

    // -------------------------------------------------------------------------
    // 4. CLOUDFLARE WORKER & GEMINI QUESTION FETCHING
    // -------------------------------------------------------------------------
    const CLOUDFLARE_WORKER_URL = 'https://neon-trivia-proxy.vayutripathi.workers.dev/generate';

    async function fetchGeminiQuestions(category) {
        const catInfo = CATEGORIES[category] || CATEGORIES.cricket;
        const lang = STATE.language || 'en';

        // TIER 1: Try Cloudflare Worker Proxy (100% Secret Backend Key)
        try {
            const workerResp = await fetch(CLOUDFLARE_WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: category, language: lang })
            });

            if (workerResp.ok) {
                const workerData = await workerResp.json();
                if (workerData && Array.isArray(workerData.questions) && workerData.questions.length >= 5) {
                    console.log('[Neon Trivia] Live questions generated via Cloudflare Worker proxy.');
                    return workerData.questions.slice(0, 5);
                }
            }
        } catch (workerErr) {
            // Worker not yet deployed or temporary network issue - proceed to next tier
            console.log('[Neon Trivia] Worker proxy skipped or deploying:', workerErr.message);
        }

        // TIER 2: Direct Gemini API via secure HTTP header (if user added key in settings)
        const apiKey = STATE.apiKey.trim();
        if (apiKey) {
            const langInstruction = lang === 'hi'
                ? `IMPORTANT: Generate ALL question text, all 4 option texts, and the fact explanation in HINDI using Devanagari script (हिन्दी). Only the JSON keys must remain in English.`
                : '';
            const promptText = `You are the master trivia engine for Neon AI Trivia.
Generate exactly 5 completely fresh, accurate, and engaging multiple-choice questions on the topic: "${catInfo.prompt}".
Include a mix of moderate and challenging questions.
${langInstruction}
Output STRICTLY a valid JSON array of 5 objects with no extra conversational text or markdown code fence blocks.
Each object must follow this exact schema:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "A": "Option text",
      "B": "Option text",
      "C": "Option text",
      "D": "Option text"
    },
    "answer": "A",
    "fact": "A one-sentence fascinating fact explaining why the answer is correct."
  }
]`;

            // Clean endpoint without exposing key in URL query string
            const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey // Header-based auth (never in query params)
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptText }]
                        }],
                        generationConfig: {
                            response_mime_type: 'application/json',
                            temperature: 0.95
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (textResponse) {
                        let cleaned = textResponse.trim();
                        if (cleaned.startsWith('```json')) {
                            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                        } else if (cleaned.startsWith('```')) {
                            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
                        }

                        const parsed = JSON.parse(cleaned);
                        if (Array.isArray(parsed) && parsed.length >= 5) {
                            return parsed.slice(0, 5);
                        }
                    }
                } else {
                    console.warn('[Neon Trivia] Direct Gemini API status:', response.status);
                    showToast('API quota limit or key issue — loaded backup generator');
                }
            } catch (err) {
                console.warn('[Neon Trivia] Direct Gemini API failed:', err);
            }
        }

        // TIER 3: Built-in Dynamic Fallback Generator
        console.log('[Neon Trivia] Using built-in dynamic question matrix.');
        return getOfflineQuestions(category);
    }

    // -------------------------------------------------------------------------
    // 5. SCREEN TRANSITIONS & UI HELPERS
    // -------------------------------------------------------------------------
    const screens = {
        lobby: document.getElementById('screen-lobby'),
        loading: document.getElementById('screen-loading'),
        gameplay: document.getElementById('screen-gameplay'),
        results: document.getElementById('screen-results')
    };

    function showScreen(name) {
        Object.keys(screens).forEach(key => {
            if (screens[key]) {
                screens[key].classList.toggle('active', key === name);
            }
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('toast-notify');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3200);
    }

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function checkDailyStreakStatus() {
        const today = getTodayString();
        const notice = document.getElementById('daily-completed-notice');
        const streakEl = document.getElementById('streak-count');
        const modeBadge = document.getElementById('hud-mode-badge');

        if (streakEl) streakEl.textContent = STATE.streak;

        if (STATE.lastDailyDate === today) {
            if (notice) notice.classList.remove('hidden');
        } else {
            if (notice) notice.classList.add('hidden');
        }

        if (modeBadge) {
            modeBadge.textContent = STATE.mode === 'daily' ? 'DAILY SPRINT' : 'PRACTICE ARENA';
        }
    }

    // -------------------------------------------------------------------------
    // 6. GAMEPLAY ENGINE
    // -------------------------------------------------------------------------
    async function startGame(category) {
        playSound('click');
        STATE.category = category;
        STATE.currentQIndex = 0;
        STATE.score = 0;
        STATE.speedPoints = 0;
        STATE.answersRecord = [];

        // Show loading screen
        const catInfo = CATEGORIES[category] || CATEGORIES.cricket;
        document.getElementById('loading-category-name').textContent = catInfo.name;
        showScreen('loading');

        // Animate loading bar
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = '20%';
        setTimeout(() => { if (bar) bar.style.width = '65%'; }, 400);

        const startTime = Date.now();
        STATE.questions = await fetchGeminiQuestions(category);

        const elapsed = Date.now() - startTime;
        const remainWait = Math.max(0, 900 - elapsed);

        if (bar) bar.style.width = '100%';

        setTimeout(() => {
            showScreen('gameplay');
            loadQuestion(0);
        }, remainWait);
    }

    function loadQuestion(index) {
        if (index >= STATE.questions.length) {
            finishGame();
            return;
        }

        STATE.currentQIndex = index;
        STATE.isAnswering = true;
        STATE.timerVal = 15;

        const q = STATE.questions[index];

        // Telemetry Update
        document.getElementById('current-q-index').textContent = index + 1;
        document.getElementById('hud-current-score').textContent = STATE.score;

        const catInfo = CATEGORIES[STATE.category] || CATEGORIES.cricket;
        document.getElementById('q-category-badge').textContent = catInfo.name.toUpperCase();
        document.getElementById('question-text').textContent = q.question;

        // Step Dots
        const dots = document.querySelectorAll('#step-dots .dot');
        dots.forEach((dot, idx) => {
            dot.className = 'dot';
            if (idx === index) dot.classList.add('active');
            else if (idx < index) {
                const rec = STATE.answersRecord[idx];
                if (rec && rec.isCorrect) dot.classList.add('correct');
                else dot.classList.add('wrong');
            }
        });

        // Hide explanation
        const expBox = document.getElementById('explanation-box');
        expBox.classList.remove('active');

        // Populate options
        const optsGrid = document.getElementById('options-grid');
        const optButtons = optsGrid.querySelectorAll('.option-btn');

        ['A', 'B', 'C', 'D'].forEach((key, idx) => {
            const btn = optButtons[idx];
            if (btn) {
                btn.className = 'option-btn';
                btn.disabled = false;
                btn.setAttribute('data-opt', key);
                const textEl = btn.querySelector('.opt-label');
                const iconEl = btn.querySelector('.opt-status-icon');
                if (textEl) textEl.textContent = q.options[key] || '';
                if (iconEl) iconEl.textContent = '';
            }
        });

        startTimer();
    }

    function startTimer() {
        clearInterval(STATE.timerInterval);
        const timerBar = document.getElementById('timer-bar');
        const timerText = document.getElementById('timer-text');

        function updateDisplay() {
            const pct = (STATE.timerVal / 15) * 100;
            if (timerBar) {
                timerBar.style.width = pct + '%';
                timerBar.classList.remove('warning', 'danger');
                if (STATE.timerVal <= 4) timerBar.classList.add('danger');
                else if (STATE.timerVal <= 8) timerBar.classList.add('warning');
            }
            if (timerText) timerText.textContent = Math.ceil(STATE.timerVal) + 's';
        }

        updateDisplay();

        STATE.timerInterval = setInterval(() => {
            STATE.timerVal -= 0.1;
            if (Math.floor(STATE.timerVal * 10) % 10 === 0 && STATE.timerVal > 0) {
                playSound('tick');
            }

            if (STATE.timerVal <= 0) {
                STATE.timerVal = 0;
                updateDisplay();
                clearInterval(STATE.timerInterval);
                handleTimeOut();
            } else {
                updateDisplay();
            }
        }, 100);
    }

    function handleOptionSelect(chosenKey) {
        if (!STATE.isAnswering) return;
        STATE.isAnswering = false;
        clearInterval(STATE.timerInterval);

        const q = STATE.questions[STATE.currentQIndex];
        const isCorrect = (chosenKey.toUpperCase() === q.answer.toUpperCase());
        const speedAward = Math.floor(STATE.timerVal * 100);

        if (isCorrect) {
            playSound('correct');
            STATE.score += 1;
            STATE.speedPoints += (1000 + speedAward);
        } else {
            playSound('wrong');
        }

        STATE.answersRecord.push({
            q: q.question,
            selected: chosenKey,
            correct: q.answer,
            isCorrect: isCorrect,
            fact: q.fact
        });

        // Highlight Buttons
        const optButtons = document.querySelectorAll('#options-grid .option-btn');
        optButtons.forEach(btn => {
            btn.disabled = true;
            const key = btn.getAttribute('data-opt');
            const icon = btn.querySelector('.opt-status-icon');

            if (key === chosenKey) {
                if (isCorrect) {
                    btn.classList.add('selected-correct');
                    if (icon) icon.textContent = '✅';
                } else {
                    btn.classList.add('selected-wrong');
                    if (icon) icon.textContent = '❌';
                }
            } else if (key === q.answer) {
                btn.classList.add('reveal-correct');
                if (icon) icon.textContent = '✅';
            }
        });

        // Show Explanation Card
        const expBox = document.getElementById('explanation-box');
        const expHeadline = document.getElementById('exp-headline');
        const expText = document.getElementById('exp-text');
        const expIcon = document.getElementById('exp-status-icon');

        if (isCorrect) {
            expIcon.textContent = '⚡';
            expHeadline.textContent = 'EXCELLENT! + ' + (1000 + speedAward) + ' PTS';
            expHeadline.style.color = '#34d399';
        } else {
            expIcon.textContent = '⚠️';
            expHeadline.textContent = 'MISSED TARGET (CORRECT: ' + q.answer + ')';
            expHeadline.style.color = '#ff0055';
        }

        expText.textContent = q.fact || 'AI Verified answer.';
        expBox.classList.add('active');

        // Transition to next question
        setTimeout(() => {
            loadQuestion(STATE.currentQIndex + 1);
        }, 2400);
    }

    function handleTimeOut() {
        if (!STATE.isAnswering) return;
        STATE.isAnswering = false;

        playSound('wrong');
        const q = STATE.questions[STATE.currentQIndex];

        STATE.answersRecord.push({
            q: q.question,
            selected: 'TIMEOUT',
            correct: q.answer,
            isCorrect: false,
            fact: q.fact
        });

        const optButtons = document.querySelectorAll('#options-grid .option-btn');
        optButtons.forEach(btn => {
            btn.disabled = true;
            const key = btn.getAttribute('data-opt');
            const icon = btn.querySelector('.opt-status-icon');
            if (key === q.answer) {
                btn.classList.add('reveal-correct');
                if (icon) icon.textContent = '✅';
            }
        });

        const expBox = document.getElementById('explanation-box');
        const expHeadline = document.getElementById('exp-headline');
        const expText = document.getElementById('exp-text');
        const expIcon = document.getElementById('exp-status-icon');

        expIcon.textContent = '⏱️';
        expHeadline.textContent = 'TIME EXPIRED! (CORRECT: ' + q.answer + ')';
        expHeadline.style.color = '#ff0055';
        expText.textContent = q.fact || 'Remember for next time!';
        expBox.classList.add('active');

        setTimeout(() => {
            loadQuestion(STATE.currentQIndex + 1);
        }, 2500);
    }

    function finishGame() {
        clearInterval(STATE.timerInterval);
        playSound('victory');

        // If in daily mode, save daily streak
        const today = getTodayString();
        if (STATE.mode === 'daily') {
            if (STATE.lastDailyDate !== today) {
                STATE.lastDailyDate = today;
                STATE.streak += 1;
                localStorage.setItem('neon_trivia_last_daily', today);
                localStorage.setItem('neon_trivia_streak', STATE.streak.toString());
            }
        }

        // Ratings
        const score = STATE.score;
        let rating = "REBOOT REQUIRED";
        let subtext = "Spend more time training your knowledge nodes!";
        let icon = "🔰";

        if (score === 5) {
            rating = "CYBERMIND GRANDMASTER";
            subtext = "Flawless cognitive performance! Your knowledge is unmatched.";
            icon = "🏆";
        } else if (score === 4) {
            rating = "TACTICAL STRATEGIST";
            subtext = "Outstanding speed and accuracy across difficult parameters!";
            icon = "⚡";
        } else if (score === 3) {
            rating = "ADEPT SCHOLAR";
            subtext = "Solid foundation! A few tweaks will push you to perfection.";
            icon = "🧠";
        } else if (score >= 1) {
            rating = "NEO CADET";
            subtext = "Good effort! Practice makes your memory circuits sharper.";
            icon = "🎯";
        }

        document.getElementById('result-badge-icon').textContent = icon;
        document.getElementById('result-rating').textContent = rating;
        document.getElementById('final-score').textContent = score;
        document.getElementById('result-subtext').textContent = subtext;

        const accuracyPct = Math.round((score / 5) * 100);
        document.getElementById('stat-accuracy').textContent = accuracyPct + '%';
        document.getElementById('stat-pts').textContent = STATE.speedPoints.toLocaleString();
        document.getElementById('stat-streak').textContent = '🔥 ' + STATE.streak + ' DAYS';

        // Render Review List
        const reviewList = document.getElementById('review-list');
        reviewList.innerHTML = '';
        STATE.answersRecord.forEach((rec, idx) => {
            const item = document.createElement('div');
            item.className = 'review-item ' + (rec.isCorrect ? 'is-correct' : 'is-wrong');
            item.innerHTML = `
                <div class="review-q-title">${idx + 1}. ${escapeHTML(rec.q)}</div>
                <div class="review-answer-line">
                    Your Choice: <strong>[${rec.selected}]</strong> | Correct: <strong>[${rec.correct}]</strong>
                    ${rec.isCorrect ? ' ✨' : ' ❌'}
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;"><em>💡 ${escapeHTML(rec.fact || '')}</em></div>
            `;
            reviewList.appendChild(item);
        });

        showScreen('results');
        checkDailyStreakStatus();
    }

    function escapeHTML(str) {
        return (str || '').replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    // -------------------------------------------------------------------------
    // 7. EVENT LISTENERS & INITIALIZATION
    // -------------------------------------------------------------------------
    function initListeners() {
        // Mode Selector
        const modeTabs = document.querySelectorAll('.mode-tab');
        modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                playSound('click');
                modeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                STATE.mode = tab.getAttribute('data-mode') || 'daily';
                checkDailyStreakStatus();
            });
        });

        // Language Selector (English or Hindi)
        const langBtns = document.querySelectorAll('.lang-btn');
        const rawSavedLang = localStorage.getItem('neon_trivia_lang');
        const savedLang = (rawSavedLang === 'hi' || rawSavedLang === 'en') ? rawSavedLang : 'en';
        STATE.language = savedLang;
        langBtns.forEach(btn => {
            // Restore saved active state
            if (btn.getAttribute('data-lang') === savedLang) {
                langBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                playSound('click');
                langBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.language = btn.getAttribute('data-lang') || 'en';
                localStorage.setItem('neon_trivia_lang', STATE.language);
                const label = btn.getAttribute('data-label') || 'English';
                showToast(`🌐 Language set to ${label}`);
            });
        });

        // Category Cards
        const catCards = document.querySelectorAll('.category-card');
        catCards.forEach(card => {
            card.addEventListener('click', () => {
                const cat = card.getAttribute('data-category') || 'cricket';
                startGame(cat);
            });
        });

        // Options Buttons (A, B, C, D)
        const optButtons = document.querySelectorAll('#options-grid .option-btn');
        optButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const optKey = btn.getAttribute('data-opt');
                if (optKey) handleOptionSelect(optKey);
            });
        });

        // Keyboard Shortcuts (A, B, C, D or 1, 2, 3, 4)
        window.addEventListener('keydown', (e) => {
            if (!STATE.isAnswering) return;
            const key = e.key.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(key)) {
                handleOptionSelect(key);
            } else if (key === '1') handleOptionSelect('A');
            else if (key === '2') handleOptionSelect('B');
            else if (key === '3') handleOptionSelect('C');
            else if (key === '4') handleOptionSelect('D');
        });

        // Audio Toggle
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                STATE.soundEnabled = !STATE.soundEnabled;
                soundBtn.textContent = STATE.soundEnabled ? '🔊' : '🔇';
                soundBtn.style.opacity = STATE.soundEnabled ? '1' : '0.6';
            });
        }

        // Settings Modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const saveKeyBtn = document.getElementById('save-key-btn');
        const clearKeyBtn = document.getElementById('clear-key-btn');
        const keyInput = document.getElementById('gemini-key-input');

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                playSound('click');
                if (keyInput) keyInput.value = STATE.apiKey;
                settingsModal.classList.add('active');
            });

            modalCloseBtn.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });

            saveKeyBtn.addEventListener('click', () => {
                playSound('click');
                const val = (keyInput.value || '').trim();
                STATE.apiKey = val;
                localStorage.setItem('gemini_api_key', val);
                settingsModal.classList.remove('active');
                showToast(val ? 'Gemini API Key Saved & Active!' : 'Key removed; using dynamic generator.');
                updateEngineStatus();
            });

            clearKeyBtn.addEventListener('click', () => {
                playSound('click');
                if (keyInput) keyInput.value = '';
                STATE.apiKey = '';
                localStorage.removeItem('gemini_api_key');
                settingsModal.classList.remove('active');
                showToast('Key cleared; dynamic generator active.');
                updateEngineStatus();
            });

            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            });
        }

        // Back to Lobby Button (from gameplay screen)
        const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
        if (backToLobbyBtn) {
            backToLobbyBtn.addEventListener('click', () => {
                playSound('click');
                clearInterval(STATE.timerInterval);
                STATE.isAnswering = false;
                showScreen('lobby');
                checkDailyStreakStatus();
            });
        }

        // Play Again Button
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                playSound('click');
                showScreen('lobby');
                checkDailyStreakStatus();
            });
        }

        // Share Score Button
        const shareScoreBtn = document.getElementById('share-score-btn');
        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', () => {
                playSound('click');
                const catInfo = CATEGORIES[STATE.category] || CATEGORIES.cricket;
                const shareText = `🧠 Daily Quiz [${catInfo.name}]: Scored ${STATE.score}/5 (${STATE.speedPoints.toLocaleString()} PTS)! Can you beat my score? Play free at https://arcadehubplay.com/play-neon-trivia`;

                if (navigator.share) {
                    navigator.share({
                        title: 'Daily Quiz',
                        text: shareText,
                        url: 'https://arcadehubplay.com/play-neon-trivia'
                    }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareText).then(() => {
                        showToast('Results copied to clipboard!');
                    });
                } else {
                    showToast('Sharing not supported on this browser');
                }
            });
        }
    }

    function updateEngineStatus() {
        const dot = document.getElementById('engine-status-dot');
        const text = document.getElementById('engine-status-text');
        if (!dot || !text) return;

        if (STATE.apiKey) {
            dot.style.background = '#00ffcc';
            text.textContent = 'Google Gemini 1.5/2.0 API Connected';
        } else {
            dot.style.background = '#a855f7';
            text.textContent = 'Smart Dynamic Trivia Engine Active';
        }
    }

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        initListeners();
        checkDailyStreakStatus();
        updateEngineStatus();
    });

})();
