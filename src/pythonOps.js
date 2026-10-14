// ponytail: one interpreter for the tab. Reset drops user names; it does not reload the wasm.
const indexURL = () => new URL(`${import.meta.env.BASE_URL}pyodide/`, window.location.href).href

let opening
let pyodide

function shown(value) {
  if (value == null) return ''
  const text = typeof value.toString === 'function' ? value.toString() : String(value)
  value.destroy?.()
  return text === 'None' ? '' : text
}

async function engine() {
  opening ??= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ new URL('pyodide.mjs', indexURL()).href)
    pyodide = await loadPyodide({ indexURL: indexURL() })
  })()
  await opening
  return pyodide
}

export async function runPython(code) {
  const py = await engine()
  const lines = []
  const write = line => lines.push(line)
  py.setStdout({ batched: write })
  py.setStderr({ batched: write })
  if (!String(code ?? '').trim()) return ''
  let value
  try {
    value = await py.runPythonAsync(code)
  } catch (error) {
    const text = lines.join('\n')
    const message = error?.message || String(error)
    throw new Error(text ? `${text}\n${message}` : message)
  }
  const text = lines.join('\n')
  const tail = shown(value)
  if (!tail) return text
  return text ? `${text}\n${tail}` : tail
}

export async function resetPython() {
  const py = await engine()
  py.runPython(`
_names = [n for n in globals() if not n.startswith("_")]
for _name in _names:
    del globals()[_name]
del _names, _name
`)
}
