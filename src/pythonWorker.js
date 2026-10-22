// Runs in a worker so Python cannot read the page DOM or localStorage.
import formatSource from './pythonFormat.py?raw'
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

function formatCode(source) {
  // exec in a throwaway dict so formatting does not define names in the user session.
  pyodide.globals.set('_brad_src', source)
  try {
    let value
    try {
      value = pyodide.runPython(`(lambda src: (lambda ns: (exec(${JSON.stringify(formatSource)}, ns), ns["format_python"](src))[1])({}))(_brad_src)`)
    } catch (error) {
      const message = error?.message || String(error)
      const line = message.split('\n').map(item => item.trim()).find(item => /^(SyntaxError|IndentationError|TokenError):/.test(item))
      throw new Error(line || message)
    }
    return typeof value === 'string' ? value : String(value ?? '')
  } finally {
    pyodide.runPython('del _brad_src')
  }
}

self.onmessage = async event => {
  const { id, code, indexURL, op } = event.data
  try {
    await engine(indexURL)
    if (op === 'format') {
      self.postMessage({ id, ok: true, result: formatCode(code) })
      return
    }
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
