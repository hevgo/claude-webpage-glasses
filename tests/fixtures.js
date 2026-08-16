// Synthetic landmark fixtures standing in for "different kinds of photos" —
// real face geometry at different eye spacing, tilt, and photo aspect
// ratio — without needing an actual photo or running face detection. Real
// MediaPipe output has 478 points; only the four eye-corner indices
// overlay.js reads (33/133/263/362, see overlay.js) are set here, each eye's
// outer and inner corner pinned to the same point so the "eye center"
// overlay.js computes is exactly that point — deterministic and easy to
// hand-verify.
export function makeLandmarks(leftEyeNorm, rightEyeNorm) {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));
  const [lx, ly] = leftEyeNorm;
  const [rx, ry] = rightEyeNorm;
  landmarks[33] = { x: lx, y: ly, z: 0 };
  landmarks[133] = { x: lx, y: ly, z: 0 };
  landmarks[263] = { x: rx, y: ry, z: 0 };
  landmarks[362] = { x: rx, y: ry, z: 0 };
  return landmarks;
}
