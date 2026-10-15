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
    run(python(), ['-m', 'pip', 'install', '--upgrade', 'pip'])
    run(python(), ['-m', 'pip', 'install', `jupyterlite-core[lab]==${VERSION}`, `jupyterlite-pyodide-kernel==${VERSION}`])
  }
}

if (existsSync(marker) && existsSync(versionFile) && (await readFile(versionFile, 'utf8')).trim() === VERSION) {
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
await writeFile(versionFile, `${VERSION}\n`, 'utf8')
await rm(staging, { recursive: true, force: true })
console.log(`Installed JupyterLite ${VERSION} to public/jupyterlite`)
