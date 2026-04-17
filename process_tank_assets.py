import PIL.Image as Image
import os

# Paths
dir_path = r"C:\Users\vaytripa\.gemini\antigravity\brain\a6fc08ba-dfbf-42ed-a68a-13725c3736ff"
output_dir = r"c:\Users\vaytripa\BLT\Practice\open.ai\retro-tank-battle-frontend\assets"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

assets = {
    "player_tank.png": "retro_player_tank_1776419079233.png",
    "enemy_tank.png": "retro_enemy_tank_1776419104181.png",
    "base_hq.png": "retro_base_hq_1776419128410.png"
}

def process_single(filename, out_name):
    img = Image.open(os.path.join(dir_path, filename)).convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        # Check for solid green background typical of AI generation
        if item[1] > 180 and item[0] < 120 and item[2] < 120:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img = img.resize((64, 64), Image.Resampling.NEAREST)
    img.save(os.path.join(output_dir, out_name))
    print(f"Processed {out_name}")

def process_tiles(filename):
    img = Image.open(os.path.join(dir_path, filename)).convert("RGBA")
    # AI generated tileset is usually 4 items in a 2x2 grid in a large image
    # Let's crop them carefully.
    w, h = img.size
    # 2x2 grid
    tile_w, tile_h = w // 2, h // 2
    
    names = ["brick", "steel", "grass", "water"]
    coords = [(0,0), (1,0), (0,1), (1,1)]
    
    for i in range(4):
        x, y = coords[i]
        left = x * tile_w
        top = y * tile_h
        right = left + tile_w
        bottom = top + tile_h
        tile = img.crop((left, top, right, bottom))
        
        # Remove green background from tiles too if present
        data = tile.getdata()
        new_data = []
        for item in data:
            if item[1] > 200 and item[0] < 100 and item[2] < 100:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)
        tile.putdata(new_data)
        
        # Shrink to game resolution (32x32 tiles)
        tile = tile.resize((32, 32), Image.Resampling.NEAREST)
        tile.save(os.path.join(output_dir, f"tile_{names[i]}.png"))
        print(f"Processed tile_{names[i]}.png")

# Start
for out, src in assets.items():
    process_single(src, out)

process_tiles("retro_tiles_sheet_1776419151376.png")

print("Asset processing complete.")
