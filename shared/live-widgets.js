/**
 * Arcade Hub — Live Weather & Mood + Festivals & Holidays Engine
 * 100% Free, Zero-Key Open APIs (Open-Meteo & Curated Festival Calendar).
 * Non-blocking, independent loading with sessionStorage caching.
 */
(function(window) {
    'use strict';

    const WEATHER_CACHE_KEY = 'arcade_weather_cache_v1';
    const FESTIVAL_CACHE_KEY = 'arcade_festival_cache_v1';
    const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    // -------------------------------------------------------------------------
    // 1. FESTIVAL CALENDAR DATA (India & Global)
    // -------------------------------------------------------------------------
    const FESTIVALS = [
        { name: 'Makar Sankranti / Pongal', icon: '🪁', date: '2026-01-14', country: 'IN', vibe: 'Harvest celebrations · High-flying fun in Sky Jumper!' },
        { name: 'Republic Day', icon: '🇮🇳', date: '2026-01-26', country: 'IN', vibe: 'Patriotic anthems & retro arcade pride!' },
        { name: 'Valentine\'s Day', icon: '💖', date: '2026-02-14', country: 'ALL', vibe: 'Romantic 90s Bollywood hits on Sonora' },
        { name: 'Maha Shivratri', icon: '🕉️', date: '2026-02-16', country: 'IN', vibe: 'Devotional & peaceful midnight soundscapes' },
        { name: 'Holi', icon: '🎨', date: '2026-03-04', country: 'IN', vibe: 'Color blast! High-energy party tracks on Sonora' },
        { name: 'Eid al-Fitr', icon: '🌙', date: '2026-03-21', country: 'ALL', vibe: 'Festive celebrations · Joyful tunes & puzzle rewards' },
        { name: 'Baisakhi', icon: '🌾', date: '2026-04-14', country: 'IN', vibe: 'Karan Aujla & Punjabi Hits celebration' },
        { name: 'Eid al-Adha', icon: '✨', date: '2026-05-28', country: 'ALL', vibe: 'Festive harmony & special soundscapes' },
        { name: 'Independence Day', icon: '🇮🇳', date: '2026-08-15', country: 'IN', vibe: 'Celebrating freedom with 28+ free arcade games' },
        { name: 'Raksha Bandhan', icon: '🧵', date: '2026-08-28', country: 'IN', vibe: 'Family bonding & casual retro challenges' },
        { name: 'Ganesh Chaturthi', icon: '🐘', date: '2026-09-14', country: 'IN', vibe: 'Festive beats & celebratory gaming rush' },
        { name: 'Gandhi Jayanti', icon: '🕊️', date: '2026-10-02', country: 'IN', vibe: 'Peaceful zen vibes in Zen Snake & Dino' },
        { name: 'Navratri Begins', icon: '🪔', date: '2026-10-11', country: 'IN', vibe: 'Dandiya rhythms & upbeat Sonora mixes' },
        { name: 'Dussehra', icon: '🏹', date: '2026-10-20', country: 'IN', vibe: 'Victory of good over evil · Boss battles active!' },
        { name: 'Halloween', icon: '🎃', date: '2026-10-31', country: 'ALL', vibe: 'Spooky season in Neon Zombie Shooter!' },
        { name: 'Diwali', icon: '🪔', date: '2026-11-08', country: 'IN', vibe: 'Festival of Lights · Celebratory party hits on Sonora!' },
        { name: 'Govardhan Puja', icon: '🙏', date: '2026-11-10', country: 'IN', vibe: 'Festive blessings & cheerful retro soundscapes' },
        { name: 'Bhai Dooj', icon: '✨', date: '2026-11-11', country: 'IN', vibe: 'Festive Arcade Rush mode active!' },
        { name: 'Chhath Puja', icon: '🌅', date: '2026-11-15', country: 'IN', vibe: 'Sunset & Sunrise prayers · Spiritual & serene audio vibes' },
        { name: 'Guru Nanak Jayanti', icon: 'ੴ', date: '2026-11-24', country: 'IN', vibe: 'Satinder Sartaaj Sufi classics on Sonora' },
        { name: 'Thanksgiving', icon: '🦃', date: '2026-11-26', country: 'US', vibe: 'Holiday gaming with friends & family' },
        { name: 'Christmas', icon: '🎄', date: '2026-12-25', country: 'ALL', vibe: 'Winter wonderland & holiday arcade tournaments!' },
        { name: 'New Year\'s Eve', icon: '🎆', date: '2026-12-31', country: 'ALL', vibe: 'Countdown to 2027 · New high score season begins!' },
        { name: 'New Year\'s Day', icon: '🎉', date: '2027-01-01', country: 'ALL', vibe: 'Happy New Year! Start the year with an arcade high score!' }
    ];

    // -------------------------------------------------------------------------
    // 2. WEATHER CODE TO INTERPRETATION HELPER (WMO Standard)
    // -------------------------------------------------------------------------
    function parseWeatherCode(code, isDay) {
        switch (code) {
            case 0:
                return {
                    label: isDay ? 'Clear & Sunny' : 'Clear Sky',
                    icon: isDay ? '☀️' : '🌙',
                    mood: 'Warm synth & crisp arcade action',
                    sonoraLib: isDay ? 'default-road-trip-song' : 'default-midnight-vibes'
                };
            case 1:
            case 2:
                return {
                    label: isDay ? 'Partly Cloudy' : 'Clear & Cool',
                    icon: isDay ? '🌤️' : '☁️',
                    mood: 'Smooth chill & arcade vibes',
                    sonoraLib: 'default-90s-song'
                };
            case 3:
                return {
                    label: 'Overcast',
                    icon: '☁️',
                    mood: 'Cozy gaming & retro puzzles',
                    sonoraLib: 'default-kabhi-yaadon-mein'
                };
            case 45:
            case 48:
                return {
                    label: 'Foggy / Misty',
                    icon: '🌫️',
                    mood: 'Mysterious neon synthwave vibes',
                    sonoraLib: 'default-midnight-vibes'
                };
            case 51:
            case 53:
            case 55:
                return {
                    label: 'Light Drizzle',
                    icon: '🌦️',
                    mood: 'Rainy Lo-Fi & chill tracks on Sonora',
                    sonoraLib: 'default-road-trip-song'
                };
            case 61:
            case 63:
            case 65:
            case 80:
            case 81:
            case 82:
                return {
                    label: 'Rainy Day',
                    icon: '🌧️',
                    mood: 'Rainy day tunes & puzzle marathons',
                    sonoraLib: 'default-road-trip-song'
                };
            case 71:
            case 73:
            case 75:
                return {
                    label: 'Snowy Weather',
                    icon: '❄️',
                    mood: 'Chilly outside, warm arcade inside',
                    sonoraLib: 'default-hollywood'
                };
            case 95:
            case 96:
            case 99:
                return {
                    label: 'Thunderstorm',
                    icon: '⛈️',
                    mood: 'Intense arcade action & electric beats',
                    sonoraLib: 'default-karan-aujla'
                };
            default:
                return {
                    label: 'Pleasant Weather',
                    icon: '✨',
                    mood: 'Great day for high-FPS gaming',
                    sonoraLib: 'default-karan-aujla'
                };
        }
    }

    // -------------------------------------------------------------------------
    // 3. LOAD WEATHER CARD (Completely Independent & Non-Blocking)
    // -------------------------------------------------------------------------
    async function loadWeatherCard() {
        const card = document.getElementById('heroWeatherCard');
        if (!card) return;

        // Try reading fresh cache
        try {
            const cached = sessionStorage.getItem(WEATHER_CACHE_KEY);
            if (cached) {
                const item = JSON.parse(cached);
                if (Date.now() - (item.timestamp || 0) < WEATHER_CACHE_TTL) {
                    renderWeather(item.data);
                    return;
                }
            }
        } catch (e) {}

        // Fallback or live resolve
        try {
            let lat = 28.6139; // Default Delhi
            let lon = 77.2090;
            let cityName = 'Delhi';
            let countryCode = 'IN';

            // Check if ArcadeAmbient already resolved geo
            if (window.ArcadeAmbient && window.ArcadeAmbient.resolveGeo) {
                const geo = await window.ArcadeAmbient.resolveGeo();
                if (geo) {
                    cityName = geo.city || cityName;
                    countryCode = geo.countryCode || countryCode;
                }
            }

            // Attempt fast geo fetch from ipwho.is if lat/lon needed
            try {
                const ipRes = await fetch('https://ipwho.is/');
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData && ipData.success) {
                        lat = ipData.latitude;
                        lon = ipData.longitude;
                        cityName = ipData.city || cityName;
                        countryCode = ipData.country_code || countryCode;
                    }
                }
            } catch (err) {}

            // Open-Meteo call (100% Free, No-Key)
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current_weather=true`);
            if (weatherRes.ok) {
                const weatherData = await weatherRes.json();
                if (weatherData && weatherData.current_weather) {
                    const cw = weatherData.current_weather;
                    const parsed = parseWeatherCode(cw.weathercode, Boolean(cw.is_day));
                    const payload = {
                        city: cityName,
                        country: countryCode,
                        temp: Math.round(cw.temperature),
                        icon: parsed.icon,
                        condition: parsed.label,
                        mood: parsed.mood,
                        sonoraLib: parsed.sonoraLib
                    };

                    try {
                        sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
                            timestamp: Date.now(),
                            data: payload
                        }));
                    } catch (e) {}

                    renderWeather(payload);
                }
            }
        } catch (e) {
            // Graceful fallback display
            renderWeather({
                city: 'Local',
                country: '',
                temp: 26,
                icon: '☀️',
                condition: 'Pleasant',
                mood: 'Great day for high-FPS gaming',
                sonoraLib: 'default-karan-aujla'
            });
        }
    }

    function renderWeather(data) {
        const card = document.getElementById('heroWeatherCard');
        if (!card) return;

        const locEl = document.getElementById('weatherCardLoc');
        const iconEl = document.getElementById('weatherCardIcon');
        const tempEl = document.getElementById('weatherCardTemp');
        const condEl = document.getElementById('weatherCardCond');
        const moodEl = document.getElementById('weatherCardMood');

        if (locEl) locEl.textContent = `${data.city}${data.country ? ', ' + data.country : ''}`;
        if (iconEl) iconEl.textContent = data.icon;
        if (tempEl) tempEl.textContent = `${data.temp}°C`;
        if (condEl) condEl.textContent = data.condition;
        if (moodEl) moodEl.textContent = `🎧 ${data.mood}`;

        card.classList.add('loaded');

        // Clickable card: opens Sonora with recommended weather vibe
        if (!card._hasClickListener && data.sonoraLib) {
            card._hasClickListener = true;
            if (card.style) card.style.cursor = 'pointer';
            card.title = `Weather Mood: Click to stream ${data.condition} soundscapes on Sonora!`;
            if (card.addEventListener) {
                card.addEventListener('click', () => {
                    window.location.href = `sonora?lib=${encodeURIComponent(data.sonoraLib)}`;
                });
            }
        }
    }

    // -------------------------------------------------------------------------
    // 4. LOAD FESTIVAL CARD (Completely Independent & Non-Blocking)
    // -------------------------------------------------------------------------
    function loadFestivalCard() {
        const card = document.getElementById('heroFestivalCard');
        if (!card) return;

        try {
            const cached = sessionStorage.getItem(FESTIVAL_CACHE_KEY);
            if (cached) {
                const item = JSON.parse(cached);
                renderFestival(item);
                return;
            }
        } catch (e) {}

        const now = new Date();
        const nowMs = now.getTime();
        let targetEvent = null;
        let isToday = false;
        let minDiff = Infinity;

        // Find today's festival or the closest upcoming festival
        for (const f of FESTIVALS) {
            const fDate = new Date(f.date + 'T00:00:00');
            const diffTime = fDate.getTime() - nowMs;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                targetEvent = f;
                isToday = true;
                break;
            } else if (diffDays > 0 && diffDays < minDiff) {
                minDiff = diffDays;
                targetEvent = { ...f, daysRemaining: diffDays };
            }
        }

        // If at the end of the year, loop back to the first festival
        if (!targetEvent && FESTIVALS.length > 0) {
            targetEvent = { ...FESTIVALS[0], daysRemaining: 14 };
        }

        const payload = {
            name: targetEvent ? targetEvent.name : 'Arcade Fest',
            icon: targetEvent ? targetEvent.icon : '🎉',
            isToday: isToday,
            countdownText: isToday ? '🎉 TODAY!' : (targetEvent.daysRemaining === 1 ? '📅 Tomorrow!' : `📅 In ${targetEvent.daysRemaining} Days`),
            vibe: targetEvent ? targetEvent.vibe : 'Festive celebration mode active!',
            country: targetEvent && targetEvent.country === 'US' ? 'United States 🇺🇸' : 'India 🇮🇳'
        };

        try {
            sessionStorage.setItem(FESTIVAL_CACHE_KEY, JSON.stringify(payload));
        } catch (e) {}

        renderFestival(payload);
    }

    function renderFestival(data) {
        const card = document.getElementById('heroFestivalCard');
        if (!card) return;

        const locEl = document.getElementById('festivalCardLoc');
        const iconEl = document.getElementById('festivalCardIcon');
        const nameEl = document.getElementById('festivalCardName');
        const countEl = document.getElementById('festivalCardCountdown');
        const vibeEl = document.getElementById('festivalCardVibe');

        if (locEl) locEl.textContent = data.country;
        if (iconEl) iconEl.textContent = data.icon;
        if (nameEl) nameEl.textContent = data.name;
        if (countEl) {
            countEl.textContent = data.countdownText;
            if (data.isToday) countEl.classList.add('is-today');
        }
        if (vibeEl) vibeEl.textContent = `✨ ${data.vibe}`;

        card.classList.add('loaded');

        // Clickable card: opens Sonora festive tunes or highlights games
        if (!card._hasClickListener) {
            card._hasClickListener = true;
            if (card.style) card.style.cursor = 'pointer';
            card.title = `Festival Celebration: Click to stream festive hits on Sonora!`;
            if (card.addEventListener) {
                card.addEventListener('click', () => {
                    window.location.href = 'sonora';
                });
            }
        }
    }

    // -------------------------------------------------------------------------
    // 5. ASYNC INITIALIZATION (Idle / Non-Blocking)
    // -------------------------------------------------------------------------
    function init() {
        // Load both cards independently without delaying initial render
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => {
                loadWeatherCard();
                loadFestivalCard();
            });
        } else {
            setTimeout(() => {
                loadWeatherCard();
                loadFestivalCard();
            }, 60);
        }
    }

    window.ArcadeLiveWidgets = {
        loadWeatherCard,
        loadFestivalCard,
        init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
