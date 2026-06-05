import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_neon_invaders():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-invaders-frontend/index.html"
        
        print(f"Opening Neon Invaders: {file_path}")
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

        # 3. Check Start Screen is active
        print("3. Verify Start Screen is active...")
        start_screen = driver.find_element(By.ID, "start-screen")
        assert "hidden" not in start_screen.get_attribute("class"), "Start screen should be visible"

        # 4. Click PLAY button to initialize game engine
        print("4. Starting gameplay...")
        start_btn = driver.find_element(By.ID, "btn-start")
        start_btn.click()
        time.sleep(0.5)
        
        # Verify Start Screen is hidden
        assert "hidden" in start_screen.get_attribute("class"), "Start screen should be hidden after initialization"
        
        # 5. Check game engine states via Javascript execution
        print("5. Verifying Javascript game states...")
        gamestate = driver.execute_script("return gameState;")
        invaders_count = driver.execute_script("return invaders.length;")
        shields_count = driver.execute_script("return shields.length;")
        initial_invaders_count = driver.execute_script("return initialInvadersCount;")
        player_lives = driver.execute_script("return player.lives;")
        
        canvas_height = driver.execute_script("return canvas.height;")
        if canvas_height < 400:
            expected_rows = 3
        elif canvas_height < 550:
            expected_rows = 4
        elif canvas_height < 700:
            expected_rows = 5
        elif canvas_height < 850:
            expected_rows = 6
        else:
            expected_rows = 7
        expected_cols = 8 # desktop width >= 500
        expected_invaders = expected_rows * expected_cols

        assert gamestate == "PLAYING", f"Expected gameState = 'PLAYING', got {gamestate}"
        assert invaders_count == expected_invaders, f"Expected {expected_invaders} invaders ({expected_rows} rows x {expected_cols} cols), got {invaders_count}"
        assert shields_count == 4, f"Expected 4 shields on desktop, got {shields_count}"
        assert initial_invaders_count == expected_invaders, f"Expected initialInvadersCount = {expected_invaders}, got {initial_invaders_count}"
        is_mobile = driver.execute_script("return window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);")
        expected_lives = 4 if is_mobile else 3
        assert player_lives == expected_lives, f"Expected {expected_lives} lives, got {player_lives}"
        
        print(f" -> Game engine status: gameState={gamestate}, Invaders={invaders_count}, Shields={shields_count}, InitialCount={initial_invaders_count}, Lives={player_lives}")

        # 6. Test interaction / firing
        print("6. Simulating player bullet shoot...")
        bullets_before = driver.execute_script("return bullets.length;")
        driver.execute_script("firePlayer();")
        time.sleep(0.1)
        bullets_after = driver.execute_script("return bullets.length;")
        assert bullets_after > bullets_before, f"Expected bullet count to increase, went from {bullets_before} to {bullets_after}"
        print(" -> Bullet shooting registered in game loops.")

        print("All automated Neon Invaders tests passed successfully!")

    except Exception as e:
        import traceback
        print(f"Test failed: {e}")
        traceback.print_exc()
        raise e
    finally:
        driver.quit()

if __name__ == "__main__":
    test_neon_invaders()
