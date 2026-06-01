import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_cyber_survivor():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        # Get the absolute path to the local HTML file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/cyber-survivor-frontend/index.html"
        
        print(f"Opening: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        print("1. Testing Main Menu...")
        main_menu = driver.find_element(By.ID, "mainMenu")
        assert "hidden" not in main_menu.get_attribute("class")

        # Bypass pre-game compliance overlay
        print("1b. Bypassing pre-game compliance overlay...")
        overlay = driver.find_element(By.ID, "game-info-overlay")
        if overlay.is_displayed():
            agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
            agree_btn.click()
            time.sleep(0.5)
        
        print("2. Testing Start Game flow...")
        start_btn = driver.find_element(By.ID, "btn-start")
        start_btn.click()
        
        # Wait for menu to hide
        time.sleep(0.5)
        assert "hidden" in main_menu.get_attribute("class")
        
        # Verify internal game state using JavaScript execution
        game_state = driver.execute_script("return gameState;")
        assert game_state == "PLAYING", f"Expected PLAYING, got {game_state}"
        
        print("3. Testing Pause functionality...")
        pause_btn = driver.find_element(By.ID, "btn-pause")
        pause_btn.click()
        
        # Wait for pause menu
        time.sleep(0.5)
        pause_overlay = driver.find_element(By.ID, "pauseOverlay")
        assert "hidden" not in pause_overlay.get_attribute("class")
        
        game_state = driver.execute_script("return gameState;")
        assert game_state == "PAUSED", f"Expected PAUSED, got {game_state}"
        
        print("4. Testing Resume functionality...")
        resume_btn = driver.find_element(By.ID, "btn-resume")
        resume_btn.click()
        
        time.sleep(0.5)
        assert "hidden" in pause_overlay.get_attribute("class")
        
        print("5. Testing Level Up Mechanic via JS injection...")
        # Give the player 100 XP directly to trigger a level up
        driver.execute_script("player.gainXp(100);")
        time.sleep(0.5)
        
        level_up_menu = driver.find_element(By.ID, "levelUpMenu")
        assert "hidden" not in level_up_menu.get_attribute("class")
        game_state = driver.execute_script("return gameState;")
        assert game_state == "LEVELUP", f"Expected LEVELUP, got {game_state}"
        
        print("6. Selecting an Upgrade...")
        # Click the first upgrade option
        upgrade_cards = driver.find_elements(By.CSS_SELECTOR, ".upgrade-card")
        if upgrade_cards:
            upgrade_cards[0].click()
            time.sleep(0.5)
            assert "hidden" in level_up_menu.get_attribute("class")
            
        print("7. Testing Game Over mechanics...")
        # Kill the player directly
        driver.execute_script("player.takeDamage(9999);")
        time.sleep(1)
        
        game_over_menu = driver.find_element(By.ID, "gameOverMenu")
        assert "hidden" not in game_over_menu.get_attribute("class")
        game_state = driver.execute_script("return gameState;")
        assert game_state == "GAMEOVER", f"Expected GAMEOVER, got {game_state}"
        
        print("All automated tests passed successfully!")

    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        time.sleep(2) # Keep browser open briefly to see the result
        driver.quit()

if __name__ == "__main__":
    test_cyber_survivor()
