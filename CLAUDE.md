# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, pass-and-play tic-tac-toe game styled as pen strokes on ruled
notebook paper. Static HTML/CSS/JS — no framework, no build step, no backend,
no package.json. See `PRD.md` for full product scope (goals, non-goals,
functional requirements) and `README.md` for a player-facing overview.

## Commands

There is no build, lint, or test tooling in this repo — it's plain static
files served as-is. To run it locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or just open `index.html` directly in a browser.

Deployment is GitHub Pages, serving the `main` branch root directly
(`hevgo/claude-webpage-glasses`, public repo) — pushing to `main` is the
deploy step. Live at https://hevgo.github.io/claude-webpage-glasses/.

## Architecture

Three files carry all the logic, split by concern:

- `index.html` — static markup shell only. The board is an `<svg id="boardSvg" viewBox="0 0 300 300">` with three empty `<g>` groups (`gridLines`, `marks`, `strike`) that `script.js` populates at runtime, overlaid by an empty `#cellGrid` container that `script.js` fills with 9 real `<button>` elements for click/keyboard interaction.
- `style.css` — all design tokens and layout. No JS-driven styling beyond class/attribute toggles.
- `script.js` — a single IIFE, no modules/bundler. Owns all board rendering and game state.

### Hand-drawn rendering (script.js)

Every visible stroke (grid lines, X/O marks, the winning strike-through, and
the tally-mark scoreboard) is generated at draw time, not pre-authored SVG
path data. The pipeline is:

1. `jitterLine(x1, y1, x2, y2, segments, jitter)` / `jitterCircle(cx, cy, r, jitter)` sample points along the intended shape with randomized perpendicular offset (tapered to zero at line endpoints so strokes "land" cleanly).
2. `smoothPath(points)` turns those sampled points into a smooth SVG path (`M` + a chain of `Q` commands) — this is the shared primitive for lines, circles, and tallies alike.
3. `animateDraw(path)` uses `path.getTotalLength()` + the Web Animations API to animate `stroke-dashoffset`, so each mark appears to be drawn stroke-by-stroke. This is skipped (draws instantly) when `prefers-reduced-motion` is set.

Board coordinates are on a fixed 300×300 grid (cells are 100×100, centers at
`cellCenter(i)` = `{x: 50 + col*100, y: 50 + row*100}`), independent of the
element's rendered CSS size.

Game state (`board`, `current`, `gameOver`, `scores`) is plain in-memory JS —
it resets on reload; there is no persistence layer.

### Theming (style.css)

Colors are CSS custom properties defined three times to cover all theme
states, per the pattern this repo follows for artifact/theme-aware pages:

1. bare `:root` — light palette (default/fallback)
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` — OS-level dark mode
3. `:root[data-theme="dark"] { ... }` — explicit in-app override, if one is ever added

All components consume the tokens (`--paper`, `--ink-navy`, `--ink-red`,
etc.) rather than hardcoding colors, so new UI should do the same rather than
adding a fourth place colors are defined.

### Fonts

`fonts/*.woff2` (Kalam for the handwritten headline, IBM Plex Mono for UI
text) are self-hosted rather than linked from Google Fonts, and declared via
`@font-face` in `style.css`. Keep new fonts self-hosted the same way rather
than adding a CDN dependency.
