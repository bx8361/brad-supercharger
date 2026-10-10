const jsonRe = /"(?:\\u[0-9a-fA-F]{4}|\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g
const yamlRe = /"(?:\\.|[^"\\\n])*"|'(?:[^'\n]|'')*'|#[^\n]*|^[ \t]*(?:-[ \t]+)?[^:#\n][^:\n]*:|\b(?:true|false|null|yes|no|on|off)\b|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/gm
const xmlRe = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[\w:.-]+|\/?>|"[^"]*"|'[^']*'/g
const sqlRe = /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"])*"|`(?:``|[^`])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w$]*\b/g
const sqlWords = new Set('select from where and or not in is null join left right inner outer full cross on group by order having limit offset insert into values update set delete create table drop alter as distinct union all case when then else end between like exists with asc desc primary key foreign references default constraint index view begin commit rollback grant revoke top fetch next only rows over partition'.split(' '))

function scan(text, re, kindOf) {
  const parts = []
  re.lastIndex = 0
  let last = 0
  let match
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) })
    const token = match[0]
    const kind = kindOf(token, match.index)
    parts.push(kind ? { kind, text: token } : { text: token })
    last = match.index + token.length
    if (!token.length) re.lastIndex++
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

function tokenizeJson(text) {
  const keys = new Set()
  const keyRe = /"(?:\\u[0-9a-fA-F]{4}|\\.|[^"\\])*"(?=\s*:)/g
  let match
  while ((match = keyRe.exec(text))) keys.add(match.index)
  return scan(text, jsonRe, (token, index) => {
    if (token.startsWith('"') || token.startsWith("'")) return keys.has(index) ? 'key' : 'string'
    if (token.startsWith('/')) return 'comment'
    if (token === 'true' || token === 'false' || token === 'null') return 'bool'
    return 'number'
  })
}

function classifyYaml(token) {
  const trimmed = token.trim()
  if (trimmed.startsWith('#')) return 'comment'
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) return 'string'
  if (trimmed.endsWith(':')) return 'key'
  if (/^(?:true|false|null|yes|no|on|off)$/i.test(trimmed)) return 'bool'
  return 'number'
}

function classifyXml(token) {
  if (token.startsWith('<!--') || token.startsWith('<?')) return 'comment'
  if (token.startsWith('<![CDATA[')) return 'string'
  if (token.startsWith('<') || token === '>' || token === '/>') return 'tag'
  if (token.startsWith('"') || token.startsWith("'")) return 'string'
  return ''
}

function classifySql(token) {
  if (token.startsWith('--') || token.startsWith('/*')) return 'comment'
  if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) return 'string'
  if (sqlWords.has(token.toLowerCase())) return 'keyword'
  if (/^\d/.test(token)) return 'number'
  return ''
}

const scanners = {
  json: tokenizeJson,
  yaml: text => scan(text, yamlRe, classifyYaml),
  xml: text => scan(text, xmlRe, classifyXml),
  html: text => scan(text, xmlRe, classifyXml),
  sql: text => scan(text, sqlRe, classifySql),
}

export function findRanges(text, query) {
  if (!query) return []
  const hay = text.toLowerCase()
  const needle = query.toLowerCase()
  const ranges = []
  let index = 0
  while (ranges.length < 500) {
    const at = hay.indexOf(needle, index)
    if (at < 0) break
    ranges.push({ start: at, end: at + needle.length })
    index = at + Math.max(needle.length, 1)
  }
  return ranges
}

function splitMarks(parts, ranges, active) {
  const out = []
  let pos = 0
  let markIndex = 0
  for (const part of parts) {
    const end = pos + part.text.length
    let cursor = pos
    let local = 0
    while (markIndex < ranges.length && ranges[markIndex].end <= pos) markIndex++
    let look = markIndex
    while (look < ranges.length && ranges[look].start < end) {
      const mark = ranges[look]
      const from = Math.max(mark.start, cursor)
      const to = Math.min(mark.end, end)
      if (from > cursor) {
        out.push({ kind: part.kind, text: part.text.slice(local, local + (from - cursor)) })
        local += from - cursor
        cursor = from
      }
      if (to > cursor) {
        out.push({ kind: part.kind, find: true, current: look === active, text: part.text.slice(local, local + (to - cursor)) })
        local += to - cursor
        cursor = to
      }
      if (mark.end <= end) look++
      else break
    }
    markIndex = look
    if (cursor < end) out.push({ kind: part.kind, text: part.text.slice(local) })
    pos = end
  }
  return out.filter(part => part.text)
}

export function paint(text, language, ranges = [], active = 0) {
  if (!language && !ranges.length) return null
  const base = scanners[language] ? scanners[language](text) : [{ text }]
  if (!ranges.length) return base
  return splitMarks(base.length ? base : [{ text }], ranges, Math.min(active, ranges.length - 1))
}
