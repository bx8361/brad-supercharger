function trimLine(line) {
  return line.trim()
}

export function resolvePlaylistUrl(baseUrl, reference) {
  const ref = (reference ?? '').trim()
  if (!ref) return ''
  if (/^https?:\/\//i.test(ref)) return ref
  if (ref.startsWith('//')) return `${new URL(baseUrl).protocol}${ref}`
  try {
    return new URL(ref, baseUrl).href
  } catch {
    return ref
  }
}

export function parseM3u8(text, baseUrl = '') {
  const lines = (text ?? '').split(/\r?\n/).map(trimLine).filter(Boolean)
  if (!lines.length || !lines[0].startsWith('#EXTM3U')) {
    throw new Error('Not a valid M3U8 playlist.')
  }

  let currentKey = null
  let currentMap = null
  const segments = []
  let mediaSequence = 0
  let targetDuration = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      mediaSequence = Number.parseInt(line.slice(22), 10) || 0
      continue
    }
    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = Number.parseInt(line.slice(24), 10) || 0
      continue
    }
    if (line.startsWith('#EXT-X-KEY:')) {
      currentKey = parseKeyLine(line, baseUrl)
      continue
    }
    if (line.startsWith('#EXT-X-MAP:')) {
      currentMap = parseMapLine(line, baseUrl)
      continue
    }
    if (line.startsWith('#')) continue
    segments.push({
      url: resolvePlaylistUrl(baseUrl, line),
      sequence: mediaSequence + segments.length,
      key: currentKey,
      map: currentMap,
    })
  }

  return { segments, mediaSequence, targetDuration, isMaster: lines.some(l => l.startsWith('#EXT-X-STREAM-INF:')) }
}

export function listMasterVariants(text, baseUrl = '') {
  const lines = (text ?? '').split(/\r?\n/).map(trimLine).filter(Boolean)
  const variants = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF:')) continue
    const attrs = parseAttrList(lines[i].slice('#EXT-X-STREAM-INF:'.length))
    let uri = ''
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith('#')) continue
      uri = lines[j]
      break
    }
    if (!uri) continue
    variants.push({
      bandwidth: Number.parseInt(attrs.BANDWIDTH, 10) || 0,
      resolution: attrs.RESOLUTION || '',
      url: resolvePlaylistUrl(baseUrl, uri),
    })
  }
  return variants
}

export function bestMasterVariant(variants) {
  if (!variants?.length) return null
  return variants.reduce((best, item) => (item.bandwidth >= best.bandwidth ? item : best))
}

export function m3u8UrlFromLocation(href) {
  let url
  try { url = new URL(href) } catch { return '' }
  const fromSearch = url.searchParams.get('url')
  if (fromSearch) return fromSearch
  const hash = url.hash || ''
  const query = hash.indexOf('?')
  if (query === -1) return ''
  return new URLSearchParams(hash.slice(query + 1)).get('url') || ''
}

function parseAttrList(body) {
  const attrs = {}
  const re = /([\w-]+)=("[^"]*"|[^,]*)/g
  let match
  while ((match = re.exec(body))) {
    const raw = match[2]
    attrs[match[1]] = raw.startsWith('"') ? raw.slice(1, -1) : raw
  }
  return attrs
}

function parseKeyLine(line, baseUrl) {
  const attrs = parseAttrList(line.slice('#EXT-X-KEY:'.length))
  const method = (attrs.METHOD || 'NONE').toUpperCase()
  if (method === 'NONE') return null
  let iv = null
  if (attrs.IV) {
    const hex = attrs.IV.replace(/^0x/i, '')
    iv = hexToBytes(hex)
  }
  return {
    method,
    uri: attrs.URI ? resolvePlaylistUrl(baseUrl, attrs.URI) : '',
    iv,
  }
}

function parseMapLine(line, baseUrl) {
  const attrs = parseAttrList(line.slice('#EXT-X-MAP:'.length))
  return { uri: resolvePlaylistUrl(baseUrl, attrs.URI || '') }
}

function hexToBytes(hex) {
  const clean = hex.replace(/\s/g, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

function sequenceIv(sequence) {
  const iv = new Uint8Array(16)
  const view = new DataView(iv.buffer)
  view.setUint32(12, sequence, false)
  return iv
}

async function fetchBytes(url, signal) {
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return new Uint8Array(await response.arrayBuffer())
}

async function fetchKeyBytes(key, signal, cache) {
  if (!key?.uri) throw new Error('Encrypted stream is missing a key URI.')
  if (cache.has(key.uri)) return cache.get(key.uri)
  const bytes = await fetchBytes(key.uri, signal)
  if (bytes.length !== 16) throw new Error('AES-128 key must be 16 bytes.')
  cache.set(key.uri, bytes)
  return bytes
}

async function decryptAes128Cbc(data, keyBytes, iv) {
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, data)
  return new Uint8Array(decrypted)
}

export async function decryptSegment(segment, data, signal, keyCache) {
  const key = segment.key
  if (!key || key.method === 'NONE') return data
  if (key.method !== 'AES-128') throw new Error(`Unsupported encryption: ${key.method}.`)
  const keyBytes = await fetchKeyBytes(key, signal, keyCache)
  const iv = key.iv ?? sequenceIv(segment.sequence)
  return decryptAes128Cbc(data, keyBytes, iv)
}

export function canStreamToFile() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'
}

