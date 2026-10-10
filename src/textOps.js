import { diffArrays, diffLines, diffWordsWithSpace } from 'diff'

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

function compareActive(opts) {
  return !!(opts?.lead || opts?.trail || opts?.embedded || opts?.ignoreCase || opts?.ignoreNewlines)
}

function isWs(ch) { return /\s/.test(ch) }

// Spaces only (U+0020). Tabs stay, matching EmEditor's leading / trailing / embedded spaces.
function bodyKey(line, opts) {
  let first = -1, last = -1
  for (let i = 0; i < line.length; i++) if (!isWs(line[i])) { if (first < 0) first = i; last = i }
  if (first < 0) return opts.lead || opts.trail ? '' : (opts.ignoreCase ? line.toLowerCase() : line)
  let out = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === ' ' && ((opts.lead && i < first) || (opts.trail && i > last) || (opts.embedded && i > first && i < last))) continue
    out += opts.ignoreCase ? ch.toLowerCase() : ch
  }
  return out
}

function lineTokens(text, opts) {
  const src = opts.ignoreNewlines ? text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : text
  if (src === '') return []
  const ended = src.endsWith('\n')
  const lines = src.split('\n')
  if (ended) lines.pop()
  return lines.map((line, i) => {
    const nl = i < lines.length - 1 || ended
    const key = bodyKey(line, opts) + (opts.ignoreNewlines ? '' : (nl ? '\n' : ''))
    return { line, key, value: nl ? line + '\n' : line }
  })
}

function tokensOf(text) {
  if (!text) return []
  return diffWordsWithSpace(text, text, { oneChangePerToken: true }).map(part => part.value)
}

function markTokens(raw, opts) {
  const tokens = []
  for (const text of raw) {
    if (/^\s+$/.test(text) && text.includes(' ') && /[^ ]/.test(text) && !text.includes('\n')) {
      for (const part of text.match(/ +|[^ ]+/g)) tokens.push({ text: part })
    } else tokens.push({ text })
  }
  for (const token of tokens) {
    token.ignored = opts.ignoreNewlines && (token.text === '\n' || token.text === '\r\n')
    token.key = opts.ignoreCase ? token.text.toLowerCase() : token.text
  }
  let start = 0
  const flush = end => {
    let first = -1, last = -1
    for (let i = start; i < end; i++) if (!/^\s+$/.test(tokens[i].text)) { if (first < 0) first = i; last = i }
    for (let i = start; i < end; i++) {
      const token = tokens[i]
      if (!/^ +$/.test(token.text)) continue
      token.ignored = first < 0 ? !!(opts.lead || opts.trail) : !!((opts.lead && i < first) || (opts.trail && i > last) || (opts.embedded && i > first && i < last))
    }
    start = end + 1
  }
  tokens.forEach((token, i) => { if (token.text === '\n' || token.text === '\r\n') flush(i) })
  flush(tokens.length)
  return tokens
}

function paintTokens(tokens, kinds) {
  const spans = []
  let visible = 0
  for (const token of tokens) {
    const kind = token.ignored ? 'same' : kinds[visible++]
    const last = spans.at(-1)
    if (last?.kind === kind) last.text += token.text
    else spans.push({ text: token.text, kind })
  }
  return spans.length ? spans : [{ text: '', kind: 'same' }]
}

function wordSpans(left, right, opts) {
  const lt = markTokens(tokensOf(left), opts), rt = markTokens(tokensOf(right), opts)
  const lv = lt.filter(token => !token.ignored), rv = rt.filter(token => !token.ignored)
  const lk = new Array(lv.length), rk = new Array(rv.length)
  let li = 0, ri = 0
  for (const part of diffArrays(lv.map(token => token.key), rv.map(token => token.key))) {
    if (!part.added && !part.removed) for (let n = 0; n < part.count; n++) { lk[li++] = 'same'; rk[ri++] = 'same' }
    else if (part.removed) for (let n = 0; n < part.count; n++) lk[li++] = 'remove'
    else for (let n = 0; n < part.count; n++) rk[ri++] = 'add'
  }
  return [paintTokens(lt, lk), paintTokens(rt, rk)]
}

function pushPart(parts, value, added, removed, count = 1) {
  if (!value) return
  const last = parts.at(-1)
  if (last && !!last.added === added && !!last.removed === removed) { last.value += value; last.count += count }
  else parts.push({ value, added, removed, count })
}

function spanText(spans) { return (spans || []).map(span => span.text).join('') }

