import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const VERSION = '314.0.7'
const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'pyodide')
const marker = join(target, '.pyodide-version')
const archive = join(root, `pyodide-${VERSION}.tar.bz2`)
// Runtime files, plus the wheels JupyterLite's kernel loads from this folder.
// Other wheels in the archive stay out; the standard library is in python_stdlib.zip.
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
const digests = {
  'pyodide.mjs': '6f1d60f7bf529beb300f0f47983c921d3982363640ba20af0e38efdddbc66109',
  'pyodide.asm.mjs': 'f7cdc8ece80678ceb712f8e65ebe6d3a83203a180c399865f49612a051693635',
  'pyodide.asm.wasm': 'cc36e3cab04fdfc9a63ff13eb52eae2b911bf46c025cc7b281f394bd3de1d5e6',
  'python_stdlib.zip': 'fa1957e5777068fc4f7437f96d860ae2fbe9c19732ba06c84e004ec16dd7dd7a',
  'pyodide-lock.json': '5dc2fc119108bc148c7457dc86e7675b5c87e1cafd420b9c34c1eaef7b36c010',
  'micropip-0.11.1-py3-none-any.whl': 'e2d52886594fd4cd0d0847110a1c34ae0134d3a970eb4496d3b5eb31ee2d8af6',
  'ipython-9.12.0-py3-none-any.whl': '0ae2295a90e56496d2a25e8c44ea4d5a5cfb891cca8439eb61d06b68ef145d9a',
  'jedi-0.19.2-py2.py3-none-any.whl': '14346bd3f7aabb699b9e1223afdfae706f9a391212659d2cbf74c66c715095b4',
  'parso-0.8.6-py2.py3-none-any.whl': '6a4e296bc54f0e3489ce61ff9f30e9538dc382bdae10fa6413b34000883385d8',
  'asttokens-3.0.1-py3-none-any.whl': 'c69b99c67d1871f8f80232ca5d0cb5eafbf7e69a946e7981e8f24b31370e2675',
  'decorator-5.2.1-py3-none-any.whl': 'da941fd8a421e3e0d0d8b4efa5ec775d63ba553c7262de9fd40ddabee659f547',
  'executing-2.2.1-py2.py3-none-any.whl': 'cc5b8219eca44e13f8ca2011d6a8f98d9a57ec75bdcadf1c56e4b779e5f69436',
  'matplotlib_inline-0.2.1-py3-none-any.whl': '2b749891f370a4d6830108b2e21d0e1b929685723c419e288def2ea1dc76428e',
  'prompt_toolkit-3.0.52-py3-none-any.whl': '0ba08e03583dacc94338b608a88ee95e83ef1c9d4ec1403127a06e80d7a01970',
  'pure_eval-0.2.3-py3-none-any.whl': '8a302142ea19084d879dd4b411552eb06cd25b37eaa0d4cc46c45ca49c3d1eea',
  'pygments-2.20.0-py3-none-any.whl': '6e0fd0e83d3e725a668aa73110112ffe67e59feb4516eeff3a0b8c12a236462f',
  'six-1.17.0-py2.py3-none-any.whl': '228c50f73aa7addf2c2ccf2979c256802a59ab69cad8152b31b9443cc8140f42',
  'stack_data-0.6.3-py3-none-any.whl': 'b28e173d32b19041387f7bd3865b2dec8e100c1237f009f402d3549fecbba864',
  'traitlets-5.14.3-py3-none-any.whl': '9c58da4647924c8f1bb932c64c8a506b309c47115d97668241ea4734125eb320',
  'wcwidth-0.6.0-py3-none-any.whl': 'ae04c5081c1920e605e9d8b7dffc368a35d8de9b698468819d52e4994a883b76',
}

async function digestsMatch() {
  for (const [name, sha] of Object.entries(digests)) {
    const path = join(target, name)
    if (!existsSync(path)) return false
    const hash = createHash('sha256').update(await readFile(path)).digest('hex')
    if (hash !== sha) throw new Error(`${name} sha256 does not match the pinned hash`)
  }
  return true
}

function kernelWheels() {
  const packages = JSON.parse(readFileSync(join(target, 'pyodide-lock.json'), 'utf8')).packages
  const by = new Map(Object.entries(packages).map(([name, info]) => [name.toLowerCase().replaceAll('_', '-'), info]))
  const seen = new Set()
  const names = []
  const queue = ['micropip', 'ipython', 'jedi']
  while (queue.length) {
    const name = queue.pop().toLowerCase().replaceAll('_', '-')
    if (seen.has(name)) continue
    seen.add(name)
    const info = by.get(name)
    if (!info?.file_name || !/^[\w.+-]+\.whl$/.test(info.file_name)) throw new Error(`Unexpected wheel for ${name} in pyodide-lock.json`)
    names.push(info.file_name)
    queue.push(...(info.depends || []))
  }
  return names
}

const runtimeReady = existsSync(marker) && (await readFile(marker, 'utf8')).trim() === VERSION && files.every(name => existsSync(join(target, name)))
if (runtimeReady && kernelWheels().every(name => existsSync(join(target, name))) && await digestsMatch()) {
  console.log(`Pyodide ${VERSION} already in public/pyodide`)
  process.exit(0)
}

if (!runtimeReady) {
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
}

const missingWheels = kernelWheels().filter(name => !existsSync(join(target, name)))
if (missingWheels.length && existsSync(archive)) {
  const extracted = spawnSync('python3', ['-c', `
import tarfile, sys, os
archive, out, *names = sys.argv[1:]
with tarfile.open(archive, "r:bz2") as z:
    for name in names:
        data = z.extractfile(z.getmember(f"pyodide/{name}")).read()
        open(os.path.join(out, name), "wb").write(data)
`, archive, target, ...missingWheels], { stdio: 'inherit' })
  if (extracted.status !== 0) throw new Error('Could not extract Pyodide wheels')
}
for (const name of missingWheels.filter(name => !existsSync(join(target, name)))) {
  const url = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/${name}`
  console.log(`Fetching ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${name} (${response.status}). Place pyodide-${VERSION}.tar.bz2 in the project root and rerun.`)
  await writeFile(join(target, name), Buffer.from(await response.arrayBuffer()))
}

if (!await digestsMatch()) throw new Error('Pyodide files do not match the pinned SHA-256 hashes')
await writeFile(marker, `${VERSION}\n`, 'utf8')
console.log(`Installed Pyodide ${VERSION} to public/pyodide`)
