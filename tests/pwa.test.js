import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { buildSync } from 'esbuild'

const template = readFileSync(new URL('../src/service-worker.js', import.meta.url), 'utf8')
function worker(scope) {
  const handlers = {}, stores = new Map(), deleted = [], fetched = []
  let claimed = false
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)
      return {
        addAll: async urls => { for (const url of urls) store.set(url, { cached: url }) },
        match: async url => store.get(url),
      }
    },
    keys: async () => [...stores.keys()],
    delete: async name => { deleted.push(name); return stores.delete(name) },
  }
  runInNewContext(template.replace('__BUILD_VERSION__', 'test-version')
    .replace('__PRECACHE_FILES__', JSON.stringify(['index.html', 'assets/app.js', 'manifest.webmanifest'])), {
    URL, caches, fetch: async request => { fetched.push(request); return { network: true } },
    self: { registration: { scope }, clients: { claim: async () => { claimed = true } },
      addEventListener: (name, handler) => { handlers[name] = handler } },
  })
  return {
    stores, deleted, fetched, get claimed() { return claimed },
    async lifecycle(name) {
      let work
      handlers[name]({ waitUntil: promise => { work = promise } })
      await work
    },
    async request(url, mode = 'navigate', method = 'GET') {
      let response
      handlers.fetch({ request: { url, mode, method }, respondWith: promise => { response = promise } })
      return response
    },
  }
}

for (const path of ['/', '/brad_supercharger/']) {
  test(`offline shell and assets work under ${path}`, async () => {
    const scope = `https://example.com${path}`, app = worker(scope)
    await app.lifecycle('install')
    assert.equal((await app.request(`${scope}#/tools/json`)).cached, `${scope}index.html`)
    assert.equal((await app.request(`${scope}index.html`)).cached, `${scope}index.html`)
    assert.equal((await app.request(`${scope}assets/app.js?version=1`, 'cors')).cached, `${scope}assets/app.js`)
    assert.equal(app.fetched.length, 0)
    assert.equal(await app.request(`${scope}private-data`, 'cors'), undefined)
    assert.equal(await app.request(`${scope}assets/app.js`, 'cors', 'POST'), undefined)
    assert.equal(await app.request('https://other.example/assets/app.js', 'cors'), undefined)
  })
}

test('worker activation removes only old caches belonging to this app scope', async () => {
  const scope = 'https://example.com/brad_supercharger/', app = worker(scope)
  const old = `supercharger:${scope}:old-version`
  const unrelated = 'supercharger:https://example.com/another-app/:old-version'
  app.stores.set(old, new Map()); app.stores.set(unrelated, new Map())
  await app.lifecycle('install'); await app.lifecycle('activate')
  assert.deepEqual(app.deleted, [old])
  assert.ok(app.stores.has(unrelated))
  assert.ok(app.claimed)
})

test('manifest has scoped launch URLs and actual 192/512px PNG icons', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url)))
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.start_url, './#/')
  assert.equal(manifest.scope, './')
  assert.equal(manifest.id, './')
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL(`../public/${icon.src}`, import.meta.url))
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes)
  }
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'))
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'))
})

const hookBundle = buildSync({ entryPoints: ['src/usePwaInstall.js'], bundle: true, platform: 'node',
  format: 'cjs', external: ['react'], write: false }).outputFiles[0].text
function installHarness(standalone = false) {
  const slots = [], effects = [], listeners = new Map()
  let index = 0
  const media = { matches: standalone, addEventListener() {}, removeEventListener() {} }
  const window = {
    matchMedia: () => media,
    addEventListener: (type, handler) => { listeners.set(type, handler) },
    removeEventListener: type => { listeners.delete(type) },
  }
  const react = {
    useState: initial => {
      const slot = index++
      if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value }]
    },
    useRef: initial => { const slot = index++; return slots[slot] ||= { current: initial } },
    useEffect: effect => { const slot = index++; if (!(slot in slots)) { slots[slot] = true; effects.push(effect) } },
  }
  const module = { exports: {} }
  runInNewContext(hookBundle, { module, exports: module.exports, require: () => react, window })
  const render = () => { index = 0; return module.exports.usePwaInstall() }
  render()
  const cleanups = effects.map(effect => effect())
  return { render, emit: (name, event) => listeners.get(name)?.(event), cleanup: () => cleanups.forEach(cleanup => cleanup()), listeners }
}

test('Chrome prompt is only used once and dismissal can be retried with a fresh event', async () => {
  const app = installHarness()
  let prompts = 0, prevented = 0
  const event = outcome => ({ preventDefault: () => { prevented++ },
    prompt: async () => { prompts++ }, userChoice: Promise.resolve({ outcome }) })
  assert.equal(app.render().available, false)
  app.emit('beforeinstallprompt', event('dismissed'))
  assert.equal(app.render().available, true)
  await app.render().install()
  assert.equal(app.render().available, false)
  assert.equal(app.render().installed, false)
  await app.render().install()
  assert.equal(prompts, 1)
  app.emit('beforeinstallprompt', event('accepted'))
  await app.render().install()
  assert.equal(prompts, 2); assert.equal(prevented, 2)
  assert.equal(app.render().installed, true)
  app.cleanup(); assert.equal(app.listeners.size, 0)
})

test('browser installation event and standalone launch hide the install promotion', () => {
  const app = installHarness()
  app.emit('appinstalled')
  assert.equal(app.render().installed, true)
  assert.equal(app.render().available, false)
  assert.equal(installHarness(true).render().installed, true)
})

test('failed install prompt gives a recovery message', async () => {
  const app = installHarness()
  app.emit('beforeinstallprompt', { preventDefault() {}, prompt: async () => { throw new Error('Failed') } })
  await app.render().install()
  assert.equal(app.render().installing, false)
  assert.match(app.render().error, /Chrome/)
})
