function cellValue(value) {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function collectColumns(rows) {
  const columns = []
  const seen = new Set()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        columns.push(key)
      }
    }
  }
  return columns
}

export function jsonToTable(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input
  let rows = []
  if (Array.isArray(data)) {
    if (!data.length) return { columns: [], rows: [] }
    if (data.every(item => item != null && typeof item === 'object' && !Array.isArray(item))) {
      rows = data
    } else {
      rows = data.map((item, index) => ({ '#': index + 1, value: item }))
    }
  } else if (data != null && typeof data === 'object') {
    rows = [data]
  } else {
    rows = [{ value: data }]
  }
  const columns = collectColumns(rows)
  const normalized = rows.map(row => Object.fromEntries(columns.map(col => [col, cellValue(row[col])])))
  return { columns, rows: normalized }
}

function escapeCsv(value) {
  const text = value ?? ''
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function tableToDelimited({ columns, rows }, delimiter = ',') {
  const lines = [columns.join(delimiter)]
  for (const row of rows) lines.push(columns.map(col => escapeCsv(row[col])).join(delimiter))
  return lines.join('\n')
}
