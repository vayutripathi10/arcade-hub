/**
 * Arcade Hub - Global Persistent Sonora Mini Player & Seamless Navigation Shield
 * Floats playing music across all games, tools, and pages in Arcade Hub,
 * and preserves continuous audio playback across the entire site lifecycle.
 */
(function() {
    // Determine path depth
    const pathname = window.location.pathname.toLowerCase();

    // Do not run on Sonora's own full player page
    if (pathname.endsWith('/sonora') || pathname.endsWith('/sonora.html') || pathname.endsWith('sonora.html')) {
        return;
    }

    // Determine correct relative path to sonora.html
    const isSubfolder = pathname.includes('-frontend/') || pathname.includes('/blog/');
    const sonoraUrl = isSubfolder ? '../sonora.html' : 'sonora.html';

    // 0. Detect if running inside any iframe / embedded sub-window
    let isInsideIframe = false;
    try {
        isInsideIframe = (window.self !== window.top);
    } catch (e) {
        isInsideIframe = true;
    }

    // 1. SEAMLESS NAVIGATION SHIELD
    // When running inside Sonora's background in-app hub browser overlay (#sonora-hub-frame),
    // ensure no link or game exit button unloads Sonora's top-level context.
    function getSonoraFrame() {
        try {
            if (window.frameElement && (window.frameElement.id === 'sonora-hub-frame' || (window.frameElement.closest && window.frameElement.closest('#sonora-hub-overlay')))) {
                return window.frameElement;
            }
        } catch (e) {}
        try {
            if (window.top && window.top !== window && window.top.document) {
                const f = window.top.document.getElementById('sonora-hub-frame');
                if (f) return f;
            }
        } catch (e) {}
        try {
            if (window.parent && window.parent !== window && window.parent.document) {
                const f = window.parent.document.getElementById('sonora-hub-frame');
                if (f) return f;
            }
        } catch (e) {}
        try {
            if (window.parent && window.parent.parent && window.parent.parent !== window.parent && window.parent.parent.document) {
                const f = window.parent.parent.document.getElementById('sonora-hub-frame');
                if (f) return f;
            }
        } catch (e) {}
        return null;
    }

    const sonoraFrame = getSonoraFrame();
    if (sonoraFrame || isInsideIframe) {
        if (sonoraFrame) {
            const protectNavigation = () => {
                // A. Intercept links pointing to Sonora -> smoothly switch back to Sonora full player
                document.querySelectorAll('a').forEach(link => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    const target = (link.getAttribute('target') || '').toLowerCase();

                    if (href === 'sonora' || href === 'sonora.html' || href === '/sonora' || href.endsWith('/sonora') || href.endsWith('/sonora.html')) {
                        if (!link.dataset.sonoraLinkBound) {
                            link.dataset.sonoraLinkBound = 'true';
                            link.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    if (typeof window.top.closeHubBrowser === 'function') {
                                        window.top.closeHubBrowser();
                                    } else {
                                        const overlay = window.top.document.getElementById('sonora-hub-overlay');
                                        if (overlay) overlay.setAttribute('hidden', '');
                                    }
                                } catch (err) {}
                            });
                        }
                    } else if (target === '_top') {
                        // Neutralize target="_top" so it never destroys the Sonora parent window
                        link.removeAttribute('target');
                        if (!link.dataset.sonoraTopBound) {
                            link.dataset.sonoraTopBound = 'true';
                            link.addEventListener('click', (e) => {
                                const rawHref = link.getAttribute('href') || '';
                                if (rawHref === '/' || rawHref === 'index.html' || rawHref.endsWith('/index.html') || rawHref === '../index.html') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    sonoraFrame.src = 'index.html';
                                }
                            });
                        }
                    }
                });

                // B. Intercept embedded game iframes (e.g. inside play-*.html)
                document.querySelectorAll('iframe').forEach(iframe => {
                    if (iframe.id === 'sonora-hub-frame') return;
                    const attachIframeShield = () => {
                        try {
                            const idoc = iframe.contentDocument || iframe.contentWindow.document;
                            if (!idoc || idoc._sonoraShielded) return;
                            idoc._sonoraShielded = true;

                            // Intercept clicks on any Hub/Quit/Exit button inside the game iframe
                            const hubSelectors = '#hub-btn, #hub-gameover-btn, #btn-quit, #btn-quit-end, #hud-hub-btn, #abort-to-hub-btn, #victory-home-btn, .hub-btn, .hub-over-btn, .btn-hub, .home-btn, a[href*="index.html"]';
                            idoc.addEventListener('click', (e) => {
                                const target = e.target && e.target.closest(hubSelectors);
                                if (target) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    sonoraFrame.src = 'index.html';
                                }
                            }, true); // Use capture phase so it runs BEFORE any inner script
                        } catch (err) {}
                    };

                    attachIframeShield();
                    iframe.addEventListener('load', attachIframeShield);
                });
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', protectNavigation);
            } else {
                protectNavigation();
            }

            const observer = new MutationObserver(protectNavigation);
            observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
        }

        // Inside any iframe, Sonora parent or top page is already managing media; NEVER create secondary player
        return;
    }

    // 2. STANDALONE GLOBAL MINI PLAYER
    // For when Arcade Hub is browsed outside Sonora's persistent frame
    function isMiniActive() {
        return localStorage.getItem('sonora_mini_active') === 'true';
    }

    function getActiveTrack() {
        try {
            const raw = localStorage.getItem('sonora_active_track');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function getActiveVideoId() {
        return localStorage.getItem('sonora_active_video_id') || getActiveTrack()?.videoId || '';
    }

    function getSavedPosition() {
        try {
            const raw = localStorage.getItem('sonora_mini_pos');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function savePosition(left, top) {
        try {
            localStorage.setItem('sonora_mini_pos', JSON.stringify({ left, top }));
        } catch {}
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Inject Styles once
    function injectStyles() {
        if (document.getElementById('ags-styles')) return;
        const style = document.createElement('style');
        style.id = 'ags-styles';
        style.textContent = `
            .arcade-global-sonora {
                position: fixed !important;
                z-index: 999999 !important;
                display: flex !important;
                flex-direction: column !important;
                background: #000 !important;
                border: 2px solid #8b5cf6 !important;
                border-radius: 14px !important;
                box-shadow: 0 16px 45px rgba(0, 0, 0, 0.9), 0 0 24px rgba(139, 92, 246, 0.5) !important;
                overflow: hidden !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                animation: agsFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
                width: 340px;
                max-width: calc(100vw - 24px);
                bottom: 24px;
                right: 24px;
                touch-action: none;
            }

            @keyframes agsFadeIn {
                from { opacity: 0; transform: scale(0.92) translateY(12px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @media (max-width: 768px) {
                .arcade-global-sonora {
                    width: clamp(180px, 50vw, 240px) !important;
                    bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
                    right: 12px !important;
                    border-radius: 12px !important;
                }
            }

            .ags-bar {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 4px 8px !important;
                background: rgba(14, 12, 24, 0.96) !important;
                border-bottom: 1px solid rgba(139, 92, 246, 0.35) !important;
                gap: 6px !important;
                cursor: grab !important;
            }

            .arcade-global-sonora.is-dragging .ags-bar {
                cursor: grabbing !important;
            }

            .ags-drag-label {
                display: flex !important;
                align-items: center !important;
                gap: 5px !important;
                color: #e2e8f0 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 0.72rem !important;
                font-weight: 700 !important;
                pointer-events: none !important;
            }

            .ags-drag-icon {
                color: #a78bfa !important;
                font-size: 0.85rem !important;
            }

            .ags-actions {
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
            }

            .ags-btn {
                background: rgba(139, 92, 246, 0.2) !important;
                border: 1px solid rgba(139, 92, 246, 0.45) !important;
                color: #fff !important;
                border-radius: 6px !important;
                padding: 2px 7px !important;
                font-size: 0.68rem !important;
                font-weight: 700 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 3px !important;
                text-decoration: none !important;
                line-height: 1.4 !important;
                transition: all 0.15s ease !important;
            }

            .ags-btn:hover {
                background: #8b5cf6 !important;
                color: #fff !important;
                border-color: #8b5cf6 !important;
            }

            .ags-close-btn {
                background: rgba(239, 68, 68, 0.2) !important;
                border-color: rgba(239, 68, 68, 0.45) !important;
                color: #fca5a5 !important;
                padding: 2px 6px !important;
            }

            .ags-close-btn:hover {
                background: #ef4444 !important;
                color: #fff !important;
                border-color: #ef4444 !important;
            }

            .ags-player-wrap {
                position: relative !important;
                width: 100% !important;
                aspect-ratio: 16 / 9 !important;
                background: #000 !important;
            }

            .ags-player-wrap iframe {
                width: 100% !important;
                height: 100% !important;
                border: none !important;
                display: block !important;
            }

            .ags-drag-shield {
                position: absolute !important;
                inset: 0 !important;
                display: none !important;
                background: transparent !important;
                z-index: 10 !important;
            }

            .arcade-global-sonora.is-dragging .ags-drag-shield {
                display: block !important;
            }
        `;
        document.head.appendChild(style);
    }

    function createGlobalPlayer() {
        if (document.getElementById('arcade-global-sonora')) return;
        const videoId = getActiveVideoId();
        if (!videoId) return;

        const track = getActiveTrack();
        injectStyles();

        const container = document.createElement('div');
        container.id = 'arcade-global-sonora';
        container.className = 'arcade-global-sonora';

        const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3`;

        container.innerHTML = `
            <div class="ags-bar" id="ags-drag-handle" title="Drag to move anywhere on screen">
                <div class="ags-drag-label">
                    <span class="ags-drag-icon">⠿</span>
                    <span class="ags-title">Sonora</span>
                </div>
                <div class="ags-actions">
                    <a href="${sonoraUrl}" class="ags-btn ags-expand-btn" id="ags-expand-btn" title="Open Sonora Full Player">
                        ⛶ <span>Sonora</span>
                    </a>
                    <button type="button" class="ags-btn ags-close-btn" id="ags-close-btn" title="Close player">
                        ✕
                    </button>
                </div>
            </div>
            <div class="ags-player-wrap">
                <iframe
                    id="ags-iframe"
                    src="${embedSrc}"
                    title="${escapeHtml(track?.title || 'Sonora Floating Player')}"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowfullscreen>
                </iframe>
                <div class="ags-drag-shield" id="ags-drag-shield"></div>
            </div>
        `;

        document.body.appendChild(container);

        // Position clamping / restoration
        const savedPos = getSavedPosition();
        if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
            const rect = container.getBoundingClientRect();
            const w = rect.width || (window.innerWidth <= 768 ? 200 : 340);
            const h = rect.height || (w * (9 / 16) + 32);
            const maxL = Math.max(0, window.innerWidth - w - 8);
            const maxT = Math.max(0, window.innerHeight - h - 8);
            const clampedL = Math.max(8, Math.min(maxL, savedPos.left));
            const clampedT = Math.max(8, Math.min(maxT, savedPos.top));

            container.style.bottom = 'auto';
            container.style.right = 'auto';
            container.style.left = `${clampedL}px`;
            container.style.top = `${clampedT}px`;
        }

        // Close action
        const closeBtn = container.querySelector('#ags-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                localStorage.removeItem('sonora_mini_active');
                container.remove();
            });
        }

        // Drag handlers (Pointer events with pointer capture)
        const handle = container.querySelector('#ags-drag-handle');
        if (handle) {
            let isDragging = false;
            let startPointerX = 0;
            let startPointerY = 0;
            let startElemX = 0;
            let startElemY = 0;

            const onPointerDown = (e) => {
                if (e.target.closest('#ags-expand-btn') || e.target.closest('#ags-close-btn')) return;
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
                savePosition(rect.left, rect.top);
            };

            handle.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { passive: true });
            window.addEventListener('pointercancel', onPointerUp, { passive: true });
        }
    }

    function init() {
        if (isMiniActive()) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createGlobalPlayer);
            } else {
                createGlobalPlayer();
            }
        }
    }

    // React to storage changes from Sonora in other tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'sonora_mini_active') {
            if (e.newValue === 'true') {
                createGlobalPlayer();
            } else {
                const existing = document.getElementById('arcade-global-sonora');
                if (existing) existing.remove();
            }
        }
    });

    init();
})();
