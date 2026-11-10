/**
 * worker.js — Runs student code safely in a Web Worker.
 * Receives: { code, level }
 * Posts back: { status, actions, goal, state, error }
 */
import { createSimulation } from './simulation.js';
import { checkGoal } from './goals.js';

self.onmessage = function (e) {
  const { code, level } = e.data;
  const sim = createSimulation(level);
  const { state, actions, api } = sim;

  // All known API names
  const allApiNames = [
    'moveRight', 'moveLeft', 'moveUp', 'moveDown',
    'goTo', 'plant', 'water', 'harvest',
    'canMove', 'isRock', 'getX', 'getY',
    'GRID_WIDTH', 'GRID_HEIGHT',
  ];

  // Dangerous globals to shadow
  const dangerousNames = [
    'fetch', 'XMLHttpRequest', 'importScripts', 'postMessage',
    'self', 'WebSocket', 'indexedDB', 'Function',
  ];

  // Build parameter list and argument values
  const paramNames = [];
  const paramValues = [];

  for (const name of allApiNames) {
    paramNames.push(name);
    if (level.api.includes(name)) {
      paramValues.push(api[name]);
    } else {
      // Not enabled: throw friendly error
      const isConst = name === 'GRID_WIDTH' || name === 'GRID_HEIGHT';
      const unavailable = function () {
        throw new Error(isConst
          ? `\`${name}\` isn't available in this level. Look at the Available functions list.`
          : `\`${name}()\` isn't available in this level. Look at the Available functions list.`
        );
      };
      if (isConst) {
        unavailable.valueOf = unavailable;
        unavailable.toString = unavailable;
      }
      paramValues.push(unavailable);
    }
  }

  // Shadow dangerous globals
  for (const name of dangerousNames) {
    paramNames.push(name);
    paramValues.push(undefined);
  }

  try {
    // Build function in strict mode
    const fn = new Function(...paramNames, `'use strict';\n${code}`);
    fn(...paramValues);

    const goal = checkGoal(level, state);
    self.postMessage({ status: 'finished', actions, goal, state });
  } catch (err) {
    let status = 'error';
    let message = err.message || String(err);
    let line = null;

    if (err.name === 'ActionLimitError') {
      status = 'limit';
      message = 'Too many actions! The farmer is exhausted. Check your loop condition.';
    } else if (err instanceof SyntaxError) {
      message = `There is a typo in your code: ${err.message}. Check brackets ( ), braces { } and semicolons.`;
    } else if (err instanceof ReferenceError) {
      const match = err.message.match(/(\w+) is not defined/);
      const name = match ? match[1] : 'that';
      message = `I don't know what \`${name}\` is. Check the spelling, or look at the Available functions list.`;
    } else if (err instanceof TypeError) {
      const match = err.message.match(/(\w+) is not a function/);
      const name = match ? match[1] : 'it';
      message = `\`${name}\` is not a function. Did you forget to define it, or add () incorrectly?`;
    }

    // Try extracting line number from stack
    if (err.stack) {
      // Worker code offset: our wrapper adds 2 lines ('use strict'; + blank)
      const stackMatch = err.stack.match(/<anonymous>:(\d+):/);
      if (stackMatch) {
        const rawLine = parseInt(stackMatch[1], 10) - 2; // subtract wrapper offset
        if (rawLine > 0) line = rawLine;
      }
    }

    const goal = checkGoal(level, state);
    self.postMessage({ status, actions, goal, state, error: { message, line } });
  }
};
