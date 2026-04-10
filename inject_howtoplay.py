import os

# Game-specific how-to-play instructions
game_instructions = {
    'dino-frontend': {
        'file': 'index.html',
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn share-btn" style="margin-top:8px; font-size:0.85rem;" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> Press <b>SPACE</b> or <b>Tap</b> the screen to jump.</p>
                    <p>🦘 <b style="color:#fff;">Double Jump:</b> Press again while in the air for a second jump!</p>
                    <p>🌵 <b style="color:#fff;">Avoid:</b> Dodge cacti and flying birds.</p>
                    <p>🌙 <b style="color:#fff;">Day/Night:</b> The world cycles between day and night as you score higher.</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Survive as long as possible and beat your high score!</p>
                </div>'''
    },
    'snake-frontend': {
        'file': 'index.html',
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn share-btn" style="margin-top:8px; font-size:0.85rem;" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> Use <b>Arrow Keys</b> or <b>WASD</b> on desktop. <b>Swipe</b> on mobile.</p>
                    <p>🍎 <b style="color:#fff;">Eat:</b> Guide the snake to the glowing food to grow longer.</p>
                    <p>💀 <b style="color:#fff;">Don't:</b> Hit the walls or eat your own tail!</p>
                    <p>⚡ <b style="color:#fff;">Speed:</b> The snake accelerates as you eat more food.</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Eat as much as possible and beat your high score!</p>
                </div>'''
    },
    'flappy-frontend': {
        'file': 'index.html',
        'search': '<button id="startBtn" class="btn primary">Start Game</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn share-btn" style="margin-top:8px; font-size:0.85rem;" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> Press <b>SPACE</b> or <b>Tap</b> the screen to flap your wings.</p>
                    <p>🚧 <b style="color:#fff;">Navigate:</b> Fly through the gaps in the neon pipes.</p>
                    <p>⬇️ <b style="color:#fff;">Gravity:</b> The bird constantly falls — keep tapping to stay airborne!</p>
                    <p>💀 <b style="color:#fff;">Don't:</b> Hit the pipes or the ground!</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Pass as many pipes as possible to earn your high score!</p>
                </div>'''
    },
    'neon-brawler-frontend': {
        'file': 'index.html',
        'search': '<button id="startBtn" class="btn primary">Start Fighting</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn share-btn" style="margin-top:8px; font-size:0.85rem;" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> Tap <b>Left</b> or <b>Right</b> half of the screen (or use <b>Arrow Keys</b>).</p>
                    <p>👊 <b style="color:#fff;">Attack:</b> Hit enemies as they approach from both sides.</p>
                    <p>⏱️ <b style="color:#fff;">Timing:</b> Strike when enemies enter your hit range!</p>
                    <p>💀 <b style="color:#fff;">Don't:</b> Let enemies reach you or you lose!</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Build the longest combo streak possible!</p>
                </div>'''
    },
    'space-shooter-frontend': {
        'file': 'index.html',
        'search': '<button id="startBtn" class="btn primary">Launch Mission</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn share-btn" style="margin-top:8px; font-size:0.85rem;" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> Use <b>Arrow Keys</b> or <b>WASD</b> to move your ship. On mobile, <b>drag</b> to steer.</p>
                    <p>🔫 <b style="color:#fff;">Auto-Fire:</b> Your ship shoots automatically!</p>
                    <p>👽 <b style="color:#fff;">Enemies:</b> Destroy Scout, Battle, and heavy Tank aliens.</p>
                    <p>🎁 <b style="color:#fff;">Power-ups:</b> Collect drops from Tank aliens for shields and firepower.</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Survive the alien waves and score as high as possible!</p>
                </div>'''
    },
    'neon-runner-frontend': {
        'file': 'index.html',
        'search': '<button class="btn" id="startBtn">Start Running</button>',
        'instructions': '''
                <button id="howToPlayBtn" class="btn" style="margin-top:8px; font-size:0.85rem; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);" onclick="document.getElementById('howToPanel').classList.toggle('hidden')">📖 How to Play</button>
                <div id="howToPanel" class="hidden" style="text-align:left; margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.7; max-width:350px;">
                    <p>🕹️ <b style="color:#fff;">Controls:</b> <b>Swipe Up/Down</b> or use <b>Arrow Keys</b> to switch lanes.</p>
                    <p>🪙 <b style="color:#fff;">Coins:</b> Collect gold coins — every 10 coins refills a boost!</p>
                    <p>⚡ <b style="color:#fff;">Boost:</b> <b>Double Tap</b> for 2 seconds of Invincibility!</p>
                    <p>🚧 <b style="color:#fff;">Barriers:</b> Dodge pink barriers to survive.</p>
                    <p>🏆 <b style="color:#fff;">Goal:</b> Run as far as possible and beat your best score!</p>
                </div>'''
    },
}

for game_dir, config in game_instructions.items():
    filepath = os.path.join(game_dir, config['file'])
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Don't inject twice
    if 'howToPlayBtn' in content:
        print(f"SKIP: {filepath} already has How to Play")
        continue
    
    search = config['search']
    if search not in content:
        print(f"SKIP: {filepath} - search string not found")
        continue
    
    replacement = search + config['instructions']
    content = content.replace(search, replacement)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"DONE: {filepath}")

print("\nAll games processed!")
