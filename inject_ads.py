import os
import re

game_dirs = [
    'dino-frontend', 'snake-frontend', 'tictactoe-frontend', 'flappy-frontend',
    'neon-brawler-frontend', 'neon-runner-frontend', 'space-shooter-frontend',
    'neon-drawbridge-frontend', 'neon-bottle-shooter-frontend'
]

popunder_code = '\n    <!-- Adsterra Global Popunder -->\n    <script src="https://pl29104526.profitablecpmratenetwork.com/b9/a9/9c/b9a99c26405c2cd91e8037534ad77c2a.js"></script>\n'

banner_320x50 = """
                <!-- Adsterra Mobile Banner (320x50) -->
                <div class="ad-container mobile-banner" style="margin-top: 15px; display: flex; justify-content: center; width: 100%; overflow: hidden;">
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

# Handle Game HTML files
for d in game_dirs:
    filepath = os.path.join(d, 'index.html')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Inject Popunder
        if 'b9a99c26405c2cd91e8037534ad77c2a.js' not in content:
            content = content.replace('</head>', popunder_code + '</head>')
        
        # Inject 320x50 Banner
        if '68ced95a589a3c37a8f41a8fff267340' not in content:
            # Pause Menu injection
            content = content.replace('Quit to Menu</button>', 'Quit to Menu</button>' + banner_320x50)
            
            # Game Over / Start Menu injection
            if '<div class="share-container' in content:
                content = content.replace('<div class="share-container', banner_320x50 + '<div class="share-container')
            elif 'id="startBtn"' in content:
                content = re.sub(r'(<button[^>]*id="startBtn"[^>]*>)', banner_320x50 + r'\1', content)
            elif 'onclick="resetGame()"' in content:
                content = re.sub(r'(<button[^>]*onclick="resetGame\(\)"[^>]*>)', banner_320x50 + r'\1', content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# Handle other static files
for f in ['about.html', 'contact.html', 'updates.html']:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        if 'b9a99c26405c2cd91e8037534ad77c2a.js' not in c:
            c = c.replace('</head>', popunder_code + '</head>')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

print('Injection script completed successfully.')
