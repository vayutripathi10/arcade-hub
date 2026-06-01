import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_neon_bolts():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-bolts-frontend/index.html"
        
        print(f"Opening Neon Screws & Bolts: {file_path}")
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
        print("3. Verify Start Screen is active...")
        start_screen = driver.find_element(By.ID, "start-screen")
        assert "active" in start_screen.get_attribute("class"), "Start screen should be active"

        # 4. Click PLAY button to initialize game engine
        print("4. Starting gameplay...")
        start_play_btn = driver.find_element(By.ID, "start-play-btn")
        start_play_btn.click()
        time.sleep(0.5)
        
        # Verify Start Screen is hidden
        assert "active" not in start_screen.get_attribute("class"), "Start screen should be inactive after game start"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        game_state = driver.execute_script("return gameInstance.gameState;")
        level = driver.execute_script("return gameInstance.level;")
        holes_count = driver.execute_script("return gameInstance.holes.length;")
        screws_count = driver.execute_script("return gameInstance.screws.length;")
        plates_count = driver.execute_script("return gameInstance.plates.length;")
        
        assert game_state == "PLAYING", f"Expected gameState = 'PLAYING', got '{game_state}'"
        assert level == 1, f"Expected Level = 1, got {level}"
        assert holes_count == 3, f"Expected 3 holes in level 1, got {holes_count}"
        assert screws_count == 2, f"Expected 2 screws in level 1, got {screws_count}"
        assert plates_count == 1, f"Expected 1 plate in level 1, got {plates_count}"
        
        print(f" -> Game engine status: Level={level}, Holes={holes_count}, Screws={screws_count}, Plates={plates_count}")

        # 6. Test interaction / move mechanics
        print("6. Simulating screw move manipulation...")
        # Artificially select a screw and shift it to the empty hole (hole index 2)
        driver.execute_script("""
            gameInstance.selectedScrew = gameInstance.screws[0];
            gameInstance.selectedScrew.holeId = 2;
            gameInstance.syncScrewsToHoles();
            gameInstance.selectedScrew = null;
            gameInstance.moves++;
            gameInstance.updateHUD();
        """)
        time.sleep(0.3)
        
        moves = driver.execute_script("return gameInstance.moves;")
        hud_moves = driver.find_element(By.ID, "hud-moves-val").text
        assert moves == 1, f"Expected moves = 1, got {moves}"
        assert hud_moves == "1", f"Expected HUD Moves = '1', got '{hud_moves}'"
        print(" -> Screw successfully shifted. Moves counter synced to HUD.")

        # 7. Test Win triggers & Victory overlay
        print("7. Testing Victory state and overlay triggers...")
        # Trigger level clear success screen
        driver.execute_script("gameInstance.triggerWin();")
        time.sleep(0.5)
        
        success_screen = driver.find_element(By.ID, "success-screen")
        assert "active" in success_screen.get_attribute("class"), "Success screen should be active on win"
        assert driver.execute_script("return gameInstance.gameState;") == "SUCCESS"
        
        # Verify success HUD overlays
        success_level_txt = driver.find_element(By.ID, "success-level-val").text
        success_moves_txt = driver.find_element(By.ID, "success-moves-val").text
        assert success_level_txt == "1", f"Expected success level = '1', got '{success_level_txt}'"
        assert success_moves_txt == "1", f"Expected success moves = '1', got '{success_moves_txt}'"
        
        print("All automated Neon Screws & Bolts tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        print("Browser Console Logs:")
        for entry in driver.get_log('browser'):
            print(entry)
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_bolts()
