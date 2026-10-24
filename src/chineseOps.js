// Compile the bundled OpenCC s2t/t2s rules. Matches consume source text once;
// replacement text is only processed again by the next conversion stage.
const replacement = Symbol('replacement')

function dictionaryLookup(source) {
  const root = new Map()
  for (const line of source.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const [key, candidates] = line.split('\t')
    if (!key || !candidates) continue
    let node = root
    for (const char of key) {
      if (!node.has(char)) node.set(char, new Map())
      node = node.get(char)
    }
    // OpenCC orders alternatives by preference.
    node.set(replacement, candidates.split(' ')[0])
  }
  return (chars, start) => {
    let node = root, match
    for (let end = start; end < chars.length; end++) {
      node = node.get(chars[end])
      if (!node) break
      if (node.has(replacement)) match = { end: end + 1, text: node.get(replacement) }
    }
    return match
  }
}

export function createChineseConverter(config, resources) {
  const dictionaries = new Map()
  function compile(dict) {
    if (dict.type === 'text') {
      if (!dictionaries.has(dict.file)) {
        if (typeof resources[dict.file] !== 'string') throw new Error(`Missing Chinese dictionary: ${dict.file}`)
        dictionaries.set(dict.file, dictionaryLookup(resources[dict.file]))
      }
      return dictionaries.get(dict.file)
    }
    if (dict.type !== 'group' || !['union', 'short_circuit'].includes(dict.match_policy)) {
      throw new Error('Unsupported Chinese dictionary rule')
    }
    const lookups = dict.dicts.map(compile)
    return (chars, start) => {
      let best
      for (const lookup of lookups) {
        const match = lookup(chars, start)
        if (!match) continue
        if (dict.match_policy === 'short_circuit') return match
        if (!best || match.end > best.end) best = match
      }
      return best
    }
  }
  const stages = [...(config.normalization || []), ...config.conversion_chain].map(stage => compile(stage.dict))
  return text => {
    for (const lookup of stages) {
      const chars = Array.from(text), output = []
      for (let start = 0; start < chars.length;) {
        const match = lookup(chars, start)
        output.push(match ? match.text : chars[start])
        start = match ? match.end : start + 1
      }
      text = output.join('')
    }
    return text
  }
}
