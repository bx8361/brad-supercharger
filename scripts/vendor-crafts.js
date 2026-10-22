import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// ponytail: one Regular face. Bold Chinese falls back to it; add the Bold file when that shows.
const cjkFontUrl = 'https://github.com/notofonts/noto-cjk/raw/Sans2.004/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf'
const cjkLicenseUrl = 'https://raw.githubusercontent.com/notofonts/noto-cjk/Sans2.004/LICENSE'
const cjkFontName = 'NotoSansCJKsc-Regular.otf'

// ponytail: unpack third-party/*.zip as-is. Re-run when the version marker changes.
const apps = [
  ['wordcraft', 'wordcraft-web-0.9.0.zip', '0.9.0'],
  ['gridcraft', 'gridcraft-web-0.10.0.zip', '0.10.0'],
  ['photocraft', 'photocraft-web-0.12.0.zip', '0.12.0'],
  ['filmcraft', 'filmcraft-web-0.10.0.zip', '0.10.0'],
  ['deckcraft', 'deckcraft-web-0.9.0.zip', '0.9.0'],
]

const root = fileURLToPath(new URL('..', import.meta.url))
const targetRoot = join(root, 'public', 'crafts')
await mkdir(targetRoot, { recursive: true })

for (const [id, zipName, version] of apps) {
  const dest = join(targetRoot, id)
  const marker = join(dest, '.craft-version')
  if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === version && existsSync(join(dest, 'index.html'))) {
    await patchCraftLang(id, dest)
    if (id === 'deckcraft') patchDeckcraftPid(dest)
    console.log(`${id} ${version} already in public/crafts/${id}`)
    continue
  }
  const zip = join(root, 'third-party', zipName)
  if (!existsSync(zip)) throw new Error(`Missing ${zip}`)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dest, { recursive: true })
  const py = spawnSync('python3', ['-c', `
import os, sys, zipfile
src, dest = sys.argv[1], sys.argv[2]
skip = {'.htaccess', '_headers', 'LICENSE-MIT', 'LICENSE-APACHE', 'README.md', 'HOSTING.md'}
root = os.path.realpath(dest)
with zipfile.ZipFile(src) as z:
    for info in z.infolist():
        rel = info.filename.split('/', 1)[-1].replace('\\\\', '/')
        if not rel or info.is_dir() or os.path.basename(rel) in skip:
            continue
        out = os.path.realpath(os.path.join(root, rel))
        if os.path.commonpath([root, out]) != root:
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with z.open(info) as inp, open(out, 'wb') as outf:
            outf.write(inp.read())
`, zip, dest], { stdio: 'inherit' })
  if (py.status !== 0) throw new Error(`Could not extract ${zipName}`)
  if (!existsSync(join(dest, 'index.html'))) throw new Error(`${id} index.html missing after extract`)
  await writeFile(marker, `${version}\n`, 'utf8')
  await patchCraftLang(id, dest)
  if (id === 'deckcraft') patchDeckcraftPid(dest)
  console.log(`Installed ${id} ${version} to public/crafts/${id}`)
}

// ponytail: deckcraft-web 0.9.0 calls std::process::id() while initializing a once-cell, which panics on wasm32 ("no pids on this platform"). That panic is the byte sequence below; mark the cell complete and return. The 32-byte wasm stack slot from this call is left behind, once. Remove when a newer web zip boots without this.
function patchDeckcraftPid(dest) {
  const name = readdirSync(dest).find(file => file.endsWith('_bg.wasm'))
  if (!name) throw new Error('deckcraft wasm missing')
  const wasmPath = join(dest, name)
  let wasm = readFileSync(wasmPath)
  const from = Buffer.from('419090b602413141a890b60210ec7400', 'hex')
  const to = Buffer.from('41b8cedb0241033a00000f0101010101', 'hex')
  const at = wasm.indexOf(from)
  if (at < 0) {
    if (!wasm.includes(to)) throw new Error('deckcraft 0.9.0 pid panic site missing')
  } else {
    if (wasm.indexOf(from, at + 1) !== -1) throw new Error('deckcraft pid panic site is not unique')
    wasm = Buffer.concat([wasm.subarray(0, at), to, wasm.subarray(at + from.length)])
    if (!WebAssembly.validate(wasm)) throw new Error('patched deckcraft wasm is invalid')
    writeFileSync(wasmPath, wasm)
  }
  const digest = `sha384-${createHash('sha384').update(wasm).digest('base64')}`
  const indexPath = join(dest, 'index.html')
  const html = readFileSync(indexPath, 'utf8')
  const href = html.indexOf(`href="./${name}"`)
  if (href < 0) throw new Error('deckcraft index.html does not preload the wasm')
  const integ = html.indexOf('integrity="', href)
  const end = html.indexOf('"', integ + 'integrity="'.length)
  const next = `${html.slice(0, integ)}integrity="${digest}${html.slice(end)}`
  if (next !== html) writeFileSync(indexPath, next)
}

