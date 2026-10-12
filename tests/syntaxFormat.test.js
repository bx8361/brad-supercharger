import test from 'node:test'
import assert from 'node:assert/strict'
import { flattenHighlight } from '../src/highlight.js'
import { formatSyntax } from '../src/syntaxFormat.js'
import { syntaxLanguage } from '../src/syntaxLanguages.js'

test('flatten highlight keeps parent token kind around nested text', () => {
  const parts = flattenHighlight({
    type: 'element',
    children: [
      { type: 'text', value: 'const ' },
      { type: 'element', properties: { className: ['token', 'keyword'] }, children: [{ type: 'text', value: 'let' }] },
    ],
  })
  assert.deepEqual(parts, [{ text: 'const ' }, { kind: 'keyword', text: 'let' }])
})

test('refractor javascript tokens cover the source', async () => {
  const { refractor } = await import('refractor')
  const parts = flattenHighlight(refractor.highlight('const n = 1', 'javascript'))
  assert.equal(parts.map(part => part.text).join(''), 'const n = 1')
  assert.ok(parts.some(part => part.kind === 'keyword'))
})

test('javascript format breaks a one-line function', async () => {
  const formatted = await formatSyntax('function greet(name){return name}', syntaxLanguage('javascript'), '2')
  assert.match(formatted, /function greet\(name\) \{\n {2}return name;\n\}/)
})

test('python highlights but does not format', async () => {
  assert.equal(syntaxLanguage('python').format, '')
  await assert.rejects(() => formatSyntax('x=1', syntaxLanguage('python')), /not available/)
})
