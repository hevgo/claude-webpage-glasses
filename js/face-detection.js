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

async function createLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "IMAGE",
    numFaces: 1,
  });
}

function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker("GPU").catch(() => createLandmarker("CPU"));
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
