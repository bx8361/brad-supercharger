import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const VERSION = '314.0.7'
const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'pyodide')
const marker = join(target, '.pyodide-version')
const archive = join(root, `pyodide-${VERSION}.tar.bz2`)
// Browser runtime only. Wheels in the archive stay out; the standard library is in python_stdlib.zip.
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

if (existsSync(marker) && (await readFile(marker, 'utf8')).trim() === VERSION && files.every(name => existsSync(join(target, name)))) {
  console.log(`Pyodide ${VERSION} already in public/pyodide`)
  process.exit(0)
}

if (!existsSync(archive)) throw new Error(`Missing ${archive}`)

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
const py = spawnSync('python3', ['-c', `
import tarfile, sys, os
archive, out, *names = sys.argv[1:]
with tarfile.open(archive, "r:bz2") as z:
    for name in names:
        member = z.getmember(f"pyodide/{name}")
        data = z.extractfile(member).read()
        open(os.path.join(out, name), "wb").write(data)
`, archive, target, ...files], { stdio: 'inherit' })
if (py.status !== 0) throw new Error('Could not extract Pyodide archive')
for (const name of files) {
  if (!existsSync(join(target, name))) throw new Error(`Missing ${name} after extract`)
}
await writeFile(marker, `${VERSION}\n`, 'utf8')
console.log(`Installed Pyodide ${VERSION} to public/pyodide`)
