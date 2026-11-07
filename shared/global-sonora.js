/**
 * Arcade Hub - Seamless Navigation Shield for Background Sonora Playback
 * Keeps background Sonora music playing continuously without interruption
 * across all games and pages in Arcade Hub.
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

    // Do not run on Sonora's own full player page
    if (pathname.endsWith('/sonora') || pathname.endsWith('/sonora.html') || pathname.endsWith('sonora.html')) {
        return;
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
})();
