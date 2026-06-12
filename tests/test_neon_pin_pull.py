import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_neon_pin_pull():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-pin-pull-frontend/index.html"
        
        print(f"Opening Neon Pin Pull: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        # 1. Verify compliance overlay is active for first-time visits
        print("1. Verify compliance overlay is active...")
        overlay = driver.find_element(By.ID, "game-info-overlay")
        assert overlay.is_displayed(), "Compliance overlay should be visible by default"
        
        # 2. Click PLAY NOW to bypass overlay
        print("2. Clicking PLAY NOW to bypass overlay...")
        agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        agree_btn.click()
        time.sleep(0.5)
        
        # Verify overlay is hidden
        assert not overlay.is_displayed(), "Compliance overlay should be hidden after bypass"

        # 3. Check Start Screen is active
        print("3. Verify Start Menu is active...")
        start_menu = driver.find_element(By.ID, "startMenu")
        assert "hidden" not in start_menu.get_attribute("class"), "Start menu should not be hidden"

        # 4. Click PLAY button to initialize game engine
        print("4. Starting gameplay...")
        play_btn = driver.find_element(By.ID, "playBtn")
        play_btn.click()
        time.sleep(0.5)
        
        # Verify Start Menu is hidden
        assert "hidden" in start_menu.get_attribute("class"), "Start menu should be hidden after game start"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        game_state = driver.execute_script("return gameInstance.gameState;")
        level = driver.execute_script("return gameInstance.currentLevelIndex;")
        balls_count = driver.execute_script("return gameInstance.balls.length;")
        pins_count = driver.execute_script("return gameInstance.pins.length;")
        buckets_count = driver.execute_script("return gameInstance.buckets.length;")
        
        assert game_state == "PLAYING", f"Expected gameState = 'PLAYING', got '{game_state}'"
        assert level == 0, f"Expected currentLevelIndex = 0, got {level}"
        assert balls_count > 0, f"Expected level 1 to have balls, got {balls_count}"
        assert pins_count > 0, f"Expected level 1 to have pins, got {pins_count}"
        assert buckets_count > 0, f"Expected level 1 to have buckets, got {buckets_count}"
        
        print(f" -> Game engine status: Level Index={level}, Balls={balls_count}, Pins={pins_count}, Buckets={buckets_count}")

        # 6. Test interaction / pin-pull sliding mechanics
        print("6. Simulating pin pull and verifying sliding states...")
        # Get canvas location and size
        canvas = driver.find_element(By.ID, "gameCanvas")
        rect = canvas.rect
        print(f" -> Canvas rect: {rect}")
        
        # Calculate coordinates of pin1 handle cap (x=150, y=380 in game coordinates 600x800)
        cap_game_x = 150
        cap_game_y = 380
        
        # Map to client offset relative to canvas top-left
        offset_x = (cap_game_x / 600.0) * rect['width']
        offset_y = (cap_game_y / 800.0) * rect['height']
        
        # Calculate absolute viewport-relative client coordinates
        client_x = rect['x'] + (cap_game_x / 600.0) * rect['width']
        client_y = rect['y'] + (cap_game_y / 800.0) * rect['height']
        
        print(f" -> Invoking handleTap directly with viewport coordinates: ({client_x}, {client_y})")
        driver.execute_script(f"gameInstance.handleTap({client_x}, {client_y});")
        time.sleep(0.5)
        
        is_pulling = driver.execute_script("return gameInstance.pins[0].isPulling;")
        slide_offset = driver.execute_script("return gameInstance.pins[0].slideOffset;")
        print(f" -> pin0 isPulling={is_pulling}, slideOffset={slide_offset}")
        assert is_pulling or slide_offset > 0, "Pin should be pulling and have a slide offset"
        print(" -> Pin pull initiated via click and sliding state verified.")

        # 7. Test Win conditions & Success overlay
        print("7. Testing Success state and overlay triggers by completing level programmatically...")
        driver.execute_script("""
            gameInstance.balls.forEach(b => {
                b.collected = true;
            });
            gameInstance.collectedCount = gameInstance.balls.length;
            // tick update loop
            gameInstance.update(1.0);
        """)
        time.sleep(1.2)
        
        success_menu = driver.find_element(By.ID, "successMenu")
        assert "hidden" not in success_menu.get_attribute("class"), "Success menu should be visible on win"
        assert driver.execute_script("return gameInstance.gameState;") == "SUCCESS"
        print(" -> Level successfully completed! Victory validated.")

        print("All automated Neon Pin Pull tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        print("Browser Console Logs:")
        for entry in driver.get_log('browser'):
            print(entry)
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_pin_pull()
