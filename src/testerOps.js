import { JSONPath } from 'jsonpath-plus'
import { validateXML } from 'xmllint-wasm'

export function queryJsonPath(json, jsonPath) {
  const path = jsonPath?.trim()
  if (!path) return { ok: true, output: '', error: '' }
  if (!json?.trim()) return { ok: true, output: '', error: '' }
  try {
    const data = JSON.parse(json)
    const tokens = JSONPath({ path, json: data, wrap: true })
    const result = tokens === false || tokens == null ? [] : tokens
    return { ok: true, output: JSON.stringify(result, null, 2), error: '' }
  } catch (e) {
    return { ok: false, output: '', error: e.message }
  }
}

export async function validateXmlAgainstXsd(xsd, xml) {
  const schema = xsd?.trim()
  const document = xml?.trim()
  if (!schema || !document) {
    return { severity: 'info', message: 'Enter an XSD schema and XML document to validate.' }
  }
  try {
    const result = await validateXML({
      xml: [{ fileName: 'document.xml', contents: document }],
      schema: [schema],
    })
    if (result.valid) {
      return { severity: 'success', message: 'XML is valid against the schema.' }
    }
    const message = result.errors.map(err => err.message).join('\n').trim()
    return { severity: 'error', message: message || 'XML is not valid against the schema.' }
  } catch (e) {
    return { severity: 'error', message: e.message }
  }
}

export function buildRegexFlags({ allMatches = true, ignoreCase = false, multiline = false, dotAll = false, singleline = false, unicode = false, sticky = false } = {}) {
  const flags = []
  if (allMatches !== false && allMatches !== 'false') flags.push('g')
  if (ignoreCase === true || ignoreCase === 'true') flags.push('i')
  if (multiline === true || multiline === 'true') flags.push('m')
  if (dotAll === true || dotAll === 'true' || singleline === true || singleline === 'true') flags.push('s')
  if (unicode === true || unicode === 'true') flags.push('u')
  if (sticky === true || sticky === 'true') flags.push('y')
  return [...new Set(flags)].join('')
}

// .NET IgnorePatternWhitespace: drop unescaped whitespace and # comments outside character classes.
// ponytail: also drops spaces inside {n,m}; .NET keeps them and still parses the quantifier.
export function applyIgnorePatternWhitespace(pattern) {
  let out = ''
  let inClass = false
  let escape = false
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (escape) { out += char; escape = false; continue }
    if (char === '\\') { out += char; escape = true; continue }
    if (inClass) {
      if (char === ']') inClass = false
      out += char
      continue
    }
    if (char === '[') { inClass = true; out += char; continue }
    if (char === '#') {
      while (i + 1 < pattern.length && pattern[i + 1] !== '\n') i++
      continue
    }
    if (/\s/.test(char)) continue
    out += char
  }
  return out
}

// ponytail: one JavaScript RegExp runs every flavor. Syntax, anchors, names, and
// replacement strings follow the flavor; unsupported constructs error instead of guessing.
// Unicode \w and \d inside [] stay JavaScript. Right-to-left returns the rightmost match.
export const regexFlavors = [
  ['javascript', 'JavaScript'],
  ['python', 'Python'],
  ['go', 'Go'],
  ['java', 'Java'],
  ['dotnet', '.NET 10.0 (C#)'],
  ['rust', 'Rust'],
]

