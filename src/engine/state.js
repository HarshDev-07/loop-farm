/**
 * state.js — Pure game state, no DOM/canvas imports.
 * createState(level) → state object
 * applyAction(state, action) → mutates state in-place
 */

/**
 * Build a fresh state from a level definition.
 * @param {object} level
 * @returns {object} state
 */
export function createState(level) {
  // Parse tiles into 2D array: tiles[y][x]
  const tiles = level.tiles.map(row => row.split(''));
  return {
    width: level.gridWidth,
    height: level.gridHeight,
    tiles,
    farmer: { x: level.start.x, y: level.start.y },
    coins: 0,
    actionCount: 0,
    wasted: 0,
  };
}

/**
 * Apply a single action to state, mutating it.
 * @param {object} state
 * @param {object} action
 */
export function applyAction(state, action) {
  state.actionCount++;

  switch (action.type) {
    case 'move':
      state.farmer.x = action.to.x;
      state.farmer.y = action.to.y;
      break;

    case 'goTo':
      state.farmer.x = action.to.x;
      state.farmer.y = action.to.y;
      break;

    case 'plant': {
      const t = state.tiles[action.y][action.x];
      if (t === '.') {
        state.tiles[action.y][action.x] = 's';
      }
      break;
    }

    case 'water': {
      const t = state.tiles[action.y][action.x];
      if (t === 's') {
        state.tiles[action.y][action.x] = 'R';
      }
      break;
    }

    case 'harvest': {
      const t = state.tiles[action.y][action.x];
      if (t === 'R') {
        state.tiles[action.y][action.x] = '.';
        state.coins++;
      }
      break;
    }

    case 'bump':
    case 'noop':
      state.wasted++;
      break;

    default:
      break;
  }
}
