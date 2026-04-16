import os

js_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\script.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Fix Player Phantom Hitboxes
bad_player_state = """    if (player.state.startsWith('attack')) {
        player.stateFrame -= dt;
        if (player.stateFrame <= 0) player.state = 'idle';
    }"""

good_player_state = """    if (player.state.startsWith('attack')) {
        player.stateFrame -= dt;
        if (player.stateFrame <= 0) {
            player.state = 'idle';
            if (player.attackHitbox) player.attackHitbox.active = false;
        }
    }"""
js = js.replace(bad_player_state, good_player_state)


# Fix Enemy Phantom Hitboxes
bad_enemy_state = """        else if (e.state.startsWith('attack')) {
            e.stateFrame -= dt;
            if (e.stateFrame <= 0) e.state = 'idle';
        }"""

good_enemy_state = """        else if (e.state.startsWith('attack')) {
            e.stateFrame -= dt;
            if (e.stateFrame <= 0) {
                e.state = 'idle';
                if (e.attackHitbox) e.attackHitbox.active = false;
            }
        }"""
js = js.replace(bad_enemy_state, good_enemy_state)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    
print("Lingering hitboxes deactivated!")
