import test from 'node:test'
import assert from 'node:assert/strict'
import { activeFolds, applyDisplayEdit, applyViewEdit, displayToView, hideFolds, indentPieces, indentUnit, jsonFolds, mapRange, mapViewSpan, mapViewToSource, viewToDisplay, wrapIndent } from '../src/jsonFold.js'

const text = '{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}\n'

test('json folds are multi-line containers, keyed by path', () => {
  const folds = jsonFolds(text)
  assert.deepEqual(folds.map(fold => fold.path), ['$.b', '$'])
  assert.deepEqual(jsonFolds('{\n  "a": "{",\n  "b": [1, 2]\n}\n').map(fold => fold.path), ['$'])
  assert.deepEqual(jsonFolds('{ "a": { "b": 1 } }\n'), [])
  assert.deepEqual(jsonFolds('{\n  // {\n  "a": 1\n}\n').map(fold => fold.path), ['$'])
})

test('hiding a fold keeps the opening line and the tail', () => {
  const inner = activeFolds(jsonFolds(text), new Set(['$.b']))
  assert.equal(hideFolds(text, inner), '{\n  "a": 1,\n  "b": {\n}\n')
  const both = activeFolds(jsonFolds(text), new Set(['$', '$.b']))
  assert.equal(hideFolds(text, both), '{\n')
})

test('edits stay on visible text and select-all replaces the source', () => {
  const folds = activeFolds(jsonFolds(text), new Set(['$.b']))
  const view = hideFolds(text, folds)
  const typed = view.replace('"a": 1', '"a": 2')
  assert.equal(applyViewEdit(text, folds, view, typed), text.replace('"a": 1', '"a": 2'))
  const seam = view.indexOf('\n}\n')
  const joined = applyViewEdit(text, folds, view, view.slice(0, seam) + view.slice(seam + 1))
  assert.equal(joined.includes('"c": 2'), true)
  assert.equal(joined.includes('"b": {    "c"'), true)
  assert.equal(applyViewEdit(text, folds, view, ''), '')
  const span = mapViewSpan(view.indexOf('"b"'), view.indexOf('"b"') + 3, folds)
  assert.equal(text.slice(span.srcStart, span.srcEnd), '"b"')
  assert.equal(mapViewToSource(view.length, folds), text.length)
  assert.equal(mapRange({ start: text.indexOf('"c"'), end: text.indexOf('"c"') + 3 }, folds), null)
})

test('wrapped continuations repeat the indent and edits ignore that indent', () => {
  const widthOf = ch => (ch.codePointAt(0) > 0xff ? 2 : 1)
  const line = `    ${'a'.repeat(20)}`
  const wrapped = wrapIndent(line, 10, widthOf)
  const zh = wrapIndent(`    ${'國'.repeat(8)}`, 10, widthOf)
  assert.deepEqual(zh.rows, [3])
  assert.equal(zh.text, `    ${'國'.repeat(3)}\n    ${'國'.repeat(3)}\n    ${'國'.repeat(2)}`)
  assert.deepEqual(wrapped.rows, [4])
  assert.equal(wrapped.text, `    ${'a'.repeat(6)}\n    ${'a'.repeat(6)}\n    ${'a'.repeat(6)}\n    ${'aa'}`)
  assert.equal(displayToView(wrapped.text.length, wrapped.synthetics), line.length)
  assert.equal(viewToDisplay(line.length, wrapped.synthetics), wrapped.text.length)
  const typed = wrapped.text.replace('aaaaaa\n', 'aaaXaa\n')
  assert.equal(applyDisplayEdit(line, wrapped.synthetics, wrapped.text, typed), line.replace('aaaaaa', 'aaaXaa'))
})

test('indent unit follows the document and pieces stay the same width', () => {
  assert.equal(indentUnit('{\n  "a": 1\n}'), '  ')
  assert.equal(indentUnit('{\n    "a": 1\n}'), '    ')
  assert.equal(indentUnit('{\n\t"a": 1\n}'), '\t')
  assert.deepEqual(indentPieces('    ', '  ').map(piece => piece.text).join(''), '    ')
  assert.deepEqual(indentPieces('    ', '  ').map(piece => piece.level), [0, 1])
})
