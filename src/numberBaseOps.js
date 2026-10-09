const digitValid = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^\d+$/,
  16: /^[\da-f]+$/i,
}

function unformatIntegerText(text) {
  return text.trim().replaceAll('_', '').replace(/\s/g, '').replaceAll(',', '')
}

function groupDigitsRight(digits, groupSize, padLeading = false) {
  let s = digits
  if (padLeading) {
    const rem = s.length % groupSize
    if (rem !== 0) s = '0'.repeat(groupSize - rem) + s
  }
  const parts = []
  for (let i = s.length; i > 0; i -= groupSize) parts.unshift(s.slice(Math.max(0, i - groupSize), i))
  return parts.join(' ')
}

export function parseIntegerText(text, fromBase) {
  const from = String(fromBase)
  const raw = unformatIntegerText(text)
  if (!raw) return null
  const negative = raw.startsWith('-')
  const unsigned = raw.replace(/^[+-]/, '')
  const prefix = unsigned.match(/^0([xob])/i)?.[1]?.toLowerCase()
  const prefixBase = { x: '16', o: '8', b: '2' }[prefix]
  if (prefixBase && prefixBase !== from) {
    throw new Error(`The prefix indicates base ${prefixBase}, but this field is base ${from}.`)
  }
  const digits = prefixBase ? unsigned.slice(2) : unsigned
  if (!digits) throw new Error('Enter an integer to convert.')
  const valid = digitValid[from]
  if (!valid?.test(digits)) throw new Error(`That value contains digits not valid in base ${from}.`)
  let value = 0n
  for (const char of digits.toLowerCase()) {
    const d = parseInt(char, 16)
    if (d >= Number(from)) throw new Error('Digit is out of range for this base.')
    value = value * BigInt(from) + BigInt(d)
  }
  if (negative) value = -value
  return value
}

export function formatInteger(value, base) {
  if (value == null) return ''
  const b = Number(base)
  let digits = b === 16 ? value.toString(16).toUpperCase() : value.toString(b)
  if (b === 2) {
    const rem = digits.length % 4
    if (rem !== 0) digits = '0'.repeat(4 - rem) + digits
  }
  return digits
}

export function displayInteger(value, base, formatNumber = false) {
  if (value == null) return ''
  const b = Number(base)
  const raw = b === 16 ? value.toString(16).toUpperCase() : value.toString(b)
  if (!formatNumber) return formatInteger(value, base)
  if (b === 10) return value.toLocaleString()
  if (b === 8) return groupDigitsRight(raw, 3)
  if (b === 16) return groupDigitsRight(raw, 4)
  if (b === 2) return groupDigitsRight(raw, 4, true)
  return raw
}

export function convertFromBase(text, fromBase, { formatNumber = false } = {}) {
  const value = parseIntegerText(text, fromBase)
  if (value == null) return { '2': '', '8': '', '10': '', '16': '' }
  return {
    2: displayInteger(value, 2, formatNumber),
    8: displayInteger(value, 8, formatNumber),
    10: displayInteger(value, 10, formatNumber),
    16: displayInteger(value, 16, formatNumber),
  }
}
