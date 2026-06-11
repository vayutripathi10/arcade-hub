import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_neon_arrows():
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
        start_btn = driver.find_element(By.ID, "start-btn")
        start_btn.click()
        time.sleep(0.5)
        
        # Verify Start Screen is hidden
        assert "active" not in start_screen.get_attribute("class"), "Start screen should be inactive after game start"
        
        # 4b. Verify Level Select Screen is active and click Level 1
        print("4b. Verifying Level Select screen and selecting Level 1...")
        level_select_screen = driver.find_element(By.ID, "level-select-screen")
        assert "active" in level_select_screen.get_attribute("class"), "Level select screen should be active"
        
        level_btns = driver.find_elements(By.CSS_SELECTOR, ".level-btn")
        assert len(level_btns) == 20, f"Expected 20 level buttons, got {len(level_btns)}"
        
        # Click first level button (Level 1)
        level_btns[0].click()
        time.sleep(0.5)
        
        assert "active" not in level_select_screen.get_attribute("class"), "Level select screen should be hidden after selecting a level"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        level = driver.execute_script("return currentLevelIndex;")
        blocks_count = driver.execute_script("return activeBlocks.length;")
        
        assert level == 0, f"Expected Level Index = 0, got {level}"
        assert blocks_count == 5, f"Expected 5 blocks in level 1, got {blocks_count}"
        
        print(f" -> Game engine status: LevelIndex={level}, BlocksCount={blocks_count}")

        # 6. Test interaction / slide triggers
        print("6. Simulating a correct block slide...")
        driver.execute_script("""
            const clearBlock = activeBlocks.find(b => !isBlockBlocked(b, activeBlocks));
            if (clearBlock) {
                clearBlock.state = 'sliding';
            }
        """)
        time.sleep(0.2)
        print(" -> Block triggered sliding.")

        # 7. Test Win triggers & Victory overlay
        print("7. Testing Level Complete trigger...")
        driver.execute_script("""
            activeBlocks.forEach(b => b.state = 'completed');
            checkVictory();
        """)
        time.sleep(0.8)
        
        complete_screen = driver.find_element(By.ID, "complete-screen")
        assert "active" in complete_screen.get_attribute("class"), "Complete screen should be active on win"
        print(" -> Level completion validated.")

        print("All automated Neon Arrows tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        print("Browser Console Logs:")
        try:
            for entry in driver.get_log('browser'):
                print(entry)
        except Exception:
            pass
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_arrows()
