[English](README.md) · [简体中文](README_zh-Hans.md) · [日本語](README_ja.md)

# Brad's Supercharger

以日常開發為導向的工具箱。這是一個靜態的 [React](https://react.dev/) + [Vite](https://vite.dev/) 網站：任何工具輸入的資料只在瀏覽器裡處理，不會送到伺服器。

立即試試：[https://bx8361.github.io/brad-supercharger/](https://bx8361.github.io/brad-supercharger/)

> [!TIP] 此工具可以安裝為桌面應用程式。在 Chrome 裡，從網址列、瀏覽器選單，或側欄的 **安裝應用程式** 安裝。應用程式在自己的視窗裡打開。第一次載入之後可以離線使用；更新在所有 Supercharger 視窗關閉並再次打開後生效。

## 在本機執行

```sh
npm install
npm run dev
```

`npm install` 會解包體積太大、不便提交的自架應用：

- **draw.io** `31.6.1`（[Apache-2.0](https://github.com/jgraph/drawio)）到 `public/drawio/`
- **Hoppscotch** `2026.6.1`（[MIT](https://github.com/hoppscotch/hoppscotch)）到 `public/hoppscotch/`
- **ArtCraft** WordCraft `0.9.0`、GridCraft `0.10.0`、PhotoCraft `0.12.0`、FilmCraft `0.10.0`、DeckCraft `0.9.0`（[MIT OR Apache-2.0](https://getartcraft.com/apps)）到 `public/crafts/`，來自 `third-party/` 裡對應的 zip
- **SQLite WASM** `3.54.0`（[公有領域](https://sqlite.org/copyright.html)）到 `public/sqlite/`。專案根目錄有 `sqlite-wasm-3540000.zip` 時使用該檔案
- **Pyodide** `314.0.7`（[MPL-2.0](https://github.com/pyodide/pyodide)）到 `public/pyodide/`，來自專案根目錄的 `pyodide-314.0.7.tar.bz2`
- **JupyterLite** `0.8.6`（[BSD-3-Clause](https://github.com/jupyterlite/jupyterlite)）到 `public/jupyterlite/`，由 `scripts/vendor-jupyterlite.js` 用 `python3` 建置

重新解開：`node scripts/vendor-drawio.js`、`node scripts/vendor-hoppscotch.js`、`node scripts/vendor-crafts.js`、`node scripts/vendor-sqlite.js`、`node scripts/vendor-pyodide.js` 或 `node scripts/vendor-jupyterlite.js`。

```sh
npm run build
npm run preview
```



## 工具



### 轉換

- **Cron 解析** — 解釋 cron 表達式，並列出即將到來的執行
- **JSON 轉表格** — 把 JSON 陣列變成表格或 CSV
- **JSON ↔ YAML** — 在 JSON 和 YAML 之間轉換
- **時間戳** — 轉換 Unix 時間戳和日期
- **進制轉換** — 在二進位、八進位、十進位、十六進位之間轉換整數
- **計算機** — 科學表達式、歷史和常數，風格接近 [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)
- **Nerdamer-prime** — 使用 [nerdamer-prime](https://github.com/together-science/nerdamer-prime) 進行符號微積分（導數、積分、極限、拉普拉斯變換、解方程式），附可直接執行範例的運算說明
- **Algebrite** — 使用 [Algebrite](http://algebrite.org) 進行符號微積分（導數、積分、泰勒級數、矩陣、特殊多項式），附可直接執行範例的運算說明



### 文字

- **跳脫 / 反跳脫字元** — 跳脫或還原 JSON 和 XML 文字
- **清單比較** — 找出共有或獨有的行
- **Markdown 預覽** — 編寫 Markdown 並預覽（省略圖片和嵌入媒體）
- **文字分析** — 計數，以及大小寫、排序、修剪等變換
- **便箋** — 寫筆記，並留在這個瀏覽器裡
- **文字比較** — 對比兩段文字



### 編碼與解碼

- **Base64 文字** — 編碼或解碼文字
- **Base64 圖片** — 編碼圖片，或把 Base64 解碼成預覽
- **憑證解碼** — 查看 PEM X.509 公鑰憑證（不含有密碼的 PFX）
- **GZip** — 把文字壓成 Base64 GZip，或解壓
- **HTML 編碼** — 轉義標記，或解碼 HTML 實體
- **JWT 編碼** — 編碼或解碼 JSON Web Token（僅 HMAC；解碼不驗證簽章）
- **QR code** — 從文字產生，或從圖片讀取
- **URL 編碼** — 按 RFC 3986 對 URL 資料做百分號編碼或解碼
- **AES 加密 / 解密** — 用共享密碼加密或解密文字



### 格式化

- **JSON 格式化** — 驗證、格式化、壓縮或排序 JSON
- **SQL 格式化** — 按常見方言格式化 SQL
- **XML 格式化** — 格式化或壓縮 XML
- **語法格式化** — 在一個編輯器裡格式化並標示語法



### 產生

- **雜湊產生** — 文字或檔案的 SHA 摘要（Web Crypto；需要 HTTPS 或 localhost）
- **假文** — 來自公有領域文學作品的佔位文字
- **密碼產生** — 隨機密碼
- **UUID 產生** — UUID v1、v4 或 v7



### 圖像

- **圖片轉換** — PNG、JPEG、WebP
- **圖片浮水印** — 在瀏覽器裡平鋪文字浮水印
- **圖片座標** — 選取點或矩形，並複製像素座標
- **函數圖** — 在 [JSXGraph](https://jsxgraph.org/) 畫板上繪製表達式
- **Mermaid 圖表** — 編寫 [Mermaid](https://mermaid.js.org/) 並預覽
- **draw.io 編輯器** — 自架的 [draw.io](https://www.drawio.com/)（`diagrams.net`）



### 創作

第三方 [ArtCraft](https://getartcraft.com/apps) 網頁應用（WebAssembly），解包到 `public/crafts/`。每個應用都執行在本站點的來源上。

- **WordCraft** — 撰寫和排版文件
- **GridCraft** — 編輯試算表
- **PhotoCraft** — 編輯圖片
- **FilmCraft** — 剪輯影片、調色和處理聲音
- **DeckCraft** — 製作並放映簡報



### 媒體

- **M3U8 下載** — 下載 HLS 串流，包括 AES-128；可放在記憶體中，或邊下邊存



### 資料實驗場

**資料**、**分析** 和 **視覺化** 在目前瀏覽器工作階段裡共用一份資料集。載入 CSV，或 Iris 與客戶樣本，然後做 PCA、相關、相似度、距離、k-means、描述統計或圖表。匯出的 PNG 和 CSV 留在這台機器上。Iris 會先載入；在分析裡按 **執行** 才會計算 PCA。

### 測試

- **JSONPath 測試** — 用 JSONPath 查詢 JSON
- **XML 測試** — 用 XSD 驗證 XML
- **SQLite** — 在瀏覽器裡用 SQLite WASM 執行 SQL。資料庫只留在這個分頁
- **Python** — 在瀏覽器裡用 Pyodide 執行 Python。值只留在這個分頁
- **JupyterLite** — 瀏覽器裡的 Jupyter 筆記本（Pyodide 核心）。筆記本留在此站點的這個瀏覽器裡
- **正規表達式測試** — 用 JavaScript、Python、Go、Java、.NET 和 Rust 模式測試、替換和擷取
- **Hoppscotch** — REST、GraphQL 和 WebSocket 用戶端（原名 Postwoman）。除非連接後端，集合留在瀏覽器裡。Hoppscotch 瀏覽器擴充功能可以幫助處理 CORS



## 儲存在這台裝置上

收藏、最近用過的工具、主題、導覽和工具選項只存在本地瀏覽器裡。**儲存工具輸入和產生的文字**（在 **已儲存的資料與設定** 裡）預設關閉，既有安裝也一樣：輸入和產生的文字只在本次工作階段有效，重新載入會清掉。打開後，重新載入會還原這些文字；關掉會刪除以前儲存的文字，其他偏好保留。同一面板可以清除全部已儲存資料。為雜湊選擇的檔案只在本次工作階段有效。

拖動側欄右緣可改寬度。拖動工具下方的把手可改該工具的高度；每個工具記住自己的高度。聚焦把手後用方向鍵，或按兩下（或按 Home）可重設。

## 致謝與授權

本倉庫的介面和 JavaScript 為原創，下面列出的第三方部分除外。本倉庫沒有專案級 `LICENSE` 檔案。完整聲明在 [LICENSES.md](LICENSES.md)；應用程式內的 **第三方聲明** 頁列出相同的引用，以及隨應用程式分發的 npm 套件。


| 專案                                                                | 授權                      | 用途                                                                                                                                                         |
| ----------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DevToys](https://github.com/DevToys-app/DevToys)                 | MIT, copyright (c) 2021 | 工具集合與導覽的概念。未複製 DevToys 的原始碼或美術資源。                                                                                                                          |
| [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools)     | MIT                     | 預設工具行為、編解碼器，以及開發用測試資料的參考。不分發 DevToys.Tools 的原始碼。                                                                                                           |
| [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)    | GPL-2.0-or-later        | 計算機的語法、函式名和常數，用原創 JavaScript 重新實作。不含 SpeedCrunch 的 C++ 原始碼。                                                                                                |
| [NLipsum](https://github.com/DevToys-app/DevToys.Tools) 佔位文字      | Public domain           | `src/assets/lipsums/` 下的佔位語料。                                                                                                                              |
| [draw.io](https://github.com/jgraph/drawio) `31.6.1`              | Apache-2.0              | 由 `scripts/vendor-drawio.js` 置入 `public/drawio/` 的網頁應用程式。                                                                                                  |
| [ArtCraft](https://getartcraft.com/apps)                          | MIT OR Apache-2.0       | WordCraft `0.9.0`、GridCraft `0.10.0`、PhotoCraft `0.12.0`、FilmCraft `0.10.0`、DeckCraft `0.9.0`。由 `scripts/vendor-crafts.js` 從 `third-party/` 解包到 `public/crafts/`。 |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) `2026.6.1` | MIT                     | 由 `scripts/vendor-hoppscotch.js` 置入 `public/hoppscotch/` 的網頁用戶端，來自 [hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) 映像。      |
| [SQLite](https://sqlite.org/wasm) `3.54.0`                        | Public domain           | WASM/JS 建置。由 `scripts/vendor-sqlite.js` 從 `sqlite-wasm-3540000.zip` 解包到 `public/sqlite/`。                                                                  |
| [Pyodide](https://github.com/pyodide/pyodide) `314.0.7`           | MPL-2.0                 | Python 3.14 執行環境。由 `scripts/vendor-pyodide.js` 從 `pyodide-314.0.7.tar.bz2` 解包到 `public/pyodide/`。包含 CPython（PSF License）。                                  |
| [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.8.6` | BSD-3-Clause            | 建置到 `public/jupyterlite/` 的 JupyterLab 靜態站點，經 `scripts/vendor-jupyterlite.js`（需要 `python3`）。包含 Pyodide 核心（MPL-2.0）。                                        |


執行時程式庫保留各自的授權（記錄在 `package-lock.json`）。主要有：React（MIT）、JSXGraph（MIT OR LGPL-3.0-or-later）、Mermaid（MIT）、Papa Parse、Plotly、ml-pca、ml-distance 和 ml-kmeans（MIT）。DOMPurify 為 MPL-2.0 OR Apache-2.0。