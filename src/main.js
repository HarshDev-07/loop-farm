/**
 * main.js — App entry point. Wires together all modules.
 */
import { levels } from './levels/index.js';
import { createState } from './engine/state.js';
import { runCode } from './engine/runner.js';
import { createRenderer } from './game/renderer.js';
import { playActions, animateLevelLoad } from './game/animator.js';
import { createEditor } from './ui/editor.js';
import { setMessage, setLevelInfo, setApiPanel, showWinModal, hideModal, evaluateResult } from './ui/panels.js';
import { renderTrail } from './ui/levelSelect.js';
import { progress } from './ui/progress.js';
import { sound } from './ui/sound.js';

// ---- State ----
let currentLevel = null;
let currentState = null;
let editor = null;
let renderer = null;
let abortController = null;
let isRunning = false;
let speed = 1;
let failedRuns = 0;
let loadAbort = null;

const codeMemory = {};

// ---- Init ----
const canvas = document.getElementById('farm-canvas');
renderer = createRenderer(canvas);

const editorWrap = document.getElementById('editor-wrap');
editor = createEditor(editorWrap, '// Loading...', handleRun);

// ---- Level loading ----
function loadLevel(levelId) {
  const level = levels.find(l => l.id === levelId);
  if (!level) return;

  // Preserve unsaved code before switching
  if (currentLevel && editor) {
    codeMemory[currentLevel.id] = editor.getValue();
  }

  // Cancel any running animations or previous level loads
  if (isRunning) {
    handleStop();
  }
  loadAbort?.abort();
  loadAbort = new AbortController();
  const loadSignal = loadAbort.signal;

  currentLevel = level;
  currentState = createState(level);
  failedRuns = 0;

  if (!codeMemory[levelId]) {
    codeMemory[levelId] = level.starterCode;
  }
  editor.setValue(codeMemory[levelId]);
  editor.clearHighlight();

  setLevelInfo(level);
  setApiPanel(level);
  setMessage('Write code, then press Run (Ctrl+Enter).', 'neutral');
  updateRunButton('run');
  updateCoinCounter(0);

  resizeCanvas();

  animateLevelLoad(createState(level), renderer, loadSignal).then(() => {
    if (!loadSignal.aborted && !isRunning) {
      renderer.draw(currentState, {});
    }
  });

  progress.setLastLevel(levelId);
  renderTrail(levels, levelId, loadLevel);

  const hintText = document.getElementById('hint-text');
  const hintBtn  = document.getElementById('btn-hint');
  if (hintText) { hintText.hidden = true; hintText.textContent = level.hint || ''; }
  if (hintBtn)  hintBtn.textContent = 'Hint';

  updateCanvasDescription();
}

function resizeCanvas() {
  if (!currentLevel) return;
  const stage = document.querySelector('.canvas-wrap');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  canvas.style.width  = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  renderer.resize();
}

