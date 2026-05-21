# 小神童认字乐园 / Little Prodigy Hanzi Garden

一个给孩子练习常用汉字的网页应用。支持学习模式、复习模式、中文/English 界面切换、语音朗读、服务器账号进度保存，以及可选 CSV 文件同步。

A web app for practicing common Chinese characters. It supports learn mode, review mode, Chinese/English UI switching, speech playback, server-side account progress, and optional CSV sync.

## 使用 / Usage

本地开发：

```bash
npm start
```

然后访问 `http://localhost:3000`。注册只需要用户名和密码，每个小朋友会有独立学习进度。

Local development:

```bash
npm start
```

Then open `http://localhost:3000`. Registration only needs a username and password, and each child has separate progress.

## 服务器部署 / Server Deploy

需要 Node.js 18+。把仓库上传到服务器后运行：

```bash
npm start
```

默认端口是 `3000`，也可以用环境变量指定：

```bash
PORT=8080 npm start
```

用户、密码哈希、学习进度会保存在服务器本地 `data/users.json`。`data/` 已加入 `.gitignore`，不要提交到公开仓库。

Requires Node.js 18+. Upload the repository to your server and run:

```bash
npm start
```

The default port is `3000`; override it with:

```bash
PORT=8080 npm start
```

Users, password hashes, and progress are stored in `data/users.json` on the server. `data/` is ignored by Git.

## CSV 记录 / CSV Records

真实学习记录文件 `小神童认字记录.csv` 已被 `.gitignore` 忽略，不会上传到公开仓库。

The real learning record file `小神童认字记录.csv` is ignored by `.gitignore` and will not be uploaded to the public repository.

如果需要模板，可以复制 `sample-record.csv` 为 `小神童认字记录.csv`，然后在 Chrome 或 Edge 中用页面的“连接CSV / Link CSV”按钮关联本地文件。

To start from a template, copy `sample-record.csv` to `小神童认字记录.csv`, then use the page's "连接CSV / Link CSV" button in Chrome or Edge to link the local file.

## 静态发布说明 / Static Hosting Note

现在账号和进度依赖服务器 API，所以 GitHub Pages 这种纯静态托管不能保存多用户服务器进度。要使用多小朋友账号，请用上面的 Node.js 服务器部署。

The multi-child account system depends on server APIs, so static-only hosting such as GitHub Pages cannot save server-side user progress. Use the Node.js server deployment above for accounts.
