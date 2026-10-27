// Entry shape: { id, name, section, lib (string or array), import?, summary, use?, tips?, keywords?,
//   flow?: [step labels] for workflow entries, params?: [[name, default, options, when]], tables?: [{ title, head, rows }], snippets?: [{ title, code, language? }] }

export const paramHead = ['Parameter', 'Default', 'Options / range', 'When to use']

export function queryTokens(query) {
  return String(query || '').toLowerCase().split(/\s+/).filter(Boolean)
}

function rowText(row) { return row.join(' ').toLowerCase() }

function haystack(entry) {
  if (entry._hay) return entry._hay
  const parts = [entry.name, entry.section, ...libsOf(entry), entry.import, entry.summary, entry.use, entry.keywords, ...(entry.flow || []), ...(entry.tips || [])]
  for (const row of entry.params || []) parts.push(row.join(' '))
  for (const table of entry.tables || []) parts.push(table.title, ...table.rows.map(row => row.join(' ')))
  for (const snippet of entry.snippets || []) parts.push(snippet.title, snippet.code)
  Object.defineProperty(entry, '_hay', { value: parts.filter(Boolean).join('\n').toLowerCase() })
  return entry._hay
}

// Parameters whose name contains a token come first, then rows that mention every token.
export function matchedParams(entry, tokens) {
  if (!tokens.length) return []
  const rows = entry.params || []
  const byName = rows.filter(row => tokens.some(token => row[0].toLowerCase().includes(token)))
  if (byName.length) return byName.map(row => row[0])
  return rows.filter(row => tokens.every(token => rowText(row).includes(token))).map(row => row[0])
}

function score(entry, tokens) {
  const name = entry.name.toLowerCase()
  const names = (entry.params || []).map(row => row[0].toLowerCase())
  let total = 0
  for (const token of tokens) {
    if (name === token) total += 200
    else if (name.startsWith(token)) total += 100
    else if (name.includes(token)) total += 60
    if (names.includes(token)) total += 40
    else if (names.some(param => param.includes(token))) total += 20
    if (entry.section.toLowerCase().includes(token) || libsOf(entry).join(' ').toLowerCase().includes(token)) total += 10
    if ((entry.keywords || '').toLowerCase().includes(token)) total += 8
    total += 1
  }
  return total
}

export function filterEntries(entries, query, lib = '') {
  const tokens = queryTokens(query)
  const pool = lib ? entries.filter(entry => libsOf(entry).includes(lib)) : entries
  if (!tokens.length) return pool.map(entry => ({ entry, params: [] }))
  return pool
    .filter(entry => tokens.every(token => haystack(entry).includes(token)))
    .map((entry, index) => {
      const params = matchedParams(entry, tokens)
      // Any parameter hit outranks entries that only mention the words in prose or code.
      return { entry, params, score: score(entry, tokens) + (params.length ? 15 : 0), index }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry, params }) => ({ entry, params }))
}

export function libsOf(entry) {
  return [].concat(entry.lib)
}

export function libraries(entries) {
  return [...new Set(entries.flatMap(libsOf))]
}
