import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
const files = {
  'sqlite3.mjs': 'be942c6387b75bd246dcea8f243b17c1cddc21ced659b87e718f16d190c6fa92',
  'sqlite3.wasm': '4f0bbae88a25ace2c9e5f8651d78cc76465ae3f66480ffa3cb196c89fa83ac33',
  'sqlite3-opfs-async-proxy.js': 'da5a37526ffba2401cc9a7f24ccc4bffc405825c6f36d8c7c226d010197ecac3',
}

async function hashesMatch() {
  for (const [name, sha] of Object.entries(files)) {
    const path = join(target, name)
    if (!existsSync(path)) return false
    const hash = createHash('sha256').update(await readFile(path)).digest('hex')
    if (hash !== sha) return false
  }
  return true
}

if (existsSync(marker) && (await readFile(marker, 'utf8')).trim() === VERSION && await hashesMatch()) {
  console.log(`SQLite WASM ${VERSION} already in public/sqlite`)
  process.exit(0)
}

let zipPath = localZip
let downloadDir
if (!existsSync(localZip)) {
  downloadDir = await mkdtemp(join(tmpdir(), 'sqlite-wasm-'))
  zipPath = join(downloadDir, `sqlite-wasm-${VERSION}.zip`)
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
`, zipPath, VERSION, target, ...Object.keys(files)], { stdio: 'inherit' })
if (py.status !== 0) throw new Error('Could not extract SQLite WASM archive')
if (!await hashesMatch()) throw new Error('SQLite WASM files do not match the pinned SHA-256 hashes')
await writeFile(marker, `${VERSION}\n`, 'utf8')
if (downloadDir) await rm(downloadDir, { recursive: true, force: true })
console.log(`Installed SQLite WASM ${VERSION} to public/sqlite`)
