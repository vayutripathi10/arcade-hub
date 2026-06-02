import json

# Re-define the level data from script.js
levels = [
    {
        "index": 1,
        "gridWidth": 5,
        "gridHeight": 5,
        "perfectMoves": 3,
        "lines": [
            { "id": "L1", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 1, "y": 3}, {"x": 1, "y": 2}, {"x": 1, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 3, "y": 1}, {"x": 3, "y": 2}, {"x": 3, "y": 3}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 2, "y": 0}, {"x": 3, "y": 0}, {"x": 4, "y": 0}] }
        ]
    },
    {
        "index": 2,
        "gridWidth": 5,
        "gridHeight": 5,
        "perfectMoves": 3,
        "lines": [
            { "id": "L1", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 2}, {"x": 2, "y": 2}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 3, "y": 1}, {"x": 3, "y": 2}, {"x": 3, "y": 3}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 2, "y": 4}, {"x": 3, "y": 4}, {"x": 4, "y": 4}] }
        ]
    },
    {
        "index": 3,
        "gridWidth": 6,
        "gridHeight": 6,
        "perfectMoves": 4,
        "lines": [
            { "id": "L1", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 3, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 0}, {"x": 4, "y": 1}, {"x": 4, "y": 2}] },
            { "id": "L3", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 4, "y": 4}, {"x": 3, "y": 4}, {"x": 2, "y": 4}] },
            { "id": "L4", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 3}, {"x": 2, "y": 3}, {"x": 3, "y": 3}, {"x": 4, "y": 3}] }
        ]
    },
    {
        "index": 4,
        "gridWidth": 6,
        "gridHeight": 6,
        "perfectMoves": 4,
        "lines": [
            { "id": "L1", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 2, "y": 1}, {"x": 2, "y": 2}, {"x": 2, "y": 3}] },
            { "id": "L2", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 4}, {"x": 2, "y": 4}, {"x": 3, "y": 4}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 4, "y": 2}, {"x": 4, "y": 3}, {"x": 4, "y": 4}] },
            { "id": "L4", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 0, "y": 2}, {"x": 1, "y": 2}, {"x": 1, "y": 3}] }
        ]
    },
    {
        "index": 5,
        "gridWidth": 7,
        "gridHeight": 7,
        "perfectMoves": 5,
        "lines": [
            { "id": "L1", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 2, "y": 2}, {"x": 1, "y": 2}] },
            { "id": "L2", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 3, "y": 1}, {"x": 3, "y": 2}, {"x": 4, "y": 2}, {"x": 4, "y": 1}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 2, "y": 3}, {"x": 2, "y": 4}, {"x": 3, "y": 4}, {"x": 3, "y": 3}] },
            { "id": "L4", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 5, "y": 1}, {"x": 5, "y": 2}, {"x": 5, "y": 3}, {"x": 5, "y": 4}] },
            { "id": "L5", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 2, "y": 5}, {"x": 3, "y": 5}, {"x": 4, "y": 5}, {"x": 4, "y": 4}] }
        ]
    },
    {
        "index": 6,
        "gridWidth": 7,
        "gridHeight": 7,
        "perfectMoves": 6,
        "lines": [
            { "id": "L1", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 0, "y": 3}, {"x": 1, "y": 3}, {"x": 2, "y": 3}] },
            { "id": "L2", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 2, "y": 4}, {"x": 3, "y": 4}, {"x": 4, "y": 4}] },
            { "id": "L3", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 5, "y": 2}, {"x": 5, "y": 3}, {"x": 5, "y": 4}] },
            { "id": "L4", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 5}, {"x": 2, "y": 5}, {"x": 3, "y": 5}, {"x": 4, "y": 5}] },
            { "id": "L5", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 0, "y": 1}, {"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 3, "y": 1}] },
            { "id": "L6", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 2, "y": 2}, {"x": 3, "y": 2}] }
        ]
    },
    {
        "index": 7,
        "gridWidth": 8,
        "gridHeight": 8,
        "perfectMoves": 7,
        "lines": [
            { "id": "L1", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 2, "y": 1}, {"x": 3, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 0}, {"x": 4, "y": 1}, {"x": 4, "y": 2}] },
            { "id": "L3", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 3}, {"x": 4, "y": 4}, {"x": 4, "y": 5}] },
            { "id": "L4", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 4, "y": 6}, {"x": 3, "y": 6}, {"x": 2, "y": 6}] },
            { "id": "L5", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 1, "y": 6}, {"x": 1, "y": 5}, {"x": 1, "y": 4}] },
            { "id": "L6", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 1, "y": 3}, {"x": 1, "y": 2}] },
            { "id": "L7", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 3, "y": 3}, {"x": 3, "y": 4}] }
        ]
    },
    {
        "index": 8,
        "gridWidth": 8,
        "gridHeight": 8,
        "perfectMoves": 8,
        "lines": [
            { "id": "L1", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 3, "y": 1}, {"x": 2, "y": 1}, {"x": 1, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 2, "y": 3}, {"x": 2, "y": 2}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 3}, {"x": 1, "y": 4}, {"x": 2, "y": 4}] },
            { "id": "L4", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 3, "y": 4}, {"x": 3, "y": 3}] },
            { "id": "L5", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 1}, {"x": 4, "y": 2}] },
            { "id": "L6", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 4, "y": 3}, {"x": 5, "y": 3}] },
            { "id": "L7", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 5, "y": 2}, {"x": 5, "y": 1}] },
            { "id": "L8", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 3, "y": 0}, {"x": 4, "y": 0}] }
        ]
    },
    {
        "index": 9,
        "gridWidth": 9,
        "gridHeight": 9,
        "perfectMoves": 9,
        "lines": [
            { "id": "L1", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 3, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 0}, {"x": 4, "y": 1}, {"x": 4, "y": 2}] },
            { "id": "L3", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 3}, {"x": 4, "y": 4}, {"x": 4, "y": 5}] },
            { "id": "L4", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 6}, {"x": 4, "y": 7}, {"x": 4, "y": 8}] },
            { "id": "L5", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 3, "y": 8}, {"x": 2, "y": 8}, {"x": 1, "y": 8}] },
            { "id": "L6", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 1, "y": 7}, {"x": 1, "y": 6}, {"x": 1, "y": 5}] },
            { "id": "L7", "exitDir": {"x": 0, "y": -1}, "path": [{"x": 1, "y": 4}, {"x": 1, "y": 3}, {"x": 1, "y": 2}] },
            { "id": "L8", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 2, "y": 3}, {"x": 2, "y": 4}, {"x": 2, "y": 5}] },
            { "id": "L9", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 3, "y": 3}, {"x": 3, "y": 4}, {"x": 3, "y": 5}] }
        ]
    },
    {
        "index": 10,
        "gridWidth": 10,
        "gridHeight": 10,
        "perfectMoves": 11,
        "lines": [
            { "id": "L1", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 3, "y": 1}] },
            { "id": "L2", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 1}, {"x": 4, "y": 2}] },
            { "id": "L3", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 4, "y": 3}, {"x": 5, "y": 3}] },
            { "id": "L4", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 6, "y": 3}, {"x": 6, "y": 4}] },
            { "id": "L5", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 6, "y": 5}, {"x": 5, "y": 5}] },
            { "id": "L6", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 4, "y": 4}, {"x": 4, "y": 5}] },
            { "id": "L7", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 3, "y": 4}, {"x": 2, "y": 4}] },
            { "id": "L8", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 1, "y": 4}, {"x": 1, "y": 5}] },
            { "id": "L9", "exitDir": {"x": 1, "y": 0}, "path": [{"x": 1, "y": 6}, {"x": 2, "y": 6}] },
            { "id": "L10", "exitDir": {"x": 0, "y": 1}, "path": [{"x": 3, "y": 6}, {"x": 3, "y": 7}] },
            { "id": "L11", "exitDir": {"x": -1, "y": 0}, "path": [{"x": 5, "y": 7}, {"x": 4, "y": 7}] }
        ]
    }
]

