import test from 'node:test'
import assert from 'node:assert/strict'
import {
  autoFixCalculatorExpression,
  createCalculatorSession,
  evaluateCalculatorExpression,
  formatCalculatorExpression,
  formatCalculatorResult,
  stripCalculatorComment,
} from '../src/calculatorOps.js'

test('calculator evaluates arithmetic and powers', () => {
  const session = createCalculatorSession()
  assert.equal(evaluateCalculatorExpression('1+2*3', session).result, 7)
  assert.equal(evaluateCalculatorExpression('2^10', session).result, 1024)
  assert.equal(evaluateCalculatorExpression('5!', session).result, 120)
})

test('calculator uses angle mode for trig', () => {
  const session = createCalculatorSession({ angleUnit: 'd' })
  const out = evaluateCalculatorExpression('sin(30)', session)
  assert.ok(Math.abs(out.result - 0.5) < 1e-12)
})

test('calculator supports assignment, ans, and comments', () => {
  const session = createCalculatorSession()
  evaluateCalculatorExpression('x=10', session)
  assert.equal(session.variables.get('x'), 10)
  assert.equal(evaluateCalculatorExpression('x+ans', session).result, 20)
  const commented = stripCalculatorComment('2+2 ? quick check')
  assert.equal(commented.expression, '2+2')
  assert.equal(commented.comment, 'quick check')
})

test('auto-fix closes parentheses and applies bare functions to ans', () => {
  const session = createCalculatorSession({ ans: 4 })
  assert.equal(autoFixCalculatorExpression('sqrt'), 'sqrt(ans)')
  assert.equal(autoFixCalculatorExpression('(1+2'), '(1+2)')
  assert.equal(evaluateCalculatorExpression('sqrt', session).result, 2)
})

test('formatCalculatorResult trims noise', () => {
  assert.equal(formatCalculatorResult(2), '2')
  assert.match(formatCalculatorResult(1 / 3, 8), /^0\.333/)
  assert.equal(formatCalculatorResult(255, 12, 'h'), '0xFF')
  assert.equal(formatCalculatorResult(260525, 12, 'g', true), '260 525')
  assert.equal(formatCalculatorResult(1234.5, 2, 'f', true), '1 234.50')
  assert.equal(formatCalculatorExpression('423925-163400'), '423 925-163 400')
})

test('auto ans prefixes the previous result', () => {
  const session = createCalculatorSession({ ans: 10, autoAns: true })
  assert.equal(evaluateCalculatorExpression('+2', session).result, 12)
})
