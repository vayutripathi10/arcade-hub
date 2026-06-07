import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_space_shooter():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/space-shooter-frontend/index.html"
        
        print(f"Opening Space Shooter: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        # 1. Verify compliance overlay is active
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

        # 3. Check Start Screen (Main Menu) is active
        print("3. Verify Main Menu is active...")
        start_overlay = driver.find_element(By.ID, "overlay")
        assert "hidden" not in start_overlay.get_attribute("class"), "Start overlay should be visible"

        # 4. Click Launch Mission button to start the game
        print("4. Starting gameplay...")
        start_btn = driver.find_element(By.ID, "startBtn")
        start_btn.click()
        time.sleep(0.5)
        
        # Verify Start Menu is hidden
        assert "hidden" in start_overlay.get_attribute("class"), "Start overlay should be hidden after initialization"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        game_running = driver.execute_script("return gameRunning;")
        score_val = driver.execute_script("return score;")
        lives_val = driver.execute_script("return player.lives;")
        weapon_tier = driver.execute_script("return player.weaponTier;")
        
        assert game_running is True, f"Expected gameRunning = True, got {game_running}"
        assert score_val == 0, f"Expected starting score 0, got {score_val}"
        assert lives_val == 3, f"Expected starting lives 3, got {lives_val}"
        assert weapon_tier == 1, f"Expected starting weapon tier 1, got {weapon_tier}"
        
        print(f" -> Game engine status: gameRunning={game_running}, Score={score_val}, Lives={lives_val}, WeaponTier={weapon_tier}")

        print("All automated Space Shooter tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        try:
            print("Browser console logs:")
            for entry in driver.get_log('browser'):
                print(entry)
        except Exception as log_err:
            print(f"Could not retrieve browser logs: {log_err}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_space_shooter()
