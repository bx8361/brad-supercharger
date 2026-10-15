import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '0.8.6'
const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'jupyterlite')
const marker = join(target, 'lab', 'index.html')
const versionFile = join(target, '.jupyterlite-version')
const venv = join(root, 'node_modules', '.cache', 'jupyterlite-venv')
const venvPython = join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python3')
const venvJupyter = join(venv, process.platform === 'win32' ? 'Scripts/jupyter.exe' : 'bin/jupyter')
const optionalContents = join(root, 'scripts', 'jupyterlite', 'files')

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${result.status ?? 'signal'})`)
}

function python() {
  if (!existsSync(venvPython)) throw new Error('Missing JupyterLite build venv — rerun vendor-jupyterlite.js')
  return venvPython
}

async function ensureBuildEnv() {
  if (spawnSync('python3', ['--version'], { stdio: 'ignore' }).status !== 0) {
    throw new Error('python3 is required to build JupyterLite (jupyter lite build)')
  }
  if (!existsSync(venvPython)) {
    await mkdir(join(root, 'node_modules', '.cache'), { recursive: true })
    console.log('Creating JupyterLite build environment…')
    run('python3', ['-m', 'venv', venv])
    run(python(), ['-m', 'pip', 'install', `jupyterlite-core[lab]==${VERSION}`, `jupyterlite-pyodide-kernel==${VERSION}`])
  }
}

// lab/index.html resolves this to the sibling public/pyodide/ runtime, not the jsDelivr default.
const localPyodideUrl = '../../pyodide/pyodide.mjs'

async function useLocalPyodide() {
  const configPath = join(target, 'jupyter-lite.json')
  if (!existsSync(configPath)) return
  const text = await readFile(configPath, 'utf8')
  if (text.includes(`"pyodideUrl": "${localPyodideUrl}"`)) return
  const needle = '"@jupyterlite/pyodide-kernel-extension:kernel": {'
  if (!text.includes(needle)) throw new Error('JupyterLite config is missing the Pyodide kernel settings')
  await writeFile(configPath, text.replace(needle, `${needle}\n        "pyodideUrl": "${localPyodideUrl}",`))
}

// comm is not in the Pyodide build. Micropip 0.11 cannot read PyPI from the browser, so the wheel lives next to the kernel.
const commWheel = 'comm-0.2.3-py3-none-any.whl'

async function useLocalComm() {
  const dir = join(target, 'extensions/@jupyterlite/pyodide-kernel-extension/static/pypi')
  const wheelPath = join(dir, commWheel)
  if (!existsSync(dir)) return
  if (!existsSync(wheelPath)) {
    const meta = await (await fetch('https://pypi.org/pypi/comm/0.2.3/json')).json()
    const file = meta.urls?.find(item => item.filename === commWheel)
    if (!file?.url) throw new Error(`PyPI has no ${commWheel}`)
    console.log(`Fetching ${file.url}`)
    const response = await fetch(file.url)
    if (!response.ok) throw new Error(`Failed to download ${commWheel} (${response.status})`)
    await writeFile(wheelPath, Buffer.from(await response.arrayBuffer()))
  }
  const indexPath = join(dir, 'all.json')
  const index = JSON.parse(await readFile(indexPath, 'utf8'))
  if (index.comm) return
  const bytes = await readFile(wheelPath)
  index.comm = {
    releases: {
      '0.2.3': [{
        digests: { sha256: createHash('sha256').update(bytes).digest('hex') },
        filename: commWheel,
        packagetype: 'bdist_wheel',
        python_version: 'py3',
        requires_python: '>=3.8',
        size: bytes.length,
        url: `./${commWheel}`,
        yanked: false,
      }],
    },
  }
  await writeFile(indexPath, `${JSON.stringify(index)}\n`)
  const digest = createHash('sha256').update(await readFile(indexPath)).digest('hex')
  const configPath = join(target, 'jupyter-lite.json')
  const config = await readFile(configPath, 'utf8')
  const next = config.replace(
    /all\.json\?sha256=[0-9a-f]+/,
    `all.json?sha256=${digest}`,
  )
  if (next !== config) await writeFile(configPath, next)
}

if (existsSync(marker) && existsSync(versionFile) && (await readFile(versionFile, 'utf8')).trim() === VERSION) {
  await useLocalPyodide()
  await useLocalComm()
  console.log(`JupyterLite ${VERSION} already in public/jupyterlite`)
  process.exit(0)
}

await ensureBuildEnv()

const staging = join(tmpdir(), `jupyterlite-staging-${VERSION}-${Date.now()}`)
const output = join(staging, 'site')
await rm(staging, { recursive: true, force: true })
await mkdir(staging, { recursive: true })

console.log(`Building JupyterLite ${VERSION}…`)
run(venvJupyter, ['lite', 'init'], { cwd: staging })
if (existsSync(optionalContents)) {
  await cp(optionalContents, join(staging, 'files'), { recursive: true })
}
run(venvJupyter, ['lite', 'build', '--output-dir', output], { cwd: staging })

if (!existsSync(join(output, 'lab', 'index.html'))) {
  throw new Error('JupyterLite build missing lab/index.html')
}

await rm(target, { recursive: true, force: true })
await mkdir(join(root, 'public'), { recursive: true })
await cp(output, target, { recursive: true })
await useLocalPyodide()
await useLocalComm()
await writeFile(versionFile, `${VERSION}\n`, 'utf8')
await rm(staging, { recursive: true, force: true })
console.log(`Installed JupyterLite ${VERSION} to public/jupyterlite`)
