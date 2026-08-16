// Placeholder frame catalog for the MVP — a small, original demo set, not
// real branded products. Each entry's `refEyeSpan` is the distance (in the
// SVG's own coordinate space) between that frame's two lens centers, at the
// shared viewBox "0 0 400 160" with bridge anchor (200, 80). overlay.js uses
// refEyeSpan to scale each hand-drawn frame to match a detected face's
// inter-eye distance, since every asset has a slightly different natural
// lens spacing.
//
// This plain array-of-objects shape is a deliberate placeholder for a future
// partner frame catalog (see PRD.md Future/Roadmap) — keep it simple until
// there's a real data source to model.
// Every frame SVG shares this intrinsic width (viewBox "0 0 400 160", plus
// matching width/height attributes) so overlay.js can scale from a known
// constant instead of waiting on each <img>'s async natural-size load.
export const FRAME_ASSET_WIDTH = 400;

export const FRAMES = [
  { id: "round", label: "Round", assetPath: "assets/frames/round.svg", refEyeSpan: 170 },
  { id: "square", label: "Square", assetPath: "assets/frames/square.svg", refEyeSpan: 170 },
  { id: "rectangle", label: "Rectangle", assetPath: "assets/frames/rectangle.svg", refEyeSpan: 180 },
  { id: "cat-eye", label: "Cat-eye", assetPath: "assets/frames/cat-eye.svg", refEyeSpan: 170 },
  { id: "aviator", label: "Aviator", assetPath: "assets/frames/aviator.svg", refEyeSpan: 180 },
  { id: "browline", label: "Browline", assetPath: "assets/frames/browline.svg", refEyeSpan: 176 },
];
