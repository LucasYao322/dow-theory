# 发布到 GitHub Pages

这是一个纯静态网站，不需要服务器、数据库或构建命令。GitHub Pages 可以直接托管。

## 方式一：网页上传（不装软件）

1. 登录 GitHub，点击 **New repository**。
2. 仓库名可填 `dow-theory`，可见性选择 **Public**（免费账号的 Pages 需要公开仓库）。
3. 创建后，在仓库首页点 **Add file → Upload files**。
4. 把本文件夹（`site`）里的**所有内容**拖进去，注意不是把 `site` 文件夹本身拖进去：
   - `index.html` 必须在仓库根目录
   - `assets/`、`read/` 与 `index.html` 同级
5. 提交后进入 **Settings → Pages**：
   - Source: **Deploy from a branch**
   - Branch: **main**，文件夹选择 **/(root)**
   - Save
6. 等 1–10 分钟，访问：
   `https://<你的用户名>.github.io/<仓库名>/`

> GitHub 网页上传一次最多 100 个文件，本网站有 183 张影印图，可能需要分两三次上传 `assets/pages/` 目录。

## 方式二：GitHub Desktop（推荐，后续更新方便）

1. 安装 GitHub Desktop，登录 GitHub。
2. **File → Add local repository**，选择本文件夹 `site`。
3. 如果提示不是 Git 仓库，选择 **create a repository**，然后 **Publish repository**。
4. 在 GitHub 网页端进入 **Settings → Pages**，选择 `main` 分支、`/(root)`。
5. 以后修改网站后，在 GitHub Desktop 点 **Commit → Push**，Pages 会自动更新。

## 方式三：命令行（已安装 Git 的情况）

```bash
cd site
git init
git add .
git commit -m "Publish Dow Theory reading site"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

然后在仓库 **Settings → Pages** 中选择 `main` / `/(root)`。

## 自定义域名（可选）

在 `Settings → Pages → Custom domain` 填入域名，并按 GitHub 提示配置 DNS；仓库根目录不要随意添加 `CNAME`，除非你确定要绑定哪个域名。

## 重要提醒

- GitHub Pages 站点是公开的，任何人都能访问。即使仓库设为私有，付费计划下的 Pages 也可能公开。
- 本目录包含《道氏理论》完整译文与 183 页原书扫描。**公开传播前请确认你拥有相应授权**；如果没有，建议只公开导读、要点和短引文，完整版保留在本地。
- 网站已经包含 `.nojekyll`，避免 GitHub Pages 用 Jekyll 处理静态文件。
- `404.html` 会自动把不存在的路径带回站点首页。

## 临时公网预览（不需要账号）

如果只是想马上让别人打开看看，可以用 Cloudflare Quick Tunnel：

```bash
python -m http.server 8765 --directory .
cloudflared tunnel --url http://127.0.0.1:8765
```

它会输出一个 `https://....trycloudflare.com` 地址。这个地址在进程停止后会失效，不适合长期发布。

- Cloudflare Quick Tunnel 文档：<https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/>
- GitHub Pages 文档：<https://docs.github.com/zh/pages/getting-started-with-github-pages/creating-a-github-pages-site>
