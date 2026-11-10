/**
 * goals.js — Check if a level goal has been met.
 * No DOM/canvas imports allowed.
 */

/**
 * @param {object} level
 * @param {object} state
 * @returns {{ met: boolean, mismatches: [{x, y}], progressText: string }}
 */
export function checkGoal(level, state) {
  const { goal } = level;

  if (goal.type === 'fieldPattern') {
    const mismatches = [];
    let total = 0;
    let correct = 0;

    for (let y = 0; y < goal.pattern.length; y++) {
      const row = goal.pattern[y];
      for (let x = 0; x < row.length; x++) {
        const expected = row[x];
        if (expected === '*') continue; // wildcard — don't care
        total++;
        const actual = state.tiles[y]?.[x];
        if (actual === expected) {
          correct++;
        } else {
          mismatches.push({ x, y });
        }
      }
    }

    const met = mismatches.length === 0;
    const progressText = met
      ? 'All tiles match.'
      : `${correct} of ${total} tiles match.`;
    return { met, mismatches, progressText };
  }

  if (goal.type === 'harvestCount') {
    const met = state.coins >= goal.count;
    const progressText = met
      ? `${state.coins} crops harvested.`
      : `${state.coins} of ${goal.count} crops harvested.`;
    return { met, mismatches: [], progressText };
  }

  return { met: false, mismatches: [], progressText: 'Unknown goal type.' };
}
