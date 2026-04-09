import glob

html_files = glob.glob('**/*.html', recursive=True)

anti_popunder_script = """
    <!-- Ultimate Network Ad Blocker Shield -->
    <script>
    (function() {
        const protectSelectors = 'a, button, canvas, .game-card, .btn, .pause-btn, .share-btn, .home-btn, .nav-link, .cell, input, select, .score-container';
        
        // 1. Intercept all global event bindings (how Popunders usually hijack)
        const originalAdd = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if ((this === window || this === document || this === document.body) && 
                ['click', 'mousedown', 'touchstart', 'mouseup', 'touchend'].includes(type) &&
                typeof listener === 'function') 
            {
                const wrappedListener = function(e) {
                    if (e.target && e.target.closest && e.target.closest(protectSelectors)) {
                        return; // Shield activated! Block the ad from receiving this interaction.
                    }
                    return listener.apply(this, arguments);
                };
                return originalAdd.call(this, type, wrappedListener, options);
            }
            return originalAdd.call(this, type, listener, options);
        };

        // 2. Prevent dynamic overlay hijacking (invisible divs)
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.tagName === 'DIV' && node.style) {
                        // Check if it's acting like a full-screen overlay clickjacker
                        const isAbsolute = node.style.position === 'absolute' || node.style.position === 'fixed';
                        const isMassive = parseInt(node.style.zIndex || 0) > 1000;
                        if (isAbsolute && isMassive && !node.classList.contains('ad-container')) {
                            // Automatically push behind our UI
                            node.style.zIndex = '1';
                            node.style.pointerEvents = 'none'; // Click through to game!
                        }
                    }
                });
            });
        });
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    })();
    </script>
"""

for filepath in html_files:
    if 'node_modules' in filepath or 'target' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_idx = content.find('<!-- Ultimate Anti-Popunder Script to Protect Game Feel -->')
    end_idx = content.find('</script>', start_idx) + 9 if start_idx != -1 else -1
    
    if start_idx != -1 and end_idx > start_idx:
        # Strip old injected script
        content = content[:start_idx] + content[end_idx:]
        
    if 'Ultimate Network Ad Blocker Shield' not in content:
        content = content.replace('</title>', '</title>\n' + anti_popunder_script)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Applied Supreme Shield to {len(html_files)} files.")
