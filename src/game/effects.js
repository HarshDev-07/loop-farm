/**
 * effects.js — Coin arcs, bubbles, farmer shake, water droplets.
 * Used by animator.js.
 */

/** Easing functions */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** lerp */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Wait for a given duration (respects reduced-motion by using 0ms if requested).
 */
export function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); });
  });
}

/**
 * Animate a value over time using requestAnimationFrame.
 * @param {number} duration - ms
 * @param {function} onFrame - called with (progress 0..1, elapsed ms)
 * @param {function} easing
 * @param {AbortSignal} signal
 */
export function animate(duration, onFrame, easing = easeOutCubic, signal = null) {
  return new Promise((resolve, reject) => {
    if (duration <= 0) {
      onFrame(1, 0);
      resolve();
      return;
    }

    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }

    let start = null;
    let rafId;

    function frame(ts) {
      if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
      if (start === null) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / duration, 1);
      const t = easing(raw);
      onFrame(t, elapsed);
      if (raw < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    rafId = requestAnimationFrame(frame);
    signal?.addEventListener('abort', () => {
      cancelAnimationFrame(rafId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/** Check prefers-reduced-motion */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
