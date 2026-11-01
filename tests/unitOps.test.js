import test from 'node:test'
import assert from 'node:assert/strict'
import { convertUnit, unitGroups } from '../src/unitOps.js'

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < Math.max(1, Math.abs(expected)) * 1e-12, `${actual} != ${expected}`)

test('length uses international metric and imperial definitions', () => {
  close(convertUnit('1', 'length', 'm', 'cm'), 100)
  close(convertUnit('1', 'length', 'in', 'cm'), 2.54)
  close(convertUnit('1', 'length', 'ft', 'in'), 12)
  close(convertUnit('1', 'length', 'yd', 'ft'), 3)
  close(convertUnit('1', 'length', 'mi', 'm'), 1609.344)
  close(convertUnit('1', 'length', 'nmi', 'm'), 1852)
})

test('weight uses avoirdupois ounces and pounds', () => {
  close(convertUnit('1', 'weight', 'kg', 'g'), 1000)
  close(convertUnit('1', 'weight', 'lb', 'kg'), 0.45359237)
  close(convertUnit('1', 'weight', 'lb', 'oz'), 16)
  close(convertUnit('1', 'weight', 'st', 'lb'), 14)
  close(convertUnit('1', 'weight', 't', 'kg'), 1000)
  close(convertUnit('1', 'weight', 'mg', 'kg'), 0.000001)
})

test('Taiwan units use their legal metric definitions', () => {
  close(convertUnit('1', 'weight', 'tkg', 'g'), 600)
  close(convertUnit('1', 'weight', 'tkg', 'tw-tael'), 16)
  close(convertUnit('1', 'weight', 'tw-tael', 'tw-qian'), 10)
  close(convertUnit('1', 'length', 'tw-chi', 'm'), 10 / 33)
  close(convertUnit('1', 'length', 'tw-chi', 'tw-cun'), 10)
  close(convertUnit('121', 'area', 'm2', 'ping'), 36.6025)
  close(convertUnit('1', 'area', 'chia', 'ping'), 2934)
  close(convertUnit('1', 'area', 'ha', 'm2'), 10000)
  close(convertUnit('1', 'area', 'ac', 'ft2'), 43560)
})

test('all unit pairs round-trip, preserve zero, and reject invalid inputs', () => {
  for (const [kind, units] of Object.entries(unitGroups)) {
    for (const from of units) for (const to of units) {
      close(convertUnit(convertUnit(12.5, kind, from.id, to.id), kind, to.id, from.id), 12.5)
      assert.equal(convertUnit(0, kind, from.id, to.id), 0)
    }
  }
  for (const value of ['', ' ', '-1', 'NaN', 'Infinity', null, undefined]) {
    assert.throws(() => convertUnit(value, 'length', 'm', 'cm'))
  }
  assert.throws(() => convertUnit(1, 'length', 'kg', 'm'))
  assert.throws(() => convertUnit(1, 'unknown', 'm', 'cm'))
  assert.throws(() => convertUnit(1e308, 'length', 'km', 'mm'))
})
