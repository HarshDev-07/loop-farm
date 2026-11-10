# Loop Farm 🌾

Loop Farm is a lightweight 2D browser game designed to teach beginners how loops actually work in JavaScript.

Instead of solving dry math puzzles or reading abstract syntax diagrams, players write real code to guide a little farmer across a field — tilling soil, sowing seeds, watering sprouts, and harvesting crops. 

If you type `plant(); moveRight();` eight times by hand, you quickly realize why loops exist. By Level 10, you're writing nested loops, modulo checks, and custom helper functions to automate an entire 8×8 farm.

---

## Why Loop Farm?

Most beginner tutorials introduce loops with `console.log(i)` counting from 0 to 9. It’s hard for a student to care about numbers in a browser terminal.

Loop Farm makes code tactile:
- **Visual execution:** Every statement translates into an animated step on screen.
- **Fail-safe sandbox:** Student code runs inside an isolated Web Worker. If a student writes an accidental infinite loop like `while (true) {}`, the worker times out safely after 2 seconds without locking up the browser tab.
- **Immediate payoff:** Crops grow through distinct lifecycle stages, and harvesting earns gold coins that arc right up into your bank.
- **No dependencies on external assets:** Every sprite (the farmer, straw hat, radishes, rocks, fences) is drawn procedurally with the Canvas 2D API (`Path2D`). Sound effects use the Web Audio API synthesizer. The game loads instantly and works completely offline.

---

## The 10 Levels

The campaign introduces programming ideas one step at a time:

| Level | Title | Core Concept | What You Do | Par |
|---|---|---|---|---|
| **1** | First Seeds | Sequencing | Plant 3 seeds in a row by calling commands in order. | 5 lines |
| **2** | Too Much Typing | `for` loops | Sowing 8 seeds manually gets tedious. Wrap it in a loop. | 4 lines |
| **3** | Water Works | Multi-step loop bodies | Plant AND water each tile in a single loop pass. | 5 lines |
| **4** | Harvest Time | Harvest & Coins | Harvest 7 ripe radishes and collect 7 coins. | 4 lines |
| **5** | Rows & Columns | Nested `for` loops | Traverse an entire 5×4 grid using nested `y` and `x` loops. | 6 lines |
| **6** | Checkerboard | Conditionals (`if`) & Modulo (`%`) | Plant only when `(x + y) % 2 === 0` to create a checkerboard. | 8 lines |
| **7** | Stripes | Custom loop steps | Use `y += 2` to skip every other row and make striped fields. | 8 lines |
| **8** | Walk to the Fence | `while` loops & sensing | Grid dimensions are hidden — harvest until `canMove('right')` is false. | 6 lines |
| **9** | Rocky Road | Grid inspection (`isRock`) | Navigate around obstacles by checking `!isRock(x, y)`. | 8 lines |
| **10** | The Big Harvest | Functions & Composition | Bundle multi-step tile routines into a reusable `tend(x, y)` function. | 14 lines |

---

## Star Ratings

Each level awards up to 3 stars:
- ⭐ **1 Star:** The field matches the target pattern (or collects the target coins) and uses the required keywords (e.g. `for` or `while`).
- ⭐⭐ **2 Stars:** Solved with **zero wasted actions** (no bumping into fences, no walking into rocks, no watering empty dirt).
- ⭐⭐⭐ **3 Stars:** Solved cleanly within the level's **par line count** (ignoring comments and blank lines).

---

## The Student API

Depending on the level, the student has access to these globals:

```javascript
// Movement (moves 1 tile)
moveRight();
moveLeft();
moveUp();
moveDown();

// Coordinate Jump (counts as 1 action; farmer walks to target)
goTo(x, y);

// Farming (acts on the current tile)
plant();    // soil ('.') -> seedling ('s')
water();    // seedling ('s') -> ripe radish ('R')
harvest();  // ripe radish ('R') -> empty soil ('.') + 1 coin

// Sensing
canMove('up' | 'down' | 'left' | 'right'); // returns boolean
isRock(x, y);                              // true if tile has a boulder
getX();                                    // current column (0-indexed)
getY();                                    // current row (0-indexed)

// Constants
GRID_WIDTH;
GRID_HEIGHT;
```

If a student attempts to use a command not unlocked for that level (e.g. trying `goTo()` on Level 1), the engine gives a gentle prompt pointing them to the available function list.

---

## Architecture & How It Works

