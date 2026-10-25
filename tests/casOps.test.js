import test from 'node:test'
import assert from 'node:assert/strict'
import nerdamer from 'nerdamer-prime'
import Algebrite from 'algebrite'
import { casEngines, casOperationDomains, casOperations, casSymbolHints, evaluateCas, normalizeCasExpression, parseCasDefinition } from '../src/casOps.js'

const libs = { nerdamer, algebrite: Algebrite }

for (const engine of Object.keys(casEngines)) {
  test(`${engine} help examples give the documented results`, () => {
    for (const op of casOperations[engine]) {
      assert.ok(casOperationDomains.includes(op.domain), `${op.id} has a known domain`)
      assert.equal(evaluateCas(engine, libs[engine], { expression: op.example }).result, op.expect, op.example)
    }
  })

  test(`${engine} sample evaluates`, () => {
    assert.ok(evaluateCas(engine, libs[engine], { expression: casEngines[engine].sample }).result)
  })
}

test('definitions replay before each line and do not leak into the next run', () => {
  assert.equal(evaluateCas('nerdamer', nerdamer, { definitions: ['a = 5', 'f(x) := x^2+1'], expression: 'f(a)+a' }).result, '31')
  assert.equal(evaluateCas('nerdamer', nerdamer, { expression: 'a' }).result, 'a')
  assert.equal(evaluateCas('algebrite', Algebrite, { definitions: ['a = 5', 'f(x) = x^2+1'], expression: 'f(a)+a' }).result, '31')
  assert.equal(evaluateCas('algebrite', Algebrite, { expression: 'a' }).result, 'a')
})

test('definitions report the stored value', () => {
  const out = evaluateCas('algebrite', Algebrite, { expression: 'b = 2+3' })
  assert.equal(out.assigned, 'b')
  assert.equal(out.result, '5')
  assert.equal(out.definition, 'b = 2+3')
})

test('errors throw with readable messages', () => {
  assert.throws(() => evaluateCas('algebrite', Algebrite, { expression: '1/0' }), /Divide by zero/)
  assert.throws(() => evaluateCas('algebrite', Algebrite, { expression: 'foo(' }), /Syntax error/)
  assert.throws(() => evaluateCas('nerdamer', nerdamer, { expression: 'foo(' }), /bracket/)
  assert.throws(() => evaluateCas('nerdamer', nerdamer, { expression: 'pi = 3' }), /Cannot redefine pi/)
})

test('exact results get a decimal approximation only when it adds something', () => {
  assert.equal(evaluateCas('nerdamer', nerdamer, { expression: 'sqrt(8)+pi' }).decimal, '5.9700197783359831755')
  assert.equal(evaluateCas('nerdamer', nerdamer, { expression: 'diff(x^2, x)' }).decimal, '')
  assert.equal(evaluateCas('algebrite', Algebrite, { expression: 'sqrt(8)+pi' }).decimal, '5.970020...')
  assert.equal(evaluateCas('algebrite', Algebrite, { expression: '7' }).decimal, '')
})

test('Algebrite LaTeX keeps the factored form', () => {
  assert.equal(evaluateCas('algebrite', Algebrite, { expression: 'factor(x^2-5x+6)' }).latex, '(x-3)(x-2)')
  assert.match(evaluateCas('algebrite', Algebrite, { expression: 'd(sin(x), x)' }).latex, /\\operatorname\{cos\}\(x\)/)
})

test('definition parsing and normalization', () => {
  assert.deepEqual(parseCasDefinition('f(x, y) := x*y'), { name: 'f', params: ['x', 'y'], body: 'x*y' })
  assert.deepEqual(parseCasDefinition('a = 5'), { name: 'a', params: null, body: '5' })
  assert.equal(parseCasDefinition('solveEquations([x+y=3, x-y=1])'), null)
  assert.equal(parseCasDefinition('a == 5'), null)
  assert.equal(normalizeCasExpression(' 2×π − 1 '), '2*pi - 1')
})

test('symbol hints complete operation names', () => {
  assert.deepEqual(casSymbolHints('nerdamer', 'int'), ['integrate'])
  assert.deepEqual(casSymbolHints('algebrite', 'de'), ['defint', 'deg', 'det'])
  assert.deepEqual(casSymbolHints('algebrite', ''), [])
})
