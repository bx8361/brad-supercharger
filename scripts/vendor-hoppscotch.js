import { createWriteStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { createGunzip } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const VERSION = '2026.6.1'
const IMAGE = 'hoppscotch/hoppscotch-frontend'
const REGISTRY = 'registry-1.docker.io'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = join(root, 'public', 'hoppscotch')
const marker = join(target, 'index.html')
const versionFile = join(target, '.hoppscotch-version')

if (existsSync(marker) && existsSync(versionFile)) {
  const pinned = (await readFile(versionFile, 'utf8')).trim()
  const html = readFileSync(marker, 'utf8')
  if (pinned === VERSION && html.includes("base.href = path + '#'")) {
    patchForSubpath(target)
    console.log(`Hoppscotch ${VERSION} already in public/hoppscotch`)
    process.exit(0)
  }
  if (pinned === VERSION) {
    patchForSubpath(target)
    console.log(`Patched Hoppscotch ${VERSION} in public/hoppscotch`)
    process.exit(0)
  }
}

async function registryToken() {
  const url = `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${IMAGE}:pull`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Docker Hub auth failed (${response.status})`)
  return (await response.json()).token
}

async function registryJson(token, path, accept) {
  const response = await fetch(`https://${REGISTRY}/v2/${IMAGE}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: accept },
  })
  if (!response.ok) throw new Error(`Registry request failed (${response.status}): ${path}`)
  return response.json()
}

async function downloadBlob(token, digest, dest) {
  const response = await fetch(`https://${REGISTRY}/v2/${IMAGE}/blobs/${digest}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Blob download failed (${response.status}): ${digest}`)
  await pipeline(response.body, createWriteStream(dest))
}

function extractHoppscotchWeb(archive, dest) {
  const py = spawnSync('python3', ['-c', `
import sys, tarfile
archive, dest = sys.argv[1], sys.argv[2]
prefix = 'site/selfhost-web'
with tarfile.open(archive, 'r:gz') as tar:
    members = [m for m in tar.getmembers() if m.name == prefix or m.name.startswith(prefix + '/')]
    if not members:
        raise SystemExit(2)
    tar.extractall(dest, members=members, filter='data')
`, archive, dest], { stdio: 'pipe' })
  if (py.status === 2) return false
  if (py.status !== 0) throw new Error('Could not extract Hoppscotch web app (python3 + tarfile required)')
  return true
}

