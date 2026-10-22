import test from 'node:test'
import assert from 'node:assert/strict'
import { indentLines, toggleLineComments } from '../src/lineEdit.js'

test('tab indents the current line and shift-tab removes one level', () => {
  const indented = indentLines('x = 1\ny = 2\n', 0, 0, '    ', false)
  assert.equal(indented.text, '    x = 1\ny = 2\n')
  assert.equal(indented.start, 4)
  const out = indentLines('    x = 1\n    y = 2', 0, 18, '    ', true)
  assert.equal(out.text, 'x = 1\ny = 2')
})

test('tab skips a following line when the selection ends at its start', () => {
  const next = indentLines('a\nb\nc', 0, 2, '    ', false)
  assert.equal(next.text, '    a\nb\nc')
})

test('ctrl-slash toggles a python comment after the indent', () => {
  const on = toggleLineComments('    return 1\n', 4, 4, '#')
  assert.equal(on.text, '    # return 1\n')
  assert.equal(on.start, 6)
  const off = toggleLineComments(on.text, on.start, on.end, '#')
  assert.equal(off.text, '    return 1\n')
  assert.equal(off.start, 4)
})
