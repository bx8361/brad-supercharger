import { existsSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const VERSION = '31.6.1'
const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'drawio')
const marker = join(target, 'index.html')
const zipUrl = `https://github.com/jgraph/drawio/archive/refs/tags/v${VERSION}.zip`
const webappParts = [`drawio-${VERSION}`, 'src', 'main', 'webapp']

if (existsSync(marker)) {
  console.log(`draw.io ${VERSION} already in public/drawio`)
  process.exit(0)
}

const tmpZip = join(tmpdir(), `drawio-${VERSION}.zip`)
const tmpExtract = join(tmpdir(), `drawio-extract-${VERSION}`)

console.log(`Fetching draw.io ${VERSION}…`)
const response = await fetch(zipUrl)
if (!response.ok) throw new Error(`Failed to download draw.io (${response.status})`)
await pipeline(response.body, createWriteStream(tmpZip))

await rm(tmpExtract, { recursive: true, force: true })
await mkdir(tmpExtract, { recursive: true })

const py = spawnSync('python3', ['-c', `
import zipfile, sys
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
`, tmpZip, tmpExtract], { stdio: 'inherit' })
if (py.status !== 0) throw new Error('Could not extract draw.io archive (python3 + zipfile required)')

const source = join(tmpExtract, ...webappParts)
if (!existsSync(join(source, 'index.html'))) throw new Error('draw.io webapp missing after extract')

await rm(target, { recursive: true, force: true })
await mkdir(join(root, 'public'), { recursive: true })
await cp(source, target, { recursive: true })
await writeFile(join(target, '.drawio-version'), `${VERSION}\n`, 'utf8')

await rm(tmpZip, { force: true })
await rm(tmpExtract, { recursive: true, force: true })
console.log(`Installed draw.io ${VERSION} to public/drawio`)