const flavorRules = {
  javascript: { lookaround: true, backref: true, namedP: false, namedAngle: true, namedQuote: false, freeSpace: false, comment: false, anchors: {} },
  python: { lookaround: true, backref: true, namedP: true, namedAngle: false, namedQuote: false, freeSpace: true, comment: true, anchors: { A: 'start', Z: 'end', z: false } },
  go: { lookaround: false, backref: false, namedP: true, namedAngle: false, namedQuote: false, freeSpace: false, comment: false, anchors: { A: 'start', Z: false, z: 'end' } },
  java: { lookaround: true, backref: true, namedP: false, namedAngle: true, namedQuote: false, freeSpace: true, comment: true, anchors: { A: 'start', Z: 'end-nl', z: 'end' } },
  dotnet: { lookaround: true, backref: true, namedP: false, namedAngle: true, namedQuote: true, freeSpace: true, comment: true, anchors: { A: 'start', Z: 'end-nl', z: 'end' } },
  rust: { lookaround: false, backref: false, namedP: true, namedAngle: false, namedQuote: false, freeSpace: true, comment: false, anchors: { A: 'start', Z: false, z: 'end' } },
}

const flavorLabel = Object.fromEntries(regexFlavors)
const anchorSource = { start: '(?<![\\s\\S])', end: '(?![\\s\\S])', 'end-nl': '(?=\\n?(?![\\s\\S]))' }
const anchorWhy = {
  A: 'the start of the text, even when Multiline is on',
  Z: 'the end of the text',
  z: 'the end of the text',
}

export function regexControls(flavor) {
  const rows = [
    ['allMatches', 'All matches', 'Find every match, or stop after the first'],
    ['ignoreCase', 'Ignore case', 'Case-insensitive matching'],
    ['multiline', 'Multiline', '^ and $ match at the start and end of each line'],
    ['singleline', 'Singleline', 'Dot matches line breaks'],
  ]
  if (flavorRules[flavor]?.freeSpace) rows.splice(2, 0, ['ignoreWhitespace', 'Ignore whitespace', 'Ignore spaces and # comments in the pattern'])
  if (flavor === 'javascript') rows.push(['unicode', 'Unicode', 'Stricter escapes and \\p{…} properties'])
  if (flavor === 'java') rows.push(['unicode', 'Unicode classes', '\\d and \\w match Unicode letters and digits'])
  if (flavor === 'dotnet') rows.push(['rightToLeft', 'Right to left', 'Prefer the rightmost match'])
  return rows
}

const helpBase = [
  ['.', 'Any character except a newline, unless Singleline is on'],
  ['^ $', 'Start and end. With Multiline, also each line'],
  ['* + ? {n,m}', 'Repeat. A following ? prefers fewer characters'],
  ['a|b', 'Either side'],
  ['(…)', 'Capturing group, numbered from 1'],
  ['(?:…)', 'Group without a number'],
]

const helpFlavor = {
  javascript: [
    ['\\d \\w \\s', 'Digit, word, whitespace. Capitals invert them. \\w is ASCII'],
    ['(?<name>…)', 'Named group. \\k<name> repeats it'],
    ['$1 $<name> $& $$', 'Replace: group, name, whole match, a dollar sign'],
  ],
  python: [
    ['\\d \\w', 'Unicode digits and letters outside [ ]. Inside [ ], they follow JavaScript'],
    ['(?P<name>…)', 'Named group. (?P=name) repeats it'],
    ['\\A \\Z', 'Start and end of the whole text'],
    ['\\1 \\g<name> \\g<0>', 'Replace: group, name, whole match. \\\\ is a backslash'],
  ],
  go: [
    ['\\d \\w', 'ASCII. Lookahead, lookbehind, and backreferences are errors'],
    ['(?P<name>…)', 'Named group'],
    ['\\A \\z', 'Start and end of the whole text'],
    ['$0 $1 ${name} $$', 'Replace: whole match, group, name, a dollar sign'],
  ],
  java: [
    ['\\d \\w', 'ASCII, unless Unicode classes is on'],
    ['(?<name>…)', 'Named group. \\k<name> repeats it'],
    ['\\A \\z \\Z', '\\Z also matches before a final newline'],
    ['$1 ${name} \\$', 'Replace. There is no $0. A dollar sign is \\$'],
  ],
  dotnet: [
    ['\\d \\w', 'Unicode digits and letters outside [ ]. Inside [ ], they follow JavaScript'],
    ["(?<name>…) or (?'name'…)", 'Named group'],
    ['\\A \\z \\Z', '\\Z also matches before a final newline'],
    ['$1 ${name} $& $$', 'Replace: group, name, whole match, a dollar sign'],
  ],
  rust: [
    ['\\d \\w', 'Unicode digits and letters outside [ ]. No lookaround or backreferences'],
    ['(?P<name>…)', 'Named group'],
    ['\\A \\z', 'Start and end of the whole text'],
    ['$0 $1 ${name} $$', 'Replace: whole match, group, name, a dollar sign'],
  ],
}

