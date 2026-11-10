/**
 * editor.js — CodeMirror 6 editor with custom theme.
 * Falls back to a styled textarea if setup fails.
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine, Decoration } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { indentWithTab } from '@codemirror/commands';

// Custom highlight style using design tokens
const farmHighlight = HighlightStyle.define([
  { tag: tags.keyword,           color: '#f4c430' },            // --sunflower
  { tag: tags.string,            color: '#9bdc8a' },
  { tag: tags.number,            color: '#ff8fa3' },
  { tag: tags.function(tags.variableName), color: '#bfe6f2' },  // --sky
  { tag: tags.comment,           color: '#8592ad', fontStyle: 'italic' },
  { tag: tags.variableName,      color: '#f5f7ef' },            // --chalk
  { tag: tags.operator,          color: '#f5f7ef' },
  { tag: tags.punctuation,       color: '#8592ad' },
  { tag: tags.bool,              color: '#ff8fa3' },
  { tag: tags.null,              color: '#ff8fa3' },
  { tag: tags.definition(tags.variableName), color: '#bfe6f2' },
]);

// Error line highlighting
const setErrorLineEffect = StateEffect.define();
const errorLineField = StateField.define({
  create() { return Decoration.none; },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setErrorLineEffect)) {
        if (e.value === null) {
          underlines = Decoration.none;
        } else {
          underlines = Decoration.set([
            Decoration.line({ class: 'cm-error-line' }).range(e.value)
          ]);
        }
      }
    }
    return underlines;
  },
  provide: f => EditorView.decorations.from(f)
});

// Editor theme
const farmTheme = EditorView.theme({
  '&': {
    backgroundColor: '#222d42',  // --slate
    color: '#f5f7ef',            // --chalk
    height: '100%',
    fontSize: '15px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: '#f4c430',       // --sunflower
    lineHeight: '1.6',
    fontVariantLigatures: 'none',
  },
  '.cm-cursor': { borderLeftColor: '#f4c430' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.04)' },
  '.cm-error-line': { backgroundColor: 'rgba(216, 54, 93, 0.25) !important' },
  '.cm-gutters': {
    backgroundColor: '#34425d',  // --slate-line
    color: '#8592ad',
    border: 'none',
    borderRight: '1px solid #34425d',
  },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.06)' },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(244,196,48,0.25) !important',
  },
  '.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(244,196,48,0.3) !important',
  },
  '.cm-scroller': { overflow: 'auto' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-cursor': { borderLeftWidth: '2px' },
}, { dark: true });

export function createEditor(container, initialCode, onRun) {
  let view = null;

  try {
    view = new EditorView({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        javascript(),
        syntaxHighlighting(farmHighlight),
        errorLineField,
        farmTheme,
        keymap.of([
          indentWithTab,
          {
            key: 'Ctrl-Enter',
            mac: 'Cmd-Enter',
            run() { onRun?.(); return true; },
          },
        ]),
        EditorView.lineWrapping,
      ],
      parent: container,
    });
  } catch (e) {
    // Fallback: styled textarea
    console.warn('CodeMirror init failed, using textarea fallback:', e);
    const ta = document.createElement('textarea');
    ta.value = initialCode;
    ta.style.cssText = `
      width: 100%; height: 100%; background: #222d42; color: #f5f7ef;
      font-family: 'JetBrains Mono', monospace; font-size: 15px;
      border: none; resize: none; padding: 8px; outline: none;
      line-height: 1.6;
    `;
    container.appendChild(ta);
    return {
      getValue: () => ta.value,
      setValue: (code) => { ta.value = code; },
      highlightLine: () => {},
      clearHighlight: () => {},
      focus: () => ta.focus(),
    };
  }

  function getValue() {
    return view.state.doc.toString();
  }

  function setValue(code) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: code },
    });
    clearHighlight();
  }

  function highlightLine(lineNum) {
    clearHighlight();
    if (!lineNum || lineNum < 1) return;
    try {
      const line = view.state.doc.line(lineNum);
      view.dispatch({
        effects: setErrorLineEffect.of(line.from),
        selection: { anchor: line.from },
        scrollIntoView: true,
      });
    } catch (_) {}
  }

  function clearHighlight() {
    if (view) {
      view.dispatch({ effects: setErrorLineEffect.of(null) });
    }
  }

  function focus() {
    view.focus();
  }

  return { getValue, setValue, highlightLine, clearHighlight, focus };
}
