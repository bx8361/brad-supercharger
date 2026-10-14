import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const VERSION = '3540000'
const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'sqlite')
const marker = join(target, '.sqlite-version')
const localZip = join(root, `sqlite-wasm-${VERSION}.zip`)
const files = ['sqlite3.mjs', 'sqlite3.wasm', 'sqlite3-opfs-async-proxy.js']

if (existsSync(marker) && (await readFile(marker, 'utf8')).trim() === VERSION && files.every(name => existsSync(join(target, name)))) {
  console.log(`SQLite WASM ${VERSION} already in public/sqlite`)
  process.exit(0)
}

let zipPath = localZip
if (!existsSync(localZip)) {
  zipPath = join(tmpdir(), `sqlite-wasm-${VERSION}.zip`)
  const years = ['2026', '2025']
  let response
  for (const year of years) {
    const url = `https://sqlite.org/${year}/sqlite-wasm-${VERSION}.zip`
    console.log(`Fetching ${url}`)
    response = await fetch(url)
    if (response.ok) break
  }
  if (!response?.ok) throw new Error(`Failed to download SQLite WASM ${VERSION}`)
  await pipeline(response.body, createWriteStream(zipPath))
}

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
const py = spawnSync('python3', ['-c', `
import zipfile, sys, os
z = zipfile.ZipFile(sys.argv[1])
prefix = f"sqlite-wasm-{sys.argv[2]}/jswasm/"
out = sys.argv[3]
for name in sys.argv[4:]:
    open(os.path.join(out, name), 'wb').write(z.read(prefix + name))
`, zipPath, VERSION, target, ...files], { stdio: 'inherit' })
if (py.status !== 0) throw new Error('Could not extract SQLite WASM archive')
for (const name of files) {
  if (!existsSync(join(target, name))) throw new Error(`Missing ${name} after extract`)
}
await writeFile(marker, `${VERSION}\n`, 'utf8')
if (zipPath !== localZip) await rm(zipPath, { force: true })
console.log(`Installed SQLite WASM ${VERSION} to public/sqlite`)
