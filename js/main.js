import { FRAMES, FRAME_ASSET_WIDTH } from "./frames.js";
import { detectFace } from "./face-detection.js";
import { computeFrameTransform, applyFrameTransform } from "./overlay.js";

const photoInput = document.getElementById("photoInput");
const photoStage = document.getElementById("photoStage");
const emptyState = document.getElementById("emptyState");
const photo = document.getElementById("photo");
const frameOverlay = document.getElementById("frameOverlay");
const status = document.getElementById("status");
const replaceBtn = document.getElementById("replaceBtn");
const frameGrid = document.getElementById("frameGrid");

let selectedFrameId = FRAMES[0].id;
let landmarks = null;
let currentObjectUrl = null;

// Bumped on every new upload and on clearPhoto(). handlePhotoFile checks
// this after each await and bails if it's been superseded — otherwise a
// slower call (or one the user already cleared) could land its result after
// a newer one, per the race documented at each check below.
let uploadToken = 0;

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
  const token = ++uploadToken;

  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);

  landmarks = null;
  frameOverlay.hidden = true;
  emptyState.hidden = true;
  replaceBtn.hidden = false;
  photo.hidden = false;
  photo.src = currentObjectUrl;
  setStatus("Analyzing photo…");

  const loaded = await new Promise((resolve) => {
    photo.onload = () => resolve(true);
    photo.onerror = () => resolve(false);
  });

  // Superseded by a newer upload, or the photo was cleared while this one
  // was still loading/analyzing — don't let a stale result touch the UI.
  if (token !== uploadToken) return;

  if (!loaded) {
    setStatus("Couldn't load that image — try a different photo.", "error");
    return;
  }

  try {
    const result = await detectFace(photo);
    if (token !== uploadToken) return;
    if (!result) {
      setStatus("No face detected — try a clearer, front-facing photo.", "error");
      return;
    }
    landmarks = result;
    setStatus("");
    renderOverlay();
  } catch {
    if (token !== uploadToken) return;
    setStatus("Something went wrong analyzing that photo — try a different one.", "error");
  }
}

function clearPhoto() {
  uploadToken++; // invalidate any handlePhotoFile call still in flight

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

// Drag a photo from Finder (or anywhere) onto the stage — works both for
// the first upload and to replace an existing photo, since it reuses the
// same handlePhotoFile the file input uses.
photoStage.addEventListener("dragenter", (event) => event.preventDefault());

photoStage.addEventListener("dragover", (event) => {
  event.preventDefault(); // required for "drop" to fire at all
  photoStage.classList.add("drag-over");
});

photoStage.addEventListener("dragleave", (event) => {
  // dragenter/dragleave fire on every child boundary crossed, not just the
  // stage's own edge — only clear the highlight once the pointer has left
  // the stage entirely (relatedTarget is where it's going).
  if (!photoStage.contains(event.relatedTarget)) {
    photoStage.classList.remove("drag-over");
  }
});

photoStage.addEventListener("drop", (event) => {
  event.preventDefault();
  photoStage.classList.remove("drag-over");
  const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith("image/"));
  if (file) handlePhotoFile(file);
});

window.addEventListener("resize", () => {
  if (landmarks) renderOverlay();
});

buildFrameGrid();
