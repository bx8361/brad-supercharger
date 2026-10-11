// ponytail: fold identity is the JSON path. A key containing "." can collide; use index paths if that shows up.

const PAIRS = { '{': '}', '[': ']' }

function lineStartsOf(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1)
  return starts
}

function lineAt(starts, index) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= index) lo = mid
    else hi = mid - 1
  }
  return lo
}

export function jsonFolds(text) {
  const starts = lineStartsOf(text)
  const lineEnd = line => line + 1 < starts.length ? starts[line + 1] : text.length
  const folds = []
  const stack = []
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === '"' || c === "'") {
      const quote = c
      i++
      let raw = ''
      while (i < text.length) {
        if (text[i] === '\\') { raw += text[i + 1] || ''; i += 2; continue }
        if (text[i] === quote) { i++; break }
        raw += text[i++]
      }
      let j = i
      while (j < text.length && (text[j] === ' ' || text[j] === '\t' || text[j] === '\r' || text[j] === '\n')) j++
      if (text[j] === ':') {
        const parent = stack.at(-1)
        if (parent?.kind === '{') parent.pendingKey = raw
      }
      continue
    }
    if (c === '/' && text[i + 1] === '/') {
      i += 2
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i = Math.min(text.length, i + 2)
      continue
    }
    if (c === '{' || c === '[') {
      const parent = stack.at(-1)
      const path = !parent ? '$' : parent.kind === '[' ? `${parent.path}[${parent.next++}]` : `${parent.path}.${parent.pendingKey || '?'}`
      if (parent?.kind === '{') parent.pendingKey = ''
      stack.push({ kind: c, path, openIndex: i, next: 0, pendingKey: '' })
      i++
      continue
    }
    if ((c === '}' || c === ']') && stack.at(-1) && PAIRS[stack.at(-1).kind] === c) {
      const open = stack.pop()
      const openLine = lineAt(starts, open.openIndex)
      const closeLine = lineAt(starts, i)
      const hideFrom = lineEnd(openLine)
      const hideTo = lineEnd(closeLine)
      if (hideTo > hideFrom) folds.push({ path: open.path, openLine, closeLine, hideFrom, hideTo })
      i++
      continue
    }
    i++
  }
  return folds
}

export function activeFolds(regions, collapsed) {
  const chosen = regions.filter(region => collapsed.has(region.path))
  return chosen
    .filter(region => !chosen.some(outer => outer !== region && outer.hideFrom <= region.hideFrom && region.hideTo <= outer.hideTo))
    .sort((a, b) => a.hideFrom - b.hideFrom)
}

export function hideFolds(text, folds) {
  if (!folds.length) return text
  let out = ''
  let cursor = 0
  for (const fold of folds) {
    out += text.slice(cursor, fold.hideFrom)
    cursor = fold.hideTo
  }
  return out + text.slice(cursor)
}

export function visibleLines(text, regions, folds) {
  const byLine = new Map(regions.map(region => [region.openLine, region]))
  const lines = text.split('\n')
  const out = []
  let index = 0
  let foldIndex = 0
  for (let line = 0; line < lines.length; line++) {
    while (foldIndex < folds.length && index >= folds[foldIndex].hideTo) foldIndex++
    const fold = folds[foldIndex]
    const hidden = fold && index >= fold.hideFrom && index < fold.hideTo
    if (!hidden) {
      const region = byLine.get(line) || null
      out.push({ line, path: region?.path || '', folded: !!(region && folds.some(item => item.path === region.path)) })
    }
    index += lines[line].length + 1
  }
  return out
}

export function revealFold(collapsed, regions, range) {
  if (!range) return collapsed
  let next = collapsed
  for (const region of regions) {
    if (range.start < region.hideTo && range.end > region.hideFrom && next.has(region.path)) {
      if (next === collapsed) next = new Set(collapsed)
      next.delete(region.path)
    }
  }
  return next
}

export function mapViewToSource(pos, folds) {
  let hidden = 0
  for (const fold of folds) {
    if (pos < fold.hideFrom - hidden) return pos + hidden
    hidden += fold.hideTo - fold.hideFrom
  }
  return pos + hidden
}

export function mapViewSpan(start, end, folds) {
  let srcStart = mapViewToSource(start, folds)
  let srcEnd = mapViewToSource(end, folds)
  let hidden = 0
  for (const fold of folds) {
    const at = fold.hideFrom - hidden
    const spans = start < at && end > at
    if (!spans) {
      if (end <= at && srcEnd > fold.hideFrom && srcStart < fold.hideTo) srcEnd = fold.hideFrom
      if (start >= at && srcStart < fold.hideTo && srcEnd > fold.hideFrom) srcStart = fold.hideTo
    }
    hidden += fold.hideTo - fold.hideFrom
  }
  if (srcEnd < srcStart) srcEnd = srcStart
  return { srcStart, srcEnd }
}

export function mapRange(range, folds) {
  let hidden = 0
  for (const fold of folds) {
    if (range.end <= fold.hideFrom) break
    if (range.start >= fold.hideTo) { hidden += fold.hideTo - fold.hideFrom; continue }
    return null
  }
  return { start: range.start - hidden, end: range.end - hidden }
}