function patchForSubpath(dir) {
  const indexPath = join(dir, 'index.html')
  let html = readFileSync(indexPath, 'utf8')
  html = html.replace(/href="\//g, 'href="./').replace(/src="\//g, 'src="./')
  const boot = `<script>
(function () {
  const path = location.pathname.endsWith('/') ? location.pathname + 'index.html' : location.pathname
  const base = document.createElement('base')
  base.href = path + '#'
  document.head.prepend(base)
  const origin = new URL('.', location.href).href.replace(/\\/$/, '')
  globalThis.import_meta_env = {
    VITE_BASE_URL: origin,
    VITE_SHORTCODE_BASE_URL: origin,
    VITE_ADMIN_URL: '',
    VITE_BACKEND_GQL_URL: '',
    VITE_BACKEND_WS_URL: '',
    VITE_BACKEND_API_URL: '',
    VITE_APP_TOS_LINK: 'https://docs.hoppscotch.io/support/terms',
    VITE_APP_PRIVACY_POLICY_LINK: 'https://docs.hoppscotch.io/support/privacy',
    VITE_PROXYSCOTCH_ACCESS_TOKEN: '',
  }
})()
</script>`
  html = html.replace(/<script>\s*\(function \(\) \{[\s\S]*?import_meta_env[\s\S]*?\}\)\(\)\s*<\/script>\s*/g, '')
  html = html.replace(/<script>\s*globalThis\.import_meta_env[\s\S]*?<\/script>\s*/g, '')
  if (!html.includes("base.href = path + '#'")) html = html.replace('<head>', `<head>\n    ${boot}`)
  html = html.replace(/\s*<style>\.autocomplete-wrapper\{position:relative!important;[\s\S]*?<\/style>/, '')
  writeFileSync(indexPath, html, 'utf8')
  rewriteRootImages(dir)
  patchAssetBase(dir)
}

function patchAssetBase(dir) {
  const pending = [dir]
  while (pending.length) {
    const current = pending.pop()
    for (const name of readdirSync(current)) {
      const file = join(current, name)
      if (statSync(file).isDirectory()) pending.push(file)
      else if (name.endsWith('.js')) {
        const source = readFileSync(file, 'utf8')
        const broken = 'return"/"+A'
        if (!source.includes('endsWith(".css")') || !source.includes(broken)) continue
        writeFileSync(file, source.replaceAll(broken, 'return new URL("../"+A,import.meta.url).href'), 'utf8')
      }
    }
  }
}

function rewriteRootImages(dir) {
  const pending = [dir]
  while (pending.length) {
    const current = pending.pop()
    for (const name of readdirSync(current)) {
      const file = join(current, name)
      if (statSync(file).isDirectory()) pending.push(file)
      else if (/\.(js|css|html)$/.test(name)) {
        const source = readFileSync(file, 'utf8')
        if (!source.includes('"/images/')) continue
        writeFileSync(file, source.replaceAll('"/images/', '"./images/'), 'utf8')
      }
    }
  }
}

async function injectBuildEnv(webRoot) {
  const cli = join(root, 'node_modules', '@import-meta-env', 'cli', 'bin', 'import-meta-env.js')
  if (!existsSync(cli)) throw new Error('Missing @import-meta-env/cli — run npm install')
  const envPath = join(webRoot, '.build.env')
  const env = [
    'VITE_BASE_URL="http://localhost/hoppscotch"',
    'VITE_SHORTCODE_BASE_URL="http://localhost/hoppscotch"',
    'VITE_ADMIN_URL=""',
    'VITE_BACKEND_GQL_URL=""',
    'VITE_BACKEND_WS_URL=""',
    'VITE_BACKEND_API_URL=""',
    'VITE_APP_TOS_LINK="https://docs.hoppscotch.io/support/terms"',
    'VITE_APP_PRIVACY_POLICY_LINK="https://docs.hoppscotch.io/support/privacy"',
    'VITE_PROXYSCOTCH_ACCESS_TOKEN=""',
    '',
  ].join('\n')
  writeFileSync(envPath, env, 'utf8')
  execFileSync(process.execPath, [cli, '-x', envPath, '-e', envPath, '-p', '**/*'], {
    cwd: webRoot,
    stdio: 'inherit',
  })
  await rm(envPath, { force: true })
}

console.log(`Fetching Hoppscotch ${VERSION} (${IMAGE})…`)
const token = await registryToken()
const index = await registryJson(token, `manifests/${VERSION}`, 'application/vnd.oci.image.index.v1+json')
const platform = index.manifests.find(entry => entry.platform?.architecture === 'amd64' && entry.platform?.os === 'linux')
if (!platform) throw new Error('No linux/amd64 manifest for Hoppscotch image')
const manifest = await registryJson(token, `manifests/${platform.digest}`, 'application/vnd.docker.distribution.manifest.v2+json')

const work = join(tmpdir(), `hoppscotch-vendor-${VERSION}`)
const layerArchive = join(work, 'layer.tar.gz')
const layerDir = join(work, 'layer')
await rm(work, { recursive: true, force: true })
await mkdir(work, { recursive: true })

let sourceRoot = null
for (const layer of manifest.layers) {
  await downloadBlob(token, layer.digest, layerArchive)
  await rm(layerDir, { recursive: true, force: true })
  await mkdir(layerDir, { recursive: true })
  if (!extractHoppscotchWeb(layerArchive, layerDir)) continue
  const candidate = join(layerDir, 'site', 'selfhost-web', 'index.html')
  if (existsSync(candidate)) {
    sourceRoot = join(layerDir, 'site', 'selfhost-web')
    break
  }
}
if (!sourceRoot) throw new Error('Hoppscotch web app not found in image layers')

await rm(target, { recursive: true, force: true })
await mkdir(join(root, 'public'), { recursive: true })
await cp(sourceRoot, target, { recursive: true })

await injectBuildEnv(target)
patchForSubpath(target)
await writeFile(versionFile, `${VERSION}\n`, 'utf8')

await rm(work, { recursive: true, force: true })
console.log(`Installed Hoppscotch ${VERSION} to public/hoppscotch`)
