import test from 'node:test'
import assert from 'node:assert/strict'
import { rasterSize, svgIntrinsicSize } from '../src/imageOps.js'

test('svg raster size uses width, height, or viewBox', () => {
  assert.deepEqual(svgIntrinsicSize('<svg width="10" height="20"></svg>'), { width: 10, height: 20 })
  assert.deepEqual(svgIntrinsicSize('<svg viewBox="0 0 24 24"></svg>'), { width: 24, height: 24 })
  assert.deepEqual(svgIntrinsicSize('<svg width="100%" viewBox="0 0 8 4"></svg>'), { width: 8, height: 4 })
  assert.deepEqual(rasterSize({ width: 10, height: 20 }, '', ''), { width: 10, height: 20 })
  assert.deepEqual(rasterSize({ width: 10, height: 20 }, '5', ''), { width: 5, height: 10 })
  assert.deepEqual(rasterSize({ width: 10, height: 20 }, '', '40'), { width: 20, height: 40 })
  assert.deepEqual(rasterSize({ width: 10, height: 20 }, '3', '7'), { width: 3, height: 7 })
  assert.deepEqual(rasterSize({ width: 20000, height: 10000 }, '', ''), { width: 8192, height: 4096 })
})
