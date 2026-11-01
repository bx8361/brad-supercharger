# DeckCraft 0.13.1 web fonts

`third-party/deckcraft-web-0.13.1-cjk.zip` is a local build of DeckCraft tag `v0.13.1`
(commit `4ce2944`, Rust 1.95.0, locked Cargo dependencies), with
`web-chinese-fonts.patch` applied. The upstream web archive did not embed
craft-fonts; its font picker exposed only Inter's fallback name and Ubuntu.

The patch admits LXGW WenKai Lite Regular to the web font allowlist, requires
it during required-font builds, and includes it in the interface fallback chain.
The font database also exposes the embedded families in the slide font picker.
The existing Japanese fallback stays ahead of Chinese for shared characters.
No installed system fonts are available to this WebAssembly application.

Font input is pinned to `storytold/craft-fonts` commit
`aced4137c022f1f587624d48e81ec77e1914a9cc`:

- `fonts/inter/Inter-Regular.ttf` and `Inter-Bold.ttf` (Inter, OFL-1.1)
- `fonts/biz-ud-pgothic/BIZUDPGothic-Regular.ttf` (BIZ UDPGothic, OFL-1.1)
- `fonts/lxgw-wenkai-lite/LXGWWenKaiLite-Regular.ttf` (LXGW WenKai Lite, OFL-1.1)

The matching `OFL.txt` from each font's directory ships in the archive under
`font-licenses/`. Font bytes are embedded in WebAssembly, not fetched at runtime.
LXGW covers the sample `简体中文测试汉语网页繁體中文測試臺灣龍愛`; this is not a
claim of coverage for every Unicode character.

## Rebuild

1. Download the exact DeckCraft release source and the pinned craft-fonts files
   above, preserving their paths in a separate font input directory. Copy this
   directory's `manifest.txt` and `latin-manifest.txt` into its `fonts/` directory.
2. Apply `patch -p1 < web-chinese-fonts.patch` in the DeckCraft source checkout.
3. Install Rust 1.95.0 with target `wasm32-unknown-unknown`, and wasm-bindgen-cli
   0.2.129 (matching `Cargo.lock`). Build without running tests:

   ```sh
   CRAFT_FONTS_DIR=/absolute/path/to/font-input CRAFT_FONTS_REQUIRED=1 \
     cargo +1.95.0 build --locked --release --target wasm32-unknown-unknown -p deckcraft-web -j 1
   wasm-bindgen --target web --out-name deckcraft-web-cjk --out-dir web \
     target/wasm32-unknown-unknown/release/deckcraft-web.wasm
   ```

4. In a copy of the original web archive, replace its generated JavaScript,
   WebAssembly, and `snippets/` with the output from `web/`. Update `index.html`
   to import `deckcraft-web-cjk.js` and initialize `deckcraft-web-cjk_bg.wasm`.
   Remove the old generated-asset preload links and their stale integrity hashes;
   preserve the icon and other original files. Add the three font licenses.
5. Zip the directory as `deckcraft-web-0.13.1-cjk.zip`, then run
   `node scripts/vendor-crafts.js` from this repository.

Keep the vendor marker distinct (`0.13.1-cjk.1`) so an existing installation of
upstream 0.13.1 is replaced on the next build.
