import { diffLines, diffWordsWithSpace } from 'diff'

const xmlEsc = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

function splitDiffLines(value) {
  const lines = value.split(/\r?\n/)
  if (lines.length > 1 && lines.at(-1) === '') lines.pop()
  return lines
}

function wordParts(left, right) {
  const l = [], r = []
  for (const part of diffWordsWithSpace(left, right)) {
    if (part.added) r.push({ text: part.value, kind: 'add' })
    else if (part.removed) l.push({ text: part.value, kind: 'remove' })
    else { l.push({ text: part.value, kind: 'same' }); r.push({ text: part.value, kind: 'same' }) }
  }
  return [l, r]
}

function lineParts(text, kind) {
  if (text == null) return null
  return [{ text, kind }]
}

export function sideBySideRows(left, right, mode = 'words') {
  const parts = diffLines(left, right)
  const rows = []
  const pushPair = (a, b) => {
    const n = Math.max(a.length, b.length)
    for (let i = 0; i < n; i++) {
      const l = a[i], r = b[i]
      if (l != null && r != null && (mode === 'words' || l === r)) {
        const [lp, rp] = mode === 'words' && l !== r ? wordParts(l, r) : [lineParts(l, 'same'), lineParts(r, 'same')]
        rows.push({ kind: l === r ? 'same' : 'change', left: lp, right: rp })
      } else if (l != null && r != null) rows.push({ kind: 'change', left: lineParts(l, 'remove'), right: lineParts(r, 'add') })
      else if (l != null) rows.push({ kind: 'remove', left: lineParts(l, 'remove'), right: null })
      else rows.push({ kind: 'add', left: null, right: lineParts(r, 'add') })
    }
  }
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i], next = parts[i + 1]
    if (!part.added && !part.removed) pushPair(splitDiffLines(part.value), splitDiffLines(part.value))
    else if (part.removed && next?.added) { pushPair(splitDiffLines(part.value), splitDiffLines(next.value)); i++ }
    else if (part.removed) pushPair(splitDiffLines(part.value), [])
    else pushPair([], splitDiffLines(part.value))
  }
  return rows
}

export function escapeString(text, format = 'json') {
  if (format === 'xml') return text.replace(/[&<>"']/g, ch => xmlEsc[ch])
  return JSON.stringify(text).slice(1, -1)
}

export function unescapeString(text, format = 'json') {
  if (format === 'xml') return text.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
  return JSON.parse(`"${text}"`)
}

export function compareLists(left, right, mode = 'both', ignoreCase = false) {
  const key = s => ignoreCase ? s.toLocaleLowerCase() : s
  const a = left.split(/\r?\n/).filter(s => s.length)
  const b = right.split(/\r?\n/).filter(s => s.length)
  const inA = new Set(a.map(key)), inB = new Set(b.map(key))
  const once = (lines, keep) => {
    const seen = new Set()
    return lines.filter(s => {
      const k = key(s)
      if (seen.has(k) || !keep(k)) return false
      seen.add(k)
      return true
    })
  }
  if (mode === 'a') return once(a, k => !inB.has(k))
  if (mode === 'b') return once(b, k => !inA.has(k))
  if (mode === 'union') return once([...a, ...b], () => true)
  return once(a, k => inB.has(k))
}

function nl(text) { return text.includes('\r\n') ? '\r\n' : '\n' }
function pieces(text) {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean)
}
function cap(word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() }
function joinLines(text, lines) { return lines.join(nl(text)) }

export function toLF(text) { return text.replace(/\r\n?/g, '\n') }
export function toCRLF(text) { return toLF(text).replace(/\n/g, '\r\n') }
export function toSentence(text) { return text.toLowerCase().replace(/(^\s*\p{L})|([.!?]\s+\p{L})/gu, ch => ch.toUpperCase()) }
export function toTitle(text) { return text.toLowerCase().replace(/(^|\s)\p{L}/gu, ch => ch.toUpperCase()) }
export function toCamel(text) { return pieces(text).map((w, i) => i ? cap(w) : w.toLowerCase()).join('') }
export function toPascal(text) { return pieces(text).map(cap).join('') }
export function toSnake(text) { return pieces(text).map(w => w.toLowerCase()).join('_') }
export function toConstant(text) { return pieces(text).map(w => w.toUpperCase()).join('_') }
export function toKebab(text) { return pieces(text).map(w => w.toLowerCase()).join('-') }
export function toCobol(text) { return pieces(text).map(w => w.toUpperCase()).join('-') }
export function toTrain(text) { return pieces(text).map(cap).join('-') }
export function toAlternating(text) { let i = 0; return [...text].map(ch => /\p{L}/u.test(ch) ? ((i++ % 2) ? ch.toLowerCase() : ch.toUpperCase()) : ch).join('') }
export function toInverse(text) { return [...text].map(ch => ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()).join('') }
export function toRandomCase(text) { return [...text].map(ch => Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase()).join('') }
export function trimLines(text) { return joinLines(text, text.split(/\r?\n/).map(line => line.trim())) }
export function sortLines(text, dir = 1) { return joinLines(text, text.split(/\r?\n/).sort((a, b) => a.localeCompare(b) * dir)) }
export function sortByLast(text, dir = 1) {
  const last = line => line.trim().split(/\s+/).pop() || ''
  return joinLines(text, text.split(/\r?\n/).sort((a, b) => last(a).localeCompare(last(b)) * dir))
}
export function reverseLines(text) { return joinLines(text, text.split(/\r?\n/).reverse()) }
export function shuffleLines(text) { const lines = text.split(/\r?\n/); for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]] } return joinLines(text, lines) }
export function uniqueLines(text) { return joinLines(text, [...new Set(text.split(/\r?\n/))]) }

export function lineEnding(text) {
  let crlf = 0, lf = 0, cr = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r') { if (text[i + 1] === '\n') { crlf++; i++ } else cr++ }
    else if (text[i] === '\n') lf++
  }
  const kinds = [crlf && 'CRLF', lf && 'LF', cr && 'CR'].filter(Boolean)
  return kinds.length > 1 ? 'Mixed' : kinds[0] || '—'
}

function tally(items) {
  const counts = new Map()
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
}

export function analyze(text) {
  const words = text.trim() ? text.trim().split(/\s+/u) : []
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}_']+/gu) || []
  const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+/g)?.length || 1) : 0
  return {
    characters: text.length,
    bytes: new TextEncoder().encode(text).length,
    words: words.length,
    unique: new Set(tokens).size,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    sentences,
    paragraphs: text.trim() ? text.split(/\n\s*\n/).filter(part => part.trim()).length : 0,
    lineBreaks: lineEnding(text),
    wordFreq: tally(tokens),
    charFreq: tally([...text].filter(ch => ch !== '\r')),
  }
}

export function caretInfo(text, start, end) {
  const before = text.slice(0, start)
  const line = before ? before.split(/\r\n|\r|\n/).length : 1
  const col = start - Math.max(before.lastIndexOf('\n'), before.lastIndexOf('\r'))
  return { length: Math.max(0, end - start), line, column: before ? col : 1 }
}
