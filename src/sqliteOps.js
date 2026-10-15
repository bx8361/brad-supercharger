// ponytail: one in-memory database for the tab. OPFS needs COOP/COEP headers this app does not send.
const ROW_CAP = 500
const base = () => new URL(`${import.meta.env.BASE_URL}sqlite/sqlite3.mjs`, window.location.href).href

let opening
let sqlite3
let db

function cellText(value) {
  if (value == null) return ''
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) {
    const hex = [...value.subarray(0, 32)].map(byte => byte.toString(16).padStart(2, '0')).join('')
    return value.length > 32 ? `x'${hex}…'` : `x'${hex}'`
  }
  return String(value)
}

async function engine() {
  opening ??= (async () => {
    const sqlite3InitModule = (await import(/* @vite-ignore */ base())).default
    sqlite3 = await sqlite3InitModule()
    db = openDb(':memory:', 'c')
  })()
  await opening
  return sqlite3
}

function harden(database) {
  const capi = sqlite3.capi
  for (const [op, on] of [[capi.SQLITE_DBCONFIG_DEFENSIVE, 1], [capi.SQLITE_DBCONFIG_TRUSTED_SCHEMA, 0]]) {
    const rc = capi.sqlite3_db_config(database.pointer, op, on, 0)
    if (rc) throw new Error(`SQLite config ${op} failed (${rc})`)
  }
}

function openDb(...args) {
  const database = new sqlite3.oo1.DB(...args)
  harden(database)
  return database
}

function replace(next) {
  const previous = db
  db = next
  previous?.close()
}

export async function runSqlite(sql) {
  await engine()
  if (!String(sql || '').trim()) return { columns: [], rows: [], truncated: false, changes: 0 }
  const before = Number(db.changes(true))
  const columns = []
  const rows = []
  db.exec({
    sql,
    rowMode: 'array',
    columnNames: columns,
    callback(row) {
      rows.push(row.map(cellText))
      if (rows.length > ROW_CAP) return false
    },
  })
  const truncated = rows.length > ROW_CAP
  return {
    columns,
    rows: truncated ? rows.slice(0, ROW_CAP) : rows,
    truncated,
    changes: Number(db.changes(true)) - before,
  }
}

export async function openSqliteBytes(bytes) {
  const api = await engine()
  const name = `/import-${Date.now()}.sqlite`
  api.capi.sqlite3_js_posix_create_file(name, bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
  replace(openDb(name, 'w'))
}

export async function resetSqlite() {
  const api = await engine()
  replace(openDb(':memory:', 'c'))
}

export async function exportSqlite() {
  const api = await engine()
  const bytes = api.capi.sqlite3_js_db_export(db.pointer)
  return new Blob([bytes], { type: 'application/x-sqlite3' })
}
