import { formatJson, formatSql, formatXml } from './formatOps.js'

const pluginFor = {
  babel: () => import('prettier/plugins/babel'),
  estree: () => import('prettier/plugins/estree'),
  typescript: () => import('prettier/plugins/typescript'),
  postcss: () => import('prettier/plugins/postcss'),
  markdown: () => import('prettier/plugins/markdown'),
  html: () => import('prettier/plugins/html'),
  graphql: () => import('prettier/plugins/graphql'),
  yaml: () => import('prettier/plugins/yaml'),
}

const parserPlugins = {
  babel: ['babel', 'estree'],
  typescript: ['typescript', 'estree'],
  css: ['postcss'],
  scss: ['postcss'],
  markdown: ['markdown'],
  html: ['html'],
  graphql: ['graphql'],
  yaml: ['yaml'],
}

export async function formatSyntax(input, language, indent = '2') {
  const text = String(input ?? '')
  if (!text.trim()) return ''
  if (language.format === 'json') return formatJson(text, { indent })
  if (language.format === 'sql') return formatSql(text, { indent })
  if (language.format === 'xml') return formatXml(text, { indent })
  const pluginsNeeded = parserPlugins[language.format]
  if (!pluginsNeeded) throw new Error('Formatting is not available for this language.')
  const [{ format }, plugins] = await Promise.all([
    import('prettier/standalone'),
    Promise.all(pluginsNeeded.map(id => pluginFor[id]().then(mod => mod.default))),
  ])
  return format(text, {
    parser: language.format,
    plugins,
    tabWidth: indent === '4' ? 4 : 2,
    useTabs: indent === 'tab',
    printWidth: 80,
  })
}
