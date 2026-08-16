# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page virtual glasses try-on MVP: upload a photo, see eyeglasses
frame styles overlaid on it, entirely client-side. Static HTML/CSS/JS — no
framework, no build step, no backend, no package.json. See `PRD.md` for full
product scope (goals, non-goals, functional requirements, and the deferred
roadmap) and `README.md` for a player-facing overview.

## Commands

No build or lint tooling — plain static files served as-is:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Tests are plain browser-native ES modules too (no Node/npm involved — this
machine has no JS runtime installed, which is why the suite runs in-browser
rather than via a Node test runner). With the server above running, visit
`http://localhost:8000/tests/`. `tests/index.html` reports pass/fail on the
page and in the console; there's no CLI runner. See `tests/harness.js` for
the (intentionally tiny, dependency-free) assertion helpers.

Deployment is GitHub Pages, serving the `main` branch root directly
(`hevgo/claude-webpage-glasses`, public repo) — pushing to `main` is the
deploy step. Live at https://hevgo.github.io/claude-webpage-glasses/.

## Architecture

Split by real concern, loaded as native ES modules (`<script type="module">`,
no bundler):

- `index.html` — static shell only (upload control, photo/overlay stage,
  frame gallery, status region). Populated at runtime by `js/main.js`.
- `style.css` — design tokens (see Theming below) and layout.
- `js/main.js` — entry point and UI state (`selectedFrameId`, cached
  `landmarks`, object URL lifecycle). Wires DOM events, calls into the
  other modules, owns loading/error states.
- `js/face-detection.js` — the **only** module that touches MediaPipe. The
  version pin and model URL live here and nowhere else.
- `js/overlay.js` — pure geometry, no MediaPipe dependency. Converts
  landmarks into a frame position/scale/rotation.
- `js/frames.js` — the frame catalog, plus the `FRAME_ASSET_WIDTH` constant
  shared with `overlay.js`.
- `assets/frames/*.svg` — placeholder frame graphics.
- `assets/fonts/*.woff2` — self-hosted Archivo (variable, display/body) and
  IBM Plex Mono (labels).

### Face detection: why CDN, not self-hosted

MediaPipe Face Landmarker (`@mediapipe/tasks-vision`, pinned to `1.0.1` in
`js/face-detection.js`) is loaded from jsDelivr, and its model file from
Google's own storage bucket — a deliberate exception to this repo's
otherwise self-hosted-assets convention (see `assets/fonts/`). The reason is
size: the WASM runtime's browser-fallback variants total 30+ MB, and the
face model itself is ~3.6 MB — both far outside what's reasonable to commit
to this repo. The model URL's `/float16/1/` path segment is itself an
immutable version pin from Google, so this isn't an unpinned dependency.
`FaceLandmarker.createFromOptions` is called with `delegate: "GPU"` first,
falling back to `"CPU"` on failure — some browsers/GPUs don't support the
GPU delegate.

GitHub Pages can't set `COOP`/`COEP` headers, so cross-origin isolation
isn't available in production. This has been confirmed **not** to block
MediaPipe loading (verified against the deployed Pages URL, not just
localhost) — MediaPipe's Tasks Vision default path doesn't hard-require
`SharedArrayBuffer`.

### Landmark indices

`js/overlay.js` uses eye-corner landmarks **33/133** (left eye outer/inner)
and **263/362** (right eye outer/inner) from MediaPipe's 478-point face mesh
to compute the eye-line midpoint, inter-eye distance, and tilt angle. These
were cross-verified against MediaPipe's own landmark map — **do not** reuse
eye-landmark indices from older TensorFlow.js Facemesh-based tutorials/
projects (e.g. 143/372/168); that model's indexing does not match
MediaPipe's, and there's an open MediaPipe GitHub issue about exactly this
discrepancy. If landmark usage ever changes, re-verify indices against
MediaPipe's current documentation rather than copying from a tutorial.

Detection runs once per uploaded photo; switching the selected frame re-runs
only `computeFrameTransform`/`applyFrameTransform` against the cached
landmarks — this is deliberate for responsiveness, not an oversight, so
don't reintroduce a re-detect-on-switch path.

### Frame asset convention

Every frame SVG in `assets/frames/` shares the same `viewBox="0 0 400 160"`
(with matching `width`/`height` attributes, so `<img>` reports correct
intrinsic size), is drawn so its own geometric center is the bridge anchor
point, and records its lens-center-to-lens-center distance in that
coordinate space as `refEyeSpan` in `js/frames.js`. This is what lets
`overlay.js` scale every hand-drawn frame uniformly despite each style
having a different natural lens spacing. Any new frame asset must follow
this convention, or the overlay math will mis-scale it.

### Theming

Colors are CSS custom properties, defined three times to cover every theme
state: bare `:root` (light, default), `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
(OS dark mode), and `:root[data-theme="dark"] { ... }` (an explicit in-app
override, if one is ever added). All components consume the tokens
(`--bg`, `--surface`, `--ink`, `--accent`, etc.) — don't hardcode colors
elsewhere.

### The `[hidden]` attribute needs the global override in style.css

`style.css` has a top-of-file `[hidden] { display: none !important; }` rule.
It exists because `.empty-state` and `.photo` each set their own `display`
(flex/block) to control their visible layout, and an author rule at equal-or
-higher specificity than the browser's built-in `[hidden] { display: none }`
silently wins — so `el.hidden = true` stopped actually hiding either element
(this shipped once as a real bug: the upload prompt stayed on screen after a
photo loaded, pushing the photo down and throwing off the overlay position,
computed against the photo's now-wrong on-screen box). If a new element
needs both a toggled `hidden` state and its own `display` value, rely on
this global rule rather than re-solving it locally — don't remove it.

### Testing

`tests/overlay.test.js` and `tests/frames.test.js` cover the deterministic,
pure-function surface (`computeFrameTransform`/`applyFrameTransform` in
overlay.js, and the `FRAMES` catalog/asset integrity in frames.js) using
synthetic landmark fixtures (`tests/fixtures.js`) — not real photos or real
MediaPipe inference. That's a deliberate scope boundary: real face detection
needs a browser + WASM + the CDN model, which makes it slow, network-
dependent, and non-deterministic — not a good fit for a fast regression
suite. Testing real detection end-to-end is a manual/browser-automation task
(as this project's changes have been verified so far), not something this
suite attempts. When adding a case, prefer a synthetic fixture that isolates
one geometry property (aspect ratio, tilt direction, eye spacing) over a
real image.

### Privacy constraint

The uploaded photo never leaves the browser — it's read via
`URL.createObjectURL` and passed directly to the in-browser detection model.
This is a stated product property (see `PRD.md`), not just current
behavior: any future feature (analytics, telemetry, server-side processing)
that would transmit the photo or derived data off-device breaks that
guarantee and needs to be treated as a product decision, not a routine
implementation detail.
