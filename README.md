[日本語](README_ja.md) · [简体中文](README_zh-Hans.md) · [繁體中文](README_zh-Hant.md)

# Brad's Supercharger

A local-first toolbox for everyday developer work. It is a static [React](https://react.dev/) + [Vite](https://vite.dev/) site: tool inputs are processed in the browser, and nothing is sent to a server.

Published site: [https://bx8361.github.io/brad-supercharger/](https://bx8361.github.io/brad-supercharger/)

> [!TIP]
> This site can be installed as a desktop app. In Chrome, use the address bar, the browser menu, or **Install app** in the sidebar. It opens in its own window. After the first load it works offline; an update applies once every Supercharger window is closed and the app is opened again.

## Run locally

```sh
npm install
npm run dev
```

`npm install` unpacks self-hosted apps that are too large to commit:

- **draw.io** `31.6.1` ([Apache-2.0](https://github.com/jgraph/drawio)) into `public/drawio/`
- **Hoppscotch** `2026.6.1` ([MIT](https://github.com/hoppscotch/hoppscotch)) into `public/hoppscotch/`
- **ArtCraft** WordCraft `0.10.0`, GridCraft `0.11.1`, PhotoCraft `0.15.1`, FilmCraft `0.12.0`, DeckCraft `0.10.0` ([MIT OR Apache-2.0](https://getartcraft.com/apps)) into `public/crafts/`, from the matching zip files in `third-party/`
- **SQLite WASM** `3.54.0` ([public domain](https://sqlite.org/copyright.html)) into `public/sqlite/`, from `sqlite-wasm-3540000.zip` when that file is in the project root
- **Pyodide** `314.0.7` ([MPL-2.0](https://github.com/pyodide/pyodide)) into `public/pyodide/`, from `pyodide-314.0.7.tar.bz2` in the project root
- **JupyterLite** `0.8.6` ([BSD-3-Clause](https://github.com/jupyterlite/jupyterlite)) into `public/jupyterlite/`, built with `python3` via `scripts/vendor-jupyterlite.js`

Rebuild with `node scripts/vendor-drawio.js`, `node scripts/vendor-hoppscotch.js`, `node scripts/vendor-crafts.js`, `node scripts/vendor-sqlite.js`, `node scripts/vendor-pyodide.js`, or `node scripts/vendor-jupyterlite.js`.

```sh
npm run build
npm run preview
```

## Tools

### Converters

- **Cron parser** — explain a cron expression and list upcoming runs
- **JSON to table** — turn a JSON array into a table or CSV
- **JSON ↔ YAML** — convert between JSON and YAML
- **Timestamp** — convert Unix timestamps and calendar dates
- **Number base** — convert integers across binary, octal, decimal, and hex
- **Calculator** — scientific expressions, history, and constants, in the style of [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)
- **Nerdamer-prime** — symbolic calculus (derivatives, integrals, limits, Laplace transforms, solving) with [nerdamer-prime](https://github.com/together-science/nerdamer-prime), plus a searchable operations help panel with runnable examples
- **Algebrite** — symbolic calculus (derivatives, integrals, Taylor series, matrices, special polynomials) with [Algebrite](http://algebrite.org), plus a searchable operations help panel with runnable examples

### Text

- **Escape / unescape** — escape or unescape JSON and XML text
- **List comparer** — lines that are shared or unique
- **Markdown preview** — write Markdown and preview it (images and embedded media are omitted)
- **Text analyzer** — counts and transforms such as case, sort, and trim
- **Scratchpad** — notes kept in this browser
- **Text comparer** — diff two text blocks

### Encoders and decoders

- **Base64 text** — encode or decode text
- **Base64 image** — encode an image, or decode Base64 to a preview
- **Certificate decoder** — inspect a PEM X.509 public certificate (not a password-protected PFX)
- **GZip** — compress text to Base64 GZip, or decompress it
- **HTML encoder** — escape markup or decode HTML entities
- **JWT encoder** — encode or decode JSON Web Tokens (HMAC only; decode does not verify signatures)
- **QR code** — generate a code from text, or read one from an image
- **URL encoder** — percent-encode or decode URL data (RFC 3986)
- **AES encrypt / decrypt** — encrypt or decrypt text with a shared password

### Formatters

- **JSON formatter** — validate, format, minify, or sort JSON
- **SQL formatter** — format SQL for common dialects
- **XML formatter** — format or minify XML
- **Syntax formatter** — format and highlight source in one editor

### Generators

- **Hash generator** — SHA digests of text or a file (Web Crypto; needs HTTPS or localhost)
- **Lorem Ipsum** — placeholder text from public-domain literary excerpts
- **Password generator** — random passwords
- **UUID generator** — UUID v1, v4, or v7

### Graphic

- **Image converter** — PNG, JPEG, and WebP
- **Image watermark** — tiled text watermarks, in the browser
- **Image coordinates** — pick points or rectangles and copy pixel coordinates
- **Function graph** — plot expressions on a [JSXGraph](https://jsxgraph.org/) board
- **Mermaid diagrams** — write [Mermaid](https://mermaid.js.org/) markup and preview the diagram
- **draw.io editor** — self-hosted [draw.io](https://www.drawio.com/) (`diagrams.net`)

### Crafts

Third-party [ArtCraft](https://getartcraft.com/apps) web apps (WebAssembly), unpacked into `public/crafts/`. Each one runs on this site’s origin.

- **WordCraft** — write and design documents
- **GridCraft** — edit spreadsheets
- **PhotoCraft** — edit images
- **FilmCraft** — edit video, color, and sound
- **DeckCraft** — build and present slide decks

WordCraft loads Noto Sans CJK SC Regular into its browser font store for Chinese document text; its menus stay in English because custom document fonts do not cover the web UI. PhotoCraft loads the same font through `fonts/manifest.txt`; select **Noto Sans CJK SC** for Chinese text. The font includes Simplified and Traditional Chinese glyphs. GridCraft, FilmCraft, and DeckCraft have no host font-loading hook in these releases, so their missing Chinese glyphs cannot be fixed by serving a font alongside the app.

DeckCraft 0.10.0 [uses the browser clock instead of process IDs on WebAssembly](https://github.com/storytold/deckcraft/blob/v0.10.0/crates/engine/src/recovery.rs), fixing the startup panic. The 0.9.0 binary patch has been removed.

### Media

- **M3U8 downloader** — download an HLS stream, including AES-128, in memory or as a streaming save

### Data Playground

**Data**, **Analyze**, and **Visualize** share one dataset for the current browser session. Load CSV or the Iris and customer samples, then run PCA, correlation, similarity, distance, k-means, descriptive statistics, or charts. PNG and CSV exports stay on this machine. Iris loads first; press **Run** in Analyze to compute PCA.

### Cheatsheets

- **Machine Learning** — scikit-learn, XGBoost, LightGBM, and CatBoost: parameter tables with defaults, options, and when to change them
- **Neural Networks** — PyTorch and Keras 3 / TensorFlow layers, losses, optimizers, schedulers, and training recipes
- **Data snippets** — copyable pandas, NumPy, Matplotlib, and ML workflow code

Type in the filter to search names, parameters, and snippets at once. Matching parameters show under each entry; click one to jump to its row. Use ↑ / ↓ to move through results and Esc to clear.

Each sheet opens with **Workflows (SOP)**: step-by-step procedures such as split → preprocess → train → evaluate → test, CV + grid search, boosting with early stopping, imbalanced data, time series, fine-tuning, EDA, and a leakage checklist. Each one has a step table and runnable code.

### Testers

- **JSONPath tester** — query JSON with JSONPath
- **XML tester** — validate XML against an XSD
- **SQLite** — run SQL in the browser with SQLite WASM. The database stays in this tab
- **Python** — run Python in the browser with Pyodide. Values stay in this tab
- **JupyterLite** — Jupyter notebooks in the browser (Pyodide kernel). Notebooks stay in this browser for this site
- **Regex tester** — test, replace, and extract with JavaScript, Python, Go, Java, .NET, and Rust patterns
- **Hoppscotch** — REST, GraphQL, and WebSocket client (formerly Postwoman). Collections stay in the browser unless you connect a backend. The Hoppscotch browser extension can help with CORS.

## Saved on this device

Favorites, recent tools, theme, navigation, and tool options are stored in this browser. **Save tool inputs & generated text** (under **Saved data & preferences**) is off by default, including for existing installs: inputs and generated text last for the session, and a reload clears them. Turning the option on restores that text after a reload; turning it off deletes previously saved text and keeps the other preferences. The same panel can clear all saved data. A file chosen for hashing lasts only for the session.

Drag the sidebar’s right edge to change its width. Drag the grip under a tool to change that tool’s height; each tool remembers its own height. Focus a grip and use the arrow keys, or double-click it (or press Home) to reset.

## Credits and licenses

The interface and the JavaScript in this repository are original, except for the third-party pieces below. This repository does not ship a project-wide `LICENSE` file. Full notices are in [LICENSES.md](LICENSES.md); the in-app **Third-party notices** page lists the same references and the shipped npm packages.

| Project                                                              | License                 | How it is used                                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [DevToys](https://github.com/DevToys-app/DevToys)                    | MIT, copyright (c) 2021 | Tool collection and navigation concept. No DevToys source or artwork is copied.                                                                                                |
| [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools)        | MIT                     | Reference for default tool behavior, encoders/decoders, and development fixtures. No DevToys.Tools source is shipped.                                                          |
| [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)       | GPL-2.0-or-later        | Calculator syntax, function names, and constants, reimplemented in original JavaScript. No SpeedCrunch C++ source is included.                                                 |
| [NLipsum](https://github.com/DevToys-app/DevToys.Tools) lipsum texts | Public domain           | Placeholder corpora under `src/assets/lipsums/`.                                                                                                                               |
| [draw.io](https://github.com/jgraph/drawio) `31.6.1`                 | Apache-2.0              | Vendored web app in `public/drawio/` via `scripts/vendor-drawio.js`.                                                                                                           |
| [ArtCraft](https://getartcraft.com/apps)                             | MIT OR Apache-2.0       | WordCraft `0.10.0`, GridCraft `0.11.1`, PhotoCraft `0.15.1`, FilmCraft `0.12.0`, and DeckCraft `0.10.0` unpacked from `third-party/` into `public/crafts/` via `scripts/vendor-crafts.js`. |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) `2026.6.1`    | MIT                     | Vendored web client in `public/hoppscotch/` via `scripts/vendor-hoppscotch.js`, from the [hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) image. |
| [SQLite](https://sqlite.org/wasm) `3.54.0`                            | Public domain           | WASM/JS build unpacked from `sqlite-wasm-3540000.zip` into `public/sqlite/` via `scripts/vendor-sqlite.js`.                                                                    |
| [Pyodide](https://github.com/pyodide/pyodide) `314.0.7`               | MPL-2.0                 | Python 3.14 runtime unpacked from `pyodide-314.0.7.tar.bz2` into `public/pyodide/` via `scripts/vendor-pyodide.js`. Includes CPython (PSF License).                             |
| [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.8.6`     | BSD-3-Clause            | JupyterLab static site built into `public/jupyterlite/` via `scripts/vendor-jupyterlite.js` (requires `python3`). Includes the Pyodide kernel (MPL-2.0).                          |

Runtime libraries keep their own licenses (recorded in `package-lock.json`). Notable ones: React (MIT), JSXGraph (MIT OR LGPL-3.0-or-later), Mermaid (MIT), nerdamer-prime, Algebrite, and KaTeX (MIT), Papa Parse, Plotly, ml-pca, ml-distance, and ml-kmeans (MIT). DOMPurify is MPL-2.0 OR Apache-2.0.
