import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { tools } from '../src/catalog.js'

const DEFAULT_SITE_URL = 'https://bx8361.github.io/brad-supercharger'

function siteUrl() {
  return (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function writeSitemap(outputDirectory) {
  const base = siteUrl()
  const lastmod = new Date().toISOString().slice(0, 10)
  const locations = [
    `${base}/`,
    ...tools.map(tool => `${base}/tools/${tool.id}/`),
  ]

  const body = locations.map(loc => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`).join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

  const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`

  await writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap, 'utf8')
  await writeFile(resolve(outputDirectory, 'robots.txt'), robots, 'utf8')

  const shell = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
  const nestedShell = shell.replace(/\.\//g, '../../')
  for (const tool of tools) {
    const dir = resolve(outputDirectory, 'tools', tool.id)
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'index.html'), nestedShell, 'utf8')
  }
}

export function sitemap() {
  let outputDirectory
  return {
    name: 'supercharger-sitemap',
    apply: 'build',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await writeSitemap(outputDirectory)
    },
  }
}
