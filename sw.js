const CACHE_NAME = 'arcade-hub-cache-v1';
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
    'shared/achievements.js'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching core assets');
            // Cache resources individually to prevent single-failure blocking
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

// Activate Event - Clean up old caches
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
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Serve with appropriate strategies
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Only handle HTTP/HTTPS (ignore chrome-extension, file://, etc.)
    if (!url.protocol.startsWith('http')) return;

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
            caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Fetch in background to update cache (Stale-While-Revalidate)
                    fetch(e.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
                        }
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
                    return networkResponse;
                }).catch(() => {
                    // Fail gracefully if offline and not cached
                    return new Response('Offline resource not found', { status: 404, statusText: 'Offline' });
                });
            })
        );
    } else {
        // Network-First strategy for HTML pages and APIs to keep content fresh
        e.respondWith(
            fetch(e.request).then((networkResponse) => {
                // Cache successful responses dynamically
                if (networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
                }
                return networkResponse;
            }).catch(() => {
                // On offline network error, fallback to cache
                return caches.match(e.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    // Fallback to offline shell if navigating
                    if (e.request.mode === 'navigate') {
                        return caches.match('index.html');
                    }
                });
            })
        );
    }
});
