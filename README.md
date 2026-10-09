# Brad's Supercharger

A local-first toolbox for everyday developer work. It is a static [React](https://react.dev/) + [Vite](https://vite.dev/) site: tool inputs are processed in the browser, and nothing is sent to a server.

## Run locally

```sh
npm install
npm run dev
```

`npm install` downloads two self-hosted apps that are too large to commit:

- **draw.io** `31.6.1` ([Apache-2.0](https://github.com/jgraph/drawio)) into `public/drawio/`
- **Hoppscotch** `2026.6.1` ([MIT](https://github.com/hoppscotch/hoppscotch)) into `public/hoppscotch/`

Rebuild either folder with `node scripts/vendor-drawio.js` or `node scripts/vendor-hoppscotch.js`.

```sh
npm run build
npm run preview
```

Publishing the production build is documented in [publish.md](publish.md).

## Tools

### Converters

- **Cron parser** — explain a cron expression and list upcoming runs
- **JSON to table** — turn a JSON array into a table or CSV
- **JSON ↔ YAML** — convert between JSON and YAML
- **Timestamp** — convert Unix timestamps and calendar dates
- **Number base** — convert integers across binary, octal, decimal, and hex
- **Calculator** — scientific expressions, history, and constants, in the style of [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)

### Text

- **Escape / unescape** — escape or unescape JSON and XML text
- **List comparer** — lines that are shared or unique
- **Markdown preview** — write Markdown and preview it (images and embedded media are omitted)
- **Text analyzer** — counts and transforms such as case, sort, and trim
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

### Media

- **M3U8 downloader** — download an HLS stream, including AES-128, in memory or as a streaming save

### Data Playground

**Data**, **Analyze**, and **Visualize** share one dataset for the current browser session. Load CSV or the Iris and customer samples, then run PCA, correlation, similarity, distance, k-means, descriptive statistics, or charts. PNG and CSV exports stay on this machine. Iris loads first; press **Run** in Analyze to compute PCA.

### Testers

- **JSONPath tester** — query JSON with JSONPath
- **XML tester** — validate XML against an XSD
- **Regex tester** — test, replace, and extract with JavaScript, Python, Go, Java, .NET, and Rust patterns
- **Hoppscotch** — REST, GraphQL, and WebSocket client (formerly Postwoman). Collections stay in the browser unless you connect a backend. The Hoppscotch browser extension can help with CORS.

## Saved on this device

Favorites, recent tools, theme, navigation, and tool options are stored in this browser. **Save tool inputs & generated text** (under **Saved data & preferences**) is off by default, including for existing installs: inputs and generated text last for the session, and a reload clears them. Turning the option on restores that text after a reload; turning it off deletes previously saved text and keeps the other preferences. The same panel can clear all saved data. A file chosen for hashing lasts only for the session.

Drag the sidebar’s right edge to change its width. Drag the grip under a tool to change that tool’s height; each tool remembers its own height. Focus a grip and use the arrow keys, or double-click it (or press Home) to reset.

## Install in Chrome

Use a production build over HTTPS, or `npm run preview` on localhost. Chrome can install the site from the address bar, the browser menu, or **Install app** in the sidebar. The installed app opens in its own window. After the first online load, the service worker caches shipped app files for offline use. It does not cache tool inputs. An update applies after every Supercharger tab and window is closed and the app is opened again. The Vite dev server does not register the worker.

## Credits and licenses

The interface and the JavaScript in this repository are original, except for the third-party pieces below. This repository does not ship a project-wide `LICENSE` file. Full notices are in [LICENSES.md](LICENSES.md); the in-app **Third-party notices** page lists the same references and the shipped npm packages.

| Project                                                              | License                 | How it is used                                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [DevToys](https://github.com/DevToys-app/DevToys)                    | MIT, copyright (c) 2021 | Tool collection and navigation concept. No DevToys source or artwork is copied.                                                                                                |
| [DevToys.Tools](https://github.com/DevToys-app/DevToys.Tools)        | MIT                     | Reference for default tool behavior, encoders/decoders, and development fixtures. No DevToys.Tools source is shipped.                                                          |
| [SpeedCrunch](https://bitbucket.org/heldercorreia/speedcrunch)       | GPL-2.0-or-later        | Calculator syntax, function names, and constants, reimplemented in original JavaScript. No SpeedCrunch C++ source is included.                                                 |
| [NLipsum](https://github.com/DevToys-app/DevToys.Tools) lipsum texts | Public domain           | Placeholder corpora under `src/assets/lipsums/`.                                                                                                                               |
| [draw.io](https://github.com/jgraph/drawio) `31.6.1`                 | Apache-2.0              | Vendored web app in `public/drawio/` via `scripts/vendor-drawio.js`.                                                                                                           |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) `2026.6.1`    | MIT                     | Vendored web client in `public/hoppscotch/` via `scripts/vendor-hoppscotch.js`, from the [hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) image. |

Runtime libraries keep their own licenses (recorded in `package-lock.json`). Notable ones: React (MIT), JSXGraph (MIT OR LGPL-3.0-or-later), Mermaid (MIT), Papa Parse, Plotly, ml-pca, ml-distance, and ml-kmeans (MIT). DOMPurify is MPL-2.0 OR Apache-2.0.
