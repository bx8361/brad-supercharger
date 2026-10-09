import { lipsumCorpora } from './lipsumCorpora.js'

const GREGORIAN_START_MS = Date.UTC(1582, 9, 15) // 1582-10-15 UTC
const LOREM_IPSUM_START = 'Lorem ipsum dolor sit amet'

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min))
}

function randomElement(list) {
  return list[randomInt(0, list.length)]
}

function prepareWords(text) {
  return text.split(/\s+/).filter(word => word.trim())
}

function formatSentence(text) {
  if (!text) return ''
  return `${text[0].toUpperCase()}${text.slice(1)}.`
}

function applyStartWords(startText, originalText) {
  const startTokens = startText.split(/\s+/).filter(Boolean)
  const endTokens = originalText.split(/\s+/).filter(Boolean)
  const wordsNeeded = Math.min(startTokens.length, endTokens.length)
  return [...startTokens.slice(0, wordsNeeded), ...endTokens.slice(wordsNeeded)].join(' ')
}

function generateWords(preparedWords, count) {
  return Array.from({ length: count }, () => randomElement(preparedWords))
}

function generateSentences(preparedWords, count) {
  return Array.from({ length: count }, () => {
    const words = generateWords(preparedWords, randomInt(3, 20))
    return formatSentence(words.join(' '))
  })
}

function generateParagraphs(preparedWords, count) {
  return Array.from({ length: count }, () => {
    const sentences = generateSentences(preparedWords, randomInt(3, 20))
    return sentences.join(' ')
  })
}

export function generateLipsum(corpusId, unit, count) {
  const corpus = lipsumCorpora[corpusId] || lipsumCorpora.loremipsum
  const preparedWords = prepareWords(corpus.text)
  const amount = Math.max(1, Math.min(5000, count))
  let result
  if (unit === 'words') {
    result = `${generateWords(preparedWords, amount).join(' ')}.`
  } else if (unit === 'sentences') {
    result = generateSentences(preparedWords, amount).join(' ')
  } else {
    result = generateParagraphs(preparedWords, amount).join('\n\n')
  }
  if (corpusId === 'loremipsum' && (unit === 'sentences' || unit === 'paragraphs')) {
    result = applyStartWords(LOREM_IPSUM_START, result)
  }
  return result.trim()
}

export function compareDigests(computed, expected) {
  const a = (computed || '').trim()
  const b = (expected || '').trim()
  if (!a || !b) return null
  return a.toLowerCase() === b.toLowerCase()
}

function formatGuidBytes(bytes, hyphens) {
  const hex = (start, end, reverse = false) => {
    const slice = [...bytes.slice(start, end)]
    if (reverse) slice.reverse()
    return slice.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  const formatted = `${hex(0, 4, true)}-${hex(4, 6, true)}-${hex(6, 8, true)}-${hex(8, 10)}-${hex(10, 16)}`
  return hyphens ? formatted : formatted.replace(/-/g, '')
}

function formatUuidFromBytes(bytes, hyphens) {
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  const formatted = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  return hyphens ? formatted : formatted.replace(/-/g, '')
}

function generateUuidV1() {
  const bytes = new Uint8Array(16)
  const ticks = BigInt(Date.now() - GREGORIAN_START_MS) * 10000n
  const timestamp = new Uint8Array(8)
  let value = ticks
  for (let i = 0; i < 8; i++) {
    timestamp[i] = Number(value & 0xffn)
    value >>= 8n
  }
  bytes.set(timestamp, 0)
  crypto.getRandomValues(bytes.subarray(10, 16))
  crypto.getRandomValues(bytes.subarray(8, 10))
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  bytes[7] = (bytes[7] & 0x0f) | 0x10
  return bytes
}

function generateUuidV7() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const timestamp = Date.now()
  bytes[0] = (timestamp >> 40) & 0xff
  bytes[1] = (timestamp >> 32) & 0xff
  bytes[2] = (timestamp >> 24) & 0xff
  bytes[3] = (timestamp >> 16) & 0xff
  bytes[4] = (timestamp >> 8) & 0xff
  bytes[5] = timestamp & 0xff
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return bytes
}

export function generateUuid(version, hyphens = true, uppercase = false) {
  let formatted
  if (version === '1') {
    formatted = formatGuidBytes(generateUuidV1(), hyphens)
  } else if (version === '7') {
    formatted = formatUuidFromBytes(generateUuidV7(), hyphens)
  } else {
    formatted = hyphens ? crypto.randomUUID() : crypto.randomUUID().replace(/-/g, '')
  }
  return uppercase ? formatted.toUpperCase() : formatted.toLowerCase()
}
