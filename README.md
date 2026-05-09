# 小神童认字乐园 / Little Prodigy Hanzi Garden

一个给孩子练习常用汉字的单页网页应用。支持学习模式、复习模式、中文/English 界面切换、语音朗读、本地进度保存，以及可选 CSV 文件同步。

A single-page web app for practicing common Chinese characters. It supports learn mode, review mode, Chinese/English UI switching, speech playback, local progress, and optional CSV sync.

## 使用 / Usage

直接打开 `index.html`，或通过 GitHub Pages 发布后访问网页。

Open `index.html` directly, or publish the repository with GitHub Pages and open the published URL.

## CSV 记录 / CSV Records

真实学习记录文件 `小神童认字记录.csv` 已被 `.gitignore` 忽略，不会上传到公开仓库。

The real learning record file `小神童认字记录.csv` is ignored by `.gitignore` and will not be uploaded to the public repository.

如果需要模板，可以复制 `sample-record.csv` 为 `小神童认字记录.csv`，然后在 Chrome 或 Edge 中用页面的“连接CSV / Link CSV”按钮关联本地文件。

To start from a template, copy `sample-record.csv` to `小神童认字记录.csv`, then use the page's "连接CSV / Link CSV" button in Chrome or Edge to link the local file.

## 发布到 GitHub Pages / GitHub Pages

仓库推送到 GitHub 后，在仓库设置中启用 Pages：

After pushing the repository to GitHub, enable Pages in repository settings:

1. Source: Deploy from a branch
2. Branch: `main`
3. Folder: `/ (root)`

