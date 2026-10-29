/* Lightweight sand-cursor interaction: no dependencies, no layout impact. */
(function () {
  if (window.__sandReady) return;
  window.__sandReady = true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.createElement("canvas");
  canvas.className = "sand-cursor";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var particles = [];
  var raf = 0;
  var last = null;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var color = "rgba(112, 83, 48, 0.55)";
  var max = coarse ? 220 : 520;

  function readColor() {
    var v = getComputedStyle(document.body).getPropertyValue("--sand-color").trim();
    if (v) color = v;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColor();
  }

  function spawn(x, y, vx, vy, n) {
    if (particles.length > max) particles.splice(0, particles.length - max);
    for (var i = 0; i < n; i++) {
      var life = 0.7 + Math.random() * 1.2;
      particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 14,
        vx: vx * 0.18 + (Math.random() - 0.5) * 48,
        vy: vy * 0.18 + (Math.random() - 0.5) * 36 - Math.random() * 18,
        size: 0.7 + Math.random() * 1.8,
        life: life,
        max: life,
        rot: Math.random() * Math.PI
      });
    }
    if (!raf) loop();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    if (!particles.length) {
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    var dt = 1 / 60;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += 34 * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += dt * 1.5;
      var a = Math.min(1, p.life / p.max * 1.8);
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function onMove(e) {
    var x = e.clientX, y = e.clientY;
    if (last) {
      var dx = x - last.x, dy = y - last.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.2) return;
      var n = Math.min(9, Math.max(1, Math.round(dist / 7)));
      spawn(x, y, dx, dy, n);
    } else {
      spawn(x, y, 0, 0, 3);
    }
    last = { x: x, y: y };
  }

  function onLeave() { last = null; }

  function burst(e) {
    var x = e.clientX, y = e.clientY;
    spawn(x, y, 0, 0, coarse ? 18 : 36);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", burst, { passive: true });
  document.addEventListener("pointerleave", onLeave, { passive: true });
  window.addEventListener("blur", function () { last = null; });
})();
