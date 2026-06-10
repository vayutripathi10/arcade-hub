import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_neon_brawler():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    driver = webdriver.Chrome(options=options)
    
    try:
        # Get the absolute path to the local HTML file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = f"file:///{parent_dir}/neon-brawler-frontend/index.html"
        
        print(f"Opening: {file_path}")
        driver.get(file_path)
        
        wait = WebDriverWait(driver, 5)

        print("1. Testing Pre-game Info Overlay...")
        # Bypass pre-game compliance overlay
        overlay = driver.find_element(By.ID, "game-info-overlay")
        assert overlay.is_displayed()
        
        agree_btn = driver.find_element(By.CSS_SELECTOR, ".continue-game-btn")
        agree_btn.click()
        time.sleep(0.5)
        
        # Verify body no longer has show-info-overlay class
        body = driver.find_element(By.TAG_NAME, "body")
        assert "show-info-overlay" not in body.get_attribute("class")

        print("2. Verifying game is auto-started by continueToGame()...")
        # Verify overlay start menu is now hidden
        menu = driver.find_element(By.ID, "overlay")
        assert "hidden" in menu.get_attribute("class")
        
        # Verify internal game state using JavaScript execution
        game_running = driver.execute_script("return gameRunning;")
        assert game_running == True, f"Expected gameRunning to be True, got {game_running}"
        
        print("3. Testing Pause functionality...")
        pause_btn = driver.find_element(By.ID, "pauseBtnHUD")
        pause_btn.click()
        
        # Wait for pause menu
        time.sleep(0.5)
        pause_menu = driver.find_element(By.ID, "pauseMenu")
        assert "hidden" not in pause_menu.get_attribute("class")
        
        is_paused = driver.execute_script("return isPaused;")
        assert is_paused == True, f"Expected isPaused to be True, got {is_paused}"
        
        print("4. Testing Resume functionality...")
        resume_btn = driver.find_element(By.ID, "btn-resume")
        resume_btn.click()
        
        time.sleep(0.5)
        assert "hidden" in pause_menu.get_attribute("class")
        
        is_paused = driver.execute_script("return isPaused;")
        assert is_paused == False, f"Expected isPaused to be False, got {is_paused}"
        
        print("5. Verify custom entities generation/environment...")
        # Check that stars, clouds, windLines are generated
        num_stars = driver.execute_script("return stars.length;")
        num_clouds = driver.execute_script("return clouds.length;")
        num_wind_lines = driver.execute_script("return windLines.length;")
        print(f"Stars: {num_stars}, Clouds: {num_clouds}, Wind Lines: {num_wind_lines}")
        assert num_stars > 0
        assert num_clouds > 0
        assert num_wind_lines > 0

        print("5b. Testing Auto-Berserk Mode streak trigger...")
        # Increment comboStreak and trigger defeatEnemy to hit Berserk limit
        driver.execute_script("""
            comboStreak = 14;
            defeatEnemy({ dead: false, x: 100, y: 100, hp: 1, type: 'basic', side: 'left' }, 'left');
        """)
        berserk_active = driver.execute_script("return berserkTimer > 0;")
        hit_range = driver.execute_script("return HIT_RANGE;")
        print(f"Berserk Active: {berserk_active}, Hit Range: {hit_range}")
        assert berserk_active == True, "Expected Berserk Mode to be active"
        assert hit_range == 280, f"Expected HIT_RANGE to be 280, got {hit_range}"

        print("5c. Testing Dropped Weapons chest pickup...")
        # Spawn weapon chest, set it to the ground level, align player position, and run update
        driver.execute_script("""
            spawnWeaponDrop();
            weaponDropY = getBasePlayerY() + 15;
            player.x = weaponDropX;
            update(1.0);
        """)
        active_weapon = driver.execute_script("return activeWeapon;")
        weapon_charges = driver.execute_script("return weaponCharges;")
        print(f"Active Weapon: {active_weapon}, Charges: {weapon_charges}")
        assert active_weapon in ['katana', 'laserstaff'], f"Expected katana or laserstaff, got {active_weapon}"
        assert weapon_charges == 15, f"Expected 15 charges, got {weapon_charges}"

        print("5d. Testing Combo Finisher crescent moon wave...")
        # Attack three times consecutively to trigger crescent wave
        driver.execute_script("""
            crescentWaves = [];
            attack('left');
            attack('left');
            attack('left');
        """)
        num_crescents = driver.execute_script("return crescentWaves.length;")
        print(f"Crescent Waves Spawned: {num_crescents}")
        assert num_crescents > 0, f"Expected crescent Waves to be spawned, got {num_crescents}"

        print("5e. Testing Dragon Boss trigger and state...")
        driver.execute_script("kills = 50; triggerDragonBoss();")
        boss_active = driver.execute_script("return bossActive;")
        boss_max_health = driver.execute_script("return boss.maxHealth;")
        print(f"Boss Active: {boss_active}, Max Health: {boss_max_health}")
        assert boss_active == True, "Expected bossActive to be True"
        assert boss_max_health == 10, f"Expected Dragon boss maxHealth to be 10, got {boss_max_health}"

        print("6. Testing Game Over mechanics...")
        # Call gameOver() directly
        driver.execute_script("gameOver();")
        time.sleep(1)
        
        game_running = driver.execute_script("return gameRunning;")
        assert game_running == False, f"Expected gameRunning to be False, got {game_running}"
        assert "hidden" not in menu.get_attribute("class")
        
        print("7. Testing Restart from Game Over menu...")
        start_btn = driver.find_element(By.ID, "startBtn")
        start_btn_text = driver.execute_script("return document.getElementById('startBtn').textContent;")
        print(f"Button text: {start_btn_text}")
        assert "Fight Again" in start_btn_text, f"Expected Fight Again text, got: {start_btn_text}"
        driver.execute_script("document.getElementById('startBtn').click();")
        
        time.sleep(0.5)
        actual_class = menu.get_attribute("class")
        print(f"Overlay class after restart click: {actual_class}")
        assert "hidden" in actual_class, f"Expected hidden in overlay class, got: {actual_class}"
        game_running = driver.execute_script("return gameRunning;")
        assert game_running == True, f"Expected gameRunning to be True, got {game_running}"

        print("All Neon Brawler automated tests passed successfully!")

    except Exception as e:
        print(f"Test failed: {e}")
        try:
            print("Browser logs:")
            for entry in driver.get_log('browser'):
                print(entry)
        except Exception as log_err:
            print(f"Could not get browser logs: {log_err}")
        raise e
    finally:
        time.sleep(1)
        driver.quit()

if __name__ == "__main__":
    test_neon_brawler()
