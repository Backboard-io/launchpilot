/**
 * Trigger a short confetti burst. No external dependency.
 */
const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export function triggerConfetti() {
  if (typeof document === "undefined") return;
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  const count = 28;
  const particles: { el: HTMLDivElement; tx: number; ty: number }[] = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = 6 + Math.random() * 6;
    const startX = 50 + (Math.random() - 0.5) * 30;
    const startY = 50 + (Math.random() - 0.5) * 20;
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const vel = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * vel + (Math.random() - 0.5) * 40;
    const ty = Math.sin(angle) * vel - 60 - Math.random() * 40;
    el.style.cssText = `
      position:absolute;left:${startX}%;top:${startY}%;
      width:${size}px;height:${size}px;background:${color};
      border-radius:2px;opacity:1;
      transform:translate(0,0) rotate(0deg);
    `;
    container.appendChild(el);
    particles.push({ el, tx, ty });
  }

  const start = performance.now();
  const duration = 1800;

  function tick(now: number) {
    const t = (now - start) / duration;
    if (t >= 1) {
      container.remove();
      return;
    }
    const easeOut = 1 - (1 - t) ** 2;
    particles.forEach(({ el, tx, ty }, i) => {
      const a = (i / particles.length) * Math.PI * 2 + t * 4;
      const x = (Math.cos(a) * 100 + tx) * easeOut;
      const y = (Math.sin(a) * 100 + ty) * easeOut;
      el.style.transform = `translate(${x}px,${y}px) rotate(${t * 720}deg)`;
      el.style.opacity = String(1 - t);
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
