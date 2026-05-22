import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_retro_racer():
    # Setup Chrome WebDriver in headless mode
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    driver = webdriver.Chrome(options=options)
    
    try:
        # Get the absolute path to the local HTML file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/retro-racer-frontend/index.html"
        
        print(f"Opening: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        print("1. Verify Compliance Overlay is active for first-time visits...")
        overlay = driver.find_element(By.ID, "game-info-overlay")
        assert overlay.is_displayed() or "show-info-overlay" in driver.find_element(By.TAG_NAME, "body").get_attribute("class")
        
        print("2. Click PLAY NOW to bypass compliance...")
        play_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        play_btn.click()
        
        print("3. Waiting for game to start playing (directly or after assets load)...")
        # Since clicking PLAY NOW invokes initGame(), the game goes directly into the race (playing state).
        success = False
        for _ in range(25):
            time.sleep(0.2)
            game_state = driver.execute_script("return gameState;")
            if game_state == "playing":
                success = True
                break
        
        assert success, f"Game failed to start playing after clicking PLAY NOW! gameState: {driver.execute_script('return gameState;')}"
        print("Game is now successfully playing!")
        
        print("4. Verify Main Menu is hidden while playing...")
        main_menu = driver.find_element(By.ID, "mainMenu")
        assert "hidden" in main_menu.get_attribute("class")
        
        print("5. Testing Pause functionality...")
        pause_btn = driver.find_element(By.ID, "btn-pause")
        pause_btn.click()
        
        time.sleep(0.5)
        pause_menu = driver.find_element(By.ID, "pauseMenu")
        assert "hidden" not in pause_menu.get_attribute("class")
        
        game_state = driver.execute_script("return gameState;")
        assert game_state == "paused", f"Expected paused, got {game_state}"
        
        print("6. Testing Quit-to-Menu functionality from Pause screen...")
        quit_btn = driver.find_element(By.ID, "btn-quit")
        quit_btn.click()
        
        time.sleep(0.5)
        # Verify we are in the main menu now
        assert "hidden" not in main_menu.get_attribute("class")
        assert "hidden" in pause_menu.get_attribute("class")
        game_state = driver.execute_script("return gameState;")
        assert game_state == "menu", f"Expected menu, got {game_state}"
        print("Successfully quit to Main Menu!")
        
        print("7. Testing Start Game from Main Menu...")
        start_btn = driver.find_element(By.ID, "btn-start")
        start_btn.click()
        
        time.sleep(0.5)
        game_state = driver.execute_script("return gameState;")
        assert game_state == "playing", f"Expected playing, got {game_state}"
        assert "hidden" in main_menu.get_attribute("class")
        print("Successfully started game from Main Menu!")
        
        print("8. Testing Returning Player Flow...")
        # Inject the 'seen' key into localStorage to simulate a returning player
        driver.execute_script("localStorage.setItem('arcade_seen_retro-racer', '1');")
        
        # Reload the page
        driver.refresh()
        
        print("9. Waiting for automatic start for returning player...")
        # Since it is a returning player, it should bypass overlay and automatically call initGame().
        success = False
        for _ in range(25):
            time.sleep(0.2)
            game_state = driver.execute_script("return gameState;")
            if game_state == "playing":
                success = True
                break
        
        assert success, f"Returning player got stuck! Current gameState: {driver.execute_script('return gameState;')}"
        print("Returning player successfully bypassed overlay and started the game directly without freezing!")

        print("All automated Retro Racer tests passed successfully!")

    except Exception as e:
        print(f"Test failed: {e}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_retro_racer()
