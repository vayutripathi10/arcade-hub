const CACHE_NAME = 'arcade-hub-cache-v130';
const CORE_ASSETS = [
    'index.html',
    'retro-hub.html',
    'achievements.html',
    'about.html',
    'contact.html',
    'privacy.html',
    'tos.html',
    'updates.html',
    'hub-style.css',
    'favicon.png',
    'icon-192.png',
    'icon-512.png',
    'shared/achievements.js',
    'shared/audio-fx.js',
    'shared/pwa-setup.js',
    'neon-cypher-frontend/index.html',
    'neon-cypher-frontend/style.css',
    'neon-cypher-frontend/script.js',
    'neon-cypher-frontend/dictionary.js',
    'neon-cypher-frontend/thumbnail.jpg',
    'neon-bolts-frontend/index.html',
    'neon-bolts-frontend/style.css',
    'neon-bolts-frontend/script.js',
    'neon-bolts-frontend/thumbnail.jpg',
    'neon-pin-pull-frontend/index.html',
    'neon-pin-pull-frontend/style.css',
    'neon-pin-pull-frontend/script.js',
    'neon-pin-pull-frontend/thumbnail.jpg',
    'neon-arrows-frontend/index.html',
    'neon-arrows-frontend/style.css',
    'neon-arrows-frontend/script.js',
    'neon-arrows-frontend/thumbnail.png',
    'neon-invaders-frontend/index.html',
    'neon-invaders-frontend/style.css',
    'neon-invaders-frontend/script.js',
    'blog.html',
    'blog/vibe-coding-with-antigravity.html',
    'blog/evolution-of-cyberpunk-web-games.html',
    'blog/pwa-html5-mobile-gaming-revolution.html',
    'blog/retro-arcade-game-strategy-guide.html',
    'blog/tic-tac-toe-game-theory.html',
    'blog/classic-snake-grid-control.html',
    'blog/html5-canvas-rendering-performance.html',
    'blog/web-audio-api-retro-synthesis.html',
    'blog/game-physics-hitbox-collision.html',
    'blog/top-free-retro-arcade-games.html',
    'play-neon-cypher.html',
    'play-neon-swing.html',
    'play-neon-bolts.html',
    'play-neon-pin-pull.html',
    'play-neon-arrows.html',
    'play-neon-snake.html',
    'play-neon-zombie-shooter.html',
    'play-neon-pipes.html',
    'play-neon-helix-drop.html',
    'play-sky-jumper.html',
    'play-cyber-survivor.html',
    'play-neon-brick-breaker.html',
    'play-neon-invaders.html',
    'play-neon-brawler.html',
    'play-stick-duel.html',
    'play-space-shooter.html',
    'play-neon-drawbridge.html',
    'play-neon-bottle-shooter.html',
    'play-flappy.html',
    'play-stick-fighter.html',
    'play-neon-runner.html',
    'play-dino.html',
    'play-tictactoe.html',
    'play-retro-racer.html',
    'play-retro-tank-battle.html',
    'space-shooter-frontend/thumbnail.jpg',
    'space-shooter-frontend/player_ship.png',
    'dino-frontend/thumbnail.jpg',
    'flappy-frontend/thumbnail.jpg',
    'neon-snake-frontend/thumbnail.jpg',
    'sky-jumper-frontend/thumbnail.jpg',
    'neon-swing-frontend/thumbnail.jpg',
    'neon-pipes-frontend/thumbnail.jpg',
    'neon-pipes-frontend/theme.png',
    'neon-helix-drop-frontend/thumbnail.jpg',
    'cyber-survivor-frontend/thumbnail.jpg',
    'neon-brawler-frontend/thumbnail.jpg',
    'stick-duel-frontend/thumbnail.jpg',
    'neon-drawbridge-frontend/thumbnail.jpg',
    'neon-bottle-shooter-frontend/thumbnail.jpg',
    'stick-fighter-frontend/thumbnail.jpg',
    'neon-runner-frontend/thumbnail.jpg',
    'tictactoe-frontend/thumbnail.jpg',
    'retro-racer-frontend/thumbnail.png',
    'retro-tank-battle-frontend/thumbnail.png',
    'neon-zombie-shooter-frontend/index.html',
    'neon-zombie-shooter-frontend/style.css',
    'neon-zombie-shooter-frontend/script.js',
    'neon-zombie-shooter-frontend/map.js',
    'neon-zombie-shooter-frontend/thumbnail.jpg'
];

const DB_NAME = 'offline-analytics';
const STORE_NAME = 'requests';

// IndexedDB Helper Functions
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { autoIncrement: true });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function saveRequest(requestData) {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.add(requestData);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    });
}

function getQueuedRequests() {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

function clearQueuedRequests() {
    return openDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    });
}

