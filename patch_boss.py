import os

js_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\script.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Prevent Boss from using attack3
bad_boss_atk = "if (ent.isBoss) { attackType = Math.random()>0.5?'attack2':'attack3'; damage = 15; knockback = 15; atkTime = 500; }"
good_boss_atk = "if (ent.isBoss) { attackType = Math.random()>0.5?'attack2':'attack1'; damage = 15; knockback = 20; atkTime = 400; }"
js = js.replace(bad_boss_atk, good_boss_atk)

# 2. Prevent instant kill hitting the player
bad_oneshot = """        if (h.type === 'attack3' && !defender.isBoss) {
            defender.hp = 0; // One-shot regular enemies!
        } else {"""
good_oneshot = """        if (h.type === 'attack3' && attacker === player && !defender.isBoss) {
            defender.hp = 0; // One-shot regular enemies!
        } else {"""
js = js.replace(bad_oneshot, good_oneshot)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    
print("Patched Boss attacks!")
