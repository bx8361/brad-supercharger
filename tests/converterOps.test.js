import test from 'node:test'
import assert from 'node:assert/strict'
import { describeCron, formatCronRunLocal, nextCronRuns, parseCronExpression } from '../src/cronOps.js'
import { jsonToTable, tableToDelimited } from '../src/jsonTableOps.js'
import { convertFromBase, parseIntegerText } from '../src/numberBaseOps.js'

test('number base converts across four fields', () => {
  assert.equal(parseIntegerText('FF', '16').toString(), '255')
  assert.equal(parseIntegerText('1,234,567', '10').toString(), '1234567')
  const converted = convertFromBase('2026', '10')
  assert.equal(converted[16], '7EA')
  assert.equal(converted[2], '011111101010')
  const formatted = convertFromBase('2026', '10', { formatNumber: true })
  assert.equal(formatted[10], (2026n).toLocaleString())
  assert.equal(formatted[16], '7EA')
  assert.equal(formatted[8], '3 752')
  assert.equal(formatted[2], '0111 1110 1010')
  assert.equal(parseIntegerText('7 EA', '16').toString(), '2026')
})

test('json to table flattens arrays of objects', () => {
  const table = jsonToTable('[{"a":1,"b":2},{"a":3,"c":4}]')
  assert.deepEqual(table.columns, ['a', 'b', 'c'])
  assert.equal(table.rows.length, 2)
  assert.equal(tableToDelimited(table), 'a,b,c\n1,2,\n3,,4')
})

test('cron parser describes weekday schedules', () => {
  const parsed = parseCronExpression('0 9 * * 1-5')
  assert.match(describeCron(parsed), /09:00/)
  const runs = nextCronRuns('0 9 * * 1-5', 3, new Date('2026-01-05T08:00:00'))
  assert.equal(runs.length, 3)
  assert.equal(runs[0].getHours(), 9)
  assert.equal(runs[0].getMinutes(), 0)
  assert.match(formatCronRunLocal(runs[0]), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
})