// ---- Run / Stop / Reset ----
async function handleRun() {
  if (isRunning) { handleStop(); return; }
  if (!currentLevel) return;

  sound.unlock();

  const code = editor.getValue();
  codeMemory[currentLevel.id] = code;
  editor.clearHighlight();

  isRunning = true;
  updateRunButton('stop');
  setMessage('Running...', 'progress');

  abortController = new AbortController();
  const signal = abortController.signal;

  currentState = createState(currentLevel);
  updateCoinCounter(0);

  const result = await runCode(code, currentLevel);

  if (signal.aborted) return;

  if (result.actions?.length > 0) {
    try {
      await playActions(createState(currentLevel), result.actions, {
        renderer,
        speed,
        signal,
        onAction: (action, st) => {
          updateCoinCounter(st.coins);
          playActionSound(action);
        },
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        currentState = createState(currentLevel);
        renderer.draw(currentState, {});
        isRunning = false;
        updateRunButton('run');
        return;
      }
    }
  }

  if (signal.aborted) return;

  const evaluation = evaluateResult(result, currentLevel, code);

  if (result.goal && !result.goal.met && result.goal.mismatches?.length > 0) {
    renderer.draw(result.state || currentState, { mismatches: result.goal.mismatches });
  }

  if (evaluation.stars > 0) {
    progress.saveStars(currentLevel.id, evaluation.stars);
    renderTrail(levels, currentLevel.id, loadLevel);
    sound.complete();
    setMessage(evaluation.message, 'success');
    isRunning = false;
    updateRunButton('run-again');

    setTimeout(() => {
      showWinModal({
        stars: evaluation.stars,
        lineCount: evaluation.lineCount,
        parLines: currentLevel.parLines,
        level: currentLevel,
        onNext: () => {
          const next = levels.find(l => l.id === currentLevel.id + 1);
          loadLevel(next ? next.id : levels[0].id);
        },
        onImprove: () => editor.focus(),
      });
    }, 400);
  } else {
    failedRuns++;
    setMessage(evaluation.message, 'error', evaluation.lineNum);
    if (evaluation.lineNum) editor.highlightLine(evaluation.lineNum);

    if (failedRuns >= 3) {
      const hintArea = document.getElementById('hint-area');
      if (hintArea && !hintArea.querySelector('.hint-prompt')) {
        const prompt = document.createElement('button');
        prompt.className = 'btn-quiet hint-prompt';
        prompt.textContent = 'Need a hint?';
        prompt.onclick = () => { document.getElementById('btn-hint')?.click(); prompt.remove(); };
        hintArea.appendChild(prompt);
      }
    }

    isRunning = false;
    updateRunButton('run-again');
  }

  updateCoinCounter(result.state?.coins ?? 0);
}

function handleStop() {
  abortController?.abort();
  abortController = null;
  isRunning = false;
  currentState = createState(currentLevel);
  renderer.draw(currentState, {});
  setMessage('Stopped. Reset field or Run again.', 'neutral');
  updateRunButton('run');
}

function handleReset() {
  if (isRunning) { abortController?.abort(); abortController = null; isRunning = false; }
  currentState = createState(currentLevel);
  renderer.draw(currentState, {});
  updateCoinCounter(0);
  updateRunButton('run');
  setMessage('Field reset. Write code and press Run.', 'neutral');
  editor.clearHighlight();
}

// ---- UI helpers ----
function updateRunButton(state) {
  const btn = document.getElementById('btn-run');
  if (!btn) return;
  if (state === 'run') {
    btn.textContent = 'Run';
    btn.setAttribute('aria-label', 'Run code (Ctrl+Enter)');
    btn.disabled = false;
  } else if (state === 'stop') {
    btn.textContent = 'Stop';
    btn.setAttribute('aria-label', 'Stop animation');
    btn.disabled = false;
  } else {
    btn.textContent = 'Run again';
    btn.disabled = false;
  }
}

function updateCoinCounter(coins) {
  const el = document.getElementById('coin-count');
  if (el) el.textContent = String(coins);
}

function updateCanvasDescription() {
  const desc = document.getElementById('canvas-description');
  if (!desc || !currentState) return;
  const { farmer, width, height } = currentState;
  desc.textContent = `Farmer at column ${farmer.x + 1}, row ${farmer.y + 1}. Grid is ${width} wide by ${height} tall.`;
}

function playActionSound(action) {
  if (action.type === 'plant')   sound.plant();
  if (action.type === 'water')   sound.water();
  if (action.type === 'harvest') sound.harvest();
  if (action.type === 'bump' || action.type === 'noop') sound.bump();
}

// ---- Event listeners ----
document.getElementById('btn-run')?.addEventListener('click', handleRun);
document.getElementById('btn-reset-field')?.addEventListener('click', handleReset);

document.getElementById('btn-hint')?.addEventListener('click', () => {
  const hintText = document.getElementById('hint-text');
  const hintBtn  = document.getElementById('btn-hint');
  if (!hintText) return;
  hintText.hidden = !hintText.hidden;
  if (hintBtn) hintBtn.textContent = hintText.hidden ? 'Hint' : 'Hide hint';
});

document.getElementById('btn-restore')?.addEventListener('click', () => {
  if (!currentLevel) return;
  editor.setValue(currentLevel.starterCode);
  codeMemory[currentLevel.id] = currentLevel.starterCode;
});

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    speed = Number(btn.dataset.speed);
    try { localStorage.setItem('loopfarm.speed', String(speed)); } catch {}
  });
});

try {
  const savedSpeed = localStorage.getItem('loopfarm.speed');
  if (savedSpeed !== null) {
    speed = Number(savedSpeed);
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.speed) === speed);
    });
  }
} catch {}

const muteBtn = document.getElementById('btn-mute');
if (muteBtn) {
  muteBtn.textContent = sound.isMuted() ? 'Sound off' : 'Sound on';
  muteBtn.addEventListener('click', () => {
    muteBtn.textContent = sound.toggle() ? 'Sound off' : 'Sound on';
  });
}

document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
  if (confirm('Reset all progress? Your stars and unlocked levels will be cleared.')) {
    progress.reset();
    loadLevel(1);
  }
});

document.getElementById('tip-dismiss')?.addEventListener('click', () => {
  const tip = document.getElementById('run-tip');
  if (tip) tip.hidden = true;
  try { localStorage.setItem('loopfarm.tip-dismissed', '1'); } catch {}
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (currentState) renderer.draw(currentState, {});
  if (currentLevel) renderTrail(levels, currentLevel.id, loadLevel);
});

document.addEventListener('click', () => sound.unlock(), { once: true });
document.addEventListener('keydown', () => sound.unlock(), { once: true });

// Show run tip once per page load
try {
  if (!localStorage.getItem('loopfarm.tip-dismissed')) {
    const tip = document.getElementById('run-tip');
    if (tip) {
      tip.hidden = false;
      setTimeout(() => {
        const btn = document.getElementById('btn-run');
        btn?.classList.add('pulse');
        btn?.addEventListener('animationend', () => btn.classList.remove('pulse'), { once: true });
      }, 500);
    }
  }
} catch {}

// ---- Boot ----
const startLevel = progress.getLastLevel() || 1;
loadLevel(startLevel);
editor.focus();
