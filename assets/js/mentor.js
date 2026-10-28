(function () {
  var KEY = "trading_mentor_check_v1";
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-check]"));
  var count = document.getElementById("checkCount");
  var bar = document.getElementById("checkBar");
  var reset = document.getElementById("checkReset");
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function render() {
    var done = items.filter(function (i) { return i.checked; }).length;
    if (count) count.textContent = done + " / " + items.length;
    if (bar) bar.parentElement.style.setProperty("--p", done / items.length);
    items.forEach(function (i) {
      i.closest(".check-item").classList.toggle("is-done", i.checked);
    });
  }
  var saved = read();
  items.forEach(function (i) {
    if (saved.indexOf(i.getAttribute("data-check")) >= 0) i.checked = true;
    i.addEventListener("change", function () {
      var v = items.filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute("data-check"); });
      save(v); render();
    });
  });
  if (reset) reset.addEventListener("click", function () {
    items.forEach(function (i) { i.checked = false; }); save([]); render();
  });
  render();
})();