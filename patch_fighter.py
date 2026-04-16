import os

js_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\script.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Add vy to entity
js = js.replace("""        this.y = groundY;
        this.vx = 0;""", """        this.y = groundY;
        this.vx = 0;
        this.vy = 0;""")

# 2. Add flying kick logic and velocities
js = js.replace("""        } else if (comboCount >= 3) {
            attackType = 'attack3'; damage = 25; knockback = 25; atkTime = 500;
            comboCount = 0; // reset
        }""", """        } else if (comboCount >= 3) {
            attackType = 'attack3'; damage = 25; knockback = 30; atkTime = 500;
            comboCount = 0; // reset
            ent.vy = -18; // Flying jump
            ent.vx = ent.dir * 15; // Flying rush forward
        }""")

# 3. Add gravity and vertical physics to player
js = js.replace("""    player.x += player.vx;
    player.vx *= 0.8; // friction""", """    player.x += player.vx;
    player.vx *= 0.8; // friction
    player.y += player.vy;
    if (player.y < groundY) player.vy += 60 * (dt/1000); // Gravity
    else { player.y = groundY; player.vy = 0; }""")

# 4. Add gravity and vertical physics to enemies
js = js.replace("""        e.x += e.vx;
        e.vx *= 0.8;""", """        e.x += e.vx;
        e.vx *= 0.8;
        e.y += e.vy;
        if (e.y < groundY) e.vy += 60 * (dt/1000);
        else { e.y = groundY; e.vy = 0; }""")

# 5. Make enemies super aggressive
js = js.replace("""                // Attack Player
                if (Math.random() < (e.isBoss ? 0.05 : 0.02)) {
                    executeAttack(e);
                }""", """                // Attack Player
                if (Math.random() < (e.isBoss ? 0.18 : 0.12)) {
                    executeAttack(e);
                }""")

# 6. Change attack3 animation to flying kick
bad_anim = """    else if (ent.state === 'attack3') { // High Kick
        l_hand = {x: -20, y: -60};
        r_hand = {x: 20, y: -20};
        r_foot = {x: -10, y: 0}; // planted
        l_foot = {x: 50, y: -60}; // Kicking high!
        headOffset.x = -10;
    }"""
    
good_anim = """    else if (ent.state === 'attack3') { // Flying Kick
        ctx.translate(0, -30); // hover
        ctx.rotate(1.2); // lean horizontally!
        l_hand = {x: -20, y: -10};
        r_hand = {x: 20, y: -10};
        r_foot = {x: -10, y: -30}; // tucked back leg
        l_foot = {x: 10, y: 40}; // flying forward leg!
        headOffset = {x: 0, y: -70};
    }"""
js = js.replace(bad_anim, good_anim)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    
print("Patched physics and aggressiveness")
