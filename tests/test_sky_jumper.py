import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_sky_jumper():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/sky-jumper-frontend/index.html"
        
        print(f"Opening: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        print("1. Testing Start Screen...")
        start_screen = driver.find_element(By.ID, "screen-start")
        assert "hidden" not in start_screen.get_attribute("class")
        
        # Bypass pre-game compliance overlay
        print("1b. Bypassing pre-game compliance overlay...")
        overlay = driver.find_element(By.ID, "game-info-overlay")
        if overlay.is_displayed():
            agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
            agree_btn.click()
            time.sleep(0.5)
            
        print("2. Starting Game...")
        start_btn = driver.find_element(By.ID, "btn-start")
        start_btn.click()
        time.sleep(0.5)
        assert "hidden" in start_screen.get_attribute("class")
        
        game_state = driver.execute_script("return gameState;")
        assert game_state == "PLAYING", f"Expected PLAYING, got {game_state}"
        
        print("3. Testing Jump via JS Input...")
        # Simulate jump key
        driver.execute_script("player.jump();")
        time.sleep(0.5)
        
        print("4. Testing Pause/Resume...")
        pause_btn = driver.find_element(By.ID, "btn-pause")
        pause_btn.click()
        time.sleep(0.5)
        
        pause_screen = driver.find_element(By.ID, "screen-pause")
        assert "hidden" not in pause_screen.get_attribute("class")
        assert driver.execute_script("return gameState;") == "PAUSED"
        
        resume_btn = driver.find_element(By.ID, "btn-resume")
        resume_btn.click()
        time.sleep(0.5)
        assert "hidden" in pause_screen.get_attribute("class")
        assert driver.execute_script("return gameState;") == "PLAYING"
        
        print("5. Triggering Game Over...")
        # Drop the player to their death
        driver.execute_script("player.y = 99999;")
        time.sleep(1)
        
        game_over_screen = driver.find_element(By.ID, "screen-gameover")
        assert "hidden" not in game_over_screen.get_attribute("class")
        assert driver.execute_script("return gameState;") == "GAMEOVER"
        
        print("All automated tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        print("Browser Console Logs:")
        for entry in driver.get_log('browser'):
            print(entry)
    finally:
        time.sleep(1)
        driver.quit()

if __name__ == "__main__":
    test_sky_jumper()