def is_blocked(line, active_lines, width, height):
    # Head of the line is the last element
    head = line["path"][-1]
    dx = line["exitDir"]["x"]
    dy = line["exitDir"]["y"]
    
    cx = head["x"] + dx
    cy = head["y"] + dy
    
    while 0 <= cx < width and 0 <= cy < height:
        for other in active_lines:
            if other["id"] == line["id"]:
                continue
            for pt in other["path"]:
                if pt["x"] == cx and pt["y"] == cy:
                    return True
        cx += dx
        cy += dy
    return False

def solve(active_lines, width, height, path):
    if not active_lines:
        return path
    
    for i, line in enumerate(active_lines):
        if not is_blocked(line, active_lines, width, height):
            next_active = active_lines[:i] + active_lines[i+1:]
            res = solve(next_active, width, height, path + [line["id"]])
            if res:
                return res
    return None

def verify_levels():
    print("=== Level Verification Start ===")
    all_ok = True
    
    for lvl in levels:
        idx = lvl["index"]
        width = lvl["gridWidth"]
        height = lvl["gridHeight"]
        lines = lvl["lines"]
        
        print(f"\nVerifying Level {idx} ({width}x{height}, {len(lines)} lines):")
        
        # 1. Check Disjointness & Bounds
        cells = set()
        overlap = False
        out_of_bounds = False
        continuous = True
        
        for line in lines:
            path = line["path"]
            # Check continuous path
            for j in range(len(path) - 1):
                p1 = path[j]
                p2 = path[j+1]
                dist = abs(p1["x"] - p2["x"]) + abs(p1["y"] - p2["y"])
                if dist != 1:
                    print(f"  Error: Line {line['id']} has non-continuous path from {p1} to {p2}")
                    continuous = False
            
            for pt in path:
                # Bounds check
                if not (0 <= pt["x"] < width and 0 <= pt["y"] < height):
                    print(f"  Error: Coordinate {pt} out of bounds for line {line['id']}")
                    out_of_bounds = True
                
                # Overlap check
                coord = (pt["x"], pt["y"])
                if coord in cells:
                    print(f"  Error: Overlapping cell {coord} occupied by line {line['id']}")
                    overlap = True
                cells.add(coord)
        
        # 2. Check Solvability
        solution = solve(lines, width, height, [])
        solvable = solution is not None
        
        if solvable:
            print(f"  Status: Solvable! Clear Order: {' -> '.join(solution)}")
            if len(solution) != lvl["perfectMoves"]:
                print(f"  Warning: perfectMoves indicator ({lvl['perfectMoves']}) does not match lines count ({len(solution)})")
        else:
            print(f"  Error: Level is UNSOLVABLE!")
            
        lvl_ok = continuous and not out_of_bounds and not overlap and solvable
        if not lvl_ok:
            all_ok = False
            
    print("\n=== Verification Finished ===")
    if all_ok:
        print("ALL LEVELS ARE SOLVABLE, BOUND-SAFE, CONTINUOUS, AND DISJOINT! NO BUGS FOUND!")
        return True
    else:
        print("SOME LEVELS HAVE CRITICAL BUGS! SEE OUTPUT ABOVE!")
        return False

if __name__ == "__main__":
    verify_levels()
