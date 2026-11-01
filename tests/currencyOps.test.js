import test from 'node:test'
import assert from 'node:assert/strict'
import { convertCurrency, loadCurrencyRate, loadCurrencies } from '../src/currencyOps.js'

test('currency conversion handles zero, fractional rates, and invalid amounts', () => {
  assert.equal(convertCurrency('100', 32.5), 3250)
  assert.equal(convertCurrency('0', 32.5), 0)
  assert.equal(convertCurrency('12.5', 0.8), 10)
  for (const amount of ['', ' ', '-1', 'abc', 'Infinity']) assert.throws(() => convertCurrency(amount, 1))
  assert.throws(() => convertCurrency('1e308', 100))
  assert.throws(() => convertCurrency('1', 0))
})

test('rate loading validates the service response and skips same-currency requests', async t => {
  const rate = { base: 'USD', quote: 'TWD', rate: 32.5, date: '2026-10-30' }
  const requests = []
  t.mock.method(globalThis, 'fetch', async url => {
    requests.push(url)
    return { ok: true, json: async () => rate }
  })
  assert.deepEqual(await loadCurrencyRate('USD', 'USD'), { base: 'USD', quote: 'USD', rate: 1, date: null })
  assert.equal(requests.length, 0)
  assert.deepEqual(await loadCurrencyRate('USD', 'TWD'), rate)
  assert.equal(requests[0], 'https://api.frankfurter.dev/v2/rate/USD/TWD')
  rate.quote = 'EUR'
  await assert.rejects(loadCurrencyRate('USD', 'TWD'), /invalid data/)
  await assert.rejects(loadCurrencyRate('../USD', 'TWD'), /valid currencies/)
  await assert.rejects(loadCurrencies(), /invalid data/)
  globalThis.fetch.mock.mockImplementation(async () => ({ ok: false }))
  await assert.rejects(loadCurrencyRate('USD', 'TWD'), /Could not load/)
})
