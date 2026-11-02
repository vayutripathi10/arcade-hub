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

    // App State (Starts completely empty — no pre-populated songs)
    const STATE = {
        items: [],              // User's added YouTube songs
        queue: [],              // Active playback queue
        favorites: [],          // Array of video IDs
        history: [],            // Watched history
        curatedLibraries: [],   // Optional external libraries from libraries.json (empty by default)
        customPlaylists: [],    // User-created playlists [{ id, name, videos, custom: true }]
        activeLibraryId: 'all-songs',
        activeVideoId: '',
        activeTrack: null,
        mode: localStorage.getItem(MODE_KEY) || 'adfree', // 'adfree' | 'official'
        searchTerm: '',
        activeTab: 'library',   // 'library' | 'queue' | 'saved' | 'favorites' | 'history'
        bgPlay: false,
        bgAudio: null
    };

    // DOM Elements Cache
    const DOM = {
        viewport: document.getElementById('sonora-viewport'),
        addForm: document.getElementById('add-link-form'),
        addInput: document.getElementById('add-link-input'),
        playerContainer: document.getElementById('player-container'),
        nowPlayingTitle: document.getElementById('now-playing-title'),
        nowPlayingSub: document.getElementById('now-playing-sub'),
        modeBtn: document.getElementById('mode-btn'),
        modeBtnLabel: document.getElementById('mode-btn-label'),
        skipBtn: document.getElementById('skip-btn'),
        reloadBtn: document.getElementById('reload-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        bgPlayBtn: document.getElementById('bg-play-btn'),
        searchInput: document.getElementById('header-search-input'),
        tabs: document.querySelectorAll('.tab-pill'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        // Lists
        libraryList: document.getElementById('library-list'),
        libraryTabs: document.getElementById('library-tabs'),
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
            return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1${startParam}`;
        }
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3${startParam}`;
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

    function createSilentWavUrl() {
        const sampleRate = 8000;
        const numSamples = sampleRate;
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
        return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
    }

    async function fetchVideoMeta(videoId) {
        try {
            const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data) return null;
            return {
                title: data.title ? String(data.title).trim() : null,
                thumbnail: data.thumbnail_url ? String(data.thumbnail_url).trim() : null
            };
        } catch {
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // 2. PERSISTENCE & INITIALIZATION
    // -------------------------------------------------------------------------
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
    }

    async function loadLibraries() {
        try {
            const res = await fetch('sonora-frontend/libraries.json?v=2');
            if (res.ok) {
                const parsed = await res.json();
                STATE.curatedLibraries = Array.isArray(parsed) ? parsed : [];
            }
        } catch (err) {
            STATE.curatedLibraries = [];
        }
        renderAll();
    }

    function syncModeButtonUI() {
        if (!DOM.modeBtn || !DOM.modeBtnLabel) return;
        const isAdFree = STATE.mode !== 'official';
        DOM.modeBtn.classList.toggle('active', isAdFree);
        DOM.modeBtnLabel.textContent = isAdFree ? 'Ad-Free' : 'Embed';
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

        // Render iframe
        const src = getPlayerSrc(STATE.mode, track.videoId);
        DOM.playerContainer.innerHTML = `
            <iframe
                id="sonora-active-iframe"
                src="${src}"
                title="${escapeHtml(track.title || 'Sonora Player')}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
        `;

        if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = track.title || `Video (${track.videoId})`;
        if (DOM.nowPlayingSub) {
            DOM.nowPlayingSub.textContent = STATE.mode === 'official'
                ? 'Standard YouTube Embed active'
                : 'Ad-Free Player active';
        }

        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title || 'Sonora Music',
                    artist: 'Arcade Hub Sonora',
                    artwork: [
                        { src: getPrimaryThumbnail(track), sizes: '480x360', type: 'image/jpeg' }
                    ]
                });
                navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            } catch {}
        }

        renderAll();
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
            showToast('Please enter a playlist name');
            return null;
        }
        const id = 'custom-' + Date.now().toString(36);
        const newLib = {
            id,
            name: cleanName,
            custom: true,
            videos: []
        };
        STATE.customPlaylists.unshift(newLib);
        STATE.activeLibraryId = id;
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Created playlist "${cleanName}" 📁`);
        return newLib;
    }

    function deleteCustomPlaylist(playlistId) {
        const target = STATE.customPlaylists.find(p => p.id === playlistId);
        if (!target) return;
        STATE.customPlaylists = STATE.customPlaylists.filter(p => p.id !== playlistId);
        if (STATE.activeLibraryId === playlistId) {
            STATE.activeLibraryId = 'all-songs';
        }
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Deleted playlist "${target.name}"`);
    }

    function addTrackToCustomPlaylist(track, targetPlaylistId) {
        if (!track || !track.videoId) return;
        let playlist = targetPlaylistId
            ? STATE.customPlaylists.find(p => p.id === targetPlaylistId)
            : STATE.customPlaylists.find(p => p.id === STATE.activeLibraryId) || STATE.customPlaylists[0];

        if (!playlist) {
            playlist = createCustomPlaylist('My Playlist');
        }
        if (!playlist) return;

        if (playlist.videos.some(v => v.videoId === track.videoId)) {
            showToast(`Already in "${playlist.name}"`);
            return;
        }
        playlist.videos.unshift({
            id: track.id || `yt-${track.videoId}`,
            videoId: track.videoId,
            title: track.title || `YouTube Video · ${track.videoId}`,
            thumbnail: track.thumbnail || getPrimaryThumbnail(track)
        });
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Added to "${playlist.name}" 📁`);
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
        const applyMeta = (item) => {
            if (item.videoId !== videoId) return;
            if (meta.title) item.title = meta.title;
            if (meta.thumbnail) item.thumbnail = meta.thumbnail;
        };
        STATE.items.forEach(applyMeta);
        STATE.queue.forEach(applyMeta);
        STATE.history.forEach(applyMeta);
        STATE.customPlaylists.forEach(p => (p.videos || []).forEach(applyMeta));
        if (STATE.activeTrack && STATE.activeTrack.videoId === videoId) {
            if (meta.title) {
                STATE.activeTrack.title = meta.title;
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = meta.title;
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

    function renderLibraryTabs() {
        if (!DOM.libraryTabs) return;
        DOM.libraryTabs.innerHTML = '';
        const allLibraries = getAllLibraries();

        allLibraries.forEach(lib => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `playlist-chip ${lib.id === STATE.activeLibraryId ? 'active' : ''}`;
            const label = document.createElement('span');
            label.textContent = `${lib.custom ? '★ ' : ''}${lib.name} (${(lib.videos || []).length})`;
            btn.appendChild(label);

            if (lib.custom) {
                const del = document.createElement('span');
                del.className = 'playlist-chip-del';
                del.title = `Delete "${lib.name}" playlist`;
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
    }

    function renderLibrary() {
        if (!DOM.libraryList) return;
        DOM.libraryList.innerHTML = '';

        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos) || [];

        if (DOM.libraryCount) DOM.libraryCount.textContent = String(videos.length);

        if (!videos.length) {
            const hint = activeLib && activeLib.custom
                ? 'Paste a YouTube link on the left or tap 📁 on any song to add it to this playlist'
                : 'Paste any YouTube URL on the left and tap "Play Now" to add your first song';
            DOM.libraryList.innerHTML = `<div class="empty-tab-box"><span>Library is empty</span><small>${escapeHtml(hint)}</small></div>`;
            return;
        }

        const filtered = videos.filter(v => {
            if (!STATE.searchTerm) return true;
            return (v.title || '').toLowerCase().includes(STATE.searchTerm.toLowerCase());
        });

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
    }

    function renderQueue() {
        if (!DOM.queueList) return;
        DOM.queueList.innerHTML = '';

        if (!STATE.queue.length) {
            DOM.queueList.innerHTML = `<div class="empty-tab-box"><span>Queue is empty</span><small>Add songs with the ➕ button</small></div>`;
            if (DOM.queueCount) DOM.queueCount.textContent = '0';
            return;
        }

        STATE.queue.forEach((track, idx) => {
            const item = createTrackItem(track, {
                canDelete: true,
                onDelete: () => {
                    STATE.queue.splice(idx, 1);
                    saveState();
                    renderQueue();
                }
            });
            DOM.queueList.appendChild(item);
        });

        if (DOM.queueCount) DOM.queueCount.textContent = String(STATE.queue.length);
    }

    function renderSaved() {
        if (!DOM.savedList) return;
        DOM.savedList.innerHTML = '';

        if (!STATE.items.length) {
            DOM.savedList.innerHTML = `<div class="empty-tab-box"><span>No saved links yet</span><small>Paste a YouTube URL on the left and tap "Play Now"</small></div>`;
            if (DOM.savedCount) DOM.savedCount.textContent = '0';
            return;
        }

        const filtered = STATE.items.filter(v => {
            if (!STATE.searchTerm) return true;
            return (v.title || '').toLowerCase().includes(STATE.searchTerm.toLowerCase());
        });

        filtered.forEach(track => {
            DOM.savedList.appendChild(createTrackItem(track, { canDelete: true }));
        });

        if (DOM.savedCount) DOM.savedCount.textContent = String(STATE.items.length);
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

        if (!favTracks.length) {
            DOM.favoritesList.innerHTML = `<div class="empty-tab-box"><span>No favorite tracks</span><small>Heart any song to save it here</small></div>`;
            if (DOM.favoritesCount) DOM.favoritesCount.textContent = '0';
            return;
        }

        favTracks.forEach(track => {
            DOM.favoritesList.appendChild(createTrackItem(track));
        });

        if (DOM.favoritesCount) DOM.favoritesCount.textContent = String(favTracks.length);
    }

    function renderHistory() {
        if (!DOM.historyList) return;
        DOM.historyList.innerHTML = '';

        if (!STATE.history.length) {
            DOM.historyList.innerHTML = `<div class="empty-tab-box"><span>No watch history</span><small>Played tracks will appear here</small></div>`;
            if (DOM.historyCount) DOM.historyCount.textContent = '0';
            return;
        }

        STATE.history.forEach(track => {
            DOM.historyList.appendChild(createTrackItem(track));
        });

        if (DOM.historyCount) DOM.historyCount.textContent = String(STATE.history.length);
    }

    function renderAll() {
        syncModeButtonUI();
        renderLibraryTabs();
        renderLibrary();
        renderQueue();
        renderSaved();
        renderFavorites();
        renderHistory();
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
                } else if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
                    if (STATE.queue.length > 0) {
                        playNext();
                    }
                } else if (data.event === 'onStateChange' && data.info === 0) {
                    if (STATE.queue.length > 0) {
                        playNext();
                    }
                }
            } catch {}
        });

        // Form: Add Link
        if (DOM.addForm) {
            DOM.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputVal = DOM.addInput ? DOM.addInput.value.trim() : '';
                const videoId = getVideoId(inputVal);

                if (!videoId) {
                    showToast('Please paste a valid YouTube URL');
                    return;
                }

                const defaultThumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
                let existing = STATE.items.find(i => i.videoId === videoId);
                if (!existing) {
                    existing = {
                        id: `yt-${videoId}`,
                        videoId: videoId,
                        title: `YouTube Video · ${videoId}`,
                        thumbnail: defaultThumb,
                        addedAt: Date.now()
                    };
                    STATE.items.unshift(existing);
                } else if (!existing.thumbnail) {
                    existing.thumbnail = defaultThumb;
                }

                // If currently viewing a custom playlist, also add it there
                const activeLib = getActiveLibrary();
                if (activeLib && activeLib.custom) {
                    if (!activeLib.videos.some(v => v.videoId === videoId)) {
                        activeLib.videos.unshift({
                            id: existing.id,
                            videoId: existing.videoId,
                            title: existing.title,
                            thumbnail: existing.thumbnail
                        });
                    }
                }

                saveState();
                playTrack(existing);
                if (DOM.addInput) DOM.addInput.value = '';
                showToast(activeLib && activeLib.custom
                    ? `Added to "${activeLib.name}" and playing! 🎶`
                    : 'Song added and playing! 🎶');

                // Fetch real video title & thumbnail asynchronously via oEmbed
                fetchVideoMeta(videoId).then(meta => {
                    if (meta) {
                        updateTrackMetaEverywhere(videoId, meta);
                    }
                });
            });
        }

        // Custom Playlist Creation UI
        if (DOM.newPlaylistBtn && DOM.newPlaylistForm) {
            DOM.newPlaylistBtn.addEventListener('click', () => {
                const isHidden = DOM.newPlaylistForm.hasAttribute('hidden');
                if (isHidden) {
                    DOM.newPlaylistForm.removeAttribute('hidden');
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
                    showToast('Enter a name for your playlist');
                    return;
                }
                createCustomPlaylist(name);
                if (DOM.newPlaylistInput) DOM.newPlaylistInput.value = '';
                DOM.newPlaylistForm.setAttribute('hidden', '');
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

        // Search Input
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', (e) => {
                STATE.searchTerm = e.target.value.trim();
                renderAll();
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

        // Fullscreen button
        if (DOM.fullscreenBtn) {
            DOM.fullscreenBtn.addEventListener('click', () => {
                const frame = document.getElementById('sonora-active-iframe') || DOM.playerContainer;
                if (!frame) return;
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                } else if (frame.requestFullscreen) {
                    frame.requestFullscreen().catch(() => {});
                }
            });
        }

        // Background play helper (silent WAV audio keeps WebAudio / MediaSession alive on mobile)
        if (DOM.bgPlayBtn) {
            DOM.bgPlayBtn.addEventListener('click', () => {
                STATE.bgPlay = !STATE.bgPlay;
                DOM.bgPlayBtn.classList.toggle('active', STATE.bgPlay);
                if (STATE.bgPlay) {
                    if (!STATE.bgAudio) {
                        STATE.bgAudio = new Audio(createSilentWavUrl());
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
        loadStorage();
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
                DOM.playerContainer.innerHTML = `
                    <button type="button" class="resume-poster" aria-label="Resume last track">
                        <img class="resume-thumb" src="${escapeHtml(getPrimaryThumbnail(track))}" alt="" referrerpolicy="no-referrer">
                        <span class="resume-overlay">▶ <strong>Tap to resume</strong><small>${escapeHtml(track.title)}</small></span>
                    </button>`;
                const resumeImg = DOM.playerContainer.querySelector('.resume-thumb');
                attachThumbnailFallback(resumeImg, track.videoId);
                DOM.playerContainer.querySelector('.resume-poster').addEventListener('click', () => playTrack(track));
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = track.title;
                if (DOM.nowPlayingSub) DOM.nowPlayingSub.textContent = 'Last played · tap the player to resume';
            }
        });
    });
})();
