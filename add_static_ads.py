import os

target_files = ['about.html', 'contact.html', 'achievements.html', 'updates.html', 'privacy.html']

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

for filepath in target_files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Only inject if not already there
    if 'Adsterra Mobile Banner (320x50) - OUTSIDE GAME AREA' not in content:
        # Standardize search to footer wrapper
        if '<footer class="site-footer">' in content:
            content = content.replace('<footer class="site-footer">', banner_html + '\n    <footer class="site-footer">')
        else:
            # Fallback if no specific class
            content = content.replace('<footer>', banner_html + '\n    <footer>')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Injected ads into {len(target_files)} static pages.")
