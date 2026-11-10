/**
 * animator.js — Plays action lists with tweens on the canvas.
 */
import { createState, applyAction } from '../engine/state.js';
import {
  animate, easeOutCubic, easeOutBack, lerp, prefersReducedMotion, wait,
} from './effects.js';

const BASE_MOVE_MS = 250;
const POP_MS = 200;
const SHAKE_MS = 200;
const COIN_ARC_MS = 400;
const HARVEST_COIN_MS = 400;

/**
 * @param {object} initialState  — fresh state from createState(level)
 * @param {Array}  actions
 * @param {object} opts          — { renderer, speed, onAction, signal, onCoinArc }
 * @returns {Promise<void>}
 */
export async function playActions(initialState, actions, opts = {}) {
  const { renderer, speed = 1, onAction, signal, onCoinArc } = opts;
  const reduced = prefersReducedMotion();

  // Work on a copy of state
  const state = JSON.parse(JSON.stringify(initialState));
  const visual = {
    farmerX: state.farmer.x,
    farmerY: state.farmer.y,
    farmerFacing: true,
    tilePops: {},
    farmerShakeX: 0,
    bubble: null,
    droplets: [],
    trail: [],
    flyingCrop: null,
    flyingCoin: null,
    mismatches: [],
  };

  // Speed modifier
  const speedMult = speed === 0 ? 0 : 1 / speed;

  function dur(ms) {
    if (reduced || speed === 0) return 0;
    return Math.round(ms * speedMult);
  }

  function redraw() {
    renderer.draw(state, visual);
  }

  redraw();

  for (const action of actions) {
    if (signal?.aborted) return;

    onAction?.(action, state);

    switch (action.type) {
      case 'move': {
        const facing = action.dir === 'right' || action.dir === 'left'
          ? action.dir === 'right'
          : visual.farmerFacing;
        visual.farmerFacing = facing;

        const fromX = action.from.x;
        const fromY = action.from.y;
        const toX   = action.to.x;
        const toY   = action.to.y;

        // Add to trail
        if (!visual.trail.some(p => p.x === fromX && p.y === fromY)) {
          visual.trail.push({ x: fromX, y: fromY });
        }

        await animate(dur(BASE_MOVE_MS), (t) => {
          visual.farmerX = lerp(fromX, toX, t);
          visual.farmerY = lerp(fromY, toY, t);
          redraw();
        }, easeOutCubic, signal).catch(() => {});

        visual.farmerX = toX;
        visual.farmerY = toY;
        applyAction(state, action);
        redraw();
        break;
      }

      case 'goTo': {
        const fromX = action.from.x;
        const fromY = action.from.y;
        const toX   = action.to.x;
        const toY   = action.to.y;
        const dist  = Math.abs(toX - fromX) + Math.abs(toY - fromY);
        const goDur = dur(Math.min(150 + 60 * dist, 700));

        visual.farmerFacing = toX >= fromX;

        await animate(goDur, (t) => {
          visual.farmerX = lerp(fromX, toX, t);
          visual.farmerY = lerp(fromY, toY, t);
          redraw();
        }, easeOutCubic, signal).catch(() => {});

        visual.farmerX = toX;
        visual.farmerY = toY;
        applyAction(state, action);
        redraw();
        break;
      }

      case 'plant': {
        applyAction(state, action);
        const key = `${action.x},${action.y}`;
        visual.tilePops[key] = { scale: 1 };

        await animate(dur(POP_MS), (t) => {
          visual.tilePops[key].scale = t < 0.5
            ? lerp(1, 1.15, t * 2)
            : lerp(1.15, 1, (t - 0.5) * 2);
          redraw();
        }, easeOutBack, signal).catch(() => {});

        visual.tilePops[key] = { scale: 1 };
        redraw();
        break;
      }

      case 'water': {
        // Water droplets animation
        const drops = [];
        for (let i = 0; i < 4; i++) {
          drops.push({
            x: action.x, y: action.y,
            ox: (i - 1.5) * 8,
            oy: 0,
            alpha: 1,
          });
        }
        visual.droplets = drops;

        applyAction(state, action);
        const wKey = `${action.x},${action.y}`;
        visual.tilePops[wKey] = { scale: 1 };

        await animate(dur(POP_MS), (t) => {
          drops.forEach((d, i) => {
            d.oy = lerp(0, -14 - i * 3, t);
            d.alpha = lerp(1, 0, t);
          });
          visual.tilePops[wKey].scale = t < 0.5
            ? lerp(1, 1.1, t * 2)
            : lerp(1.1, 1, (t - 0.5) * 2);
          redraw();
        }, easeOutCubic, signal).catch(() => {});

        visual.droplets = [];
        visual.tilePops[wKey] = { scale: 1 };
        redraw();
        break;
      }

      case 'harvest': {
        // Lift the crop, arc a coin to the counter
        const { x, y } = action;
        const center = renderer.tileCenter(x, y);
        const coinTarget = document.getElementById('coin-counter');
        const coinRect = coinTarget?.getBoundingClientRect();
        const canvasRect = document.getElementById('farm-canvas')?.getBoundingClientRect();

        applyAction(state, action);

        if (!reduced && coinRect && canvasRect) {
          const targetX = coinRect.left + coinRect.width / 2 - canvasRect.left;
          const targetY = coinRect.top + coinRect.height / 2 - canvasRect.top;

          await animate(dur(HARVEST_COIN_MS), (t) => {
            // Coin arcs up then to counter
            const arc = Math.sin(t * Math.PI) * -40;
            visual.flyingCoin = {
              x: lerp(center.x, targetX, t),
              y: lerp(center.y, targetY, t) + arc,
              alpha: lerp(1, 0, t > 0.7 ? (t - 0.7) / 0.3 : 0),
            };
            redraw();
          }, easeOutCubic, signal).catch(() => {});

          visual.flyingCoin = null;
          onCoinArc?.();
        } else {
          onCoinArc?.();
        }

        redraw();
        break;
      }

      case 'bump': {
        // Shake farmer
        const shakeAmt = 2;
        await animate(dur(SHAKE_MS), (t) => {
          visual.farmerShakeX = Math.sin(t * Math.PI * 6) * shakeAmt * (1 - t);
          visual.bubble = '?';
          redraw();
        }, easeOutCubic, signal).catch(() => {});

        visual.farmerShakeX = 0;
        visual.bubble = null;
        applyAction(state, action);
        redraw();

        if (dur(60) > 0) await wait(dur(60), signal).catch(() => {});
        break;
      }

      case 'noop': {
        visual.bubble = '?';
        redraw();
        applyAction(state, action);

        if (dur(200) > 0) await wait(dur(200), signal).catch(() => {});
        visual.bubble = null;
        redraw();
        break;
      }

      default:
        applyAction(state, action);
        redraw();
    }
  }

  visual.bubble = null;
  redraw();
  return state;
}

