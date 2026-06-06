import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_level14():
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

        # Bypass compliance overlay
        agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        agree_btn.click()
        time.sleep(0.5)
        
        # Set localStorage to unlock all levels
        print("Setting localStorage to unlock all levels...")
        driver.execute_script("localStorage.setItem('neon_arrows_level', '13');")
        
        # Click INITIALIZE to open Level Select
        start_btn = driver.find_element(By.ID, "start-btn")
        start_btn.click()
        time.sleep(0.5)
        
        # Refresh the level select screen to make sure it picks up the local storage value
        # Actually, let's see: the level select screen buttons are created dynamically inside showLevelSelect.
        # So it will pick it up on click!
        level_btns = driver.find_elements(By.CSS_SELECTOR, ".level-btn")
        print(f"Clicking Level 14 button (total buttons: {len(level_btns)})...")
        level_btns[13].click()
        time.sleep(0.5)
        
        # Verify level index
        level = driver.execute_script("return currentLevelIndex;")
        print(f"Current Level Index: {level + 1}")
        assert level == 13, f"Expected level index 13, got {level}"
        
        # We will simulate clicking the lines in the correct order:
        # ['L2', 'L1', 'L5', 'L4', 'L3', 'L9', 'L8', 'L7', 'L6']
        correct_sequence = ['L2', 'L1', 'L5', 'L4', 'L3', 'L9', 'L8', 'L7', 'L6']
        
        for move in correct_sequence:
            # Check blocking status
            line_status = driver.execute_script(f"""
                const line = activeLines.find(l => l.id === '{move}');
                if (!line) return "NOT_FOUND";
                const result = isLineBlocked(line, activeLines);
                return {{
                    id: line.id,
                    color: line.color,
                    state: line.state,
                    blocked: result.blocked,
                    blocked_by: result.blocked ? result.by.id : null
                }};
            """)
            print(f"Line status for {move}: {line_status}")
            
            if line_status == "NOT_FOUND":
                raise Exception(f"Line {move} not found in activeLines!")
                
            if line_status['blocked']:
                raise Exception(f"Line {move} is blocked by {line_status['blocked_by']}! Expected clear!")
                
            # Trigger click / slide
            print(f" -> Sliding line {move}...")
            driver.execute_script(f"""
                const line = activeLines.find(l => l.id === '{move}');
                line.state = 'sliding';
                movesCount++;
                document.getElementById('moves-value').textContent = movesCount;
            """)
            
            # Wait for the line to slide out completely and get marked as completed
            # Line sliding takes a few frames. Let's poll for state === 'completed'.
            success = False
            for _ in range(30): # up to 3 seconds
                state = driver.execute_script(f"""
                    const line = activeLines.find(l => l.id === '{move}');
                    return line ? line.state : 'completed';
                """)
                if state == 'completed':
                    success = True
                    break
                time.sleep(0.1)
                
            if not success:
                raise Exception(f"Line {move} failed to exit within time limit! Current state: {state}")
            print(f" -> Line {move} successfully completed and removed from check list.")
            
        print("Level 14 successfully cleared in the correct move sequence!")
        print("SUCCESS: Both purple arrows (L4 and L8) moved and exited without issues!")

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
    test_level14()
