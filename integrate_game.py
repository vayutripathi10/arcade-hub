import os

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

card_html = """
            <!-- Neon Stick Fighter Card -->
            <a href="stick-fighter-frontend/index.html" class="game-card">
                <div class="card-icon brawler-icon" style="background: rgba(0, 255, 255, 0.1); border-color:#0ff; text-shadow: 0 0 10px #0ff;">
                    <span class="brawler-emoji">🥷</span>
                </div>
                <div class="card-content">
                    <h3 class="game-title">Neon Stick Fighter</h3>
                    <p class="game-desc">A full-action 2D stickman beat 'em up game!<br><br><b>How to play:</b> Move left/right and unleash 3-hit combos on infinite waves of scaling enemies and massive Bosses.</p>
                    <span class="play-btn">Play Now</span>
                </div>
            </a>
"""

if "Neon Stick Fighter Card" not in index_html:
    # Insert right before Neon Runner Card
    index_html = index_html.replace('<!-- Neon Runner Card -->', card_html + '            <!-- Neon Runner Card -->')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
    print("index.html updated")

# 2. Update about.html
with open('about.html', 'r', encoding='utf-8') as f:
    about_html = f.read()
    
if "12+" not in about_html:
    about_html = about_html.replace('<span class="stat-value">11+</span>', '<span class="stat-value">12+</span>')
    about_html = about_html.replace('<span class="game-tag coming-soon">More coming soon...</span>', '<span class="game-tag">Neon Stick Fighter</span>\n                <span class="game-tag coming-soon">More coming soon...</span>')
    with open('about.html', 'w', encoding='utf-8') as f:
        f.write(about_html)
    print("about.html updated")

# 3. Update updates.html
with open('updates.html', 'r', encoding='utf-8') as f:
    updates_html = f.read()

update_chunk = """
        <div class="update-card main-update">
            <div class="update-header">
                <h2>🥷 Neon Stick Fighter Released!</h2>
                <span class="update-date">April 17, 2026</span>
            </div>
            <div class="update-content">
                <img src="favicon.png" alt="Neon Stick Fighter Update" class="update-image" style="max-width:200px">
                <p>Get ready to unleash rapid combo attacks in our brand new beat-em-up action game!</p>
                <h3>Game Features:</h3>
                <ul>
                    <li>🔥 <strong>Dynamic Combo System:</strong> Time your strikes to chain heavy kicks and punches!</li>
                    <li>🧟 <strong>Horde Scaling:</strong> Enemies attack infinitely from both sides and scale in difficulty.</li>
                    <li>👑 <strong>Boss Battles:</strong> Every 10 enemies triggers a massive Boss fight with custom health bars!</li>
                    <li>🎮 <strong>Mobile Optimized:</strong> Full native on-screen D-Pad and Strike controls for mobile devices!</li>
                </ul>
                <div class="update-actions">
                    <a href="stick-fighter-frontend/index.html" class="btn primary-btn">PLAY NEON STICK FIGHTER</a>
                </div>
            </div>
        </div>
"""
if "Neon Stick Fighter Released" not in updates_html:
    # Find first update card and insert before it
    updates_html = updates_html.replace('<div class="update-card main-update">', update_chunk + '\n        <div class="update-card main-update">', 1)
    with open('updates.html', 'w', encoding='utf-8') as f:
        f.write(updates_html)
    print("updates.html updated")

# 4. Update sitemap.xml
with open('sitemap.xml', 'r', encoding='utf-8') as f:
    sitemap_xml = f.read()

sitemap_chunk = """  <url>
    <loc>https://arcadehubplay.com/stick-fighter-frontend/index.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""

if "stick-fighter-frontend" not in sitemap_xml:
    sitemap_xml = sitemap_xml.replace('</urlset>', sitemap_chunk)
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)
    print("sitemap.xml updated")
