import test from 'node:test'
import assert from 'node:assert/strict'
import { detectLocale, knownLocale, t, setLocaleQuiet } from '../src/i18n.js'

test('first-run detection maps browser languages', () => {
  assert.equal(detectLocale(['zh-TW', 'en']), 'zh-Hant')
  assert.equal(detectLocale(['zh-HK']), 'zh-Hant')
  assert.equal(detectLocale(['zh-Hant']), 'zh-Hant')
  assert.equal(detectLocale(['yue-HK']), 'zh-Hant')
  assert.equal(detectLocale(['zh-CN', 'en-US']), 'zh-Hans')
  assert.equal(detectLocale(['zh-SG']), 'zh-Hans')
  assert.equal(detectLocale(['zh']), 'zh-Hans')
  assert.equal(detectLocale(['ja-JP']), 'ja')
  assert.equal(detectLocale(['en-GB', 'zh-TW']), 'en')
  assert.equal(detectLocale(['fr', 'de']), 'en')
  assert.equal(detectLocale([]), 'en')
})

test('unknown locale ids are rejected and English is the fallback', () => {
  assert.equal(knownLocale('zh-Hans'), 'zh-Hans')
  assert.equal(knownLocale('zh'), '')
  setLocaleQuiet('nope')
  assert.equal(t('Home'), 'Home')
  setLocaleQuiet('zh-Hans')
  assert.equal(t('Home'), '首页')
  assert.equal(t('{count} PINNED', { count: 2 }), '已固定 2')
  setLocaleQuiet('en')
})
