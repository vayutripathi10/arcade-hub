import os, re

# Step 1: Remove ALL previously injected How to Play content from every game
game_dirs = [
    'dino-frontend', 'snake-frontend', 'flappy-frontend',
    'neon-brawler-frontend', 'space-shooter-frontend', 'neon-runner-frontend',
    'tictactoe-frontend'
]

for d in game_dirs:
    filepath = os.path.join(d, 'index.html')
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove inline howToPlayBtn and howToPanel (all variations)
    # Pattern 1: button + div with hidden panel (after startBtn)
    content = re.sub(
        r'\s*<button id="howToPlayBtn"[^>]*>.*?</button>\s*'
        r'<div id="howToPanel"[^>]*>.*?</div>',
        '', content, flags=re.DOTALL
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned: {filepath}")

print("Step 1 done: All old How to Play removed.\n")

# Step 2: Inject a proper full-screen overlay + button for each game
# This matches the Stick Duel pattern: a separate overlay screen

game_configs = {
    'dino-frontend': {
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'btn_text': 'Start Game',
        'instructions': [
            ('🕹️', 'Controls', 'Press <b>SPACE</b> or <b>Tap</b> the screen to jump.'),
            ('🦘', 'Double Jump', 'Press again while in the air for a second jump!'),
            ('🌵', 'Avoid', 'Dodge cacti on the ground and flying birds in the air.'),
            ('🌙', 'Day & Night', 'The world cycles between day and night as you score higher.'),
            ('🏆', 'Goal', 'Survive as long as possible and beat your high score!'),
        ]
    },
    'snake-frontend': {
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'btn_text': 'Start Game',
        'instructions': [
            ('🕹️', 'Controls', 'Use <b>Arrow Keys</b> or <b>WASD</b> on desktop. <b>Swipe</b> on mobile.'),
            ('🍎', 'Eat', 'Guide the snake to the glowing food to grow longer.'),
            ('💀', "Don't", 'Hit the walls or eat your own tail!'),
            ('⚡', 'Speed', 'The snake accelerates as you eat more food.'),
            ('🏆', 'Goal', 'Eat as much as possible and beat your high score!'),
        ]
    },
    'flappy-frontend': {
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'btn_text': 'Start Game',
        'instructions': [
            ('🕹️', 'Controls', 'Press <b>SPACE</b> or <b>Tap</b> the screen to flap.'),
            ('🚧', 'Navigate', 'Fly through the gaps in the neon pipes.'),
            ('⬇️', 'Gravity', 'The bird constantly falls — keep tapping to stay airborne!'),
            ('💀', "Don't", 'Hit the pipes or the ground!'),
            ('🏆', 'Goal', 'Pass as many pipes as possible to earn your high score!'),
        ]
    },
    'neon-brawler-frontend': {
        'search': '<button id="startBtn" class="btn primary">Start Fighting</button>',
        'btn_text': 'Start Fighting',
        'instructions': [
            ('🕹️', 'Controls', 'Tap the <b>Left</b> or <b>Right</b> half of the screen, or use <b>Arrow Keys</b>.'),
            ('👊', 'Attack', 'Hit enemies as they approach from both sides.'),
            ('⏱️', 'Timing', 'Strike when enemies enter your hit range for maximum combos!'),
            ('💀', "Don't", 'Let enemies reach you — or you lose!'),
            ('🏆', 'Goal', 'Build the longest combo streak possible!'),
        ]
    },
    'space-shooter-frontend': {
        'search': '<button id="startBtn" class="btn primary">Launch Mission</button>',
        'btn_text': 'Launch Mission',
        'instructions': [
            ('🕹️', 'Controls', 'Use <b>Arrow Keys / WASD</b> to move. On mobile, <b>drag</b> to steer.'),
            ('🔫', 'Auto-Fire', 'Your ship shoots automatically — focus on dodging!'),
            ('👽', 'Enemies', 'Destroy Scout, Battle, and heavy Tank alien ships.'),
            ('🎁', 'Power-ups', 'Collect drops from Tank aliens for shields and firepower.'),
            ('🏆', 'Goal', 'Survive the alien waves and score as high as possible!'),
        ]
    },
    'neon-runner-frontend': {
        'search': '<button class="btn" id="startBtn">Start Running</button>',
        'btn_text': 'Start Running',
        'instructions': [
            ('🕹️', 'Controls', '<b>Swipe Up/Down</b> or use <b>Arrow Keys</b> to switch lanes.'),
            ('🪙', 'Coins', 'Collect gold coins — every 10 coins refills a boost!'),
            ('⚡', 'Boost', '<b>Double Tap</b> for 2 seconds of Invincibility!'),
            ('🚧', 'Barriers', 'Dodge pink barriers or get smashed!'),
            ('🏆', 'Goal', 'Run as far as possible and beat your best score!'),
        ]
    },
}

# Build the reusable overlay CSS + JS (inject once per file)
overlay_style = """
    <!-- How to Play Overlay Styles -->
    <style>
        .htp-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(10, 14, 26, 0.96);
            z-index: 9998;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(8px);
            animation: htpFadeIn 0.3s ease;
        }
        .htp-overlay.active { display: flex; }
        @keyframes htpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .htp-card {
            max-width: 420px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            text-align: left;
            padding: 0 10px;
        }
        .htp-title {
            font-size: 1.4rem;
            color: #00ffcc;
            text-align: center;
            margin-bottom: 18px;
            font-weight: 700;
        }
        .htp-row {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            margin-bottom: 14px;
            font-size: 0.9rem;
            color: rgba(255,255,255,0.75);
            line-height: 1.6;
        }
        .htp-row-icon {
            font-size: 1.2rem;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .htp-row b { color: #ffffff; }
        .htp-back {
            display: block;
            margin: 20px auto 0;
            padding: 12px 32px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.06);
            color: #ffffff;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }
        .htp-back:hover { border-color: #00ffcc; color: #00ffcc; transform: translateY(-2px); }
        .htp-open-btn {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 20px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 204, 0.3);
            background: rgba(0, 255, 204, 0.08);
            color: #00ffcc;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            letter-spacing: 0.5px;
        }
        .htp-open-btn:hover { background: rgba(0, 255, 204, 0.15); transform: translateY(-1px); }
    </style>
"""

for game_dir, config in game_configs.items():
    filepath = os.path.join(game_dir, 'index.html')
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has new version
    if 'htp-overlay' in content:
        print(f"SKIP: {filepath} already has new HTP overlay")
        continue

    # Build instruction rows
    rows_html = ""
    for icon, label, text in config['instructions']:
        rows_html += f'            <div class="htp-row"><span class="htp-row-icon">{icon}</span><span><b>{label}:</b> {text}</span></div>\n'

    # Build the overlay div
    overlay_div = f"""
    <!-- How to Play Overlay -->
    <div class="htp-overlay" id="htpOverlay">
        <div class="htp-card">
            <div class="htp-title">📖 How to Play</div>
{rows_html}            <button class="htp-back" onclick="document.getElementById('htpOverlay').classList.remove('active')">← Got it!</button>
        </div>
    </div>
"""

    # The button to open the overlay (goes right after the start button)
    open_btn = '\n                <button class="htp-open-btn" onclick="event.stopPropagation(); document.getElementById(\'htpOverlay\').classList.add(\'active\')">📖 How to Play</button>'

    # Inject the style into </head>
    if 'htp-overlay' not in content:
        content = content.replace('</head>', overlay_style + '</head>')
    
    # Inject the overlay div before </body>
    content = content.replace('</body>', overlay_div + '</body>')
    
    # Inject the button after the start button
    content = content.replace(config['search'], config['search'] + open_btn)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"DONE: {filepath}")

