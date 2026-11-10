/**
 * analyze.test.js — Additional tests for analyzeCode edge cases.
 */
import { describe, it, expect } from 'vitest';
import { analyzeCode } from '../src/engine/analyze.js';

describe('analyzeCode - edge cases', () => {
  it('handles empty code', () => {
    const result = analyzeCode('');
    expect(result.lineCount).toBe(0);
    expect(result.constructs.for).toBe(false);
  });

  it('does not count if inside single-quoted string', () => {
    const { constructs } = analyzeCode("const s = 'if (x) {}';");
    expect(constructs.if).toBe(false);
  });

  it('detects nested for loops', () => {
    const { constructs } = analyzeCode('for (let y=0; y<H; y++) { for (let x=0; x<W; x++) {} }');
    expect(constructs.for).toBe(true);
  });

  it('lineCount excludes blank lines', () => {
    const code = '\n\n\nplant();\n\n';
    expect(analyzeCode(code).lineCount).toBe(1);
  });
});
