/**
 * levels.test.js — Run all 10 reference solutions through the simulation.
 * For every level: goal met, constructs present, wasted === 0, lineCount <= parLines.
 */
import { describe, it, expect } from 'vitest';
import { createSimulation } from '../src/engine/simulation.js';
import { checkGoal } from '../src/engine/goals.js';
import { analyzeCode } from '../src/engine/analyze.js';

import level01 from '../src/levels/level01.json';
import level02 from '../src/levels/level02.json';
import level03 from '../src/levels/level03.json';
import level04 from '../src/levels/level04.json';
import level05 from '../src/levels/level05.json';
import level06 from '../src/levels/level06.json';
import level07 from '../src/levels/level07.json';
import level08 from '../src/levels/level08.json';
import level09 from '../src/levels/level09.json';
import level10 from '../src/levels/level10.json';

import { solution as sol01 } from '../solutions/level01.js';
import { solution as sol02 } from '../solutions/level02.js';
import { solution as sol03 } from '../solutions/level03.js';
import { solution as sol04 } from '../solutions/level04.js';
import { solution as sol05 } from '../solutions/level05.js';
import { solution as sol06 } from '../solutions/level06.js';
import { solution as sol07 } from '../solutions/level07.js';
import { solution as sol08 } from '../solutions/level08.js';
import { solution as sol09 } from '../solutions/level09.js';
import { solution as sol10 } from '../solutions/level10.js';

const cases = [
  [level01, sol01],
  [level02, sol02],
  [level03, sol03],
  [level04, sol04],
  [level05, sol05],
  [level06, sol06],
  [level07, sol07],
  [level08, sol08],
  [level09, sol09],
  [level10, sol10],
];

function runSolution(level, code) {
  const sim = createSimulation(level);
  const { state, actions, api } = sim;

  // Build function with API names, run in strict mode
  const allApiNames = [
    'moveRight', 'moveLeft', 'moveUp', 'moveDown',
    'goTo', 'plant', 'water', 'harvest',
    'canMove', 'isRock', 'getX', 'getY',
    'GRID_WIDTH', 'GRID_HEIGHT',
  ];

  const paramNames = [];
  const paramValues = [];

  for (const name of allApiNames) {
    paramNames.push(name);
    if (level.api.includes(name)) {
      paramValues.push(api[name]);
    } else {
      paramValues.push(function () {
        throw new Error(`${name} not available in this level`);
      });
    }
  }

  const fn = new Function(...paramNames, `'use strict';\n${code}`);
  fn(...paramValues);

  return { state, actions };
}

describe('All 10 level solutions', () => {
  for (const [level, code] of cases) {
    it(`Level ${level.id}: ${level.title}`, () => {
      const { state, actions } = runSolution(level, code);
      const goal = checkGoal(level, state);
      const { constructs, lineCount } = analyzeCode(code);

      // Goal must be met
      expect(goal.met, `Level ${level.id} goal not met`).toBe(true);

      // Required constructs must be present
      for (const c of (level.requireConstructs || [])) {
        expect(constructs[c], `Level ${level.id}: missing construct '${c}'`).toBe(true);
      }

      // No wasted actions
      expect(state.wasted, `Level ${level.id}: has wasted actions`).toBe(0);

      // Line count <= parLines
      expect(lineCount, `Level ${level.id}: lineCount ${lineCount} > parLines ${level.parLines}`).toBeLessThanOrEqual(level.parLines);
    });
  }
});
