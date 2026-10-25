import { evaluateCas } from './casOps.js'

/**
 * Answer CAS requests posted to this worker with one engine library.
 */
export function serveCas(engine, lib) {
  self.onmessage = ({ data }) => {
    try {
      self.postMessage({ id: data.id, ...evaluateCas(engine, lib, data) })
    } catch (e) {
      self.postMessage({ id: data.id, error: e?.message || 'Could not evaluate that expression.' })
    }
  }
}