export function regexHelp(flavor) {
  return [...helpBase, ...(helpFlavor[flavor] || helpFlavor.javascript)]
}

function on(value, fallback = false) {
  if (value == null) return fallback
  return value === true || value === 'true'
}

function formatRegexError(pattern, message, index) {
  if (index == null || index < 0 || index > pattern.length) return message
  const lineStart = pattern.lastIndexOf('\n', Math.max(0, index - 1)) + 1
  const lineEndBreak = pattern.indexOf('\n', index)
  const line = pattern.slice(lineStart, lineEndBreak < 0 ? pattern.length : lineEndBreak)
  const col = index - lineStart
  const lineNo = pattern.slice(0, index).split('\n').length
  return `${message}\nLine ${lineNo}, character ${col + 1}:\n${line}\n${' '.repeat(col)}^`
}

function fail(message, index) {
  return { error: message, index }
}

function readName(pattern, i, endChar) {
  const end = pattern.indexOf(endChar, i)
  if (end < 0) return fail(`Unclosed group name. Expected ${endChar}.`, i)
  const name = pattern.slice(i, end)
  if (name.includes('-')) return fail('Balancing groups are not supported in this tester.', i)
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return fail('A group name must start with a letter or underscore, then letters, digits, or underscores.', i)
  return { name, next: end + 1 }
}

function readQuantifier(pattern, i, freeSpace) {
  if ('*+?'.includes(pattern[i])) {
    let next = i + 1
    let lazy = false
    let possessive = false
    if (pattern[next] === '?') { lazy = true; next++ }
    else if (pattern[next] === '+') { possessive = true; next++ }
    return { emit: pattern.slice(i, i + 1) + (lazy ? '?' : ''), next, possessive }
  }
  if (pattern[i] !== '{') return null
  let j = i + 1
  const skip = () => { if (freeSpace) while (pattern[j] === ' ' || pattern[j] === '\t') j++ }
  skip()
  const start = j
  while (pattern[j] >= '0' && pattern[j] <= '9') j++
  if (j === start) return null
  const min = Number(pattern.slice(start, j))
  skip()
  let max = null
  let comma = false
  if (pattern[j] === ',') {
    comma = true
    j++
    skip()
    const maxStart = j
    while (pattern[j] >= '0' && pattern[j] <= '9') j++
    if (j > maxStart) max = Number(pattern.slice(maxStart, j))
    skip()
  }
  if (pattern[j] !== '}') {
    if (pattern.slice(i).includes('}')) return null
    return fail('Unclosed { quantifier. It needs a closing }.', i)
  }
  if (max != null && min > max) return fail(`Quantifier {${min},${max}} is backwards. The first number must be less than or equal to the second.`, i)
  const body = comma ? (max == null ? `{${min},}` : `{${min},${max}}`) : `{${min}}`
  j++
  let lazy = false
  let possessive = false
  if (pattern[j] === '?') { lazy = true; j++ }
  else if (pattern[j] === '+') { possessive = true; j++ }
  return { emit: body + (lazy ? '?' : ''), next: j, possessive }
}

function namedHint(rules) {
  if (rules.namedP) return '(?P<name>…)'
  if (rules.namedQuote) return '(?<name>…) or (?\'name\'…)'
  return '(?<name>…)'
}

