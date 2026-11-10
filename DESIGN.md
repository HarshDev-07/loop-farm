# DESIGN.md — Loop Farm

Design plan and QA notes. Under 60 lines per plan rules.

## Colour tokens (from plan §6.3)
- Background: `--ink` (#1b2433) top bar; `--slate` (#222d42) editor panel; `--meadow` (#98d160) stage
- Accent: `--sunflower` (#f4c430) — Run button only. No other bright buttons.
- Semantic: `--leaf` success/done nodes, `--radish-text` errors, `--sky` info/code highlights
- Canvas: `--furrow`/`--furrow-alt` alternating soil tiles; `--furrow-wet` for watered tiles

## Typography
- Bricolage Grotesque 700: wordmark, level title, modal title
- Atkinson Hyperlegible 400/700: all UI text, story, messages
- JetBrains Mono 400: editor only, 15px, ligatures off

## Layout
- 58% stage (meadow, canvas directly on meadow — no card wrapper), 42% editor panel
- Slim 56px ink top bar: wordmark left, level trail centre, coin counter right
- Editor is one continuous dark panel, not stacked cards. File name `farm.js` in header.
- Run is the only sunflower button on screen. Speed and Hint are quiet text controls.

## Shape radii
- Buttons/level nodes: pill (999px)
- Editor panel, message area: 4px
- Canvas tiles: 6px
- Modal: 12px with shadow (only element with shadow)

## Anti-slop decisions
- No emoji anywhere — sprites are code-drawn Path2D shapes
- No gradient washes, glassmorphism or glows — flat colour only
- No stock CodeMirror theme — custom built from design tokens
- No "Great job!" confetti — stars stamp in one by one with a thump sound
- No placeholder copy — story text is specific to each level's farm task
- No decorative numbering, no tracked caps labels, no middle-dot strings

## Motion principles
- Only answers an action or is one deliberate moment (level load wave)
- Farmer slides; tiles pop on plant/water; harvest coin arcs to counter
- Bump = 2px shake + "?" bubble; level complete = star stamps 120ms apart
- prefers-reduced-motion: instant moves, no shake, no arcs

## QA notes (updated after each design check phase)
- Verified: farm canvas is focal point; Run button is the only bright element
- Verified: no emoji in any file; only tokens from §6.3 used
- Verified: fonts load via @fontsource packages (no Google Fonts links)