export async function pickSaveFile(suggestedName) {
  if (!canStreamToFile()) throw new Error('Streaming save needs Chrome or Edge (File System Access API).')
  return window.showSaveFilePicker({
    suggestedName,
    types: [{ description: 'Video', accept: { 'video/mp2t': ['.ts'], 'video/mp4': ['.mp4'] } }],
  })
}

export function segmentProgress(jobs) {
  const total = jobs.length
  let done = 0
  let failed = 0
  let active = 0
  let bytes = 0
  const activeSegments = []
  const failures = []
  for (const job of jobs) {
    if (job.status === 'done') {
      done += 1
      bytes += job.bytes || 0
    } else if (job.status === 'error') {
      failed += 1
      failures.push({ index: job.playlistIndex, url: job.url, error: job.error || 'Failed' })
    } else if (job.status === 'downloading') {
      active += 1
      activeSegments.push({ index: job.playlistIndex, url: job.url, attempt: job.attempt || 1, tries: job.tries || 1 })
    }
  }
  return {
    total,
    done,
    failed,
    active,
    bytes,
    percent: total ? Math.round((done / total) * 100) : 0,
    activeSegments,
    failures,
  }
}

function abortedError() {
  const error = new DOMException('Aborted', 'AbortError')
  return error
}

export function createM3u8Download({
  segments,
  startIndex = 0,
  concurrency = 8,
  maxRetries = 3,
  saveMode = 'memory',
  fileName = 'video.ts',
  signal,
  onUpdate,
}) {
  const jobs = segments.map((segment, offset) => ({
    offset,
    playlistIndex: startIndex + offset,
    url: segment.url,
    segment,
    status: 'queued',
    error: '',
    attempt: 0,
    tries: Math.max(0, maxRetries) + 1,
    bytes: 0,
  }))
  const localAbort = new AbortController()
  const localSignal = localAbort.signal
  const keyCache = new Map()
  const chunks = saveMode === 'memory' ? new Array(jobs.length) : null
  const ready = new Map()
  let writeCursor = 0
  let writeChain = Promise.resolve()
  let writable = null
  let paused = false
  let stopped = false
  let activeWorkers = 0
  let emitTimer = 0
  const resumeWaiters = []
  const idleWaiters = []
  let finish
  let fail
  const finished = new Promise((resolve, reject) => {
    finish = resolve
    fail = reject
  })
  finished.catch(() => {})
  function settleOk() {
    finish()
  }
  function settleErr(error) {
    fail(error)
  }

  function snapshot(phase) {
    const progress = segmentProgress(jobs)
    const waiting = jobs.some(job => job.status === 'queued' || job.status === 'downloading')
    let next = phase
    if (!next) {
      if (stopped) next = 'stopped'
      else if (paused) next = 'paused'
      else if (!waiting && progress.failed) next = 'incomplete'
      else if (!waiting && progress.done === progress.total) next = 'done'
      else next = 'downloading'
    }
    return { phase: next, paused, ...progress }
  }

  function emit(force = false, phase) {
    if (!onUpdate) return
    if (force) {
      clearTimeout(emitTimer)
      emitTimer = 0
      onUpdate(snapshot(phase))
      return
    }
    if (emitTimer) return
    emitTimer = setTimeout(() => {
      emitTimer = 0
      onUpdate(snapshot())
    }, 80)
  }

  function poke() {
    const waiters = idleWaiters.splice(0)
    waiters.forEach(fn => fn())
  }

  function claimNext() {
    const job = jobs.find(item => item.status === 'queued')
    if (!job) return null
    job.status = 'downloading'
    job.error = ''
    return job
  }

  async function waitIfPaused() {
    if (!paused || stopped) return
    await new Promise((resolve, reject) => {
      const finishWait = () => {
        cleanup()
        resolve()
      }
      const onAbort = () => {
        cleanup()
        reject(abortedError())
      }
      function cleanup() {
        const at = resumeWaiters.indexOf(finishWait)
        if (at >= 0) resumeWaiters.splice(at, 1)
        localSignal.removeEventListener('abort', onAbort)
      }
      resumeWaiters.push(finishWait)
      localSignal.addEventListener('abort', onAbort, { once: true })
    })
  }

  function store(offset, data) {
    if (saveMode === 'memory') {
      chunks[offset] = data
      return Promise.resolve()
    }
    ready.set(offset, data)
    writeChain = writeChain.then(flushOrdered)
    return writeChain
  }

  async function flushOrdered() {
    while (ready.has(writeCursor)) {
      const data = ready.get(writeCursor)
      ready.delete(writeCursor)
      if (writable) await writable.write(data)
      writeCursor += 1
    }
  }

  async function fetchJob(job) {
    const tries = Math.max(1, maxRetries + 1)
    let lastError
    for (let attempt = 1; attempt <= tries; attempt += 1) {
      if (stopped || localSignal.aborted) throw abortedError()
      job.attempt = attempt
      job.tries = tries
      emit()
      try {
        let data = await fetchBytes(job.url, localSignal)
        data = await decryptSegment(job.segment, data, localSignal, keyCache)
        job.bytes = data.length
        await store(job.offset, data)
        job.status = 'done'
        job.error = ''
        emit(job.status === 'done' && attempt > 1)
        return
      } catch (error) {
        lastError = error
        if (stopped || localSignal.aborted || error?.name === 'AbortError') throw abortedError()
      }
    }
    job.status = 'error'
    job.error = lastError?.message || `Segment ${job.playlistIndex} failed.`
    emit(true)
  }

  async function worker() {
    activeWorkers += 1
    try {
      for (;;) {
        try {
          if (stopped || localSignal.aborted) return
          await waitIfPaused()
        } catch (error) {
          if (error?.name === 'AbortError' || stopped) return
          throw error
        }
        const job = claimNext()
        if (!job) {
          if (jobs.some(item => item.status === 'downloading')) {
            await new Promise(resolve => idleWaiters.push(resolve))
            continue
          }
          return
        }
        emit()
        try {
          await fetchJob(job)
        } catch (error) {
          if (error?.name === 'AbortError') {
            if (job.status === 'downloading') job.status = 'queued'
            return
          }
          job.status = 'error'
          job.error = error?.message || `Segment ${job.playlistIndex} failed.`
          emit(true)
        }
        poke()
      }
    } finally {
      activeWorkers -= 1
      if (activeWorkers === 0) queueMicrotask(onIdle)
    }
  }

  function startWorkers() {
    const queued = jobs.filter(job => job.status === 'queued').length
    const room = Math.max(0, Math.min(concurrency, queued) - activeWorkers)
    for (let i = 0; i < room; i += 1) worker()
  }

  function onIdle() {
    if (stopped || localSignal.aborted) return
    if (activeWorkers > 0) return
    if (jobs.some(job => job.status === 'queued')) {
      startWorkers()
      return
    }
    emit(true)
    if (jobs.every(job => job.status === 'done')) settleOk()
  }

  async function finalize() {
    await writeChain
    const progress = segmentProgress(jobs)
    if (saveMode === 'memory') {
      const out = new Uint8Array(progress.bytes)
      let offset = 0
      for (const part of chunks) {
        out.set(part, offset)
        offset += part.length
      }
      return { blob: new Blob([out], { type: 'video/mp2t' }), bytes: progress.bytes, segments: jobs.length, saved: false }
    }
    await writable?.close()
    writable = null
    return { blob: null, bytes: progress.bytes, segments: jobs.length, saved: true }
  }

  function pause() {
    if (stopped || paused) return
    paused = true
    emit(true, 'paused')
  }

  function resume() {
    if (stopped || !paused) return
    paused = false
    const waiters = resumeWaiters.splice(0)
    waiters.forEach(fn => fn())
    emit(true, 'downloading')
    if (activeWorkers === 0) onIdle()
  }

  function retryFailed() {
    let queued = 0
    for (const job of jobs) {
      if (job.status !== 'error') continue
      job.status = 'queued'
      job.error = ''
      job.attempt = 0
      queued += 1
    }
    if (!queued) return
    if (paused) resume()
    emit(true, 'downloading')
    poke()
    if (activeWorkers === 0) startWorkers()
  }

  function stop() {
    if (stopped) return
    stopped = true
    paused = false
    localAbort.abort()
    resumeWaiters.splice(0).forEach(fn => fn())
    poke()
    settleErr(abortedError())
    if (writable) {
      const closing = writable
      writable = null
      closing.abort?.().catch(() => {})
    }
    emit(true, 'stopped')
  }

  signal?.addEventListener('abort', () => stop(), { once: true })

  return {
    pause,
    resume,
    retryFailed,
    stop,
    snapshot: () => snapshot(),
    async run() {
      emit(true, 'downloading')
      if (saveMode === 'stream') {
        const handle = await pickSaveFile(fileName)
        if (stopped || localSignal.aborted) throw abortedError()
        writable = await handle.createWritable()
      }
      if (!jobs.length) throw new Error('No media segments found in the playlist.')
      startWorkers()
      await finished
      const result = await finalize()
      emit(true, 'done')
      return result
    },
  }
}

export async function loadPlaylistFromUrl(url, signal) {
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error(`Could not load playlist (HTTP ${response.status}).`)
  const text = await response.text()
  return { text, finalUrl: response.url || url }
}
