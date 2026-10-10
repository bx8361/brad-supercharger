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

export function findPattern(query, { caseSensitive = false, wholeWord = false, regex = false } = {}) {
  if (!query) return null
  let source = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (wholeWord) source = `\\b(?:${source})\\b`
  return new RegExp(source, caseSensitive ? 'gm' : 'gim')
}

export function findRanges(text, query, options) {
  let re
  try { re = findPattern(query, options) } catch { return [] }
  if (!re) return []
  const ranges = []
  let match
  while ((match = re.exec(text)) && ranges.length < 500) {
    ranges.push({ start: match.index, end: match.index + match[0].length })
    if (re.lastIndex === match.index) re.lastIndex++
  }
  return ranges
}

function substitute(replacement, match, groups, named, offset, text) {
  return replacement.replace(/\$\$|\$&|\$`|\$'|\$<([^>]*)>|\$(\d{1,2})/g, (token, name, num) => {
    if (token === '$$') return '$'
    if (token === '$&') return match
    if (token === '$`') return text.slice(0, offset)
    if (token === "$'") return text.slice(offset + match.length)
    if (name != null) return named?.[name] ?? ''
    let n = Number(num)
    if (n > groups.length && num.length === 2) {
      const first = Number(num[0])
      if (first > 0 && first <= groups.length) return (groups[first - 1] ?? '') + num[1]
    }
    if (n > 0 && n <= groups.length) return groups[n - 1] ?? ''
    return token
  })
}

export function replaceRanges(text, query, replacement, options = {}, index) {
  let re
  try { re = findPattern(query, options) } catch { return text }
  if (!re) return text
  const literal = !options.regex
  const one = index != null
  if (!one && !literal) return text.replace(re, replacement)
  let n = 0
  return text.replace(re, (...args) => {
    const match = args[0]
    if (one && n++ !== index) return match
    if (literal) return replacement
    const named = args.at(-1) && typeof args.at(-1) === 'object' ? args.at(-1) : undefined
    const string = named ? args.at(-2) : args.at(-1)
    const offset = named ? args.at(-3) : args.at(-2)
    const groups = args.slice(1, named ? -3 : -2)
    return substitute(replacement, match, groups, named, offset, string)
  })
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
