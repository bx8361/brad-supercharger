// Expression language and function set modeled on SpeedCrunch (GPL-2.0-or-later reference).

const PI = 3.14159265358979323846264338327950288419716939937511
const E = 2.71828182845904523536028747135266249775724709369996
const PHI = 1.61803398874989484820458683436563811772030917980576
const EULER_GAMMA = 0.57721566490153286060651209008240243104215933593992

const BUILTIN_VARS = {
  pi: PI,
  π: PI,
  e: E,
  phi: PHI,
  φ: PHI,
  gamma: EULER_GAMMA,
  γ: EULER_GAMMA,
  c: 299792458,
  h: 6.62607015e-34,
  k: 1.380649e-23,
  g: 9.80665,
  gn: 9.80665,
  na: 6.02214076e23,
  avogadro: 6.02214076e23,
  r: 8.314462618,
  alpha: 7.2973525643e-3,
  e0: 8.8541878188e-12,
  mu0: 1.25663706127e-6,
  g0: 6.67430e-11,
}

export const angleUnits = [
  { id: 'd', label: 'Degrees' },
  { id: 'r', label: 'Radians' },
  { id: 'g', label: 'Gradians' },
  { id: 't', label: 'Turns' },
]

export const resultFormats = [
  { id: 'g', label: 'General' },
  { id: 'f', label: 'Fixed' },
  { id: 'e', label: 'Scientific' },
  { id: 'n', label: 'Engineering' },
  { id: 'b', label: 'Binary' },
  { id: 'o', label: 'Octal' },
  { id: 'h', label: 'Hexadecimal' },
  { id: 's', label: 'Sexagesimal' },
]

export const calculatorFunctionCatalog = [
  { id: 'sin', usage: 'x', domain: 'Trigonometry' },
  { id: 'cos', usage: 'x', domain: 'Trigonometry' },
  { id: 'tan', usage: 'x', domain: 'Trigonometry' },
  { id: 'cot', usage: 'x', domain: 'Trigonometry' },
  { id: 'sec', usage: 'x', domain: 'Trigonometry' },
  { id: 'csc', usage: 'x', domain: 'Trigonometry' },
  { id: 'arcsin', usage: 'x', domain: 'Trigonometry' },
  { id: 'arccos', usage: 'x', domain: 'Trigonometry' },
  { id: 'arctan', usage: 'x', domain: 'Trigonometry' },
  { id: 'arctan2', usage: 'y; x', domain: 'Trigonometry' },
  { id: 'sinh', usage: 'x', domain: 'Trigonometry' },
  { id: 'cosh', usage: 'x', domain: 'Trigonometry' },
  { id: 'tanh', usage: 'x', domain: 'Trigonometry' },
  { id: 'sqrt', usage: 'x', domain: 'Arithmetic' },
  { id: 'cbrt', usage: 'x', domain: 'Arithmetic' },
  { id: 'abs', usage: 'x', domain: 'Arithmetic' },
  { id: 'sgn', usage: 'x', domain: 'Arithmetic' },
  { id: 'floor', usage: 'x', domain: 'Arithmetic' },
  { id: 'ceil', usage: 'x', domain: 'Arithmetic' },
  { id: 'trunc', usage: 'x', domain: 'Arithmetic' },
  { id: 'frac', usage: 'x', domain: 'Arithmetic' },
  { id: 'int', usage: 'x', domain: 'Arithmetic' },
  { id: 'ln', usage: 'x', domain: 'Exponential' },
  { id: 'log10', usage: 'x', domain: 'Exponential' },
  { id: 'log2', usage: 'x', domain: 'Exponential' },
  { id: 'log', usage: 'base; x', domain: 'Exponential' },
  { id: 'exp', usage: 'x', domain: 'Exponential' },
  { id: 'min', usage: 'x₁; x₂; …', domain: 'Aggregation' },
  { id: 'max', usage: 'x₁; x₂; …', domain: 'Aggregation' },
  { id: 'sum', usage: 'x₁; x₂; …', domain: 'Aggregation' },
  { id: 'mean', usage: 'x₁; x₂; …', domain: 'Statistics' },
  { id: 'average', usage: 'x₁; x₂; …', domain: 'Statistics' },
  { id: 'median', usage: 'x₁; x₂; …', domain: 'Statistics' },
  { id: 'gcd', usage: 'n₁; n₂; …', domain: 'Integer' },
  { id: 'lcm', usage: 'n₁; n₂; …', domain: 'Integer' },
  { id: 'ncr', usage: 'n; r', domain: 'Combinatorics' },
  { id: 'npr', usage: 'n; r', domain: 'Combinatorics' },
  { id: 'degrees', usage: 'x', domain: 'Angle' },
  { id: 'radians', usage: 'x', domain: 'Angle' },
  { id: 'gradians', usage: 'x', domain: 'Angle' },
  { id: 'round', usage: 'x [; precision]', domain: 'Formatting' },
  { id: 'rand', usage: '[digits]', domain: 'Random' },
  { id: 'randint', usage: 'max [; min]', domain: 'Random' },
]

