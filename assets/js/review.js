(function () {
  var D = window.CONCEPT_INDEX;
  if (!D) return;
  var form = document.getElementById("reviewForm");
  var submit = document.getElementById("reviewSubmit");
  var status = document.getElementById("reviewStatus");
  var result = document.getElementById("reviewResult");
  var placeholder = document.getElementById("reviewPlaceholder");
  var content = document.getElementById("reviewContent");
  var booksEl = document.getElementById("reviewBooks");
  var errorGrid = document.getElementById("errorGrid");
  var suspects = document.getElementById("reviewSuspects");
  var diagnosis = document.getElementById("diagnosis");
  var reviewR = document.getElementById("reviewR");
  var currentHits = [];
  var currentTrade = null;

  var ERRORS = [
    { id: "trend", label: "方向错了 / 逆势", q: "是不是在跟主要趋势作对？", rule: "下一次，先等两个指数或价格结构确认，再决定方向；没有确认就不站边。", terms: ["趋势", "逆势", "确认", "抄底", "摸顶"] },
    { id: "entry", label: "入场太早 / 追高", q: "是不是怕错过，提前埋伏或追在末端？", rule: "把入场写成触发条件：突破/回调/关键点。没触发就等，不提前，也不追。", terms: ["入市", "时机", "追高", "突破", "关键点"] },
    { id: "stop", label: "止损没执行 / 越亏越扛", q: "是不是把止损往后移，或者等它回来？", rule: "入场前写 2N 或结构止损；触及就执行，不移动、不摊平。", terms: ["止损", "亏损", "退出", "希望"] },
    { id: "position", label: "仓位过大 / 亏损加仓", q: "是不是仓位超过计划，或者用加仓摊平成本？", rule: "单笔风险不超过 1N/1%；不在亏损仓上加码，只在盈利仓上加。", terms: ["仓位", "头寸", "加仓", "单位", "N"] },
    { id: "exit", label: "离市太早 / 拿不住", q: "是不是赚一点就跑，或者被正常波动洗出去？", rule: "离市交给规则：反向突破或结构破坏；不凭“赚够了”提前下车。", terms: ["离市", "耐心", "让利润奔跑", "落袋"] },
    { id: "news", label: "听消息 / 没有系统", q: "是不是因为消息、贴士或别人的判断入场？", rule: "消息不构成入场信号；只按系统信号交易，退出也由系统决定。", terms: ["贴士", "消息", "内部人", "系统"] },
    { id: "revenge", label: "报复性交易 / 情绪化", q: "是不是连亏之后想一把赚回来？", rule: "连亏后降仓或停手；先写情绪，再决定是否下单。不要用加大仓位修复自尊。", terms: ["报复", "回本", "亏损", "加仓", "情绪"] },
    { id: "normal", label: "正常亏损 / 系统成本", q: "如果每一步都按规则，这是不是只是一笔成本？", rule: "按规则执行的亏损是系统成本；不要因为单笔亏损改系统，先看 20 笔的整体。", terms: ["亏损", "系统", "一致性", "纪律"] }
  ];

  function localDate() {
    var d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  document.getElementById("rDate").value = localDate();

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function num(id) { var v = val(id); return v === "" ? null : Number(v); }

  function computeR() {
    var entry = num("rEntry"), stop = num("rStop"), exit = num("rExit"), size = num("rSize");
    if (entry === null || stop === null || exit === null || size === null) return null;
    var dir = val("rDir") === "short" ? -1 : 1;
    var risk = Math.abs(entry - stop) * size;
    if (!risk) return null;
    return ((exit - entry) * size * dir) / risk;
  }

  function detect(text, r) {
    var out = [];
    function add(id) { if (out.indexOf(id) < 0) out.push(id); }
    if (/逆势|抄底|摸顶|方向|看错/.test(text)) add("trend");
    if (/追高|追涨|提前|怕错过|踏空/.test(text)) add("entry");
    if (/没止损|不止损|移动止损|扛|等回本|硬扛/.test(text)) add("stop");
    if (/重仓|满仓|加仓|补仓|摊平|仓位大/.test(text)) add("position");
    if (/卖早|拿不住|落袋|赚一点|卖飞/.test(text)) add("exit");
    if (/消息|贴士|内幕|朋友|群里/.test(text)) add("news");
    if (/报复|回本|翻本|扳回|赚回来|连续亏/.test(text)) add("revenge");
    if (r !== null && r <= -1.5 && !out.length) add("normal");
    return out.slice(0, 4);
  }

  function fmtR(r) {
    if (r === null) return "未填价格，无法计算 R";
    return (r >= 0 ? "+" : "") + r.toFixed(2) + "R";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderSuspects(list) {
    if (!list.length) { suspects.innerHTML = ""; return; }
    suspects.innerHTML = '<span class="rs-label">系统怀疑（仅供参考）</span>' + list.map(function (id) {
      var e = ERRORS.filter(function (x) { return x.id === id; })[0];
      return '<span class="rs-tag">' + esc(e.label) + "</span>";
    }).join("");
  }

  function renderErrors(suggested) {
    errorGrid.innerHTML = ERRORS.map(function (e) {
      var cls = suggested.indexOf(e.id) >= 0 ? " is-suggested" : "";
      return '<button type="button" class="error-card' + cls + '" data-error="' + e.id + '"><span>' + esc(e.label) + '</span><small>' + esc(e.q) + "</small></button>";
    }).join("");
    Array.prototype.forEach.call(errorGrid.querySelectorAll("[data-error]"), function (b) {
      b.addEventListener("click", function () { selectError(b.getAttribute("data-error")); });
    });
  }

  function renderBooks(hits) {
    var order = D.books.slice().sort(function (a, b) {
      var ha = hits.filter(function (h) { return h.s.b === a.id; })[0];
      var hb = hits.filter(function (h) { return h.s.b === b.id; })[0];
      return (hb ? hb.score : 0) - (ha ? ha.score : 0);
    });
    var out = '<div class="review-books-head"><span>03 / 原文对照</span><b>三本书里最接近的段落</b></div>';
    order.forEach(function (bk) {
      var items = hits.filter(function (h) { return h.s.b === bk.id; }).slice(0, 3);
      if (!items.length) return;
      out += '<section class="review-book"><div class="review-book-head"><b>' + esc(bk.name) + '</b><small>' + items.length + ' 段</small></div>';
      items.forEach(function (h) {
        var s = h.s;
        out += '<a class="review-passage" href="' + s.href + '"><div class="rp-meta"><span>' + esc(s.ch) + '</span><span>原书 p.' + esc(s.p) + '</span><span class="rp-score">' + Number(h.score).toFixed(3) + '</span></div><p>' + esc(s.x.slice(0, 190)) + (s.x.length > 190 ? "…" : "") + "</p></a>";
      });
      out += "</section>";
    });
    booksEl.innerHTML = out;
  }

  function selectError(id) {
    var e = ERRORS.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    Array.prototype.forEach.call(errorGrid.querySelectorAll("[data-error]"), function (b) {
      b.classList.toggle("is-selected", b.getAttribute("data-error") === id);
    });
    var related = [];
    D.books.forEach(function (bk) {
      var pool = currentHits.filter(function (h) { return h.s.b === bk.id; });
      var match = pool.filter(function (h) {
        return e.terms.some(function (t) { return h.s.x.indexOf(t) >= 0; });
      })[0];
      if (match) related.push(match);
      else if (pool[0]) related.push(pool[0]);
    });
    related = related.slice(0, 4);
    var links = related.map(function (h) {
      return '<a href="' + h.s.href + '">' + esc(h.s.ch) + ' · p.' + esc(h.s.p) + " →</a>";
    }).join("");
    diagnosis.hidden = false;
    diagnosis.innerHTML = '<div class="diagnosis-head"><span>YOUR DIAGNOSIS</span><h2>' + esc(e.label) + '</h2></div>' +
      '<p class="diagnosis-q">' + esc(e.q) + '</p>' +
      '<div class="diagnosis-rule"><b>下一次的规则</b><p>' + esc(e.rule) + '</p></div>' +
      '<div class="diagnosis-links"><b>回到原文</b><div>' + links + '</div></div>' +
      '<button class="diagnosis-copy" type="button" id="copyReview">复制复盘摘要</button>';
    document.getElementById("copyReview").addEventListener("click", function () {
      var text = "复盘：" + (currentTrade ? currentTrade.symbol : "") + " / " + fmtR(currentTrade ? currentTrade.r : null) + "\n诊断：" + e.label + "\n下一次的规则：" + e.rule;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { status.textContent = "复盘摘要已复制"; });
    });
    diagnosis.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function fallback(q) {
    var terms = q.split(/\s+/).filter(function (x) { return x.length > 1; });
    var hits = D.sources.map(function (s) {
      var score = 0;
      terms.forEach(function (t) { if (s.x.indexOf(t) >= 0) score += 1; });
      return { s: s, score: score };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    return { hits: hits, hints: [] };
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var reason = val("rReason");
    if (!reason) { status.textContent = "先写下交易理由，再生成复盘。"; return; }
    var q = [reason, val("rEmotion"), val("rNote"), val("rMarket"), val("rSymbol"), "亏损交易，错误复盘"].join("。");
    var r = computeR();
    var suggested = detect(q, r);
    currentTrade = { symbol: val("rSymbol"), r: r };
    submit.disabled = true;
    submit.textContent = "正在读三本书…";
    status.textContent = "准备语义模型…";
    placeholder.hidden = true;
    content.hidden = true;
    diagnosis.hidden = true;
    diagnosis.innerHTML = "";
    currentHits = [];
    result.classList.add("is-loading");
    (window.SemanticEngine ? window.SemanticEngine.search(q, function (m) { status.textContent = m; }) : Promise.reject(new Error("engine missing")))
      .then(function (res) {
        currentHits = res.hits;
        reviewR.textContent = fmtR(r);
        renderSuspects(suggested);
        renderErrors(suggested);
        renderBooks(res.hits);
        content.hidden = false;
        result.classList.remove("is-loading");
        status.textContent = "已完成语义对照；请选择最像的一种错误";
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (err) {
        var res = fallback(q);
        currentHits = res.hits;
        reviewR.textContent = fmtR(r);
        renderSuspects(suggested);
        renderErrors(suggested);
        renderBooks(res.hits);
        content.hidden = false;
        result.classList.remove("is-loading");
        status.textContent = "语义模型不可用，已用关键词对照：" + err.message;
      })
      .finally(function () {
        submit.disabled = false;
        submit.textContent = "重新生成 →";
      });
  });
})();