/**
 * Lightweight, zero-dependency HTML5 Canvas Confetti generator.
 * Perfectly styled with the Paw & Co organic palette:
 * Peach (#F2A86F), Forest Green (#2B4233), Cream (#FAF7F2),
 * Apricot Deep (#D97E3E), Forest Soft (#3D5B47), Success Emerald (#1F6E4A).
 */
export function triggerConfetti(options?: {
  count?: number;
  originX?: number;
  originY?: number;
}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options?.count ?? 70;
  const colors = ['#F2A86F', '#2B4233', '#FDE8D3', '#D97E3E', '#3D5B47', '#1F6E4A', '#E8985B'];

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (document.body.contains(canvas)) {
      document.body.removeChild(canvas);
    }
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const originX = (options?.originX ?? 0.5) * window.innerWidth;
  const originY = (options?.originY ?? 0.4) * window.innerHeight;

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      wobble: Math.random() * Math.PI,
      wobbleSpeed: 0.06 + Math.random() * 0.1,
      alpha: 1,
    };
  });

  const startTime = performance.now();
  const duration = 2400; // ms

  function render(now: number) {
    const elapsed = now - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      return;
    }

    ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.24; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;
      p.alpha = Math.max(0, 1 - progress);

      ctx?.save();
      ctx?.translate(p.x, p.y);
      ctx?.rotate((p.rotation * Math.PI) / 180);
      ctx?.scale(Math.cos(p.wobble), 1);
      if (ctx) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx?.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