```
src/
├── engine/          # 100% pure game logic (zero DOM/Canvas dependencies)
│   ├── state.js       # Immutable state representation and applyAction()
│   ├── simulation.js  # Runs student API calls and records an action queue
│   ├── goals.js       # Checks pattern matches & harvest targets
│   ├── analyze.js     # Static code analysis (constructs & line counts)
│   ├── runner.js      # Main-thread promise wrapper with 2-second timeout
│   └── worker.js      # Web Worker harness running student code in strict mode
├── game/            # Visual rendering & animations
│   ├── renderer.js    # Canvas 2D drawer (handles DPI scaling & grid layout)
│   ├── animator.js    # Action queue player (smooth tweens & pop animations)
│   ├── sprites.js     # Hand-crafted vector shapes (Path2D)
│   └── effects.js     # Coin arcs, water droplets, and farmer bump shakes
├── ui/              # User interface & controls
│   ├── editor.js      # CodeMirror 6 with custom syntax theme
│   ├── panels.js      # Story descriptions, live status messages, victory modal
│   ├── levelSelect.js # Interactive top-bar milestone trail
│   ├── progress.js    # LocalStorage persistence with memory fallback
│   ├── sound.js       # Web Audio synth for chimes, plops, and thumps
│   └── icons.js       # SVG iconography (consistent stroke width)
└── levels/          # Pure JSON level definitions (Levels 01 to 10)
```

### Key Technical Decisions
1. **Separation of simulation and rendering:** Student code never manipulates the canvas directly. It runs inside a sandbox that logs an array of discrete action objects (`{ type: 'move', from, to }`, `{ type: 'plant', x, y }`). Once the simulation verifies the final state, the animator plays the actions back with easing curves.
2. **Deterministic testing:** Because the game engine in `src/engine/` is decoupled from the DOM, our Vitest test suite runs all 10 reference solutions directly in Node and verifies goal compliance, wasted steps, and par limits in under 350ms.
3. **Typography & Assets:** Fonts (Bricolage Grotesque, Atkinson Hyperlegible, JetBrains Mono) are bundled locally using `@fontsource`. There are no external CDN requests or tracking scripts.

---

## Getting Started

### Prerequisites
- Node.js (version 18 or newer)
- npm

### Installation
```bash
git clone https://github.com/YOUR-USERNAME/loop-farm.git
cd loop-farm
npm install
```

### Running Locally
```bash
npm run dev
```
Open your browser to `http://localhost:5173/`.

### Running Tests
To run the full suite (engine mechanics, code analyzer edge cases, and all 10 campaign solutions):
```bash
npm test
```

### Production Build
```bash
npm run build
```
This bundles the application into `dist/` with relative asset links (`base: './'`). You can deploy this directory to GitHub Pages, Netlify, Cloudflare Pages, or host it locally from any subfolder.

---

## Adding Custom Levels

Levels are defined as plain JSON files in `src/levels/`. You can create a new level without modifying any game engine code:

```json
{
  "id": 11,
  "title": "Spiral Tilling",
  "concept": "nested loops with conditions",
  "story": "Plant seeds along the outer border of the field.",
  "hint": "Check if x === 0 || y === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1.",
  "gridWidth": 6,
  "gridHeight": 6,
  "start": { "x": 0, "y": 0 },
  "tiles": [
    "......",
    "......",
    "......",
    "......",
    "......",
    "......"
  ],
  "goal": {
    "type": "fieldPattern",
    "pattern": [
      "ssssss",
      "s....s",
      "s....s",
      "s....s",
      "s....s",
      "ssssss"
    ]
  },
  "api": ["goTo", "plant", "GRID_WIDTH", "GRID_HEIGHT"],
  "requireConstructs": ["for", "if"],
  "parLines": 7,
  "maxActions": 500,
  "starterCode": "// Plant the entire outer border.\n"
}
```

Import your new JSON file in `src/levels/index.js` and add it to the exported `levels` array. The level trail and progression will update automatically.

---

## Embedding in a Website or LMS

Because Loop Farm has no backend requirements, you can embed it inside an educational portal, blog, or classroom website with an `<iframe>`:

```html
<iframe
  src="https://YOUR-USERNAME.github.io/loop-farm/"
  width="100%"
  height="720"
  style="border: 0; border-radius: 8px; overflow: hidden;"
  title="Loop Farm Coding Game"
  loading="lazy">
</iframe>
```

---

## License

MIT License. Feel free to use this in classrooms, coding clubs, workshops, or for self-study!