# Step 3: Fix Tic Tac Toe separately (no start overlay, uses game-container)
ttt_path = os.path.join('tictactoe-frontend', 'index.html')
if os.path.exists(ttt_path):
    with open(ttt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'htp-overlay' not in content:
        ttt_rows = ""
        ttt_instructions = [
            ('🕹️', 'Controls', '<b>Tap</b> or <b>Click</b> any empty square to place your mark.'),
            ('❌', 'Player 1', 'Always plays as X (neon green).'),
            ('⭕', 'Player 2 / AI', 'Plays as O (neon pink).'),
            ('🤖', 'AI Mode', 'Toggle AI on/off. Choose Easy, Medium, or Hard (Unbeatable).'),
            ('🏆', 'Goal', 'Connect 3 marks in a row — horizontal, vertical, or diagonal!'),
        ]
        for icon, label, text in ttt_instructions:
            ttt_rows += f'            <div class="htp-row"><span class="htp-row-icon">{icon}</span><span><b>{label}:</b> {text}</span></div>\n'
        
        ttt_overlay = f"""
    <!-- How to Play Overlay -->
    <div class="htp-overlay" id="htpOverlay">
        <div class="htp-card">
            <div class="htp-title">📖 How to Play</div>
{ttt_rows}            <button class="htp-back" onclick="document.getElementById('htpOverlay').classList.remove('active')">← Got it!</button>
        </div>
    </div>
"""
        content = content.replace('</head>', overlay_style + '</head>')
        content = content.replace('</body>', ttt_overlay + '</body>')
        
        # Add the button after difficulty container close
        ttt_btn = '\n        <button class="htp-open-btn" style="margin-top:12px;" onclick="event.stopPropagation(); document.getElementById(\'htpOverlay\').classList.add(\'active\')">📖 How to Play</button>'
        content = content.replace('</select>\n        </div>', '</select>\n        </div>' + ttt_btn)
        
        with open(ttt_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"DONE: {ttt_path}")

print("\n✅ All games updated with proper How to Play overlay!")