function parseGroup(pattern, i, rules, label) {
  const rest = pattern.slice(i)
  if (rest.startsWith('(?:')) return { kind: 'open', emit: '(?:', next: i + 3 }
  if (rest.startsWith('(?=') || rest.startsWith('(?!')) {
    if (!rules.lookaround) return fail(`${label} does not support lookahead.`, i)
    return { kind: 'open', emit: rest.slice(0, 3), next: i + 3 }
  }
  if (rest.startsWith('(?<=') || rest.startsWith('(?<!')) {
    if (!rules.lookaround) return fail(`${label} does not support lookbehind.`, i)
    return { kind: 'open', emit: rest.startsWith('(?<=') ? '(?<=' : '(?<!', next: i + 4 }
  }
  if (rest.startsWith('(?>')) return fail('Atomic groups (?>…) are not supported in this tester.', i)
  if (rest.startsWith('(?#')) {
    if (!rules.comment) return fail('Inline comments (?#…) are not part of this flavor.', i)
    const end = pattern.indexOf(')', i + 3)
    if (end < 0) return fail('Unclosed (?# comment. It needs a closing ).', i)
    return { kind: 'skip', emit: '', next: end + 1 }
  }
  if (rest.startsWith('(?(')) return fail('Conditional groups (?(…)…) are not supported in this tester.', i)
  if (rest.startsWith('(?P<')) {
    if (!rules.namedP) return fail(`${label} named groups are written ${namedHint(rules)}.`, i)
    const name = readName(pattern, i + 4, '>')
    if (name.error) return name
    return { kind: 'open', emit: `(?<${name.name}>`, next: name.next }
  }
  if (rest.startsWith('(?P=')) {
    if (!rules.namedP || !rules.backref) return fail(`${label} does not support backreferences.`, i)
    const name = readName(pattern, i + 4, ')')
    if (name.error) return name
    return { kind: 'atom', emit: `\\k<${name.name}>`, next: name.next }
  }
  if (rest.startsWith('(?<')) {
    if (!rules.namedAngle) return fail(`${label} named groups are written ${namedHint(rules)}.`, i)
    const name = readName(pattern, i + 3, '>')
    if (name.error) return name
    return { kind: 'open', emit: `(?<${name.name}>`, next: name.next }
  }
  if (rest.startsWith("(?'")) {
    if (!rules.namedQuote) return fail(`${label} named groups are written ${namedHint(rules)}.`, i)
    const name = readName(pattern, i + 3, "'")
    if (name.error) return name
    return { kind: 'open', emit: `(?<${name.name}>`, next: name.next }
  }
  if (rest.startsWith('(?')) {
    let j = i + 2
    const start = j
    while (j < pattern.length && /[a-zA-Z-]/.test(pattern[j])) j++
    const flags = pattern.slice(start, j)
    if (pattern[j] !== ')' && pattern[j] !== ':') return fail('Invalid group. Expected ) or : after the flags.', i)
    const bad = flags.match(/[^ims-]/)?.[0]
    if (bad) {
      const why = bad === 'U' ? 'Ungreedy (?U) is not applied here. Put ? after a quantifier instead.'
        : bad === 'x' ? 'Inline free-spacing (?x) is not applied here. Turn on Ignore whitespace.'
        : `Inline flag (?${bad}) is not applied here.`
      return fail(why, i)
    }
    if (!flags.replace(/-/g, '')) return fail('Empty inline flags.', i)
    return { kind: pattern[j] === ':' ? 'open' : 'flags', emit: pattern.slice(i, j + 1), next: j + 1 }
  }
  return { kind: 'open', emit: '(', next: i + 1 }
}

