import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_neon_cypher():
    # Setup Chrome WebDriver in headless mode
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
        file_path = f"file:///{parent_dir}/neon-cypher-frontend/index.html"
        
        print(f"Opening Neon Cypher: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        print("1. Verify AdSense Compliance Description Overlay is active for first-time visits...")
        overlay = driver.find_element(By.ID, "game-info-overlay")
        assert overlay.is_displayed(), "Description compliance overlay is not visible initially!"
        
        print("2. Click PLAY NOW to enter the game...")
        agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        agree_btn.click()
        
        time.sleep(0.5)
        assert "hidden" in overlay.get_attribute("class") or not overlay.is_displayed() or "show-info-overlay" not in driver.find_element(By.TAG_NAME, "body").get_attribute("class"), "Compliance overlay did not hide!"
        print("Compliance bypassed successfully!")

        print("3. Verify Decryption Manual Help Modal is displayed on first launch...")
        help_modal = driver.find_element(By.ID, "instructions-modal")
        assert help_modal.is_displayed() or "hidden" not in help_modal.get_attribute("class")
        
        print("4. Close Manual Modal via ENGAGE HACK button...")
        start_btn = driver.find_element(By.ID, "instructions-start-btn")
        start_btn.click()
        
        time.sleep(0.5)
        assert "hidden" in help_modal.get_attribute("class")
        print("Manual closed successfully!")

        print("5. Verify Game Mode default structure (Daily Mode)...")
        active_badge = driver.find_element(By.ID, "active-mode-badge")
        badge_text = active_badge.get_attribute("textContent")
        print(f"Active badge textContent: '{badge_text}'")
        assert "DAILY" in badge_text, f"Expected DAILY in badge text, got '{badge_text}'"
        
        # Access JS properties to confirm initial state
        mode = driver.execute_script("return gameState.mode;")
        secret = driver.execute_script("return gameState.secretWord;")
        status = driver.execute_script("return gameState.gameStatus;")
        
        assert mode == "daily", f"Expected daily mode, got {mode}"
        assert status == "playing", f"Expected status playing, got {status}"
        assert len(secret) == 5, f"Secret word length is incorrect: {secret}"
        print(f"Daily mode confirmed! Secret passcode: {secret}")

        print("6. Simulating physical typing inputs to matrix grid...")
        # Simulate typing 5 letters into row 0 (e.g. 'A', 'B', 'C', 'O', 'U' or similar)
        # We can trigger it by dispatching keydown events or typing to document body
        body = driver.find_element(By.TAG_NAME, "body")
        
        body.send_keys("A")
        time.sleep(0.1)
        body.send_keys("B")
        time.sleep(0.1)
        body.send_keys("C")
        time.sleep(0.1)
        
        # Verify letters appeared on tiles
        tile_0_0 = driver.find_element(By.ID, "tile-0-0")
        tile_0_1 = driver.find_element(By.ID, "tile-0-1")
        tile_0_2 = driver.find_element(By.ID, "tile-0-2")
        
        assert tile_0_0.text == "A", f"Expected 'A', got {tile_0_0.text}"
        assert tile_0_1.text == "B", f"Expected 'B', got {tile_0_1.text}"
        assert tile_0_2.text == "C", f"Expected 'C', got {tile_0_2.text}"
        print("Letters typed correctly to board matrix grid!")

        print("7. Test backspace key clears letters...")
        body.send_keys("\ue003") # Selenium Backspace Key code
        time.sleep(0.1)
        assert tile_0_2.text == "", "Tile 0-2 did not clear after backspace!"
        print("Backspace cleared correctly!")

        print("8. Testing Mode Toggle (Switching to Practice Hack Mode)...")
        practice_btn = driver.find_element(By.ID, "mode-practice-btn")
        practice_btn.click()
        
        time.sleep(0.5)
        
        new_mode = driver.execute_script("return gameState.mode;")
        new_secret = driver.execute_script("return gameState.secretWord;")
        new_row = driver.execute_script("return gameState.currentRow;")
        new_col = driver.execute_script("return gameState.currentCol;")
        
        assert new_mode == "practice", f"Expected practice mode, got {new_mode}"
        assert new_row == 0
        assert new_col == 0
        assert len(new_secret) == 5
        assert "PRACTICE" in active_badge.text
        print(f"Successfully toggled to Practice Mode! Secret passcode: {new_secret}")

        print("9. Checking help triggers click re-opening manual...")
        help_btn = document_btn = driver.find_element(By.ID, "help-trigger-btn")
        help_btn.click()
        time.sleep(0.3)
        assert help_modal.is_displayed() or "hidden" not in help_modal.get_attribute("class")
        
        close_help_btn = driver.find_element(By.ID, "instructions-close-btn")
        close_help_btn.click()
        time.sleep(0.3)
        assert "hidden" in help_modal.get_attribute("class")
        print("Help trigger re-opened and closed manual successfully!")

        print("All automated Neon Cypher tests passed successfully!")

    except Exception as e:
        print("BROWSER CONSOLE LOGS ON FAILURE:")
        try:
            for entry in driver.get_log('browser'):
                print(entry)
        except Exception as log_err:
            print(f"Could not retrieve logs: {log_err}")
        print(f"Test failed: {e}")
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_cypher()
