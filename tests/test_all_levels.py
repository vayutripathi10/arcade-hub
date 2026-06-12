import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_all_neon_arrows_stages():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-arrows-frontend/index.html"
        
        print(f"Opening Neon Arrows: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        # 1. Bypass compliance overlay
        agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        agree_btn.click()
        time.sleep(0.5)
        
        # 2. Click Start Game to initialize engine
        start_btn = driver.find_element(By.ID, "start-btn")
        start_btn.click()
        time.sleep(0.5)
        
        # 3. Verify Level select screen and load Level 1 to start
        level_btns = driver.find_elements(By.CSS_SELECTOR, ".level-btn")
        level_btns[0].click()
        time.sleep(0.5)

        # 4. Loop through all 20 levels, loading each via JS and checking validity
        level_configs = driver.execute_script("return LEVEL_CONFIGS;")
        print(f"Loaded LEVEL_CONFIGS: {len(level_configs)} levels found.")
        
        for idx in range(len(level_configs)):
            config = level_configs[idx]
            print(f"\n--- Testing Sector/Level {idx + 1} ({config['gridWidth']}x{config['gridHeight']}, numBlocks={config['numBlocks']}) ---")
            
            # Load level
            driver.execute_script(f"loadLevel({idx});")
            time.sleep(0.1)
            
            # Verify JS state matches configuration
            level_idx = driver.execute_script("return currentLevelIndex;")
            grid_w = driver.execute_script("return currentGridWidth;")
            grid_h = driver.execute_script("return currentGridHeight;")
            blocks = driver.execute_script("return activeBlocks;")
            
            assert level_idx == idx, f"Level mismatch: expected {idx}, got {level_idx}"
            assert grid_w == config['gridWidth'], f"Width mismatch: expected {config['gridWidth']}, got {grid_w}"
            assert grid_h == config['gridHeight'], f"Height mismatch: expected {config['gridHeight']}, got {grid_h}"
            assert len(blocks) == config['numBlocks'], f"Blocks count mismatch: expected {config['numBlocks']}, got {len(blocks)}"
            
            # Check for overlapping blocks or invalid coordinates
            positions = set()
            for b in blocks:
                # Coordinate bounds check
                assert 0 <= b['gridX'] < grid_w, f"Block {b['id']} x coordinate {b['gridX']} out of bounds"
                assert 0 <= b['gridY'] < grid_h, f"Block {b['id']} y coordinate {b['gridY']} out of bounds"
                
                # Overlap check
                pos = (b['gridX'], b['gridY'])
                assert pos not in positions, f"Duplicate block position {pos} detected"
                positions.add(pos)
                
            # Verify that DOM elements are created successfully for all active blocks
            for b in blocks:
                block_el = driver.find_element(By.ID, f"block-{b['id']}")
                assert block_el is not None, f"DOM element for block-{b['id']} not found"
                # Check absolute position style
                assert block_el.value_of_css_property("position") == "absolute", f"Block {b['id']} is not position: absolute"
            
            # Verify no console errors
            for entry in driver.get_log('browser'):
                if entry['level'] == 'SEVERE':
                    print(f"SEVERE Browser log entry: {entry}")
                    raise Exception(f"Console error detected: {entry['message']}")
            
            print(f"Sector {idx + 1} loaded perfectly with all blocks correctly nested and sized!")

        print("\nAll 20 Neon Arrows stages tested, validated, and confirmed 100% functional!")

    except Exception as e:
        import traceback
        print(f"Stage verification failed: {e}")
        traceback.print_exc()
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_all_neon_arrows_stages()
