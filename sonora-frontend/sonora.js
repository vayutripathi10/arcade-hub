/**
 * Sonora Music Engine for Arcade Hub
 * Ad-free YouTube player, queue manager, custom playlists, favorites & history.
 */

(function () {
    'use strict';

    // LocalStorage Keys
    const STORAGE_KEY = 'sonora-youtube-links';
    const ACTIVE_KEY = 'sonora-active-youtube';
    const QUEUE_KEY = 'sonora-youtube-queue';
    const FAVORITES_KEY = 'sonora-favorites';
    const HISTORY_KEY = 'sonora-watch-history';
    const MODE_KEY = 'sonora-player-mode';
    const PLAYLISTS_KEY = 'sonora-custom-playlists';
    const CLEAN_INIT_KEY = 'sonora-clean-init-v2';
    const DEFAULT_SEED_KEY = 'sonora-default-seed-v4';

    const DEFAULT_SONGS = [
        {
            id: 'yt-RWqmC7oBPKA',
            videoId: 'RWqmC7oBPKA',
            category: 'Saloon Song',
            title: 'Saloon Song · Deluxe Pop Saloon | डिलक्स पॉप सैलून: Barber Shop Playlist | Saloon Playlist | Old Songs',
            thumbnail: 'https://i.ytimg.com/vi/RWqmC7oBPKA/hqdefault.jpg'
        },
        {
            id: 'yt-9nx09wvQvNE',
            videoId: '9nx09wvQvNE',
            category: 'Bus Driver Song',
            title: 'Bus Driver Song · Indian Bus Driver Playlist || Hindi Song || 90s Song',
            thumbnail: 'https://i.ytimg.com/vi/9nx09wvQvNE/hqdefault.jpg'
        },
        {
            id: 'yt-YwEKIl3qQzA',
            videoId: 'YwEKIl3qQzA',
            category: 'Road Trip Song',
            title: 'Road Trip Song · Non-Stop Road Trip Jukebox | Best Travelling Songs | Bollywood',
            thumbnail: 'https://i.ytimg.com/vi/YwEKIl3qQzA/hqdefault.jpg'
        },
        {
            id: 'yt-9uS3o5YOR1U',
            videoId: '9uS3o5YOR1U',
            category: '90s Song',
            title: '90s Song · Evergreen Hindi Songs | Bollywood 90s Classics',
            thumbnail: 'https://i.ytimg.com/vi/9uS3o5YOR1U/hqdefault.jpg'
        },
        {
            id: 'yt-BrIkUBI_37I',
            videoId: 'BrIkUBI_37I',
            category: 'Kabhi Yaadon Mein',
            title: 'Kabhi Yaadon Mein Aaun · Abhijeet | Divya Khosla | T-Series Pop Classic',
            thumbnail: 'https://i.ytimg.com/vi/BrIkUBI_37I/hqdefault.jpg'
        },
        {
            id: 'default-wYFZCoQ11jI',
            videoId: 'wYFZCoQ11jI',
            category: 'Hollywood',
            title: 'Hollywood · Top Trending Music on Spotify 2026 🍃 || Best Healing English Songs Playlist',
            thumbnail: 'https://i.ytimg.com/vi/wYFZCoQ11jI/hqdefault.jpg'
        },
        {
            id: 'yt-vgKdf8ktVtU',
            videoId: 'vgKdf8ktVtU',
            category: 'Honey Singh',
            title: 'Honey Singh · Yo Yo Honey Singh Hits & Latest Jukebox',
            thumbnail: 'https://i.ytimg.com/vi/vgKdf8ktVtU/hqdefault.jpg'
        },
        {
            id: 'yt-MlXTbqptX_8',
            videoId: 'MlXTbqptX_8',
            category: 'Satinder Sartaaj',
            title: 'Satinder Sartaaj · Hits & Best Punjabi Sufi Classics',
            thumbnail: 'https://i.ytimg.com/vi/MlXTbqptX_8/hqdefault.jpg'
        },
        {
            id: 'yt-F4zJDtieQtA',
            videoId: 'F4zJDtieQtA',
            category: 'Badshah',
            title: 'Badshah · Best Of Badshah Party Anthems (Proper Patola, Genda Phool, Mercy, Chull)',
            thumbnail: 'https://i.ytimg.com/vi/F4zJDtieQtA/hqdefault.jpg'
        },
        {
            id: 'yt-H4IRWXePhnU',
            videoId: 'H4IRWXePhnU',
            category: 'Karan Aujla',
            title: 'Karan Aujla · All Hits & New Punjabi Songs Collection',
            thumbnail: 'https://i.ytimg.com/vi/H4IRWXePhnU/hqdefault.jpg'
        },
        {
            id: 'yt-wfyJJBoSwio',
            videoId: 'wfyJJBoSwio',
            category: 'Karan Aujla',
            title: 'Karan Aujla · Best Of Karan Aujla Songs Jukebox',
            thumbnail: 'https://i.ytimg.com/vi/wfyJJBoSwio/hqdefault.jpg'
        },
        {
            id: 'yt-5bqOxLuJIq0',
            videoId: '5bqOxLuJIq0',
            category: 'Midnight Vibes',
            title: 'Midnight Vibes 🌙 · Hindi Chill & Emotional Late Night Playlist',
            thumbnail: 'https://i.ytimg.com/vi/5bqOxLuJIq0/hqdefault.jpg'
        }
    ];

    const DEFAULT_CURATED_LIBRARIES = [
        {
            id: 'default-saloon-song',
            name: 'Saloon Song',
            videos: [{ ...DEFAULT_SONGS[0] }]
        },
        {
            id: 'default-bus-driver-song',
            name: 'Bus Driver Song',
            videos: [{ ...DEFAULT_SONGS[1] }]
        },
        {
            id: 'default-road-trip-song',
            name: 'Road Trip Song',
            videos: [{ ...DEFAULT_SONGS[2] }]
        },
        {
            id: 'default-90s-song',
            name: '90s Song',
            videos: [{ ...DEFAULT_SONGS[3] }]
        },
        {
            id: 'default-kabhi-yaadon-mein',
            name: 'Kabhi Yaadon Mein',
            videos: [{ ...DEFAULT_SONGS[4] }]
        },
        {
            id: 'default-hollywood',
            name: 'Hollywood',
            videos: [{ ...DEFAULT_SONGS[5] }]
        },
        {
            id: 'default-mc-square',
            name: 'MC Square',
            videos: []
        },
        {
            id: 'default-honey-singh',
            name: 'Honey Singh',
            videos: [{ ...DEFAULT_SONGS[6] }]
        },
        {
            id: 'default-satinder-sartaaj',
            name: 'Satinder Sartaaj',
            videos: [{ ...DEFAULT_SONGS[7] }]
        },
        {
            id: 'default-badshah',
            name: 'Badshah',
            videos: [{ ...DEFAULT_SONGS[8] }]
        },
        {
            id: 'default-karan-aujla',
            name: 'Karan Aujla',
            videos: [{ ...DEFAULT_SONGS[9] }, { ...DEFAULT_SONGS[10] }]
        },
        {
            id: 'default-midnight-vibes',
            name: 'Midnight Vibes',
            videos: [{ ...DEFAULT_SONGS[11] }]
        }
    ];

    const FALLBACK_THUMB_SVG =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#2e1065"/><stop offset="100%" stop-color="#0f172a"/>' +
            '</linearGradient></defs>' +
            '<rect width="160" height="90" fill="url(#g)"/>' +
            '<circle cx="80" cy="45" r="22" fill="rgba(139,92,246,0.25)" stroke="#a78bfa" stroke-width="2"/>' +
            '<text x="80" y="52" text-anchor="middle" fill="#f5f3ff" font-family="sans-serif" font-size="22">♫</text>' +
            '</svg>'
        );

    // App State (Starts with the 4 default playlist tracks for everyone)
    const STATE = {
        items: DEFAULT_SONGS.map(s => ({ ...s })), // Default YouTube playlist
        queue: [],              // Active playback queue
        favorites: [],          // Array of video IDs
        history: [],            // Watched history
        curatedLibraries: DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) })),
        customPlaylists: [],    // User-created playlists [{ id, name, videos, custom: true }]
        activeLibraryId: 'all-songs',
        activeVideoId: DEFAULT_SONGS[0].videoId,
        activeTrack: { ...DEFAULT_SONGS[0] },
        mode: localStorage.getItem(MODE_KEY) || 'adfree', // 'adfree' | 'official'
        searchTerm: '',
        activeTab: 'library',   // 'library' | 'queue' | 'saved' | 'favorites' | 'history'
        bgPlay: false,
        bgAudio: null,
        isFullscreen: false,
        pickerTrack: null
    };

    // DOM Elements Cache
    const DOM = {
        viewport: document.getElementById('sonora-viewport'),
        playerPane: document.querySelector('.player-pane'),
        addForm: document.getElementById('add-link-form'),
        addInput: document.getElementById('add-link-input'),
        playerContainer: document.getElementById('player-container'),
        playerStage: document.getElementById('player-stage'),
        fsNowPlaying: document.getElementById('fs-now-playing'),
        fsNextBtn: document.getElementById('fs-next-btn'),
        fsReloadBtn: document.getElementById('fs-reload-btn'),
        fsExitBtn: document.getElementById('fs-exit-btn'),
        nowPlayingTitle: document.getElementById('now-playing-title'),
        nowPlayingSub: document.getElementById('now-playing-sub'),
        modeBtn: document.getElementById('mode-btn'),
        modeBtnLabel: document.getElementById('mode-btn-label'),
        skipBtn: document.getElementById('skip-btn'),
        reloadBtn: document.getElementById('reload-btn'),
        minVideoBtn: document.getElementById('min-video-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        bgPlayBtn: document.getElementById('bg-play-btn'),
        searchForm: document.getElementById('header-search-form'),
        searchInput: document.getElementById('header-search-input'),
        searchClear: document.getElementById('header-search-clear'),
        searchBtn: document.getElementById('header-search-btn'),
        tabs: document.querySelectorAll('.tab-pill'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        // Lists
        libraryList: document.getElementById('library-list'),
        libraryTabs: document.getElementById('library-tabs'),
        suggestedCard: document.getElementById('suggested-card'),
        suggestedList: document.getElementById('suggested-track-list'),
        suggestedBadge: document.getElementById('suggested-badge'),
        toggleAddSongBtn: document.getElementById('toggle-add-song-btn'),
        libraryAddSongForm: document.getElementById('library-add-song-form'),
        libraryAddSongInput: document.getElementById('library-add-song-input'),
        libraryAddSongBtn: document.getElementById('library-add-song-btn'),
        cancelAddSongBtn: document.getElementById('cancel-add-song-btn'),
        queueList: document.getElementById('queue-list'),
        savedList: document.getElementById('saved-list'),
        favoritesList: document.getElementById('favorites-list'),
        historyList: document.getElementById('history-list'),
        // Counts
        libraryCount: document.getElementById('library-count'),
        queueCount: document.getElementById('queue-count'),
        savedCount: document.getElementById('saved-count'),
        favoritesCount: document.getElementById('favorites-count'),
        historyCount: document.getElementById('history-count'),
        // Panel actions
        newPlaylistBtn: document.getElementById('new-playlist-btn'),
        newPlaylistForm: document.getElementById('new-playlist-form'),
        newPlaylistInput: document.getElementById('new-playlist-input'),
        cancelPlaylistBtn: document.getElementById('cancel-playlist-btn'),
        playAllLibraryBtn: document.getElementById('play-all-library-btn'),
        queueAllLibraryBtn: document.getElementById('queue-all-library-btn'),
        clearQueueBtn: document.getElementById('clear-queue-btn'),
        shuffleQueueBtn: document.getElementById('shuffle-queue-btn'),
        exportSavedBtn: document.getElementById('export-saved-btn'),
        importSavedInput: document.getElementById('import-saved-input'),
        // Library Picker Modal
        pickerModal: document.getElementById('library-picker-modal'),
        pickerTitle: document.getElementById('library-picker-title'),
        pickerClose: document.getElementById('library-picker-close'),
        pickerList: document.getElementById('library-picker-list'),
        pickerNewForm: document.getElementById('library-picker-new-form'),
        pickerNewInput: document.getElementById('library-picker-new-input'),
        toast: document.getElementById('sonora-toast')
    };

    // -------------------------------------------------------------------------
    // 1. HELPERS & YOUTUBE URL PARSER
    // -------------------------------------------------------------------------
    function getAllLibraries() {
        const allSongsLib = {
            id: 'all-songs',
            name: 'All Songs',
            isAllSongs: true,
            videos: STATE.items
        };
        return [allSongsLib, ...STATE.customPlaylists, ...STATE.curatedLibraries];
    }

    function getActiveLibrary() {
        const all = getAllLibraries();
        return all.find(l => l.id === STATE.activeLibraryId) || all[0];
    }

    function getVideoId(input) {
        if (!input) return '';
        const raw = String(input).trim();

        // Extract URL if user pasted share text like "Check this out https://youtu.be/abc..."
        const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
        const candidate = urlMatch ? urlMatch[0] : (
            /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|yout-ube\.com)\//i.test(raw)
                ? 'https://' + raw
                : raw
        );

        try {
            const parsed = new URL(candidate);
            const host = parsed.hostname.toLowerCase().replace(/^(?:www|m|music)\./, '');
            let id = '';

            if (host === 'youtu.be') {
                id = parsed.pathname.split('/').filter(Boolean)[0] || '';
            } else if (
                host === 'youtube.com' ||
                host.endsWith('.youtube.com') ||
                host === 'yout-ube.com' ||
                host.endsWith('.yout-ube.com') ||
                host === 'youtube-nocookie.com'
            ) {
                id = parsed.searchParams.get('v') ||
                     parsed.pathname.match(/^\/(?:shorts|embed|live|v|watch)\/([^/?&#]+)/)?.[1] || '';
            }
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        } catch {
            // Fall through to regex extraction
        }

        const regexMatch = raw.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|\/v\/)([a-zA-Z0-9_-]{11})/);
        if (regexMatch && regexMatch[1]) return regexMatch[1];

        return /^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : '';
    }

    function extractAllVideoIds(input) {
        if (!input) return [];
        const raw = String(input).trim();
        const tokens = raw.split(/[\s,;]+/).filter(Boolean);
        const ids = [];
        const seen = new Set();
        tokens.forEach(token => {
            const cleaned = token.replace(/[),.;!?\]}]+$/, '');
            const vid = getVideoId(cleaned);
            if (vid && !seen.has(vid)) {
                seen.add(vid);
                ids.push(vid);
            }
        });
        if (!ids.length) {
            const single = getVideoId(raw);
            if (single) ids.push(single);
        }
        return ids;
    }

    function getPrimaryThumbnail(track) {
        if (track && track.thumbnail && /^https?:\/\//i.test(track.thumbnail)) {
            return track.thumbnail;
        }
        const vid = encodeURIComponent(track.videoId);
        return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    }

    function attachThumbnailFallback(imgEl, videoId) {
        if (!imgEl || !videoId) return;
        const vid = encodeURIComponent(videoId);
        const fallbacks = [
            `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/0.jpg`,
            `https://i.ytimg.com/vi/${vid}/default.jpg`,
            FALLBACK_THUMB_SVG
        ];
        let step = 0;
        imgEl.addEventListener('error', () => {
            if (step < fallbacks.length) {
                imgEl.src = fallbacks[step++];
            }
        });
    }

    function getPlayerSrc(mode, videoId, startAt = 0) {
        if (!videoId) return '';
        const startParam = startAt > 0 ? `&start=${Math.floor(startAt)}` : '';

        if (mode === 'official') {
            return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&fs=1&enablejsapi=1${startParam}`;
        }
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3&fs=1&enablejsapi=1${startParam}`;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(msg) {
        if (!DOM.toast) return;
        DOM.toast.textContent = msg;
        DOM.toast.classList.add('show');
        clearTimeout(DOM.toast._timer);
        DOM.toast._timer = setTimeout(() => {
            DOM.toast.classList.remove('show');
        }, 3200);
    }

    let cachedSilentAudioUrl = null;
    function getSilentWavUrl() {
        if (cachedSilentAudioUrl) return cachedSilentAudioUrl;
        const sampleRate = 8000;
        const numSamples = sampleRate * 120; // 2 minutes continuous silent bridge to prevent rapid loop flickering
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);
        const writeStr = (offset, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, numSamples * 2, true);
        cachedSilentAudioUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
        return cachedSilentAudioUrl;
    }

    async function fetchVideoMeta(videoId) {
        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
        const endpoints = [
            `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
            `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`
        ];
        for (const url of endpoints) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.title) {
                    return {
                        title: String(data.title).trim(),
                        thumbnail: data.thumbnail_url ? String(data.thumbnail_url).trim() : `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
                    };
                }
            } catch {
                // Try next oEmbed endpoint
            }
        }
        return null;
    }

    function hydratePlaceholderTitles() {
        const needsHydration = (item) => {
            if (!item || !item.videoId) return false;
            const title = String(item.title || '').trim();
            if (!title || /^YouTube [Vv]ideo\s*·|^Video\s*\(/i.test(title)) return true;
            if (item.category && title === item.category) return true;
            return false;
        };
        const idsToFetch = new Set();
        const collect = (arr) => {
            (arr || []).forEach(item => {
                if (needsHydration(item)) {
                    idsToFetch.add(item.videoId);
                }
            });
        };
        collect(STATE.items);
        collect(STATE.queue);
        collect(STATE.history);
        STATE.customPlaylists.forEach(p => collect(p.videos));
        STATE.curatedLibraries.forEach(p => collect(p.videos));
        idsToFetch.forEach(videoId => {
            fetchVideoMeta(videoId).then(meta => {
                if (meta) updateTrackMetaEverywhere(videoId, meta);
            });
        });
    }

    // -------------------------------------------------------------------------
    // 2. PERSISTENCE (IndexedDB + LocalStorage) & INITIALIZATION
    // -------------------------------------------------------------------------
    const IDB_NAME = 'sonora-music-db';
    const IDB_STORE = 'state';
    const IDB_KEY = 'sonora-app-state';

    function openSonoraDB() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function saveToIndexedDB() {
        openSonoraDB().then(db => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const store = tx.objectStore(IDB_STORE);
            store.put({
                items: STATE.items,
                queue: STATE.queue,
                favorites: STATE.favorites,
                history: STATE.history,
                customPlaylists: STATE.customPlaylists,
                activeVideoId: STATE.activeVideoId,
                activeLibraryId: STATE.activeLibraryId,
                mode: STATE.mode,
                updatedAt: Date.now()
            }, IDB_KEY);
        }).catch(() => {});
    }

    function loadFromIndexedDB() {
        return openSonoraDB().then(db => {
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const store = tx.objectStore(IDB_STORE);
                const getReq = store.get(IDB_KEY);
                getReq.onsuccess = () => resolve(getReq.result || null);
                getReq.onerror = () => resolve(null);
            });
        }).catch(() => null);
    }

    function ensureDefaultPlaylist() {
        const seeded = localStorage.getItem(DEFAULT_SEED_KEY);
        if (!seeded || !Array.isArray(STATE.items) || STATE.items.length === 0) {
            const existingById = new Map((STATE.items || []).map(i => [i.videoId, i]));
            const merged = [];
            DEFAULT_SONGS.forEach(def => {
                const existing = existingById.get(def.videoId);
                if (existing) {
                    existing.category = existing.category || def.category;
                    if (!existing.title || /^YouTube [Vv]ideo/i.test(existing.title)) {
                        existing.title = def.title;
                    }
                    merged.push(existing);
                    existingById.delete(def.videoId);
                } else {
                    merged.push({ ...def });
                }
            });
            existingById.forEach(val => merged.push(val));
            STATE.items = merged;
            try {
                localStorage.setItem(DEFAULT_SEED_KEY, '1');
            } catch {}
            saveState();
        }
        if (!STATE.activeVideoId && STATE.items.length > 0) {
            STATE.activeVideoId = STATE.items[0].videoId;
            STATE.activeTrack = STATE.items[0];
        }
    }

    function loadStorage() {
        try {
            // One-time clean reset so any old pre-loaded / test songs are cleared
            if (!localStorage.getItem(CLEAN_INIT_KEY)) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(ACTIVE_KEY);
                localStorage.removeItem(QUEUE_KEY);
                localStorage.removeItem(FAVORITES_KEY);
                localStorage.removeItem(HISTORY_KEY);
                localStorage.removeItem(PLAYLISTS_KEY);
                localStorage.setItem(CLEAN_INIT_KEY, '1');
            }
            STATE.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            STATE.queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            STATE.favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            STATE.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            STATE.customPlaylists = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]');
            STATE.activeVideoId = localStorage.getItem(ACTIVE_KEY) || '';
        } catch (e) {
            console.warn('[Sonora] Failed to read storage:', e);
        }
        ensureDefaultPlaylist();
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.items));
            localStorage.setItem(QUEUE_KEY, JSON.stringify(STATE.queue));
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(STATE.favorites));
            localStorage.setItem(HISTORY_KEY, JSON.stringify(STATE.history));
            localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(STATE.customPlaylists));
            localStorage.setItem(MODE_KEY, STATE.mode);
            if (STATE.activeVideoId) {
                localStorage.setItem(ACTIVE_KEY, STATE.activeVideoId);
            } else {
                localStorage.removeItem(ACTIVE_KEY);
            }
        } catch (e) {
            console.warn('[Sonora] Failed to save storage:', e);
        }
        saveToIndexedDB();
    }

    async function loadLibraries() {
        try {
            const res = await fetch('sonora-frontend/libraries.json?v=5');
            if (res.ok) {
                const parsed = await res.json();
                STATE.curatedLibraries = Array.isArray(parsed) && parsed.length
                    ? parsed
                    : DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) }));
            }
        } catch (err) {
            STATE.curatedLibraries = DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) }));
        }
        hydratePlaceholderTitles();
        renderAll();
    }

    function syncModeButtonUI() {
        if (!DOM.modeBtn || !DOM.modeBtnLabel) return;
        const isAdFree = STATE.mode !== 'official';
        DOM.modeBtn.classList.toggle('active', isAdFree);
        DOM.modeBtnLabel.textContent = isAdFree ? 'Ad-Free' : 'Embed';
    }

    function syncPlayerIdleState() {
        if (!DOM.playerPane) return;
        const isIdle = !STATE.activeVideoId;
        DOM.playerPane.classList.toggle('is-idle', isIdle);
    }

    // -------------------------------------------------------------------------
    // 3. PLAYBACK & PLAYLIST ENGINE
    // -------------------------------------------------------------------------
    function sendIframeCommand(func, args = []) {
        const iframe = document.getElementById('sonora-active-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func,
                args
            }), '*');
        } catch {}
    }

    function playTrack(track) {
        if (!track || !track.videoId) return;

        STATE.activeVideoId = track.videoId;
        STATE.activeTrack = track;
        if (DOM.playerPane) {
            DOM.playerPane.classList.remove('is-idle', 'is-video-minimized');
        }
        if (DOM.minVideoBtn) {
            DOM.minVideoBtn.classList.remove('active');
            DOM.minVideoBtn.innerHTML = '🗗 <span>Mini</span>';
        }
        saveState();

        // Add to history
        const existingIdx = STATE.history.findIndex(h => h.videoId === track.videoId);
        if (existingIdx > -1) STATE.history.splice(existingIdx, 1);
        STATE.history.unshift({
            ...track,
            playedAt: Date.now()
        });
        if (STATE.history.length > 50) STATE.history.pop();
        saveState();

        if (track && track.videoId) {
            try {
                localStorage.setItem('sonora_active_track', JSON.stringify(track));
                localStorage.setItem('sonora_active_video_id', track.videoId);
            } catch {}
        }

        // Render iframe into stage (sandboxed to prevent opening external tabs or leaving Sonora)
        const src = getPlayerSrc(STATE.mode, track.videoId);
        const stage = DOM.playerStage || DOM.playerContainer;
        stage.innerHTML = `
            <iframe
                id="sonora-active-iframe"
                src="${src}"
                title="${escapeHtml(track.title || 'Sonora Player')}"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowfullscreen
                webkitallowfullscreen
                mozallowfullscreen
                referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
        `;

        const displayTitle = track.title || `Video (${track.videoId})`;
        if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = displayTitle;
        if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = displayTitle;
        if (DOM.nowPlayingSub) {
            DOM.nowPlayingSub.textContent = 'Now Playing';
        }

        // Arm the continuous audio bridge so Android/iOS notification bar stays alive without rapid loop resets
        if (!STATE.bgAudio) {
            try {
                STATE.bgAudio = new Audio(getSilentWavUrl());
                STATE.bgAudio.loop = true;
                STATE.bgAudio.volume = 0.01;
            } catch {}
        }
        if (STATE.bgAudio) {
            STATE.bgAudio.play().catch(() => {});
        }

        // Set rich MediaSession metadata directly after audio activation
        updateMediaSession(track);

        renderAll();
    }

    function updateMediaSession(track) {
        if (!('mediaSession' in navigator) || !track) return;
        try {
            const vid = encodeURIComponent(track.videoId);
            const thumbUrl = getPrimaryThumbnail(track);
            const title = track.title || 'Sonora Music';
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: 'Sonora - Arcade Hub',
                album: 'Sonora Playlist',
                artwork: [
                    { src: thumbUrl, sizes: '512x512', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
                    { src: `${window.location.origin}/favicon.png`, sizes: '192x192', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = 'playing';

            navigator.mediaSession.setActionHandler('play', () => {
                sendIframeCommand('playVideo');
                navigator.mediaSession.playbackState = 'playing';
                if (STATE.bgAudio) STATE.bgAudio.play().catch(() => {});
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                sendIframeCommand('pauseVideo');
                navigator.mediaSession.playbackState = 'paused';
                if (STATE.bgAudio) STATE.bgAudio.pause();
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime != null) {
                    sendIframeCommand('seekTo', [details.seekTime, true]);
                    if ('setPositionState' in navigator.mediaSession && STATE.lastDuration) {
                        try {
                            navigator.mediaSession.setPositionState({
                                duration: STATE.lastDuration,
                                playbackRate: 1,
                                position: details.seekTime
                            });
                        } catch {}
                    }
                }
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const step = details.seekOffset || 10;
                const nextPos = Math.min(STATE.lastDuration || 9999, (STATE.lastPosition || 0) + step);
                sendIframeCommand('seekTo', [nextPos, true]);
            });
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const step = details.seekOffset || 10;
                const prevPos = Math.max(0, (STATE.lastPosition || 0) - step);
                sendIframeCommand('seekTo', [prevPos, true]);
            });
            navigator.mediaSession.setActionHandler('stop', () => {
                sendIframeCommand('stopVideo');
                navigator.mediaSession.playbackState = 'none';
                if (STATE.bgAudio) STATE.bgAudio.pause();
            });
        } catch (err) {
            console.warn('[Sonora] MediaSession update failed:', err);
        }
    }

    function playPrevious() {
        if (STATE.history.length > 1) {
            const prev = STATE.history[1];
            playTrack(prev);
            showToast(`Playing previous: ${prev.title || prev.videoId}`);
            return;
        }
        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos && activeLib.videos.length) ? activeLib.videos : STATE.items;
        const currentIdx = videos.findIndex(v => v.videoId === STATE.activeVideoId);
        if (currentIdx > 0) {
            playTrack(videos[currentIdx - 1]);
            showToast(`Playing previous: ${videos[currentIdx - 1].title || videos[currentIdx - 1].videoId}`);
        } else if (videos.length > 0) {
            playTrack(videos[videos.length - 1]);
            showToast(`Playing: ${videos[videos.length - 1].title || videos[videos.length - 1].videoId}`);
        }
    }

    function playNext() {
        if (!STATE.queue.length) {
            showToast('Queue is empty. Select or add a track!');
            return;
        }
        const nextTrack = STATE.queue.shift();
        saveState();
        playTrack(nextTrack);
        showToast(`Playing next: ${nextTrack.title || nextTrack.videoId}`);
    }

    function addToQueue(track) {
        if (!track || !track.videoId) return;
        const exists = STATE.queue.some(q => q.videoId === track.videoId);
        if (exists) {
            showToast('Already in your queue');
            return;
        }
        STATE.queue.push(track);
        saveState();
        renderQueue();
        showToast('Added to queue 🎵');
    }

    function toggleFavorite(track) {
        if (!track || !track.videoId) return;
        const index = STATE.favorites.indexOf(track.videoId);
        if (index > -1) {
            STATE.favorites.splice(index, 1);
            showToast('Removed from favorites');
        } else {
            STATE.favorites.push(track.videoId);
            showToast('Saved to favorites ❤️');
        }
        saveState();
        renderAll();
    }

    function deleteSaved(videoId) {
        STATE.items = STATE.items.filter(i => i.videoId !== videoId);
        saveState();
        renderAll();
        showToast('Removed song from library');
    }

    function createCustomPlaylist(name) {
        const cleanName = String(name || '').trim();
        if (!cleanName) {
            showToast('Please enter a library name');
            return null;
        }
        const duplicate = STATE.customPlaylists.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
        if (duplicate) {
            STATE.activeLibraryId = duplicate.id;
            renderLibraryTabs();
            renderLibrary();
            showToast(`Switched to existing library "${duplicate.name}" 📁`);
            return duplicate;
        }
        const id = 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newLib = {
            id,
            name: cleanName,
            custom: true,
            videos: [],
            createdAt: Date.now()
        };
        STATE.customPlaylists.push(newLib);
        STATE.activeLibraryId = id;
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Created library "${cleanName}" 📁`);
        return newLib;
    }

    function deleteCustomPlaylist(playlistId) {
        const target = STATE.customPlaylists.find(p => p.id === playlistId);
        if (!target) return;
        STATE.customPlaylists = STATE.customPlaylists.filter(p => p.id !== playlistId);
        if (STATE.activeLibraryId === playlistId) {
            STATE.activeLibraryId = STATE.customPlaylists[0]?.id || 'all-songs';
        }
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Deleted library "${target.name}"`);
    }

    function addTrackToCustomPlaylist(track, targetPlaylistId) {
        if (!track || !track.videoId) return;
        if (!targetPlaylistId) {
            openLibraryPickerModal(track);
            return;
        }
        let playlist = STATE.customPlaylists.find(p => p.id === targetPlaylistId);
        if (!playlist) return;

        if (playlist.videos.some(v => v.videoId === track.videoId)) {
            showToast(`Already in "${playlist.name}"`);
            return;
        }
        playlist.videos.unshift({
            id: track.id || `yt-${track.videoId}`,
            videoId: track.videoId,
            title: track.title || `YouTube Video · ${track.videoId}`,
            thumbnail: track.thumbnail || getPrimaryThumbnail(track),
            addedAt: Date.now()
        });
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Added to "${playlist.name}" 📁`);
    }

    function openLibraryPickerModal(track) {
        if (!track || !track.videoId) return;
        STATE.pickerTrack = track;
        if (!DOM.pickerModal || !DOM.pickerList) {
            const fallbackLib = STATE.customPlaylists.find(p => p.id === STATE.activeLibraryId) ||
                                STATE.customPlaylists[0] ||
                                createCustomPlaylist('My Library');
            if (fallbackLib) addTrackToCustomPlaylist(track, fallbackLib.id);
            return;
        }

        if (DOM.pickerTitle) {
            DOM.pickerTitle.textContent = `Add "${track.title || track.videoId}" to Library`;
        }
        DOM.pickerList.innerHTML = '';

        if (!STATE.customPlaylists.length) {
            DOM.pickerList.innerHTML = `<div style="color: var(--sonora-muted); font-size: 0.78rem; padding: 6px 4px;">No custom libraries yet. Create your first library below!</div>`;
        } else {
            STATE.customPlaylists.forEach(lib => {
                const alreadyIn = (lib.videos || []).some(v => v.videoId === track.videoId);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'library-picker-option';
                btn.innerHTML = `
                    <span>📁 ${escapeHtml(lib.name)} <small style="color:var(--sonora-muted);">(${(lib.videos || []).length})</small></span>
                    <span style="color:${alreadyIn ? 'var(--sonora-cyan)' : 'var(--sonora-accent-light)'}; font-size:0.75rem;">
                        ${alreadyIn ? '✓ Added' : '➕ Add'}
                    </span>
                `;
                btn.addEventListener('click', () => {
                    addTrackToCustomPlaylist(track, lib.id);
                    DOM.pickerModal.setAttribute('hidden', '');
                });
                DOM.pickerList.appendChild(btn);
            });
        }

        if (DOM.pickerNewInput) DOM.pickerNewInput.value = '';
        DOM.pickerModal.removeAttribute('hidden');
        if (!STATE.customPlaylists.length && DOM.pickerNewInput) {
            DOM.pickerNewInput.focus();
        }
    }

    function addSongsToLibrary(rawInput, targetLibId, autoPlayFirst = false) {
        const videoIds = extractAllVideoIds(rawInput);
        if (!videoIds.length) {
            showToast('Please paste one or more valid YouTube links');
            return false;
        }

        const activeLib = targetLibId
            ? getAllLibraries().find(l => l.id === targetLibId)
            : getActiveLibrary();

        const addedTracks = [];
        videoIds.forEach((videoId, idx) => {
            const defaultThumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
            let existing = STATE.items.find(i => i.videoId === videoId);
            if (!existing) {
                existing = {
                    id: `yt-${videoId}`,
                    videoId,
                    title: `YouTube Video · ${videoId}`,
                    thumbnail: defaultThumb,
                    addedAt: Date.now() + idx
                };
                STATE.items.unshift(existing);
            } else if (!existing.thumbnail) {
                existing.thumbnail = defaultThumb;
            }

            if (activeLib && activeLib.custom) {
                if (!activeLib.videos.some(v => v.videoId === videoId)) {
                    activeLib.videos.unshift({
                        id: existing.id,
                        videoId: existing.videoId,
                        title: existing.title,
                        thumbnail: existing.thumbnail,
                        addedAt: Date.now() + idx
                    });
                }
            }
            addedTracks.push(existing);

            fetchVideoMeta(videoId).then(meta => {
                if (meta) updateTrackMetaEverywhere(videoId, meta);
            });
        });

        saveState();
        renderAll();

        if (autoPlayFirst && addedTracks.length > 0) {
            playTrack(addedTracks[0]);
            if (addedTracks.length > 1) {
                const existingQueueIds = new Set(STATE.queue.map(q => q.videoId));
                addedTracks.slice(1).forEach(t => {
                    if (!existingQueueIds.has(t.videoId)) STATE.queue.push(t);
                });
                saveState();
                renderQueue();
            }
        } else if (!STATE.activeVideoId && addedTracks.length > 0) {
            playTrack(addedTracks[0]);
        }

        const libLabel = activeLib && activeLib.custom ? `"${activeLib.name}"` : 'Library';
        showToast(addedTracks.length === 1
            ? `Added song to ${libLabel} 🎶`
            : `Added ${addedTracks.length} songs to ${libLabel} 🎶`);
        return true;
    }

    function removeTrackFromPlaylist(playlistId, videoId) {
        const playlist = STATE.customPlaylists.find(p => p.id === playlistId);
        if (!playlist) return;
        playlist.videos = playlist.videos.filter(v => v.videoId !== videoId);
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Removed from "${playlist.name}"`);
    }

    function updateTrackMetaEverywhere(videoId, meta) {
        if (!videoId || !meta) return;
        const formatTitle = (item, rawTitle) => {
            if (!rawTitle) return item.title;
            if (item.category && !rawTitle.toLowerCase().startsWith(item.category.toLowerCase())) {
                return `${item.category} · ${rawTitle}`;
            }
            return rawTitle;
        };
        const applyMeta = (item) => {
            if (item.videoId !== videoId) return;
            if (meta.title) item.title = formatTitle(item, meta.title);
            if (meta.thumbnail) item.thumbnail = meta.thumbnail;
        };
        STATE.items.forEach(applyMeta);
        STATE.queue.forEach(applyMeta);
        STATE.history.forEach(applyMeta);
        STATE.customPlaylists.forEach(p => (p.videos || []).forEach(applyMeta));
        STATE.curatedLibraries.forEach(p => (p.videos || []).forEach(applyMeta));
        if (STATE.activeTrack && STATE.activeTrack.videoId === videoId) {
            if (meta.title) {
                const nextTitle = formatTitle(STATE.activeTrack, meta.title);
                STATE.activeTrack.title = nextTitle;
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = nextTitle;
                if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = nextTitle;
            }
            if (meta.thumbnail) {
                STATE.activeTrack.thumbnail = meta.thumbnail;
            }
        }
        saveState();
        renderAll();
    }

    // -------------------------------------------------------------------------
    // 4. RENDERING PANELS
    // -------------------------------------------------------------------------
    function createTrackItem(track, options = {}) {
        const isPlaying = STATE.activeVideoId === track.videoId;
        const isFav = STATE.favorites.includes(track.videoId);

        const div = document.createElement('div');
        div.className = `track-item ${isPlaying ? 'playing' : ''}`;

        const thumbUrl = getPrimaryThumbnail(track);
        const safeTitle = escapeHtml(track.title || `YouTube Video · ${track.videoId}`);

        div.innerHTML = `
            <img class="track-thumb" src="${escapeHtml(thumbUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            <div class="track-details">
                <span class="track-title" title="${safeTitle}">${safeTitle}</span>
                <span class="track-sub">${isPlaying ? '▶ Now Playing' : 'Tap to play'}</span>
            </div>
            <div class="track-btn-group">
                <button class="track-btn fav ${isFav ? 'active' : ''}" title="${isFav ? 'Remove Favorite' : 'Add Favorite'}">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <button class="track-btn playlist-add" title="Add to Custom Playlist">
                    📁
                </button>
                <button class="track-btn queue-add" title="Add to Queue">
                    ➕
                </button>
                ${options.canDelete ? `<button class="track-btn delete-btn" title="Delete">🗑️</button>` : ''}
            </div>
        `;

        const imgEl = div.querySelector('.track-thumb');
        attachThumbnailFallback(imgEl, track.videoId);

        // Click row to play
        div.addEventListener('click', (e) => {
            if (e.target.closest('.track-btn')) return;
            playTrack(track);
        });

        // Favorite button
        div.querySelector('.fav').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(track);
        });

        // Add to custom playlist button
        div.querySelector('.playlist-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addTrackToCustomPlaylist(track);
        });

        // Queue button
        div.querySelector('.queue-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addToQueue(track);
        });

        // Delete button
        if (options.canDelete) {
            div.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof options.onDelete === 'function') {
                    options.onDelete(track.videoId);
                } else {
                    deleteSaved(track.videoId);
                }
            });
        }

        return div;
    }

    function matchesSearch(track, term) {
        if (!term) return true;
        const q = term.toLowerCase();
        return (track.title || '').toLowerCase().includes(q) ||
               (track.videoId || '').toLowerCase().includes(q) ||
               (track._libName || '').toLowerCase().includes(q);
    }

    function createEmptySearchBox(term) {
        const box = document.createElement('div');
        box.className = 'empty-tab-box';
        box.innerHTML = `
            <span>No saved songs match "${escapeHtml(term)}"</span>
            <small>Try another keyword or search YouTube directly</small>
            <button type="button" class="yt-search-external-btn">🔍 Search "${escapeHtml(term)}" on YouTube ↗</button>
        `;
        box.querySelector('.yt-search-external-btn').addEventListener('click', () => {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
        });
        return box;
    }

    function renderLibraryTabs() {
        if (!DOM.libraryTabs) return;
        DOM.libraryTabs.innerHTML = '';
        const allLibraries = getAllLibraries();

        allLibraries.forEach(lib => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `playlist-chip ${lib.id === STATE.activeLibraryId ? 'active' : ''}`;
            const label = document.createElement('span');
            label.textContent = `${lib.custom ? '📁 ' : ''}${lib.name} (${(lib.videos || []).length})`;
            btn.appendChild(label);

            if (lib.custom) {
                const del = document.createElement('span');
                del.className = 'playlist-chip-del';
                del.title = `Delete "${lib.name}" library`;
                del.textContent = '×';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCustomPlaylist(lib.id);
                });
                btn.appendChild(del);
            }

            btn.addEventListener('click', () => {
                STATE.activeLibraryId = lib.id;
                renderLibraryTabs();
                renderLibrary();
            });
            DOM.libraryTabs.appendChild(btn);
        });

        const activeLib = getActiveLibrary();
        if (DOM.libraryAddSongInput && activeLib) {
            DOM.libraryAddSongInput.placeholder = `Paste YouTube link(s) to add to "${activeLib.name}"…`;
        }
    }

    function renderLibrary() {
        if (!DOM.libraryList) return;
        DOM.libraryList.innerHTML = '';

        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos) || [];

        if (DOM.libraryCount) DOM.libraryCount.textContent = String(videos.length);

        if (STATE.searchTerm) {
            let filtered = videos.filter(v => matchesSearch(v, STATE.searchTerm));
            // If searching and active library has 0 matches, search across all libraries so user finds their song
            if (!filtered.length) {
                const seen = new Set();
                getAllLibraries().forEach(lib => {
                    (lib.videos || []).forEach(v => {
                        if (!seen.has(v.videoId) && matchesSearch({ ...v, _libName: lib.name }, STATE.searchTerm)) {
                            seen.add(v.videoId);
                            filtered.push(v);
                        }
                    });
                });
            }
            if (!filtered.length) {
                DOM.libraryList.appendChild(createEmptySearchBox(STATE.searchTerm));
                return;
            }
            filtered.forEach(track => {
                DOM.libraryList.appendChild(createTrackItem(track, {
                    canDelete: Boolean(activeLib.custom || activeLib.isAllSongs),
                    onDelete: (videoId) => {
                        if (activeLib.custom) {
                            removeTrackFromPlaylist(activeLib.id, videoId);
                        } else {
                            deleteSaved(videoId);
                        }
                    }
                }));
            });
            return;
        }

        if (!videos.length) {
            const hint = activeLib && activeLib.custom
                ? `Paste YouTube link(s) in the "Add Song" bar above to add songs to "${activeLib.name}"`
                : 'Create a library with "➕ Create Library" or paste a YouTube URL above to add songs';
            DOM.libraryList.innerHTML = `<div class="empty-tab-box"><span>"${escapeHtml(activeLib ? activeLib.name : 'Library')}" is empty</span><small>${escapeHtml(hint)}</small></div>`;
            return;
        }

        videos.forEach(track => {
            DOM.libraryList.appendChild(createTrackItem(track, {
                canDelete: Boolean(activeLib.custom || activeLib.isAllSongs),
                onDelete: (videoId) => {
                    if (activeLib.custom) {
                        removeTrackFromPlaylist(activeLib.id, videoId);
                    } else {
                        deleteSaved(videoId);
                    }
                }
            }));
        });
    }

    function renderQueue() {
        if (!DOM.queueList) return;
        DOM.queueList.innerHTML = '';

        if (DOM.queueCount) DOM.queueCount.textContent = String(STATE.queue.length);

        if (!STATE.queue.length) {
            if (STATE.searchTerm) {
                DOM.queueList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.queueList.innerHTML = `<div class="empty-tab-box"><span>Queue is empty</span><small>Add songs with the ➕ button</small></div>`;
            }
            return;
        }

        const filtered = STATE.queue.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.queueList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach((track) => {
            const idx = STATE.queue.indexOf(track);
            const item = createTrackItem(track, {
                canDelete: true,
                onDelete: () => {
                    if (idx > -1) STATE.queue.splice(idx, 1);
                    saveState();
                    renderQueue();
                }
            });
            DOM.queueList.appendChild(item);
        });
    }

    function renderSaved() {
        if (!DOM.savedList) return;
        DOM.savedList.innerHTML = '';

        if (DOM.savedCount) DOM.savedCount.textContent = String(STATE.items.length);

        if (!STATE.items.length) {
            if (STATE.searchTerm) {
                DOM.savedList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.savedList.innerHTML = `<div class="empty-tab-box"><span>No saved links yet</span><small>Paste a YouTube URL on the left and tap "Play Now"</small></div>`;
            }
            return;
        }

        const filtered = STATE.items.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.savedList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.savedList.appendChild(createTrackItem(track, { canDelete: true }));
        });
    }

    function renderFavorites() {
        if (!DOM.favoritesList) return;
        DOM.favoritesList.innerHTML = '';

        const allKnown = [...STATE.items, ...STATE.history];
        getAllLibraries().forEach(l => {
            if (l.videos) allKnown.push(...l.videos);
        });

        const favTracks = STATE.favorites.map(favId => {
            return allKnown.find(t => t.videoId === favId) || {
                videoId: favId,
                title: `YouTube Video · ${favId}`,
                thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(favId)}/hqdefault.jpg`
            };
        });

        if (DOM.favoritesCount) DOM.favoritesCount.textContent = String(favTracks.length);

        if (!favTracks.length) {
            if (STATE.searchTerm) {
                DOM.favoritesList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.favoritesList.innerHTML = `<div class="empty-tab-box"><span>No favorite tracks</span><small>Heart any song to save it here</small></div>`;
            }
            return;
        }

        const filtered = favTracks.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.favoritesList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.favoritesList.appendChild(createTrackItem(track));
        });
    }

    function renderHistory() {
        if (!DOM.historyList) return;
        DOM.historyList.innerHTML = '';

        if (DOM.historyCount) DOM.historyCount.textContent = String(STATE.history.length);

        if (!STATE.history.length) {
            if (STATE.searchTerm) {
                DOM.historyList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.historyList.innerHTML = `<div class="empty-tab-box"><span>No watch history</span><small>Played tracks will appear here</small></div>`;
            }
            return;
        }

        const filtered = STATE.history.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.historyList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.historyList.appendChild(createTrackItem(track));
        });
    }

    function getSuggestedTracks() {
        const pool = [];
        const seen = new Set();
        if (STATE.activeVideoId) {
            seen.add(STATE.activeVideoId);
        }

        const addTrack = (track, sourceLabel, priority = 0) => {
            if (!track || !track.videoId) return;
            if (seen.has(track.videoId)) return;
            seen.add(track.videoId);
            pool.push({
                track,
                sourceLabel,
                priority
            });
        };

        // 1. Current active library (if any)
        const activeLib = (STATE.curatedLibraries || []).find(l => l.id === STATE.activeLibraryId) ||
                          (STATE.customPlaylists || []).find(l => l.id === STATE.activeLibraryId);
        if (activeLib && activeLib.videos) {
            activeLib.videos.forEach(v => addTrack(v, activeLib.name || 'Current Library', 10));
        }

        // 2. Curated built-in libraries
        (STATE.curatedLibraries || []).forEach(lib => {
            (lib.videos || []).forEach(v => addTrack(v, lib.name || 'Featured', 5));
        });

        // 3. User custom playlists
        (STATE.customPlaylists || []).forEach(p => {
            (p.videos || []).forEach(v => addTrack(v, p.name || 'My Playlist', 7));
        });

        // 4. Saved items & favorites & history
        (STATE.items || []).forEach(v => addTrack(v, 'Saved', 4));
        (STATE.favorites || []).forEach(v => addTrack(v, 'Favorite', 6));
        (STATE.history || []).forEach(v => addTrack(v, 'Recent', 3));

        // Keyword relevance matching if activeTrack has title
        const currentTitle = (STATE.activeTrack?.title || '').toLowerCase();
        const keywords = currentTitle
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !['song', 'video', 'music', 'official', 'lyrics', 'audio', 'deluxe', 'hindi'].includes(w));

        pool.forEach(item => {
            const itemTitle = (item.track.title || '').toLowerCase();
            let matchScore = 0;
            keywords.forEach(kw => {
                if (itemTitle.includes(kw)) matchScore += 15;
            });
            item.priority += matchScore;
        });

        // Sort descending by priority
        pool.sort((a, b) => b.priority - a.priority);

        return pool.slice(0, 10).map(p => ({ ...p.track, sourceLabel: p.sourceLabel }));
    }

    function renderSuggestions() {
        if (!DOM.suggestedList) return;
        const tracks = getSuggestedTracks();
        if (tracks.length === 0) {
            if (DOM.suggestedCard) DOM.suggestedCard.style.display = 'none';
            return;
        }
        if (DOM.suggestedCard) DOM.suggestedCard.style.display = 'flex';

        if (DOM.suggestedBadge) {
            DOM.suggestedBadge.textContent = STATE.activeTrack ? 'Up Next' : 'Featured';
        }

        DOM.suggestedList.innerHTML = tracks.map(t => {
            const thumb = getPrimaryThumbnail(t);
            const title = escapeHtml(t.title || 'Music Track');
            const source = escapeHtml(t.sourceLabel || 'Sonora');
            return `
                <div class="suggested-item" data-video-id="${t.videoId}" title="${title}">
                    <div class="suggested-thumb-wrap">
                        <img src="${thumb}" alt="${title}" class="suggested-thumb" loading="lazy" onerror="this.src='favicon.png'">
                        <div class="suggested-play-overlay">▶</div>
                    </div>
                    <div class="suggested-info">
                        <span class="suggested-song-title">${title}</span>
                        <span class="suggested-song-source">${source}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to play track directly in Sonora
        DOM.suggestedList.querySelectorAll('.suggested-item').forEach(el => {
            el.addEventListener('click', () => {
                const vid = el.getAttribute('data-video-id');
                const track = tracks.find(t => t.videoId === vid);
                if (track) {
                    playTrack(track);
                    showToast(`Playing ${track.title || 'track'} 🎶`);
                    if (window.innerWidth <= 768 && DOM.playerContainer) {
                        DOM.playerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });
    }

    function renderAll() {
        syncModeButtonUI();
        syncPlayerIdleState();
        renderLibraryTabs();
        renderLibrary();
        renderQueue();
        renderSaved();
        renderFavorites();
        renderHistory();
        renderSuggestions();
    }

    // -------------------------------------------------------------------------
    // 5. EVENT LISTENERS
    // -------------------------------------------------------------------------
    function initEvents() {
        // Listen for YouTube IFrame Player API postMessage state changes (auto-advance queue on video end)
        window.addEventListener('message', (event) => {
            if (!event.origin || !event.origin.includes('youtube')) return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data) return;
                if (data.event === 'onReady') {
                    sendIframeCommand('playVideo');
                    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                } else if (data.event === 'infoDelivery' && data.info) {
                    if (data.info.playerState === 1 && 'mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'playing';
                    } else if (data.info.playerState === 2 && 'mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'paused';
                    } else if (data.info.playerState === 0 && STATE.queue.length > 0) {
                        playNext();
                    }

                    // Sync video title if delivered from YouTube
                    if (data.info.videoData && data.info.videoData.title && STATE.activeTrack) {
                        if (!STATE.activeTrack.title || STATE.activeTrack.title.startsWith('Video (')) {
                            STATE.activeTrack.title = data.info.videoData.title;
                            if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = data.info.videoData.title;
                            if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = data.info.videoData.title;
                            updateMediaSession(STATE.activeTrack);
                        }
                    }

                    // Sync duration and current playback progress to Notification bar
                    if (data.info.duration && 'mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
                        STATE.lastDuration = data.info.duration;
                        STATE.lastPosition = data.info.currentTime || 0;
                        try {
                            const curTime = Math.min(STATE.lastPosition, STATE.lastDuration);
                            navigator.mediaSession.setPositionState({
                                duration: STATE.lastDuration,
                                playbackRate: 1,
                                position: curTime
                            });
                        } catch {}
                    }
                } else if (data.event === 'onStateChange') {
                    if (data.info === 1 && 'mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'playing';
                    } else if (data.info === 2 && 'mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'paused';
                    } else if (data.info === 0 && STATE.queue.length > 0) {
                        playNext();
                    }
                }
            } catch {}
        });

        // Form: Add Link (Left pane Play Now)
        if (DOM.addForm) {
            DOM.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputVal = DOM.addInput ? DOM.addInput.value.trim() : '';
                if (addSongsToLibrary(inputVal, STATE.activeLibraryId, true)) {
                    if (DOM.addInput) DOM.addInput.value = '';
                }
            });
        }

        // Toggle Add Song bar inside Library panel
        if (DOM.toggleAddSongBtn && DOM.libraryAddSongForm) {
            DOM.toggleAddSongBtn.addEventListener('click', () => {
                const isHidden = DOM.libraryAddSongForm.hasAttribute('hidden');
                if (isHidden) {
                    DOM.libraryAddSongForm.removeAttribute('hidden');
                    if (DOM.newPlaylistForm) DOM.newPlaylistForm.setAttribute('hidden', '');
                    if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.focus();
                } else {
                    DOM.libraryAddSongForm.setAttribute('hidden', '');
                }
            });
        }

        if (DOM.cancelAddSongBtn && DOM.libraryAddSongForm) {
            DOM.cancelAddSongBtn.addEventListener('click', () => {
                DOM.libraryAddSongForm.setAttribute('hidden', '');
                if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.value = '';
            });
        }

        // Form: Add Song(s) directly inside selected Library
        if (DOM.libraryAddSongForm) {
            DOM.libraryAddSongForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputVal = DOM.libraryAddSongInput ? DOM.libraryAddSongInput.value.trim() : '';
                if (addSongsToLibrary(inputVal, STATE.activeLibraryId, false)) {
                    if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.value = '';
                    DOM.libraryAddSongForm.setAttribute('hidden', '');
                }
            });
        }

        function resetMiniPlayerPosition() {
            if (!DOM.playerContainer) return;
            DOM.playerContainer.style.left = '';
            DOM.playerContainer.style.top = '';
            DOM.playerContainer.style.right = '';
            DOM.playerContainer.style.bottom = '';
            DOM.playerContainer.classList.remove('is-dragging');
        }

        // Video Minimize / Expand button (Mini Player & Floating PiP mode)
        const toggleMiniPlayer = () => {
            if (!DOM.playerPane) return;
            const minimized = DOM.playerPane.classList.toggle('is-video-minimized');
            resetMiniPlayerPosition();
            if (minimized) {
                try {
                    localStorage.setItem('sonora_mini_active', 'true');
                    if (STATE.activeTrack) {
                        localStorage.setItem('sonora_active_track', JSON.stringify(STATE.activeTrack));
                        localStorage.setItem('sonora_active_video_id', STATE.activeTrack.videoId);
                    }
                } catch {}
            } else {
                try {
                    localStorage.removeItem('sonora_mini_active');
                } catch {}
            }
            if (DOM.minVideoBtn) {
                DOM.minVideoBtn.classList.toggle('active', minimized);
                DOM.minVideoBtn.innerHTML = minimized ? '▴ <span>Expand</span>' : '🗗 <span>Mini</span>';
            }
            if (minimized) {
                showToast('Mini player active 🗗 (Persistent across all games and pages in Arcade Hub!)');
            } else {
                showToast('Player expanded 📺');
            }
        };

        if (DOM.minVideoBtn) {
            DOM.minVideoBtn.addEventListener('click', toggleMiniPlayer);
        }

        const miniExpandBtn = document.getElementById('mini-expand-btn');
        if (miniExpandBtn) {
            miniExpandBtn.addEventListener('click', toggleMiniPlayer);
        }

        const miniPlaceholder = document.getElementById('mini-player-placeholder');
        if (miniPlaceholder) {
            miniPlaceholder.addEventListener('click', toggleMiniPlayer);
        }

        // Smooth Draggable Mini Player across entire browser screen (Mouse & Touch)
        function initMiniPlayerDragging() {
            const handle = document.getElementById('mini-drag-handle');
            const container = DOM.playerContainer;
            if (!handle || !container) return;

            let isDragging = false;
            let startPointerX = 0;
            let startPointerY = 0;
            let startElemX = 0;
            let startElemY = 0;

            const onPointerDown = (e) => {
                if (!DOM.playerPane || !DOM.playerPane.classList.contains('is-video-minimized')) return;
                if (e.target.closest('#mini-expand-btn')) return;
                isDragging = true;
                startPointerX = e.clientX;
                startPointerY = e.clientY;

                const rect = container.getBoundingClientRect();
                startElemX = rect.left;
                startElemY = rect.top;

                container.style.bottom = 'auto';
                container.style.right = 'auto';
                container.style.left = `${startElemX}px`;
                container.style.top = `${startElemY}px`;
                container.classList.add('is-dragging');

                if (handle.setPointerCapture && e.pointerId != null) {
                    try { handle.setPointerCapture(e.pointerId); } catch {}
                }
                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startPointerX;
                const dy = e.clientY - startPointerY;

                const rect = container.getBoundingClientRect();
                const w = rect.width;
                const h = rect.height;

                const maxLeft = Math.max(0, window.innerWidth - w - 6);
                const maxTop = Math.max(0, window.innerHeight - h - 6);

                const newLeft = Math.max(6, Math.min(maxLeft, startElemX + dx));
                const newTop = Math.max(6, Math.min(maxTop, startElemY + dy));

                container.style.left = `${newLeft}px`;
                container.style.top = `${newTop}px`;
            };

            const onPointerUp = (e) => {
                if (!isDragging) return;
                isDragging = false;
                container.classList.remove('is-dragging');
                if (handle.releasePointerCapture && e.pointerId != null) {
                    try { handle.releasePointerCapture(e.pointerId); } catch {}
                }
                const rect = container.getBoundingClientRect();
                try {
                    localStorage.setItem('sonora_mini_pos', JSON.stringify({ left: rect.left, top: rect.top }));
                } catch {}
            };

            handle.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { passive: true });
            window.addEventListener('pointercancel', onPointerUp, { passive: true });
        }
        initMiniPlayerDragging();

        // Custom Library Creation UI
        if (DOM.newPlaylistBtn && DOM.newPlaylistForm) {
            DOM.newPlaylistBtn.addEventListener('click', () => {
                const isHidden = DOM.newPlaylistForm.hasAttribute('hidden');
                if (isHidden) {
                    DOM.newPlaylistForm.removeAttribute('hidden');
                    if (DOM.libraryAddSongForm) DOM.libraryAddSongForm.setAttribute('hidden', '');
                    if (DOM.newPlaylistInput) DOM.newPlaylistInput.focus();
                } else {
                    DOM.newPlaylistForm.setAttribute('hidden', '');
                }
            });

            if (DOM.cancelPlaylistBtn) {
                DOM.cancelPlaylistBtn.addEventListener('click', () => {
                    DOM.newPlaylistForm.setAttribute('hidden', '');
                    if (DOM.newPlaylistInput) DOM.newPlaylistInput.value = '';
                });
            }

            DOM.newPlaylistForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = DOM.newPlaylistInput ? DOM.newPlaylistInput.value.trim() : '';
                if (!name) {
                    showToast('Enter a name for your library');
                    return;
                }
                createCustomPlaylist(name);
                if (DOM.newPlaylistInput) DOM.newPlaylistInput.value = '';
                DOM.newPlaylistForm.setAttribute('hidden', '');
                if (DOM.libraryAddSongForm) DOM.libraryAddSongForm.removeAttribute('hidden');
                if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.focus();
            });
        }

        // Library Picker Modal events
        if (DOM.pickerClose && DOM.pickerModal) {
            DOM.pickerClose.addEventListener('click', () => {
                DOM.pickerModal.setAttribute('hidden', '');
            });
            DOM.pickerModal.addEventListener('click', (e) => {
                if (e.target === DOM.pickerModal) {
                    DOM.pickerModal.setAttribute('hidden', '');
                }
            });
        }
        if (DOM.pickerNewForm && DOM.pickerModal) {
            DOM.pickerNewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = DOM.pickerNewInput ? DOM.pickerNewInput.value.trim() : '';
                if (!name) {
                    showToast('Enter a library name');
                    return;
                }
                const created = createCustomPlaylist(name);
                if (created && STATE.pickerTrack) {
                    addTrackToCustomPlaylist(STATE.pickerTrack, created.id);
                }
                if (DOM.pickerNewInput) DOM.pickerNewInput.value = '';
                DOM.pickerModal.setAttribute('hidden', '');
            });
        }

        // Mode Toggle Button (Ad-Free No-Cookie vs Standard YouTube Embed)
        if (DOM.modeBtn) {
            DOM.modeBtn.addEventListener('click', () => {
                STATE.mode = STATE.mode === 'official' ? 'adfree' : 'official';
                saveState();
                syncModeButtonUI();
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                }
                showToast(STATE.mode === 'adfree'
                    ? 'Switched to Ad-Free Mode 🛡️'
                    : 'Switched to Standard Embed Mode 📺');
            });
        }

        // Tab Switching
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                STATE.activeTab = target;

                DOM.tabs.forEach(t => t.classList.toggle('active', t === tab));
                DOM.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
            });
        });

        // Search Form & Live Filtering
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', (e) => {
                STATE.searchTerm = e.target.value.trim();
                if (DOM.searchClear) {
                    if (STATE.searchTerm) {
                        DOM.searchClear.removeAttribute('hidden');
                    } else {
                        DOM.searchClear.setAttribute('hidden', '');
                    }
                }
                // Also allow searching library names directly
                if (STATE.searchTerm) {
                    const matchedLib = STATE.customPlaylists.find(
                        l => l.name.toLowerCase() === STATE.searchTerm.toLowerCase()
                    );
                    if (matchedLib) {
                        STATE.activeLibraryId = matchedLib.id;
                    }
                }
                renderAll();
            });
        }

        if (DOM.searchClear && DOM.searchInput) {
            DOM.searchClear.addEventListener('click', () => {
                DOM.searchInput.value = '';
                STATE.searchTerm = '';
                DOM.searchClear.setAttribute('hidden', '');
                renderAll();
                DOM.searchInput.focus();
            });
        }

        if (DOM.searchForm) {
            DOM.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const term = DOM.searchInput ? DOM.searchInput.value.trim() : '';
                if (!term) {
                    showToast('Type a song title, library name, or YouTube query');
                    return;
                }
                // If user pasted a YouTube link into search, add & play it directly
                const extractedIds = extractAllVideoIds(term);
                if (extractedIds.length > 0 && (term.includes('youtu') || extractedIds[0] === term)) {
                    addSongsToLibrary(term, STATE.activeLibraryId, true);
                    DOM.searchInput.value = '';
                    STATE.searchTerm = '';
                    if (DOM.searchClear) DOM.searchClear.setAttribute('hidden', '');
                    renderAll();
                    return;
                }
                // Check if any saved song matches
                const allSongs = [...STATE.items];
                STATE.customPlaylists.forEach(p => (p.videos || []).forEach(v => {
                    if (!allSongs.some(s => s.videoId === v.videoId)) allSongs.push(v);
                }));
                const matches = allSongs.filter(s => matchesSearch(s, term));
                if (matches.length > 0) {
                    renderAll();
                    showToast(`Found ${matches.length} saved song${matches.length === 1 ? '' : 's'} matching "${term}"`);
                } else {
                    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
                    showToast(`Searching YouTube for "${term}" ↗`);
                }
            });
        }

        // Skip button (Next in Queue)
        if (DOM.skipBtn) {
            DOM.skipBtn.addEventListener('click', () => {
                playNext();
            });
        }

        // Reload player button
        if (DOM.reloadBtn) {
            DOM.reloadBtn.addEventListener('click', () => {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                    showToast('Reloaded player 🔄');
                }
            });
        }

        // Universal Fullscreen (works on Desktop, Android, iPad, and iPhone iOS Safari/Chrome)
        const enterFullscreen = () => {
            if (!DOM.playerContainer) return;
            if (!document.getElementById('sonora-active-iframe')) {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                } else if (STATE.items.length > 0) {
                    playTrack(STATE.items[0]);
                } else {
                    showToast('Add or select a song first to play in full screen');
                    return;
                }
            }
            STATE.isFullscreen = true;
            DOM.playerContainer.classList.add('is-fullscreen');
            if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.add('active');

            // Request native browser fullscreen where supported (Desktop / Android / iPad)
            const reqFs = DOM.playerContainer.requestFullscreen ||
                          DOM.playerContainer.webkitRequestFullscreen ||
                          DOM.playerContainer.msRequestFullscreen;
            if (reqFs) {
                Promise.resolve(reqFs.call(DOM.playerContainer)).then(() => {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch(() => {});
            }
        };

        const exitFullscreen = () => {
            if (!DOM.playerContainer) return;
            STATE.isFullscreen = false;
            DOM.playerContainer.classList.remove('is-fullscreen');
            if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.remove('active');

            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (fsEl) {
                const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
                if (exitFs) Promise.resolve(exitFs.call(document)).catch(() => {});
            }
            if (screen.orientation && screen.orientation.unlock) {
                try { screen.orientation.unlock(); } catch {}
            }
        };

        const toggleFullscreen = () => {
            const isActive = STATE.isFullscreen ||
                             Boolean(document.fullscreenElement || document.webkitFullscreenElement) ||
                             (DOM.playerContainer && DOM.playerContainer.classList.contains('is-fullscreen'));
            if (isActive) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        };

        if (DOM.fullscreenBtn) {
            DOM.fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        if (DOM.fsExitBtn) {
            DOM.fsExitBtn.addEventListener('click', exitFullscreen);
        }
        if (DOM.fsNextBtn) {
            DOM.fsNextBtn.addEventListener('click', () => playNext());
        }
        if (DOM.fsReloadBtn) {
            DOM.fsReloadBtn.addEventListener('click', () => {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                    showToast('Reloaded player 🔄');
                }
            });
        }

        const syncNativeFullscreenExit = () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (!fsEl && STATE.isFullscreen) {
                STATE.isFullscreen = false;
                if (DOM.playerContainer) DOM.playerContainer.classList.remove('is-fullscreen');
                if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.remove('active');
            }
        };
        document.addEventListener('fullscreenchange', syncNativeFullscreenExit);
        document.addEventListener('webkitfullscreenchange', syncNativeFullscreenExit);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && STATE.isFullscreen) {
                exitFullscreen();
            }
        });

        // Background play helper (silent WAV audio keeps WebAudio / MediaSession alive on mobile)
        if (DOM.bgPlayBtn) {
            DOM.bgPlayBtn.addEventListener('click', () => {
                STATE.bgPlay = !STATE.bgPlay;
                DOM.bgPlayBtn.classList.toggle('active', STATE.bgPlay);
                if (STATE.bgPlay) {
                    if (!STATE.bgAudio) {
                        STATE.bgAudio = new Audio(getSilentWavUrl());
                        STATE.bgAudio.loop = true;
                        STATE.bgAudio.volume = 0.01;
                    }
                    STATE.bgAudio.play().catch(() => {});
                    showToast('Background Play: ON (Keeps media session active)');
                } else if (STATE.bgAudio) {
                    STATE.bgAudio.pause();
                    showToast('Background Play: OFF');
                }
            });
        }

        // Playlist Play All & Queue All
        if (DOM.playAllLibraryBtn) {
            DOM.playAllLibraryBtn.addEventListener('click', () => {
                const activeLib = getActiveLibrary();
                if (!activeLib || !activeLib.videos.length) {
                    showToast('This playlist has no tracks yet');
                    return;
                }
                const [first, ...rest] = activeLib.videos;
                STATE.queue = [...rest];
                saveState();
                playTrack(first);
                showToast(`Playing "${activeLib.name}" playlist!`);
            });
        }

        if (DOM.queueAllLibraryBtn) {
            DOM.queueAllLibraryBtn.addEventListener('click', () => {
                const activeLib = getActiveLibrary();
                if (!activeLib || !activeLib.videos.length) {
                    showToast('This playlist has no tracks yet');
                    return;
                }
                const existing = new Set(STATE.queue.map(q => q.videoId));
                const added = activeLib.videos.filter(v => !existing.has(v.videoId));
                STATE.queue.push(...added);
                saveState();
                renderQueue();
                showToast(`Added ${added.length} tracks to queue`);
            });
        }

        // Queue Clear & Shuffle
        if (DOM.clearQueueBtn) {
            DOM.clearQueueBtn.addEventListener('click', () => {
                STATE.queue = [];
                saveState();
                renderQueue();
                showToast('Queue cleared');
            });
        }

        if (DOM.shuffleQueueBtn) {
            DOM.shuffleQueueBtn.addEventListener('click', () => {
                for (let i = STATE.queue.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [STATE.queue[i], STATE.queue[j]] = [STATE.queue[j], STATE.queue[i]];
                }
                saveState();
                renderQueue();
                showToast('Queue shuffled 🔀');
            });
        }

        // Backup & Restore JSON
        if (DOM.exportSavedBtn) {
            DOM.exportSavedBtn.addEventListener('click', () => {
                const payload = {
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    items: STATE.items,
                    customPlaylists: STATE.customPlaylists,
                    favorites: STATE.favorites,
                    queue: STATE.queue
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sonora-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showToast('Downloaded Sonora backup JSON ⬇️');
            });
        }

        if (DOM.importSavedInput) {
            DOM.importSavedInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const parsed = JSON.parse(String(reader.result || '{}'));
                        if (Array.isArray(parsed)) {
                            STATE.items = parsed;
                        } else {
                            if (Array.isArray(parsed.items)) STATE.items = parsed.items;
                            if (Array.isArray(parsed.customPlaylists)) STATE.customPlaylists = parsed.customPlaylists;
                            if (Array.isArray(parsed.favorites)) STATE.favorites = parsed.favorites;
                            if (Array.isArray(parsed.queue)) STATE.queue = parsed.queue;
                        }
                        saveState();
                        renderAll();
                        showToast('Restored Sonora backup successfully! ⬆️');
                    } catch {
                        showToast('Invalid backup JSON file');
                    }
                    DOM.importSavedInput.value = '';
                };
                reader.readAsText(file);
            });
        }
    }

    // -------------------------------------------------------------------------
    // 6. INITIAL RUN
    // -------------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) reg.update().catch(() => {});
            }).catch(() => {});
        }
        loadStorage();
        loadFromIndexedDB().then(idbData => {
            if (idbData && (!STATE.items.length && Array.isArray(idbData.items) && idbData.items.length)) {
                STATE.items = idbData.items;
            }
            if (idbData && (!STATE.customPlaylists.length && Array.isArray(idbData.customPlaylists) && idbData.customPlaylists.length)) {
                STATE.customPlaylists = idbData.customPlaylists;
            }
            hydratePlaceholderTitles();
            renderAll();
        });
        hydratePlaceholderTitles();
        initEvents();
        loadLibraries().then(() => {
            if (STATE.activeVideoId && DOM.playerContainer) {
                const allKnown = [...STATE.items, ...STATE.history];
                getAllLibraries().forEach(l => { if (l.videos) allKnown.push(...l.videos); });
                const track = allKnown.find(t => t.videoId === STATE.activeVideoId) || {
                    videoId: STATE.activeVideoId,
                    title: `YouTube Video · ${STATE.activeVideoId}`,
                    thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(STATE.activeVideoId)}/hqdefault.jpg`
                };
                STATE.activeTrack = track;
                const stage = DOM.playerStage || DOM.playerContainer;
                stage.innerHTML = `
                    <button type="button" class="resume-poster" aria-label="Resume last track">
                        <img class="resume-thumb" src="${escapeHtml(getPrimaryThumbnail(track))}" alt="" referrerpolicy="no-referrer">
                        <span class="resume-overlay">▶ <strong>Tap to resume</strong><small>${escapeHtml(track.title)}</small></span>
                    </button>`;
                const resumeImg = stage.querySelector('.resume-thumb');
                attachThumbnailFallback(resumeImg, track.videoId);
                stage.querySelector('.resume-poster').addEventListener('click', () => playTrack(track));
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = track.title;
                if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = track.title;
                if (DOM.nowPlayingSub) DOM.nowPlayingSub.textContent = 'Last played · tap the player to resume';
            }
        });
    });
})();
