/**
 * Arcade Hub & Sonora — Device Experience Engine
 * 1. Eco-Battery & Network Monitoring
 * 2. Welcome Back & Streak Tracking
 * 3. Quick Game / Sonora Resume
 */
(function(window) {
    'use strict';

    const STREAK_KEY = 'arcade_streak_info_v1';
    const LAST_GAME_KEY = 'arcade_last_played_game';
    const SONORA_HISTORY_KEY = 'sonora-watch-history';
    let toastTimeout = null;

    // -------------------------------------------------------------------------
    // 1. TOAST NOTIFICATION UTILITY
    // -------------------------------------------------------------------------
    function showToast(icon, message, duration = 4000) {
        let toast = document.getElementById('experienceToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'experienceToast';
            toast.className = 'experience-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.innerHTML = '<span class="experience-toast-icon" id="experienceToastIcon"></span><span class="experience-toast-msg" id="experienceToastMsg"></span>';
            document.body.appendChild(toast);
        }

        const iconEl = toast.querySelector('#experienceToastIcon');
        const msgEl = toast.querySelector('#experienceToastMsg');
        if (iconEl) iconEl.textContent = icon;
        if (msgEl) msgEl.textContent = message;

        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // -------------------------------------------------------------------------
    // 2. STREAK & VISITOR PERSONA
    // -------------------------------------------------------------------------
    function updateStreak() {
        try {
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            let data = null;
            try {
                const stored = localStorage.getItem(STREAK_KEY);
                if (stored) data = JSON.parse(stored);
            } catch (e) {}

            if (!data || typeof data.count !== 'number') {
                data = { count: 1, lastDate: today, totalVisits: 1 };
            } else if (data.lastDate === today) {
                // Already visited today
            } else if (data.lastDate === yesterday) {
                // Visited yesterday -> consecutive streak
                data.count += 1;
                data.lastDate = today;
                data.totalVisits = (data.totalVisits || 1) + 1;
            } else {
                // Streak broke
                data.count = 1;
                data.lastDate = today;
                data.totalVisits = (data.totalVisits || 1) + 1;
            }

            try {
                localStorage.setItem(STREAK_KEY, JSON.stringify(data));
            } catch (e) {}

            return data;
        } catch (e) {
            return { count: 1, lastDate: new Date().toDateString(), totalVisits: 1 };
        }
    }

    // -------------------------------------------------------------------------
    // 3. LAST ACTIVITY (GAME OR SONORA)
    // -------------------------------------------------------------------------
    function getLastActivity() {
        let lastGame = null;
        let lastSong = null;

        try {
            const g = localStorage.getItem(LAST_GAME_KEY);
            if (g) lastGame = JSON.parse(g);
        } catch (e) {}

        try {
            const s = localStorage.getItem(SONORA_HISTORY_KEY);
            if (s) {
                const arr = JSON.parse(s);
                if (Array.isArray(arr) && arr.length > 0) {
                    lastSong = arr[0];
                }
            }
        } catch (e) {}

        if (lastGame && lastSong) {
            return (lastGame.timestamp || 0) >= (lastSong.timestamp || 0)
                ? { type: 'game', data: lastGame }
                : { type: 'song', data: lastSong };
        }
        if (lastGame) return { type: 'game', data: lastGame };
        if (lastSong) return { type: 'song', data: lastSong };
        return null;
    }

    // -------------------------------------------------------------------------
    // 4. WELCOME BACK BAR INITIALIZATION
    // -------------------------------------------------------------------------
    function initWelcomeBack() {
        const bar = document.getElementById('welcomeBackBar');
        if (!bar) return;

        // Check if user dismissed it in this session
        try {
            if (sessionStorage.getItem('arcade_welcome_dismissed')) return;
        } catch (e) {}

        const streak = updateStreak();
        const activity = getLastActivity();

        const streakText = document.getElementById('welcomeStreakText');
        const greeting = document.getElementById('welcomeGreeting');
        const resumeWrap = document.getElementById('welcomeResumeWrap');
        const dismissBtn = document.getElementById('welcomeDismissBtn');

        if (streakText) {
            streakText.textContent = streak.count === 1 ? 'Day 1 Streak' : `${streak.count}-Day Streak!`;
        }

        if (greeting) {
            greeting.textContent = (streak.totalVisits > 1 || streak.count > 1)
                ? 'Welcome back, Player!'
                : 'Welcome to Arcade Hub!';
        }

        if (resumeWrap) {
            resumeWrap.innerHTML = '';
            if (activity && activity.type === 'game' && activity.data && activity.data.title) {
                const btn = document.createElement('a');
                btn.className = 'welcome-resume-btn';
                btn.href = activity.data.url;
                btn.title = `Resume playing ${activity.data.title}`;
                btn.innerHTML = `<span>▶ Resume</span> <strong>${escapeHtml(activity.data.title)}</strong>`;
                resumeWrap.appendChild(btn);
            } else if (activity && activity.type === 'song' && activity.data && activity.data.title) {
                const btn = document.createElement('a');
                btn.className = 'welcome-resume-btn';
                btn.href = 'sonora';
                btn.title = `Resume listening to ${activity.data.title}`;
                const shortTitle = activity.data.title.split('·')[0].split('|')[0].trim();
                btn.innerHTML = `<span>🎧 Resume</span> <strong>${escapeHtml(shortTitle.slice(0, 22))}</strong>`;
                resumeWrap.appendChild(btn);
            }
        }

        bar.style.display = 'inline-flex';

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                bar.style.display = 'none';
                try {
                    sessionStorage.setItem('arcade_welcome_dismissed', '1');
                } catch (e) {}
            });
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // -------------------------------------------------------------------------
    // 5. ECO-BATTERY MONITORING
    // -------------------------------------------------------------------------
    function initBatteryMonitoring() {
        if (!('getBattery' in navigator)) return;

        navigator.getBattery().then(battery => {
            let lastCharging = battery.charging;
            let notifiedLow = false;

            function checkBattery() {
                const level = battery.level;
                const charging = battery.charging;

                if (!charging && level <= 0.20) {
                    if (!document.body.classList.contains('eco-mode')) {
                        document.body.classList.add('eco-mode');
                        if (!notifiedLow) {
                            notifiedLow = true;
                            showToast('🔋', `Battery at ${Math.round(level * 100)}% · Eco-Mode Activated to extend battery life`);
                        }
                    }
                } else if (charging && document.body.classList.contains('eco-mode')) {
                    document.body.classList.remove('eco-mode');
                    notifiedLow = false;
                    showToast('⚡', 'Charger Connected · High Performance Mode Restored');
                }

                if (charging !== lastCharging) {
                    lastCharging = charging;
                    if (charging) {
                        showToast('⚡', 'Charging · Performance Mode Active');
                    }
                }
            }

            checkBattery();
            battery.addEventListener('levelchange', checkBattery);
            battery.addEventListener('chargingchange', checkBattery);
        }).catch(() => {});
    }

    // -------------------------------------------------------------------------
    // 6. NETWORK & DATA SAVER MONITORING
    // -------------------------------------------------------------------------
    function initNetworkMonitoring() {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('offline', () => {
                showToast('📡', 'You are Offline · Offline games and cached playlists are ready!');
            });

            window.addEventListener('online', () => {
                showToast('✅', 'Back Online · Connection restored!');
            });
        }

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            function checkConnection() {
                if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
                    if (!document.body.classList.contains('data-saver')) {
                        document.body.classList.add('data-saver');
                        showToast('📶', 'Slow Network Detected · Data Saver Active');
                    }
                } else if (document.body.classList.contains('data-saver')) {
                    document.body.classList.remove('data-saver');
                }
            }
            checkConnection();
            conn.addEventListener('change', checkConnection);
        }
    }

    // -------------------------------------------------------------------------
    // 7. TRACK GAME CARD CLICKS FOR QUICK RESUME
    // -------------------------------------------------------------------------
    function initGameTracking() {
        // Main page card click tracking
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.game-card');
            if (card && card.getAttribute('href')) {
                const titleEl = card.querySelector('.game-title') || card.querySelector('h2') || card.querySelector('h3');
                const title = titleEl ? titleEl.textContent.trim() : 'Arcade Game';
                const url = card.getAttribute('href');
                try {
                    localStorage.setItem(LAST_GAME_KEY, JSON.stringify({
                        title: title,
                        url: url,
                        timestamp: Date.now()
                    }));
                } catch (err) {}
            }
        });

        // Current page auto-track if playing a game
        const path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
        if (path.includes('play-')) {
            const pageTitle = document.title.split('—')[0].split('-')[0].trim() || 'Arcade Game';
            try {
                localStorage.setItem(LAST_GAME_KEY, JSON.stringify({
                    title: pageTitle,
                    url: window.location.pathname,
                    timestamp: Date.now()
                }));
            } catch (err) {}
        }
    }

    // -------------------------------------------------------------------------
    // 8. AUTO INITIALIZE
    // -------------------------------------------------------------------------
    function init() {
        initWelcomeBack();
        initBatteryMonitoring();
        initNetworkMonitoring();
        initGameTracking();
    }

    window.ArcadeExperience = {
        showToast,
        updateStreak,
        getLastActivity,
        init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
