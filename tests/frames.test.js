import { test, assertTrue, assertEqual } from "./harness.js";
import { FRAMES, FRAME_ASSET_WIDTH } from "../js/frames.js";

test("catalog has 5-8 frame styles with unique ids", () => {
  assertTrue(FRAMES.length >= 5 && FRAMES.length <= 8, `expected 5-8 frames, got ${FRAMES.length}`);
  const ids = FRAMES.map((f) => f.id);
  assertEqual(new Set(ids).size, ids.length, "frame ids must be unique");
});

test("every frame has a positive refEyeSpan and a non-empty label", () => {
  for (const frame of FRAMES) {
    assertTrue(frame.refEyeSpan > 0, `${frame.id}: refEyeSpan must be positive`);
    assertTrue(typeof frame.label === "string" && frame.label.length > 0, `${frame.id}: missing label`);
  }
});

test("every frame asset exists and matches the shared viewBox width", async () => {
  // Regression guard for the SVG authoring convention documented in
  // frames.js and CLAUDE.md: every frame must declare width="400" so <img>
  // reports correct intrinsic sizing for overlay.js's scale math.
  for (const frame of FRAMES) {
    // frame.assetPath is relative to the repo root (e.g. "assets/frames/round.svg"),
    // but this test page is served from tests/ — resolve up one level.
    const res = await fetch(`../${frame.assetPath}`);
    assertTrue(res.ok, `${frame.id}: ${frame.assetPath} did not load (status ${res.status})`);
    const svgText = await res.text();
    assertTrue(
      svgText.includes(`width="${FRAME_ASSET_WIDTH}"`),
      `${frame.id}: expected width="${FRAME_ASSET_WIDTH}" in ${frame.assetPath}`
    );
  }
});
