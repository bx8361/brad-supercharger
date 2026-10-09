import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export function pwaAssets() {
  let outputDirectory
  return {
    name: 'supercharger-pwa',
    apply: 'build',
    configResolved(config) { outputDirectory = resolve(config.root, config.build.outDir) },
    async closeBundle() {
      const files = (await readdir(outputDirectory, { recursive: true }))
        .filter(file => /\.(html|js|css|png|svg|webmanifest)$/.test(file) && file !== 'sw.js' && !String(file).replace(/\\/g, '/').startsWith('drawio/') && !String(file).replace(/\\/g, '/').startsWith('hoppscotch/')).sort()
      const hash = createHash('sha256')
      for (const file of files) { hash.update(file); hash.update(await readFile(resolve(outputDirectory, file))) }
      const source = await readFile(new URL('../src/service-worker.js', import.meta.url), 'utf8')
      hash.update(source)
      await writeFile(resolve(outputDirectory, 'sw.js'), source
        .replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 16))
        .replace('__PRECACHE_FILES__', JSON.stringify(files)))
    },
  }
}
