# Sightline — Virtual Glasses Try-On (MVP)

Upload a photo of your face and preview a few eyeglasses frame styles on it —
entirely in your browser. No account, no backend, no server ever sees your
photo.

## Run it

No build step. Serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Run the tests

No test framework or dependencies — plain browser-native ES modules, same
as the app itself. Serve the folder locally (as above) and visit
`http://localhost:8000/tests/` (opening `tests/index.html` via `file://`
won't work — the asset-existence tests use `fetch`, which needs http).
Results show pass/fail per test on the page and in the console.

## How it works

- Upload a front-facing photo — click to browse, or drag a file onto the
  page (works for the first photo and to replace one already showing). Face
  detection (MediaPipe Face Landmarker) runs in-browser via WebAssembly and
  locates your eyes.
- A frame style is overlaid on the photo, scaled and rotated to match your
  eye line.
- Switch between frame styles instantly — no re-detection needed, since
  positioning is computed once per photo and reused.
- If no face is found, you're told so and can try a different photo without
  losing your place.

**Privacy**: your photo is read locally and handed directly to the
in-browser detection model — it's never uploaded anywhere. The only network
requests this page makes are for the face-detection library and model
files, which happen identically whether or not you ever upload a photo.

## Project structure

```
index.html              markup
style.css                design tokens, layout
js/main.js                entry point — UI state and wiring
js/face-detection.js       the only module that touches MediaPipe
js/overlay.js               frame position/scale/rotation math
js/frames.js                  placeholder frame catalog
assets/frames/*.svg     placeholder frame graphics (demo set, not real products)
assets/fonts/*.woff2    self-hosted display/body and label fonts
tests/                  unit tests for the overlay math and frame catalog (see below)
PRD.md                  product requirements, including the MVP's future roadmap
```

## Live site

https://hevgo.github.io/claude-webpage-glasses/
