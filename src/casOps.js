// Symbolic (CAS) calculators backed by nerdamer-prime and Algebrite. Both libraries keep global state,
// so every evaluation resets the engine and replays the saved definitions first.

export const casEngines = {
  nerdamer: {
    id: 'nerdamer',
    label: 'nerdamer-prime',
    url: 'https://github.com/together-science/nerdamer-prime',
    sample: 'diff(x^3*sin(x), x)',
    placeholder: 'integrate(x*e^x, x)',
    note: 'Use = or := to define, e.g. a = 5 or f(x) := x^2 + 1. Use e for Euler’s number and i for √−1.',
  },
  algebrite: {
    id: 'algebrite',
    label: 'Algebrite',
    url: 'http://algebrite.org',
    sample: 'd(x^3*sin(x), x)',
    placeholder: 'integral(x*exp(x), x)',
    note: 'Use = to define, e.g. a = 5 or f(x) = x^2 + 1. Use exp(x) for eˣ, i for √−1, and float(…) for decimals.',
  },
}

// Each example below is checked against the engine in tests/casOps.test.js.
export const casOperations = {
  nerdamer: [
    { id: 'diff', domain: 'Calculus', syntax: 'diff(f, x [, n])', meaning: 'Derivative of f with respect to x, n times.', example: 'diff(x^3*sin(x), x)', expect: '3*sin(x)*x^2+cos(x)*x^3' },
    { id: 'diff2', domain: 'Calculus', syntax: 'diff(f, x, n)', meaning: 'Higher-order derivative.', example: 'diff(x^4, x, 2)', expect: '12*x^2' },
    { id: 'partial', domain: 'Calculus', syntax: 'diff(f, y)', meaning: 'Partial derivative with respect to another variable.', example: 'diff(sin(x)*cos(y), y)', expect: '-sin(x)*sin(y)' },
    { id: 'integrate', domain: 'Calculus', syntax: 'integrate(f, x)', meaning: 'Indefinite integral (antiderivative).', example: 'integrate(x*e^x, x)', expect: '-e^x+e^x*x' },
    { id: 'integrate-trig', domain: 'Calculus', syntax: 'integrate(f, x)', meaning: 'Integral of a trigonometric or rational function.', example: 'integrate(1/(x^2+1), x)', expect: 'atan(x)' },
    { id: 'defint', domain: 'Calculus', syntax: 'defint(f, a, b, x)', meaning: 'Definite integral of f from a to b.', example: 'defint(x^2, 0, 3, x)', expect: '9' },
    { id: 'limit', domain: 'Calculus', syntax: 'limit(f, x, a)', meaning: 'Limit of f as x approaches a. Use Infinity for ∞.', example: 'limit(sin(x)/x, x, 0)', expect: '1' },
    { id: 'sum', domain: 'Calculus', syntax: 'sum(f, k, a, b)', meaning: 'Sum of f for k from a to b.', example: 'sum(k^2, k, 1, 10)', expect: '385' },
    { id: 'product', domain: 'Calculus', syntax: 'product(f, k, a, b)', meaning: 'Product of f for k from a to b.', example: 'product(k, k, 1, 5)', expect: '120' },
    { id: 'laplace', domain: 'Transforms', syntax: 'laplace(f, t, s)', meaning: 'Laplace transform of f(t).', example: 'laplace(t^2, t, s)', expect: 'factorial(2)*s^(-3)' },
    { id: 'ilt', domain: 'Transforms', syntax: 'ilt(F, s, t)', meaning: 'Inverse Laplace transform of F(s).', example: 'ilt(1/s^2, s, t)', expect: 't' },
    { id: 'solve', domain: 'Solving', syntax: 'solve(f, x)', meaning: 'Roots of f = 0 for x.', example: 'solve(x^3-6x^2+11x-6, x)', expect: '[1,2,3]' },
    { id: 'solveEquations', domain: 'Solving', syntax: 'solveEquations([eq₁, eq₂, …])', meaning: 'Solve a system of equations. Results pair each variable with its value.', example: 'solveEquations([x+y=3, x-y=1])', expect: '[x,2,y,1]' },
    { id: 'roots', domain: 'Solving', syntax: 'roots(p)', meaning: 'Roots of a polynomial.', example: 'roots(x^2-3x+2)', expect: '[1,2]' },
    { id: 'expand', domain: 'Algebra', syntax: 'expand(f)', meaning: 'Multiply out products and powers.', example: 'expand((x+1)^3)', expect: '1+3*x+3*x^2+x^3' },
    { id: 'factor', domain: 'Algebra', syntax: 'factor(p)', meaning: 'Factor a polynomial.', example: 'factor(x^4-1)', expect: '(-1+x)*(1+x)*(1+x^2)' },
    { id: 'simplify', domain: 'Algebra', syntax: 'simplify(f)', meaning: 'Simplify an expression.', example: 'simplify(sin(x)^2+cos(x)^2)', expect: '1' },
    { id: 'partfrac', domain: 'Algebra', syntax: 'partfrac(f, x)', meaning: 'Partial fraction decomposition.', example: 'partfrac(1/(x^2-1), x)', expect: '(-1/2)*(1+x)^(-1)+(1/2)*(-1+x)^(-1)' },
    { id: 'divide', domain: 'Algebra', syntax: 'divide(p, q)', meaning: 'Polynomial division.', example: 'divide(x^3+1, x+1)', expect: '-x+x^2+1' },
    { id: 'coeffs', domain: 'Algebra', syntax: 'coeffs(p, x)', meaning: 'Coefficients of p, lowest power first.', example: 'coeffs(3x^2+2x+1, x)', expect: '[1,2,3]' },
    { id: 'deg', domain: 'Algebra', syntax: 'deg(p, x)', meaning: 'Degree of a polynomial.', example: 'deg(x^3+x, x)', expect: '3' },
    { id: 'gcd', domain: 'Numbers', syntax: 'gcd(a, b)', meaning: 'Greatest common divisor.', example: 'gcd(12, 18)', expect: '6' },
    { id: 'lcm', domain: 'Numbers', syntax: 'lcm(a, b)', meaning: 'Least common multiple.', example: 'lcm(4, 6)', expect: '12' },
    { id: 'pfactor', domain: 'Numbers', syntax: 'pfactor(n)', meaning: 'Prime factorization of an integer.', example: 'pfactor(360)', expect: '(2^3)*(3^2)*(5)' },
    { id: 'sqrt', domain: 'Numbers', syntax: 'sqrt(x), nthroot(x, n)', meaning: 'Exact square root or nth root.', example: 'sqrt(8)+pi', expect: '2*sqrt(2)+pi' },
    { id: 'polarform', domain: 'Complex', syntax: 'polarform(z)', meaning: 'Polar form of a complex number.', example: 'polarform(1+i)', expect: 'e^(atan(1)*i)*sqrt(2)' },
    { id: 'rectform', domain: 'Complex', syntax: 'rectform(z)', meaning: 'Rectangular form a + bi.', example: 'rectform(e^(i*pi/4))', expect: 'i*sqrt(2)^(-1)+sqrt(2)^(-1)' },
    { id: 'arg', domain: 'Complex', syntax: 'arg(z), realpart(z), imagpart(z)', meaning: 'Argument, real part, or imaginary part.', example: 'arg(1+i)', expect: '(1/4)*pi' },
    { id: 'determinant', domain: 'Linear algebra', syntax: 'determinant(M)', meaning: 'Determinant of a matrix. Write rows as matrix([a,b],[c,d]).', example: 'determinant(matrix([1,2],[3,4]))', expect: '-2' },
    { id: 'invert', domain: 'Linear algebra', syntax: 'invert(M)', meaning: 'Inverse of a matrix.', example: 'invert(matrix([1,2],[3,4]))', expect: 'matrix([-2,1],[3/2,-1/2])' },
    { id: 'transpose', domain: 'Linear algebra', syntax: 'transpose(M)', meaning: 'Transpose of a matrix.', example: 'transpose(matrix([1,2],[3,4]))', expect: 'matrix([1,3],[2,4])' },
    { id: 'dot', domain: 'Linear algebra', syntax: 'dot(u, v), cross(u, v)', meaning: 'Dot or cross product of vectors.', example: 'cross([1,0,0],[0,1,0])', expect: '[0,0,1]' },
    { id: 'mean', domain: 'Statistics', syntax: 'mean(…), median(…), mode(…)', meaning: 'Average, middle value, or most common value.', example: 'mean(1,2,3,4)', expect: '5/2' },
    { id: 'stdev', domain: 'Statistics', syntax: 'stdev(…), variance(…)', meaning: 'Population standard deviation or variance.', example: 'stdev(1,2,3,4)', expect: '(1/2)*sqrt(5)' },
    { id: 'define-var', domain: 'Definitions', syntax: 'name = expr', meaning: 'Store a value for later lines.', example: 'a = 5', expect: '5' },
    { id: 'define-fn', domain: 'Definitions', syntax: 'f(x) := expr', meaning: 'Define a function for later lines.', example: 'f(x) := x^2+1', expect: 'f(x) := x^2+1' },
  ],
  algebrite: [
    { id: 'd', domain: 'Calculus', syntax: 'd(f, x)', meaning: 'Derivative of f with respect to x.', example: 'd(x^3*sin(x), x)', expect: '3*x^2*sin(x)+x^3*cos(x)' },
    { id: 'd2', domain: 'Calculus', syntax: 'd(f, x, n)', meaning: 'Higher-order derivative.', example: 'd(x^4, x, 2)', expect: '12*x^2' },
    { id: 'partial', domain: 'Calculus', syntax: 'd(f, y)', meaning: 'Partial derivative with respect to another variable.', example: 'd(sin(x)*cos(y), y)', expect: '-sin(x)*sin(y)' },
    { id: 'integral', domain: 'Calculus', syntax: 'integral(f, x)', meaning: 'Indefinite integral (antiderivative).', example: 'integral(x*exp(x), x)', expect: '-exp(x)+x*exp(x)' },
    { id: 'integral-rational', domain: 'Calculus', syntax: 'integral(f, x)', meaning: 'Integral of a trigonometric or rational function.', example: 'integral(1/(x^2+1), x)', expect: 'arctan(x)' },
    { id: 'defint', domain: 'Calculus', syntax: 'defint(f, x, a, b)', meaning: 'Definite integral of f from a to b.', example: 'defint(x^2, x, 0, 3)', expect: '9' },
    { id: 'defint-double', domain: 'Calculus', syntax: 'defint(f, x, a, b, y, c, d)', meaning: 'Multiple integral over several variables.', example: 'defint(x*y, x, 0, 1, y, 0, 2)', expect: '1' },
    { id: 'taylor', domain: 'Calculus', syntax: 'taylor(f, x, n [, a])', meaning: 'Taylor polynomial of degree n around a (default 0).', example: 'taylor(exp(x), x, 4)', expect: '1/24*x^4+1/6*x^3+1/2*x^2+x+1' },
    { id: 'sum', domain: 'Calculus', syntax: 'sum(f, k, a, b)', meaning: 'Sum of f for k from a to b.', example: 'sum(k^2, k, 1, 10)', expect: '385' },
    { id: 'product', domain: 'Calculus', syntax: 'product(f, k, a, b)', meaning: 'Product of f for k from a to b.', example: 'product(k, k, 1, 5)', expect: '120' },
    { id: 'roots', domain: 'Solving', syntax: 'roots(p [, x])', meaning: 'Exact roots of a polynomial.', example: 'roots(x^3-6x^2+11x-6)', expect: '[1,2,3]' },
    { id: 'nroots', domain: 'Solving', syntax: 'nroots(p [, x])', meaning: 'Numeric roots, including complex ones.', example: 'nroots(x^2-2)', expect: '[-1.414214...,1.414214...]' },
    { id: 'expand', domain: 'Algebra', syntax: 'expand(f)', meaning: 'Multiply out products and powers.', example: 'expand((x+1)^3)', expect: 'x^3+3*x^2+3*x+1' },
    { id: 'factor', domain: 'Algebra', syntax: 'factor(p [, x])', meaning: 'Factor a polynomial, or an integer into primes.', example: 'factor(x^2-5x+6)', expect: '(x-3)*(x-2)' },
    { id: 'factor-int', domain: 'Algebra', syntax: 'factor(n)', meaning: 'Prime factorization of an integer.', example: 'factor(360)', expect: '2^3*3^2*5' },
    { id: 'simplify', domain: 'Algebra', syntax: 'simplify(f)', meaning: 'Simplify an expression.', example: 'simplify(sin(x)^2+cos(x)^2)', expect: '1' },
    { id: 'rationalize', domain: 'Algebra', syntax: 'rationalize(f)', meaning: 'Combine terms over a common denominator.', example: 'rationalize(1/a+1/b)', expect: '(a+b)/(a*b)' },
    { id: 'quotient', domain: 'Algebra', syntax: 'quotient(p, q [, x])', meaning: 'Quotient of polynomial division.', example: 'quotient(x^3+1, x+1)', expect: 'x^2-x+1' },
    { id: 'coeff', domain: 'Algebra', syntax: 'coeff(p, x, n)', meaning: 'Coefficient of xⁿ in p.', example: 'coeff(3x^2+2x+1, x, 2)', expect: '3' },
    { id: 'deg', domain: 'Algebra', syntax: 'deg(p, x)', meaning: 'Degree of a polynomial.', example: 'deg(x^3+x, x)', expect: '3' },
    { id: 'gcd', domain: 'Algebra', syntax: 'gcd(a, b)', meaning: 'Greatest common divisor of numbers or polynomials.', example: 'gcd(x^2-1, x-1)', expect: 'x-1' },
    { id: 'subst', domain: 'Algebra', syntax: 'subst(new, old, f)', meaning: 'Replace old with new in f.', example: 'subst(y, x, x^2+x)', expect: 'y^2+y' },
    { id: 'eval', domain: 'Algebra', syntax: 'eval(f, x, a)', meaning: 'Evaluate f at x = a.', example: 'eval(x^2+1, x, 3)', expect: '10' },
    { id: 'float', domain: 'Numbers', syntax: 'float(x)', meaning: 'Decimal value of an exact result.', example: 'float(pi)', expect: '3.141593...' },
    { id: 'choose', domain: 'Numbers', syntax: 'choose(n, k), n!', meaning: 'Binomial coefficient or factorial.', example: 'choose(5, 2)', expect: '10' },
    { id: 'prime', domain: 'Numbers', syntax: 'prime(n), isprime(n)', meaning: 'nth prime, or 1 if n is prime.', example: 'prime(10)', expect: '29' },
    { id: 'mod', domain: 'Numbers', syntax: 'mod(a, b)', meaning: 'Remainder of a divided by b.', example: 'mod(17, 5)', expect: '2' },
    { id: 'polar', domain: 'Complex', syntax: 'polar(z), rect(z)', meaning: 'Polar or rectangular form of a complex number.', example: 'polar(1+i)', expect: '2^(1/2)*exp(1/4*i*pi)' },
    { id: 'abs', domain: 'Complex', syntax: 'abs(z), arg(z)', meaning: 'Magnitude or angle of a complex number.', example: 'abs(3+4i)', expect: '5' },
    { id: 'conj', domain: 'Complex', syntax: 'conj(z), real(z), imag(z)', meaning: 'Conjugate, real part, or imaginary part.', example: 'conj(1+i)', expect: '1-i' },
    { id: 'circexp', domain: 'Complex', syntax: 'circexp(f)', meaning: 'Rewrite trigonometric functions as exponentials.', example: 'circexp(cos(x))', expect: '1/2*exp(-i*x)+1/2*exp(i*x)' },
    { id: 'det', domain: 'Linear algebra', syntax: 'det(M)', meaning: 'Determinant of a matrix. Write rows as [[a,b],[c,d]].', example: 'det([[1,2],[3,4]])', expect: '-2' },
    { id: 'inv', domain: 'Linear algebra', syntax: 'inv(M)', meaning: 'Inverse of a matrix.', example: 'inv([[1,2],[3,4]])', expect: '[[-2,1],[3/2,-1/2]]' },
    { id: 'transpose', domain: 'Linear algebra', syntax: 'transpose(M)', meaning: 'Transpose of a matrix.', example: 'transpose([[1,2],[3,4]])', expect: '[[1,3],[2,4]]' },
    { id: 'contract', domain: 'Linear algebra', syntax: 'contract(M)', meaning: 'Trace of a matrix.', example: 'contract([[1,2],[3,4]])', expect: '5' },
    { id: 'dot', domain: 'Linear algebra', syntax: 'dot(u, v), cross(u, v), outer(u, v)', meaning: 'Dot, cross, or outer product.', example: 'cross([1,0,0],[0,1,0])', expect: '[0,0,1]' },
    { id: 'unit', domain: 'Linear algebra', syntax: 'unit(n), zero(m, n)', meaning: 'Identity matrix or zero matrix.', example: 'unit(2)', expect: '[[1,0],[0,1]]' },
    { id: 'legendre', domain: 'Special functions', syntax: 'legendre(x, n), hermite(x, n), laguerre(x, n)', meaning: 'Orthogonal polynomials of degree n.', example: 'legendre(x, 3)', expect: '5/2*x^3-3/2*x' },
    { id: 'erf', domain: 'Special functions', syntax: 'erf(x), besselj(x, n)', meaning: 'Error function or Bessel function.', example: 'integral(exp(-x^2), x)', expect: '1/2*pi^(1/2)*erf(x)' },
    { id: 'define-var', domain: 'Definitions', syntax: 'name = expr', meaning: 'Store a value for later lines.', example: 'a = 5', expect: '5' },
    { id: 'define-fn', domain: 'Definitions', syntax: 'f(x) = expr', meaning: 'Define a function for later lines.', example: 'f(x) = x^2+1', expect: 'f(x) = x^2+1' },
  ],
}

