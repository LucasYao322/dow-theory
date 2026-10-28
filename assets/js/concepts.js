(function () {
  var D = window.CONCEPT_INDEX;
  if (!D) return;
  var books = {};
  D.books.forEach(function (b) { books[b.id] = b; });
  var input = document.getElementById("conceptSearch");
  var clear = document.getElementById("conceptClear");
  var chips = document.getElementById("conceptChips");
  var list = document.getElementById("conceptList");
  var card = document.getElementById("conceptCard");
  var results = document.getElementById("conceptResults");
  var title = document.getElementById("resultTitle");
  var count = document.getElementById("resultCount");
  var active = D.concepts[0].id;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function bookOf(id) { return books[id] || { name: id, short: id }; }
  function conceptOf(id) {
    for (var i = 0; i < D.concepts.length; i++) if (D.concepts[i].id === id) return D.concepts[i];
    return null;
  }

  function renderNav() {
    chips.innerHTML = D.concepts.map(function (c) {
      return '<button type="button" class="concept-chip' + (c.id === active ? " is-active" : "") + '" data-c="' + c.id + '">' + esc(c.label) + "</button>";
    }).join("");
    list.innerHTML = D.concepts.map(function (c) {
      return '<button type="button" class="' + (c.id === active ? "is-active" : "") + '" data-c="' + c.id + '">' + esc(c.label) + "</button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-c]"), function (b) {
      b.addEventListener("click", function () { selectConcept(b.getAttribute("data-c")); });
    });
  }

  function renderConcept(c) {
    if (!c) { card.innerHTML = ""; return; }
    var stances = c.stances.map(function (s) {
      var b = bookOf(s[0]);
      return '<div class="stance"><span class="book-name"><i class="book-dot ' + s[0] + '"></i>' + esc(b.name) + '</span><p>' + esc(s[1]) + '</p><a href="' + s[3] + '">' + esc(s[2]) + ' →</a></div>';
    }).join("");
    card.innerHTML = '<div class="concept-card"><div class="cc-top"><span>CONCEPT ' + String(D.concepts.indexOf(c) + 1).padStart(2, "0") + ' / 08</span><span>' + esc(c.label) + '</span></div>' +
      '<h2>' + esc(c.label) + '</h2><p class="concept-question">' + esc(c.question) + '</p>' +
      '<div class="stance-grid">' + stances + '</div>' +
      '<div class="concept-conflict"><b>差异 / CONFLICT</b><p>' + esc(c.conflict) + '</p></div></div>';
  }

  function termsFor(q) {
    var c = conceptOf(active);
    if (c && (!q || q === c.label || q === c.id)) return c.terms;
    return q.split(/\s+/).filter(Boolean);
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var idx = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = lower.indexOf(terms[i].toLowerCase());
      if (p >= 0 && (idx < 0 || p < idx)) idx = p;
    }
    if (idx < 0) return esc(text.slice(0, 180)) + (text.length > 180 ? "…" : "");
    var start = Math.max(0, idx - 55);
    var out = (start > 0 ? "…" : "") + text.slice(start, start + 210) + (text.length > start + 210 ? "…" : "");
    var safe = esc(out);
    terms.forEach(function (t) {
      if (!t) return;
      safe = safe.replace(new RegExp(escReg(esc(t)), "gi"), function (m) { return "<mark>" + m + "</mark>"; });
    });
    return safe;
  }

  function search(q) {
    var terms = termsFor(q);
    var hits = [];
    D.sources.forEach(function (s) {
      var score = 0;
      terms.forEach(function (t) {
        if (!t) return;
        var n = s.x.toLowerCase().split(t.toLowerCase()).length - 1;
        if (n > 0) score += n * 2;
        if (s.ch.toLowerCase().indexOf(t.toLowerCase()) >= 0) score += 1;
      });
      if (score > 0) hits.push({ s: s, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    var total = hits.length;
    if (count) count.textContent = total + " 条 / 三本书";
    if (title) title.textContent = q ? "搜索结果：" + q : "搜索结果";
    if (!total) {
      results.innerHTML = '<div class="concept-empty">没有找到匹配段落。试试更短的关键词，或点上面的概念标签。</div>';
      return;
    }
    var out = "";
    D.books.forEach(function (b) {
      var items = hits.filter(function (h) { return h.s.b === b.id; }).slice(0, 4);
      if (!items.length) return;
      out += '<section class="result-book"><div class="result-book-head"><b>' + esc(b.name) + '</b><small>' + items.length + ' 条命中</small></div>';
      items.forEach(function (h) {
        var s = h.s;
        out += '<a class="result-item" href="' + s.href + '"><div class="ri-meta"><span>' + esc(s.ch) + '</span><span>原书 p.' + esc(s.p) + '</span></div><div class="ri-text">' + snippet(s.x, terms) + "</div></a>";
      });
      out += "</section>";
    });
    results.innerHTML = out;
  }

  function selectConcept(id) {
    active = id;
    var c = conceptOf(id);
    if (c) { input.value = c.label; renderConcept(c); }
    renderNav();
    search(c ? c.label : input.value);
  }

  input.addEventListener("input", function () {
    var q = input.value.trim();
    if (!q) { selectConcept(D.concepts[0].id); return; }
    var c = D.concepts.filter(function (x) { return x.label === q || x.id === q || x.terms.indexOf(q) >= 0; })[0];
    if (c) { active = c.id; renderConcept(c); renderNav(); search(c.label); }
    else { active = null; card.innerHTML = ""; renderNav(); search(q); }
  });
  if (clear) clear.addEventListener("click", function () { input.value = ""; selectConcept(D.concepts[0].id); input.focus(); });

  var c0 = conceptOf(active);
  input.value = c0.label;
  renderConcept(c0);
  renderNav();
  search(c0.label);
})();