async function ensureCjkFont(dest) {
  const fontPath = join(dest, cjkFontName)
  const licensePath = join(dest, 'NotoSansCJKsc-OFL.txt')
  if (!existsSync(fontPath)) {
    console.log('Fetching Noto Sans CJK SC…')
    const response = await fetch(cjkFontUrl)
    if (!response.ok) throw new Error(`Failed to download Noto Sans CJK SC (${response.status})`)
    await pipeline(response.body, createWriteStream(fontPath))
  }
  const magic = readFileSync(fontPath).subarray(0, 4).toString('latin1')
  if (magic !== 'OTTO') throw new Error(`Noto Sans CJK SC is not an OpenType font`)
  if (!existsSync(licensePath)) {
    const response = await fetch(cjkLicenseUrl)
    if (!response.ok) throw new Error(`Failed to download Noto CJK license (${response.status})`)
    await pipeline(response.body, createWriteStream(licensePath))
  }
}

async function patchCraftLang(id, dest) {
  const indexPath = join(dest, 'index.html')
  let html = readFileSync(indexPath, 'utf8')
  html = html.replace(/<script>\/\* ponytail: [\s\S]*?<\/script>\s*/g, '')
  if (id === 'wordcraft') {
    const script = `  <script>/* ponytail: wordcraft-web 0.9.0 UI font is Latin-only, so a Chinese navigator paints every label as ?. */try{const lang="en-US";Object.defineProperty(Navigator.prototype,"language",{get(){return lang}});Object.defineProperty(Navigator.prototype,"languages",{get(){return [lang]}})}catch(e){}</script>\n`
    html = html.replace('<head>', `<head>\n${script}`)
    await ensureCjkFont(dest)
    const seed = `async function seedWordcraftCjk(){/* ponytail: wordcraft-web 0.9.0 ships no CJK face; IndexedDB wordcraft/fonts is loaded at startup. */const key=${JSON.stringify(cjkFontName)};const db=await new Promise((ok,err)=>{const req=indexedDB.open("wordcraft",1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("fonts"))req.result.createObjectStore("fonts")};req.onsuccess=()=>ok(req.result);req.onerror=()=>err(req.error)});const have=await new Promise((ok,err)=>{const q=db.transaction("fonts").objectStore("fonts").get(key);q.onsuccess=()=>ok(q.result);q.onerror=()=>err(q.error)});if(have){db.close();return}const res=await fetch("./"+key);if(!res.ok)throw new Error("cjk font "+res.status);const bytes=new Uint8Array(await res.arrayBuffer());await new Promise((ok,err)=>{const q=db.transaction("fonts","readwrite").objectStore("fonts").put(bytes,key);q.onsuccess=()=>ok();q.onerror=()=>err(q.error)});db.close()}
try{await seedWordcraftCjk()}catch(e){console.warn(e)}
`
    const start = html.indexOf('async function seedWordcraftCjk()')
    if (start >= 0) {
      const end = html.indexOf('try{await seedWordcraftCjk()}catch(e){console.warn(e)}\n', start)
      if (end >= 0) html = html.slice(0, start) + html.slice(end + 'try{await seedWordcraftCjk()}catch(e){console.warn(e)}\n'.length)
    }
    if (!html.includes('const wasm = await init(')) throw new Error('wordcraft index.html has no wasm init')
    html = html.replace('const wasm = await init(', `${seed}const wasm = await init(`)
  }
  if (id === 'photocraft') {
    // ponytail: photocraft-web 0.12.0 fetches fonts/manifest.txt. Grid, Film, and Deck web builds have no host-font hook.
    await ensureCjkFont(dest)
    await mkdir(join(dest, 'fonts'), { recursive: true })
    writeFileSync(join(dest, 'fonts', 'manifest.txt'), `Noto Sans CJK SC | Regular | ${cjkFontName} | Hans | OFL-1.1 | NotoSansCJKsc-OFL.txt\n`)
  }
  writeFileSync(indexPath, html)
}
