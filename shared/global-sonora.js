/**
 * Arcade Hub - Seamless Navigation Shield for Background Sonora Playback
 * Keeps background Sonora music playing continuously without interruption
 * across all games and pages in Arcade Hub, and prevents nested Sonora iframes.
 */
(function() {
    // 0. Clean up any stale floating mini-player elements from old browser caches
    try {
        const oldMini = document.getElementById('arcade-global-sonora');
        if (oldMini) oldMini.remove();
        const oldStyles = document.getElementById('ags-styles');
        if (oldStyles) oldStyles.remove();
        localStorage.removeItem('sonora_mini_active');
    } catch (e) {}

    // Determine path depth
    const pathname = window.location.pathname.toLowerCase();

    function isSonoraHref(rawHref) {
        if (!rawHref || typeof rawHref !== 'string') return false;
        const base = rawHref.split('?')[0].split('#')[0].trim().toLowerCase();
        return base === 'sonora' ||
               base === 'sonora.html' ||
               base === '/sonora' ||
               base === '/sonora.html' ||
               base === '../sonora' ||
               base === '../sonora.html' ||
               base.endsWith('/sonora') ||
               base.endsWith('/sonora.html');
    }

    function returnToParentSonora(targetUrl) {
        try {
            if (window.top && typeof window.top.handleSonoraRedirect === 'function') {
                window.top.handleSonoraRedirect(targetUrl);
                return true;
            }
            if (window.top && typeof window.top.closeHubBrowser === 'function') {
                window.top.closeHubBrowser();
                return true;
            }
            if (window.top && window.top.document) {
                const overlay = window.top.document.getElementById('sonora-hub-overlay');
                if (overlay) overlay.setAttribute('hidden', '');
                const frame = window.top.document.getElementById('sonora-hub-frame');
                if (frame) frame.src = 'about:blank';
                return true;
            }
        } catch (err) {}
        return false;
    }

    // Do not run on Sonora's own full player page (unless accidentally loaded inside an iframe)
    if (pathname.endsWith('/sonora') || pathname.endsWith('/sonora.html') || pathname.endsWith('sonora.html')) {
        if (window.self !== window.top) {
            returnToParentSonora(window.location.href);
        }
        return;
    }

    // 1. SEAMLESS NAVIGATION SHIELD
    // When running inside Sonora's background in-app hub browser overlay (#sonora-hub-frame),
    // ensure no link or game exit button unloads Sonora's top-level context or creates a duplicate Sonora iframe.
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
    if (sonoraFrame) {
        // Capture-phase delegation: immediately catch ANY link to Sonora (including ?lib=... query strings)
        document.addEventListener('click', (e) => {
            const link = e.target && e.target.closest ? e.target.closest('a') : null;
            if (!link) return;
            const rawHref = link.getAttribute('href') || '';
            if (isSonoraHref(rawHref)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                returnToParentSonora(rawHref);
            }
        }, true);

        const protectNavigation = () => {
            // A. Intercept links pointing to Sonora or _top
            document.querySelectorAll('a').forEach(link => {
                const rawHref = link.getAttribute('href') || '';
                const target = (link.getAttribute('target') || '').toLowerCase();

                if (isSonoraHref(rawHref)) {
                    if (!link.dataset.sonoraLinkBound) {
                        link.dataset.sonoraLinkBound = 'true';
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            returnToParentSonora(rawHref);
                        });
                    }
                } else if (target === '_top') {
                    // Neutralize target="_top" so it never destroys the Sonora parent window
                    link.removeAttribute('target');
                    if (!link.dataset.sonoraTopBound) {
                        link.dataset.sonoraTopBound = 'true';
                        link.addEventListener('click', (e) => {
                            const h = link.getAttribute('href') || '';
                            if (h === '/' || h === 'index.html' || h.endsWith('/index.html') || h === '../index.html') {
                                e.preventDefault();
                                e.stopPropagation();
                                sonoraFrame.src = 'index.html?in_sonora=1';
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
                                sonoraFrame.src = 'index.html?in_sonora=1';
                            }
                        }, true);
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
})();
