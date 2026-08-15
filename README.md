# Tic-Tac-Toe (Notebook Edition)

A pass-and-play tic-tac-toe board that looks like it's drawn in pen on ruled
notebook paper. Two players, one page, no backend.

## Play it

Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

No build step or dependencies — it's plain HTML, CSS, and JS.

## How it works

- Players alternate placing X (navy ink) and O (red ink) on a 3×3 grid.
- The grid, marks, and winning strike-through are all hand-jittered SVG
  paths, drawn stroke-by-stroke so each mark looks freshly written.
- Score is kept for the session as hand-drawn tally marks, alongside the
  plain number.
- "new game" clears the board and keeps the score; "reset scores" zeroes it.
- Fully keyboard-operable (tab to a square, Enter/Space to mark it) and
  respects `prefers-reduced-motion` and light/dark theme.

## Project structure

```
index.html    markup
style.css     design tokens, layout, notebook-paper styling
script.js     game logic + hand-drawn SVG rendering
fonts/        self-hosted Kalam (headline) and IBM Plex Mono (UI) woff2 files
PRD.md        product requirements for this demo
```

## Notes

This repo is currently private, so GitHub Pages isn't enabled. To host it
publicly, either make the repo public or enable Pages on a paid GitHub plan,
then point Pages at the `main` branch root.
