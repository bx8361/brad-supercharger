import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/toolViews.jsx', import.meta.url), 'utf8')
const body = src.match(/function paneRatio\([\s\S]*?\n\}/)[0]
const paneRatio = new Function(`${body}; return paneRatio`)()

test('drag position becomes a left/right ratio and stays inside the panes', () => {
  assert.equal(paneRatio(400, 814), 1)
  assert.equal(paneRatio(0, 814), 140 / (800 - 140))
  assert.equal(paneRatio(900, 814), (800 - 140) / 140)
  assert.equal(paneRatio(200, 200), 1)
})
