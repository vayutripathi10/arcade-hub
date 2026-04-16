import os

index_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\index.html"
css_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\style.css"

with open(index_path, "r", encoding="utf-8") as f:
    idx = f.read()

# Replace Header
bad_header = """    <header class="app-header">
        <a href="../index.html" class="home-btn">← Back to Hub</a>
        <div class="score-container">
            SCORE <span id="ui-score">0</span>
        </div>
        <button id="btn-pause" class="pause-btn">⏸️</button>
    </header>"""

good_header = """    <div class="header" style="display:flex; justify-content:space-between; align-items:center; padding:10px 20px; background:rgba(0,0,0,0.5); border-bottom:1px solid #0ff;">
        <div class="nav-left">
            <a href="../index.html" class="back-btn" style="color:#0ff; text-decoration:none; font-family:'Press Start 2P', monospace; font-size:12px;">&#8592; Arcade Hub</a>
        </div>
        <div class="nav-right" style="display:flex; gap:20px; align-items:center;">
            <div class="stat-box" style="font-family:'Press Start 2P', monospace; font-size:12px; color:#fff;">
                <span class="stat-label">SCORE</span>
                <span class="stat-val gold" id="ui-score" style="color:#ffd700;">0</span>
            </div>
            <button id="btn-pause" class="pause-btn" style="background:#f0f; color:#fff; border:none; padding:5px 10px; font-family:'Press Start 2P', monospace; cursor:pointer; font-size:12px;">||</button>
        </div>
    </div>"""

idx = idx.replace(bad_header, good_header)

# Replace HowToPlay structure so we can use menu-overlay
bad_htp = """        <!-- How To Play Modal -->
        <div id="howToPlayModal" class="modal hidden">
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2 style="font-family: 'Press Start 2P', Courier; color: #0df;">HOW TO PLAY</h2>
                <div class="rules-container">
                    <p><b>Movement:</b></p>
                    <ul>
                        <li><b>Desktop:</b> Left / Right Arrow Keys</li>
                        <li><b>Mobile:</b> On-Screen D-Pad</li>
                    </ul>
                    <p><b>Combat System:</b></p>
                    <ul>
                        <li>Press the <b>Down Arrow</b> (or STRIKE button) to attack!</li>
                        <li>Single press: Basic Kick.</li>
                        <li>Rapid Presses: Chain together Jab, Punch, and Heavy Roundhouse combos!</li>
                        <li>Combo-chains push enemies backward and deal massive damage!</li>
                    </ul>
                    <p><b>Bosses:</b></p>
                    <ul>
                        <li>Every 10 enemies defeated summons a massive Boss! Stay moving as their attacks deal immense damage.</li>
                    </ul>
                </div>
            </div>
        </div>"""

good_htp = """        <!-- How To Play Modal -->
        <div id="howToPlayModal" class="menu-overlay hidden">
            <h2 style="font-family: 'Press Start 2P', Courier; color: #0df;">HOW TO PLAY</h2>
            <div class="rules-container" style="text-align:left; max-width:400px; color:#ddd; font-family:Outfit, sans-serif; font-size:14px; background:rgba(0,0,0,0.8); padding:20px; border:1px solid #0df; border-radius:10px;">
                <p><b>Movement:</b></p>
                <ul>
                    <li><b>Desktop:</b> Left / Right Arrow Keys</li>
                    <li><b>Mobile:</b> On-Screen D-Pad</li>
                </ul>
                <p><b>Combat System:</b></p>
                <ul>
                    <li>Press <b>Down Arrow</b> (or STRIKE) to attack!</li>
                    <li>Single press: Basic Kick.</li>
                    <li>Rapid Presses: Chain Jab, Punch, and Roundhouse combos!</li>
                </ul>
                <p><b>Bosses:</b></p>
                <p>Every 10 enemies defeated summons a massive Boss!</p>
            </div>
            <button class="btn primary-btn close-btn" style="margin-top:20px;">Close</button>
        </div>"""

idx = idx.replace(bad_htp, good_htp)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(idx)

# Fix CSS height bounding
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

css = css.replace("height: 600px;", "height: 80vh;\n    max-height: 600px;")
css = css.replace("margin: 20px auto;", "margin: 2vh auto;")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("UI fixed")
