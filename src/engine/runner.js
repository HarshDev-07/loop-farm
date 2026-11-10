/**
 * runner.js — Main-thread helper: spins up the worker, times it out.
 */

/**
 * Run student code against a level using a Web Worker.
 * @param {string} code
 * @param {object} level
 * @returns {Promise<{ status, actions, goal, state, error }>}
 */
export function runCode(code, level) {
  return new Promise((resolve) => {
    let worker;
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker?.terminate();
        resolve({
          status: 'timeout',
          actions: [],
          goal: null,
          state: null,
          error: { message: 'Your code took too long. Is there an infinite loop?', line: null },
        });
      }
    }, 2000);

    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    } catch (e) {
      clearTimeout(timeout);
      resolve({
        status: 'error',
        actions: [],
        goal: null,
        state: null,
        error: { message: `Something went wrong: ${e.message}`, line: null },
      });
      return;
    }

    worker.onmessage = (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        worker.terminate();
        resolve(e.data);
      }
    };

    worker.onerror = (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        worker.terminate();
        resolve({
          status: 'error',
          actions: [],
          goal: null,
          state: null,
          error: { message: e.message || 'Something went wrong.', line: null },
        });
      }
    };

    worker.postMessage({ code, level });
  });
}
