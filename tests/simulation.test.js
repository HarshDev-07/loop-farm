/**
 * simulation.test.js — Tests for engine: state, simulation, goals, analyzer.
 */
import { describe, it, expect } from 'vitest';
import { createState, applyAction } from '../src/engine/state.js';
import { createSimulation } from '../src/engine/simulation.js';
import { checkGoal } from '../src/engine/goals.js';
import { analyzeCode } from '../src/engine/analyze.js';

// Minimal test level
const testLevel = {
  id: 1,
  gridWidth: 5,
  gridHeight: 3,
  start: { x: 0, y: 0 },
  tiles: ['.....', '.....', '.....'],
  goal: { type: 'fieldPattern', pattern: ['sss..', '.....', '.....'] },
  api: ['moveRight', 'moveLeft', 'moveUp', 'moveDown', 'plant', 'water', 'harvest', 'goTo', 'canMove', 'isRock', 'getX', 'getY', 'GRID_WIDTH', 'GRID_HEIGHT'],
  requireConstructs: [],
  parLines: 5,
  maxActions: 100,
};

const rockLevel = {
  ...testLevel,
  tiles: ['..#..', '.....', '.....'],
};

describe('createState', () => {
  it('builds state from level', () => {
    const s = createState(testLevel);
    expect(s.width).toBe(5);
    expect(s.height).toBe(3);
    expect(s.farmer).toEqual({ x: 0, y: 0 });
    expect(s.tiles[0][0]).toBe('.');
    expect(s.coins).toBe(0);
    expect(s.wasted).toBe(0);
  });
});

describe('applyAction - move', () => {
  it('moves farmer right', () => {
    const s = createState(testLevel);
    applyAction(s, { type: 'move', dir: 'right', from: {x:0,y:0}, to: {x:1,y:0} });
    expect(s.farmer).toEqual({ x: 1, y: 0 });
    expect(s.actionCount).toBe(1);
  });
});

describe('applyAction - plant/water/harvest cycle', () => {
  it('cycles . → s → R → . with coin', () => {
    const s = createState(testLevel);
    applyAction(s, { type: 'plant', x: 0, y: 0 });
    expect(s.tiles[0][0]).toBe('s');
    applyAction(s, { type: 'water', x: 0, y: 0 });
    expect(s.tiles[0][0]).toBe('R');
    applyAction(s, { type: 'harvest', x: 0, y: 0 });
    expect(s.tiles[0][0]).toBe('.');
    expect(s.coins).toBe(1);
  });
});

describe('applyAction - bump/noop', () => {
  it('increments wasted on bump', () => {
    const s = createState(testLevel);
    applyAction(s, { type: 'bump', x: 0, y: 0, message: 'test' });
    expect(s.wasted).toBe(1);
  });

  it('increments wasted on noop', () => {
    const s = createState(testLevel);
    applyAction(s, { type: 'noop', x: 0, y: 0, message: 'test' });
    expect(s.wasted).toBe(1);
  });
});

describe('simulation - fence bump', () => {
  it('bumps at left fence', () => {
    const { actions } = createSimulation(testLevel);
    const sim = createSimulation(testLevel);
    sim.api.moveLeft();
    expect(sim.actions[0].type).toBe('bump');
    expect(sim.actions[0].message).toContain('left');
  });

  it('bumps at right fence', () => {
    const sim = createSimulation(testLevel);
    for (let i = 0; i < 5; i++) sim.api.moveRight();
    const bumps = sim.actions.filter(a => a.type === 'bump');
    expect(bumps.length).toBeGreaterThan(0);
  });

  it('bumps at top fence', () => {
    const sim = createSimulation(testLevel);
    sim.api.moveUp();
    expect(sim.actions[0].type).toBe('bump');
    expect(sim.actions[0].message).toContain('up');
  });
});

describe('simulation - rock bump', () => {
  it('bumps into rock', () => {
    const sim = createSimulation(rockLevel);
    sim.api.moveRight();
    sim.api.moveRight(); // tries to enter rock at (2,0)
    const bump = sim.actions.find(a => a.type === 'bump');
    expect(bump).toBeDefined();
    expect(bump.message).toContain('rock');
  });
});

describe('simulation - invalid farm actions become noop', () => {
  it('plant on non-empty → noop', () => {
    const sim = createSimulation(testLevel);
    sim.api.plant();
    sim.api.plant(); // already seeded
    expect(sim.actions[1].type).toBe('noop');
    expect(sim.state.wasted).toBe(1);
  });

  it('water without seed → noop', () => {
    const sim = createSimulation(testLevel);
    sim.api.water();
    expect(sim.actions[0].type).toBe('noop');
  });

  it('harvest without ripe → noop', () => {
    const sim = createSimulation(testLevel);
    sim.api.harvest();
    expect(sim.actions[0].type).toBe('noop');
  });
});

