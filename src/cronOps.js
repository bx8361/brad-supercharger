import { t } from './i18n.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const FIELD_META_5 = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day of week', min: 0, max: 7 },
]

const FIELD_META_6 = [
  { name: 'second', min: 0, max: 59 },
  ...FIELD_META_5,
]

const MONTH_ALIASES = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 }
const DOW_ALIASES = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }

function tokenToNumber(token, min, max, aliases) {
  const upper = token.toUpperCase()
  if (aliases?.[upper] != null) return aliases[upper]
  const n = Number(token)
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Value "${token}" is out of range (${min}-${max}).`)
  return n
}

function steppedRange(start, end, step) {
  const out = []
  for (let n = start; n <= end; n += step) out.push(n)
  return out
}

function expandSegment(segment, min, max, aliases, step = 1) {
  if (!segment) throw new Error('Empty list item in cron field.')
  if (segment === '*') return steppedRange(min, max, step)
  if (segment.includes('/')) throw new Error(`Invalid segment "${segment}".`)
  if (segment.includes('-')) {
    const [startText, endText] = segment.split('-')
    const start = tokenToNumber(startText, min, max, aliases)
    const end = tokenToNumber(endText, min, max, aliases)
    if (end < start) throw new Error(`Invalid range "${segment}".`)
    return steppedRange(start, end, step)
  }
  const value = tokenToNumber(segment, min, max, aliases)
  return step === 1 ? [value] : steppedRange(value, max, step)
}

function expandPart(part, min, max, aliases) {
  if (part === '?' || part === '*') return null
  const slash = part.indexOf('/')
  const rangePart = slash === -1 ? part : part.slice(0, slash)
  const step = slash === -1 ? 1 : Number(part.slice(slash + 1))
  if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step in "${part}".`)

  if (rangePart === '*') return steppedRange(min, max, step)

  const values = new Set()
  for (const segment of rangePart.split(',')) values.add(...expandSegment(segment, min, max, aliases, step))
  return [...values].sort((a, b) => a - b)
}

function parseField(text, meta, aliases) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error(`Missing ${meta.name}.`)
  if (trimmed === '?' || trimmed === '*') return { any: true, values: null }
  const values = expandPart(trimmed, meta.min, meta.max, aliases)
  if (meta.name === 'day of week') {
    return { any: false, values: new Set(values.map(v => (v === 7 ? 0 : v))) }
  }
  return { any: false, values: new Set(values) }
}

export function parseCronExpression(expression) {
  const parts = expression.trim().split(/\s+/).filter(Boolean)
  if (parts.length !== 5 && parts.length !== 6) {
    throw new Error('Use 5 fields (minute hour day month weekday) or 6 fields with seconds.')
  }
  const meta = parts.length === 6 ? FIELD_META_6 : FIELD_META_5
  const aliasesByField = {
    month: MONTH_ALIASES,
    'day of week': DOW_ALIASES,
  }
  const fields = meta.map((fieldMeta, index) => parseField(parts[index], fieldMeta, aliasesByField[fieldMeta.name]))
  return { parts, meta, fields, hasSeconds: parts.length === 6 }
}

function fieldMatches(field, value) {
  if (field.any) return true
  return field.values.has(value)
}

function domDowMatch(domField, dowField, day, dow) {
  const domRestricted = !domField.any
  const dowRestricted = !dowField.any
  if (!domRestricted && !dowRestricted) return true
  if (domRestricted && dowRestricted) return fieldMatches(domField, day) || fieldMatches(dowField, dow)
  if (domRestricted) return fieldMatches(domField, day)
  return fieldMatches(dowField, dow)
}

function matchesDate(date, parsed) {
  const second = date.getSeconds()
  const minute = date.getMinutes()
  const hour = date.getHours()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const dow = date.getDay()
  if (parsed.hasSeconds && !fieldMatches(parsed.fields[0], second)) return false
  const base = parsed.hasSeconds ? 1 : 0
  if (!fieldMatches(parsed.fields[base], minute)) return false
  if (!fieldMatches(parsed.fields[base + 1], hour)) return false
  if (!fieldMatches(parsed.fields[base + 3], month)) return false
  const domField = parsed.fields[base + 2]
  const dowField = parsed.fields[base + 4]
  return domDowMatch(domField, dowField, day, dow)
}

function describeList(field, formatter) {
  if (field.any) return t('every value')
  const items = [...field.values].sort((a, b) => a - b).map(formatter)
  if (items.length === 1) return items[0]
  if (items.length <= 4) return items.join(', ')
  return t('{list}, and {count} more', { list: items.slice(0, 3).join(', '), count: items.length - 3 })
}

export function describeCron(parsed) {
  const idx = parsed.hasSeconds ? 1 : 0
  const minute = parsed.fields[idx]
  const hour = parsed.fields[idx + 1]
  const dom = parsed.fields[idx + 2]
  const month = parsed.fields[idx + 3]
  const dow = parsed.fields[idx + 4]
  const second = parsed.hasSeconds ? parsed.fields[0] : null

  const timeBits = []
  if (second && !second.any) timeBits.push(t('at second {list}', { list: describeList(second, v => String(v)) }))
  if (!hour.any && minute.any) timeBits.push(t('at minute {list} past every hour', { list: describeList(minute, v => String(v)) }))
  else if (!hour.any && !minute.any) {
    const mins = [...minute.values].sort((a, b) => a - b)
    const hours = [...hour.values].sort((a, b) => a - b)
    if (hours.length === 1 && mins.length === 1) {
      timeBits.push(t('at {time}', { time: `${String(hours[0]).padStart(2, '0')}:${String(mins[0]).padStart(2, '0')}` }))
    } else {
      timeBits.push(t('at {minutes} past {hours}:00', {
        minutes: describeList(minute, v => String(v).padStart(2, '0')),
        hours: describeList(hour, v => String(v).padStart(2, '0')),
      }))
    }
  } else if (!minute.any) {
    timeBits.push(t('at minute {list} every hour', { list: describeList(minute, v => String(v)) }))
  }

  const dateBits = []
  if (!month.any) dateBits.push(t('in {months}', { months: describeList(month, v => t(MONTHS[v - 1])) }))
  if (!dom.any) dateBits.push(t('on day {days} of the month', { days: describeList(dom, v => String(v)) }))
  if (!dow.any) dateBits.push(t('on {days}', { days: describeList(dow, v => t(DOW[v])) }))

  const chunks = [...timeBits, ...dateBits]
  if (!chunks.length) return t('Every second.')
  return chunks.join(', ') + '.'
}

export function cronFieldSummary(parsed) {
  return parsed.meta.map((field, index) => ({
    label: field.name,
    value: parsed.parts[index],
  }))
}

export function formatCronRunLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export function nextCronRuns(expression, count = 10, from = new Date()) {
  const parsed = parseCronExpression(expression)
  const runs = []
  const cursor = new Date(from)
  cursor.setMilliseconds(0)
  if (parsed.hasSeconds) cursor.setSeconds(cursor.getSeconds() + 1)
  else {
    cursor.setSeconds(0)
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  const limit = 525600 * 2
  for (let i = 0; i < limit && runs.length < count; i += 1) {
    if (matchesDate(cursor, parsed)) runs.push(new Date(cursor))
    if (parsed.hasSeconds) cursor.setSeconds(cursor.getSeconds() + 1)
    else cursor.setMinutes(cursor.getMinutes() + 1)
  }
  if (!runs.length) throw new Error('No upcoming runs found in the next two years.')
  return runs
}