export const calculatorConstantCatalog = [
  { id: 'pi', name: 'π', value: String(PI) },
  { id: 'e', name: "Euler's number", value: String(E) },
  { id: 'phi', name: 'φ (golden ratio)', value: String(PHI) },
  { id: 'gamma', name: 'γ (Euler–Mascheroni)', value: String(EULER_GAMMA) },
  { id: 'c', name: 'Speed of light in vacuum', value: '299792458' },
  { id: 'h', name: 'Planck constant', value: '6.62607015e-34' },
  { id: 'k', name: 'Boltzmann constant', value: '1.380649e-23' },
  { id: 'g', name: 'Standard gravity', value: '9.80665' },
  { id: 'na', name: 'Avogadro constant', value: '6.02214076e23' },
]

export function createCalculatorSession(overrides = {}) {
  return {
    ans: null,
    variables: new Map(),
    angleUnit: 'd',
    precision: 15,
    autoAns: true,
    ...overrides,
  }
}

export function stripCalculatorComment(expression) {
  let inString = false
  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i]
    if (ch === '"' || ch === "'") inString = !inString
    if (!inString && ch === '?') return { expression: expression.slice(0, i).trimEnd(), comment: expression.slice(i + 1).trim() }
  }
  return { expression, comment: '' }
}

export function normalizeCalculatorExpression(expression) {
  return expression
    .replace(/\u2212|\u2013/g, '-')
    .replace(/[\u00d7\u22c5\u2219\u2044\u00f7]/g, m => ({ '\u00d7': '*', '\u22c5': '*', '\u2219': '*', '\u2044': '/', '\u00f7': '/' }[m]))
    .replace(/\u03c0/g, 'pi')
    .replace(/\u03c6/g, 'phi')
    .replace(/\u03b3/g, 'gamma')
    .replace(/\*\*/g, '^')
}

function closeDelimiters(expression) {
  let depth = 0
  for (const ch of expression) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
  }
  return depth > 0 ? expression + ')'.repeat(depth) : expression
}

const FUNCTION_IDS = new Set(calculatorFunctionCatalog.map(f => f.id))
const FUNCTION_ALIASES = { ln: 'ln', log: 'log', arccos: 'arccos', arcsin: 'arcsin', arctan: 'arctan', arctan2: 'arctan2' }

export function autoFixCalculatorExpression(expression, { functions = FUNCTION_IDS } = {}) {
  const { expression: bare } = stripCalculatorComment(expression)
  let fixed = normalizeCalculatorExpression(bare.trim())
  if (!fixed) return fixed
  fixed = closeDelimiters(fixed)
  const idMatch = /^[A-Za-z_\u03c0\u03c6\u03b3][A-Za-z0-9_\u2080-\u209f\u1d62-\u1d6a]*/u.exec(fixed)
  if (idMatch && functions.has(idMatch[0].toLowerCase()) && !fixed.includes('(')) fixed += '(ans)'
  return fixed
}

function toAngleRad(value, angleUnit) {
  if (angleUnit === 'd') return value * (PI / 180)
  if (angleUnit === 'g') return value * (PI / 200)
  if (angleUnit === 't') return value * (2 * PI)
  return value
}

