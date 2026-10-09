import test from 'node:test'
import assert from 'node:assert/strict'
import { emptySaved, persistedSaved, readSaved } from '../src/persistence.js'

const tools = {
  json: { input: 'private JSON', mode: 'minify', indent: '4' },
  jwt: { input: 'private token' },
  password: { output: 'private password', length: 24, sets: ['Numbers'], count: '5' },
  regex: { input: 'private text', pattern: 'private pattern', ignoreCase: true, multiline: true },
  compare: { left: 'private original', right: 'private revision', mode: 'lines' },
  futureTool: { input: 'private future input', newField: 'private future field' },
}
const state = { ...emptySaved, tools, favorites: ['json'], recent: ['regex'], theme: 'light', collapsedSections: { text: true } }
const storage = value => ({ getItem: () => JSON.stringify(value) })

test('saving is off by default; only known non-sensitive options persist', () => {
  const saved = persistedSaved(state)
  assert.equal(saved.saveSensitiveData, false)
  assert.deepEqual(saved.tools, {
    json: { mode: 'minify', indent: '4' }, password: { length: 24, sets: ['Numbers'], count: '5' },
    regex: { ignoreCase: true, multiline: true }, compare: { mode: 'lines' },
  })
  for (const key of ['favorites', 'recent', 'theme', 'collapsedSections']) assert.deepEqual(saved[key], state[key])
  assert.equal(state.tools.password.output, 'private password')
})

test('explicit opt-in saves and restores tool text', () => {
  const saved = persistedSaved({ ...state, saveSensitiveData: true })
  assert.deepEqual(saved.tools, tools)
  assert.deepEqual(readSaved(storage(saved)).tools, tools)
})

test('turning saving off removes stored text while preserving session text and preferences', () => {
  let stored = persistedSaved({ ...state, saveSensitiveData: true })
  const session = { ...readSaved(storage(stored)), saveSensitiveData: false }
  stored = persistedSaved(session)
  assert.equal(session.tools.json.input, 'private JSON')
  assert.equal(stored.tools.json.input, undefined)
  assert.equal(readSaved(storage(stored)).tools.password.output, undefined)
  assert.deepEqual(stored.favorites, state.favorites)
  assert.equal(stored.tools.json.indent, '4')
})

test('legacy data defaults to off and discards sensitive fields', () => {
  const restored = readSaved(storage({ version: 1, tools, favorites: ['json'] }))
  assert.equal(restored.saveSensitiveData, false)
  assert.equal(restored.tools.json.input, undefined)
  assert.equal(restored.tools.password.output, undefined)
  assert.deepEqual(restored.favorites, ['json'])
  assert.equal(restored.tools.json.mode, 'minify')
})

test('truthy non-boolean values do not grant consent', () => {
  for (const saveSensitiveData of ['true', 1, {}, null]) {
    assert.equal(readSaved(storage({ version: 1, tools, saveSensitiveData })).tools.json.input, undefined)
  }
})

test('missing, corrupt, or inaccessible storage uses private defaults', () => {
  for (const source of [storage(null), { getItem: () => '{broken' }, { getItem: () => { throw new Error('Unavailable') } }]) {
    assert.equal(readSaved(source).saveSensitiveData, false)
    assert.deepEqual(readSaved(source).tools, {})
  }
})


test('workspace dimensions survive reload without saving tool text', () => {
  const saved = persistedSaved({ ...state, sidebarWidth: 340, tools: {
    json: { input: 'private JSON', workspaceHeight: 800 },
    password: { output: 'private password', workspaceHeight: 450 },
  } })
  const restored = readSaved(storage(saved))
  assert.equal(restored.sidebarWidth, 340)
  assert.deepEqual(restored.tools, { json: { workspaceHeight: 800 }, password: { workspaceHeight: 450 } })
})
