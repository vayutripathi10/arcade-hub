import os
import re

game_dirs = [
    'dino-frontend', 'snake-frontend', 'tictactoe-frontend', 'flappy-frontend',
    'neon-brawler-frontend', 'neon-runner-frontend', 'space-shooter-frontend',
    'neon-drawbridge-frontend', 'neon-bottle-shooter-frontend'
]

banner_regex = re.compile(r'\s*<!-- Adsterra Mobile Banner \(320x50\) -->.*?</div>', re.DOTALL)

banner_html = """
    <!-- Adsterra Mobile Banner (320x50) - OUTSIDE GAME AREA -->
    <div class="ad-container mobile-banner" style="margin: 20px auto; display: flex; justify-content: center; width: 100%; max-width: 100%; overflow: hidden;">
        <script>
        atOptions = {
            'key' : '68ced95a589a3c37a8f41a8fff267340',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
        };
        </script>
        <script src="https://www.highperformanceformat.com/68ced95a589a3c37a8f41a8fff267340/invoke.js"></script>
    </div>
"""

for d in game_dirs:
    filepath = os.path.join(d, 'index.html')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove all instances of the old banner inside overlay or pause menu
        content = banner_regex.sub('', content)
        
        # Inject just before the footer
        if 'OUTSIDE GAME AREA' not in content:
            content = content.replace('<footer class="site-footer">', banner_html + '\n    <footer class="site-footer">')
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
print("done")