function fromAngleRad(value, angleUnit) {
  if (angleUnit === 'd') return value * (180 / PI)
  if (angleUnit === 'g') return value * (200 / PI)
  if (angleUnit === 't') return value / (2 * PI)
  return value
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('Factorial needs a non-negative integer.')
  if (n > 170) throw new Error('Factorial is too large for this engine.')
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function gcd2(a, b) {
  a = Math.abs(Math.trunc(a))
  b = Math.abs(Math.trunc(b))
  while (b) { const t = a % b; a = b; b = t }
  return a
}

function lcm2(a, b) {
  if (!a || !b) return 0
  return Math.abs(a * b) / gcd2(a, b)
}

function callFunction(name, args, session) {
  const id = (FUNCTION_ALIASES[name] || name).toLowerCase()
  const angle = session.angleUnit
  const unary = fn => {
    if (args.length !== 1) throw new Error(`Expected 1 argument for ${name}.`)
    return fn(args[0])
  }
  const variadic = fn => {
    if (!args.length) throw new Error(`Expected at least 1 argument for ${name}.`)
    return fn(args)
  }
  switch (id) {
    case 'sin': return unary(x => Math.sin(toAngleRad(x, angle)))
    case 'cos': return unary(x => Math.cos(toAngleRad(x, angle)))
    case 'tan': return unary(x => Math.tan(toAngleRad(x, angle)))
    case 'cot': return unary(x => 1 / Math.tan(toAngleRad(x, angle)))
    case 'sec': return unary(x => 1 / Math.cos(toAngleRad(x, angle)))
    case 'csc': return unary(x => 1 / Math.sin(toAngleRad(x, angle)))
    case 'arcsin': return unary(x => fromAngleRad(Math.asin(x), angle))
    case 'arccos': return unary(x => fromAngleRad(Math.acos(x), angle))
    case 'arctan': return unary(x => fromAngleRad(Math.atan(x), angle))
    case 'arctan2': {
      if (args.length !== 2) throw new Error('Expected 2 arguments for arctan2.')
      return fromAngleRad(Math.atan2(args[0], args[1]), angle)
    }
    case 'sinh': return unary(Math.sinh)
    case 'cosh': return unary(Math.cosh)
    case 'tanh': return unary(Math.tanh)
    case 'sqrt': return unary(x => Math.sqrt(x))
    case 'cbrt': return unary(x => Math.cbrt(x))
    case 'abs': return unary(Math.abs)
    case 'sgn': return unary(x => (x > 0 ? 1 : x < 0 ? -1 : 0))
    case 'floor': return unary(Math.floor)
    case 'ceil': return unary(Math.ceil)
    case 'trunc': return unary(Math.trunc)
    case 'frac': return unary(x => x - Math.trunc(x))
    case 'int': return unary(Math.trunc)
    case 'ln': return unary(Math.log)
    case 'log10': return unary(Math.log10)
    case 'log2': return unary(Math.log2)
    case 'log':
      if (args.length === 1) return Math.log10(args[0])
      if (args.length === 2) return Math.log(args[1]) / Math.log(args[0])
      throw new Error('Expected 1 or 2 arguments for log.')
    case 'exp': return unary(Math.exp)
    case 'min': return variadic(xs => Math.min(...xs))
    case 'max': return variadic(xs => Math.max(...xs))
    case 'sum': return variadic(xs => xs.reduce((a, b) => a + b, 0))
    case 'mean':
    case 'average': return variadic(xs => xs.reduce((a, b) => a + b, 0) / xs.length)
    case 'median': return variadic(xs => {
      const s = [...xs].sort((a, b) => a - b)
      const m = Math.floor(s.length / 2)
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
    })
    case 'gcd': return variadic(xs => xs.reduce((a, b) => gcd2(a, b)))
    case 'lcm': return variadic(xs => xs.reduce((a, b) => lcm2(a, b)))
    case 'ncr': {
      if (args.length !== 2) throw new Error('Expected 2 arguments for ncr.')
      const [n, r] = args.map(Math.trunc)
      if (r < 0 || n < r) throw new Error('Invalid n or r for ncr.')
      return factorial(n) / (factorial(r) * factorial(n - r))
    }
    case 'npr': {
      if (args.length !== 2) throw new Error('Expected 2 arguments for npr.')
      const [n, r] = args.map(Math.trunc)
      if (r < 0 || n < r) throw new Error('Invalid n or r for npr.')
      return factorial(n) / factorial(n - r)
    }
    case 'degrees': return unary(x => x * (180 / PI))
    case 'radians': return unary(x => x * (PI / 180))
    case 'gradians': return unary(x => x * (PI / 200))
    case 'round': {
      if (!args.length) throw new Error('Expected at least 1 argument for round.')
      const prec = args.length > 1 ? Math.trunc(args[1]) : 0
      const f = 10 ** prec
      return Math.round(args[0] * f) / f
    }
    case 'rand': {
      const digits = args.length ? Math.max(0, Math.min(15, Math.trunc(args[0]))) : 16
      if (!digits) return Math.random()
      let n = Math.random()
      while (n === 0) n = Math.random()
      return Math.floor(n * 10 ** digits) / 10 ** digits
    }
    case 'randint': {
      const max = Math.trunc(args[0])
      const min = args.length > 1 ? Math.trunc(args[1]) : 0
      const lo = Math.min(min, max)
      const hi = Math.max(min, max)
      return lo + Math.floor(Math.random() * (hi - lo + 1))
    }
    default:
      throw new Error(`Unknown function: ${name}`)
  }
}

class Parser {
  constructor(source, session) {
    this.source = source
    this.session = session
    this.pos = 0
  }

  peek() { return this.source[this.pos] ?? '' }
  next() { return this.source[this.pos++] ?? '' }
  eof() { return this.pos >= this.source.length }

  skipSpace() {
    while (!this.eof() && /\s/.test(this.peek())) this.next()
  }

  readNumber() {
    this.skipSpace()
    const start = this.pos
    if (this.peek() === '0' && /[xXbBoO]/.test(this.source[this.pos + 1] || '')) {
      const prefix = this.source[this.pos + 1].toLowerCase()
      this.pos += 2
      const base = { x: 16, b: 2, o: 8 }[prefix]
      let digits = ''
      while (!this.eof() && /[0-9A-Fa-f_]/.test(this.peek())) {
        if (this.peek() !== '_') digits += this.peek()
        this.next()
      }
      if (!digits) throw new Error('Expected digits after base prefix.')
      return parseInt(digits, base)
    }
    let text = ''
    while (!this.eof() && /[0-9_]/.test(this.peek())) {
      if (this.peek() !== '_') text += this.peek()
      this.next()
    }
    if (this.peek() === '.' && /[0-9]/.test(this.source[this.pos + 1] || '')) {
      text += this.next()
      while (!this.eof() && /[0-9_]/.test(this.peek())) {
        if (this.peek() !== '_') text += this.peek()
        this.next()
      }
    }
    if ((this.peek() === 'e' || this.peek() === 'E') && text) {
      text += this.next()
      if (this.peek() === '+' || this.peek() === '-') text += this.next()
      while (!this.eof() && /[0-9]/.test(this.peek())) text += this.next()
    }
    if (!text) return null
    const value = Number(text)
    if (!Number.isFinite(value)) throw new Error('Invalid number.')
    return value
  }

  readIdentifier() {
    this.skipSpace()
    const start = this.pos
    if (!/[A-Za-z_\u03c0\u03c6\u03b3]/.test(this.peek())) return null
    this.next()
    while (!this.eof() && /[A-Za-z0-9_\u2080-\u209f]/.test(this.peek())) this.next()
    return this.source.slice(start, this.pos)
  }

  resolveIdentifier(name) {
    const key = name.toLowerCase()
    if (key === 'ans') {
      if (this.session.ans == null) throw new Error('ans is not defined yet.')
      return this.session.ans
    }
    if (this.session.variables.has(key)) return this.session.variables.get(key)
    if (key in BUILTIN_VARS) return BUILTIN_VARS[key]
    throw new Error(`Unknown identifier: ${name}`)
  }

  parsePrimary() {
    this.skipSpace()
    const num = this.readNumber()
    if (num != null) return num
    const id = this.readIdentifier()
    if (id) {
      const key = id.toLowerCase()
      this.skipSpace()
      if (this.peek() === '(') {
        this.next()
        const args = []
        if (this.peek() !== ')') {
          do {
            args.push(this.parseExpression())
            this.skipSpace()
            if (this.peek() === ';' || this.peek() === ',') this.next()
            else break
          } while (this.peek() !== ')' && !this.eof())
        }
        if (this.next() !== ')') throw new Error('Expected closing parenthesis.')
        return callFunction(key, args, this.session)
      }
      return this.resolveIdentifier(id)
    }
    if (this.peek() === '(') {
      this.next()
      const inner = this.parseExpression()
      if (this.next() !== ')') throw new Error('Expected closing parenthesis.')
      return inner
    }
    if (this.peek() === '-') {
      this.next()
      return -this.parsePrimary()
    }
    if (this.peek() === '+') {
      this.next()
      return this.parsePrimary()
    }
    throw new Error('Unexpected input in expression.')
  }

  parsePostfix(value) {
    this.skipSpace()
    while (true) {
      if (this.peek() === '!') {
        this.next()
        if (!Number.isInteger(value) || value < 0) throw new Error('Factorial needs a non-negative integer.')
        value = factorial(value)
        continue
      }
      if (this.peek() === '%') {
        this.next()
        value /= 100
        continue
      }
      break
    }
    return value
  }

  parsePower() {
    let left = this.parsePostfix(this.parsePrimary())
    this.skipSpace()
    while (this.peek() === '^') {
      this.next()
      const right = this.parsePostfix(this.parsePrimary())
      left = left ** right
      this.skipSpace()
    }
    return left
  }

  parseTerm() {
    let left = this.parsePower()
    while (true) {
      this.skipSpace()
      const ch = this.peek()
      if (ch === '*' || ch === '·') {
        this.next()
        left *= this.parsePower()
      } else if (ch === '/') {
        this.next()
        const right = this.parsePower()
        if (right === 0) throw new Error('Division by zero.')
        left /= right
      } else if (ch === '\\') {
        this.next()
        const right = this.parsePower()
        if (right === 0) throw new Error('Division by zero.')
        left = Math.trunc(left / right)
      } else if (this.tryImplicitMultiply()) {
        left *= this.parsePower()
      } else break
    }
    return left
  }

  tryImplicitMultiply() {
    this.skipSpace()
    const ch = this.peek()
    if (ch === '(') return true
    if (/[A-Za-z_\u03c0\u03c6\u03b3]/.test(ch)) return true
    if (ch === '0' || (ch >= '1' && ch <= '9')) return true
    return false
  }

  parseExpression() {
    let left = this.parseTerm()
    while (true) {
      this.skipSpace()
      const ch = this.peek()
      if (ch === '+') {
        this.next()
        left += this.parseTerm()
      } else if (ch === '-') {
        this.next()
        left -= this.parseTerm()
      } else break
    }
    return left
  }

  parseAssignment() {
    this.skipSpace()
    const save = this.pos
    const id = this.readIdentifier()
    if (id) {
      this.skipSpace()
      if (this.peek() === '=') {
        this.next()
        const value = this.parseExpression()
        if (!this.eof()) throw new Error('Unexpected text after assignment.')
        return { type: 'assign', name: id.toLowerCase(), value }
      }
    }
    this.pos = save
    const value = this.parseExpression()
    if (!this.eof()) throw new Error('Unexpected text in expression.')
    return { type: 'value', value }
  }
}

export function applyAutoAns(expression, session) {
  const trimmed = expression.trim()
  if (!session?.autoAns || session.ans == null || !trimmed) return expression
  if (/^[+\-*/^\\%]/.test(trimmed)) return `ans${trimmed}`
  return expression
}

export function cloneCalculatorSession(session) {
  return createCalculatorSession({
    ans: session.ans,
    angleUnit: session.angleUnit,
    precision: session.precision,
    autoAns: session.autoAns,
    variables: new Map(session.variables),
  })
}

export function evaluateCalculatorExpression(rawExpression, session) {
  const { expression, comment } = stripCalculatorComment(rawExpression)
  if (!expression.trim()) {
    return { ok: true, comment, skipped: true }
  }
  const fixed = autoFixCalculatorExpression(applyAutoAns(expression, session))
  const parser = new Parser(fixed, session)
  const result = parser.parseAssignment()
  if (result.type === 'assign') {
    if (result.name === 'ans') throw new Error('Cannot assign to ans.')
    session.variables.set(result.name, result.value)
    session.ans = result.value
    return { ok: true, comment, expression: fixed, result: result.value, assigned: result.name }
  }
  session.ans = result.value
  return { ok: true, comment, expression: fixed, result: result.value }
}

function groupDigits(text, grouping) {
  if (!grouping) return text
  const match = /^(-?)(\d+)(?:\.(\d+))?([eE].*)?$/.exec(text)
  if (!match) return text
  const [, sign, whole, frac = '', exp = ''] = match
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const groupedFrac = frac.replace(/(\d{3})(?=\d)/g, '$1 ')
  return `${sign}${groupedWhole}${frac ? `.${groupedFrac}` : ''}${exp}`
}

export function formatCalculatorExpression(expression, grouping = true) {
  if (!grouping || !expression) return expression
  return expression.replace(/(?<![A-Za-z0-9_.])(\d+(?:\.\d+)?)/g, number => groupDigits(number, true))
}

function formatEngineering(value, precision) {
  if (value === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const eng = Math.floor(exp / 3) * 3
  const mantissa = value / 10 ** eng
  const digits = Math.max(1, precision - String(Math.trunc(Math.abs(mantissa))).length)
  const body = mantissa.toFixed(Math.min(20, digits)).replace(/\.?0+$/, '')
  return eng === 0 ? body : `${body}e${eng}`
}

function formatSexagesimal(value) {
  const sign = value < 0 ? '-' : ''
  let rest = Math.abs(value)
  const degrees = Math.floor(rest)
  rest = (rest - degrees) * 60
  const minutes = Math.floor(rest)
  const seconds = (rest - minutes) * 60
  return `${sign}${degrees}° ${minutes}' ${seconds.toFixed(2)}"`
}

function formatIntegerBase(value, radix) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) return null
  const text = value.toString(radix)
  return radix === 16 ? text.toUpperCase() : text
}

