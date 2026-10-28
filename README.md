# 交易书库 · 道氏理论 × 海龟交易法则

一个多书阅读与交易原则库：收录《道氏理论》《海龟交易法则》全文，并为《股票大作手回忆录》建立导读、主题卡与跨书对照。

## 打开方式

直接双击 `index.html`（推荐 Chrome / Edge）。

如果浏览器对 `file://` 下的本地存储有限制，可以在本目录运行一个本地静态服务器：

```bash
python -m http.server 8000
```

然后访问 <http://127.0.0.1:8000/>。

## 内容

- 首页：道氏理论全书入口，以及“书库”导航。
- `library.html`：交易书库，两本书的入口与导师 v0。
- `read/ch01.html … ch19.html`：道氏理论 19 章全文、导读、原书影印。
- `turtle/`：海龟交易法则 9 章全文、规则导读、规则速查表与原书 PDF 下载。
- `speculator/`：股票大作手回忆录的 6 个主题与 24 章导读。
- `mentor.html`：三本书对照 + 交易前检查清单（本地保存勾选状态）。
- 全文搜索：道氏首页右上角放大镜，或按 `/`；结果可直接跳到具体段落。
- 阅读工具：字号调整、夜间模式、章节收藏、阅读进度、上一章 / 下一章。

## 文件结构

```text
site/
├─ index.html                 道氏理论首页
├─ library.html               交易书库
├─ mentor.html                交易前检查清单
├─ read/ch01.html … ch19.html 道氏理论章节
├─ turtle/                    海龟交易法则全文与规则导读
├─ speculator/                股票大作手回忆录导读
├─ assets/
│  ├─ css/site.css            全站基础样式
│  ├─ css/books.css           书库、海龟、导师样式
│  ├─ js/main.js              首页交互
│  ├─ js/reader.js            阅读页交互
│  ├─ js/mentor.js            检查清单
│  ├─ js/search-data.js       道氏全文搜索索引
│  ├─ fonts/                  Noto Serif SC 子集
│  ├─ img/cover.webp          道氏理论封面
│  └─ pages/001.webp … 183.webp 道氏原书影印
└─ data/chapters.json         道氏章节元数据
```

《海龟交易法则》的全文已生成在 `turtle/` 页面中；《股票大作手回忆录》的 OCR 全文保存在 `../library/speculator.json`，公开页目前只做导读，未发布全文。

## 说明

- 原书为扫描版，正文经 OCR 整理并做了常见形近字修正。少数地方仍可能残留识别误差，重要内容请对照各章“原书影印”。
- 文字中的年代、指数点位、统计口径均属于 1932 年的历史语境，不构成投资建议。
- 本站为非官方个人学习页面；原书版权归作者、译者与出版社所有。
- 页面不依赖任何外部字体、框架或 CDN，可完全离线打开。

## 修改

- 颜色、字体、间距：`assets/css/site.css` 和 `assets/css/books.css`。
- 道氏章节：`../tools/build_site.py` 里的 `META`，修改后运行 `python tools/build_site.py`。
- 海龟导读、书库、导师页：`../tools/build_turtle.py`，修改后运行 `python tools/build_turtle.py`。
- 道氏正文：`../work/chapters_raw.json`；海龟全文：`../library/turtle_full.json`；大作手 OCR：`../library/speculator.json`。
