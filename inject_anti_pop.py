import glob

html_files = glob.glob('**/*.html', recursive=True)

anti_popunder_script = """
    <!-- Ultimate Anti-Popunder Script to Protect Game Feel -->
    <script>
    (function() {
        const stopAd = function(e) { e.stopPropagation(); };
        function protectUI() {
            const selectors = 'a, button, canvas, .game-card, .btn, .pause-btn, .share-btn, .home-btn, .nav-link, .cell, input, select';
            document.querySelectorAll(selectors).forEach(el => {
                if (!el.dataset.protected) {
                    el.dataset.protected = 'true';
                    ['mousedown', 'touchstart', 'touchend', 'click'].forEach(evt => {
                        el.addEventListener(evt, stopAd, { passive: false });
                    });
                }
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            protectUI();
            new MutationObserver(protectUI).observe(document.body, { childList: true, subtree: true });
        });
    })();
    </script>
"""

# Regex to remove old fix
old_fix = """            // Fix for Popunder hijacking the 'Play Now' game buttons
            document.querySelectorAll('.game-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // Prevent the click from bubbling up to the document 
                    // where Adsterra listens for popunders, allowing direct navigation
                    e.stopPropagation();
                });
            });"""

for filepath in html_files:
    if 'node_modules' in filepath or 'target' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'Ultimate Anti-Popunder Script' not in content:
        content = content.replace(old_fix, '')
        content = content.replace('</head>', anti_popunder_script + '</head>')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Applied to {len(html_files)} files.")