export function formatCalculatorResult(value, precision = 15, format = 'g', grouping = false) {
  if (value == null || Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  const digits = Math.min(20, Math.max(0, precision))
  if (format === 'b' || format === 'o' || format === 'h') {
    const radix = { b: 2, o: 8, h: 16 }[format]
    const prefixed = { b: '0b', o: '0o', h: '0x' }[format]
    const bits = formatIntegerBase(value, radix)
    if (bits == null) return formatCalculatorResult(value, precision, 'g', grouping)
    return prefixed + bits
  }
  if (format === 's') return formatSexagesimal(value)
  if (format === 'f') {
    const fixed = value.toFixed(digits)
    const [whole, frac = ''] = fixed.split('.')
    return groupDigits(frac ? `${whole}.${frac}` : whole, grouping)
  }
  if (format === 'e') return groupDigits(value.toExponential(Math.max(0, digits - 1)), grouping)
  if (format === 'n') return groupDigits(formatEngineering(value, digits), grouping)
  if (Number.isInteger(value) && Math.abs(value) <= 1e15) return groupDigits(String(value), grouping)
  let text = Number(value).toPrecision(Math.max(1, digits))
  if (!/e/i.test(text)) text = text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  return groupDigits(text, grouping)
}

export function searchCalculatorSymbols(query, limit = 12) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits = []
  for (const fn of calculatorFunctionCatalog) {
    if (fn.id.startsWith(q)) hits.push({ kind: 'function', id: fn.id, detail: `${fn.id}(${fn.usage})` })
  }
  for (const c of calculatorConstantCatalog) {
    if (c.id.startsWith(q)) hits.push({ kind: 'constant', id: c.id, detail: c.name })
  }
  return hits.slice(0, limit)
}
