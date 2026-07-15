const CACHE_NAME = 'arcade-hub-cache-v203';
const CORE_ASSETS = [
    'about.html',
    'achievements.html',
    'blog.html',
    'blog/beyond-audio-tag-retro-synthesis.html',
    'blog/classic-snake-grid-control.html',
    'blog/evolution-of-cyberpunk-web-games.html',
    'blog/game-physics-hitbox-collision.html',
    'blog/glowing-gradients-cyberpunk-web-design.html',
    'blog/grid-mainframes-spatial-puzzle-design.html',
    'blog/html5-canvas-rendering-performance.html',
    'blog/math-of-luck-3d-webgl-physics.html',
    'blog/pwa-html5-mobile-gaming-revolution.html',
    'blog/retro-arcade-game-strategy-guide.html',
    'blog/tic-tac-toe-game-theory.html',
    'blog/top-free-retro-arcade-games.html',
    'blog/vibe-coding-with-antigravity.html',
    'blog/web-audio-api-retro-synthesis.html',
    'contact.html',
    'cyber-survivor-frontend/index.html',
    'cyber-survivor-frontend/script.js',
    'cyber-survivor-frontend/style.css',
    'cyber-survivor-frontend/thumbnail.jpg',
    'dino-frontend/index.html',
    'dino-frontend/script.js',
    'dino-frontend/style.css',
    'dino-frontend/thumbnail.jpg',
    'favicon.png',
    'flappy-frontend/index.html',
    'flappy-frontend/script.js',
    'flappy-frontend/style.css',
    'flappy-frontend/thumbnail.jpg',
    'hub-style.css',
    'icon-192.png',
    'icon-512.png',
    'index.html',
    'neon-arrows-frontend/index.html',
    'neon-arrows-frontend/script.js',
    'neon-arrows-frontend/style.css',
    'neon-arrows-frontend/thumbnail.png',
    'neon-bolts-frontend/index.html',
    'neon-bolts-frontend/script.js',
    'neon-bolts-frontend/style.css',
    'neon-bolts-frontend/thumbnail.jpg',
    'neon-bottle-shooter-frontend/index.html',
    'neon-bottle-shooter-frontend/script.js',
    'neon-bottle-shooter-frontend/style.css',
    'neon-bottle-shooter-frontend/thumbnail.jpg',
    'neon-brawler-frontend/index.html',
    'neon-brawler-frontend/script.js',
    'neon-brawler-frontend/style.css',
    'neon-brawler-frontend/thumbnail.jpg',
    'neon-brick-breaker-frontend/index.html',
    'neon-brick-breaker-frontend/script.js',
    'neon-brick-breaker-frontend/style.css',
    'neon-brick-breaker-frontend/thumbnail.jpg',
    'neon-brick-breaker-frontend/updates.html',
    'neon-cypher-frontend/dictionary.js',
    'neon-cypher-frontend/index.html',
    'neon-cypher-frontend/script.js',
    'neon-cypher-frontend/style.css',
    'neon-cypher-frontend/thumbnail.jpg',
    'neon-dice-frontend/index.html',
    'neon-dice-frontend/script.js',
    'neon-dice-frontend/style.css',
    'neon-dice-frontend/thumbnail.jpg',
    'neon-drawbridge-frontend/index.html',
    'neon-drawbridge-frontend/script.js',
    'neon-drawbridge-frontend/style.css',
    'neon-drawbridge-frontend/thumbnail.jpg',
    'neon-helix-drop-frontend/index.html',
    'neon-helix-drop-frontend/script.js',
    'neon-helix-drop-frontend/style.css',
    'neon-helix-drop-frontend/thumbnail.jpg',
    'neon-invaders-frontend/index.html',
    'neon-invaders-frontend/script.js',
    'neon-invaders-frontend/style.css',
    'neon-invaders-frontend/thumbnail.jpg',
    'neon-pin-pull-frontend/index.html',
    'neon-pin-pull-frontend/script.js',
    'neon-pin-pull-frontend/style.css',
    'neon-pin-pull-frontend/thumbnail.jpg',
    'neon-pin-pull-frontend/thumbnail.png',
    'neon-pipes-frontend/index.html',
    'neon-pipes-frontend/script.js',
    'neon-pipes-frontend/style.css',
    'neon-pipes-frontend/theme.png',
    'neon-pipes-frontend/thumbnail.jpg',
    'neon-runner-frontend/index.html',
    'neon-runner-frontend/script.js',
    'neon-runner-frontend/style.css',
    'neon-runner-frontend/thumbnail.jpg',
    'neon-snake-frontend/index.html',
    'neon-snake-frontend/script.js',
    'neon-snake-frontend/style.css',
    'neon-snake-frontend/thumbnail.jpg',
    'neon-swing-frontend/index.html',
    'neon-swing-frontend/script.js',
    'neon-swing-frontend/style.css',
    'neon-swing-frontend/thumbnail.jpg',
    'neon-zombie-shooter-frontend/index.html',
    'neon-zombie-shooter-frontend/map.js',
    'neon-zombie-shooter-frontend/script.js',
    'neon-zombie-shooter-frontend/style.css',
    'neon-zombie-shooter-frontend/thumbnail.jpg',
    'play-cyber-survivor.html',
    'play-dino.html',
    'play-flappy.html',
    'play-neon-arrows.html',
    'play-neon-bolts.html',
    'play-neon-bottle-shooter.html',
    'play-neon-brawler.html',
    'play-neon-brick-breaker.html',
    'play-neon-cypher.html',
    'play-neon-dice-destiny.html',
    'play-neon-drawbridge.html',
    'play-neon-helix-drop.html',
    'play-neon-invaders.html',
    'play-neon-pin-pull.html',
    'play-neon-pipes.html',
    'play-neon-runner.html',
    'play-neon-snake.html',
    'play-neon-swing.html',
    'play-neon-zombie-shooter.html',
    'play-retro-racer.html',
    'play-retro-tank-battle.html',
    'play-sky-jumper.html',
    'play-snake.html',
    'play-space-shooter.html',
    'play-stick-duel.html',
    'play-stick-fighter.html',
    'play-tictactoe.html',
    'privacy.html',
    'pdf-tools.html',
    'utility-hub.html',
    'retro-hub.html',
    'retro-racer-frontend/enemy.png',
    'retro-racer-frontend/index.html',
    'retro-racer-frontend/petrol.png',
    'retro-racer-frontend/player.png',
    'retro-racer-frontend/script.js',
    'retro-racer-frontend/style.css',
    'retro-racer-frontend/thumbnail.png',
    'retro-tank-battle-frontend/assets/base_hq.png',
    'retro-tank-battle-frontend/assets/enemy_tank.png',
    'retro-tank-battle-frontend/assets/player_tank.png',
    'retro-tank-battle-frontend/assets/tile_brick.png',
    'retro-tank-battle-frontend/assets/tile_grass.png',
    'retro-tank-battle-frontend/assets/tile_steel.png',
    'retro-tank-battle-frontend/assets/tile_water.png',
    'retro-tank-battle-frontend/assets/tiles_sheet.png',
    'retro-tank-battle-frontend/audio-fx.js',
    'retro-tank-battle-frontend/index.html',
    'retro-tank-battle-frontend/script.js',
    'retro-tank-battle-frontend/style.css',
    'retro-tank-battle-frontend/thumbnail.png',
    'shared/achievements.js',
    'shared/audio-fx.js',
    'shared/pdf-lib.min.js',
    'shared/pdf.min.js',
    'shared/pdf.worker.min.js',
    'shared/pwa-setup.js',
    'sky-jumper-frontend/index.html',
    'sky-jumper-frontend/script.js',
    'sky-jumper-frontend/style.css',
    'sky-jumper-frontend/thumbnail.jpg',
    'snake-frontend/index.html',
    'snake-frontend/script.js',
    'snake-frontend/style.css',
    'space-shooter-frontend/index.html',
    'space-shooter-frontend/player_ship.png',
    'space-shooter-frontend/script.js',
    'space-shooter-frontend/style.css',
    'space-shooter-frontend/thumbnail.jpg',
    'stick-duel-frontend/index.html',
    'stick-duel-frontend/thumbnail.jpg',
    'stick-fighter-frontend/index.html',
    'stick-fighter-frontend/script.js',
    'stick-fighter-frontend/style.css',
    'stick-fighter-frontend/thumbnail.jpg',
    'tictactoe-frontend/index.html',
    'tictactoe-frontend/style.css',
    'tictactoe-frontend/thumbnail.jpg',
    'tos.html',
    'updates.html'
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
