(function () {
  var KEY = "trading_journal_v1";
  var form = document.getElementById("journalForm");
  var table = document.getElementById("journalTable");
  function today() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function calc(t) {
    var dir = t.dir === "short" ? -1 : 1;
    var pnl = (Number(t.exit) - Number(t.entry)) * Number(t.size) * dir;
    var risk = Math.abs(Number(t.entry) - Number(t.stop)) * Number(t.size);
    return { pnl: pnl, r: risk ? pnl / risk : 0 };
  }
  function render() {
    var data = load();
    var wins = data.filter(function (t) { return calc(t).pnl > 0; }).length;
    document.getElementById("statCount").textContent = data.length;
    document.getElementById("statWin").textContent = data.length ? Math.round(wins / data.length * 100) + "%" : "—";
    var rs = data.map(function (t) { return calc(t).r; });
    document.getElementById("statR").textContent = rs.length ? fmt(rs.reduce(function (a, b) { return a + b; }, 0) / rs.length) + "R" : "—";
    if (!data.length) {
      table.innerHTML = '<div class="journal-empty">还没有记录。先写下第一笔：为什么进场，错了在哪里退。</div>';
      return;
    }
    var rows = data.slice().reverse().map(function (t) {
      var c = calc(t);
      var cls = c.pnl >= 0 ? "pnl-pos" : "pnl-neg";
      return "<tr><td>" + t.date + "</td><td>" + t.market + " · " + t.symbol + "</td><td>" + (t.dir === "short" ? "空" : "多") +
        "</td><td>" + t.entry + "</td><td>" + t.exit + "</td><td>" + fmt(c.r) + "R</td><td class=\"" + cls + "\">" + fmt(c.pnl) +
        '</td><td><button class="journal-delete" data-id="' + t.id + '">删除</button></td></tr>';
    }).join("");
    table.innerHTML = '<table class="journal-table"><thead><tr><th>日期</th><th>标的</th><th>方向</th><th>入场</th><th>离场</th><th>R</th><th>盈亏</th><th></th></tr></thead><tbody>' + rows + "</tbody></table>";
    Array.prototype.forEach.call(table.querySelectorAll("[data-id]"), function (b) {
      b.addEventListener("click", function () {
        if (!confirm("删除这条记录？")) return;
        save(load().filter(function (t) { return String(t.id) !== b.getAttribute("data-id"); }));
        render();
      });
    });
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var t = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: document.getElementById("jDate").value,
      market: document.getElementById("jMarket").value.trim(),
      symbol: document.getElementById("jSymbol").value.trim(),
      dir: document.getElementById("jDir").value,
      entry: document.getElementById("jEntry").value,
      stop: document.getElementById("jStop").value,
      exit: document.getElementById("jExit").value,
      size: document.getElementById("jSize").value,
      reason: document.getElementById("jReason").value.trim(),
      review: document.getElementById("jReview").value.trim()
    };
    var data = load(); data.push(t); save(data); form.reset();
    document.getElementById("jDate").value = today();
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trading-journal.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("jDate").value = today();
  render();
})();