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

## Hoppscotch

The **Hoppscotch** tool vendors the Hoppscotch web client from the official [hoppscotch/hoppscotch-frontend](https://hub.docker.com/r/hoppscotch/hoppscotch-frontend) container image (MIT, release pinned in `scripts/vendor-hoppscotch.js`) into `public/hoppscotch/`. Hoppscotch was formerly known as Postwoman. Collections and workspaces are stored in your browser unless you connect a self-hosted backend.

## Data Playground

Data Playground uses Papa Parse, Plotly, ml-pca, ml-distance, and ml-kmeans (MIT). These dependencies ship with Supercharger; their installed package metadata includes the license notices.