function compilePattern(pattern, flavor, input) {
  const rules = flavorRules[flavor] || flavorRules.javascript
  const label = flavorLabel[flavor] || 'JavaScript'
  const freeSpace = rules.freeSpace && on(input.ignoreWhitespace)
  const widen = flavor === 'python' || flavor === 'rust' || flavor === 'dotnet' || (flavor === 'java' && on(input.unicode))
  let source = ''
  let needsUnicode = flavor === 'javascript' && on(input.unicode)
  const opens = []
  let atom = false
  let inClass = false
  let classStart = 0

  const pushAtom = text => { source += text; atom = true }
  const quantifierError = index => fail('Nothing to repeat. *, +, ?, or {n} needs an expression before it.', index)

  for (let i = 0; i < pattern.length;) {
    const char = pattern[i]
    if (!inClass && freeSpace) {
      if (char === '#') {
        i++
        while (i < pattern.length && pattern[i] !== '\n') i++
        continue
      }
      if (/\s/.test(char)) { i++; continue }
    }
    if (char === '\\') {
      const next = pattern[i + 1]
      if (next == null) return fail('Trailing \\. An escape needs a character after it.', i)
      if (next === 'Q' && flavor === 'java') {
        const end = pattern.indexOf('\\E', i + 2)
        const body = pattern.slice(i + 2, end < 0 ? pattern.length : end)
        const quoted = body.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (inClass) source += quoted
        else pushAtom(quoted)
        i = end < 0 ? pattern.length : end + 2
        continue
      }
      if (!inClass && (next === 'A' || next === 'Z' || next === 'z')) {
        const kind = rules.anchors[next]
        if (!kind) {
          const use = next === 'Z' && rules.anchors.z ? '\\z' : flavor === 'javascript' ? '^ or $' : '\\A or \\z'
          return fail(`${label} has no \\${next} for ${anchorWhy[next]}. Use ${use}.`, i)
        }
        pushAtom(anchorSource[kind])
        i += 2
        continue
      }
      if (!inClass && next === 'k') {
        if (!rules.backref) return fail(`${label} does not support backreferences.`, i)
        const quote = pattern[i + 2]
        const endChar = quote === '<' ? '>' : quote === "'" ? "'" : ''
        if (!endChar || (quote === "'" && !rules.namedQuote)) return fail('A named backreference looks like \\k<name>.', i)
        const name = readName(pattern, i + 3, endChar)
        if (name.error) return name
        pushAtom(`\\k<${name.name}>`)
        i = name.next
        continue
      }
      if (!inClass && next >= '1' && next <= '9') {
        if (!rules.backref) return fail(`${label} does not support backreferences like \\${next}.`, i)
        let j = i + 1
        while (pattern[j] >= '0' && pattern[j] <= '9') j++
        pushAtom(pattern.slice(i, j))
        i = j
        continue
      }
      if (!inClass && widen && 'wdWD'.includes(next)) {
        const wide = { w: '(?:[\\p{L}\\p{N}_])', W: '[^\\p{L}\\p{N}_]', d: '\\p{Nd}', D: '\\P{Nd}' }
        needsUnicode = true
        pushAtom(wide[next])
        i += 2
        continue
      }
      if (inClass) source += '\\' + next
      else pushAtom('\\' + next)
      i += 2
      continue
    }
    if (char === '[') {
      if (inClass && flavor === 'dotnet' && pattern[i - 1] === '-') return fail('Character-class subtraction ([a-z-[aeiou]]) is not supported in this tester.', i)
      inClass = true
      classStart = i
      atom = false
      source += '['
      i++
      if (pattern[i] === '^') { source += '^'; i++ }
      if (pattern[i] === ']') { source += ']'; i++ }
      continue
    }
    if (inClass) {
      if (char === '&' && flavor === 'java' && pattern[i + 1] === '&') return fail('Character-class intersection (&&) is not supported in this tester.', i)
      if (char === ']') { inClass = false; atom = true }
      source += char
      i++
      continue
    }
    if (char === '(') {
      const group = parseGroup(pattern, i, rules, label)
      if (group.error) return group
      if (group.kind === 'open') { opens.push(i); atom = false }
      source += group.emit
      if (group.kind === 'atom') atom = true
      i = group.next
      continue
    }
    if (char === ')') {
      if (!opens.length) return fail('Unmatched ). There is no ( left open.', i)
      opens.pop()
      source += ')'
      atom = true
      i++
      continue
    }
    if (char === '|') { source += '|'; atom = false; i++; continue }
    if ('*+?{'.includes(char)) {
      const quant = readQuantifier(pattern, i, freeSpace)
      if (quant?.error) return quant
      if (quant) {
        if (!atom) return quantifierError(i)
        if (quant.possessive) {
          return fail(flavor === 'java'
            ? 'Possessive quantifiers (*+, ++, ?+, {n}+) are not run by this tester. Drop the extra +.'
            : 'This + is not a possessive quantifier in this flavor. Remove it, or add something for it to repeat.', i)
        }
        source += quant.emit
        atom = false
        i = quant.next
        continue
      }
    }
    source += char
    atom = true
    i++
  }
  if (inClass) return fail('Unclosed [. A character class needs a closing ].', classStart)
  if (opens.length) return fail('Unclosed (. A group needs a closing ).', opens[opens.length - 1])
  const flags = ['g']
  if (on(input.ignoreCase)) flags.push('i')
  if (on(input.multiline)) flags.push('m')
  if (on(input.singleline) || on(input.dotAll)) flags.push('s')
  if (needsUnicode) flags.push('u')
  return { source, flags: flags.join('') }
}

