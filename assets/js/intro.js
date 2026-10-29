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
  var particles = [], mouse = null, active = false, settling = false, leaving = false;
  var frame = 0, start = 0, lastMove = 0;

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

    fontSize = Math.min(H * 0.19, W * 0.125);
    if (fontSizeMobile) fontSize = Math.min(H * 0.075, W * 0.16);
    var layout = fontSizeMobile ? ["READ", "THE MARKET.", "THEN", "TRADE."] : ["READ", "THE MARKET.", "THEN TRADE."];
    octx.font = "900 " + fontSize + "px Helvetica Neue, Helvetica, Arial, sans-serif";
    var maxWidth = W * (fontSizeMobile ? 0.94 : 0.68);
    var widest = 0;
    layout.forEach(function (line) { widest = Math.max(widest, octx.measureText(line).width); });
    if (widest > maxWidth) {
      fontSize *= maxWidth / widest;
      octx.font = "900 " + fontSize + "px Helvetica Neue, Helvetica, Arial, sans-serif";
    }

    var lineHeight = fontSize * (fontSizeMobile ? 1.10 : 1.04);
    var centerY = H * 0.47;
    var top = centerY - lineHeight * (layout.length - 1) / 2;
    layout.forEach(function (line, i) {
      octx.fillText(line, W / 2, top + i * lineHeight);
    });

    var data = octx.getImageData(0, 0, W, H).data;
    var targets = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (data[(y * W + x) * 4 + 3] > 120) {
          targets.push({ x: x, y: y });
        }
      }
    }
    var cap = fontSizeMobile ? 22000 : 48000;
    if (targets.length > cap) {
      var keep = [];
      var stride = targets.length / cap;
      for (var j = 0; j < cap; j++) keep.push(targets[Math.floor(j * stride)]);
      targets = keep;
    }

    particles = targets.map(function (t) {
      return {
        x: t.x, y: t.y, tx: t.x, ty: t.y,
        vx: 0, vy: 0,
        size: (fontSizeMobile ? 0.9 : 1.1) + Math.random() * (fontSizeMobile ? 1.2 : 1.5)
      };
    });
    active = false;
    settling = false;
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f2ede2";
    ctx.globalAlpha = 0.96;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function activate() {
    if (active || settling || leaving || !particles.length) return;
    active = true;
    lastMove = performance.now();
    start = lastMove;
    if (!frame) frame = requestAnimationFrame(loop);
  }

  function settle() {
    if (!active) return;
    active = false;
    settling = true;
  }

  function finish() {
    settling = false;
    draw();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function loop(ts) {
    if (!active && !settling && !leaving) { finish(); return; }
    frame = requestAnimationFrame(loop);
    var now = ts || performance.now();
    var maxDist = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (leaving) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy = p.vy * 0.99 + 0.18;
      } else {
        if (active && mouse) {
          var mdx = p.x - mouse.x;
          var mdy = p.y - mouse.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 210 && md > 0.1) {
            var force = (1 - md / 210);
            p.vx += (mdx / md) * force * 2.6 + (-mdy / md) * force * 0.8;
            p.vy += (mdy / md) * force * 2.6 + (mdx / md) * force * 0.8;
          }
        }
        var spring = active ? 0.014 : 0.052;
        var damp = active ? 0.93 : 0.84;
        p.vx += (p.tx - p.x) * spring;
        p.vy += (p.ty - p.y) * spring;
        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx;
        p.y += p.vy;
        var dist = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y);
        if (dist > maxDist) maxDist = dist;
      }
    }
    draw();
    if (active && now - lastMove > 700) settle();
    if (settling && maxDist < 0.9) finish();
  }

  function enter(e) {
    if (e) e.preventDefault();
    if (leaving) return;
    if (!active) activate();
    leaving = true;
    active = false;
    settling = false;
    document.body.classList.add("is-leaving");
    particles.forEach(function (p) {
      var dx = p.x - W / 2;
      var dy = p.y - H / 2;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx = dx / d * (2 + Math.random() * 6);
      p.vy = dy / d * (2 + Math.random() * 6) - Math.random() * 2;
    });
    if (!frame) frame = requestAnimationFrame(loop);
    window.setTimeout(function () { window.location.href = "library.html"; }, 620);
  }

  window.addEventListener("pointermove", function (e) {
    mouse = { x: e.clientX, y: e.clientY };
    if (!active && !settling && !leaving) activate();
    else if (settling && !leaving) { active = true; settling = false; }
    lastMove = performance.now();
  }, { passive: true });
  window.addEventListener("pointerleave", function () { mouse = null; settle(); }, { passive: true });
  window.addEventListener("resize", function () {
    clearTimeout(window.__introResize);
    window.__introResize = setTimeout(function () { if (!leaving) resizeCanvas(); }, 160);
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
