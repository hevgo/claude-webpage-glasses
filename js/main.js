import { FRAMES, FRAME_ASSET_WIDTH } from "./frames.js";
import { detectFace } from "./face-detection.js";
import { computeFrameTransform, applyFrameTransform } from "./overlay.js";

const photoInput = document.getElementById("photoInput");
const emptyState = document.getElementById("emptyState");
const photo = document.getElementById("photo");
const frameOverlay = document.getElementById("frameOverlay");
const status = document.getElementById("status");
const replaceBtn = document.getElementById("replaceBtn");
const frameGrid = document.getElementById("frameGrid");

let selectedFrameId = FRAMES[0].id;
let landmarks = null;
let currentObjectUrl = null;

function setStatus(text, tone) {
  status.textContent = text;
  if (tone) status.dataset.tone = tone;
  else delete status.dataset.tone;
}

function currentFrame() {
  return FRAMES.find((frame) => frame.id === selectedFrameId);
}

function renderOverlay() {
  if (!landmarks) return;
  const frame = currentFrame();
  const transform = computeFrameTransform(
    landmarks,
    photo.clientWidth,
    photo.clientHeight,
    frame.refEyeSpan
  );
  frameOverlay.src = frame.assetPath;
  frameOverlay.alt = `${frame.label} frames`;
  frameOverlay.hidden = false;
  applyFrameTransform(frameOverlay, transform, FRAME_ASSET_WIDTH);
}

async function handlePhotoFile(file) {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);

  landmarks = null;
  frameOverlay.hidden = true;
  emptyState.hidden = true;
  replaceBtn.hidden = false;
  photo.hidden = false;
  photo.src = currentObjectUrl;
  setStatus("Analyzing photo…");

  await new Promise((resolve) => {
    photo.onload = resolve;
  });

  try {
    const result = await detectFace(photo);
    if (!result) {
      setStatus("No face detected — try a clearer, front-facing photo.", "error");
      return;
    }
    landmarks = result;
    setStatus("");
    renderOverlay();
  } catch {
    setStatus("Something went wrong analyzing that photo — try a different one.", "error");
  }
}

function clearPhoto() {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = null;
  landmarks = null;

  photo.removeAttribute("src");
  photo.hidden = true;
  frameOverlay.hidden = true;
  emptyState.hidden = false;
  replaceBtn.hidden = true;
  setStatus("");
  photoInput.value = "";
}

function selectFrame(id) {
  selectedFrameId = id;
  [...frameGrid.children].forEach((btn, i) => {
    btn.setAttribute("aria-pressed", FRAMES[i].id === id ? "true" : "false");
  });
  renderOverlay();
}

function buildFrameGrid() {
  FRAMES.forEach((frame) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frame-card";
    btn.setAttribute("aria-pressed", frame.id === selectedFrameId ? "true" : "false");

    const img = document.createElement("img");
    img.src = frame.assetPath;
    img.alt = "";

    const label = document.createElement("span");
    label.textContent = frame.label;

    btn.append(img, label);
    btn.addEventListener("click", () => selectFrame(frame.id));
    frameGrid.appendChild(btn);
  });
}

photoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) handlePhotoFile(file);
});

replaceBtn.addEventListener("click", clearPhoto);

window.addEventListener("resize", () => {
  if (landmarks) renderOverlay();
});

buildFrameGrid();
