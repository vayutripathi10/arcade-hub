import os
from PIL import Image

output_dir = r"c:\Users\vaytripa\BLT\Practice\open.ai\retro-racer-frontend"

def process_image(src_path, dst_filename, target_size=(40, 80)):
    if not os.path.exists(src_path):
        print(f"Skipping {src_path}")
        return
    
    img = Image.open(src_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Identify the green background and make it transparent
    for item in data:
        # Aggressive green screening to remove anti-aliasing halos
        if item[0] < 120 and item[1] > 140 and item[2] < 120:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop to bounding box of the non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Resize to fit the game's collision boxes perfectly
    img = img.resize(target_size, Image.Resampling.LANCZOS)
    
    dst_path = os.path.join(output_dir, dst_filename)
    img.save(dst_path, "PNG")
    print(f"Saved {dst_path}")

base = r"C:\Users\vaytripa\.gemini\antigravity\brain\a6fc08ba-dfbf-42ed-a68a-13725c3736ff"
process_image(os.path.join(base, "retro_player_car_1776363344538.png"), "player.png", (40, 80))
process_image(os.path.join(base, "retro_enemy_car_1776363367051.png"), "enemy.png", (40, 80))
process_image(os.path.join(base, "retro_petrol_truck_1776363387309.png"), "petrol.png", (44, 95)) # making truck slightly wider and longer
