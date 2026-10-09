import test from 'node:test'
import assert from 'node:assert/strict'
import { decryptShareText, encryptShareText } from '../src/cryptoShareOps.js'

test('AES share round-trip matches CryptoJS passphrase mode', () => {
  const plain = 'Share this note securely with a friend.'
  const key = 'supercharger-shared-key'
  const cipher = encryptShareText(plain, key)
  assert.notEqual(cipher, plain)
  assert.equal(decryptShareText(cipher, key), plain)
})

test('decryptShareText rejects wrong key', () => {
  const cipher = encryptShareText('hello', 'alpha')
  assert.throws(() => decryptShareText(cipher, 'beta'))
})
