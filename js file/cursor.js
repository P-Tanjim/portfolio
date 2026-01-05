const cursor = document.querySelector(".cursor");

let x = 0;
let y = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener("mousemove", (e) => {
  targetX = e.clientX;
  targetY = e.clientY;
  
});

function animate() {
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
  requestAnimationFrame(animate)
}

animate();