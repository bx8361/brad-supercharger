import { runRegex } from './testerOps.js'

self.onmessage = ({ data }) => {
  try {
    self.postMessage(runRegex(data))
  } catch (e) {
    self.postMessage({ matches: [], output: '', error: e.message || 'Could not run that pattern.' })
  }
}
