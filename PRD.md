# PRD: Tic-Tac-Toe (Notebook Edition)

*Status: shipped demo · Owner: TBD · Last updated: 2026-08-15*

## Summary

A browser-based, pass-and-play tic-tac-toe game styled as pen strokes on ruled
notebook paper. Two players share one device and one page — no accounts,
no backend, no install.

## Problem / opportunity

We wanted a small, self-contained demo project to exercise the repo/deploy
pipeline and show what a polished "just play in the browser" experience can
look like without any server-side complexity. Tic-tac-toe is a well-understood
game, so the interesting surface area is the presentation and feel, not the
rules.

## Goals

- Playable entirely client-side, in any modern browser, in under 5 seconds
  from page load.
- Feel tactile and a little bit handmade rather than like a generic UI-kit
  board.
- Keep score across multiple rounds in a session without needing an account.
- Fully usable by keyboard and screen reader, not just mouse/touch.

## Non-goals

- No AI/computer opponent — this is local two-player only.
- No accounts, persistence across sessions, or multiplayer over the network.
- No backend, database, or analytics.
- No mobile app; responsive web only.

## Target users

Two people on the same device (or one person testing/demoing the page) who
want a quick, low-stakes game — e.g. two people sharing a laptop, or someone
evaluating the repo as a demo of build quality.

## User stories

- As a player, I can tap an empty square to place my mark and see whose turn
  it is at all times.
- As a player, when someone wins I can see the winning line highlighted, not
  just a text message.
- As a player, I can start a new round without losing the running score.
- As a player, I can reset the score if we want to start a fresh series.
- As a keyboard or screen-reader user, I can tab through the board, hear the
  current turn and each square's state, and mark a square with Enter/Space.

## Functional requirements

| # | Requirement |
|---|---|
| 1 | 3×3 board; players alternate placing X and O, starting with X. |
| 2 | Detect a win across all 8 lines (3 rows, 3 columns, 2 diagonals) and a draw when the board fills with no winner. |
| 3 | On win, visually mark the winning line; on draw, show a distinct "draw" state. |
| 4 | Track wins for X, wins for O, and draws for the current session. |
| 5 | "New game" clears the board and keeps score; "reset scores" zeroes the tallies. |
| 6 | Board squares are keyboard-focusable buttons with accessible labels reflecting row, column, and current contents. |
| 7 | Respect `prefers-reduced-motion` by skipping draw-in animation. |
| 8 | Support both light and dark OS/browser themes. |

## Design direction

Notebook-paper visual identity: ruled background, a red margin rule, a
handwritten display face for the title, and a monospace face for UI text —
evoking two players trading pens on a shared page. X marks are navy ink, O
marks are red ink; strokes are drawn with slight hand-jitter and animate in
like they're being written. Score is kept as hand-drawn tally marks (groups
of five with a strike), not just numerals, echoing how the game is actually
scored on paper.

## Success criteria

- A new visitor can complete a full game without instructions.
- Board and controls are operable with keyboard only.
- No console errors; page loads and is interactive with no build step.

## Open questions

- Would a future version want an optional computer opponent, or is local
  two-player the permanent scope?
- Is session-only score sufficient, or should score persist across reloads
  (would require `localStorage`)?
- Should the repo host a public GitHub Pages deployment, which requires
  making the repo public or upgrading to a paid GitHub plan?
