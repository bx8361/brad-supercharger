function bounds(text, start, end) {
  let to = end
  if (to > start && text[to - 1] === '\n') to -= 1
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  let lineEnd = text.indexOf('\n', to)
  if (lineEnd < 0) lineEnd = text.length
  return { lineStart, lineEnd }
}

function mapCol(col, oldPrefix, newPrefix) {
  if (col < oldPrefix) return Math.min(col, newPrefix)
  return col + newPrefix - oldPrefix
}

function mapLines(text, start, end, edit) {
  const { lineStart, lineEnd } = bounds(text, start, end)
  const lines = text.slice(lineStart, lineEnd).split('\n')
  const next = lines.map(edit)
  const joined = next.map(row => row.line).join('\n')
  const shift = pos => {
    if (pos < lineStart) return pos
    if (pos > lineEnd) return pos + joined.length - (lineEnd - lineStart)
    let at = lineStart
    let out = lineStart
    for (let i = 0; i < lines.length; i++) {
      const oldEnd = at + lines[i].length
      if (pos <= oldEnd) return out + mapCol(pos - at, next[i].oldPrefix, next[i].newPrefix)
      at = oldEnd + 1
      out += next[i].line.length + 1
    }
    return out
  }
  return {
    text: text.slice(0, lineStart) + joined + text.slice(lineEnd),
    start: shift(start),
    end: shift(end),
  }
}

export function indentLines(text, start, end, unit, outdent) {
  return mapLines(text, start, end, line => {
    if (!outdent) return { line: unit + line, oldPrefix: 0, newPrefix: unit.length }
    let cut = 0
    if (line.startsWith(unit)) cut = unit.length
    else if (line.startsWith('\t')) cut = 1
    else cut = Math.min((line.match(/^ */)?.[0] ?? '').length, unit.length)
    return { line: line.slice(cut), oldPrefix: cut, newPrefix: 0 }
  })
}

export function toggleLineComments(text, start, end, mark = '#') {
  const { lineStart, lineEnd } = bounds(text, start, end)
  const lines = text.slice(lineStart, lineEnd).split('\n')
  const commented = new RegExp(`^\\s*${mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ?`)
  const targets = lines.filter(line => line.trim())
  const on = targets.length > 0 && targets.every(line => commented.test(line))
  const single = lines.length === 1
  return mapLines(text, start, end, line => {
    if (!line.trim()) {
      if (single && !on) return { line: `${mark} `, oldPrefix: 0, newPrefix: mark.length + 1 }
      return { line, oldPrefix: 0, newPrefix: 0 }
    }
    if (on) {
      const matched = line.match(commented)
      const lead = (line.match(/^\s*/)?.[0] ?? '').length
      return { line: line.slice(0, lead) + line.slice(matched[0].length), oldPrefix: matched[0].length, newPrefix: lead }
    }
    const lead = (line.match(/^\s*/)?.[0] ?? '').length
    return { line: `${line.slice(0, lead)}${mark} ${line.slice(lead)}`, oldPrefix: lead, newPrefix: lead + mark.length + 1 }
  })
}
