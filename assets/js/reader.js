/* 道氏理论 · reader interactions */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var body = document.body;
  var chapter = $("#chapter");
  var scanDialog = $("#scanDialog");
  var chapterNo = scanDialog ? Number(scanDialog.getAttribute("data-chapter")) : 0;
  var chapterTitle = scanDialog ? scanDialog.getAttribute("data-title") : "";
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  /* Reveal ---------------------------------------------------------------- */
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$(".reveal").forEach(function (el) { revealObserver.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* Last-read marker ------------------------------------------------------ */
  if (chapterNo) {
    try {
      localStorage.setItem("dow_last", JSON.stringify({
        c: chapterNo, title: chapterTitle, at: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  /* Reading progress ------------------------------------------------------ */
  var progress = $("#readingProgress");
  var sideProgress = $("#sideProgress");
  function updateProgress() {
    if (!chapter) return;
    var top = chapter.offsetTop - 120;
    var end = chapter.offsetTop + chapter.offsetHeight - window.innerHeight + 180;
    var p = end > top ? (window.scrollY - top) / (end - top) : 0;
    p = Math.max(0, Math.min(1, p));
    if (progress) progress.style.width = (p * 100).toFixed(2) + "%";
    if (sideProgress) sideProgress.style.width = (p * 100).toFixed(2) + "%";
  }
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  /* Font size ------------------------------------------------------------- */
  var root = document.documentElement;
  var size = Number(safeGet("dow_font") || 18);
  if (!(size >= 16 && size <= 23)) size = 18;
  function applySize() {
    root.style.setProperty("--reader-size", size + "px");
    try { localStorage.setItem("dow_font", String(size)); } catch (e) { /* ignore */ }
  }
  applySize();
  var minus = $("#fontMinus"), plus = $("#fontPlus");
  if (minus) minus.addEventListener("click", function () { size = Math.max(16, size - 1); applySize(); });
  if (plus) plus.addEventListener("click", function () { size = Math.min(23, size + 1); applySize(); });

  /* Theme ----------------------------------------------------------------- */
  var themeBtn = $("#themeBtn");
  var themeLabel = themeBtn ? $(".rt-text", themeBtn) : null;
  function applyTheme(dark) {
    body.classList.toggle("theme-dark", dark);
    if (themeBtn) {
      themeBtn.classList.toggle("is-active", dark);
      themeBtn.setAttribute("aria-pressed", String(dark));
    }
    if (themeLabel) themeLabel.textContent = dark ? "日间" : "夜间";
    var icon = themeBtn ? $(".theme-icon", themeBtn) : null;
    if (icon) icon.textContent = dark ? "◑" : "◐";
    try { localStorage.setItem("dow_theme", dark ? "dark" : "light"); } catch (e) { /* ignore */ }
  }
  applyTheme(safeGet("dow_theme") === "dark");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () { applyTheme(!body.classList.contains("theme-dark")); });
  }

  /* Bookmark -------------------------------------------------------------- */
  var bookmarkBtn = $("#bookmarkBtn");
  function getFavs() {
    try { return JSON.parse(localStorage.getItem("dow_favs") || "[]"); }
    catch (e) { return []; }
  }
  function isFav() { return getFavs().indexOf(chapterNo) >= 0; }
  function renderFav() {
    if (!bookmarkBtn) return;
    var fav = isFav();
    var icon = $(".bm-icon", bookmarkBtn);
    var text = $(".rt-text", bookmarkBtn);
    if (icon) {
      icon.textContent = fav ? "◆" : "◇";
      icon.classList.toggle("is-saved", fav);
    }
    if (text) text.textContent = fav ? "已收藏" : "收藏";
    bookmarkBtn.setAttribute("aria-pressed", String(fav));
    bookmarkBtn.setAttribute("aria-label", fav ? "取消收藏本章" : "收藏本章");
  }
  renderFav();
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", function () {
      var favs = getFavs();
      var i = favs.indexOf(chapterNo);
      if (i >= 0) favs.splice(i, 1);
      else favs.push(chapterNo);
      try { localStorage.setItem("dow_favs", JSON.stringify(favs)); } catch (e) { /* ignore */ }
      renderFav();
    });
  }

  /* Scan viewer ----------------------------------------------------------- */
  if (scanDialog) {
    var start = Number(scanDialog.getAttribute("data-start"));
    var end = Number(scanDialog.getAttribute("data-end"));
    var pages = [];
    for (var p = start; p <= end; p++) pages.push(p);
    var idx = 0;
    var img = $("#scanImage");
    var counter = $("#scanCounter");
    var loader = $("#scanLoader");
    var prev = $("#scanPrev");
    var next = $("#scanNext");
    var full = $("#scanOpenFull");

    function pageUrl(n) {
      return "../assets/pages/" + String(n).padStart(3, "0") + ".webp";
    }
    function renderScan() {
      if (!pages.length) return;
      var n = pages[idx];
      var bookPage = n >= 9 ? n - 8 : n;
      if (loader) { loader.style.display = "block"; loader.textContent = "正在载入原书第 " + bookPage + " 页…"; }
      if (img) {
        img.style.opacity = "0";
        img.src = pageUrl(n);
        img.alt = "原书影印：第 " + bookPage + " 页";
        img.onload = function () {
          img.style.opacity = "1";
          if (loader) loader.style.display = "none";
        };
      }
      if (counter) counter.textContent = "原书第 " + bookPage + " 页 · " + (idx + 1) + " / " + pages.length;
      if (prev) prev.style.opacity = idx === 0 ? "0.3" : "1";
      if (next) next.style.opacity = idx === pages.length - 1 ? "0.3" : "1";
      if (full) full.href = pageUrl(n);
    }
    function openScan() {
      idx = 0;
      renderScan();
      if (typeof scanDialog.showModal === "function") scanDialog.showModal();
      else scanDialog.setAttribute("open", "");
    }
    function closeScan() {
      if (typeof scanDialog.close === "function") scanDialog.close();
      else scanDialog.removeAttribute("open");
    }
    $$("[data-scan-open]").forEach(function (b) { b.addEventListener("click", openScan); });
    $$("[data-scan-close]").forEach(function (b) { b.addEventListener("click", closeScan); });
    if (prev) prev.addEventListener("click", function () { if (idx > 0) { idx--; renderScan(); } });
    if (next) next.addEventListener("click", function () { if (idx < pages.length - 1) { idx++; renderScan(); } });
    scanDialog.addEventListener("click", function (e) {
      if (e.target === scanDialog) closeScan();
    });
    document.addEventListener("keydown", function (e) {
      if (!scanDialog.open) return;
      if (e.key === "ArrowLeft" && idx > 0) { idx--; renderScan(); }
      if (e.key === "ArrowRight" && idx < pages.length - 1) { idx++; renderScan(); }
    });
  }

  /* Sidebar / mobile ------------------------------------------------------ */
  var side = $("#readerSide");
  var menuBtn = $("#readerMenuBtn");
  if (menuBtn && side) {
    menuBtn.addEventListener("click", function () {
      var open = side.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.classList.toggle("is-open", open);
    });
    $$(".toc-item", side).forEach(function (a) {
      a.addEventListener("click", function () {
        side.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Back to top ----------------------------------------------------------- */
  var topBtn = $("#topBtn");
  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Search ---------------------------------------------------------------- */
  var searchDialog = $("#searchDialog");
  var searchInput = $("#searchInput");
  var searchResults = $("#searchResults");
  var searchCount = $("#searchCount");
  var data = window.DOW_SEARCH || [];

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
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var inText = re.test(item.x);
      var inTitle = re.test(item.t);
      if (!inText && !inTitle) continue;
      hits.push({ item: item, score: (inTitle ? 4 : 0) + (inText ? 1 : 0) });
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
      return '<a class="search-result" href="ch' + String(item.c).padStart(2, "0") + ".html#p" + item.p + '">' +
        '<div class="sr-top"><span class="sr-no">' + String(item.c).padStart(2, "0") + '</span><span class="sr-title">' +
        escapeHTML(item.t) + '</span><span class="sr-page">p.' + (item.g || "—") + "</span></div>" +
        '<div class="sr-text">' + snippet + "</div></a>";
    }).join("");
  }

  var timer;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { renderSearch(searchInput.value); }, 140);
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
    if (e.key === "Escape" && searchDialog && searchDialog.open && !(scanDialog && scanDialog.open)) closeSearch();
  });
})();
