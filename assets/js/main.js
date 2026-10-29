/* 道氏理论 · home interactions */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var body = document.body;

  /* Header ---------------------------------------------------------------- */
  var head = $("#siteHead");
  var onScroll = function () {
    if (!head) return;
    head.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var menuBtn = $("#menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        body.classList.remove("nav-open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* Continue reading ------------------------------------------------------ */
  var pill = $("#continuePill");
  if (pill) {
    try {
      var last = JSON.parse(localStorage.getItem("dow_last") || "null");
      if (last && last.c) {
        pill.hidden = false;
        pill.href = "read/ch" + String(last.c).padStart(2, "0") + ".html";
        $("#continueTitle").textContent = "第 " + last.c + " 章 · " + (last.title || "");
      }
    } catch (e) { /* ignore */ }
  }

  /* Three movements ------------------------------------------------------- */
  var movesSvg = $("#movesSvg");
  var moveInfo = $("#moveInfo");
  var MOVE_COPY = {
    primary: {
      kicker: "PRIMARY / 潮汐",
      title: "主要趋势",
      text: "整体向上或向下的运动，也就是牛市或熊市。它决定你应当站在哪一边。道氏理论的大部分工作，都在确认它是否仍在继续。",
      note: "“正确地确定主要运动的方向是成功投机的最重要的因素。”"
    },
    secondary: {
      kicker: "SECONDARY / 波浪",
      title: "次级反应",
      text: "牛市中的重要下跌，或熊市中的重要反弹。它通常持续三周到数月，回撤前一段趋势的 1/3 到 2/3，最容易被误认为趋势已经反转。",
      note: "“次级反应运动是牛市运行的维护措施之一，它对市场的过度投机是最有效果的检查。”"
    },
    daily: {
      kicker: "DAILY / 涟漪",
      title: "日间波动",
      text: "单日或数日的价格噪声。它本身几乎没有预测价值，只有最终拼成线态窄幅盘整等形态时，才值得被放回结构里阅读。",
      note: "“股票市场价格的日间波动是没有逻辑性的。”"
    }
  };

  if (movesSvg) {
    var NS = "http://www.w3.org/2000/svg";
    var startX = 50, endX = 690;
    function primaryY(x) {
      var t = (x - startX) / (endX - startX);
      return 420 - 290 * t + 20 * Math.sin(t * Math.PI * 5.2) - 10 * Math.sin(t * Math.PI * 1.3);
    }
    function secondaryY(x) {
      var t = (x - startX) / (endX - startX);
      return primaryY(x) + 38 * Math.sin(t * Math.PI * 14.5) * (0.5 + 0.5 * t);
    }
    function dailyY(x) {
      var t = (x - startX) / (endX - startX);
      return secondaryY(x) + 9 * Math.sin(t * Math.PI * 95) + 4 * Math.cos(t * Math.PI * 53);
    }
    function buildPath(fn) {
      var d = "";
      for (var x = startX; x <= endX; x += 4) {
        d += (x === startX ? "M" : "L") + x.toFixed(1) + " " + fn(x).toFixed(1);
      }
      return d;
    }
    var paths = {
      primary: $(".mv-primary", movesSvg),
      secondary: $(".mv-secondary", movesSvg),
      daily: $(".mv-daily", movesSvg)
    };
    if (paths.primary) paths.primary.setAttribute("d", buildPath(primaryY));
    if (paths.secondary) paths.secondary.setAttribute("d", buildPath(secondaryY));
    if (paths.daily) paths.daily.setAttribute("d", buildPath(dailyY));

    movesSvg.setAttribute("data-active", "primary");
    $$(".move-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var layer = btn.getAttribute("data-layer");
        $$(".move-tab").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        movesSvg.setAttribute("data-active", layer);
        var copy = MOVE_COPY[layer];
        moveInfo.innerHTML = '<p class="move-kicker">' + copy.kicker + "</p>" +
          "<h3>" + copy.title + "</h3><p>" + copy.text + "</p>" +
          '<p class="move-note">' + copy.note + "</p>";
      });
    });
  }

  /* Bull / bear phases ---------------------------------------------------- */
  var PHASES = {
    bull: {
      hint: "信心恢复 → 盈利改善 → 投机狂热",
      cards: [
        ["01", "信心恢复", "价格从低估中回到公认价值。市场仍然沉闷，坏消息还在，但卖压已经消失。牛市通常不会以激烈波段开始。", "价值回归 · 低量 · 怀疑"],
        ["02", "盈利改善", "商业环境好转，盈利数据被价格确认。这是牛市中最长、也最容易出现次级回调的阶段。", "盈利驱动 · 趋势确认 · 回调"],
        ["03", "投机狂热", "价格开始由希望和预期支撑。成交量放大，公众广泛参与，优质股的股息率反而不如债券。", "预期 · 高量 · 派发"]
      ]
    },
    bear: {
      hint: "希望破灭 → 景气收缩 → 被迫清仓",
      cards: [
        ["01", "希望破灭", "牛市最后一批买盘所寄托的希望开始瓦解。价格不再对好消息作出反应，反弹一次比一次弱。", "派发 · 怀疑 · 反弹失败"],
        ["02", "景气收缩", "商业萧条、收入下降，卖出不再是因为观点，而是因为需要现金。下跌变得活跃，上升变得沉闷。", "盈利下滑 · 现金需求 · 主跌段"],
        ["03", "被迫清仓", "优质证券也被不计价值地抛售。人们卖出的不是“不值得持有”的资产，而是“唯一卖得掉”的资产。", "恐慌 · 优质股补跌 · 底部"]
      ]
    }
  };

  var phaseChart = $("#phaseChart");
  var phaseCards = $("#phaseCards");
  var phaseHint = $("#phaseHint");
  function setPhase(mode) {
    if (!phaseChart) return;
    $$(".phase-tab").forEach(function (b) {
      var on = b.getAttribute("data-mode") === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$(".ph-mode", phaseChart).forEach(function (g) {
      g.style.display = g.getAttribute("data-mode") === mode ? "" : "none";
    });
    if (phaseHint) phaseHint.textContent = PHASES[mode].hint;
    if (phaseCards) {
      phaseCards.innerHTML = PHASES[mode].cards.map(function (c) {
        return '<article class="phase-card"><span>' + c[0] + "</span><h3>" + c[1] +
          "</h3><p>" + c[2] + '</p><div class="pc-meta">' + c[3] + "</div></article>";
      }).join("");
    }
  }
  $$(".phase-tab").forEach(function (btn) {
    btn.addEventListener("click", function () { setPhase(btn.getAttribute("data-mode")); });
  });

  /* Search ---------------------------------------------------------------- */
  var searchDialog = $("#searchDialog");
  var searchInput = $("#searchInput");
  var searchResults = $("#searchResults");
  var searchCount = $("#searchCount");
  var searchData = window.DOW_SEARCH || [];
  var isReader = /\/read\//.test(window.location.pathname);
  var linkPrefix = isReader ? "" : "read/";

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function openSearch() {
    if (!searchDialog) return;
    if (typeof searchDialog.showModal === "function") searchDialog.showModal();
    else searchDialog.setAttribute("open", "");
    setTimeout(function () { if (searchInput) searchInput.focus(); }, 60);
  }
  function closeSearch() {
    if (!searchDialog) return;
    if (typeof searchDialog.close === "function") searchDialog.close();
    else searchDialog.removeAttribute("open");
  }

  function renderSearch(q) {
    if (!searchResults) return;
    q = q.trim();
    if (!q) {
      searchResults.innerHTML = '<div class="search-empty"><span>⌕</span><p>试试“确认”“次级反应”“成交量”或“1929”。</p></div>';
      if (searchCount) searchCount.textContent = "输入关键词，检索 19 章全文";
      return;
    }
    var re = new RegExp(escapeReg(q), "i");
    var hits = [];
    for (var i = 0; i < searchData.length; i++) {
      var item = searchData[i];
      var inText = re.test(item.x);
      var inTitle = re.test(item.t);
      if (!inText && !inTitle) continue;
      var score = (inTitle ? 4 : 0) + (inText ? 1 : 0);
      hits.push({ item: item, score: score });
      if (hits.length >= 220) break;
    }
    hits.sort(function (a, b) { return b.score - a.score || a.item.c - b.item.c; });
    hits = hits.slice(0, 30);
    if (searchCount) searchCount.textContent = hits.length ? "找到 " + hits.length + " 条相关段落" : "没有找到匹配内容";
    if (!hits.length) {
      searchResults.innerHTML = '<div class="search-empty"><span>·</span><p>没有找到“' + escapeHTML(q) + '”。试试更短的关键词。</p></div>';
      return;
    }
    searchResults.innerHTML = hits.map(function (h) {
      var item = h.item;
      var idx = item.x.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) idx = 0;
      var start = Math.max(0, idx - 35);
      var snippet = (start > 0 ? "…" : "") + item.x.slice(start, start + 150) + (item.x.length > start + 150 ? "…" : "");
      snippet = escapeHTML(snippet).replace(new RegExp(escapeReg(escapeHTML(q)), "gi"), function (m) { return "<mark>" + m + "</mark>"; });
      return '<a class="search-result" href="' + linkPrefix + "ch" + String(item.c).padStart(2, "0") + ".html#p" + item.p + '">' +
        '<div class="sr-top"><span class="sr-no">' + String(item.c).padStart(2, "0") + '</span><span class="sr-title">' +
        escapeHTML(item.t) + '</span><span class="sr-page">p.' + (item.g || "—") + "</span></div>" +
        '<div class="sr-text">' + snippet + "</div></a>";
    }).join("");
  }

  var searchTimer;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { renderSearch(searchInput.value); }, 140);
    });
  }
  $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  $$("[data-search-close]").forEach(function (b) { b.addEventListener("click", closeSearch); });
  if (searchDialog) {
    searchDialog.addEventListener("click", function (e) {
      if (e.target === searchDialog) closeSearch();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === "Escape" && searchDialog && searchDialog.open) closeSearch();
  });

  /* Lightbox -------------------------------------------------------------- */
  var lightbox = $("#lightbox");
  var lbImage = $("#lbImage");
  var lbCaption = $("#lbCaption");
  $$("[data-lightbox]").forEach(function (fig) {
    fig.addEventListener("click", function () {
      if (!lightbox) return;
      lbImage.src = fig.getAttribute("data-src");
      lbImage.alt = fig.querySelector("img") ? fig.querySelector("img").alt : "";
      lbCaption.textContent = fig.getAttribute("data-caption") || "";
      lightbox.hidden = false;
      body.style.overflow = "hidden";
    });
  });
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    body.style.overflow = "";
  }
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lb-close")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }
})();

/* Lazy-load the sand cursor layer on non-reader pages. */
(function () {
  if (window.__sandLoader) return;
  window.__sandLoader = true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var script = document.currentScript;
  if (!script) return;
  var el = document.createElement("script");
  el.src = new URL("sand.js", script.src).href;
  el.async = true;
  document.head.appendChild(el);
})();