// Upload queued offline hits to Google Analytics with backdated queue time (qt) offsets
async function sendQueuedAnalytics() {
    try {
        const requests = await getQueuedRequests();
        if (requests.length === 0) return;
        
        console.log(`[Service Worker] Sending ${requests.length} queued offline Google Analytics hits...`);
        
        for (const req of requests) {
            // Append time difference in ms (qt parameter) to backdate the event timestamp in GA4/UA
            const timeDiff = Date.now() - req.timestamp;
            let targetUrl = req.url;
            
            if (targetUrl.includes('?')) {
                targetUrl += `&qt=${timeDiff}`;
            } else {
                targetUrl += `?qt=${timeDiff}`;
            }
            
            const fetchOptions = {
                method: req.method,
                headers: new Headers(req.headers),
                mode: 'no-cors'
            };
            if (req.method === 'POST' && req.body) {
                fetchOptions.body = req.body;
            }
            
            await fetch(targetUrl, fetchOptions);
        }
        
        await clearQueuedRequests();
        console.log('[Service Worker] Successfully sent and cleared all queued offline Google Analytics hits!');
    } catch (err) {
        console.warn('[Service Worker] Failed to send queued analytics:', err);
    }
}

// Install Event - Pre-cache core shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching core assets');
            return Promise.allSettled(
                CORE_ASSETS.map((asset) => {
                    return cache.add(asset).catch((err) => {
                        console.warn(`[Service Worker] Failed to pre-cache asset: ${asset}`, err);
                    });
                })
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches & attempt to sync queued analytics
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            self.clients.claim();
            // Try to sync any queued offline analytics on Service Worker activation
            return sendQueuedAnalytics().catch(() => {});
        })
    );
});

// Sync Event - Standard background sync API fallback
self.addEventListener('sync', (e) => {
    if (e.tag === 'sync-analytics') {
        e.waitUntil(sendQueuedAnalytics());
    }
});

// Clean URL helper to map routes to physical .html files in cache
function matchCache(request) {
    return caches.match(request).then((res) => {
        if (res) return res;

        const url = new URL(request.url);
        if (url.origin === self.location.origin) {
            let path = url.pathname;
            // Clean trailing slash
            if (path.endsWith('/') && path.length > 1) {
                path = path.slice(0, -1);
            }
            if (path === '/' || path === '') {
                return caches.match('index.html');
            }
            // Strip leading slash for mapping
            const page = path.substring(1);
            
            // Check for direct clean URL routes
            const cleanRoots = ['about', 'achievements', 'contact', 'privacy', 'tos', 'updates', 'retro-hub', 'blog'];
            if (cleanRoots.includes(page)) {
                return caches.match(page + '.html');
            }
            if (page.startsWith('play-') && !page.endsWith('.html')) {
                return caches.match(page + '.html');
            }
            if (page.startsWith('blog/') && !page.endsWith('.html')) {
                return caches.match(page + '.html');
            }
        }
        return null;
    });
}

// Fetch Event - Serve with appropriate strategies & capture offline analytics
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Only handle HTTP/HTTPS (ignore chrome-extension, file://, etc.)
    if (!url.protocol.startsWith('http')) return;

    // Handle Google Analytics offline queueing
    const isAnalyticsRequest = url.hostname.includes('google-analytics.com') || 
                               url.hostname.includes('analytics.google.com') || 
                               url.pathname.includes('/collect');

    if (isAnalyticsRequest) {
        e.respondWith(
            fetch(e.request.clone())
                .then((response) => {
                    // Fetch succeeded (online) -> Asynchronously upload any queued hits in background
                    e.waitUntil(sendQueuedAnalytics());
                    return response;
                })
                .catch(async () => {
                    // Fetch failed (offline) -> Extract payload and save to IndexedDB database
                    try {
                        const requestData = {
                            url: e.request.url,
                            method: e.request.method,
                            timestamp: Date.now(),
                            headers: Array.from(e.request.headers.entries()),
                            body: e.request.method === 'POST' ? await e.request.clone().text() : null
                        };
                        await saveRequest(requestData);
                        console.log('[Service Worker] Queued offline Google Analytics hit successfully');
                    } catch (err) {
                        console.warn('[Service Worker] Failed to queue offline GA request:', err);
                    }
                    // Return a fake successful 200 response to prevent client-side JS runtime exceptions
                    return new Response('', { status: 200, statusText: 'OK' });
                })
        );
        return;
    }

    // Cache-First or Stale-While-Revalidate for images, audio, video, fonts, and stylesheets
    const isStaticAsset = 
        e.request.destination === 'image' ||
        e.request.destination === 'style' ||
        e.request.destination === 'script' ||
        e.request.destination === 'font' ||
        e.request.destination === 'video' ||
        e.request.destination === 'audio';

    if (isStaticAsset) {
        e.respondWith(
            matchCache(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Fetch in background to update cache (Stale-While-Revalidate)
                    fetch(e.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
                        }
                        // Periodically check/sync queued analytics when online static loads succeed
                        sendQueuedAnalytics().catch(() => {});
                    }).catch(() => {/* Ignore network update failures offline */});
                    return cachedResponse;
                }

                // If not in cache, fetch from network and cache dynamically
                return fetch(e.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                    // Trigger sync check
                    sendQueuedAnalytics().catch(() => {});
                    return networkResponse;
                }).catch(() => {
                    return new Response('Offline resource not found', { status: 404, statusText: 'Offline' });
                });
            })
        );
    } else {
        // Network-First strategy for HTML pages and APIs to keep content fresh
        e.respondWith(
            fetch(e.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
                }
                // Trigger sync check
                e.waitUntil(sendQueuedAnalytics().catch(() => {}));
                return networkResponse;
            }).catch(() => {
                // On offline network error, fallback to cache
                return matchCache(e.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (e.request.mode === 'navigate') {
                        return caches.match('index.html');
                    }
                });
            })
        );
    }
});
