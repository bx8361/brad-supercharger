// ponytail: one worker for the tab. Restart drops it so a stuck script can be replaced.
const indexURL = () => new URL(`${import.meta.env.BASE_URL}pyodide/`, window.location.href).href

let worker
let seq = 0
const pending = new Map()

function thread() {
  if (worker) return worker
  worker = new Worker(new URL('./pythonWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = event => {
    const { id, ok, result, error } = event.data
    const settle = pending.get(id)
    if (!settle) return
    pending.delete(id)
    if (ok) settle.resolve(result)
    else settle.reject(new Error(error || 'Python failed.'))
  }
  worker.onerror = event => {
    for (const settle of pending.values()) settle.reject(new Error(event.message || 'Python failed.'))
    pending.clear()
  }
  return worker
}

let chain = Promise.resolve()

function call(code, op = 'run') {
  const id = ++seq
  const run = () => new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    thread().postMessage({ id, code, op, indexURL: indexURL() })
  })
  const job = chain.then(run, run)
  chain = job.then(() => {}, () => {})
  return job
}

export function runPython(code) {
  return call(code)
}

export function formatPython(code) {
  return call(code, 'format')
}

export function resetPython() {
  worker?.terminate()
  worker = null
  for (const settle of pending.values()) settle.reject(new Error('Python restarted.'))
  pending.clear()
}
