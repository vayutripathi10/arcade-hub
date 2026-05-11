import os

adsense_code = """    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5174002360692771"
     crossorigin="anonymous"></script>"""

def inject_adsense(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'pagead2.googlesyndication.com' in content:
        print(f"Skipping {file_path} - AdSense already present")
        return

    # Inject before </head>
    if '</head>' in content:
        new_content = content.replace('</head>', adsense_code + '\n</head>')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected AdSense into {file_path}")
    else:
        print(f"Skipping {file_path} - No </head> tag found")

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            inject_adsense(os.path.join(root, file))
