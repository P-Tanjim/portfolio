const section = document.querySelector(".projects");
const slider = document.querySelector(".slider");
const pause = document.querySelector(".pause-play");
const body = document.body;

let rotationActive = true;



let pauseButtonBounds = {
    x: 0, 
    y: 0, 
    width: 0,
    height: 0
};

pause.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();  
})


function togglePausePlay() {
    const pauseIcon = pause.querySelector(".fa-circle-pause");
    const playIcon = pause.querySelector(".fa-circle-play");

    rotationActive = !rotationActive; 

    if (rotationActive) {
        pauseIcon.classList.remove("hidden");
        playIcon.classList.add("hidden");
        angularVelocity = defaultSpinDegPerMs; 
    } else {
        pauseIcon.classList.add("hidden");
        playIcon.classList.remove("hidden");
        angularVelocity = 0; 
    }
}

function calculatePauseButtonPosition() {
    const rect = pause.getBoundingClientRect();
    
    pauseButtonBounds.x = rect.left + window.scrollX;
    pauseButtonBounds.y = rect.top + window.scrollY;
    
    pauseButtonBounds.width = rect.width;
    pauseButtonBounds.height = rect.height;
}

window.addEventListener('load', calculatePauseButtonPosition);


const projectObserverCallback = (entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            calculatePauseButtonPosition(); 
            window.addEventListener("scroll", calculatePauseButtonPosition);
            window.addEventListener("resize", calculatePauseButtonPosition);
        } else {
            window.removeEventListener("scroll", calculatePauseButtonPosition);
            window.removeEventListener("resize", calculatePauseButtonPosition);
        }
    });
};

const projectObserver = new IntersectionObserver(projectObserverCallback, {
    root: null,
    rootMargin: "0px",
    threshold: 0.1 
});


projectObserver.observe(section);


section.addEventListener("click", (e) => {
    const clickX = e.pageX;
    const clickY = e.pageY;
    
    const isClickedOnPause = 
        clickX >= pauseButtonBounds.x &&
        clickX <= pauseButtonBounds.x + pauseButtonBounds.width ||
        clickY >= pauseButtonBounds.y &&
        clickY <= pauseButtonBounds.y + pauseButtonBounds.height;
    

    if (isClickedOnPause) {
        e.stopPropagation(); 
        togglePausePlay(); 
    }
});



pause.addEventListener("click", (e) => {
  e.stopPropagation();

  const pauseIcon = pause.querySelector(".fa-circle-pause");
  const playIcon = pause.querySelector(".fa-circle-play");

  rotationActive = !rotationActive; 

  if (rotationActive) {
    pauseIcon.classList.remove("hidden");
    playIcon.classList.add("hidden");
  } else {
    pauseIcon.classList.add("hidden");
    playIcon.classList.remove("hidden");
    angularVelocity = 0;
  }
});

let prev = 0;
let calc = 0;
const sensitivity = 9;

let angularVelocity = 0;

const defaultSpinDegPerMs = 360 / 15000;
angularVelocity = defaultSpinDegPerMs;

const blendDecay = 0.0045;
const VELOCITY_EPS = 0.00001;
const MAX_VEL = 0.12;

let lastMoveX = 0;
let lastMoveTime = 0;

let dragging = false;
let lastFrameTime = performance.now();

const items = Array.from(slider.querySelectorAll(".iteam"));
const totalItems = items.length;
const itemAngle = 360 / totalItems;

function applyRotation(d) {
  slider.style.setProperty("--current-rotation", d + "deg");
}
applyRotation(prev);

function getCenteredItem() {
  const raw = -prev / itemAngle;
  let closestIndex = Math.round(raw) % totalItems;
  if (closestIndex < 0) closestIndex += totalItems;
  items.forEach((item, index) => {
    item.classList.toggle("focused-scale", index === closestIndex);
  });
}

function loop(now) {
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  if (rotationActive && !dragging) {
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

function clamp(v) {
  if (v > MAX_VEL) return MAX_VEL;
  if (v < -MAX_VEL) return -MAX_VEL;
  return v;
}

const CLICK_THRESHOLD_PX = 6;

let startX = 0;
let base = 0;

section.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".card")) return;

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

const cards = document.querySelectorAll(".card");

let isDragging = false;

let touchStartX = 0;
let touchStartY = 0;
const DRAG_THRESHOLD = 5;

cards.forEach((card) => {
  const wrap = card.querySelector(".wrap");
  const back = card.querySelector(".back");

  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    if (isDragging) {
      isDragging = false;
      return;
    }

    card.classList.toggle("flipped");

    const flipped = card.classList.contains("flipped");
    wrap.setAttribute("aria-hidden", flipped ? "true" : "false");
    back.setAttribute("aria-hidden", flipped ? "false" : "true");
  });

  card.addEventListener("touchstart", (e) => {
    isDragging = false;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  card.addEventListener("touchmove", (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      isDragging = true;
    }
  });

  card.addEventListener("touchend", (e) => {
    e.preventDefault();

    if (isDragging) {
      isDragging = false;
      return;
    }

    if (e.target.closest("a")) {
      e.target.closest("a").click();
      return;
    }

    card.classList.toggle("flipped");

    const flipped = card.classList.contains("flipped");
    wrap.setAttribute("aria-hidden", flipped ? "true" : "false");
    back.setAttribute("aria-hidden", flipped ? "false" : "true");

    isDragging = false;
  });
});
