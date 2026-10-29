(function () {
  var canvas = document.getElementById("introCanvas");
  var stage = document.querySelector(".intro-stage");
  if (!canvas || !stage) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { document.body.classList.add("no-motion"); return; }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, fontSize = 0, fontSizeMobile = false;
  var particles = [], mouse = null, leaving = false, frame = 0, start = 0, guide = null;
  var FONT = "Arial, Helvetica, sans-serif";
  var lines = ["READ", "THE MARKET.", "THEN TRADE."];

  function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    fontSizeMobile = W < 600;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    if (leaving) return;
    var off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    var octx = off.getContext("2d");
    octx.clearRect(0, 0, W, H);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";

    fontSize = Math.min(H * 0.205, W * 0.145);
    if (fontSizeMobile) fontSize = Math.min(H * 0.075, W * 0.16);
    var layout = fontSizeMobile ? ["READ", "THE MARKET.", "THEN", "TRADE."] : ["READ", "THE MARKET.", "THEN TRADE."];
    octx.font = "800 " + fontSize + "px " + FONT;
    var maxWidth = W * (fontSizeMobile ? 0.94 : 0.84);
    var widest = 0;
    layout.forEach(function (line) { widest = Math.max(widest, octx.measureText(line).width); });
    if (widest > maxWidth) {
      fontSize *= maxWidth / widest;
      octx.font = "800 " + fontSize + "px " + FONT;
    }

    var lineHeight = fontSize * (fontSizeMobile ? 1.10 : 1.04);
    var centerY = H * 0.47;
    var top = centerY - lineHeight * (layout.length - 1) / 2;
    layout.forEach(function (line, i) {
      octx.fillText(line, W / 2, top + i * lineHeight);
    });

    guide = off;
    var data = octx.getImageData(0, 0, W, H).data;
    var step = fontSizeMobile ? 2 : Math.max(2, Math.round(fontSize / 64));
    var targets = [];
    for (var y = 0; y < H; y += step) {
      for (var x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 120) {
          targets.push({ x: x + (Math.random() - 0.5) * step * 0.55, y: y + (Math.random() - 0.5) * step * 0.55 });
        }
      }
    }
    var cap = fontSizeMobile ? 12000 : 7200;
    if (targets.length > cap) {
      var keep = [];
      var stride = targets.length / cap;
      for (var j = 0; j < cap; j++) keep.push(targets[Math.floor(j * stride)]);
      targets = keep;
    }
    particles = targets.map(function (t) {
      return {
        tx: t.x, ty: t.y,
        x: W / 2 + (Math.random() - 0.5) * W * 1.15,
        y: H / 2 + (Math.random() - 0.5) * H * 1.2,
        vx: 0, vy: 0,
        size: (fontSizeMobile ? 0.45 : 0.6) + Math.random() * (fontSizeMobile ? 0.9 : 1.6),
        alpha: 0.3 + Math.random() * 0.7,
        seed: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.045,
        delay: Math.random() * 500
      };
    });
    start = performance.now();
    if (!frame) loop();
  }

  function loop(ts) {
    frame = requestAnimationFrame(loop);
    var now = ts || performance.now();
    var t = now - start;
    ctx.clearRect(0, 0, W, H);
    if (guide && !leaving) {
      ctx.globalAlpha = fontSizeMobile ? 0.11 : 0.08;
      ctx.drawImage(guide, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (leaving) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy = p.vy * 0.99 + 0.14;
      } else {
        if (t < p.delay) continue;
        var driftX = Math.sin(t * 0.001 + p.seed) * 0.14;
        var driftY = Math.cos(t * 0.00085 + p.seed) * 0.11;
        p.vx += (p.tx - p.x) * 0.024 + driftX;
        p.vy += (p.ty - p.y) * 0.024 + driftY;
        if (mouse) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 15000 && d2 > 1) {
            var d = Math.sqrt(d2);
            var force = (1 - d / 122) * 2.8;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
      }
      ctx.globalAlpha = p.alpha * (leaving ? 0.7 : 0.9);
      ctx.fillStyle = p.gold ? "rgba(201,168,106,0.9)" : "rgba(242,237,226,0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (leaving && now - start > 850) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function enter(e) {
    if (e) e.preventDefault();
    if (leaving) return;
    leaving = true;
    document.body.classList.add("is-leaving");
    particles.forEach(function (p) {
      var dx = p.x - W / 2;
      var dy = p.y - H / 2;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx = dx / d * (2 + Math.random() * 6);
      p.vy = dy / d * (2 + Math.random() * 6) - Math.random() * 2;
    });
    window.setTimeout(function () { window.location.href = "library.html"; }, 620);
  }

  window.addEventListener("pointermove", function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  window.addEventListener("pointerleave", function () { mouse = null; }, { passive: true });
  window.addEventListener("resize", function () {
    clearTimeout(window.__introResize);
    window.__introResize = setTimeout(function () { resizeCanvas(); }, 180);
  }, { passive: true });
  Array.prototype.forEach.call(document.querySelectorAll("[data-intro-enter]"), function (a) {
    a.addEventListener("click", function (e) { e.stopPropagation(); enter(e); });
  });
  document.querySelector(".intro-page").addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    enter(e);
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") enter(e);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resizeCanvas);
  } else {
    resizeCanvas();
  }
  setTimeout(function () { if (!particles.length) resizeCanvas(); }, 700);
})();