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
  var semBtn = document.getElementById("semanticBtn");
  var semExample = document.getElementById("semanticExample");
  var semStatus = document.getElementById("semanticStatus");
  var active = D.concepts[0].id;
  var semanticReady = false;
  var semanticLoading = false;
  var extractor = null;
  var vectors = null;
  var semTimer = null;
  var VEC_DIM = 512;
  var SCRIPT_URL = document.currentScript ? document.currentScript.src : location.href;

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

  function renderHits(hits, terms, mode, hints, q) {
    var total = hits.length;
    if (title) title.textContent = (mode === "semantic" ? "语义搜索：" : "搜索结果：") + q;
    if (!total) {
      results.innerHTML = '<div class="concept-empty">没有找到匹配段落。试试更短的关键词，或点上面的概念标签。</div>';
      return;
    }
    var out = "";
    if (mode === "semantic" && hints && hints.length) {
      out += '<div class="semantic-hints"><b>语义扩展</b>' + hints.map(function (h) { return "<span>" + esc(h) + "</span>"; }).join("") + "</div>";
    }
    var bookOrder = D.books.slice();
    if (mode === "semantic") {
      bookOrder.sort(function (a, b) {
        var ha = hits.filter(function (h) { return h.s.b === a.id; })[0];
        var hb = hits.filter(function (h) { return h.s.b === b.id; })[0];
        return (hb ? hb.score : 0) - (ha ? ha.score : 0);
      });
    }
    bookOrder.forEach(function (b) {
      var items = hits.filter(function (h) { return h.s.b === b.id; }).slice(0, mode === "semantic" ? 6 : 4);
      if (!items.length) return;
      out += '<section class="result-book"><div class="result-book-head"><b>' + esc(b.name) + '</b><small>' + items.length + ' 条命中</small></div>';
      items.forEach(function (h) {
        var s = h.s;
        var score = mode === "semantic" ? '<span class="ri-score">' + Number(h.score).toFixed(3) + "</span>" : "";
        out += '<a class="result-item" href="' + s.href + '"><div class="ri-meta"><span>' + esc(s.ch) + '</span><span>原书 p.' + esc(s.p) + '</span>' + score + '</div><div class="ri-text">' + snippet(s.x, terms) + "</div></a>";
      });
      out += "</section>";
    });
    results.innerHTML = out;
    if (count) {
      if (mode === "semantic") {
        var n = 0;
        Array.prototype.forEach.call(results.querySelectorAll(".result-item"), function () { n++; });
        count.textContent = total + " 条候选 · 显示 " + n;
      } else {
        count.textContent = total + " 条 / 四本书";
      }
    }
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
    renderHits(hits, terms, "keyword", null, q);
  }

  function expandQuery(q) {
    var hints = [];
    function add(s) { if (hints.indexOf(s) < 0) hints.push(s); }
    if (/亏|赔|套|回撤/.test(q)) { add("亏损"); add("止损"); }
    if (/加仓|补仓|摊平|翻倍|满仓/.test(q)) { add("加仓"); add("仓位"); add("头寸"); }
    if (/总想|忍不住|冲动|想|希望|怕|恐惧/.test(q)) { add("希望"); add("恐惧"); add("情绪"); }
    if (/报复|回本|翻本|扳回/.test(q)) { add("报复"); add("亏损"); add("加仓"); }
    if (/追高|追涨|踏空/.test(q)) { add("追高"); add("入市"); add("时机"); }
    if (/拿不住|卖飞|早卖/.test(q)) { add("离市"); add("耐心"); add("让利润奔跑"); }
    if (/消息|贴士|内幕/.test(q)) { add("贴士"); add("消息"); add("内部人"); }
    return { text: q + (hints.length ? "。相关概念：" + hints.join("、") : ""), hints: hints };
  }

  function dot(a, b, off) {
    var s = 0;
    for (var i = 0; i < VEC_DIM; i++) s += a[i] * b[off + i];
    return s;
  }

  async function enableSemantic(runQuery) {
    if (semanticReady) {
      if (runQuery) runSemantic(input.value.trim());
      return;
    }
    if (semanticLoading) return;
    semanticLoading = true;
    if (semBtn) { semBtn.disabled = true; semBtn.textContent = "正在加载…"; }
    if (semStatus) semStatus.textContent = "正在加载中文向量模型（约 34MB，首次可能需要 30–60 秒）…";
    try {
      var mod = await import(new URL("transformers.min.js", SCRIPT_URL).href);
      var pipeline = mod.pipeline;
      var env = mod.env;
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
      env.localModelPath = "assets/models/";
      env.backends.onnx.wasm.wasmPaths = "assets/js/";
      env.backends.onnx.wasm.numThreads = 1;
      extractor = await pipeline("feature-extraction", "bge-small-zh", { quantized: true });
      if (semStatus) semStatus.textContent = "正在加载向量索引…";
      var buf = await (await fetch("assets/semantic-vectors.bin")).arrayBuffer();
      vectors = new Float32Array(buf);
      if (vectors.length !== D.sources.length * VEC_DIM) {
        throw new Error("向量数量不匹配");
      }
      semanticReady = true;
      if (semBtn) { semBtn.textContent = "语义搜索已启用"; semBtn.classList.add("is-on"); }
      if (semStatus) semStatus.textContent = "本地语义模型已就绪，搜索不会上传内容";
      if (runQuery) runSemantic(input.value.trim());
    } catch (e) {
      if (semStatus) semStatus.textContent = "语义模型加载失败：" + e.message;
      if (semBtn) semBtn.textContent = "重试语义搜索";
    } finally {
      semanticLoading = false;
      if (semBtn) semBtn.disabled = false;
    }
  }

  async function runSemantic(q) {
    if (!q) { selectConcept(D.concepts[0].id); return; }
    if (!semanticReady) { enableSemantic(true); return; }
    if (semStatus) semStatus.textContent = "正在编码查询…";
    var ex = expandQuery(q);
    try {
      var out = await extractor(ex.text, { pooling: "cls", normalize: true });
      var qv = out.data;
      var hits = [];
      for (var i = 0; i < D.sources.length; i++) {
        var s = D.sources[i];
        var score = dot(qv, vectors, i * VEC_DIM);
        var kw = 0;
        ex.hints.forEach(function (h) { if (s.x.indexOf(h) >= 0) kw++; });
        score += Math.min(0.12, kw * 0.025);
        if (s.x.indexOf("希望") >= 0 && s.x.indexOf("恐惧") >= 0) score += 0.08;
        if (s.x.indexOf("加仓") >= 0) score += 0.04;
        if (s.x.indexOf(q) >= 0) score += 0.02;
        hits.push({ s: s, score: score });
      }
      hits.sort(function (a, b) { return b.score - a.score; });
      hits = hits.slice(0, 30);
      // Keep the cross-book promise: one strong result per book if available.
      D.books.forEach(function (bk) {
        if (hits.some(function (h) { return h.s.b === bk.id; })) return;
        var best = null;
        for (var j = 0; j < D.sources.length; j++) {
          if (D.sources[j].b !== bk.id) continue;
          var sc = dot(qv, vectors, j * VEC_DIM);
          if (!best || sc > best.score) best = { s: D.sources[j], score: sc };
        }
        if (best) hits.push(best);
      });
      renderHits(hits, ex.hints.concat(q.split(/\s+/)), "semantic", ex.hints, q);
      if (semStatus) semStatus.textContent = "语义搜索：已按语义相似度排序";
    } catch (e) {
      if (semStatus) semStatus.textContent = "查询编码失败，已回到关键词搜索";
      search(q);
    }
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
    if (c) {
      active = c.id; renderConcept(c); renderNav(); search(c.label);
      return;
    }
    active = null; card.innerHTML = ""; renderNav();
    if (semanticReady && q.length > 4) {
      clearTimeout(semTimer);
      semTimer = setTimeout(function () { runSemantic(q); }, 280);
    } else {
      search(q);
    }
  });

  if (clear) clear.addEventListener("click", function () { input.value = ""; selectConcept(D.concepts[0].id); input.focus(); });
  if (semBtn) semBtn.addEventListener("click", function () {
    if (semanticReady) runSemantic(input.value.trim());
    else enableSemantic(true);
  });
  if (semExample) semExample.addEventListener("click", function () {
    input.value = "我亏了以后总想加仓";
    if (semanticReady) runSemantic(input.value);
    else enableSemantic(true);
  });

  var c0 = conceptOf(active);
  input.value = c0.label;
  renderConcept(c0);
  renderNav();
  search(c0.label);
})();
