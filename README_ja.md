[English](README.md) · [繁體中文](README_zh-Hant.md) · [简体中文](README_zh-Hans.md)

# Brad's Supercharger

日常の開発作業向けの、ローカル優先ツールボックスです。[React](https://react.dev/) と [Vite](https://vite.dev/) の静的サイトで、ツールの入力はブラウザ内で処理され、サーバーには送られません。

公開サイト: [https://bx8361.github.io/brad-supercharger/](https://bx8361.github.io/brad-supercharger/)

> [!TIP]
> このサイトはデスクトップアプリとしてインストールできます。Chrome ではアドレスバー、ブラウザメニュー、またはサイドバーの **アプリをインストール** から入れられます。専用のウィンドウで開きます。最初の読み込みのあとオフラインでも使え、更新は Supercharger のウィンドウをすべて閉じてから開き直したときに適用されます。

## ローカルで実行

```sh
npm install
npm run dev
```

`npm install` は、リポジトリに入れるには大きすぎる自己ホストアプリを展開します。

- **draw.io** `31.6.1`（[Apache-2.0](https://github.com/jgraph/drawio)）を `public/drawio/` へ
- **Hoppscotch** `2026.6.1`（[MIT](https://github.com/hoppscotch/hoppscotch)）を `public/hoppscotch/` へ
- **ArtCraft** WordCraft `0.7.0`、GridCraft `0.7.0`、PhotoCraft `0.9.0`、FilmCraft `0.8.0`、DeckCraft `0.7.0`（[MIT OR Apache-2.0](https://getartcraft.com/apps)）を `public/crafts/` へ。対応する zip は `sources/` に置きます
- **SQLite WASM** `3.54.0`（[パブリックドメイン](https://sqlite.org/copyright.html)）を `public/sqlite/` へ。プロジェクト直下に `sqlite-wasm-3540000.zip` があるときに使います
- **Pyodide** `314.0.7`（[MPL-2.0](https://github.com/pyodide/pyodide)）を `public/pyodide/` へ。プロジェクト直下の `pyodide-314.0.7.tar.bz2` から展開します
- **JupyterLite** `0.8.6`（[BSD-3-Clause](https://github.com/jupyterlite/jupyterlite)）を `public/jupyterlite/` へ。`scripts/vendor-jupyterlite.js` が `python3` でビルドします

再展開は `node scripts/vendor-drawio.js`、`node scripts/vendor-hoppscotch.js`、`node scripts/vendor-crafts.js`、`node scripts/vendor-sqlite.js`、`node scripts/vendor-pyodide.js`、`node scripts/vendor-jupyterlite.js` です。

```sh
npm run build
npm run preview
```

## ツール

### 変換

- **Cron パーサー** — cron 式を説明し、次の実行予定を出します
- **JSON から表** — JSON 配列を表または CSV にします
- **JSON ↔ YAML** — JSON と YAML を相互変換します
- **タイムスタンプ** — Unix タイムスタンプと日付を変換します
- **進数変換** — 整数を 2 進、8 進、10 進、16 進で変換します
- **電卓** — 数式、履歴、定数。[SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch) 風の関数電卓です

### テキスト

- **エスケープ** — JSON と XML のテキストをエスケープ、または戻します
- **リスト比較** — 共通の行と片方だけの行
- **Markdown プレビュー** — Markdown を書いてプレビューします（画像と埋め込みメディアは出しません）
- **テキスト分析** — 文字数や、大文字小文字、並べ替え、トリムなどの変換
- **メモ帳** — メモをこのブラウザに残します
- **テキスト比較** — 二つのテキストの差分

### エンコーダー / デコーダー

- **Base64 テキスト** — テキストのエンコードとデコード
- **Base64 画像** — 画像をエンコードする、または Base64 をプレビューに戻す
- **証明書デコーダー** — PEM の X.509 公開証明書を見ます（パスワード付き PFX は対象外）
- **GZip** — テキストを Base64 の GZip に圧縮する、または展開する
- **HTML エンコーダー** — マークアップをエスケープする、または HTML エンティティを戻す
- **JWT エンコーダー** — JSON Web Token のエンコードとデコード（HMAC のみ。デコードは署名を検証しません）
- **QR コード** — テキストから生成する、または画像から読み取る
- **URL エンコーダー** — URL データをパーセントエンコード、またはデコードします（RFC 3986）
- **AES 暗号化 / 復号** — 共有パスワードでテキストを暗号化、または復号します

### フォーマッター

- **JSON フォーマッター** — JSON の検証、整形、圧縮、キーの並べ替え
- **SQL フォーマッター** — 主な方言の SQL を整形します
- **XML フォーマッター** — XML の整形または圧縮
- **構文フォーマッター** — 一つのエディターでソースを整形し、色分けします

### 生成

- **ハッシュ生成** — テキストまたはファイルの SHA（Web Crypto。HTTPS または localhost が必要）
- **ダミーテキスト** — パブリックドメインの文章からのプレースホルダー
- **パスワード生成** — ランダムなパスワード
- **UUID 生成** — UUID v1、v4、v7

### グラフィック

- **画像変換** — PNG、JPEG、WebP
- **画像の透かし** — ブラウザ内で文字の透かしを敷き詰めます
- **画像座標** — 点や矩形を拾い、ピクセル座標をコピーします
- **関数グラフ** — [JSXGraph](https://jsxgraph.org/) のボードに式を描きます
- **Mermaid 図** — [Mermaid](https://mermaid.js.org/) を書いて図をプレビューします
- **draw.io エディター** — 自己ホストの [draw.io](https://www.drawio.com/)（`diagrams.net`）

### クラフト

第三者の [ArtCraft](https://getartcraft.com/apps) Web アプリ（WebAssembly）を `public/crafts/` に展開したものです。それぞれこのサイトと同じオリジンで動きます。

- **WordCraft** — 文書を書いてデザインします
- **GridCraft** — 表計算を編集します
- **PhotoCraft** — 画像を編集します
- **FilmCraft** — 映像、カラー、音声を編集します
- **DeckCraft** — スライドを作り、発表します

### メディア

- **M3U8 ダウンローダー** — HLS をダウンロードします。AES-128 を含み、メモリ、またはストリーミング保存です

### データ実験場

**データ**、**分析**、**可視化** は、いまのブラウザセッションで一つのデータセットを共有します。CSV、または Iris と顧客のサンプルを読み、PCA、相関、類似度、距離、k-means、記述統計、グラフを実行します。PNG と CSV の書き出しはこのマシンに残ります。最初に Iris が読み込まれます。PCA は分析の **実行** を押します。

### テスター

- **JSONPath テスター** — JSONPath で JSON を問い合わせます
- **XML テスター** — XML を XSD と照合します
- **SQLite** — ブラウザで SQLite WASM の SQL を実行します。データベースはこのタブだけに残ります
- **Python** — ブラウザで Pyodide の Python を実行します。値はこのタブだけに残ります
- **JupyterLite** — ブラウザの Jupyter ノートブック（Pyodide カーネル）。ノートブックはこのサイトのこのブラウザに残ります
- **正規表現テスター** — JavaScript、Python、Go、Java、.NET、Rust のパターンで検索、置換、抽出します
- **Hoppscotch** — REST、GraphQL、WebSocket クライアント（旧 Postwoman）。バックエンドをつながない限り、コレクションはブラウザに残ります。CORS には Hoppscotch のブラウザ拡張が使えます

## この端末に保存

お気に入り、最近のツール、テーマ、ナビゲーション、ツールの設定はこのブラウザに保存されます。**ツールの入力と生成テキストを保存**（**保存データと設定** の中）は、既存のインストールを含めて既定でオフです。入力と生成テキストはセッションのあいだだけで、再読み込みで消えます。オンにすると再読み込み後もそのテキストが戻ります。オフにすると、以前保存したテキストは消え、ほかの設定は残ります。同じパネルですべての保存データを消せます。ハッシュ用に選んだファイルはセッションのあいだだけです。

サイドバーの右端をドラッグすると幅が変わります。ツールの下のつまみをドラッグすると、そのツールの高さが変わります。高さはツールごとに覚えています。つまみにフォーカスして矢印キーを使うか、ダブルクリック（または Home）で戻します。

## クレジットとライセンス

このリポジトリの画面と JavaScript は、下記の第三者部分を除いて独自のものです。プロジェクト全体の `LICENSE` ファイルはありません。全文は [LICENSES.md](LICENSES.md) にあります。アプリ内の **サードパーティ表記** も、同じ参照と、同梱する npm パッケージを載せています。

| プロジェクト | ライセンス | 使い方 |
| --- | --- | --- |
| [DevToys](https://github.com/DevToys-app/DevToys) | MIT, copyright (c) 2021 | ツール集とナビゲーションの考え方。DevToys のソースとアートワークはコピーしていません。 |
| [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools) | MIT | 既定のツール動作、エンコーダー / デコーダー、開発用フィクスチャの参照。DevToys.Tools のソースは同梱しません。 |
| [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch) | GPL-2.0-or-later | 電卓の構文、関数名、定数。独自の JavaScript で再実装しています。SpeedCrunch の C++ ソースは含みません。 |
| [NLipsum](https://github.com/DevToys-app/DevToys.Tools) の lipsum 文 | Public domain | `src/assets/lipsums/` のプレースホルダー本文。 |
| [draw.io](https://github.com/jgraph/drawio) `31.6.1` | Apache-2.0 | `scripts/vendor-drawio.js` で `public/drawio/` に同梱した Web アプリ。 |
| [ArtCraft](https://getartcraft.com/apps) | MIT OR Apache-2.0 | WordCraft `0.7.0`、GridCraft `0.7.0`、PhotoCraft `0.9.0`、FilmCraft `0.8.0`、DeckCraft `0.7.0`。`scripts/vendor-crafts.js` が `sources/` から `public/crafts/` へ展開します。 |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) `2026.6.1` | MIT | `scripts/vendor-hoppscotch.js` で `public/hoppscotch/` に同梱した Web クライアント。[hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) イメージから取り出します。 |
| [SQLite](https://sqlite.org/wasm) `3.54.0` | Public domain | WASM/JS ビルド。`scripts/vendor-sqlite.js` が `sqlite-wasm-3540000.zip` を `public/sqlite/` へ展開します。 |
| [Pyodide](https://github.com/pyodide/pyodide) `314.0.7` | MPL-2.0 | Python 3.14 ランタイム。`scripts/vendor-pyodide.js` が `pyodide-314.0.7.tar.bz2` を `public/pyodide/` へ展開します。CPython（PSF License）を含みます。 |
| [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.8.6` | BSD-3-Clause | JupyterLab の静的サイト。`scripts/vendor-jupyterlite.js` が `public/jupyterlite/` にビルドします（`python3` が必要）。Pyodide カーネル（MPL-2.0）を含みます。 |

実行時ライブラリはそれぞれのライセンスのままです（`package-lock.json` に記録）。主なもの: React（MIT）、JSXGraph（MIT OR LGPL-3.0-or-later）、Mermaid（MIT）、Papa Parse、Plotly、ml-pca、ml-distance、ml-kmeans（MIT）。DOMPurify は MPL-2.0 OR Apache-2.0 です。
