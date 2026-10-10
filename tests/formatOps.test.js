import test from 'node:test'
import assert from 'node:assert/strict'
import { formatJson, formatSql, formatXml } from '../src/formatOps.js'
import { findRanges, paint } from '../src/highlight.js'

test('json sort orders keys at every level', () => {
  const input = '{"b":1,"a":{"z":true,"m":[ {"d":1,"c":2} ]}}'
  assert.equal(formatJson(input, { sort: true, indent: '2' }), `{
  "a": {
    "m": [
      {
        "c": 2,
        "d": 1
      }
    ],
    "z": true
  },
  "b": 1
}`)
})

test('json repair fixes quotes, trailing commas, and comments without requiring strict input', () => {
  const input = `{
'this_is_key': 'value', // comment
'this_is_key2': 'value', /*..*/
}`
  assert.equal(formatJson(input, { repair: true, indent: '2' }), `{
  "this_is_key": "value",
  "this_is_key2": "value"
}`)
  assert.equal(formatJson(`{a: 1, b: 'say "hi"', c: True,}`, { repair: true, mode: 'minify' }), '{"a":1,"b":"say \\"hi\\"","c":true}')
  assert.equal(formatJson('{"url": "https://x.com", "note": "/* keep */",}', { repair: true, mode: 'minify' }), '{"url":"https://x.com","note":"/* keep */"}')
  assert.throws(() => formatJson(input), /JSON/)
})

test('sql formatter uppercases keywords and can lead with commas', () => {
  const formatted = formatSql('select id, name from users', { indent: '2' })
  assert.match(formatted, /SELECT/)
  assert.match(formatted, /FROM/)
  const leading = formatSql('select id, name from users', { leadingComma: true })
  assert.match(leading, /\n\s+, name/)
})

test('xml formatter indents and can break attributes', () => {
  const input = '<?xml version="1.0"?><root><item id="1">Ada</item></root>'
  assert.equal(formatXml(input), `<?xml version="1.0"?>
<root>
  <item id="1">Ada</item>
</root>`)
  assert.equal(formatXml('<root><item id="1">Ada</item></root>', { newlineOnAttributes: true }), `<root>
  <item
    id="1">Ada</item>
</root>`)
  assert.equal(formatXml('<root> <item>Ada</item> </root>', { indent: 'minify' }), '<root><item>Ada</item></root>')
  assert.throws(() => formatXml('<root></nope>'), /Expected <\/root>/)
})

test('find ranges and highlight marks cover the query', () => {
  assert.deepEqual(findRanges('Ab ab', 'ab'), [{ start: 0, end: 2 }, { start: 3, end: 5 }])
  const parts = paint('{"a":1}', 'json', findRanges('{"a":1}', 'a'), 0)
  const commented = paint('{ "a": 1, // note\n "b": "http://x" /* keep */ }', 'json')
  assert.deepEqual(commented.filter(part => part.kind === 'comment').map(part => part.text), ['// note', '/* keep */'])
  assert.equal(parts.map(part => part.text).join(''), '{"a":1}')
  assert.equal(parts.find(part => part.find).text, 'a')
})