function emitWordRow(parts, row) {
  const left = row.left || [], right = row.right || []
  let li = 0, ri = 0
  while (li < left.length || ri < right.length) {
    const l = left[li], r = right[ri]
    if (l?.kind === 'same' && r?.kind === 'same') { pushPart(parts, r.text, false, false); li++; ri++ }
    else if (l?.kind === 'remove') { pushPart(parts, l.text, false, true); li++ }
    else if (r?.kind === 'add') { pushPart(parts, r.text, true, false); ri++ }
    else if (l?.kind === 'same') { pushPart(parts, l.text, false, false); li++ }
    else if (r) { pushPart(parts, r.text, r.kind === 'add', false); ri++ }
    else { li++; ri++ }
  }
}

function wordInline(left, right, opts) {
  const rows = sideBySideOpt(left, right, 'words', opts)
  const srcL = opts.ignoreNewlines ? left.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : left
  const srcR = opts.ignoreNewlines ? right.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : right
  const ended = srcL.endsWith('\n') || srcR.endsWith('\n')
  const parts = []
  rows.forEach((row, i) => {
    const nl = i < rows.length - 1 || ended ? '\n' : ''
    if (!row.left) pushPart(parts, spanText(row.right) + nl, true, false)
    else if (!row.right) pushPart(parts, spanText(row.left) + nl, false, true)
    else if (row.kind === 'same') pushPart(parts, spanText(row.right) + nl, false, false)
    else { emitWordRow(parts, row); pushPart(parts, nl, false, false) }
  })
  return parts
}

function lineChangeParts(left, right, opts) {
  const L = lineTokens(left, opts), R = lineTokens(right, opts)
  const parts = []
  let li = 0, ri = 0
  for (const part of diffArrays(L.map(token => token.key), R.map(token => token.key))) {
    if (!part.added && !part.removed) {
      let value = ''
      for (let n = 0; n < part.count; n++, li++, ri++) value += R[ri].value
      pushPart(parts, value, false, false, part.count)
    } else if (part.removed) {
      let value = ''
      for (let n = 0; n < part.count; n++, li++) value += L[li].value
      pushPart(parts, value, false, true, part.count)
    } else {
      let value = ''
      for (let n = 0; n < part.count; n++, ri++) value += R[ri].value
      pushPart(parts, value, true, false, part.count)
    }
  }
  return parts
}

export function compareChangeParts(left, right, mode = 'words', opts = {}) {
  if (!compareActive(opts)) return mode === 'lines' ? diffLines(left, right) : diffWordsWithSpace(left, right)
  return mode === 'lines' ? lineChangeParts(left, right, opts) : wordInline(left, right, opts)
}

function pairOptRows(leftLines, rightLines, mode, opts, rows) {
  const n = Math.max(leftLines.length, rightLines.length)
  for (let i = 0; i < n; i++) {
    const l = leftLines[i], r = rightLines[i]
    if (l && r && (mode === 'words' || l.key === r.key)) {
      if (mode === 'words' && l.key !== r.key) {
        const [lp, rp] = wordSpans(l.line, r.line, opts)
        rows.push({ kind: 'change', left: lp, right: rp })
      } else rows.push({ kind: 'same', left: lineParts(l.line, 'same'), right: lineParts(r.line, 'same') })
    } else if (l && r) rows.push({ kind: 'change', left: lineParts(l.line, 'remove'), right: lineParts(r.line, 'add') })
    else if (l) rows.push({ kind: 'remove', left: lineParts(l.line, 'remove'), right: null })
    else rows.push({ kind: 'add', left: null, right: lineParts(r.line, 'add') })
  }
}

function sideBySideOpt(left, right, mode, opts) {
  const L = lineTokens(left, opts), R = lineTokens(right, opts)
  const parts = diffArrays(L.map(token => token.key), R.map(token => token.key))
  const rows = []
  let li = 0, ri = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i], next = parts[i + 1]
    if (!part.added && !part.removed) { pairOptRows(L.slice(li, li + part.count), R.slice(ri, ri + part.count), mode, opts, rows); li += part.count; ri += part.count }
    else if (part.removed && next?.added) { pairOptRows(L.slice(li, li + part.count), R.slice(ri, ri + next.count), mode, opts, rows); li += part.count; ri += next.count; i++ }
    else if (part.removed) { pairOptRows(L.slice(li, li + part.count), [], mode, opts, rows); li += part.count }
    else { pairOptRows([], R.slice(ri, ri + part.count), mode, opts, rows); ri += part.count }
  }
  return rows
}

export function sideBySideRows(left, right, mode = 'words', opts = {}) {
  if (compareActive(opts)) return sideBySideOpt(left, right, mode, opts)
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
