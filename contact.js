// Circle particle network animation
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
let width, height, centerX, centerY, radius;

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.color = Math.random() < 0.5 ? "#38bdf8" : "#10b981";
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fill();
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    let dx = this.x - centerX;
    let dy = this.y - centerY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      let angle = Math.atan2(dy, dx);
      this.vx = -Math.cos(angle) * Math.abs(this.vx);
      this.vy = -Math.sin(angle) * Math.abs(this.vy);
      this.x = centerX + Math.cos(angle) * radius * 0.99;
      this.y = centerY + Math.sin(angle) * radius * 0.99;
    }
    this.draw();
  }
}

function init() {
  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;
  canvas.width = width;
  canvas.height = height;
  centerX = width / 2;
  centerY = height / 2;
  radius = (Math.min(width, height) / 2) * 0.8;
  particles = [];
  const numParticles = width > 600 ? 40 : 20;
  for (let i = 0; i < numParticles; i++) {
    let x, y, distSq;
    do {
      x = Math.random() * width;
      y = Math.random() * height;
      distSq = (x - centerX) ** 2 + (y - centerY) ** 2;
    } while (distSq > radius * radius);
    particles.push(new Particle(x, y));
  }
}

function connectParticles() {
  let maxDist = 100;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let p1 = particles[i],
        p2 = particles[j];
      let distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
      if (distSq < maxDist * maxDist) {
        let opacity = 1 - distSq / (maxDist * maxDist);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(56,221,248,${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, width, height);
  particles.forEach((p) => p.update());
  connectParticles();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(56,221,248,0.7)";
  ctx.shadowColor = "rgba(56,221,248,1)";
  ctx.shadowBlur = 25;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

init();
animate();
window.addEventListener("resize", init);