export const casOperationDomains = ['Calculus', 'Transforms', 'Solving', 'Algebra', 'Numbers', 'Complex', 'Linear algebra', 'Statistics', 'Special functions', 'Definitions']

const DEFINITION = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(\(\s*[A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*\s*\))?\s*(:=|=(?!=))\s*(.+)$/s

// ponytail: names the engines treat as built in; redefining them breaks every later line
const RESERVED = new Set(['e', 'i', 'pi', 'x', 'last', 'Infinity'])

/**
 * Split `name = expr`, `name := expr`, or `f(x, y) = expr` into its parts, or return null.
 */
export function parseCasDefinition(line) {
  const match = DEFINITION.exec(line)
  if (!match) return null
  const [, name, paramList, , body] = match
  const params = paramList ? paramList.slice(1, -1).split(',').map(p => p.trim()) : null
  return { name, params, body: body.trim() }
}

export function normalizeCasExpression(expression) {
  return expression
    .replace(/−|–/g, '-')
    .replace(/[×⋅∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/∞/g, 'Infinity')
    .replace(/\*\*/g, '^')
    .trim()
}

function resetEngine(engine, lib) {
  if (engine === 'nerdamer') {
    lib.clearVars()
    lib.clearFunctions()
    lib.flush()
    return
  }
  lib.run('clearall')
}

function algebriteRun(lib, expression) {
  const out = String(lib.run(expression) ?? '')
  const stop = out.indexOf('Stop:')
  if (stop >= 0) throw new Error(out.slice(stop + 5).trim().replace(/^./, c => c.toUpperCase()) || 'Could not evaluate that expression.')
  return out.trim()
}

function applyDefinition(engine, lib, definition) {
  const { name, params, body } = definition
  if (RESERVED.has(name)) throw new Error(`Cannot redefine ${name}.`)
  if (engine === 'nerdamer') {
    if (params) {
      lib.setFunction(name, params, body)
      return { result: `${name}(${params.join(', ')}) := ${body}` }
    }
    const value = lib(body)
    lib.setVar(name, value.toString())
    return { result: value.toString(), latex: value.toTeX() }
  }
  if (params) {
    algebriteRun(lib, `${name}(${params.join(',')})=${body}`)
    return { result: `${name}(${params.join(', ')}) = ${body}` }
  }
  algebriteRun(lib, `${name}=${body}`)
  const result = algebriteRun(lib, name)
  return { result, latex: algebriteLatex(lib, result) }
}

function nerdamerDecimal(lib, value) {
  const text = value.toString()
  if (/[[\]]|matrix|vector/.test(text) || value.variables().length) return ''
  const decimal = lib(text).evaluate().text('decimals')
  if (!/^-?[\d.]+(?:e[+-]?\d+)?$/i.test(decimal) || decimal === text) return ''
  return decimal
}

// ponytail: printlatex evaluates its argument (factor(…) prints expanded), so quote it; quote breaks matrices, which print fine unquoted
function algebriteLatex(lib, text) {
  try {
    const latex = algebriteRun(lib, text.startsWith('[') ? `printlatex(${text})` : `printlatex(quote(${text}))`)
    return latex
      .replace(/\\sqrt\{-1\}/g, 'i')
      .replace(/(?<![\\A-Za-z])([a-z]{2,})(?=\()/g, '\\operatorname{$1}')
  } catch {
    return ''
  }
}

function algebriteDecimal(lib, text) {
  if (/^-?\d+$/.test(text) || text.includes('...') || text.includes('[')) return ''
  if (/[A-Za-z]/.test(text.replace(/\b(?:pi|exp|log|sin|cos|tan|arctan)\b/g, ''))) return ''
  const decimal = algebriteRun(lib, `float(${text})`).replace(/\.0$/, '')
  if (!/^-?[\d.]+(?:\.\.\.)?(?:\*10\^\(?-?\d+\)?)?$/.test(decimal) || decimal === text) return ''
  return decimal
}

/**
 * Evaluate one line with a CAS engine after replaying the earlier definitions.
 * `lib` is the nerdamer function or the Algebrite module, so this runs in a worker or in Node tests.
 */
export function evaluateCas(engine, lib, { expression, definitions = [] }) {
  if (!casEngines[engine]) throw new Error(`Unknown engine: ${engine}`)
  resetEngine(engine, lib)
  for (const line of definitions) {
    const definition = parseCasDefinition(line)
    if (definition) applyDefinition(engine, lib, definition)
  }
  const source = normalizeCasExpression(expression)
  if (!source) return { skipped: true }
  const definition = parseCasDefinition(source)
  if (definition) {
    const applied = applyDefinition(engine, lib, definition)
    return { expression: source, assigned: definition.params ? '' : definition.name, definition: source, latex: '', decimal: '', ...applied }
  }
  if (engine === 'nerdamer') {
    const value = lib(source)
    if (typeof value?.toTeX !== 'function') throw new Error('Could not evaluate that expression.')
    return { expression: source, result: value.toString(), latex: value.toTeX(), decimal: nerdamerDecimal(lib, value) }
  }
  const result = algebriteRun(lib, source)
  if (!result) return { expression: source, result, latex: '', decimal: '' }
  let decimal = ''
  try { decimal = algebriteDecimal(lib, result) } catch { decimal = '' }
  return { expression: source, result, latex: algebriteLatex(lib, result), decimal }
}

export function casSymbolHints(engine, query, limit = 8) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const seen = new Set()
  const hits = []
  for (const op of casOperations[engine] || []) {
    const name = /^([A-Za-z]+)\(/.exec(op.syntax)?.[1]
    if (!name || seen.has(name) || !name.toLowerCase().startsWith(q) || name.toLowerCase() === q) continue
    seen.add(name)
    hits.push(name)
  }
  return hits.slice(0, limit)
}