/**
 * Till-in wave animation on level load.
 */
export async function animateLevelLoad(state, renderer, signal) {
  if (prefersReducedMotion()) {
    renderer.draw(state, {});
    return;
  }

  const { width: W, height: H } = state;
  const totalDiag = W + H - 2;
  const waveDur = 450;
  const stepDur = waveDur / (totalDiag + 1);

  const visual = {
    farmerX: state.farmer.x,
    farmerY: state.farmer.y,
    farmerFacing: true,
    tilePops: {},
    tileReveal: {},
    farmerShakeX: 0,
    bubble: null,
    droplets: [],
    trail: [],
    mismatches: [],
  };

  // Start with all tiles hidden
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      visual.tileReveal[`${x},${y}`] = 0;
    }
  }

  // Reveal tiles in diagonal wave
  const promises = [];
  for (let d = 0; d <= totalDiag; d++) {
    const delay = d * stepDur;
    for (let y = 0; y < H; y++) {
      const x = d - y;
      if (x < 0 || x >= W) continue;
      const key = `${x},${y}`;
      promises.push(
        wait(delay, signal)
          .then(() => animate(120, (t) => {
            visual.tileReveal[key] = t;
          }, easeOutCubic, signal))
          .catch(() => {})
      );
    }
  }

  // Poll and redraw during wave
  const drawInterval = setInterval(() => {
    if (signal?.aborted) {
      clearInterval(drawInterval);
      return;
    }
    renderer.draw(state, visual);
  }, 16);

  try {
    await Promise.all(promises);
  } finally {
    clearInterval(drawInterval);
  }
  if (!signal?.aborted) {
    renderer.draw(state, visual);
  }
}
