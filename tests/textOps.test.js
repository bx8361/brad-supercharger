import test from 'node:test'
import assert from 'node:assert/strict'
import { analyze, compareChangeParts, compareLists, escapeString, lineEnding, sideBySideRows, toCamel, toSnake, unescapeString } from '../src/textOps.js'

test('json escape round-trips quotes and newlines', () => {
  const raw = 'Say "hello"\nnext'
  assert.equal(escapeString(raw), 'Say \\"hello\\"\\nnext')
  assert.equal(unescapeString(escapeString(raw)), raw)
})

test('xml escape and unescape', () => {
  assert.equal(escapeString('<a b="c">', 'xml'), '&lt;a b=&quot;c&quot;&gt;')
  assert.equal(unescapeString('&lt;a&amp;b&gt;', 'xml'), '<a&b>')
})

test('list compare keeps first-seen lines', () => {
  assert.deepEqual(compareLists('a\nb\na', 'b\nc', 'both'), ['b'])
  assert.deepEqual(compareLists('a\nb', 'B\nc', 'a', true), ['a'])
  assert.deepEqual(compareLists('a\nb', 'b\nc', 'union'), ['a', 'b', 'c'])
})

test('side by side keeps one row per source line', () => {
  const left = 'The quick brown fox\njumps over the lazy dog.\nSee you soon.'
  const right = 'The quick red fox\njumps over the lazy dog!\nSee you later.'
  const rows = sideBySideRows(left, right, 'words')
  const text = parts => (parts || []).map(part => part.text).join('')
  assert.equal(rows.length, 3)
  assert.equal(text(rows[0].left), 'The quick brown fox')
  assert.equal(text(rows[0].right), 'The quick red fox')
  assert.equal(rows[0].left.find(part => part.kind === 'remove').text, 'brown')
  assert.equal(rows[0].right.find(part => part.kind === 'add').text, 'red')
  assert.equal(text(rows[2].left), 'See you soon.')
  const inserted = sideBySideRows('a\nc', 'a\nb\nc', 'lines')
  assert.equal(inserted[1].left, null)
  assert.equal(text(inserted[1].right), 'b')
  assert.deepEqual(inserted.map(row => row.kind), ['same', 'add', 'same'])
})

test('compare options ignore leading, trailing, and embedded spaces, case, and newline characters', () => {
  const text = rows => rows.map(row => ({
    l: (row.left || []).map(part => part.kind + ':' + part.text).join('|'),
    r: (row.right || []).map(part => part.kind + ':' + part.text).join('|'),
  }))
  assert.deepEqual(text(sideBySideRows('  cat', 'cat', 'lines', { lead: true })), [{ l: 'same:  cat', r: 'same:cat' }])
  assert.deepEqual(text(sideBySideRows('cat  ', 'cat', 'lines', { trail: true })), [{ l: 'same:cat  ', r: 'same:cat' }])
  assert.deepEqual(text(sideBySideRows('a b', 'ab', 'lines', { embedded: true })), [{ l: 'same:a b', r: 'same:ab' }])
  assert.deepEqual(text(sideBySideRows('Cat', 'cat', 'lines', { ignoreCase: true })), [{ l: 'same:Cat', r: 'same:cat' }])
  assert.deepEqual(text(sideBySideRows('a\r\nb', 'a\nb', 'lines', { ignoreNewlines: true })), [
    { l: 'same:a', r: 'same:a' },
    { l: 'same:b', r: 'same:b' },
  ])
  assert.deepEqual(text(sideBySideRows('  cat', '  dog', 'words', { lead: true })), [{ l: 'same:  |remove:cat', r: 'same:  |add:dog' }])
  const inline = compareChangeParts('  Cat\nfoo bar', 'cat\nfoobar', 'words', { lead: true, embedded: true, ignoreCase: true })
  assert.equal(inline.some(part => part.added || part.removed), false)
  const endings = compareChangeParts('a\r\nb', 'a\nb', 'lines', { ignoreNewlines: true })
  assert.equal(endings.some(part => part.added || part.removed), false)
})

test('case splits and line endings', () => {
  assert.equal(toSnake('myExampleInput'), 'my_example_input')
  assert.equal(toCamel('my_example_input'), 'myExampleInput')
  assert.equal(lineEnding('a\r\nb\nc'), 'Mixed')
  assert.equal(analyze('a a').unique, 1)
  assert.equal(analyze('a a').words, 2)
})
