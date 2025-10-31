// === INITIAL VARIABLES ===
const section = document.querySelector(".projects");
const slider = document.querySelector(".slider");
const body = document.body;

let prev = 0; // rotation (deg)
let calc = 0; // drag delta (deg)
const sensitivity = 9; // px -> deg

// single velocity source (deg/ms)
let angularVelocity = 0;

// default spin = 360deg / 15s
const defaultSpinDegPerMs = 360 / 15000;
angularVelocity = defaultSpinDegPerMs;

const blendDecay = 0.0045;
const VELOCITY_EPS = 0.00001;
const MAX_VEL = 0.12;

let lastMoveX = 0;
let lastMoveTime = 0;

let dragging = false;
let lastFrameTime = performance.now();

// === ITEMS ===
const items = Array.from(slider.querySelectorAll(".iteam"));
const totalItems = items.length;
const itemAngle = 360 / totalItems;

// === APPLY ROTATION ===
function applyRotation(d) {
  slider.style.setProperty("--current-rotation", d + "deg");
}
applyRotation(prev);

// === DETECT FRONT CARD ===
function getCenteredItem() {
  const raw = -prev / itemAngle;
  let closestIndex = Math.round(raw) % totalItems;
  if (closestIndex < 0) closestIndex += totalItems;
  items.forEach((item, index) => {
    item.classList.toggle("focused-scale", index === closestIndex);
  });
}

// === ANIMATION LOOP ===
function loop(now) {
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  if (!dragging) {
    const k = blendDecay;
    const target = defaultSpinDegPerMs;
    angularVelocity = target + (angularVelocity - target) * Math.exp(-k * dt);
    if (Math.abs(angularVelocity) < VELOCITY_EPS) angularVelocity = target;

    prev += angularVelocity * dt;
    prev = ((prev % 360) + 360) % 360;
  }

  applyRotation(prev);
  getCenteredItem();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// === HELPERS ===
function clamp(v) {
  if (v > MAX_VEL) return MAX_VEL;
  if (v < -MAX_VEL) return -MAX_VEL;
  return v;
}

const CLICK_THRESHOLD_PX = 6;

// === UNIFIED POINTER HANDLER (replaces mouse + touch) ===
let startX = 0;
let base = 0;

section.addEventListener("pointerdown", (e) => {
  // Ignore pointer down if it's on a card (let card handle it)
  if (e.target.closest(".card")) return;

  // Only react to primary button
  if (e.pointerType === "mouse" && e.button !== 0) return;

  dragging = true;
  angularVelocity = 0;
  startX = e.clientX;
  base = prev;
  calc = 0;
  lastMoveX = startX;
  lastMoveTime = performance.now();

  body.style.cursor = "grabbing";
  section.setPointerCapture(e.pointerId);
});

section.addEventListener("pointermove", (e) => {
  if (!dragging) return;

  // Don’t block scrolling vertically — only act when horizontal move is noticeable
  const now = performance.now();
  const dxTotal = e.clientX - startX;
  calc = dxTotal / sensitivity;
  const newRotation = base + calc;
  prev = newRotation;
  applyRotation(prev);

  const dx = e.clientX - lastMoveX;
  const dt = Math.max(1, now - lastMoveTime);
  const instVel = dx / sensitivity / dt;

  if (Math.abs(dx) > 0.5) {
    angularVelocity = clamp(instVel);
  } else {
    angularVelocity = 0;
  }

  lastMoveX = e.clientX;
  lastMoveTime = now;
});

section.addEventListener("pointerup", endPointer);
section.addEventListener("pointercancel", endPointer);

function endPointer(e) {
  if (!dragging) return;
  dragging = false;
  body.style.cursor = "default";
  section.releasePointerCapture(e.pointerId);

  if (Math.abs(calc * sensitivity) < CLICK_THRESHOLD_PX) {
    angularVelocity = defaultSpinDegPerMs;
    calc = 0;
    return;
  }

  angularVelocity = clamp(angularVelocity);
  calc = 0;
  prev = ((prev % 360) + 360) % 360;
}

// Select ALL elements with the class "card"
const cards = document.querySelectorAll(".card");

// Variable to track drag state (must be outside the loop)
// Assuming your main carousel script already defines these properties globally or on the slider element.
// We'll rely on the existing event listeners to handle the actual rotation logic.
let isDragging = false;

// --- ADDED: Simple Drag Tracker for Touch Events ---
// You should integrate this into your main touch/drag logic, but for a standalone fix:
let touchStartX = 0;
let touchStartY = 0;
const DRAG_THRESHOLD = 5; // A small movement threshold (in pixels)

// Attach touch listeners to the main slider or touch area (assuming it's a sibling of the card logic)
// For simplicity, we'll track dragging on the card itself, but the best place is usually the `.slider` or `.projects` element.

cards.forEach((card) => {
  const wrap = card.querySelector(".wrap");
  const back = card.querySelector(".back");

  // --- Mouse Click/Tap Listener ---
  card.addEventListener("click", (e) => {
    // If the carousel drag script has marked this as a drag or the link was clicked, stop.
    // Note: If you don't have a global `isDragging` variable from your main script,
    // the mobile fix below will handle this more robustly.
    if (e.target.closest("a")) return;
    if (isDragging) {
      isDragging = false; // Reset for the next event
      return;
    }

    // Toggle the 'flipped' class on the specific card that was clicked
    card.classList.toggle("flipped");

    const flipped = card.classList.contains("flipped");
    wrap.setAttribute("aria-hidden", flipped ? "true" : "false");
    back.setAttribute("aria-hidden", flipped ? "false" : "true");
  });

  // --- Mobile Touch Listeners ---

  card.addEventListener("touchstart", (e) => {
    // Reset drag state and capture starting touch position
    isDragging = false;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  card.addEventListener("touchmove", (e) => {
    // Calculate distance moved
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);

    // If movement exceeds the threshold, mark it as a drag
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      isDragging = true;
    }
  });

  // We use the 'touchend' event to trigger the flip logic,
  // which effectively acts as a mobile 'click' event.
  card.addEventListener("touchend", (e) => {
    // IMPORTANT: Prevent default touchend behavior to avoid double-firing with `click` on some browsers
    e.preventDefault();

    // If it was detected as a drag, do NOT flip the card
    if (isDragging) {
      isDragging = false; // Reset for the next touch sequence
      return;
    }

    // If a link was touched, let the link action proceed
    if (e.target.closest("a")) {
      // Trigger the link's default action
      e.target.closest("a").click();
      return;
    }

    // It was a simple tap, so flip the card
    card.classList.toggle("flipped");

    const flipped = card.classList.contains("flipped");
    wrap.setAttribute("aria-hidden", flipped ? "true" : "false");
    back.setAttribute("aria-hidden", flipped ? "false" : "true");

    // Reset drag state
    isDragging = false;
  });
});