function engineError(message) {
  const known = [
    ['Unterminated group', 'A ( is missing its closing ).'],
    ['Unterminated character class', 'A [ is missing its closing ].'],
    ['Nothing to repeat', 'A quantifier needs an expression before it.'],
    ['Invalid escape', 'This escape is not valid in Unicode mode.'],
    ['Unmatched )', 'A ) has no opening (.'],
    ['Invalid group', 'This group is not valid.'],
    ['Incomplete quantifier', 'This { quantifier is incomplete.'],
    ['numbers out of order', 'A {n,m} quantifier has the minimum greater than the maximum.'],
  ]
  return known.find(([part]) => message.includes(part))?.[1] || message.replace(/^Invalid regular expression:[\s\S]*?: /, '')
}

function expandJs(template, match, text) {
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match.text.length)
  let out = ''
  for (let i = 0; i < template.length; i++) {
    if (template[i] !== '$') { out += template[i]; continue }
    const next = template[i + 1]
    if (next === '$') { out += '$'; i++; continue }
    if (next === '&') { out += match.text; i++; continue }
    if (next === '`') { out += before; i++; continue }
    if (next === "'") { out += after; i++; continue }
    if (next === '<') {
      const end = template.indexOf('>', i + 2)
      if (end < 0) return fail('Unclosed $<name>. It needs a closing >.', i)
      const name = template.slice(i + 2, end)
      if (!Object.hasOwn(match.named, name)) return fail(`There is no group named "${name}".`, i)
      out += match.named[name] ?? ''
      i = end
      continue
    }
    if (next >= '0' && next <= '9') {
      let j = i + 1
      let num = ''
      while (j < template.length && template[j] >= '0' && template[j] <= '9') {
        const longer = num + template[j]
        if (Number(longer) === 0 || Number(longer) > match.groups.length) break
        num = longer
        j++
      }
      if (!num) { out += '$'; continue }
      out += match.groups[Number(num) - 1] ?? ''
      i = j - 1
      continue
    }
    out += '$'
  }
  return { text: out }
}

function groupValue(match, token, index) {
  if (!/^\d+$/.test(token)) {
    if (!Object.hasOwn(match.named, token)) return fail(`There is no group named "${token}".`, index)
    return { text: match.named[token] ?? '' }
  }
  const n = Number(token)
  if (n === 0) return { text: match.text }
  if (n > match.groups.length) return fail(`There is no group ${n}.`, index)
  return { text: match.groups[n - 1] ?? '' }
}

