import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createChineseConverter } from '../src/chineseOps.js'

const read = file => readFileSync(new URL(`../third-party/simplified-traditional-chinese/${file}`, import.meta.url), 'utf8')
const resources = Object.fromEntries([
  'CJK_Compatibility_Ideographs', 'STPhrases', 'STPhrases_GeneratedFromRegionalPhrases',
  'STCharacters', 'TSPhrases', 'TSCharactersExt', 'TSCharacters',
].map(name => [`${name}.txt`, read(`${name}.txt`)]))
const s2t = createChineseConverter(JSON.parse(read('s2t.json')), resources)
const t2s = createChineseConverter(JSON.parse(read('t2s.json')), resources)

test('Chinese conversion resolves phrases in both directions and preserves other text', () => {
  assert.equal(s2t('理发师剪头发，经济在发展。皇后在后面，干杯后继续工作。'),
    '理髮師剪頭髮，經濟在發展。皇后在後面，乾杯後繼續工作。')
  assert.equal(t2s('乾坤、乾杯、頭髮、發展、皇后、後面'), '乾坤、干杯、头发、发展、皇后、后面')
  assert.equal(s2t('一出剧场，一出剧。'), '一出劇場，一齣劇。')
  assert.equal(s2t('Hello 😀 𠮷\t头发\r\n发展 123'), 'Hello 😀 𠮷\t頭髮\r\n發展 123')
  assert.equal(t2s('車'), '车')
  assert.equal(s2t(''), '')
  assert.equal(t2s(''), '')
})
