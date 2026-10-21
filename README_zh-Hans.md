[English](README.md) · [繁體中文](README_zh-Hant.md) · [日本語](README_ja.md)

# Brad's Supercharger

面向日常开发的本地优先工具箱。这是一个静态的 [React](https://react.dev/) + [Vite](https://vite.dev/) 站点：工具输入在浏览器里处理，不会发到服务器。

已发布站点：[https://bx8361.github.io/brad-supercharger/](https://bx8361.github.io/brad-supercharger/)

> [!TIP]
> 这个站点可以安装为桌面应用。在 Chrome 里，从地址栏、浏览器菜单，或侧栏的 **安装应用** 安装。应用在自己的窗口里打开。第一次加载之后可以离线使用；更新在所有 Supercharger 窗口关闭并再次打开后生效。

## 在本地运行

```sh
npm install
npm run dev
```

`npm install` 会解包体积太大、不便提交的自托管应用：

- **draw.io** `31.6.1`（[Apache-2.0](https://github.com/jgraph/drawio)）到 `public/drawio/`
- **Hoppscotch** `2026.6.1`（[MIT](https://github.com/hoppscotch/hoppscotch)）到 `public/hoppscotch/`
- **ArtCraft** WordCraft `0.8.0`、GridCraft `0.9.0`、PhotoCraft `0.11.1`、FilmCraft `0.9.0`、DeckCraft `0.8.0`（[MIT OR Apache-2.0](https://getartcraft.com/apps)）到 `public/crafts/`，来自 `third-party/` 里对应的 zip
- **SQLite WASM** `3.54.0`（[公有领域](https://sqlite.org/copyright.html)）到 `public/sqlite/`。项目根目录有 `sqlite-wasm-3540000.zip` 时使用该文件
- **Pyodide** `314.0.7`（[MPL-2.0](https://github.com/pyodide/pyodide)）到 `public/pyodide/`，来自项目根目录的 `pyodide-314.0.7.tar.bz2`
- **JupyterLite** `0.8.6`（[BSD-3-Clause](https://github.com/jupyterlite/jupyterlite)）到 `public/jupyterlite/`，由 `scripts/vendor-jupyterlite.js` 用 `python3` 构建

重新解包：`node scripts/vendor-drawio.js`、`node scripts/vendor-hoppscotch.js`、`node scripts/vendor-crafts.js`、`node scripts/vendor-sqlite.js`、`node scripts/vendor-pyodide.js` 或 `node scripts/vendor-jupyterlite.js`。

```sh
npm run build
npm run preview
```

## 工具

### 转换

- **Cron 解析** — 解释 cron 表达式，并列出即将到来的运行
- **JSON 转表格** — 把 JSON 数组变成表格或 CSV
- **JSON ↔ YAML** — 在 JSON 和 YAML 之间转换
- **时间戳** — 转换 Unix 时间戳和日期
- **进制转换** — 在二进制、八进制、十进制、十六进制之间转换整数
- **计算器** — 科学表达式、历史和常数，风格接近 [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)

### 文本

- **转义 / 反转义** — 转义或还原 JSON 和 XML 文本
- **列表比较** — 找出共有或独有的行
- **Markdown 预览** — 编写 Markdown 并预览（省略图片和嵌入媒体）
- **文本分析** — 计数，以及大小写、排序、修剪等变换
- **便笺** — 记笔记，并保存在这个浏览器里
- **文本比较** — 对比两段文本

### 编码与解码

- **Base64 文本** — 编码或解码文本
- **Base64 图片** — 编码图片，或把 Base64 解码成预览
- **证书解码** — 查看 PEM X.509 公钥证书（不含有密码的 PFX）
- **GZip** — 把文本压成 Base64 GZip，或解压
- **HTML 编码** — 转义标记，或解码 HTML 实体
- **JWT 编码** — 编码或解码 JSON Web Token（仅 HMAC；解码不验证签名）
- **二维码** — 从文本生成，或从图片读取
- **URL 编码** — 按 RFC 3986 对 URL 数据做百分号编码或解码
- **AES 加密 / 解密** — 用共享密码加密或解密文本

### 格式化

- **JSON 格式化** — 校验、格式化、压缩或排序 JSON
- **SQL 格式化** — 按常见方言格式化 SQL
- **XML 格式化** — 格式化或压缩 XML
- **语法格式化** — 在一个编辑器里格式化并高亮源代码

### 生成

- **哈希生成** — 文本或文件的 SHA 摘要（Web Crypto；需要 HTTPS 或 localhost）
- **占位文本** — 来自公有领域文学作品的占位文字
- **密码生成** — 随机密码
- **UUID 生成** — UUID v1、v4 或 v7

### 图像

- **图片转换** — PNG、JPEG、WebP
- **图片水印** — 在浏览器里平铺文字水印
- **图片坐标** — 选取点或矩形，并复制像素坐标
- **函数图** — 在 [JSXGraph](https://jsxgraph.org/) 画板上绘制表达式
- **Mermaid 图表** — 编写 [Mermaid](https://mermaid.js.org/) 并预览
- **draw.io 编辑器** — 自托管的 [draw.io](https://www.drawio.com/)（`diagrams.net`）

### 创作

第三方 [ArtCraft](https://getartcraft.com/apps) 网页应用（WebAssembly），解包到 `public/crafts/`。每个应用都运行在本站点的源上。

- **WordCraft** — 撰写和排版文档
- **GridCraft** — 编辑电子表格
- **PhotoCraft** — 编辑图片
- **FilmCraft** — 剪辑视频、调色和处理声音
- **DeckCraft** — 制作并放映幻灯片

### 媒体

- **M3U8 下载** — 下载 HLS 流，包括 AES-128；可放在内存中，或边下边存

### 数据实验场

**数据**、**分析** 和 **可视化** 在当前浏览器会话里共用一份数据集。加载 CSV，或 Iris 与客户样本，然后做 PCA、相关、相似度、距离、k-means、描述统计或图表。导出的 PNG 和 CSV 留在这台机器上。Iris 会先加载；在分析里按 **运行** 才会计算 PCA。

### 测试

- **JSONPath 测试** — 用 JSONPath 查询 JSON
- **XML 测试** — 用 XSD 校验 XML
- **SQLite** — 在浏览器里用 SQLite WASM 运行 SQL。数据库只留在这个标签页
- **Python** — 在浏览器里用 Pyodide 运行 Python。值只留在这个标签页
- **JupyterLite** — 浏览器里的 Jupyter 笔记本（Pyodide 内核）。笔记本留在此站点的这个浏览器里
- **正则测试** — 用 JavaScript、Python、Go、Java、.NET 和 Rust 模式测试、替换和提取
- **Hoppscotch** — REST、GraphQL 和 WebSocket 客户端（原名 Postwoman）。除非连接后端，集合留在浏览器里。Hoppscotch 浏览器扩展可以帮助处理 CORS

## 保存在这台设备上

收藏、最近用过的工具、主题、导航和工具选项存在这个浏览器里。**保存工具输入和生成的文本**（在 **已保存的数据与偏好** 里）默认关闭，已有安装也一样：输入和生成的文本只在本次会话有效，重新加载会清掉。打开后，重新加载会恢复这些文本；关掉会删除以前保存的文本，其他偏好保留。同一面板可以清除全部已保存数据。为哈希选择的文件只在本次会话有效。

拖动侧栏右缘可改宽度。拖动工具下方的手柄可改该工具的高度；每个工具记住自己的高度。聚焦手柄后用方向键，或双击（或按 Home）可重置。

## 致谢与许可

本仓库的界面和 JavaScript 为原创，下面列出的第三方部分除外。本仓库没有项目级 `LICENSE` 文件。完整声明在 [LICENSES.md](LICENSES.md)；应用内的 **第三方声明** 页列出相同的引用，以及随应用分发的 npm 包。

| 项目 | 许可 | 用途 |
| --- | --- | --- |
| [DevToys](https://github.com/DevToys-app/DevToys) | MIT, copyright (c) 2021 | 工具集合与导航的概念。未复制 DevToys 的源代码或美术资源。 |
| [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools) | MIT | 默认工具行为、编解码器，以及开发用测试数据的参考。不分发 DevToys.Tools 的源代码。 |
| [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch) | GPL-2.0-or-later | 计算器的语法、函数名和常数，用原创 JavaScript 重新实现。不含 SpeedCrunch 的 C++ 源代码。 |
| [NLipsum](https://github.com/DevToys-app/DevToys.Tools) 占位文本 | Public domain | `src/assets/lipsums/` 下的占位语料。 |
| [draw.io](https://github.com/jgraph/drawio) `31.6.1` | Apache-2.0 | 由 `scripts/vendor-drawio.js` 置入 `public/drawio/` 的网页应用。 |
| [ArtCraft](https://getartcraft.com/apps) | MIT OR Apache-2.0 | WordCraft `0.8.0`、GridCraft `0.9.0`、PhotoCraft `0.11.1`、FilmCraft `0.9.0`、DeckCraft `0.8.0`。由 `scripts/vendor-crafts.js` 从 `third-party/` 解包到 `public/crafts/`。 |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) `2026.6.1` | MIT | 由 `scripts/vendor-hoppscotch.js` 置入 `public/hoppscotch/` 的网页客户端，来自 [hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) 镜像。 |
| [SQLite](https://sqlite.org/wasm) `3.54.0` | Public domain | WASM/JS 构建。由 `scripts/vendor-sqlite.js` 从 `sqlite-wasm-3540000.zip` 解包到 `public/sqlite/`。 |
| [Pyodide](https://github.com/pyodide/pyodide) `314.0.7` | MPL-2.0 | Python 3.14 运行时。由 `scripts/vendor-pyodide.js` 从 `pyodide-314.0.7.tar.bz2` 解包到 `public/pyodide/`。包含 CPython（PSF License）。 |
| [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.8.6` | BSD-3-Clause | 构建到 `public/jupyterlite/` 的 JupyterLab 静态站点，经 `scripts/vendor-jupyterlite.js`（需要 `python3`）。包含 Pyodide 内核（MPL-2.0）。 |

运行时库保留各自的许可（记录在 `package-lock.json`）。主要有：React（MIT）、JSXGraph（MIT OR LGPL-3.0-or-later）、Mermaid（MIT）、Papa Parse、Plotly、ml-pca、ml-distance 和 ml-kmeans（MIT）。DOMPurify 为 MPL-2.0 OR Apache-2.0。
