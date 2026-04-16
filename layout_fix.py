import os

index_html = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\index.html"
js_file = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\script.js"
css_file = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\style.css"
main_index = r"c:\Users\vaytripa\BLT\Practice\open.ai\index.html"

# 1. Update Game UI (index.html)
with open(index_html, "r", encoding="utf-8") as f:
    idx = f.read()

# Replace old bloated header with absolute positioned simple standard header
old_hdr = """    <div class="header" style="display:flex; justify-content:space-between; align-items:center; padding:10px 20px; background:rgba(0,0,0,0.5); border-bottom:1px solid #0ff;">
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

# Ensure header is cleanly at top corner
new_hdr = """    <div class="header">
        <a href="../index.html" class="back-btn">&#8592; Arcade Hub</a>
        <button id="btn-pause" class="pause-btn">|| Pause</button>
    </div>"""
if old_hdr in idx:
    idx = idx.replace(old_hdr, new_hdr)
elif '<header class="app-header">' in idx:
    pass

# Move Score down under Defeated
old_hud = """                <div class="stat-left">Defeated: <span id="ui-kills">0</span></div>"""
new_hud = """                <div class="stat-left">Defeated: <span id="ui-kills">0</span><br>Score: <span id="ui-score">0</span></div>"""
idx = idx.replace(old_hud, new_hud)

with open(index_html, "w", encoding="utf-8") as f:
    f.write(idx)


# 2. Add header CSS bindings and fix bottom clip border bounds
with open(css_file, "r", encoding="utf-8") as f:
    css = f.read()

hdr_css = """
/* Fix CSS boundary bottom */
#gameWrapper {
    position: relative;
    width: 100%;
    max-width: 800px;
    height: 100vh;
    max-height: calc(100vh - 150px);
    margin: 2vh auto;
    background: linear-gradient(180deg, #120e2b 0%, #291244 40%, #000 100%);
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    border: 2px solid #0ff;
    border-radius: 10px;
    overflow: hidden;
}

.header {
    position: absolute; top: 0; left: 0; width: 100%;
    display: flex; justify-content: space-between; padding: 15px 20px;
    box-sizing: border-box; z-index: 1000;
}
.back-btn { color: #0ff; text-decoration: none; font-family: 'Press Start 2P', monospace; font-size: 14px; text-shadow: 0 0 5px #0ff;}
.pause-btn { background: transparent; border: 2px solid #f0f; color: #f0f; font-weight: bold; font-size: 12px; cursor: pointer; padding: 5px 10px; font-family: 'Press Start 2P', monospace; }
"""

# Replace the older #gameWrapper entirely with the new clamped one.
# It was manually replaced earlier with 80vh! Let's just override it safely.
if "#gameWrapper {" in css:
    css = css.split("#gameWrapper {")[0] + hdr_css + "\n#gameCanvas {\n" + css.split("#gameCanvas {")[1]
    
with open(css_file, "w", encoding="utf-8") as f:
    f.write(css)


# 3. Update main index.html for news feed
with open(main_index, "r", encoding="utf-8") as f:
    m_idx = f.read()

new_news = """            <div class="news-feed">
                <div class="news-item">
                    <span class="news-date">April 17, 2026</span>
                    <h3>🥷 Neon Stick Fighter Unleashed!</h3>
                    <p>Enter the cyberpunk fighting arena! Unleash fast-paced Jab, Punch, and Flying Kick combos to defeat massive endless waves of enemies. Epic Boss battles included!</p>
                </div>"""
m_idx = m_idx.replace('<div class="news-feed">', new_news)
with open(main_index, "w", encoding="utf-8") as f:
    f.write(m_idx)


# 4. Fix Pause Event hook & Flying Kick logic
with open(js_file, "r", encoding="utf-8") as f:
    js = f.read()
    
if "btn-pause" not in js.split("document.getElementById('btn-quit-end')")[1]:
    js = js.replace("document.getElementById('btn-resume').addEventListener('click', togglePause);", "document.getElementById('btn-resume').addEventListener('click', togglePause);\ndocument.getElementById('btn-pause').addEventListener('click', togglePause);")

# Update Flying kick so it stays horizontal and hits hard
js = js.replace("ent.vy = -18; // Flying jump", "ent.vy = -5; // Horizontal smash")
js = js.replace("ent.vx = ent.dir * 15; // Flying rush forward", "ent.vx = ent.dir * 18; // Extreme forward smash")

with open(js_file, "w", encoding="utf-8") as f:
    f.write(js)
    
print("All fixes applied successfully.")
