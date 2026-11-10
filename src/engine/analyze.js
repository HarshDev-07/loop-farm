/**
 * analyze.js — Static code analysis. No DOM/canvas imports.
 */

/**
 * Strip block comments, line comments, and string literals from code.
 * This prevents false positives when students write 'for' inside a string.
 */
function stripCommentsAndStrings(code) {
  // Remove block comments first
  let result = code.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove line comments
  result = result.replace(/\/\/.*/g, ' ');
  // Remove template literals
  result = result.replace(/`[^`]*`/g, '""');
  // Remove double-quoted strings (simple, no escape handling needed for detection)
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Remove single-quoted strings
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return result;
}

/**
 * Count non-empty, non-comment-only lines.
 */
function countLines(code) {
  return code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//');
    })
    .length;
}

/**
 * @param {string} code
 * @returns {{ constructs: { for: boolean, while: boolean, if: boolean, function: boolean }, lineCount: number }}
 */
export function analyzeCode(code) {
  const stripped = stripCommentsAndStrings(code);

  const constructs = {
    for:      /\bfor\s*\(/.test(stripped),
    while:    /\bwhile\s*\(/.test(stripped),
    if:       /\bif\s*\(/.test(stripped),
    function: /\bfunction\b/.test(stripped) || /=>/.test(stripped),
  };

  const lineCount = countLines(code);

  return { constructs, lineCount };
}
