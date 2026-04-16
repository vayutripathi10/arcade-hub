import os

js_path = r"c:\Users\vaytripa\BLT\Practice\open.ai\stick-fighter-frontend\script.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Update Hitbox checking to be dynamic
bad_hitbox_exec = """    // Generate active hitbox
    ent.attackHitbox = {
        x: ent.x + (ent.dir * 40), // 40px in front
        y: ent.y - 45,
        w: 50, h: 50,
        damage, knockback,
        active: true
    };"""

good_hitbox_exec = """    // Generate active hitbox map
    ent.attackHitbox = {
        offsetX: 40,
        offsetY: -45,
        w: attackType === 'attack3' ? 80 : 50,
        h: attackType === 'attack3' ? 60 : 50,
        type: attackType,
        damage, knockback,
        active: true
    };"""
js = js.replace(bad_hitbox_exec, good_hitbox_exec)


bad_hitbox_check = """function checkHitbox(attacker, defender) {
    if (!attacker.attackHitbox || !attacker.attackHitbox.active) return false;
    if (defender.hitStun > 0) return false; // i-frames
    
    const h = attacker.attackHitbox;
    // Defender bound roughly x-20 to x+20, y-80 to y
    const defW = defender.isBoss ? 40 : 20;
    if (Math.abs(h.x - defender.x) < (h.w/2 + defW) && 
        Math.abs(h.y - (defender.y - 40)) < (h.h/2 + 40)) {"""

good_hitbox_check = """function checkHitbox(attacker, defender) {
    if (!attacker.attackHitbox || !attacker.attackHitbox.active) return false;
    if (defender.hitStun > 0) return false; // i-frames
    
    const h = attacker.attackHitbox;
    const hx = attacker.x + (attacker.dir * h.offsetX);
    const hy = attacker.y + h.offsetY;

    const defW = defender.isBoss ? 40 : 20;
    if (Math.abs(hx - defender.x) < (h.w/2 + defW) && 
        Math.abs(hy - (defender.y - 40)) < (h.h/2 + 40)) {"""
js = js.replace(bad_hitbox_check, good_hitbox_check)


# 2. Fix the piercing & one-shot logic
bad_hit_logic = """        // Hit!
        attacker.attackHitbox.active = false;
        defender.hp -= h.damage;
        defender.hitStun = 300; // 300ms stun"""

good_hit_logic = """        // Hit!
        if (h.type !== 'attack3') attacker.attackHitbox.active = false; // Normal attacks vanish, flying kicks pierce!
        
        if (h.type === 'attack3' && !defender.isBoss) {
            defender.hp = 0; // One-shot regular enemies!
        } else {
            defender.hp -= h.damage;
        }
        defender.hitStun = 300; // 300ms stun"""
js = js.replace(bad_hit_logic, good_hit_logic)


# 3. Fix Visual Flying Kick Head vs Feet rendering
bad_anim = """    else if (ent.state === 'attack3') { // Flying Kick
        ctx.translate(0, -30); // hover
        ctx.rotate(1.2); // lean horizontally!
        l_hand = {x: -20, y: -10};
        r_hand = {x: 20, y: -10};
        r_foot = {x: -10, y: -30}; // tucked back leg
        l_foot = {x: 10, y: 40}; // flying forward leg!
        headOffset = {x: 0, y: -70};
    }"""
good_anim = """    else if (ent.state === 'attack3') { // Flying Dropkick
        ctx.translate(0, -20); // hover
        ctx.rotate(-1.4); // Lean backwards to point feet completely forward!
        l_hand = {x: 0, y: -20};
        r_hand = {x: -20, y: -40};
        r_foot = {x: -10, y: 20}; // Tucked leg
        l_foot = {x: 10, y: 60}; // Fully extended dropkick leg (stretching WAY out forward on X axis)
        headOffset = {x: 0, y: -60}; // Head is safely in the back
    }"""
js = js.replace(bad_anim, good_anim)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    
print("Patched hitbox tracking, pierce effects, one-shot mechanic, and dropkick rotate animation!")
