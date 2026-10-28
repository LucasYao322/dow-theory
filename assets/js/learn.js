(function () {
  var KEY = "trading_learn_v1";
  var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-lesson]"));
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
  function save() {
    var v = {};
    boxes.forEach(function (b) { if (b.checked) v[b.getAttribute("data-lesson")] = 1; });
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function render() {
    var done = 0;
    boxes.forEach(function (b) {
      var on = !!saved[b.getAttribute("data-lesson")];
      b.checked = on;
      b.closest(".lesson").classList.toggle("is-done", on);
      if (on) done++;
    });
    var out = document.querySelector("[data-learn-count]");
    if (out) out.textContent = done + " / " + boxes.length;
    ["dow", "turtle", "spec"].forEach(function (track) {
      var all = boxes.filter(function (b) { return b.closest(".lesson").getAttribute("data-track") === track; });
      var n = all.filter(function (b) { return b.checked; }).length;
      var bar = document.querySelector('[data-track-bar="' + track + '"]');
      if (bar) bar.style.width = (all.length ? n / all.length * 100 : 0) + "%";
    });
  }
  boxes.forEach(function (b) {
    b.addEventListener("change", function () {
      saved[b.getAttribute("data-lesson")] = b.checked ? 1 : 0;
      if (!b.checked) delete saved[b.getAttribute("data-lesson")];
      save(); render();
    });
  });
  render();
})();