function expandPython(template, match) {
  let out = ''
  for (let i = 0; i < template.length; i++) {
    if (template[i] !== '\\') { out += template[i]; continue }
    const next = template[i + 1]
    if (next == null) return fail('Trailing \\ in the replacement.', i)
    if (next === '\\') { out += '\\'; i++; continue }
    if (next === 'n') { out += '\n'; i++; continue }
    if (next === 't') { out += '\t'; i++; continue }
    if (next === 'r') { out += '\r'; i++; continue }
    if (next === 'g' && template[i + 2] === '<') {
      const end = template.indexOf('>', i + 3)
      if (end < 0) return fail('Unclosed \\g<…>. It needs a closing >.', i)
      const value = groupValue(match, template.slice(i + 3, end), i)
      if (value.error) return value
      out += value.text
      i = end
      continue
    }
    if (next >= '1' && next <= '9') {
      let j = i + 1
      let num = ''
      while (j < template.length && template[j] >= '0' && template[j] <= '9') num += template[j++]
      if (Number(num) > match.groups.length) return fail(`There is no group ${num}.`, i)
      out += match.groups[Number(num) - 1] ?? ''
      i = j - 1
      continue
    }
    return fail(`Unknown replacement escape \\${next}. Use \\\\ for a backslash.`, i)
  }
  return { text: out }
}

function expandDollar(template, match, { zero, bare, java }) {
  let out = ''
  for (let i = 0; i < template.length; i++) {
    const char = template[i]
    if (java && char === '\\') {
      const next = template[i + 1]
      if (next == null) return fail('Trailing \\ in the replacement.', i)
      out += next
      i++
      continue
    }
    if (char !== '$') { out += char; continue }
    const next = template[i + 1]
    if (next == null) {
      if (java) return fail('A $ in a Java replacement must start a group, like $1 or ${name}.', i)
      out += '$'
      continue
    }
    if (next === '$' && !java) { out += '$'; i++; continue }
    if (next === '{') {
      const end = template.indexOf('}', i + 2)
      if (end < 0) return fail('Unclosed ${…}. It needs a closing }.', i)
      const value = groupValue(match, template.slice(i + 2, end), i)
      if (value.error) return value
      if (java && template.slice(i + 2, end) === '0') return fail('Java replacements have no group 0. Capture the whole pattern and use $1.', i)
      out += value.text
      i = end
      continue
    }
    if (next >= '0' && next <= '9') {
      let j = i + 1
      let num = ''
      while (j < template.length && template[j] >= '0' && template[j] <= '9') num += template[j++]
      const n = Number(num)
      if (n === 0) {
        if (!zero) return fail('Java replacements have no group 0. Capture the whole pattern and use $1.', i)
        out += match.text
      } else if (n > match.groups.length) {
        return fail(`There is no group ${n}.`, i)
      } else out += match.groups[n - 1] ?? ''
      i = j - 1
      continue
    }
    if (bare && /[A-Za-z_]/.test(next)) {
      let j = i + 1
      while (j < template.length && /[A-Za-z0-9_]/.test(template[j])) j++
      const name = template.slice(i + 1, j)
      if (!Object.hasOwn(match.named, name)) return fail(`There is no group named "${name}".`, i)
      out += match.named[name] ?? ''
      i = j - 1
      continue
    }
    if (java) return fail('A $ in a Java replacement must start a group, like $1 or ${name}. Escape a dollar with \\$.', i)
    out += '$'
  }
  return { text: out }
}

