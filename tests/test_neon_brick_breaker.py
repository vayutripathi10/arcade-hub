import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_neon_brick_breaker():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-brick-breaker-frontend/index.html"
        
        print(f"Opening Neon Brick Breaker: {file_path}")
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
        main_menu = driver.find_element(By.ID, "mainMenu")
        assert "hidden" not in main_menu.get_attribute("class"), "Main menu should be visible"

        # 4. Click START GAME button to initialize game engine
        print("4. Starting gameplay...")
        start_btn = driver.find_element(By.ID, "btn-start")
        start_btn.click()
        time.sleep(0.5)
        
        # Verify Main Menu is hidden
        assert "hidden" in main_menu.get_attribute("class"), "Main menu should be hidden after initialization"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        gamestate = driver.execute_script("return gameState;")
        ball_count = driver.execute_script("return balls.length;")
        bricks_count = driver.execute_script("return bricks.length;")
        score_val = driver.execute_script("return score;")
        lives_val = driver.execute_script("return lives;")
        
        assert gamestate == "playing", f"Expected gameState = 'playing', got {gamestate}"
        assert ball_count == 1, f"Expected 1 ball at start, got {ball_count}"
        assert bricks_count > 0, f"Expected active bricks grid, got {bricks_count}"
        assert score_val == 0, f"Expected starting score 0, got {score_val}"
        assert lives_val == 3, f"Expected starting lives 3, got {lives_val}"
        
        print(f" -> Game engine status: gameState={gamestate}, Balls={ball_count}, Bricks={bricks_count}, Lives={lives_val}")

        print("All automated Neon Brick Breaker tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_brick_breaker()
