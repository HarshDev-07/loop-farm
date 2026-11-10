/**
 * panels.js — Level info, messages, stars modal, win/fail flow.
 */
import { Icons } from './icons.js';
import { analyzeCode } from '../engine/analyze.js';

/** Set message area state: neutral | progress | success | error */
export function setMessage(text, state = 'neutral', lineNum = null) {
  const area = document.getElementById('message-area');
  if (!area) return;

  const iconMap = {
    neutral:  Icons.info,
    progress: Icons.progress,
    success:  Icons.check,
    error:    Icons.error,
  };

  const prefix = lineNum ? `Line ${lineNum}: ` : '';
  area.innerHTML = `
    <div class="message ${state}">
      <span class="msg-icon">${iconMap[state] || Icons.info}</span>
      <span class="msg-text">${prefix}${escapeHtml(text)}</span>
    </div>
  `;
}

/** Set level info in the left panel */
export function setLevelInfo(level) {
  const title = document.getElementById('level-title');
  const story = document.getElementById('level-story');
  const goal  = document.getElementById('level-goal');

  if (title) title.textContent = `Level ${level.id}: ${level.title}`;
  if (story) story.textContent = level.story;
  if (goal)  goal.textContent  = `Goal: ${levelGoalText(level)}`;

  // Hint
  const hintText = document.getElementById('hint-text');
  const hintBtn  = document.getElementById('btn-hint');
  if (hintText) {
    hintText.textContent = level.hint || '';
    hintText.hidden = true;
  }
  if (hintBtn) hintBtn.textContent = 'Hint';
}

function levelGoalText(level) {
  if (level.goal.type === 'harvestCount') {
    return `Harvest ${level.goal.count} crops.`;
  }
  if (level.goal.type === 'fieldPattern') {
    // Count non-wildcard non-empty target tiles
    let count = 0;
    let type = '';
    for (const row of level.goal.pattern) {
      for (const c of row) {
        if (c === 's') { count++; type = 'seeds'; }
        if (c === 'R') { count++; type = 'ripe crops'; }
      }
    }
    return count ? `${count} ${type}.` : 'Match the pattern.';
  }
  return '';
}

/** Update the API panel with enabled functions */
export function setApiPanel(level) {
  const list = document.getElementById('api-list');
  if (!list) return;

  const descriptions = {
    moveRight: 'Move the farmer one tile to the right.',
    moveLeft:  'Move the farmer one tile to the left.',
    moveUp:    'Move the farmer one tile up.',
    moveDown:  'Move the farmer one tile down.',
    goTo:      'goTo(x, y) — jump to any tile.',
    plant:     'Plant a seed on the current tile.',
    water:     'Water the seed on the current tile.',
    harvest:   'Harvest a ripe crop; earns 1 coin.',
    canMove:   "canMove('right') — true if that direction is clear.",
    isRock:    'isRock(x, y) — true if that tile is a rock.',
    getX:      'getX() — farmer column (0 = left).',
    getY:      'getY() — farmer row (0 = top).',
    GRID_WIDTH:  'Width of the grid in tiles.',
    GRID_HEIGHT: 'Height of the grid in tiles.',
  };

  list.innerHTML = level.api.map(name => `
    <li>
      <code>${name}</code>
      <span> — ${descriptions[name] || ''}</span>
    </li>
  `).join('');
}

/** Show the level-complete modal */
export function showWinModal(opts) {
  const { stars, lineCount, parLines, level, onNext, onImprove } = opts;

  const backdrop = document.getElementById('modal-backdrop');
  const title    = document.getElementById('modal-title');
  const detail   = document.getElementById('modal-detail');
  const starsRow = document.getElementById('stars-row');
  const btnNext  = document.getElementById('btn-next-level');
  const btnImp   = document.getElementById('btn-improve');

  if (!backdrop) return;

  if (level.id >= 10) {
    title.textContent = 'You finished Loop Farm!';
    detail.textContent = `All levels complete. Well done.`;
    if (btnNext) btnNext.textContent = 'Play again';
  } else {
    title.textContent = 'Level complete';
    detail.textContent = `Your code: ${lineCount} line${lineCount !== 1 ? 's' : ''}. Par: ${parLines}.`;
    if (btnNext) btnNext.textContent = 'Next level';
  }

  // Build star SVGs
  if (starsRow) {
    starsRow.innerHTML = [1, 2, 3].map((i) =>
      `<span class="star-shape" id="star-${i}" aria-hidden="true">${Icons.star(i <= stars)}</span>`
    ).join('');

    // Stamp in one by one
    [1, 2, 3].forEach((i, idx) => {
      if (i <= stars) {
        setTimeout(() => {
          const el = document.getElementById(`star-${i}`);
          if (el) el.classList.add('shown');
        }, idx * 120);
      } else {
        const el = document.getElementById(`star-${i}`);
        if (el) el.classList.add('shown');
      }
    });
  }

  if (btnNext) {
    btnNext.onclick = () => { hideModal(); onNext?.(); };
  }
  if (btnImp) {
    btnImp.onclick = () => { hideModal(); onImprove?.(); };
  }

  backdrop.hidden = false;
  backdrop.focus?.();

  // Trap focus
  trapFocus(backdrop);
  backdrop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
}

export function hideModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.hidden = true;
}

function trapFocus(el) {
  const focusable = el.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  focusable[0].focus();

  el.addEventListener('keydown', function handler(e) {
    if (e.key !== 'Tab') return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Evaluate run result and return { stars, message, messageState, lineNum } */
export function evaluateResult(result, level, code) {
  const { status, goal, error, actions } = result;

  if (status === 'timeout') {
    return { stars: 0, message: error.message, messageState: 'error', lineNum: null };
  }

  if (status === 'limit') {
    return { stars: 0, message: error?.message || 'Too many actions!', messageState: 'error', lineNum: null };
  }

  if (status === 'error') {
    return { stars: 0, message: error.message, messageState: 'error', lineNum: error.line };
  }

  if (!goal?.met) {
    return {
      stars: 0,
      message: `${goal?.progressText || 'Goal not met.'} Check the marked tiles.`,
      messageState: 'error',
      lineNum: null,
    };
  }

  // Goal met — check required constructs
  const { constructs, lineCount } = analyzeCode(code);
  const missing = level.requireConstructs?.find(c => !constructs[c]);
  if (missing) {
    const term = missing === 'function' ? '`function`' : `\`${missing}\` loop`;
    return {
      stars: 0,
      message: `The farm looks right, but this level needs a ${term}. Rewrite it with one to finish.`,
      messageState: 'error',
      lineNum: null,
    };
  }

  // Count wasted actions
  const wasted = actions?.filter(a => a.type === 'bump' || a.type === 'noop').length ?? 0;

  let stars = 1;
  if (wasted === 0) stars = 2;
  if (wasted === 0 && lineCount <= level.parLines) stars = 3;

  return {
    stars,
    lineCount,
    message: `Level complete. ${stars} star${stars !== 1 ? 's' : ''}.`,
    messageState: 'success',
    lineNum: null,
    mismatches: [],
  };
}