function expandDotnet(template, match, text) {
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match.text.length)
  let out = ''
  for (let i = 0; i < template.length; i++) {
    if (template[i] !== '$') { out += template[i]; continue }
    const next = template[i + 1]
    if (next === '$') { out += '$'; i++; continue }
    if (next === '&') { out += match.text; i++; continue }
    if (next === '`') { out += before; i++; continue }
    if (next === "'") { out += after; i++; continue }
    if (next === '_') { out += text; i++; continue }
    if (next === '+') {
      const last = [...match.groups].reverse().find(group => group != null)
      out += last ?? ''
      i++
      continue
    }
    if (next === '{') {
      const end = template.indexOf('}', i + 2)
      if (end < 0) return fail('Unclosed ${…}. It needs a closing }.', i)
      const value = groupValue(match, template.slice(i + 2, end), i)
      if (value.error) return value
      out += value.text
      i = end
      continue
    }
    if (next >= '0' && next <= '9') {
      let j = i + 1
      let num = ''
      while (j < template.length && template[j] >= '0' && template[j] <= '9' && Number(num + template[j]) <= match.groups.length) {
        num += template[j++]
      }
      if (!num) { out += '$'; continue }
      if (Number(num) === 0) { out += match.text; i = j - 1; continue }
      out += match.groups[Number(num) - 1] ?? ''
      i = j - 1
      continue
    }
    out += '$'
  }
  return { text: out }
}

function expandTemplate(template, flavor, match, text) {
  if (flavor === 'python') return expandPython(template, match)
  if (flavor === 'javascript') return expandJs(template, match, text)
  if (flavor === 'java') return expandDollar(template, match, { zero: false, bare: false, java: true })
  if (flavor === 'dotnet') return expandDotnet(template, match, text)
  return expandDollar(template, match, { zero: true, bare: true, java: false })
}

function applyMatches(text, matches, template, flavor, mode) {
  if (mode === 'extraction') {
    const lines = []
    for (const match of matches) {
      const piece = template ? expandTemplate(template, flavor, match, text) : { text: match.text }
      if (piece.error) return piece
      lines.push(piece.text)
    }
    return { text: lines.join('\n') }
  }
  let out = ''
  let cursor = 0
  for (let n = 0; n < matches.length; n++) {
    const match = matches[n]
    if (match.index < cursor) continue
    out += text.slice(cursor, match.index)
    const piece = expandTemplate(template, flavor, match, text)
    if (piece.error) return piece
    out += piece.text
    cursor = match.index + match.text.length
    if (match.text.length === 0 && n < matches.length - 1 && cursor < text.length) {
      out += text[cursor]
      cursor++
    }
  }
  return { text: out + text.slice(cursor) }
}

export function runRegex(input = {}) {
  const flavor = flavorLabel[input.flavor] ? input.flavor : 'javascript'
  const pattern = input.pattern ?? ''
  const text = input.text ?? ''
  const mode = input.mode === 'substitution' || input.mode === 'extraction' ? input.mode : 'match'
  if (!pattern) return { matches: [], output: mode === 'match' ? '' : text, error: '' }
  const compiled = compilePattern(pattern, flavor, input)
  if (compiled.error) return { matches: [], output: '', error: formatRegexError(pattern, compiled.error, compiled.index) }
  let expression
  try {
    expression = new RegExp(compiled.source, compiled.flags)
  } catch (e) {
    return { matches: [], output: '', error: engineError(e.message) }
  }
  const found = []
  for (const match of text.matchAll(expression)) {
    found.push({ index: match.index, text: match[0], groups: Array.from(match).slice(1), named: { ...(match.groups || {}) } })
    if (found.length >= 500) break
  }
  const rightToLeft = flavor === 'dotnet' && on(input.rightToLeft)
  const limited = !on(input.allMatches, true)
    ? [rightToLeft ? found[found.length - 1] : found[0]].filter(Boolean)
    : found
  const matches = rightToLeft ? [...limited].reverse() : limited
  if (mode === 'match') return { matches, output: '', error: '' }
  const applied = applyMatches(text, limited, input.template ?? '', flavor, mode)
  if (applied.error) return { matches, output: '', error: formatRegexError(input.template ?? '', applied.error, applied.index) }
  return { matches, output: applied.text, error: '' }
}
