import { test, assertClose, assertEqual } from "./harness.js";
import { computeFrameTransform, applyFrameTransform } from "../js/overlay.js";
import { makeLandmarks } from "./fixtures.js";

test("straight-on face in a square photo centers with zero tilt", () => {
  const landmarks = makeLandmarks([0.3, 0.5], [0.7, 0.5]);
  const t = computeFrameTransform(landmarks, 400, 400, 160);
  assertClose(t.xPx, 200, 0.001, "xPx");
  assertClose(t.yPx, 200, 0.001, "yPx");
  assertClose(t.angleDeg, 0, 0.001, "angleDeg");
  assertClose(t.scale, 1, 0.0001, "scale");
});

test("non-square photo: angle/scale are computed in pixel space, not raw normalized deltas", () => {
  // Regression test. x/y are normalized independently by width/height, so
  // converting to pixels must happen before any distance/angle math — on
  // this fixture, computing the angle from raw normalized deltas instead
  // would give ~18.4deg instead of the correct ~4.76deg.
  const landmarks = makeLandmarks([0.2, 0.4], [0.8, 0.6]);
  const t = computeFrameTransform(landmarks, 800, 200, 170);
  assertClose(t.xPx, 400, 0.001, "xPx");
  assertClose(t.yPx, 100, 0.001, "yPx");
  assertClose(t.angleDeg, 4.763641690726178, 0.0001, "angleDeg");
  assertClose(t.scale, 2.8333163714805396, 0.0001, "scale");
});

test("opposite head tilt produces a negative angle", () => {
  const landmarks = makeLandmarks([0.35, 0.55], [0.65, 0.35]);
  const t = computeFrameTransform(landmarks, 300, 600, 180);
  assertClose(t.xPx, 150, 0.001, "xPx");
  assertClose(t.yPx, 270, 0.001, "yPx");
  assertClose(t.angleDeg, -53.13010235415598, 0.0001, "angleDeg");
  assertClose(t.scale, 0.8333333333333334, 0.0001, "scale");
});

test("scale is proportional to each frame style's refEyeSpan", () => {
  // 500px apart in a 1000x1000 photo.
  const landmarks = makeLandmarks([0.25, 0.5], [0.75, 0.5]);
  const refEyeSpans = { round: 170, square: 170, rectangle: 180, "cat-eye": 170, aviator: 180, browline: 176 };
  for (const [name, refEyeSpan] of Object.entries(refEyeSpans)) {
    const t = computeFrameTransform(landmarks, 1000, 1000, refEyeSpan);
    assertClose(t.scale, 500 / refEyeSpan, 0.0001, `${name}: expected scale ${500 / refEyeSpan}, got ${t.scale}`);
  }
});

test("degenerate zero-distance landmarks don't throw or produce NaN", () => {
  const landmarks = makeLandmarks([0.5, 0.5], [0.5, 0.5]);
  const t = computeFrameTransform(landmarks, 400, 400, 170);
  assertEqual(t.scale, 0, "scale");
  assertEqual(Number.isNaN(t.angleDeg), false, "angleDeg should not be NaN");
});

test("applyFrameTransform sets width/position/rotation from the transform", () => {
  const el = { style: {} };
  applyFrameTransform(el, { xPx: 120, yPx: 80, scale: 2, angleDeg: 10 }, 400);
  assertEqual(el.style.width, "800px", "width");
  assertEqual(el.style.left, "120px", "left");
  assertEqual(el.style.top, "80px", "top");
  assertEqual(el.style.transform, "translate(-50%, -50%) rotate(10deg)", "transform");
});
