import test from 'node:test'
import assert from 'node:assert/strict'
import { mlSheet } from '../src/cheatsheets/ml.js'
import { nnSheet } from '../src/cheatsheets/nn.js'
import { snippetSheet } from '../src/cheatsheets/snippets.js'
import { filterEntries, libraries } from '../src/cheatsheets/search.js'

const sheets = [mlSheet, nnSheet, snippetSheet]

test('cheatsheet entries have unique ids and well-formed rows', () => {
  for (const sheet of sheets) {
    const ids = sheet.map(entry => entry.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const entry of sheet) {
      for (const row of entry.params || []) assert.equal(row.length, 4, `${entry.id} ${row[0]}`)
      for (const table of entry.tables || []) for (const row of table.rows) assert.equal(row.length, table.head.length, `${entry.id} ${row[0]}`)
    }
  }
})

test('sections are contiguous so the grouped list shows each header once', () => {
  for (const sheet of sheets) {
    const order = sheet.map(entry => entry.section).filter((section, index, all) => section !== all[index - 1])
    assert.equal(new Set(order).size, order.length, order.join(' | '))
  }
})

test('every sheet has workflow entries with a step flow', () => {
  for (const sheet of sheets) {
    const sops = sheet.filter(entry => entry.section === 'Workflows (SOP)')
    assert.ok(sops.length >= 4)
    for (const entry of sops) assert.ok(entry.flow.length >= 3, entry.id)
  }
})

test('filter ranks name matches first and lists matching parameters', () => {
  const [first] = filterEntries(mlSheet, 'simpleimputer strategy')
  assert.equal(first.entry.id, 'simple-imputer')
  assert.deepEqual(first.params, ['strategy'])
  assert.equal(filterEntries(mlSheet, 'dummyclassifier')[0].entry.id, 'dummy')
  const depth = filterEntries(mlSheet, 'max_depth')
  const firstWithout = depth.findIndex(result => !result.params.length)
  assert.ok(firstWithout > 0)
  assert.ok(depth.slice(firstWithout).every(result => !result.params.length), 'parameter matches rank above text mentions')
  assert.equal(filterEntries(mlSheet, 'no-such-thing-xyz').length, 0)
})

test('library filter keeps entries that list several libraries', () => {
  assert.ok(libraries(mlSheet).includes('LightGBM'))
  const ids = filterEntries(mlSheet, '', 'LightGBM').map(result => result.entry.id)
  for (const id of ['lightgbm', 'boosting-compare', 'boosting-native', 'sop-boosting']) assert.ok(ids.includes(id), id)
  assert.ok(!ids.includes('xgboost'))
})

test('neural network sheet finds the same layer in PyTorch and Keras', () => {
  const ids = filterEntries(nnSheet, 'dropout').slice(0, 3).map(result => result.entry.id)
  assert.ok(ids.includes('dropout'))
  assert.ok(ids.includes('keras-dropout'))
  assert.deepEqual(libraries(nnSheet).slice(0, 2), ['PyTorch', 'Keras 3 / TensorFlow'])
})

test('neural network see-links point at real entries and table rows', () => {
  const byId = new Map(nnSheet.map(entry => [entry.id, entry]))
  const dropout = byId.get('dropout')
  assert.ok(dropout.see.some(link => link.id === 'keras-dropout'))
  assert.ok(byId.get('keras-dropout').see.some(link => link.id === 'dropout' && link.to === 'PyTorch'))
  for (const entry of nnSheet) {
    for (const link of entry.see || []) {
      const target = byId.get(link.id)
      assert.ok(target, `${entry.id} -> ${link.id}`)
      if (!link.row) continue
      const rows = [...(target.params || []), ...(target.tables || []).flatMap(table => table.rows)]
      assert.ok(rows.some(row => row[0] === link.row), `${entry.id} -> ${link.id}: row ${link.row}`)
    }
  }
})
