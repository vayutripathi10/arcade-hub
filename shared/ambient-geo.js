/**
 * Arcade Hub & Sonora — Ambient Time & City + Regional Spotlight Engine
 * Zero-dependency, lightweight, privacy-friendly, non-blocking with sessionStorage caching.
 */
(function(window) {
    'use strict';

    const CACHE_KEY = 'arcade_ambient_geo_v1';

    // 1. Instant fallback location from Timezone
    function getLocationFromTimezone() {
        try {
            const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
            if (tz.includes('kolkata') || tz.includes('calcutta') || tz.includes('india')) {
                return { city: 'India', region: 'India', country: 'India', countryCode: 'IN' };
            } else if (tz.includes('new_york')) {
                return { city: 'New York', region: 'New York', country: 'United States', countryCode: 'US' };
            } else if (tz.includes('los_angeles')) {
                return { city: 'California', region: 'California', country: 'United States', countryCode: 'US' };
            } else if (tz.includes('chicago')) {
                return { city: 'Chicago', region: 'Illinois', country: 'United States', countryCode: 'US' };
            } else if (tz.includes('london')) {
                return { city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB' };
            } else if (tz.includes('toronto')) {
                return { city: 'Toronto', region: 'Ontario', country: 'Canada', countryCode: 'CA' };
            } else if (tz.includes('dubai')) {
                return { city: 'Dubai', region: 'Dubai', country: 'UAE', countryCode: 'AE' };
            }
        } catch (e) {}
        return { city: 'Cyber City', region: '', country: '', countryCode: '' };
    }

    // 2. Determine Time of Day & Vibe
    function getTimeVibe() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const isWeekend = (day === 0 || day === 6 || (day === 5 && hour >= 18));

        if (hour >= 22 || hour < 5) {
            return {
                period: 'midnight',
                icon: '🌙',
                greeting: 'Late Night Session',
                sub: isWeekend ? 'Weekend midnight arcade rush active 🔥' : 'Midnight gaming & lo-fi chill vibes 🎧',
                spotlightKey: 'midnight'
            };
        } else if (hour >= 5 && hour < 12) {
            return {
                period: 'morning',
                icon: '🌅',
                greeting: 'Good Morning',
                sub: isWeekend ? 'Weekend morning! Start with a high-score run ⚡' : 'Start your day with high-FPS arcade action ⚡',
                spotlightKey: 'morning'
            };
        } else if (hour >= 12 && hour < 17) {
            return {
                period: 'afternoon',
                icon: '☀️',
                greeting: 'Good Afternoon',
                sub: 'Quick gaming break? 28+ games ready instantly 🚀',
                spotlightKey: 'day'
            };
        } else {
            return {
                period: 'evening',
                icon: '🌆',
                greeting: 'Good Evening',
                sub: isWeekend ? 'Saturday night arcade fever 🔥' : 'Unwind with retro beats & arcade challenges 🎮',
                spotlightKey: 'evening'
            };
        }
    }

    // 3. Determine Regional Sonora Spotlight Library
    function getRegionalSpotlight(geo, timeVibe) {
        const reg = (geo.region || '').toLowerCase();
        const city = (geo.city || '').toLowerCase();
        const country = (geo.countryCode || '').toUpperCase();
        const cityName = geo.city && geo.city !== 'Cyber City' && geo.city !== 'India' ? geo.city : '';

        // Late night preference
        if (timeVibe && timeVibe.period === 'midnight') {
            return {
                libId: 'default-midnight-vibes',
                title: 'Midnight Vibes',
                subtitle: '· Late-night chill: Midnight Vibes & Lo-Fi Jukebox',
                badgeText: cityName ? `MIDNIGHT · ${cityName.toUpperCase()} 🌙` : 'MIDNIGHT · SPOTLIGHT 🌙'
            };
        }

        // North India / Punjab / Delhi / Haryana / Chandigarh / Rajasthan
        if (reg.includes('punjab') || city.includes('chandigarh') || city.includes('delhi') || reg.includes('delhi') || reg.includes('haryana') || reg.includes('rajasthan')) {
            return {
                libId: 'default-karan-aujla',
                title: 'Karan Aujla Hits',
                subtitle: cityName ? `· Trending in ${cityName}: Karan Aujla Hits & Honey Singh` : '· Trending near you: Karan Aujla Hits & Honey Singh',
                badgeText: cityName ? `SPOTLIGHT · ${cityName.toUpperCase()} 📍` : 'SPOTLIGHT · NORTH 📍'
            };
        }

        // Maharashtra / West / South India (Mumbai, Pune, Gujarat, Bengaluru, Hyderabad)
        if (reg.includes('maharashtra') || city.includes('mumbai') || city.includes('pune') || reg.includes('gujarat') || reg.includes('karnataka') || city.includes('bengaluru') || reg.includes('telangana')) {
            return {
                libId: 'default-90s-song',
                title: '90s Evergreen Bollywood',
                subtitle: cityName ? `· Trending in ${cityName}: Bollywood 90s & Road Trip Anthems` : '· Trending in West: Bollywood 90s & Road Trip Anthems',
                badgeText: cityName ? `SPOTLIGHT · ${cityName.toUpperCase()} 📍` : 'SPOTLIGHT · WEST 📍'
            };
        }

        // Global / International (US, UK, CA, AU, Europe)
        if (country && country !== 'IN') {
            return {
                libId: 'default-hollywood',
                title: 'Hollywood & Global Hits',
                subtitle: geo.country ? `· Trending in ${geo.country}: Hollywood Hits & Synthwave` : '· Trending globally: Hollywood Hits & Synthwave',
                badgeText: cityName ? `SPOTLIGHT · ${cityName.toUpperCase()} 📍` : 'SPOTLIGHT · GLOBAL 📍'
            };
        }

        // Default India fallback
        return {
            libId: 'default-karan-aujla',
            title: 'Karan Aujla Hits',
            subtitle: cityName ? `· Trending in ${cityName}: Karan Aujla Hits & Bollywood Classics` : '· Trending near you: Karan Aujla Hits & Bollywood Classics',
            badgeText: cityName ? `SPOTLIGHT · ${cityName.toUpperCase()} 📍` : 'SPOTLIGHT 📍'
        };
    }

    // 4. Fetch Geo Information (cached in sessionStorage)
    async function resolveGeo() {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.city) return parsed;
            }
        } catch (e) {}

        const fallback = getLocationFromTimezone();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch('https://ipwho.is/', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    const geo = {
                        city: data.city || fallback.city,
                        region: data.region || fallback.region,
                        country: data.country || fallback.country,
                        countryCode: data.country_code || fallback.countryCode
                    };
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify(geo));
                    } catch (e) {}
                    return geo;
                }
            }
        } catch (e) {}

        return fallback;
    }

    // 5. Init Ambient Vibe on Main Page
    async function initAmbientHeader() {
        const timeVibe = getTimeVibe();
        let geo = getLocationFromTimezone();

        // Immediate first render with instant timezone data
        renderAmbientUI(geo, timeVibe);

        // Background resolve of accurate city
        const accurateGeo = await resolveGeo();
        if (accurateGeo && accurateGeo.city && accurateGeo.city !== geo.city) {
            renderAmbientUI(accurateGeo, timeVibe);
        }
    }

    function renderAmbientUI(geo, timeVibe) {
        // 1. Ambient Vibe Bar on Hero
        const bar = document.getElementById('ambientVibeBar');
        const iconEl = document.getElementById('ambientVibeIcon');
        const locEl = document.getElementById('ambientVibeLocation');
        const textEl = document.getElementById('ambientVibeText');
        const subEl = document.getElementById('ambientVibeSub');

        if (bar) {
            if (iconEl) iconEl.textContent = timeVibe.icon;
            if (locEl) locEl.textContent = geo.city || 'Arcade Hub';
            if (textEl) textEl.textContent = timeVibe.greeting;
            if (subEl) subEl.textContent = timeVibe.sub;
            bar.style.display = 'inline-flex';
        }

        // 2. Sonora Top Promo Banner
        const spotlight = getRegionalSpotlight(geo, timeVibe);
        const promoBadge = document.getElementById('sonoraPromoBadge');
        const promoSub = document.getElementById('sonoraPromoSub');
        const promoMainLink = document.querySelector('.sonora-promo-main-link');
        const promoCta = document.querySelector('.sonora-promo-cta');

        if (promoBadge && spotlight.badgeText) {
            promoBadge.textContent = spotlight.badgeText;
        }
        if (promoSub && spotlight.subtitle) {
            promoSub.textContent = spotlight.subtitle;
        }
        if (spotlight.libId) {
            const targetUrl = `sonora?lib=${encodeURIComponent(spotlight.libId)}`;
            if (promoMainLink) promoMainLink.href = targetUrl;
            if (promoCta) promoCta.href = targetUrl;
        }
    }

    window.ArcadeAmbient = {
        getTimeVibe,
        getLocationFromTimezone,
        getRegionalSpotlight,
        resolveGeo,
        initAmbientHeader
    };

    // Auto-init on DOMContentLoaded if ambientVibeBar exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('ambientVibeBar')) {
                initAmbientHeader();
            }
        });
    } else {
        if (document.getElementById('ambientVibeBar')) {
            initAmbientHeader();
        }
    }
})(window);
