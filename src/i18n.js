import { ja } from './messages/ja.js'
import { zhHans } from './messages/zh-Hans.js'
import { zhHant } from './messages/zh-Hant.js'

export const LOCALES = [
  { id: 'en', label: 'English' },
  { id: 'zh-Hant', label: '繁體中文' },
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'ja', label: '日本語' },
]

const packs = { 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja }
const ids = new Set(LOCALES.map(item => item.id))

export function knownLocale(value) {
  return ids.has(value) ? value : ''
}

export function detectLocale(languages = typeof navigator === 'undefined' ? ['en'] : (navigator.languages?.length ? navigator.languages : [navigator.language])) {
  for (const raw of languages || []) {
    const tag = String(raw || '').toLowerCase().replaceAll('_', '-')
    if (tag.startsWith('zh') || tag.startsWith('yue')) {
      if (/(hant|tw|hk|mo|yue)/.test(tag)) return 'zh-Hant'
      return 'zh-Hans'
    }
    if (tag.startsWith('ja')) return 'ja'
    if (tag.startsWith('en')) return 'en'
  }
  return 'en'
}

let locale = 'en'
const listeners = new Set()

export function getLocale() { return locale }

export function setLocaleQuiet(next) {
  locale = knownLocale(next) || 'en'
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export function refreshLocale() { listeners.forEach(fn => fn()) }

export function subscribeLocale(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ponytail: English source is the key. Missing keys stay English.
export function t(text, vars) {
  if (text == null || text === '') return text ?? ''
  const key = String(text)
  const table = packs[locale]
  let out = table && Object.hasOwn(table, key) ? table[key] : key
  if (vars) for (const [name, value] of Object.entries(vars)) out = out.replaceAll(`{${name}}`, String(value))
  return out
}
