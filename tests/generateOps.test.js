import assert from 'node:assert/strict'
import test from 'node:test'
import { compareDigests, generateLipsum, generateUuid } from '../src/generateOps.js'
import { lipsumCorpora, lipsumCorpusIds } from '../src/lipsumCorpora.js'

test('compareDigests is case-insensitive and ignores surrounding space', () => {
  assert.equal(compareDigests('AbCd', 'abcd'), true)
  assert.equal(compareDigests('  deadbeef  ', 'DEADBEEF'), true)
  assert.equal(compareDigests('aaa', 'bbb'), false)
  assert.equal(compareDigests('', 'aaa'), null)
})

test('generateLipsum uses corpus text and lorem ipsum opener', () => {
  const text = generateLipsum('loremipsum', 'sentences', 2)
  assert.ok(text.startsWith('Lorem ipsum dolor sit amet'))
  assert.ok(text.includes('.'))
})

test('every lipsum corpus has words', () => {
  for (const id of lipsumCorpusIds) {
    assert.ok(lipsumCorpora[id].text.length > 20, id)
    assert.ok(generateLipsum(id, 'words', 5).length > 0, id)
  }
})

const uuidVersions = ['1', '4', '7']
for (const version of uuidVersions) {
  for (const hyphens of [true, false]) {
    for (const uppercase of [true, false]) {
      test(`generateUuid v${version} hyphens=${hyphens} uppercase=${uppercase}`, () => {
        const uuid = generateUuid(version, hyphens, uppercase)
        assert.equal(uuid.includes('-'), hyphens)
        assert.equal(uuid.length, hyphens ? 36 : 32)
        assert.equal(uuid, uppercase ? uuid.toUpperCase() : uuid.toLowerCase())
        const pattern = new RegExp(`^[0-9a-f]{8}-?[0-9a-f]{4}-?${version}[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$`, 'i')
        assert.match(uuid.toLowerCase(), pattern)
      })
    }
  }
}