describe('simulation - goTo', () => {
  it('goTo valid tile', () => {
    const sim = createSimulation(testLevel);
    sim.api.goTo(3, 2);
    expect(sim.actions[0].type).toBe('goTo');
    expect(sim.state.farmer).toEqual({ x: 3, y: 2 });
  });

  it('goTo out of bounds → bump', () => {
    const sim = createSimulation(testLevel);
    sim.api.goTo(10, 10);
    expect(sim.actions[0].type).toBe('bump');
  });

  it('goTo rock → bump', () => {
    const sim = createSimulation(rockLevel);
    sim.api.goTo(2, 0);
    expect(sim.actions[0].type).toBe('bump');
  });

  it('goTo non-integer → bump', () => {
    const sim = createSimulation(testLevel);
    sim.api.goTo(1.5, 0);
    expect(sim.actions[0].type).toBe('bump');
  });
});

describe('simulation - action limit', () => {
  it('throws ActionLimitError when over maxActions', () => {
    const level = { ...testLevel, maxActions: 3 };
    const sim = createSimulation(level);
    expect(() => {
      for (let i = 0; i < 10; i++) sim.api.moveRight();
    }).toThrow();
    try {
      const sim2 = createSimulation(level);
      for (let i = 0; i < 10; i++) sim2.api.moveRight();
    } catch (e) {
      expect(e.name).toBe('ActionLimitError');
    }
  });
});

describe('checkGoal - fieldPattern', () => {
  it('met when all tiles match', () => {
    const level = { ...testLevel, goal: { type: 'fieldPattern', pattern: ['.....', '.....', '.....'] } };
    const s = createState(level);
    const result = checkGoal(level, s);
    expect(result.met).toBe(true);
    expect(result.mismatches.length).toBe(0);
  });

  it('not met with mismatches', () => {
    const level = { ...testLevel, goal: { type: 'fieldPattern', pattern: ['sssss', '.....', '.....'] } };
    const s = createState(level);
    const result = checkGoal(level, s);
    expect(result.met).toBe(false);
    expect(result.mismatches.length).toBe(5);
  });

  it('wildcard * matches any tile', () => {
    const level = { ...testLevel, goal: { type: 'fieldPattern', pattern: ['*****', '.....', '.....'] } };
    const s = createState(level);
    expect(checkGoal(level, s).met).toBe(true);
  });
});

describe('checkGoal - harvestCount', () => {
  it('met when coins >= count', () => {
    const level = { ...testLevel, goal: { type: 'harvestCount', count: 2 } };
    const s = createState(level);
    s.coins = 3;
    expect(checkGoal(level, s).met).toBe(true);
  });

  it('not met when coins < count', () => {
    const level = { ...testLevel, goal: { type: 'harvestCount', count: 5 } };
    const s = createState(level);
    s.coins = 2;
    expect(checkGoal(level, s).met).toBe(false);
  });
});

describe('analyzeCode', () => {
  it('detects for loop', () => {
    const { constructs } = analyzeCode('for (let i = 0; i < 5; i++) {}');
    expect(constructs.for).toBe(true);
  });

  it('detects while loop', () => {
    const { constructs } = analyzeCode('while (x) {}');
    expect(constructs.while).toBe(true);
  });

  it('detects if', () => {
    const { constructs } = analyzeCode('if (x) {}');
    expect(constructs.if).toBe(true);
  });

  it('detects function keyword', () => {
    const { constructs } = analyzeCode('function foo() {}');
    expect(constructs.function).toBe(true);
  });

  it('detects arrow function', () => {
    const { constructs } = analyzeCode('const f = () => {}');
    expect(constructs.function).toBe(true);
  });

  it('does NOT count for inside a comment', () => {
    const { constructs } = analyzeCode('// for (let i = 0; i < 5; i++) {}\nplant();');
    expect(constructs.for).toBe(false);
  });

  it('does NOT count for inside a string', () => {
    const { constructs } = analyzeCode('const s = "for (let i = 0; i < 5; i++) {}";');
    expect(constructs.for).toBe(false);
  });

  it('does NOT count while inside a block comment', () => {
    const { constructs } = analyzeCode('/* while (true) {} */\nplant();');
    expect(constructs.while).toBe(false);
  });

  it('counts non-empty non-comment lines', () => {
    const code = `// comment
plant();
// another comment

moveRight();`;
    expect(analyzeCode(code).lineCount).toBe(2);
  });
});
