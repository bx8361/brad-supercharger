import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  compressGzip,
  decodeBase64,
  decodeCertificate,
  decodeHtml,
  decodeJwt,
  decodeUrl,
  decompressGzip,
  encodeBase64,
  encodeHtml,
  encodeJwtHs,
  encodeUrl,
  convertBase64Text,
  convertUrl,
  formatJwtDecoded,
} from '../src/encodeOps.js'

const pemSample = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../references/DevToys.Tools/src/DevToys.Tools.UnitTests/Tools/TestData/CertificateDecoder/PemCertPublic.txt'), 'utf8')

test('base64 round-trips unicode text', () => {
  const raw = 'Power up your workflow ⚡'
  assert.equal(decodeBase64(encodeBase64(raw)), raw)
})

test('base64 ascii encoding matches DevToys samples', () => {
  assert.equal(encodeBase64('Hello World! é)à', 'ascii'), 'SGVsbG8gV29ybGQhID8pPw==')
  assert.equal(decodeBase64('SGVsbG8gV29ybGQhID8pPw==', 'ascii'), 'Hello World! ?)?')
})

test('base64 multiline converts each line like DevToys', () => {
  const input = 'A\nB'
  const encoded = convertBase64Text(input, 'utf8', 'encode', true)
  assert.equal(encoded, `${encodeBase64('A')}\n${encodeBase64('B')}`)
  assert.equal(convertBase64Text(encoded, 'utf8', 'decode', true), input)
  assert.equal(convertBase64Text(`@@@\n${encodeBase64('ok')}`, 'utf8', 'decode', true), '<Invalid Base64>\nok')
  assert.equal(convertBase64Text(input, 'utf8', 'encode', false), encodeBase64(input))
})

test('url multiline converts each line like DevToys', () => {
  assert.equal(convertUrl('a b\nc d', 'encode', true), 'a%20b\nc%20d')
  assert.equal(convertUrl('a%20b\nc%20d', 'decode', true), 'a b\nc d')
  assert.equal(convertUrl('a b\nc d', 'encode', false), encodeUrl('a b\nc d'))
})

test('url encode and decode like DevToys', () => {
  assert.equal(encodeUrl('<hello world>'), '%3Chello%20world%3E')
  assert.equal(decodeUrl('%3Chello%20world%3E'), '<hello world>')
  assert.equal(encodeUrl('%3Chello%20world%3E'), '%253Chello%2520world%253E')
})

test('html escape and decode entities like DevToys', () => {
  assert.equal(encodeHtml('<hello world>'), '&lt;hello world&gt;')
  assert.equal(encodeHtml('&lt;hello&gt;'), '&amp;lt;hello&amp;gt;')
  assert.equal(decodeHtml('&lt;hello world&gt;'), '<hello world>')
})

test('gzip compresses to base64 and round-trips text', async () => {
  const sample = 'Hello World! é)à'
  const compressed = await compressGzip(sample)
  assert.ok(compressed.data.length > 0)
  const restored = await decompressGzip(compressed.data)
  assert.equal(restored.data, sample)
  assert.equal((await decompressGzip('Hello')).data, 'Invalid GZip data.')
})

test('jwt decode and hs256 encode', async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJicmFkIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQ3MDAwMDAwMDB9.signature-is-not-verified'
  const decoded = decodeJwt(token)
  assert.equal(decoded.header.alg, 'HS256')
  assert.equal(decoded.claims.sub, 'brad')
  assert.match(formatJwtDecoded(decoded, 0), /Expires/)
  const signed = await encodeJwtHs({ payload: { sub: 'demo' }, secret: 'test-secret', algorithm: 'HS256' })
  const parts = signed.split('.')
  assert.equal(parts.length, 3)
  assert.equal(decodeJwt(signed).claims.sub, 'demo')
})

test('certificate decoder reads pem sample', () => {
  const text = decodeCertificate(pemSample)
  assert.match(text, /Subject:/)
  assert.match(text, /Issuer:/)
})
