# PRD: Sightline — Virtual Glasses Try-On (MVP)

*Status: MVP shipped · Owner: TBD · Last updated: 2026-08-16*

## Summary

A browser-based tool where someone uploads a photo of their own face and
previews a few eyeglasses frame styles overlaid on it, to help decide what to
test or order from an optical retailer before buying. Runs entirely
client-side — no accounts, no backend, no server ever sees the photo.

## Problem / opportunity

Buying glasses online is hard to do with confidence without seeing how a
frame actually sits on your own face. Established retailers (Warby Parker,
GlassesUSA, Zenni, Lenskart) have each built some version of this — either
live AR try-on or photo-based overlay with recommendations — confirming this
is a real, validated need, not a novel bet. This MVP builds the core
mechanic (upload a photo, see frames on it) as a standalone demo, deferring
the harder product questions (real inventory, recommendations, live camera)
to validate the core experience first.

## Goals

- Let someone see a frame style on their own face within seconds of
  uploading a photo.
- Make switching between frame styles instant, so comparing options feels
  like flipping through a rack, not re-running an analysis each time.
- Never require the photo to leave the user's device — this is a real
  product property, not an implementation detail (see Privacy below).
- Work with zero setup: no account, no install, no build step to run it.

## Non-goals (MVP)

- No live camera capture — upload only.
- No 3D rendering — frames are 2D image overlays, not 3D models.
- No real frame catalog or purchase flow — placeholder demo frames only.
- No face-shape detection or style recommendations — free browsing only.
- No backend, database, or analytics.

## Target users

Someone considering buying glasses online who wants a quick, no-commitment
way to see a few frame silhouettes on their own face before deciding what to
try or order for real.

## User stories

- As a user, I can upload a photo of my face and see it displayed.
- As a user, once I upload a photo, I can see a frame overlaid on my face
  automatically, without extra steps.
- As a user, I can switch between frame styles and see the result instantly.
- As a user, if my photo doesn't show a clear face, I'm told so and can try
  a different photo without losing my place.
- As a user, I can replace my photo at any time and start over.
- As a keyboard or screen-reader user, I can upload a photo, switch frames,
  and understand the current state, all without a mouse.

## Functional requirements

| # | Requirement |
|---|---|
| 1 | User uploads a photo via a file picker or by dragging a file onto the page (`<input type="file" accept="image/*">`, plus drag-and-drop onto the same stage). |
| 2 | On upload, the app detects the face and its landmarks entirely client-side. |
| 3 | A frame style is overlaid on the photo, positioned/scaled/rotated to the detected eye line, updating live as different styles are picked. |
| 4 | A gallery of frame styles is always visible; selecting one updates the overlay instantly without re-running detection. |
| 5 | If no face is detected, show an inline message and keep the photo visible so the user can immediately try another file. |
| 6 | A "Replace photo" control clears the current photo/overlay and returns to the upload state. |
| 7 | All controls are keyboard-operable with visible focus states and accessible labels. |
| 8 | Light and dark OS/browser themes are both supported. |

## Design direction

A precise, "optician's fitting counter" identity rather than a lifestyle/
retail one — the product is a measurement tool, not a storefront. A single
teal accent (evoking lens coatings) against a neutral warm-grey ground, a
confident geometric sans (Archivo) for display and body text, and a
monospace face (IBM Plex Mono) reserved for labels and short UI text, in
the spirit of instrument readouts. A thin repeating tick-mark rule (styled,
not a real measurement) nods to the subject without fabricating fake data.

## Privacy

The uploaded photo is read locally via `URL.createObjectURL` and passed
directly to an in-browser face-detection model (MediaPipe Face Landmarker,
running via WebAssembly) — it is never sent to any server. The only network
requests the app makes are for the face-detection runtime and model files,
which are identical whether or not a user ever uploads a photo. This was
verified directly (not just assumed) by checking the browser's network
panel during an end-to-end test: the photo appears only as a local `blob:`
resource, never as a request payload.

## Success criteria

- A new visitor can upload a photo and see a frame on their face without
  instructions.
- Switching between all frame styles works with no re-detection and no
  console errors.
- The no-face-detected path is graceful — no dead end, no lost photo.
- All controls are reachable and operable by keyboard.

## Future / Roadmap

These were explicitly scoped out of the MVP, not overlooked:

1. **3D model overlay.** Upgrade from flat 2D frame images to full 3D
   models (e.g. Three.js-based), so frames handle head tilt and angle more
   realistically, closer to live AR try-on experiences.
2. **Real frame catalog from partner eyewear companies.** Replace the
   placeholder demo frames with real product specs/assets sourced by
   partnering with actual eyewear brands or retailers. `js/frames.js`'s
   plain array-of-objects shape is a deliberate placeholder for this future
   data source, not a permanent design.
3. **Face-shape-based recommendations.** Use the detected landmarks to
   classify face shape (round/oval/square/etc.) and highlight suggested
   frame styles, similar to what Warby Parker and Lenskart offer today.
4. **Live camera capture**, as an alternative or addition to file upload.

## Open questions

- Should landmarks or the uploaded photo ever persist locally (e.g. via
  `localStorage`) for a return visit, or should everything stay
  session-only as it does now?
- When real partner frame data arrives (roadmap item 2), does the current
  2D-overlay math (`js/overlay.js`) still apply, or does a partner's asset
  format require different anchor/scale conventions than the placeholder
  set's `refEyeSpan` approach?
