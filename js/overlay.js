// Pure geometry — no MediaPipe dependency. Converts detected face landmarks
// into a position/scale/rotation for a frame overlay image.
//
// Landmark indices (cross-verified against MediaPipe's own landmark map,
// not the older TF.js Facemesh indices some tutorials still show):
//   33  = left eye outer corner    133 = left eye inner corner
//   263 = right eye outer corner   362 = right eye inner corner
// "left"/"right" follow MediaPipe's convention (the subject's own
// anatomical left/right) — the math below is symmetric, so it doesn't
// matter which side is which.
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;

function toPx(landmark, width, height) {
  // x/y are normalized independently by width/height, so this conversion
  // must happen before any distance/angle math — skipping it distorts both
  // on a non-square photo.
  return { x: landmark.x * width, y: landmark.y * height };
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// renderedWidth/renderedHeight are the on-screen (CSS pixel) size of the
// displayed photo element, not its native resolution.
export function computeFrameTransform(landmarks, renderedWidth, renderedHeight, refEyeSpan) {
  const leftOuter = toPx(landmarks[LEFT_EYE_OUTER], renderedWidth, renderedHeight);
  const leftInner = toPx(landmarks[LEFT_EYE_INNER], renderedWidth, renderedHeight);
  const rightOuter = toPx(landmarks[RIGHT_EYE_OUTER], renderedWidth, renderedHeight);
  const rightInner = toPx(landmarks[RIGHT_EYE_INNER], renderedWidth, renderedHeight);

  const leftEye = midpoint(leftOuter, leftInner);
  const rightEye = midpoint(rightOuter, rightInner);
  const center = midpoint(leftEye, rightEye);

  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;

  return {
    xPx: center.x,
    yPx: center.y,
    scale: Math.hypot(dx, dy) / refEyeSpan,
    angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

// Positions a frame <img> so its own geometric center (the bridge anchor,
// per each SVG's authoring convention — see frames.js) lands on the
// detected eye midpoint, scaled and rotated to match.
export function applyFrameTransform(frameImgEl, transform, naturalFrameWidth) {
  frameImgEl.style.width = `${naturalFrameWidth * transform.scale}px`;
  frameImgEl.style.left = `${transform.xPx}px`;
  frameImgEl.style.top = `${transform.yPx}px`;
  frameImgEl.style.transform = `translate(-50%, -50%) rotate(${transform.angleDeg}deg)`;
}