function diffEnds(prev, next) {
  let start = 0
  while (start < prev.length && start < next.length && prev[start] === next[start]) start++
  let prevEnd = prev.length
  let nextEnd = next.length
  while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) { prevEnd--; nextEnd-- }
  return { start, prevEnd, nextEnd }
}

export function applyViewEdit(source, folds, prevView, nextView) {
  if (prevView === nextView || !folds.length) return source
  const { start, prevEnd, nextEnd } = diffEnds(prevView, nextView)
  const insert = nextView.slice(start, nextEnd)
  if (start === 0 && prevEnd === prevView.length) return insert
  const { srcStart, srcEnd } = mapViewSpan(start, prevEnd, folds)
  return source.slice(0, srcStart) + insert + source.slice(srcEnd)
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b]
  return a
}

export function indentUnit(text) {
  let g = 0
  let tab = false
  let space = false
  for (const line of text.split('\n')) {
    const lead = line.match(/^[ \t]*/)[0]
    if (!lead) continue
    if (lead.includes('\t')) tab = true
    if (lead.includes(' ')) space = true
    if (/^ +$/.test(lead)) g = g ? gcd(g, lead.length) : lead.length
  }
  if (tab && !space) return '\t'
  return g && g % 4 === 0 ? '    ' : '  '
}

function charAt(text, i) {
  const code = text.charCodeAt(i)
  return code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length ? 2 : 1
}

function measureWidth(text, widthOf) {
  let used = 0
  const tab = widthOf(' ') * 2
  for (let i = 0; i < text.length;) {
    const size = charAt(text, i)
    const ch = text.slice(i, i + size)
    used += ch === '\t' ? tab - (used % tab) : widthOf(ch)
    i += size
  }
  return used
}

function takePixels(text, start, budget, widthOf) {
  let used = 0
  let i = start
  const tab = widthOf(' ') * 2
  while (i < text.length) {
    const size = charAt(text, i)
    const ch = text.slice(i, i + size)
    const width = ch === '\t' ? tab - (used % tab) : widthOf(ch)
    if (used + width > budget && i > start) break
    used += width
    i += size
  }
  return i
}

// ponytail: widthOf is the editor font. A fullwidth glyph costs more than "e", same as VS Code.
export function wrapIndent(text, maxWidth, widthOf = () => 1) {
  const lines = text.split('\n')
  if (!maxWidth || maxWidth < 2) return { text, rows: lines.map(() => 1), synthetics: [] }
  const rows = []
  const synthetics = []
  let out = ''
  for (let li = 0; li < lines.length; li++) {
    if (li) out += '\n'
    const line = lines[li]
    const lead = line.match(/^[ \t]*/)[0]
    const leadWidth = measureWidth(lead, widthOf)
    const keep = leadWidth > 0 && leadWidth < maxWidth
    const chunks = breakIndent(line, keep ? lead : '', keep ? leadWidth : 0, maxWidth, widthOf)
    rows.push(chunks.length)
    out += chunks[0]
    for (let c = 1; c < chunks.length; c++) {
      const gap = 1 + (keep ? lead.length : 0)
      synthetics.push({ start: out.length, end: out.length + gap })
      out += '\n' + chunks[c]
    }
  }
  return { text: out, rows, synthetics }
}

function breakIndent(line, lead, leadWidth, maxWidth, widthOf) {
  if (measureWidth(line, widthOf) <= maxWidth) return [line]
  const room = Math.max(widthOf(' ') || 1, maxWidth - leadWidth)
  const chunks = []
  let i = takePixels(line, 0, maxWidth, widthOf)
  chunks.push(line.slice(0, i))
  while (i < line.length) {
    const next = takePixels(line, i, room, widthOf)
    chunks.push(lead + line.slice(i, next))
    if (next === i) break
    i = next
  }
  return chunks
}

export function displayToView(pos, synthetics) {
  let hidden = 0
  for (const span of synthetics) {
    if (pos <= span.start) return pos - hidden
    if (pos < span.end) return span.start - hidden
    hidden += span.end - span.start
  }
  return pos - hidden
}

export function viewToDisplay(pos, synthetics) {
  let extra = 0
  for (const span of synthetics) {
    if (pos <= span.start - extra) return pos + extra
    extra += span.end - span.start
  }
  return pos + extra
}

export function applyDisplayEdit(view, synthetics, prevDisplay, nextDisplay) {
  if (prevDisplay === nextDisplay) return view
  if (!synthetics.length) return nextDisplay
  const { start, prevEnd, nextEnd } = diffEnds(prevDisplay, nextDisplay)
  const srcStart = displayToView(start, synthetics)
  const srcEnd = displayToView(prevEnd, synthetics)
  return view.slice(0, srcStart) + nextDisplay.slice(start, nextEnd) + view.slice(srcEnd)
}

export function indentPieces(lead, unit) {
  const pieces = []
  if (!lead || !unit) return pieces
  if (unit === '\t') {
    let level = 0
    for (const ch of lead) pieces.push(ch === '\t' ? { level: level++, text: ch } : { text: ch })
    return pieces
  }
  const size = unit.length
  let i = 0
  let level = 0
  while (i + size <= lead.length && lead[i] === ' ') {
    pieces.push({ level: level++, text: lead.slice(i, i + size) })
    i += size
  }
  if (i < lead.length) pieces.push({ text: lead.slice(i) })
  return pieces
}
