# Third-party notices

## DevToys

This project references the DevToys tool collection and navigation concept. DevToys source: <https://github.com/DevToys-app/DevToys>. The reference repository is licensed under the MIT License, copyright (c) 2021.

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

No DevToys source code or artwork is copied into this project.

## DevToys.Tools

This project references [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools) for default tool behavior, encoders/decoders, and development test fixtures. The reference repository is licensed under the MIT License. No DevToys.Tools source is copied into the shipped app.

Third-party JavaScript packages used at build/runtime are distributed under their respective licenses, recorded in the installed package metadata and lockfile. The in-app **Third-party notices** page lists shipped npm dependencies.

## SpeedCrunch

The Calculator tool’s expression syntax, function naming, and scientific constant set are modeled on [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch) (GPL-2.0-or-later). This project reimplements that behavior in original JavaScript; no SpeedCrunch C++ source is included.

## Lorem Ipsum corpora

Lorem Ipsum generator texts under `src/assets/lipsums/` come from NLipsum / DevToys lipsum XML templates and are treated as public domain literary excerpts for placeholder text.

## draw.io

The **draw.io editor** tool vendors the [jgraph/drawio](https://github.com/jgraph/drawio) web application (Apache-2.0, release pinned in `scripts/vendor-drawio.js`) into `public/drawio/` via `scripts/vendor-drawio.js`. **JSXGraph** and **Mermaid** are npm dependencies; see their package metadata for license terms.

## ArtCraft

The **Crafts** tools vendor [ArtCraft](https://getartcraft.com/apps) web builds (MIT OR Apache-2.0) into `public/crafts/` via `scripts/vendor-crafts.js`. The zip files live in `third-party/`:

- WordCraft `0.9.0` (`wordcraft-web-0.9.0.zip`)
- GridCraft `0.10.0` (`gridcraft-web-0.10.0.zip`)
- PhotoCraft `0.12.0` (`photocraft-web-0.12.0.zip`)
- FilmCraft `0.10.0` (`filmcraft-web-0.10.0.zip`)
- DeckCraft `0.9.0` (`deckcraft-web-0.9.0.zip`)

WordCraft and PhotoCraft text use [Noto Sans CJK SC](https://github.com/notofonts/noto-cjk) Regular `Sans2.004` (SIL Open Font License 1.1). `scripts/vendor-crafts.js` downloads it as `NotoSansCJKsc-Regular.otf`, with the license in `NotoSansCJKsc-OFL.txt`. WordCraft stores it in IndexedDB. PhotoCraft lists it in `fonts/manifest.txt`.

## Hoppscotch

The **Hoppscotch** tool vendors the Hoppscotch web client from the official [hoppscotch/hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) container image (MIT, release pinned in `scripts/vendor-hoppscotch.js`) into `public/hoppscotch/`. Hoppscotch was formerly known as Postwoman. Collections and workspaces are stored in your browser unless you connect a self-hosted backend.

## SQLite

The **SQLite** tool vendors the official [SQLite WASM/JS](https://sqlite.org/wasm) build `3.54.0` (public domain) into `public/sqlite/` via `scripts/vendor-sqlite.js`. The archive is `sqlite-wasm-3540000.zip` in the project root, or a download from sqlite.org when that file is absent.

## Pyodide

The **Python** tool vendors the [Pyodide](https://github.com/pyodide/pyodide) runtime `314.0.7` (MPL-2.0, with CPython under the PSF License) into `public/pyodide/` via `scripts/vendor-pyodide.js`. The archive is `pyodide-314.0.7.tar.bz2` in the project root. The runtime files are unpacked, plus the `micropip`, IPython, and Jedi wheels JupyterLite loads from that folder. Other package wheels in that archive are not installed.

## JupyterLite

The **JupyterLite** tool builds [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.8.6` (BSD-3-Clause) with the [Pyodide kernel](https://github.com/jupyterlite/pyodide-kernel) into `public/jupyterlite/` via `scripts/vendor-jupyterlite.js`. The build requires `python3` and runs on `npm install`. The kernel loads Pyodide from `public/pyodide/` on this site. Notebooks and files are stored in the browser (IndexedDB) for this site; they are separate from the **Python** REPL session.

## Data Playground

Data Playground uses Papa Parse, Plotly, ml-pca, ml-distance, and ml-kmeans (MIT). These dependencies ship with Supercharger; their installed package metadata includes the license notices.

## OpenCC

The Chinese converter uses unmodified phrase dictionaries, character dictionaries, compatibility normalization, and `s2t`/`t2s` configurations from [OpenCC](https://github.com/BYVoid/OpenCC) (Apache-2.0), commit `025f371dc76b598d77384fbdab90c937471844d8`. Resources and the upstream license are under `third-party/simplified-traditional-chinese/`; `opencc-resource-manifest.json` records their provenance and hashes. Conversion uses longest phrase matches before character fallback, with the first listed candidate for ambiguous entries.
