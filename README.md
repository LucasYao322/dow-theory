# 交易书库 · 道氏理论 × 海龟交易法则 × 股票大作手回忆录 × 金融炼金术

一个多书阅读与交易原则库：收录《道氏理论》《海龟交易法则》《股票大作手回忆录》《金融炼金术》全文，以及主题导读与跨书对照。

## 打开方式

直接双击 `index.html`（推荐 Chrome / Edge）。

如果浏览器对 `file://` 下的本地存储有限制，可以在本目录运行一个本地静态服务器：

```bash
python -m http.server 8000
```

然后访问 <http://127.0.0.1:8000/>。

## 内容

- `index.html`：沙粒文字封面“先读懂。再下注。”，点击进入书库。
- `dow.html`：道氏理论全书入口，以及“书库 / 概念”导航。
- `library.html`：交易书库，四本书的入口与导师 v0。
- `soros/`：金融炼金术的 5 个部分、8 个概念与 20 章 + 结束语全文。
- `concepts.html`：跨书概念索引，按“止损 / 趋势确认 / 仓位”等 8 个概念对照四本书，支持全文检索与本地语义检索。
- `review.html`：语义复盘。写下一笔亏损交易，系统找出四本书里最接近的段落，并让你判断“这一笔更像哪一种错误”。
- `read/ch01.html … ch19.html`：道氏理论 19 章全文、导读、原书影印。
- `turtle/`：海龟交易法则 9 章全文、规则导读、规则速查表与原书 PDF 下载。
- `speculator/`：股票大作手回忆录的 24 章全文、6 个主题与附录。
- `mentor.html`：四本书的视角说明 + 交易前检查清单（本地保存勾选状态）。
- 全文搜索：道氏首页右上角放大镜，或按 `/`；结果可直接跳到具体段落。
- 阅读工具：字号调整、夜间模式、章节收藏、阅读进度、上一章 / 下一章。

## 文件结构

```text
site/
├─ index.html                 道氏理论首页
├─ library.html               交易书库
├─ index.html                沙粒文字封面
├─ dow.html                  道氏理论首页
├─ concepts.html              跨书概念索引
├─ review.html                语义复盘
├─ soros/                     金融炼金术全文与导读
├─ mentor.html                交易前检查清单
├─ read/ch01.html … ch19.html 道氏理论章节
├─ turtle/                    海龟交易法则全文与规则导读
├─ speculator/                股票大作手回忆录全文
├─ assets/
│  ├─ css/site.css            全站基础样式
│  ├─ css/books.css           书库、海龟、导师、概念索引样式
│  ├─ js/concept-data.js      四本书的检索语料
│  ├─ js/concepts.js          概念索引、关键词与语义搜索
│  ├─ js/semantic-engine.js   可复用的本地语义检索引擎
│  ├─ js/review.js            复盘表单、错误分类与原文对照
│  ├─ js/transformers.min.js  浏览器端向量模型运行时
│  ├─ js/ort-wasm-simd.wasm   ONNX Runtime Web WASM
│  ├─ models/bge-small-zh/    中文向量模型（约 24MB）
│  ├─ semantic-vectors.bin    1678 段正文的向量索引
│  ├─ js/main.js              首页交互
│  ├─ js/reader.js            阅读页交互
│  ├─ js/mentor.js            检查清单
│  ├─ js/search-data.js       道氏全文搜索索引
│  ├─ fonts/                  Noto Serif SC 子集
│  ├─ img/cover.webp          道氏理论封面
│  └─ pages/001.webp … 183.webp 道氏原书影印
└─ data/chapters.json         道氏章节元数据
```

《海龟交易法则》的全文已生成在 `turtle/` 页面中；《股票大作手回忆录》的 OCR 全文保存在 `../library/speculator.json`，并已生成 24 章 + 附录的公开阅读页。

## 说明

- 原书为扫描版，正文经 OCR 整理并做了常见形近字修正。少数地方仍可能残留识别误差，重要内容请对照各章“原书影印”。
- 文字中的年代、指数点位、统计口径均属于 1932 年的历史语境，不构成投资建议。
- 本站为非官方个人学习页面；原书版权归作者、译者与出版社所有。
- 页面不依赖任何外部字体、框架或 CDN，可完全离线打开。

## 修改

- 颜色、字体、间距：`assets/css/site.css` 和 `assets/css/books.css`。
- 道氏章节：`../tools/build_site.py` 里的 `META`，修改后运行 `python tools/build_site.py`。
- 封面页：`python tools/build_intro.py`。
- 海龟导读、书库、导师页：`../tools/build_turtle.py`，修改后运行 `python tools/build_turtle.py`。
- 概念索引：先运行 `python tools/build_concepts_page.py`（会调用 `build_concepts.py` 生成语料和页面），再运行 `python tools/build_embeddings.py` 更新语义向量。
- 语义复盘：运行 `python tools/build_review.py`。
- 金融炼金术：先运行 `python tools/build_soros_chapters.py` 生成 21 个全文页，再运行 `python tools/build_soros.py` 生成导读页；源数据在 `../library/soros.json`。
- 语义模型与 WASM 运行时体积约 34MB，首次点“启用语义搜索”时才加载；不启用时只走关键词检索。
- 道氏正文：`../work/chapters_raw.json`；海龟全文：`../library/turtle_full.json`；大作手 OCR：`../library/speculator.json`。
