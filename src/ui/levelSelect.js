/**
 * levelSelect.js — Level trail in the top bar.
 */
import { Icons } from './icons.js';
import { progress } from './progress.js';

/**
 * @param {Array} levels
 * @param {number} currentId
 * @param {function} onSelect - called with levelId
 */
export function renderTrail(levels, currentId, onSelect) {
  const trail = document.getElementById('level-trail');
  if (!trail) return;

  const isWide = window.innerWidth > 800;

  if (!isWide) {
    // Compact
    const idx = levels.findIndex(l => l.id === currentId);
    trail.innerHTML = `
      <div class="trail-compact">
        <button id="trail-prev" aria-label="Previous level" ${idx <= 0 ? 'disabled' : ''}>&#8592;</button>
        <span>Level ${currentId} of ${levels.length}</span>
        <button id="trail-next" aria-label="Next level" ${idx >= levels.length - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
    `;
    document.getElementById('trail-prev')?.addEventListener('click', () => {
      const prev = levels[idx - 1];
      if (prev) onSelect(prev.id);
    });
    document.getElementById('trail-next')?.addEventListener('click', () => {
      const next = levels[idx + 1];
      if (next && (progress.isCompleted(currentId) || next.id <= unlockedUpTo(levels))) {
        onSelect(next.id);
      }
    });
    return;
  }

  const unlocked = unlockedUpTo(levels);

  const nodes = levels.map((level, i) => {
    const stars = progress.getStars(level.id);
    const isCurrent = level.id === currentId;
    const isDone    = progress.isCompleted(level.id);
    const isLocked  = level.id > unlocked;

    const starPips = stars > 0
      ? `<span class="star-pips">${'<span class="star-pip"></span>'.repeat(stars)}</span>`
      : '';

    const lockIcon = isLocked ? Icons.lock : '';
    const nodeNum  = isDone ? '' : (isCurrent ? String(level.id) : (isLocked ? '' : String(level.id)));

    const cls = [
      'trail-node',
      isDone ? 'done' : '',
      isCurrent ? 'current' : '',
      isLocked ? 'locked' : '',
    ].filter(Boolean).join(' ');

    const tabIndex = isLocked ? -1 : 0;
    const role = isLocked ? '' : 'button';

    return `
      <div class="${cls}" data-level="${level.id}"
           ${role ? `role="${role}"` : ''}
           tabindex="${tabIndex}"
           aria-label="Level ${level.id}: ${level.title}${isDone ? ' (completed)' : ''}${isLocked ? ' (locked)' : ''}"
           aria-current="${isCurrent ? 'step' : 'false'}">
        ${lockIcon || nodeNum}
        ${starPips}
        <span class="trail-tooltip">${level.title}</span>
      </div>
    `;
  });

  // Join with connector lines
  const parts = [];
  nodes.forEach((node, i) => {
    parts.push(node);
    if (i < nodes.length - 1) {
      const done = progress.isCompleted(levels[i].id);
      parts.push(`<div class="trail-line${done ? ' done' : ''}"></div>`);
    }
  });

  trail.innerHTML = `<div class="trail-track">${parts.join('')}</div>`;

  // Click / keyboard handlers
  trail.querySelectorAll('.trail-node:not(.locked)').forEach(el => {
    const id = parseInt(el.dataset.level, 10);
    el.addEventListener('click', () => onSelect(id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
    });
  });
}

function unlockedUpTo(levels) {
  // The first uncompleted level is the furthest unlocked
  for (let i = 0; i < levels.length; i++) {
    if (!progress.isCompleted(levels[i].id)) return levels[i].id;
  }
  return levels[levels.length - 1].id;
}
