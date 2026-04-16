import re

with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# Extract everything between <div class="games-grid"> and the closing </div> before the native banner
match = re.search(r'(<div class="games-grid">\s+)(.*?)(        </div>\s+<!-- Native Banner Ad -->)', text, re.DOTALL)
if not match:
    print("Could not parse!")
    exit(1)

prefix = match.group(1)
inner = match.group(2)
suffix = match.group(3)

# Split by <!-- ... Card -->
cards_raw = re.split(r'(\s*<!-- [^>-]+ Card -->\s*)', inner)
cards = []
for i in range(1, len(cards_raw), 2):
    cards.append(cards_raw[i] + cards_raw[i+1])

# Parse cards by name
card_dict = {}
for c in cards:
    if "Stick Duel" in c: card_dict["stick_duel"] = c
    elif "Space Shooter" in c: card_dict["space"] = c
    elif "Draw Bridge" in c: card_dict["bridge"] = c
    elif "Bottle Shooter" in c: card_dict["bottle"] = c
    elif "Neon Flappy" in c: card_dict["flappy"] = c
    elif "Neon Brawler" in c: card_dict["brawler"] = c
    elif "Zen Dino" in c: card_dict["dino"] = c
    elif "Zen Snake" in c: card_dict["snake"] = c
    elif "Tic Tac Toe" in c: card_dict["ttt"] = c
    elif "Neon Runner" in c: card_dict["runner"] = c

# Construct new order
order = [
    card_dict["stick_duel"],
    card_dict["space"],
    card_dict["bridge"],
    card_dict["bottle"],
    card_dict["flappy"],
    card_dict["brawler"],
    card_dict["runner"],
    card_dict["dino"],
    card_dict["snake"],
    card_dict["ttt"],
]

retro_card = """
            <!-- Retro Hub Card -->
            <a href="retro-hub.html" class="game-card retro-card" style="background: #111; border: 4px inset #666; box-shadow: inset 0 0 10px #000, 4px 4px 0 #000; border-radius: 0;">
                <div class="card-icon" style="background: rgba(0,255,0,0.1); border: 2px solid #0f0; border-radius: 0; box-shadow: 0 0 10px #0f0;">
                    <span style="font-family: 'Press Start 2P', Courier; color: #0f0; font-weight: bold; font-size: 24px;">🕹️</span>
                </div>
                <div class="card-content">
                    <h3 class="game-title" style="font-family: 'Press Start 2P', Courier; color: #0f0; text-shadow: none; font-size: 14px; text-transform: uppercase;">Retro Hub</h3>
                    <p class="game-desc" style="color: #ccc; font-family: 'Courier New', Courier, monospace;">Insert Coin. Step back into the 8-bit era and survive the high scores.</p>
                    <span class="play-btn" style="background: #0f0; color: #000; border: none; border-radius: 0; font-weight: bold; box-shadow: 2px 2px 0 #000; text-shadow: none;">INSERT COIN</span>
                </div>
            </a>
"""

order.append(retro_card)

new_inner = "".join(order)
text = text[:match.start()] + prefix + new_inner + suffix + text[match.end():]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)

print("Done")
