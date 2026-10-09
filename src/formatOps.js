import { format } from 'sql-formatter'

function compareKeys(a, b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(compareKeys).map(key => [key, sortJson(value[key])]))
  }
  return value
}

export function formatJson(input, { mode = 'format', indent = '2', sort = false } = {}) {
  if (!String(input).trim()) return ''
  let value = JSON.parse(input)
  if (sort) value = sortJson(value)
  if (mode === 'minify') return JSON.stringify(value)
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent))
}

export const sqlLanguages = [
  ['sql', 'Standard SQL'],
  ['db2', 'Db2'],
  ['mariadb', 'MariaDB'],
  ['mysql', 'MySQL'],
  ['n1ql', 'N1QL'],
  ['plsql', 'PL/SQL'],
  ['postgresql', 'PostgreSQL'],
  ['redshift', 'Redshift'],
  ['spark', 'Spark'],
  ['transactsql', 'Transact-SQL'],
]

// ponytail: moves a trailing comma onto the next line. sql-formatter dropped commaPosition.
function toLeadingCommas(sql) {
  const lines = sql.split('\n')
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/,\s*$/.test(lines[i]) || !lines[i + 1].trim()) continue
    lines[i] = lines[i].replace(/,\s*$/, '')
    lines[i + 1] = lines[i + 1].replace(/^(\s*)/, '$1, ')
  }
  return lines.join('\n')
}

export function formatSql(input, { language = 'sql', indent = '2', leadingComma = false } = {}) {
  if (!String(input).trim()) return ''
  const formatted = format(input, {
    language,
    tabWidth: indent === '4' ? 4 : 2,
    useTabs: indent === 'tab',
    keywordCase: 'upper',
    linesBetweenQueries: 2,
  })
  return leadingComma ? toLeadingCommas(formatted) : formatted
}

function readStartTag(source, index) {
  let j = index + 1
  const nameStart = j
  while (j < source.length && /[\w:.-]/.test(source[j])) j++
  if (j === nameStart) throw new Error('Invalid XML tag')
  const name = source.slice(nameStart, j)
  const attrs = []
  while (j < source.length) {
    while (j < source.length && /\s/.test(source[j])) j++
    if (source.startsWith('/>', j)) return { name, attrs, selfClosing: true, end: j + 2 }
    if (source[j] === '>') return { name, attrs, selfClosing: false, end: j + 1 }
    const attrStart = j
    while (j < source.length && /[\w:.-]/.test(source[j])) j++
    if (j === attrStart) throw new Error('Invalid XML attribute')
    const attrName = source.slice(attrStart, j)
    while (j < source.length && /\s/.test(source[j])) j++
    if (source[j] !== '=') throw new Error('Invalid XML attribute')
    j++
    while (j < source.length && /\s/.test(source[j])) j++
    const quote = source[j]
    if (quote !== '"' && quote !== "'") throw new Error('Invalid XML attribute')
    j++
    const valueStart = j
    while (j < source.length && source[j] !== quote) j++
    if (j >= source.length) throw new Error('Unclosed attribute value')
    attrs.push({ name: attrName, value: source.slice(valueStart, j), quote })
    j++
  }
  throw new Error('Unclosed tag')
}

function scanDeclaration(source, index) {
  let j = index
  let depth = 0
  while (j < source.length) {
    if (source[j] === '[') depth++
    else if (source[j] === ']') depth = Math.max(0, depth - 1)
    else if (source[j] === '>' && depth === 0) return j + 1
    j++
  }
  throw new Error('Unclosed declaration')
}

function parseXml(source) {
  let i = 0
  function parseNodes(stop) {
    const list = []
    while (i < source.length) {
      if (source[i] !== '<') {
        const start = i
        while (i < source.length && source[i] !== '<') i++
        const text = source.slice(start, i)
        if (text.trim()) list.push({ type: 'text', text })
        continue
      }
      if (source.startsWith('<!--', i)) {
        const end = source.indexOf('-->', i + 4)
        if (end < 0) throw new Error('Unclosed comment')
        list.push({ type: 'comment', text: source.slice(i, end + 3) })
        i = end + 3
        continue
      }
      if (source.startsWith('<![CDATA[', i)) {
        const end = source.indexOf(']]>', i + 9)
        if (end < 0) throw new Error('Unclosed CDATA')
        list.push({ type: 'cdata', text: source.slice(i, end + 3) })
        i = end + 3
        continue
      }
      if (source.startsWith('<?', i)) {
        const end = source.indexOf('?>', i + 2)
        if (end < 0) throw new Error('Unclosed processing instruction')
        list.push({ type: 'pi', text: source.slice(i, end + 2) })
        i = end + 2
        continue
      }
      if (source.startsWith('<!', i)) {
        const end = scanDeclaration(source, i)
        list.push({ type: 'doctype', text: source.slice(i, end) })
        i = end
        continue
      }
      if (source.startsWith('</', i)) {
        const end = source.indexOf('>', i)
        if (end < 0) throw new Error('Unclosed end tag')
        const name = source.slice(i + 2, end).trim()
        if (!stop) throw new Error('Unexpected end tag')
        if (name !== stop) throw new Error(`Expected </${stop}>, found </${name}>`)
        i = end + 1
        return list
      }
      const tag = readStartTag(source, i)
      i = tag.end
      list.push({
        type: 'el', name: tag.name, attrs: tag.attrs,
        children: tag.selfClosing ? [] : parseNodes(tag.name),
      })
    }
    if (stop) throw new Error(`Unclosed <${stop}>`)
    return list
  }
  const nodes = parseNodes(null)
  if (nodes.filter(node => node.type === 'el').length !== 1) throw new Error('XML document must have a single root element.')
  return nodes
}

function writeElement(el, depth, unit, newlineOnAttributes, minify, lines) {
  const pad = minify ? '' : unit.repeat(depth)
  const nl = minify ? '' : '\n'
  let open = `${pad}<${el.name}`
  for (const attr of el.attrs) {
    const rendered = `${attr.name}=${attr.quote}${attr.value}${attr.quote}`
    open += newlineOnAttributes ? `${nl}${pad}${unit}${rendered}` : ` ${rendered}`
  }
  const kids = el.children
  if (!kids.length) {
    lines.push(`${open}${minify ? '/>' : ' />'}`)
    return
  }
  const complex = kids.some(kid => kid.type !== 'text' && kid.type !== 'cdata')
  if (!complex) {
    lines.push(`${open}>${kids.map(kid => kid.text).join('')}</${el.name}>`)
    return
  }
  lines.push(`${open}>`)
  for (const kid of kids) {
    if (kid.type === 'el') writeElement(kid, depth + 1, unit, newlineOnAttributes, minify, lines)
    else lines.push(`${pad}${unit}${kid.text.trim()}`)
  }
  lines.push(`${pad}</${el.name}>`)
}

export function formatXml(input, { indent = '2', newlineOnAttributes = false } = {}) {
  if (!String(input).trim()) return ''
  const nodes = parseXml(String(input))
  const minify = indent === 'minify'
  const unit = indent === 'tab' ? '\t' : indent === '4' ? '    ' : '  '
  const lines = []
  for (const node of nodes) {
    if (node.type === 'el') writeElement(node, 0, unit, !minify && newlineOnAttributes, minify, lines)
    else lines.push(node.text.trim())
  }
  return lines.join(minify ? '' : '\n')
}
