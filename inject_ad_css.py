import glob

html_files = glob.glob('**/*.html', recursive=True)

style_injection = """
    <!-- Dark Mode Ad Formatting -->
    <style>
        .ad-container { background-color: transparent !important; }
        .ad-container iframe { background-color: transparent !important; color-scheme: dark !important; }
    </style>
"""

for filepath in html_files:
    if 'node_modules' in filepath or 'target' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'Dark Mode Ad Formatting' not in content:
        content = content.replace('</head>', style_injection + '</head>')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Applied dark frame CSS to {len(html_files)} files.")
