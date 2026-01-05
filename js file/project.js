const section = document.querySelector(".projects");
const slider = document.querySelector(".slider");
const cards = document.querySelectorAll('.card');
const pause = document.querySelector(".pause-play");

const body = document.body;

let angle = 0;
let calc = 0;
let widthOfScreen = window.innerWidth;
let sensitivity = 0;


let rotationId = null;
let rotationActive = true;


// const observerOfCards = new IntersectionObserver((entries) => {
//   entries.forEach(entry => {
//     if (entry.isIntersecting) {
//       entry.target.style.scale = "1.1";
//     } else {
//       entry.target.style.scale = "1";
//     }
//   });
// }, { threshold: 0.25 }); 


if (widthOfScreen <= 767) {
  sensitivity = 4;
  // cards.forEach(card => observerOfCards.observe(card));
} else {
  sensitivity = 7;
}

let observerOfProject = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startRotate();
      } else {
        stopRotate();
      }
    });
  },
  {
    threshold: 0.01,
  }
);

observerOfProject.observe(section);

function rotate() {
  angle = (angle + 0.7) % 360;
  slider.style.transform = `rotateY(${angle + calc}deg)`;
  rotationId = requestAnimationFrame(rotate);
}
function startRotate() {
  if (rotationId === null) {
    rotationId = requestAnimationFrame(rotate);
  }
}
function stopRotate() {
  if (rotationId !== null) {
    cancelAnimationFrame(rotationId);
    rotationId = null;
  }
}

startRotate();

pause.addEventListener("mousedown", (e) => {
  e.stopPropagation();
  const pauseIcon = pause.querySelector(".fa-circle-pause");
  const playIcon = pause.querySelector(".fa-circle-play");

  rotationActive = !rotationActive;

  if (rotationActive) {
    pauseIcon.classList.remove("hidden");
    playIcon.classList.add("hidden");
    startRotate();
  } else {
    pauseIcon.classList.add("hidden");
    playIcon.classList.remove("hidden");
    stopRotate();
  }
});

section.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".pause-play")) return;

  e.preventDefault();

  stopRotate();

  const startX = e.clientX;
  calc = 0;
  body.style.cursor = "grabbing";

  function onPointerMove(ev) {
    calc = (ev.clientX - startX) / sensitivity;
    slider.style.transform = `rotateY(${angle + calc}deg)`;
  }

  function onPointerUp(ev) {
    angle = (angle + calc) % 360;
    if (angle < 0) angle += 360;
    calc = 0;

    body.style.cursor = "default";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    if (rotationActive) startRotate();
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
});


cards.forEach((card) => {
  const wrap = card.querySelector(".wrap");
  const back = card.querySelector(".back");

  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;

    card.classList.toggle("flipped");

    const flipped = card.classList.contains("flipped");
    wrap.setAttribute("aria-hidden", flipped ? "true" : "false");
    back.setAttribute("aria-hidden", flipped ? "false" : "true");
  });
});
