(function () {
  var data = window.PRACTICE || [];
  var i = 0, score = 0, answered = false;
  var tag = document.getElementById("scenarioTag");
  var no = document.getElementById("scenarioNo");
  var q = document.getElementById("scenarioQ");
  var text = document.getElementById("scenarioText");
  var options = document.getElementById("options");
  var feedback = document.getElementById("feedback");
  var fbTitle = document.getElementById("fbTitle");
  var fbText = document.getElementById("fbText");
  var fbSrc = document.getElementById("fbSrc");
  var next = document.getElementById("nextBtn");
  var scoreEl = document.getElementById("score");
  var bar = document.getElementById("practiceBar");
  var best = localStorage.getItem("trading_practice_best");
  var bestEl = document.getElementById("bestScore");
  if (bestEl) bestEl.textContent = best ? best + " / " + data.length : "—";

  function render() {
    answered = false;
    var s = data[i];
    tag.textContent = s.tag;
    no.textContent = (i + 1) + " / " + data.length;
    q.textContent = s.q;
    text.textContent = s.text;
    options.innerHTML = "";
    feedback.classList.remove("show");
    next.disabled = true;
    next.textContent = i === data.length - 1 ? "看结果 →" : "下一题 →";
    s.options.forEach(function (opt, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.innerHTML = '<span class="opt-letter">' + "ABC"[idx] + '</span><span>' + opt + "</span>";
      b.addEventListener("click", function () { choose(idx, s); });
      options.appendChild(b);
    });
    if (bar) bar.style.width = (i / data.length * 100) + "%";
  }

  function choose(idx, s) {
    if (answered) return;
    answered = true;
    var buttons = Array.prototype.slice.call(options.children);
    buttons.forEach(function (b, j) {
      b.disabled = true;
      if (j === s.correct) b.classList.add("is-correct");
      if (j === idx && idx !== s.correct) b.classList.add("is-wrong");
    });
    if (idx === s.correct) {
      score++;
      fbTitle.textContent = "判断正确";
    } else {
      fbTitle.textContent = "再想一步";
    }
    fbText.textContent = s.exp;
    fbSrc.textContent = "出处：" + s.src;
    feedback.classList.add("show");
    scoreEl.textContent = score + " / " + data.length;
    next.disabled = false;
    var bestNow = Math.max(score, Number(best || 0));
    if (bestNow > Number(best || 0)) {
      best = String(bestNow);
      localStorage.setItem("trading_practice_best", best);
      if (bestEl) bestEl.textContent = best + " / " + data.length;
    }
  }

  next.addEventListener("click", function () {
    if (i < data.length - 1) { i++; render(); }
    else {
      q.textContent = "本轮得分：" + score + " / " + data.length;
      text.textContent = score === data.length ? "你已经能用书本原则做情境判断。下一步：把这套判断写进真实交易日志。" : "回到答错的题目，找到对应章节，再读一遍。";
      tag.textContent = "DONE";
      no.textContent = data.length + " / " + data.length;
      options.innerHTML = "";
      feedback.classList.remove("show");
      next.disabled = true;
      next.textContent = "已完成";
      var a = document.createElement("a");
      a.className = "btn btn-ghost";
      a.href = "journal.html";
      a.textContent = "去记一笔交易 →";
      options.appendChild(a);
      if (bar) bar.style.width = "100%";
    }
  });

  render();
})();