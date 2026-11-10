/**
 * progress.js — localStorage wrapper for saving/loading progress.
 */

const KEY = 'loopfarm.progress.v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { completed: {}, lastLevel: 1 };
  } catch {
    return { completed: {}, lastLevel: 1 };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — game still works in memory
  }
}

let _data = load();

export const progress = {
  getLastLevel() { return _data.lastLevel ?? 1; },
  setLastLevel(id) { _data.lastLevel = id; save(_data); },

  getStars(levelId) { return _data.completed[String(levelId)]?.stars ?? 0; },

  saveStars(levelId, stars) {
    const current = _data.completed[String(levelId)]?.stars ?? 0;
    if (stars > current) {
      _data.completed[String(levelId)] = { stars };
      save(_data);
    }
  },

  isCompleted(levelId) {
    return (_data.completed[String(levelId)]?.stars ?? 0) > 0;
  },

  reset() {
    _data = { completed: {}, lastLevel: 1 };
    save(_data);
  },

  totalStars() {
    return Object.values(_data.completed).reduce((s, v) => s + (v.stars ?? 0), 0);
  },
};
