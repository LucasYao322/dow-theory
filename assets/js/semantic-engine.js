/* Local Chinese semantic search: BGE-small-zh + precomputed paragraph vectors. */
(function () {
  var D = window.CONCEPT_INDEX;
  if (!D) return;
  var VEC_DIM = 512;
  var SCRIPT_URL = document.currentScript ? document.currentScript.src : location.href;
  var PAGE_BASE = new URL(".", location.href).href;
  var extractor = null;
  var vectors = null;
  var ready = false;
  var loading = null;

  function expand(q) {
    var hints = [];
    function add(s) { if (hints.indexOf(s) < 0) hints.push(s); }
    if (/亏|赔|套|回撤/.test(q)) { add("亏损"); add("止损"); }
    if (/加仓|补仓|摊平|翻倍|满仓|重仓/.test(q)) { add("加仓"); add("仓位"); add("头寸"); }
    if (/总想|忍不住|冲动|想|希望|怕|恐惧|焦虑/.test(q)) { add("希望"); add("恐惧"); add("情绪"); }
    if (/报复|回本|翻本|扳回|赚回来/.test(q)) { add("报复"); add("亏损"); add("加仓"); }
    if (/追高|追涨|踏空|怕错过/.test(q)) { add("追高"); add("入市"); add("时机"); }
    if (/拿不住|卖飞|早卖|落袋|赚一点/.test(q)) { add("离市"); add("耐心"); add("让利润奔跑"); }
    if (/消息|贴士|内幕|朋友|群里/.test(q)) { add("贴士"); add("消息"); add("内部人"); }
    if (/逆势|抄底|摸顶|方向/.test(q)) { add("趋势"); add("确认"); add("逆势"); }
    return { text: q + (hints.length ? "。相关概念：" + hints.join("、") : ""), hints: hints };
  }

  function dot(a, b, off) {
    var s = 0;
    for (var i = 0; i < VEC_DIM; i++) s += a[i] * b[off + i];
    return s;
  }

  async function doLoad(onStatus) {
    if (ready) return;
    if (onStatus) onStatus("正在加载中文向量模型（约 34MB）…");
    var mod = await import(new URL("transformers.min.js", SCRIPT_URL).href);
    var env = mod.env;
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = new URL("assets/models/", PAGE_BASE).href;
    env.backends.onnx.wasm.wasmPaths = new URL("assets/js/", PAGE_BASE).href;
    env.backends.onnx.wasm.numThreads = 1;
    extractor = await mod.pipeline("feature-extraction", "bge-small-zh", { quantized: true });
    if (onStatus) onStatus("正在加载段落向量…");
    var buf = await (await fetch(new URL("assets/semantic-vectors.bin", PAGE_BASE))).arrayBuffer();
    vectors = new Float32Array(buf);
    if (vectors.length !== D.sources.length * VEC_DIM) throw new Error("向量数量不匹配");
    ready = true;
  }

  function load(onStatus) {
    if (ready) return Promise.resolve();
    if (!loading) {
      loading = doLoad(onStatus).catch(function (e) {
        loading = null;
        throw e;
      });
    }
    return loading;
  }

  async function search(q, onStatus) {
    await load(onStatus);
    if (onStatus) onStatus("正在比较三本书的相关段落…");
    var ex = expand(q);
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
    return { hits: hits, hints: ex.hints };
  }

  window.SemanticEngine = {
    load: load,
    search: search,
    expand: expand,
    isReady: function () { return ready; }
  };
})();
