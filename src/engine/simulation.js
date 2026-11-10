/**
 * simulation.js — Creates the student API and records actions.
 * No DOM/canvas imports allowed.
 */
import { createState, applyAction } from './state.js';

/**
 * @param {object} level
 * @returns {{ state, actions, api }}
 */
export function createSimulation(level) {
  const state = createState(level);
  const actions = [];

  function record(action) {
    if (state.actionCount >= level.maxActions) {
      const err = new Error('The farmer ran out of actions. Check your loop\'s stop condition.');
      err.name = 'ActionLimitError';
      throw err;
    }
    actions.push(action);
    applyAction(state, action);
  }

  function inBounds(x, y) {
    return x >= 0 && x < state.width && y >= 0 && y < state.height;
  }

  function isRockAt(x, y) {
    return state.tiles[y]?.[x] === '#';
  }

  // Direction vectors
  const DIRS = {
    right: { dx: 1, dy: 0 },
    left:  { dx: -1, dy: 0 },
    up:    { dx: 0, dy: -1 },
    down:  { dx: 0, dy: 1 },
  };

  function makeMove(dir) {
    return function () {
      const { dx, dy } = DIRS[dir];
      const nx = state.farmer.x + dx;
      const ny = state.farmer.y + dy;
      if (!inBounds(nx, ny)) {
        const dirNames = { right: 'right', left: 'left', up: 'up', down: 'down' };
        record({ type: 'bump', x: state.farmer.x, y: state.farmer.y,
          message: `Fence ahead. The farmer can't move ${dirNames[dir]}.` });
        return;
      }
      if (isRockAt(nx, ny)) {
        record({ type: 'bump', x: state.farmer.x, y: state.farmer.y,
          message: 'A rock blocks the way.' });
        return;
      }
      record({ type: 'move', dir, from: { x: state.farmer.x, y: state.farmer.y }, to: { x: nx, y: ny } });
    };
  }

  const api = {
    moveRight: makeMove('right'),
    moveLeft:  makeMove('left'),
    moveUp:    makeMove('up'),
    moveDown:  makeMove('down'),

    goTo(x, y) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        record({ type: 'bump', x: state.farmer.x, y: state.farmer.y,
          message: 'The farmer can\'t go there.' });
        return;
      }
      if (!inBounds(x, y) || isRockAt(x, y)) {
        record({ type: 'bump', x: state.farmer.x, y: state.farmer.y,
          message: 'The farmer can\'t go there.' });
        return;
      }
      record({ type: 'goTo', from: { x: state.farmer.x, y: state.farmer.y }, to: { x, y } });
    },

    plant() {
      const { x, y } = state.farmer;
      const t = state.tiles[y][x];
      if (t !== '.') {
        record({ type: 'noop', x, y, message: 'This soil is not empty.' });
        return;
      }
      record({ type: 'plant', x, y });
    },

    water() {
      const { x, y } = state.farmer;
      const t = state.tiles[y][x];
      if (t !== 's') {
        record({ type: 'noop', x, y, message: 'There is no seed to water here.' });
        return;
      }
      record({ type: 'water', x, y });
    },

    harvest() {
      const { x, y } = state.farmer;
      const t = state.tiles[y][x];
      if (t !== 'R') {
        record({ type: 'noop', x, y, message: 'Nothing ripe to harvest here.' });
        return;
      }
      record({ type: 'harvest', x, y });
    },

    canMove(direction) {
      const valid = ['up', 'down', 'left', 'right'];
      if (!valid.includes(direction)) {
        throw new Error("canMove needs 'up', 'down', 'left' or 'right' (with quotes).");
      }
      const { dx, dy } = DIRS[direction];
      const nx = state.farmer.x + dx;
      const ny = state.farmer.y + dy;
      return inBounds(nx, ny) && !isRockAt(nx, ny);
    },

    isRock(x, y) {
      return isRockAt(x, y);
    },

    getX() { return state.farmer.x; },
    getY() { return state.farmer.y; },

    get GRID_WIDTH() { return state.width; },
    get GRID_HEIGHT() { return state.height; },
  };

  return { state, actions, api };
}
