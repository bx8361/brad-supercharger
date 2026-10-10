export const STORAGE_KEY = 'brads-supercharger:v1'
export const emptySaved = {
  theme: 'system', favorites: [], recent: [], tools: {}, collapsedSections: {},
  saveSensitiveData: false, sidebarWidth: 260, alwaysIncognito: false,
}

// Only known tool options may be saved without consent. New fields default to private.
const toolOptions = {
  json: ['mode', 'indent', 'sort', 'repair'], sql: ['language', 'indent', 'leadingComma'], xml: ['indent', 'newlineOnAttributes'],
  base64: ['mode'], url: ['mode', 'direction'],
  html: ['direction'], timestamp: ['mode'],
  cron: ['count'], 'json-table': ['format'], yaml: ['direction', 'indent'],
  'number-base': ['formatNumber'],
  uuid: ['count', 'version', 'hyphens', 'uppercase'], hash: ['algorithm'], password: ['length', 'count', 'sets'],
  lorem: ['count', 'unit', 'corpus'],
  'image-converter': ['format'],
  jsonpath: ['query'],
  regex: ['flavor', 'mode', 'allMatches', 'ignoreCase', 'ignoreWhitespace', 'multiline', 'dotAll', 'singleline', 'rightToLeft', 'unicode'],
  compare: ['mode', 'layout'],
  escape: ['direction', 'format'], list: ['mode', 'ignoreCase'],
}

export function persistedSaved(saved) {
  const saveSensitiveData = saved.saveSensitiveData === true
  const tools = saveSensitiveData ? saved.tools : Object.fromEntries(
    Object.entries(saved.tools || {}).flatMap(([id, data]) => {
      const options = Object.fromEntries([...(toolOptions[id] || []), 'wrap', 'workspaceHeight']
        .filter(key => Object.hasOwn(data || {}, key)).map(key => [key, data[key]]))
      return Object.keys(options).length ? [[id, options]] : []
    }),
  )
  return {
    version: 1, theme: saved.theme, favorites: saved.favorites, recent: saved.recent,
    collapsedSections: saved.collapsedSections, sidebarWidth: saved.sidebarWidth, saveSensitiveData,
    alwaysIncognito: saved.alwaysIncognito === true, tools,
  }
}

// ponytail: incognito is session-only; alwaysIncognito is the one field written back so the next launch stays blank
export function writeSaved(saved, { incognito = false, storage = localStorage } = {}) {
  const alwaysIncognito = saved.alwaysIncognito === true
  const next = incognito ? persistedSaved({ ...readSaved(storage), alwaysIncognito }) : persistedSaved(saved)
  storage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function sessionFromSaved(stored) {
  if (stored.alwaysIncognito !== true) return { incognito: false, saved: stored }
  return { incognito: true, saved: { ...emptySaved, alwaysIncognito: true } }
}

export function readSaved(storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || 'null')
    if (!value || value.version !== 1) return emptySaved
    return persistedSaved({ ...emptySaved, ...value })
  } catch { return emptySaved }
}
