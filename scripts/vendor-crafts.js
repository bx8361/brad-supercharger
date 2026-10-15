import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// ponytail: unpack sources/*.zip as-is. Re-run when the version marker changes.
const apps = [
  ['wordcraft', 'wordcraft-web-0.7.0.zip', '0.7.0'],
  ['gridcraft', 'gridcraft-web-0.7.0.zip', '0.7.0'],
  ['photocraft', 'photocraft-web-0.9.0.zip', '0.9.0'],
  ['filmcraft', 'filmcraft-web-0.8.0.zip', '0.8.0'],
  ['deckcraft', 'deckcraft-web-0.7.0.zip', '0.7.0'],
]

const root = fileURLToPath(new URL('..', import.meta.url))
const targetRoot = join(root, 'public', 'crafts')
await mkdir(targetRoot, { recursive: true })

for (const [id, zipName, version] of apps) {
  const dest = join(targetRoot, id)
  const marker = join(dest, '.craft-version')
  if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === version && existsSync(join(dest, 'index.html'))) {
    patchCraftLang(id, dest)
    console.log(`${id} ${version} already in public/crafts/${id}`)
    continue
  }
  const zip = join(root, 'sources', zipName)
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
  patchCraftLang(id, dest)
  console.log(`Installed ${id} ${version} to public/crafts/${id}`)
}

function patchCraftLang(id, dest) {
  const indexPath = join(dest, 'index.html')
  let html = readFileSync(indexPath, 'utf8')
  html = html.replace(/<script>\/\* ponytail: [\s\S]*?<\/script>\s*/g, '')
  if (id === 'wordcraft') {
    const script = `  <script>/* ponytail: wordcraft-web 0.7.0 UI font is Latin-only, so a Chinese navigator paints every label as ?. */try{const lang="en-US";Object.defineProperty(Navigator.prototype,"language",{get(){return lang}});Object.defineProperty(Navigator.prototype,"languages",{get(){return [lang]}})}catch(e){}</script>\n`
    html = html.replace('<head>', `<head>\n${script}`)
  }
  writeFileSync(indexPath, html)
}
