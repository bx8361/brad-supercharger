// Runs in a worker so Python cannot read the page DOM or localStorage.
const shown = value => {
  if (value == null) return ''
  const text = typeof value.toString === 'function' ? value.toString() : String(value)
  value.destroy?.()
  return text === 'None' ? '' : text
}

let opening
let pyodide

function engine(indexURL) {
  opening ??= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ new URL('pyodide.mjs', indexURL).href)
    pyodide = await loadPyodide({ indexURL })
  })()
  return opening
}

self.onmessage = async event => {
  const { id, code, indexURL } = event.data
  try {
    await engine(indexURL)
    const lines = []
    const write = line => lines.push(line)
    pyodide.setStdout({ batched: write })
    pyodide.setStderr({ batched: write })
    if (!String(code ?? '').trim()) {
      self.postMessage({ id, ok: true, result: '' })
      return
    }
    let value
    try {
      value = await pyodide.runPythonAsync(code)
    } catch (error) {
      const text = lines.join('\n')
      const message = error?.message || String(error)
      throw new Error(text ? `${text}\n${message}` : message)
    }
    const text = lines.join('\n')
    const tail = shown(value)
    const result = !tail ? text : text ? `${text}\n${tail}` : tail
    self.postMessage({ id, ok: true, result })
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) })
  }
}
