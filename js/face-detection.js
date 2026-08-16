// The only module that touches MediaPipe. Version pin and model URL live
// here and nowhere else — see CLAUDE.md for why this is loaded from a CDN
// rather than self-hosted like this repo's other assets.
import {
  FilesetResolver,
  FaceLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;

function createLandmarker(vision, delegate) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "IMAGE",
    numFaces: 1,
  });
}

function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      // Resolve the WASM fileset once and reuse it for both delegate
      // attempts — re-resolving on fallback would re-fetch/re-init the
      // whole runtime right when the slower CPU path is already underway.
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      try {
        return await createLandmarker(vision, "GPU");
      } catch {
        return await createLandmarker(vision, "CPU");
      }
    })().catch((err) => {
      // Don't let a transient failure (e.g. a network blip fetching the
      // model) permanently poison detection for the rest of the session —
      // clear the cache so the next call retries from scratch.
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

// Returns 478 normalized {x, y, z} landmarks (x/y in [0,1]), or null if no
// face was found. Landmark indices used elsewhere in this app (eye corners
// 33/133/263/362) are documented in overlay.js and CLAUDE.md.
export async function detectFace(imgElement) {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(imgElement);
  return result.faceLandmarks?.[0] ?? null;
}
