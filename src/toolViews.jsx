import { lazy, Suspense, Children, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { diffLines, diffWordsWithSpace } from 'diff'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml'
import { ClipboardPaste, Clock3, Copy, Download, ExternalLink, FileUp, Fingerprint, GripHorizontal, GripVertical, LockKeyhole, Maximize2, Minimize2, Pause, Play, RefreshCw, Save, Search, Sparkles, Trash2, X } from 'lucide-react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { initialSamples, jsxGraphExamples, mermaidExamples } from './catalog.js'
import { cronFieldSummary, describeCron, formatCronRunLocal, nextCronRuns, parseCronExpression } from './cronOps.js'
import { jsonToTable, tableToDelimited } from './jsonTableOps.js'
import {
  compressGzip, convertBase64Text, convertUrl, decodeCertificate, decodeHtml, decodeJwt,
  decompressGzip, encodeBytesBase64, encodeHtml, encodeJwtHs, formatJwtDecoded,
  parseDataUrl, toDataUrl,
} from './encodeOps.js'
import { formatJson, formatSql, formatXml, sqlLanguages } from './formatOps.js'
import { findRanges, paint } from './highlight.js'
import { convertFromBase } from './numberBaseOps.js'
import { compareDigests, generateLipsum, generateUuid } from './generateOps.js'
import { decryptShareText, encryptShareText } from './cryptoShareOps.js'
import {
  bestMasterVariant, canStreamToFile, createM3u8Download, listMasterVariants, loadPlaylistFromUrl, m3u8UrlFromLocation, parseM3u8,
} from './m3u8Ops.js'
import {
  convertImageFile, downloadBlob, imageOutputFormats, renderWatermarkedCanvas, watermarkedImageBlob,
} from './imageOps.js'
import { lipsumCorpora, lipsumCorpusIds } from './lipsumCorpora.js'
import {
  angleUnits, autoFixCalculatorExpression, calculatorConstantCatalog, calculatorFunctionCatalog,
  cloneCalculatorSession, createCalculatorSession, evaluateCalculatorExpression, formatCalculatorExpression, formatCalculatorResult, resultFormats, searchCalculatorSymbols,
} from './calculatorOps.js'
import { queryJsonPath, regexControls, regexFlavors, regexHelp, validateXmlAgainstXsd } from './testerOps.js'
import { analyze, caretInfo, compareLists, escapeString, reverseLines, shuffleLines, sideBySideRows, sortByLast, sortLines, toAlternating, toCamel, toCobol, toConstant, toCRLF, toInverse, toKebab, toLF, toPascal, toRandomCase, toSentence, toSnake, toTitle, toTrain, trimLines, unescapeString, uniqueLines } from './textOps.js'
import { JSXGraph } from 'jsxgraph'
import '../node_modules/jsxgraph/distrib/jsxgraph.css'
import mermaid from 'mermaid'

export function textValue(data, key, fallback = '') {
  return data[key] ?? fallback
}

function set(setData, key, value) { setData({ [key]: value }) }

function editorClass(wrap, multiline) {
  return `code-editor${wrap ? ' wrap-lines' : ''}${multiline === false ? ' single-line' : ''}`
}

const WrapContext = createContext(null)

function wrapOn(data) {
  const value = textValue(data, 'wrap', false)
  return value === true || value === 'true'
}

function useLineWrap(wrap) {
  const scope = useContext(WrapContext)
  useEffect(() => { if (wrap == null) scope?.activate() }, [scope, wrap])
  return wrap ?? scope?.wrap ?? false
}

function WrapScope({ data, setData, children }) {
  const hostRef = useRef(null)
  const [host, setHost] = useState(null)
  const [active, setActive] = useState(false)
  const wrap = wrapOn(data)
  const api = useMemo(() => ({ wrap, setWrap: value => set(setData, 'wrap', value), activate: () => setActive(true) }), [wrap, setData])
  useLayoutEffect(() => {
    if (!active) return
    const next = hostRef.current?.querySelector('.tool-content .inline-controls') || null
    setHost(current => current === next ? current : next)
  })
  const toggle = <WrapToggle checked={wrap} onChange={api.setWrap} />
  return <WrapContext.Provider value={api}>
    <div ref={hostRef} className="tool-view">
      {children}
      {active && (host ? createPortal(toggle, host) : <div className="inline-controls">{toggle}</div>)}
    </div>
  </WrapContext.Provider>
}

function TextPane({ label, value, onChange, readOnly = false, placeholder, rows = 12, footer, actions, onSelect, onKeyDown, wrap, multiline = true, error = false, language, output = false }) {
  const lineWrap = useLineWrap(wrap)
  const lineRows = multiline ? rows : 1
  const areaRef = useRef(null)
  const layerRef = useRef(null)
  const findRef = useRef(null)
  const [findOpen, setFindOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const text = value ?? ''
  const ranges = useMemo(() => findRanges(text, findOpen ? query : ''), [text, query, findOpen])
  const current = ranges.length ? active % ranges.length : 0
  const parts = useMemo(() => paint(text, error ? '' : language, ranges, current), [text, error, language, ranges, current])
  useEffect(() => { if (findOpen) findRef.current?.focus() }, [findOpen])
  useLayoutEffect(() => {
    const area = areaRef.current
    const layer = layerRef.current
    if (!area || !layer) return
    layer.style.paddingRight = `${14 + area.offsetWidth - area.clientWidth}px`
    layer.scrollTop = area.scrollTop
    layer.scrollLeft = area.scrollLeft
  })
  useLayoutEffect(() => {
    const area = areaRef.current
    const range = ranges[current]
    if (!findOpen || !query || !area || !range) return
    // ponytail: scroll by newline count; wrapped lines can stop short of the match
    const line = text.slice(0, range.start).split('\n').length - 1
    const lineHeight = parseFloat(getComputedStyle(area).lineHeight) || 24
    const top = line * lineHeight
    if (top < area.scrollTop || top > area.scrollTop + area.clientHeight - lineHeight * 2) area.scrollTop = Math.max(0, top - area.clientHeight / 3)
    if (layerRef.current) layerRef.current.scrollTop = area.scrollTop
  }, [findOpen, query, current, ranges, text])
  function cycle(step) {
    if (!ranges.length) return
    setActive(index => (index + step + ranges.length) % ranges.length)
  }
  return <section className={`editor-card${output ? ' output-card' : ''}${error ? ' has-error' : ''}`}>
    <div className="panel-top">{output ? <span>{label}</span> : <label>{label}</label>}<div className="panel-actions"><button type="button" className="icon-action" title="Find in this text (Ctrl+F)" aria-label={`Find in ${label}`} onClick={() => setFindOpen(true)}><Search size={14} /></button>{actions}</div></div>
    {findOpen && <div className="find-bar">
      <input ref={findRef} value={query} aria-label={`Find in ${label}`} placeholder="Find" spellCheck="false" onChange={e => { setQuery(e.target.value); setActive(0) }} onKeyDown={e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); e.currentTarget.select() }
        if (e.key === 'Escape') { e.preventDefault(); setFindOpen(false); setQuery(''); areaRef.current?.focus() }
        if (e.key === 'Enter') { e.preventDefault(); cycle(e.shiftKey ? -1 : 1) }
      }} />
      <span className="find-count">{ranges.length ? current + 1 : 0}/{ranges.length}</span>
      <button type="button" className="icon-action" aria-label="Previous match" onClick={() => cycle(-1)}>↑</button>
      <button type="button" className="icon-action" aria-label="Next match" onClick={() => cycle(1)}>↓</button>
      <button type="button" className="icon-action" aria-label="Close find" onClick={() => { setFindOpen(false); setQuery('') }}><X size={14} /></button>
    </div>}
    <div className={`code-shell${lineWrap ? ' wrap-lines' : ''}${multiline === false ? ' single-line' : ''}`}>
      {parts && <pre ref={layerRef} className="code-highlight" aria-hidden="true">{parts.map((part, index) => <span key={index} className={[part.kind && `tok-${part.kind}`, part.find && 'tok-find', part.current && 'current'].filter(Boolean).join(' ') || undefined}>{part.text}</span>)}</pre>}
      <textarea ref={areaRef} className={`${editorClass(lineWrap, multiline)}${output ? ' output-editor' : ''}${parts ? ' syntax' : ''}`} value={text} readOnly={readOnly} onChange={onChange ? e => onChange(e.target.value) : undefined} onSelect={onSelect} onScroll={e => { if (layerRef.current) { layerRef.current.scrollTop = e.target.scrollTop; layerRef.current.scrollLeft = e.target.scrollLeft } }} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); setFindOpen(true) } else onKeyDown?.(e) }} placeholder={placeholder} rows={lineRows} spellCheck="false" />
    </div>
    {footer && <div className="panel-footer">{footer}</div>}
  </section>
}

export function Editor(props) {
  return <TextPane {...props} />
}

export function Output({ actions, ...props }) {
  return <TextPane {...props} output readOnly actions={actions || <CopyAction value={props.value} />} />
}

function WrapToggle({ checked, onChange }) {
  return <label className="check-pill"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />Wrap lines</label>
}

function MultilineToggle({ checked, onChange }) {
  return <label className="check-pill"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />Multiline</label>
}

function clipboardDialogMessage(kind, error) {
  if (error?.name === 'NotFoundError') return error.message
  if (error?.name === 'NotSupportedError' || error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return kind === 'image'
      ? 'Pasting an image from the clipboard is not supported in this browser.'
      : 'Pasting text from the clipboard is not supported in this browser.'
  }
  return error?.message || 'Could not read the clipboard.'
}

async function readClipboardText() {
  if (typeof navigator.clipboard?.readText !== 'function') {
    const error = new Error('unsupported')
    error.name = 'NotSupportedError'
    throw error
  }
  return navigator.clipboard.readText()
}

async function readClipboardImageFile() {
  if (typeof navigator.clipboard?.read !== 'function') {
    const error = new Error('unsupported')
    error.name = 'NotSupportedError'
    throw error
  }
  const items = await navigator.clipboard.read()
  for (const item of items) {
    const type = item.types.find(t => t.startsWith('image/'))
    if (type) return item.getType(type)
  }
  const error = new Error('No image found on the clipboard.')
  error.name = 'NotFoundError'
  throw error
}

function toast(message, tone = 'ok') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, tone } }))
}

export function StatusToast() {
  const [item, setItem] = useState(null)
  useEffect(() => {
    function onToast(event) { setItem({ ...event.detail, id: Date.now() }) }
    window.addEventListener('app-toast', onToast)
    return () => window.removeEventListener('app-toast', onToast)
  }, [])
  useEffect(() => {
    if (!item || item.tone === 'busy') return undefined
    const timer = window.setTimeout(() => setItem(null), item.tone === 'error' ? 4200 : 1600)
    return () => window.clearTimeout(timer)
  }, [item])
  if (!item) return null
  return <div className={`status-toast ${item.tone}`} role="status">{item.message}</div>
}

async function withToast(busy, ok, fn) {
  toast(busy, 'busy')
  try {
    await fn()
    toast(ok, 'ok')
  } catch (e) {
    toast(e.message || 'Something went wrong.', 'error')
  }
}

function PasteImageButton({ onPaste, label = 'Paste from clipboard' }) {
  async function paste() {
    try {
      const blob = await readClipboardImageFile()
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
      onPaste(new File([blob], blob.name || `clipboard.${ext}`, { type: blob.type || 'image/png' }))
    } catch (e) { toast(clipboardDialogMessage('image', e), 'error') }
  }
  return <button type="button" className="text-action" onClick={paste}><ClipboardPaste size={13} /> {label}</button>
}

function PasteTextButton({ onPaste, label = 'Paste from clipboard' }) {
  async function paste() {
    try { onPaste(await readClipboardText()) }
    catch (e) { toast(clipboardDialogMessage('text', e), 'error') }
  }
  return <button type="button" className="text-action" onClick={paste}><ClipboardPaste size={13} /> {label}</button>
}

function ImagePreviewModal({ src, alt, onClose }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const boxRef = useRef(null)
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    function onWheel(e) {
      e.preventDefault()
      setScale(current => Math.min(6, Math.max(0.15, current * (e.deltaY < 0 ? 1.12 : 1 / 1.12))))
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [])
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  function onPointerDown(e) {
    if (e.button !== 0) return
    const stage = e.currentTarget
    const origin = { x: e.clientX, y: e.clientY, pan }
    stage.setPointerCapture(e.pointerId)
    stage.classList.add('is-dragging')
    const move = ev => setPan({ x: origin.pan.x + ev.clientX - origin.x, y: origin.pan.y + ev.clientY - origin.y })
    const end = () => { stage.classList.remove('is-dragging'); stage.removeEventListener('pointermove', move) }
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerup', end, { once: true })
    stage.addEventListener('pointercancel', end, { once: true })
  }
  return <div className="modal-scrim image-preview-scrim" onClick={onClose} role="presentation">
    <div className="image-zoom-modal" ref={boxRef} onClick={e => e.stopPropagation()}>
      <div className="image-zoom-toolbar"><span>{Math.round(scale * 100)}%</span><button type="button" className="icon-only" aria-label="Close preview" onClick={onClose}><X size={16} /></button></div>
      <div className="image-zoom-stage" onPointerDown={onPointerDown}><img src={src} alt={alt} draggable="false" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }} /></div>
      <p className="subtle">Scroll to zoom · Drag to move · Esc to close</p>
    </div>
  </div>
}

export function CopyAction({ value, label = 'Copy', className = 'icon-action' }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const node = document.createElement('textarea')
      node.value = value
      document.body.appendChild(node)
      node.select()
      document.execCommand('copy')
      node.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }
  return <button type="button" className={className} onClick={copy} disabled={!value} title={label}><Copy size={14} />{copied ? 'Copied' : label}</button>
}

const SPLIT_KEY = 'pane-split'
function paneRatio(x, width, handle = 14, min = 140) {
  const usable = width - handle
  if (usable <= min * 2) return 1
  const left = Math.min(usable - min, Math.max(min, x))
  return left / (usable - left)
}
function clampSplit(n) { return Math.min(5, Math.max(0.2, n)) }
function readSplit(key = SPLIT_KEY) {
  try {
    const n = Number(localStorage.getItem(key))
    return n > 0.2 && n < 5 ? n : 1
  } catch { return 1 }
}
function Split({ className = '', axis = 'x', storageKey = SPLIT_KEY, ratio: controlled, onRatio, children }) {
  const vertical = axis === 'y'
  const ref = useRef(null)
  const [local, setLocal] = useState(() => controlled ?? readSplit(storageKey))
  const ratio = controlled ?? local
  const ratioRef = useRef(ratio)
  ratioRef.current = ratio
  const panes = Children.toArray(children)
  function commit(next) {
    const value = clampSplit(next)
    ratioRef.current = value
    if (onRatio) onRatio(value)
    else { ref.current?.style.setProperty('--split', `${value}fr`); setLocal(value) }
    try { localStorage.setItem(storageKey, String(value)) } catch { /* ponytail: keep the drag for this session if storage is blocked */ }
  }
  function onPointerDown(e) {
    if (e.button !== 0) return
    const grid = ref.current
    const handle = e.currentTarget
    const box = grid.getBoundingClientRect()
    handle.setPointerCapture(e.pointerId)
    let frame = 0
    let latest = ratioRef.current
    const move = ev => {
      latest = paneRatio(vertical ? ev.clientY - box.top - 7 : ev.clientX - box.left - 7, vertical ? box.height : box.width)
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const value = clampSplit(latest)
        ratioRef.current = value
        if (onRatio) onRatio(value)
        else grid.style.setProperty('--split', `${value}fr`)
      })
    }
    let ended = false
    const end = () => {
      if (ended) return
      ended = true
      handle.removeEventListener('pointermove', move)
      if (frame) cancelAnimationFrame(frame)
      commit(latest)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end, { once: true })
    handle.addEventListener('pointercancel', end, { once: true })
  }
  function onKeyDown(e) {
    const grow = vertical ? e.key === 'ArrowDown' : e.key === 'ArrowRight'
    const shrink = vertical ? e.key === 'ArrowUp' : e.key === 'ArrowLeft'
    const step = grow ? 1.12 : shrink ? 1 / 1.12 : 0
    if (!step) return
    e.preventDefault()
    commit(ratioRef.current * step)
  }
  const percent = Math.round(ratio / (ratio + 1) * 100)
  const Grip = vertical ? GripHorizontal : GripVertical
  return <div ref={ref} className={`workspace-grid${vertical ? ' axis-y' : ''}${className ? ` ${className}` : ''}`} style={{ '--split': `${ratio}fr` }}>
    {panes[0]}
    <button type="button" className="split-bar" aria-label={vertical ? 'Resize the panes vertically' : 'Resize the two panes'} aria-orientation={vertical ? 'horizontal' : 'vertical'} aria-valuemin={20} aria-valuemax={80} aria-valuenow={percent} title="Drag to resize" onPointerDown={onPointerDown} onKeyDown={onKeyDown} onDoubleClick={() => commit(1)}><Grip size={14} /></button>
    {panes[1]}
  </div>
}

function Sample({ onClick }) { return <button className="text-action" onClick={onClick}><Sparkles size={13} /> Load sample</button> }

function ExampleSelect({ examples, value, onPick }) {
  const keys = Object.keys(examples)
  if (!keys.length) return null
  const selected = keys.find(key => examples[key] === value) ?? ''
  return <label>Example<select value={selected} onChange={e => { if (e.target.value) onPick(examples[e.target.value]) }}><option value="">Custom</option>{keys.map(key => <option key={key} value={key}>{key}</option>)}</select></label>
}

function mermaidTheme() {
  const saved = document.documentElement.dataset.theme
  if (saved === 'light') return 'default'
  if (saved === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'default' : 'dark'
}

function fitClassBoxes(svg) {
  for (const node of svg.querySelectorAll('.node')) {
    const outer = node.querySelector('.label-container')
    if (!outer || !node.getCTM()) continue
    const groups = [...node.querySelectorAll('.annotation-group, .label-group, .members-group, .methods-group')].filter(group => group.querySelector('text'))
    if (!groups.length) continue
    outer.setAttribute('display', 'none')
    node.querySelectorAll('.divider').forEach(divider => divider.setAttribute('display', 'none'))
    const boxes = groups.map(group => ({ box: boxInNode(node, group) })).sort((a, b) => a.box.y - b.box.y)
    outer.removeAttribute('display')
    node.querySelectorAll('.divider').forEach(divider => divider.removeAttribute('display'))
    const padX = 16
    const padY = 8
    const x = Math.min(...boxes.map(item => item.box.x)) - padX
    const y = Math.min(...boxes.map(item => item.box.y)) - padY
    const right = Math.max(...boxes.map(item => item.box.x + item.box.width)) + padX
    const bottom = Math.max(...boxes.map(item => item.box.y + item.box.height)) + padY
    const d = `M${x},${y}H${right}V${bottom}H${x}Z`
    const paths = [...outer.querySelectorAll('path')]
    paths.forEach((path, index) => path.setAttribute('d', index === 0 ? d : ''))
    const gaps = []
    for (let i = 0; i < boxes.length - 1; i++) {
      const above = boxes[i].box
      const below = boxes[i + 1].box
      gaps.push((above.y + above.height + below.y) / 2)
    }
    ;[...node.querySelectorAll('.divider')].forEach((divider, index) => {
      const gy = gaps[index]
      if (gy == null) { divider.setAttribute('display', 'none'); return }
      divider.querySelectorAll('path').forEach(path => path.setAttribute('d', `M${x},${gy}H${right}`))
    })
  }
}

function boxInNode(node, element) {
  const box = element.getBBox()
  const matrix = node.getCTM().inverse().multiply(element.getCTM())
  const points = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
    .map(([px, py]) => new DOMPoint(px, py).matrixTransform(matrix))
  const xs = points.map(point => point.x)
  const ys = points.map(point => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

function fitMermaidSvg(svg) {
  svg.style.removeProperty('max-width')
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  try {
    const box = svg.getBBox()
    if (box.width > 0 && box.height > 0) {
      const pad = 16
      svg.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`)
      svg.style.width = `${Math.ceil(box.width + pad * 2)}px`
      svg.style.height = `${Math.ceil(box.height + pad * 2)}px`
    }
  } catch { /* getBBox throws before the SVG is in the document */ }
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.display = 'block'
  svg.style.maxWidth = 'none'
  svg.style.overflow = 'visible'
}

function mermaidSvgMarkup(svg) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  return new XMLSerializer().serializeToString(clone)
}

function svgToPngBlob(svg) {
  const xml = mermaidSvgMarkup(svg)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  const view = svg.viewBox?.baseVal
  const width = Math.max(1, Math.ceil(view?.width || svg.clientWidth || 1))
  const height = Math.max(1, Math.ceil(view?.height || svg.clientHeight || 1))
  const scale = 2
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode the image.')), 'image/png')
    }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not draw the diagram.')) }
    image.src = url
  })
}

async function copyPngBlob(blob) {
  if (typeof ClipboardItem === 'undefined' || typeof navigator.clipboard?.write !== 'function') {
    const error = new Error('Copying images is not supported in this browser.')
    error.name = 'NotSupportedError'
    throw error
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

const DRAWIO_FILES_KEY = 'supercharger:drawio-files'

function readDrawioFiles() {
  try {
    const rows = JSON.parse(localStorage.getItem(DRAWIO_FILES_KEY) || '[]')
    return Array.isArray(rows) ? rows.filter(row => row && row.id && row.name && typeof row.xml === 'string') : []
  } catch { return [] }
}

function writeDrawioFiles(rows) {
  localStorage.setItem(DRAWIO_FILES_KEY, JSON.stringify(rows))
}

const DRAWIO_AUTOSAVE_KEY = 'supercharger:drawio-autosave'

function drawioXml(raw) {
  const text = String(raw || '')
  if (text.includes('<')) return text
  try { const decoded = atob(text); if (decoded.includes('<')) return decoded } catch { /* already xml or empty */ }
  return text
}

const graphColors = ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9']
const drawioSrc = `${import.meta.env.BASE_URL}drawio/index.html?embed=1&ui=min&spin=1&proto=json&libraries=1&noSaveBtn=1&noExitBtn=1&offline=1`

const blankDrawioXml = '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'
function Swap({ onClick }) { return <button className="icon-action" title="Use result as input" onClick={onClick}><RefreshCw size={14} /> Swap</button> }
function pair(left, right, output, error) { return <Split><Editor value={left} onChange={v => set(right, 'input', v)} /><Output value={output} error={error} /></Split> }

function contentIndent(indent) {
  return indent === 'tab' ? '\t' : Number(indent)
}

function checked(data, key) {
  const value = textValue(data, key, false)
  return value === true || value === 'true'
}

function JSONTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.json)
  const indent = textValue(data, 'indent', '2')
  const mode = textValue(data, 'mode', 'format')
  const sort = checked(data, 'sort')
  let output = '', error = ''
  try { output = formatJson(input, { mode, indent, sort }) }
  catch (e) { error = input ? e.message : ''; }
  return <div className="tool-content">
    <div className="inline-controls"><label>Action<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="format">Format JSON</option><option value="minify">Minify JSON</option></select></label><label>Indentation<select value={indent} onChange={e => set(setData, 'indent', e.target.value)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label><label className="check-pill"><input type="checkbox" checked={sort} onChange={e => set(setData, 'sort', e.target.checked)} />Sort properties</label><Sample onClick={() => set(setData, 'input', initialSamples.json)} /></div>
    <Split><Editor value={input} onChange={v => set(setData, 'input', v)} label="JSON input" language="json" /><Output value={output} label="Formatted JSON" error={!!error} language="json" placeholder={error || 'Enter valid JSON to see the result.'} /></Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function SQLTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.sql)
  const indent = textValue(data, 'indent', '2')
  const language = textValue(data, 'language', 'sql')
  const leadingComma = checked(data, 'leadingComma')
  let output = '', error = ''
  try { output = formatSql(input, { language, indent, leadingComma }) }
  catch (e) { error = input ? e.message : '' }
  return <div className="tool-content">
    <div className="inline-controls"><label>SQL language<select value={language} onChange={e => set(setData, 'language', e.target.value)}>{sqlLanguages.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Indentation<select value={indent} onChange={e => set(setData, 'indent', e.target.value)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label><label className="check-pill"><input type="checkbox" checked={leadingComma} onChange={e => set(setData, 'leadingComma', e.target.checked)} />Leading commas</label><Sample onClick={() => set(setData, 'input', initialSamples.sql)} /></div>
    <Split><Editor value={input} onChange={v => set(setData, 'input', v)} label="SQL input" language="sql" /><Output value={output} label="Formatted SQL" error={!!error} language="sql" placeholder={error || 'Enter SQL to format.'} /></Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function XMLTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.xml)
  const indent = textValue(data, 'indent', '2')
  const newlineOnAttributes = checked(data, 'newlineOnAttributes')
  let output = '', error = ''
  try { output = formatXml(input, { indent, newlineOnAttributes }) }
  catch (e) { error = input ? e.message : '' }
  return <div className="tool-content">
    <div className="inline-controls"><label>Indentation<select value={indent} onChange={e => set(setData, 'indent', e.target.value)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option><option value="minify">Minified</option></select></label><label className="check-pill"><input type="checkbox" checked={newlineOnAttributes} onChange={e => set(setData, 'newlineOnAttributes', e.target.checked)} />New line on attributes</label><Sample onClick={() => set(setData, 'input', initialSamples.xml)} /></div>
    <Split><Editor value={input} onChange={v => set(setData, 'input', v)} label="XML input" language="xml" /><Output value={output} label="Formatted XML" error={!!error} language="xml" placeholder={error || 'Enter XML to format.'} /></Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function Base64Tool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.base64), mode = textValue(data, 'mode', 'encode'), encoding = textValue(data, 'encoding', 'utf8')
  const multiline = textValue(data, 'multiline', true) !== false && textValue(data, 'multiline', true) !== 'false'
  let result = '', error = ''
  try {
    result = convertBase64Text(input, encoding, mode, multiline)
  } catch (e) { error = input ? (e.message || 'Invalid Base64 or malformed text.') : '' }
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="encode">Text → Base64</option><option value="decode">Base64 → text</option></select></label><label>Encoding<select value={encoding} onChange={e => set(setData, 'encoding', e.target.value)}><option value="utf8">UTF-8</option><option value="ascii">ASCII</option></select></label><MultilineToggle checked={multiline} onChange={v => set(setData, 'multiline', v)} /><Sample onClick={() => { set(setData, 'mode', 'encode'); set(setData, 'encoding', 'utf8'); set(setData, 'input', initialSamples.base64) }} /></div><Split><Editor label={mode === 'encode' ? 'Plain text' : 'Base64 input'} value={input} onChange={v => set(setData, 'input', v)} multiline={multiline} /><Output label={mode === 'encode' ? 'Base64 output' : 'Decoded text'} value={result} error={!!error} placeholder={error || 'Enter text to convert.'} multiline={multiline} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

function URLTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.url), direction = textValue(data, 'direction', 'encode')
  const multiline = textValue(data, 'multiline', true) !== false && textValue(data, 'multiline', true) !== 'false'
  let output = '', error = ''
  try { output = convertUrl(input, direction, multiline) }
  catch (e) { error = e.message }
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={direction} onChange={e => set(setData, 'direction', e.target.value)}><option value="encode">Encode</option><option value="decode">Decode</option></select></label><MultilineToggle checked={multiline} onChange={v => set(setData, 'multiline', v)} /><Sample onClick={() => { set(setData, 'direction', 'encode'); set(setData, 'input', initialSamples.url) }} /><span className="muted-tip">Uses encodeURIComponent / decodeURIComponent, like DevToys.</span></div><Split><Editor value={input} onChange={v => set(setData, 'input', v)} multiline={multiline} /><Output value={output} error={!!error} placeholder={error || 'Enter text to convert.'} multiline={multiline} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

function HTMLTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.html), direction = textValue(data, 'direction', 'encode')
  const output = direction === 'encode' ? encodeHtml(input) : decodeHtml(input)
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={direction} onChange={e => set(setData, 'direction', e.target.value)}><option value="encode">Escape HTML</option><option value="decode">Decode entities</option></select></label><Sample onClick={() => { set(setData, 'direction', 'encode'); set(setData, 'input', initialSamples.html) }} /></div><Split><Editor label="Text or markup" value={input} onChange={v => set(setData, 'input', v)} language={direction === 'encode' ? 'html' : undefined} /><Output label="Result" value={output} language={direction === 'decode' ? 'html' : undefined} /></Split></div>
}

function JWTTool({ data, setData }) {
  const mode = textValue(data, 'mode', 'decode')
  const input = textValue(data, 'input', initialSamples.jwt)
  const payload = textValue(data, 'payload', initialSamples.jwtPayload)
  const secret = textValue(data, 'secret', initialSamples.jwtSecret)
  const algorithm = textValue(data, 'algorithm', 'HS256')
  const [encoded, setEncoded] = useState('')
  const [encodeError, setEncodeError] = useState('')
  let output = '', error = ''
  if (mode === 'decode') {
    try { output = formatJwtDecoded(decodeJwt(input)) }
    catch (e) { error = input ? e.message : '' }
  }
  useEffect(() => {
    let alive = true
    if (mode !== 'encode') { setEncoded(''); setEncodeError(''); return }
    encodeJwtHs({ payload, secret, algorithm }).then(token => { if (alive) { setEncoded(token); setEncodeError('') } }).catch(e => { if (alive) { setEncoded(''); setEncodeError(e.message) } })
    return () => { alive = false }
  }, [mode, payload, secret, algorithm])
  return <div className="tool-content">
    <div className="notice"><Fingerprint size={16} /><span>Decode mode does not verify signatures. Encode supports HMAC (HS256, HS384, HS512) only.</span></div>
    <div className="inline-controls"><label>Mode<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="decode">Decode token</option><option value="encode">Encode token</option></select></label>{mode === 'encode' && <label>Algorithm<select value={algorithm} onChange={e => set(setData, 'algorithm', e.target.value)}>{['HS256', 'HS384', 'HS512'].map(a => <option key={a}>{a}</option>)}</select></label>}<Sample onClick={() => setData({ mode: 'decode', input: initialSamples.jwt, payload: initialSamples.jwtPayload, secret: initialSamples.jwtSecret })} /></div>
    {mode === 'decode'
      ? <Split><Editor label="JWT token" value={input} onChange={v => set(setData, 'input', v)} placeholder="Paste a three-part JWT…" /><Output label="Decoded claims" value={output} error={!!error} placeholder={error || 'Paste a JWT to decode it.'} /></Split>
      : <Split><div className="jwt-stack"><Editor label="Payload JSON" value={payload} onChange={v => set(setData, 'payload', v)} rows={10} language="json" /><label className="jwt-secret">Signing secret<input value={secret} onChange={e => set(setData, 'secret', e.target.value)} spellCheck="false" /></label></div><Output label="Encoded JWT" value={encoded} error={!!encodeError} placeholder={encodeError || 'Enter payload JSON and a secret.'} rows={12} /></Split>}
    {(error || encodeError) && <p className="error-note">{error || encodeError}</p>}
  </div>
}

function GZipTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.gzip), mode = textValue(data, 'mode', 'compress')
  const [output, setOutput] = useState(''), [ratio, setRatio] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    let alive = true
    setBusy(true)
    setError('')
    if (!input && mode === 'decompress') {
      setOutput('')
      setRatio(null)
      setBusy(false)
      return
    }
    const run = mode === 'compress' ? compressGzip(input) : decompressGzip(input)
    run.then(result => {
      if (!alive) return
      if (result.error) {
        setError(result.error)
        setOutput('')
        setRatio(null)
        return
      }
      setOutput(result.data)
      setRatio(result.ratio)
    }).catch(e => {
      if (!alive) return
      setError(e.message || 'GZip conversion failed.')
      setOutput('')
      setRatio(null)
    }).finally(() => alive && setBusy(false))
    return () => { alive = false }
  }, [input, mode])
  const ratioLabel = mode === 'compress' ? 'Compression ratio' : 'Expansion ratio'
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="compress">Compress</option><option value="decompress">Decompress</option></select></label><Sample onClick={() => setData({ mode: 'compress', input: initialSamples.gzip })} /><span className="muted-tip">Wire format is Base64 GZip, like DevToys.</span></div>
    {ratio != null && Number.isFinite(ratio) && output && !error && <div className="gzip-ratio"><span>{ratioLabel}</span><strong>{ratio.toFixed(1)}%</strong><small>{mode === 'compress' ? `${input.length} chars → ${output.length} chars (Base64)` : `${output.length} chars ← ${input.length} chars (Base64)`}</small></div>}
    <Split><Editor label={mode === 'compress' ? 'Plain text' : 'Base64 GZip'} value={input} onChange={v => set(setData, 'input', v)} /><Output label="Result" value={output} error={!!error} placeholder={busy ? 'Working…' : error || 'Enter text to convert.'} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

function Base64ImageTool({ data, setData }) {
  const input = textValue(data, 'input', ''), mode = textValue(data, 'mode', 'encode'), mime = textValue(data, 'mime', 'image/png')
  const [previewOpen, setPreviewOpen] = useState(false)
  let output = '', error = '', preview = ''
  try {
    if (mode === 'decode') {
      const parsed = parseDataUrl(input)
      output = parsed.base64
      preview = toDataUrl(parsed.base64, parsed.mime)
    }
  } catch (e) { error = input ? e.message : '' }
  async function encodeFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    setData({ mode: 'encode', mime: file.type || 'application/octet-stream', input: '', output: encodeBytesBase64(bytes) })
  }
  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    await encodeFile(file)
    e.target.value = ''
  }
  async function pasteClipboard() {
    try {
      if (mode === 'decode') set(setData, 'input', await readClipboardText())
      else await encodeFile(await readClipboardImageFile())
    } catch (e) { toast(clipboardDialogMessage(mode === 'decode' ? 'text' : 'image', e), 'error') }
  }
  const encodedOut = mode === 'encode' ? textValue(data, 'output', '') : output
  if (mode === 'encode' && encodedOut) preview = toDataUrl(encodedOut, mime)
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="encode">Image → Base64</option><option value="decode">Base64 → preview</option></select></label><label className="file-button"><FileUp size={14} /> Choose image<input type="file" accept="image/*" onChange={onFile} /></label><button type="button" className="text-action" onClick={pasteClipboard}><ClipboardPaste size={13} /> Paste from clipboard</button></div>
    {mode === 'encode'
      ? <Output label="Base64 output" value={encodedOut} placeholder="Choose or paste an image to encode." rows={12} actions={<CopyAction value={encodedOut} />} />
      : <Split><Editor label="Base64 or data URL" value={input} onChange={v => set(setData, 'input', v)} placeholder="Paste Base64 or a data:image/… URL" /><Output label="Base64" value={output} error={!!error} placeholder={error || 'Paste image data to decode.'} rows={8} /></Split>}
    {preview && !error && <section className="editor-card media-preview-card"><div className="panel-top"><span>Preview</span><button type="button" className="text-action" onClick={() => setPreviewOpen(true)}>Open preview</button></div><button type="button" className="media-preview-button" onClick={() => setPreviewOpen(true)}><img className="media-preview" src={preview} alt="Decoded preview" /></button></section>}
    {previewOpen && preview && <ImagePreviewModal src={preview} alt="Image preview" onClose={() => setPreviewOpen(false)} />}
  </div>
}

function CertificateTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.certificate)
  let output = '', error = ''
  try { output = decodeCertificate(input) }
  catch (e) { error = input.trim() ? e.message : '' }
  return <div className="tool-content"><div className="inline-controls"><Sample onClick={() => set(setData, 'input', initialSamples.certificate)} /><PasteTextButton onPaste={text => set(setData, 'input', text)} /><span className="muted-tip">PEM X.509 public certificates only · no PFX passwords</span></div><Split><Editor label="Certificate PEM" value={input} onChange={v => set(setData, 'input', v)} rows={14} /><Output label="Decoded details" value={output} error={!!error} placeholder={error || 'Paste a PEM certificate.'} rows={14} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

async function readQrText(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return jsQR(imageData.data, canvas.width, canvas.height)?.data ?? ''
}

function QRCodeTool({ data, setData }) {
  const text = textValue(data, 'text', initialSamples.qrcode), mode = textValue(data, 'mode', 'encode'), decoded = textValue(data, 'decoded', '')
  const [imageUrl, setImageUrl] = useState(''), [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    if (mode !== 'encode' || !text) { setImageUrl(''); return }
    setError('')
    QRCode.toDataURL(text, { margin: 1, width: 280 }).then(url => { if (alive) setImageUrl(url) }).catch(e => { if (alive) { setImageUrl(''); setError(e.message) } })
    return () => { alive = false }
  }, [text, mode])
  async function applyQrFile(file) {
    setError('')
    const value = await readQrText(file)
    setData({ mode: 'decode', decoded: value })
    if (!value) setError('No QR code found in that image.')
  }
  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { await applyQrFile(file) } catch (err) { setError(err.message) }
  }
  async function pasteClipboard() {
    try {
      if (mode === 'encode') set(setData, 'text', await readClipboardText())
      else await applyQrFile(await readClipboardImageFile())
    } catch (e) { toast(clipboardDialogMessage(mode === 'encode' ? 'text' : 'image', e), 'error') }
  }
  return <div className="tool-content"><div className="inline-controls"><label>Mode<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="encode">Generate</option><option value="decode">Read image</option></select></label>{mode === 'encode' ? <Sample onClick={() => setData({ text: initialSamples.qrcode, mode: 'encode' })} /> : <label className="file-button"><FileUp size={14} /> QR image<input type="file" accept="image/*" onChange={onFile} /></label>}<button type="button" className="text-action" onClick={pasteClipboard}><ClipboardPaste size={13} /> Paste from clipboard</button></div>
    {mode === 'encode'
      ? <><Editor label="Text or URL" value={text} onChange={v => set(setData, 'text', v)} rows={4} />{imageUrl && <section className="editor-card media-preview-card"><div className="panel-top"><span>QR code</span><CopyAction value={text} label="Copy text" /></div><img className="media-preview qr-preview" src={imageUrl} alt="" /></section>}</>
      : <Output label="Decoded text" value={decoded} placeholder="Choose or paste a QR code image to read it." rows={6} />}
    {error && <p className="error-note">{error}</p>}
  </div>
}

const numberBaseFields = [
  { base: '2', key: 'b2', label: 'Binary' },
  { base: '8', key: 'b8', label: 'Octal' },
  { base: '10', key: 'b10', label: 'Decimal' },
  { base: '16', key: 'b16', label: 'Hexadecimal' },
]

function NumberBaseTool({ data, setData }) {
  const formatNumber = textValue(data, 'formatNumber', false) === true || textValue(data, 'formatNumber', false) === 'true'
  const seeded = numberBaseFields.every(field => !textValue(data, field.key, ''))
  const defaults = convertFromBase(initialSamples['number-base'], '10', { formatNumber })
  const values = Object.fromEntries(numberBaseFields.map(field => [field.base, seeded ? defaults[field.base] : textValue(data, field.key, '')]))
  let error = ''
  if (!seeded) {
    try {
      const source = numberBaseFields.find(field => textValue(data, field.key, '') !== '') || numberBaseFields[2]
      convertFromBase(textValue(data, source.key, ''), source.base, { formatNumber })
    } catch (e) { error = e.message }
  }
  function onChange(base, text) {
    const field = numberBaseFields.find(item => item.base === base)
    const patch = { [field.key]: text }
    try {
      const converted = convertFromBase(text, base, { formatNumber })
      numberBaseFields.forEach(item => { patch[item.key] = converted[item.base] })
      setData(patch)
    } catch {
      setData(patch)
    }
  }
  function toggleFormatNumber() {
    const source = numberBaseFields.find(field => textValue(data, field.key, '') !== '') || numberBaseFields[2]
    const next = !formatNumber
    try {
      const converted = convertFromBase(textValue(data, source.key, seeded ? initialSamples['number-base'] : ''), source.base, { formatNumber: next })
      setData({ formatNumber: next, b2: converted[2], b8: converted[8], b10: converted[10], b16: converted[16] })
    } catch {
      setData({ formatNumber: next })
    }
  }
  return <div className="tool-content">
    <div className="inline-controls"><label className="check-pill"><input type="checkbox" checked={formatNumber} onChange={toggleFormatNumber} />Format number</label><Sample onClick={() => { const converted = convertFromBase(initialSamples['number-base'], '10', { formatNumber }); setData({ formatNumber, b2: converted[2], b8: converted[8], b10: converted[10], b16: converted[16] }) }} /><span className="muted-tip">Edit any base — the other fields update automatically.</span></div>
    <div className="base-grid">{numberBaseFields.map(field => <div className={`base-field${error ? ' has-error' : ''}`} key={field.base}><label>{field.label}<small>BASE {field.base}</small></label><input value={values[field.base]} onChange={e => onChange(field.base, e.target.value)} spellCheck="false" placeholder={field.base === '10' ? 'e.g. 2026' : ''} /></div>)}</div>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function CronParserTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.cron)
  const count = Number(textValue(data, 'count', '10'))
  let summary = [], description = '', runs = [], error = ''
  try {
    if (!input.trim()) throw new Error('Enter a cron expression.')
    const parsed = parseCronExpression(input)
    summary = cronFieldSummary(parsed)
    description = describeCron(parsed)
    runs = nextCronRuns(input, Math.max(1, Math.min(25, count)))
  } catch (e) { error = input.trim() ? e.message : '' }
  return <div className="tool-content">
    <div className="inline-controls"><label>Upcoming runs<select value={count} onChange={e => set(setData, 'count', e.target.value)}>{[5, 10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}</select></label><Sample onClick={() => set(setData, 'input', initialSamples.cron)} /><span className="muted-tip">5 fields (minute hour day month weekday) or 6 with seconds · local time</span></div>
    <Editor label="Cron expression" value={input} onChange={v => set(setData, 'input', v)} rows={3} placeholder="0 9 * * 1-5" />
    {!error && summary.length > 0 && <>
      <div className="cron-summary">{summary.map(field => <div key={field.label}><span>{field.label}</span><code>{field.value}</code></div>)}</div>
      <p className="cron-description">{description}</p>
      <div className="cron-runs">{runs.map((run, index) => <div className="cron-run" key={run.getTime()}><span>#{index + 1}</span><strong>{formatCronRunLocal(run)}</strong><CopyAction value={run.toISOString()} label="UTC" /></div>)}</div>
    </>}
    {error && <p className="error-note">{error}</p>}
  </div>
}

function JsonTableTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples['json-table']), format = textValue(data, 'format', 'table')
  let table = { columns: [], rows: [] }, output = '', error = ''
  try {
    if (!input.trim()) throw new Error('Enter JSON to convert.')
    table = jsonToTable(input)
    if (!table.rows.length) throw new Error('Nothing to show — use a JSON array or object.')
    output = format === 'table' ? '' : tableToDelimited(table, format === 'tsv' ? '\t' : ',')
  } catch (e) { error = input.trim() ? e.message : '' }
  const tableView = !error && format === 'table' && table.rows.length > 0
  return <div className="tool-content">
    <div className="inline-controls"><label>Output<select value={format} onChange={e => set(setData, 'format', e.target.value)}><option value="table">Table</option><option value="csv">CSV</option><option value="tsv">TSV</option></select></label><Sample onClick={() => set(setData, 'input', initialSamples['json-table'])} /></div>
    <Split>
      <Editor label="JSON input" value={input} onChange={v => set(setData, 'input', v)} language="json" />
      {tableView ? <section className="editor-card json-table-card"><div className="panel-top"><span>Table preview</span><span>{table.rows.length} row{table.rows.length === 1 ? '' : 's'}</span></div><table className="json-table"><thead><tr>{table.columns.map(col => <th key={col}>{col}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={index}>{table.columns.map(col => <td key={col}>{row[col]}</td>)}</tr>)}</tbody></table></section>
        : <Output label={format === 'csv' ? 'CSV output' : format === 'tsv' ? 'TSV output' : 'Table preview'} value={output} error={!!error} placeholder={error || 'Enter valid JSON to build a table.'} />}
    </Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function TimestampTool({ data, setData }) {
  const mode = textValue(data, 'mode', 'seconds'), input = textValue(data, 'input', initialSamples.timestamp)
  let date, error = ''
  try { date = mode === 'date' ? new Date(input) : new Date(Number(input) * (mode === 'seconds' ? 1000 : 1)); if (!input || !Number.isFinite(date.getTime())) throw new Error('Enter a valid timestamp or date.') }
  catch (e) { error = e.message }
  const seconds = date && Math.floor(date.getTime() / 1000), millis = date && date.getTime()
  return <div className="tool-content"><div className="inline-controls"><label>Input format<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="seconds">Unix seconds</option><option value="milliseconds">Unix milliseconds</option><option value="date">Date and time</option></select></label><button className="text-action" onClick={() => { set(setData, 'mode', 'milliseconds'); set(setData, 'input', String(Date.now())) }}><Clock3 size={14} /> Use current time</button></div><Editor label={mode === 'date' ? 'Date and time' : 'Unix timestamp'} value={input} onChange={v => set(setData, 'input', v)} rows={3} /><div className="timestamp-results"><div><span>UTC</span><strong>{date && !error ? date.toISOString() : '—'}</strong></div><div><span>Your local time</span><strong>{date && !error ? date.toLocaleString() : '—'}</strong></div><div><span>Unix seconds</span><code>{!error ? seconds : '—'}</code><CopyAction value={!error ? String(seconds) : ''} /></div><div><span>Unix milliseconds</span><code>{!error ? millis : '—'}</code><CopyAction value={!error ? String(millis) : ''} /></div></div>{error && <p className="error-note">{error}</p>}</div>
}

function UUIDTool({ data, setData }) {
  const count = Number(textValue(data, 'count', '1'))
  const version = textValue(data, 'version', '4')
  const hyphens = textValue(data, 'hyphens', true) !== false && textValue(data, 'hyphens', true) !== 'false'
  const uppercase = textValue(data, 'uppercase', false) === true || textValue(data, 'uppercase', false) === 'true'
  const output = textValue(data, 'output', '')
  function generate() {
    set(setData, 'output', Array.from({ length: count }, () => generateUuid(version, hyphens, uppercase)).join('\n'))
  }
  return <div className="tool-content generator-content">
    <div className="inline-controls">
      <label>How many<select value={count} onChange={e => set(setData, 'count', e.target.value)}>{[1, 5, 10, 25, 50].map(n => <option key={n}>{n}</option>)}</select></label>
      <label>Version<select value={version} onChange={e => set(setData, 'version', e.target.value)}><option value="1">UUID v1 (time-based)</option><option value="4">UUID v4 (random)</option><option value="7">UUID v7 (Unix time)</option></select></label>
    </div>
    <div className="check-grid">
      <label className="check-pill"><input type="checkbox" checked={hyphens} onChange={e => set(setData, 'hyphens', e.target.checked)} />Hyphens</label>
      <label className="check-pill"><input type="checkbox" checked={uppercase} onChange={e => set(setData, 'uppercase', e.target.checked)} />Uppercase</label>
    </div>
    <button className="primary-button" onClick={generate}><Sparkles size={16} /> Generate UUID{count > 1 ? 's' : ''}</button>
    <Output label="UUIDs" value={output} placeholder="Your UUIDs will appear here…" rows={Math.min(12, Math.max(5, count))} />
  </div>
}

function HashTool({ data, setData }) {
  const input = textValue(data, 'input', ''), algorithm = textValue(data, 'algorithm', 'SHA-256')
  const expected = textValue(data, 'expected', '')
  const [output, setOutput] = useState(''), [error, setError] = useState(''), [fileName, setFileName] = useState('')
  const integrity = compareDigests(output, expected)
  useEffect(() => { let alive = true; if (!input) { setOutput(''); setError(''); return } crypto.subtle.digest(algorithm, new TextEncoder().encode(input)).then(hash => { if (alive) setOutput(Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')) }).catch(e => alive && setError(e.message)); return () => { alive = false } }, [input, algorithm])
  async function onFile(e) { const file = e.target.files?.[0]; if (!file) return; setFileName(file.name); setError(''); try { const hash = await crypto.subtle.digest(algorithm, await file.arrayBuffer()); setOutput(Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')) } catch (err) { setError(err.message) } }
  return <div className="tool-content"><div className="inline-controls"><label>Algorithm<select value={algorithm} onChange={e => set(setData, 'algorithm', e.target.value)}>{['SHA-1','SHA-256','SHA-384','SHA-512'].map(a => <option key={a}>{a}</option>)}</select></label><label className="file-button"><FileUp size={14} /> Hash a file<input type="file" onChange={onFile} /></label></div><Editor label="Text to hash" value={input} onChange={v => { setFileName(''); set(setData, 'input', v) }} placeholder="Enter text, or choose a file above…" rows={8} /><Output label={fileName ? `SHA digest · ${fileName}` : `${algorithm} digest`} value={output} placeholder={error || 'Digest will appear here.'} rows={4} /><Editor label="Expected digest (data integrity check)" value={expected} onChange={v => set(setData, 'expected', v)} placeholder="Paste a digest to compare…" rows={2} />{integrity === true && <p className="integrity-note match">Digests match.</p>}{integrity === false && <p className="integrity-note mismatch">Digests do not match.</p>}{error && <p className="error-note">{error}</p>}<p className="subtle">Runs locally with the browser Web Crypto API.</p></div>
}

const charsets = { Uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', Lowercase: 'abcdefghijklmnopqrstuvwxyz', Numbers: '0123456789', Symbols: '!@#$%^&*()-_=+[]{};:,.?' }
function secureInt(max) { const ceiling = Math.floor(0x100000000 / max) * max; const buf = new Uint32Array(1); do crypto.getRandomValues(buf); while (buf[0] >= ceiling); return buf[0] % max }
function PasswordTool({ data, setData }) {
  const length = Number(textValue(data, 'length', '20')), count = Number(textValue(data, 'count', '1')), selected = textValue(data, 'sets', ['Uppercase','Lowercase','Numbers','Symbols']), output = textValue(data, 'output', '')
  function toggle(name) { set(setData, 'sets', selected.includes(name) ? selected.filter(s => s !== name) : [...selected, name]) }
  function generate() { const chars = selected.map(k => charsets[k]).join(''); if (!chars) return; set(setData, 'output', Array.from({ length: count }, () => Array.from({ length }, () => chars[secureInt(chars.length)]).join('')).join('\n')) }
  return <div className="tool-content generator-content"><div className="inline-controls"><label>Length<input type="number" min="4" max="128" value={length} onChange={e => set(setData, 'length', Math.max(4, Math.min(128, Number(e.target.value))))} /></label><label>Count<select value={count} onChange={e => set(setData, 'count', e.target.value)}>{[1,5,10,25].map(n => <option key={n}>{n}</option>)}</select></label></div><div className="check-grid">{Object.keys(charsets).map(name => <label className="check-pill" key={name}><input type="checkbox" checked={selected.includes(name)} onChange={() => toggle(name)} />{name}</label>)}</div><button className="primary-button" onClick={generate} disabled={!selected.length}><Sparkles size={16} /> Generate password{count > 1 ? 's' : ''}</button><Output label="Generated passwords" value={output} placeholder="Your password will appear here…" rows={Math.min(12, Math.max(5, count))} /></div>
}

function LoremTool({ data, setData }) {
  const count = Number(textValue(data, 'count', '3'))
  const unit = textValue(data, 'unit', 'paragraphs')
  const corpus = textValue(data, 'corpus', 'loremipsum')
  const output = textValue(data, 'output', '')
  function generate() {
    set(setData, 'output', generateLipsum(corpus, unit, count))
  }
  return <div className="tool-content generator-content">
    <div className="inline-controls">
      <label>Text corpus<select value={corpus} onChange={e => set(setData, 'corpus', e.target.value)}>{lipsumCorpusIds.map(id => <option key={id} value={id}>{lipsumCorpora[id].label}</option>)}</select></label>
      <label>Amount<input type="number" min="1" max="5000" value={count} onChange={e => set(setData, 'count', Math.max(1, Math.min(5000, Number(e.target.value))))} /></label>
      <label>Unit<select value={unit} onChange={e => set(setData, 'unit', e.target.value)}><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></label>
    </div>
    <button className="primary-button" onClick={generate}><Sparkles size={16} /> Generate text</button>
    <Output label="Lorem Ipsum" value={output} placeholder="Your placeholder text will appear here…" />
  </div>
}

function AnalyzerTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.analyzer)
  const info = useMemo(() => analyze(input), [input])
  const [caret, setCaret] = useState({ start: 0, end: 0 })
  const place = caretInfo(input, caret.start, caret.end)
  const original = data.original
  function edit(v) { setData({ input: v, original: null }) }
  function transform(fn) { setData({ original: original ?? input, input: fn(input) }) }
  function restore() { if (original != null) setData({ input: original, original: null }) }
  const stats = [['Characters', info.characters], ['Bytes', info.bytes], ['Words', info.words], ['Unique words', info.unique], ['Lines', info.lines], ['Sentences', info.sentences], ['Paragraphs', info.paragraphs], ['Line breaks', info.lineBreaks], ['Selection', place.length], ['Start', caret.start], ['End', caret.end], ['Line', place.line], ['Column', place.column]]
  const strips = [
    ['Line breaks', [['LF', toLF], ['CRLF', toCRLF]]],
    ['Case', [['lowercase', t => t.toLowerCase()], ['UPPERCASE', t => t.toUpperCase()], ['Sentence case', toSentence], ['Title Case', toTitle], ['camelCase', toCamel], ['PascalCase', toPascal], ['snake_case', toSnake], ['CONSTANT_CASE', toConstant], ['kebab-case', toKebab], ['COBOL-CASE', toCobol], ['Train-Case', toTrain], ['aLtErNaTiNg', toAlternating], ['iNVERSE', toInverse], ['raNdoM cASe', toRandomCase]]],
    ['Lines', [['Trim lines', trimLines], ['A → Z', t => sortLines(t, 1)], ['Z → A', t => sortLines(t, -1)], ['Sort last word', t => sortByLast(t, 1)], ['Sort last word ↓', t => sortByLast(t, -1)], ['Reverse lines', reverseLines], ['Shuffle lines', shuffleLines], ['Unique lines', uniqueLines]]],
  ]
  return <div className="tool-content">
    <div className="inline-controls" />
    <div className="stats-grid">{stats.map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong></div>)}</div>
    <Editor label="Text" value={input} onChange={edit} onSelect={e => setCaret({ start: e.target.selectionStart, end: e.target.selectionEnd })} actions={<><Sample onClick={() => edit(initialSamples.analyzer)} /><button className="text-action" onClick={restore} disabled={original == null}>Original</button></>} />
    {strips.map(([name, buttons]) => <div className="action-strip" key={name}><span>{name}</span>{buttons.map(([label, fn]) => <button className="chip-action" key={label} onClick={() => transform(fn)}>{label}</button>)}</div>)}
    <div className="freq-grid">
      <FreqList title="Word frequency" rows={info.wordFreq} />
      <FreqList title="Character frequency" rows={info.charFreq.map(([ch, n]) => [ch === ' ' ? '⎵ space' : ch === '\n' ? '⏎ line break' : ch === '\t' ? '⇥ tab' : ch, n])} />
    </div>
  </div>
}

function FreqList({ title, rows }) {
  const shown = rows.slice(0, 40)
  return <section className="editor-card freq-card"><div className="panel-top"><span>{title}</span><span>{rows.length ? `${shown.length}${rows.length > shown.length ? ` of ${rows.length}` : ''}` : '—'}</span></div><div className="freq-list">{shown.length ? shown.map(([name, count]) => <div key={name}><span>{name}</span><b>{count.toLocaleString()}</b></div>) : <p className="subtle">Nothing to count yet.</p>}</div></section>
}

function YAMLTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.yaml), direction = textValue(data, 'direction', 'yaml-json'), indent = textValue(data, 'indent', '2')
  let output = '', error = ''
  try {
    const spaces = contentIndent(indent)
    output = direction === 'yaml-json'
      ? JSON.stringify(parseYAML(input), null, spaces)
      : stringifyYAML(JSON.parse(input), { indent: spaces })
  }
  catch (e) { error = e.message }
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={direction} onChange={e => set(setData, 'direction', e.target.value)}><option value="yaml-json">YAML → JSON</option><option value="json-yaml">JSON → YAML</option></select></label><label>Indentation<select value={indent} onChange={e => set(setData, 'indent', e.target.value)}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label><Sample onClick={() => { set(setData, 'direction', 'yaml-json'); set(setData, 'input', initialSamples.yaml) }} /></div><Split><Editor label={direction === 'yaml-json' ? 'YAML input' : 'JSON input'} value={input} onChange={v => set(setData, 'input', v)} language={direction === 'yaml-json' ? 'yaml' : 'json'} /><Output label={direction === 'yaml-json' ? 'JSON output' : 'YAML output'} value={output} error={!!error} language={direction === 'yaml-json' ? 'json' : 'yaml'} placeholder={error || 'Enter valid input to convert.'} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

function MarkdownTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.markdown)
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(input), { FORBID_TAGS: ['img','iframe','video','audio','style','script'], FORBID_ATTR: ['style'] }), [input])
  function download() { const blob = new Blob([html], { type: 'text/html;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'markdown-preview.html'; a.click(); URL.revokeObjectURL(url) }
  return <div className="tool-content"><div className="inline-controls"><Sample onClick={() => set(setData, 'input', initialSamples.markdown)} /><button className="text-action" onClick={download}><Download size={14} /> Export HTML</button></div><Split className="markdown-grid"><Editor label="Markdown" value={input} onChange={v => set(setData, 'input', v)} /><section className="editor-card preview-card"><div className="panel-top"><span>Live preview</span><span className="live-label"><i /> Local preview</span></div><article className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} /></section></Split><p className="subtle">Remote images and embedded media are omitted from the preview.</p></div>
}

function JsxGraphTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.jsxgraph)
  const hostRef = useRef(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let board
    let frame = 0
    let sized = { w: 0, h: 0 }
    function plot() {
      const width = Math.round(host.clientWidth)
      const height = Math.round(host.clientHeight)
      if (width < 40 || height < 40) return
      if (board) {
        if (width === sized.w && height === sized.h) return
        sized = { w: width, h: height }
        board.resizeContainer(width, height, true)
        return
      }
      sized = { w: width, h: height }
      host.replaceChildren()
      const id = `jxg-${Math.random().toString(36).slice(2)}`
      const mount = document.createElement('div')
      mount.id = id
      mount.style.width = '100%'
      mount.style.height = '100%'
      host.appendChild(mount)
      board = JSXGraph.initBoard(id, {
        boundingbox: [-8, 8, 8, -8],
        axis: true,
        showNavigation: true,
        showCopyright: false,
        pan: { enabled: true, needShift: false, needTwoFingers: false },
        zoom: { wheel: true, needShift: false, needCtrl: true, pinch: true },
      })
      board.resizeContainer(width, height, true)
      const problems = []
      input.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach((line, index) => {
        const expr = line.replace(/^(?:f\s*\(\s*x\s*\)|y)\s*=\s*/i, '').trim()
        if (!expr) return
        try {
          const fn = board.jc.snippet(expr, true, 'x', true)
          board.create('functiongraph', [fn], {
            strokeColor: graphColors[index % graphColors.length],
            strokeWidth: 2,
            doAdvancedPlot: false,
            // ponytail: one point count. A lower count while dragging draws chords that vanish on release.
            numberPointsLow: 320,
            numberPointsHigh: 320,
          })
        } catch (e) {
          problems.push(`Line ${index + 1}: ${e.message}`)
        }
      })
      board.update()
      setError(problems.join('\n'))
    }
    plot()
    frame = requestAnimationFrame(plot)
    const observer = new ResizeObserver(plot)
    observer.observe(host)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      if (board) try { JSXGraph.freeBoard(board) } catch { /* ponytail: board may already be torn down */ }
    }
  }, [input])
  return <div className="tool-content diagram-tool">
    <div className="inline-controls">
      <ExampleSelect examples={jsxGraphExamples} value={input} onPick={value => set(setData, 'input', value)} />
      <span className="muted-tip">One expression per line · drag to pan · Ctrl+scroll to zoom</span>
    </div>
    <Split axis="y" storageKey="jsxgraph-height" className="diagram-stack">
      <Editor label="Functions of x" value={input} onChange={v => set(setData, 'input', v)} rows={8} placeholder={'sin(x)\nx^2\ny = exp(-x^2)'} />
      <section className="editor-card graph-board-card"><div className="panel-top"><span>Graph</span><span className="live-label"><i /> Interactive</span></div><div ref={hostRef} className="graph-board-host" /></section>
    </Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function MermaidTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.mermaid)
  const stageRef = useRef(null)
  const previewRef = useRef(null)
  const viewRef = useRef({ x: 0, y: 0, scale: 1 })
  const [view, setView] = useState(viewRef.current)
  const [error, setError] = useState('')
  const [themeTick, setThemeTick] = useState(0)
  viewRef.current = view
  function moveView(next) { viewRef.current = next; setView(next) }
  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver(() => setThemeTick(n => n + 1))
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    function onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const rect = stage.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const current = viewRef.current
      const scale = Math.min(6, Math.max(0.2, current.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)))
      const ratio = scale / current.scale
      moveView({ scale, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio })
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])
  useEffect(() => {
    const host = previewRef.current
    const stage = stageRef.current
    if (!host || !stage) return
    let cancelled = false
    const text = input.trim()
    host.replaceChildren()
    moveView({ x: 0, y: 0, scale: 1 })
    if (!text) { setError(''); return undefined }
    const node = document.createElement('div')
    node.className = 'mermaid'
    host.appendChild(node)
    let diagramType = ''
    try { diagramType = mermaid.detectType(text) } catch { /* unknown type keeps SVG labels */ }
    const htmlLabels = diagramType === 'mindmap'
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: mermaidTheme(),
      look: 'classic',
      layout: 'dagre',
      securityLevel: 'loose',
      fontFamily: "'DM Sans', sans-serif",
      htmlLabels,
      flowchart: { htmlLabels, curve: 'cardinal', useMaxWidth: false, nodeSpacing: 50, rankSpacing: 50 },
      class: { htmlLabels: false },
    })
    node.textContent = `%%{init: {"layout":"dagre","flowchart":{"curve":"cardinal","htmlLabels":${htmlLabels},"nodeSpacing":50,"rankSpacing":50},"class":{"htmlLabels":false}}}%%\n${text}`
    mermaid.run({ nodes: [node] }).then(() => {
      if (cancelled) return
      const svg = host.querySelector('svg')
      if (!svg) { setError('Mermaid did not draw a diagram.'); return }
      if (diagramType === 'classDiagram' || diagramType === 'class') fitClassBoxes(svg)
      fitMermaidSvg(svg)
      const sw = stage.clientWidth
      const sh = stage.clientHeight
      const bounds = svg.getBoundingClientRect()
      if (sw < 40 || sh < 40 || bounds.width < 1) { moveView({ x: 16, y: 16, scale: 1 }); setError(''); return }
      const scale = Math.min(1, (sw - 32) / bounds.width, (sh - 32) / bounds.height)
      const width = bounds.width * scale
      const height = bounds.height * scale
      moveView({ scale, x: Math.max(16, (stage.clientWidth - width) / 2), y: Math.max(16, (stage.clientHeight - height) / 2) })
      setError('')
    }).catch(e => {
      if (cancelled) return
      host.replaceChildren()
      setError(e.message || String(e))
    })
    return () => { cancelled = true }
  }, [input, themeTick])
  function onPointerDown(e) {
    if (e.button !== 0) return
    const stage = e.currentTarget
    const origin = { x: e.clientX, y: e.clientY, view: viewRef.current }
    try { stage.setPointerCapture(e.pointerId) } catch { /* pointer capture is optional; dragging still tracks the pointer */ }
    stage.classList.add('is-dragging')
    const move = ev => moveView({ ...origin.view, x: origin.view.x + ev.clientX - origin.x, y: origin.view.y + ev.clientY - origin.y })
    const end = () => { stage.classList.remove('is-dragging'); stage.removeEventListener('pointermove', move) }
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerup', end, { once: true })
    stage.addEventListener('pointercancel', end, { once: true })
  }
  async function previewPng() {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) throw new Error('Nothing to export yet.')
    return svgToPngBlob(svg)
  }
  async function copyImage() {
    await withToast('Copying image…', 'Copied image', async () => { await copyPngBlob(await previewPng()) })
  }
  async function downloadImage() {
    await withToast('Preparing image…', 'Download started', async () => { downloadBlob(await previewPng(), 'mermaid.png') })
  }
  return <div className="tool-content diagram-tool">
    <div className="inline-controls">
      <ExampleSelect examples={mermaidExamples} value={input} onPick={value => set(setData, 'input', value)} />
      <CopyAction value={input} label="Copy source" className="text-action" />
      <PasteTextButton onPaste={value => set(setData, 'input', value)} label="Paste source" />
      <span className="muted-tip">Drag to pan · Ctrl+scroll to zoom</span>
    </div>
    <Split className="markdown-grid">
      <Editor label="Mermaid source" value={input} onChange={v => set(setData, 'input', v)} />
      <section className={`editor-card preview-card mermaid-preview-card${error ? ' has-error' : ''}`}>
        <div className="panel-top"><span>Preview</span><div className="panel-actions"><button type="button" className="icon-action" onClick={copyImage}><Copy size={14} /> Copy image</button><button type="button" className="icon-action" onClick={downloadImage}><Download size={14} /> PNG</button></div></div>
        {error
          ? <pre className="mermaid-error">{error}</pre>
          : <div ref={stageRef} className="mermaid-stage" onPointerDown={onPointerDown}><div ref={previewRef} className="mermaid-preview" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} /></div>}
      </section>
    </Split>
  </div>
}

function DrawioTool() {
  const frameRef = useRef(null)
  const readyRef = useRef(false)
  const xmlRef = useRef(blankDrawioXml)
  const savedXmlRef = useRef(blankDrawioXml)
  const exportRef = useRef(null)
  const dirtyRef = useRef(false)
  const suspendRef = useRef(false)
  const autoRef = useRef(localStorage.getItem(DRAWIO_AUTOSAVE_KEY) !== '0')
  const nameRef = useRef('Untitled')
  const selectedIdRef = useRef('')
  const [zen, setZen] = useState(false)
  const [files, setFiles] = useState(readDrawioFiles)
  const [name, setName] = useState('Untitled')
  const [selectedId, setSelectedId] = useState('')
  const [autoSave, setAutoSave] = useState(autoRef.current)
  useEffect(() => {
    document.documentElement.classList.toggle('drawio-zen', zen)
    return () => document.documentElement.classList.remove('drawio-zen')
  }, [zen])
  function post(message) {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify(message), '*')
  }
  function loadXml(xml) {
    suspendRef.current = true
    xmlRef.current = xml
    savedXmlRef.current = xml
    dirtyRef.current = false
    if (readyRef.current) post({ action: 'load', xml, autosave: 1 })
    window.setTimeout(() => { suspendRef.current = false }, 0)
  }
  function remember(id, title) {
    selectedIdRef.current = id
    nameRef.current = title
    setSelectedId(id)
    setName(title)
  }
  function persist(xml) {
    const title = nameRef.current.trim() || 'Untitled'
    const current = readDrawioFiles()
    const id = selectedIdRef.current
    let next
    if (id && current.some(row => row.id === id)) next = current.map(row => row.id === id ? { ...row, name: title, xml, updated: Date.now() } : row)
    else {
      const row = { id: crypto.randomUUID(), name: title, xml, updated: Date.now() }
      next = [row, ...current.filter(file => file.name !== title)]
      selectedIdRef.current = row.id
      setSelectedId(row.id)
    }
    writeDrawioFiles(next)
    setFiles(next)
    savedXmlRef.current = xml
    dirtyRef.current = false
  }
  function discardChanges() {
    if (autoRef.current || !dirtyRef.current) return true
    return window.confirm('This diagram has unsaved changes. Discard them?')
  }
  function requestExport(format) {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (exportRef.current?.format === format) exportRef.current = null
        reject(new Error('draw.io did not respond.'))
      }, 20000)
      exportRef.current = { format, resolve, reject, timer }
      post({ action: 'export', format, spin: '0', scale: 2 })
    })
  }
  useEffect(() => {
    function onMessage(event) {
      if (event.source !== frameRef.current?.contentWindow) return
      let msg
      try { msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data } catch { return }
      if (!msg?.event) return
      if (msg.event === 'configure') post({ action: 'configure', config: {} })
      if (msg.event === 'init') { readyRef.current = true; post({ action: 'load', xml: xmlRef.current, autosave: 1 }) }
      if (msg.event === 'autosave' && msg.xml) {
        if (suspendRef.current) return
        const xml = drawioXml(msg.xml)
        xmlRef.current = xml
        if (xml === savedXmlRef.current) return
        if (autoRef.current) {
          try { persist(xml) } catch (e) { dirtyRef.current = true; toast(e.message || 'Could not auto-save.', 'error') }
        } else dirtyRef.current = true
      }
      if (msg.event === 'export' && exportRef.current) {
        const pending = exportRef.current
        exportRef.current = null
        window.clearTimeout(pending.timer)
        const payload = msg.data || msg.xml || ''
        if (!payload) pending.reject(new Error(typeof msg.message === 'string' ? msg.message : 'draw.io export failed.'))
        else pending.resolve(payload)
      }
    }
    function onLeave(event) {
      if (autoRef.current || !dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    let reverting = false
    function onHash() {
      if (reverting) { reverting = false; return }
      if (autoRef.current || !dirtyRef.current) return
      if (/^#\/tools\/drawio(?:\?|$)/.test(location.hash)) return
      if (window.confirm('This diagram has unsaved changes. Leave without saving?')) { dirtyRef.current = false; return }
      reverting = true
      location.hash = '#/tools/drawio'
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onLeave)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onLeave)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])
  async function copyImage() {
    await withToast('Copying image…', 'Copied image', async () => {
      const data = await requestExport('png')
      const base64 = String(data).includes(',') ? String(data).split(',')[1] : String(data)
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      await copyPngBlob(new Blob([bytes], { type: 'image/png' }))
    })
  }
  async function saveFile() {
    await withToast('Saving…', 'Saved', async () => {
      const xml = drawioXml(await requestExport('xml'))
      if (!xml.includes('<')) throw new Error('draw.io returned an empty diagram.')
      xmlRef.current = xml
      persist(xml)
    })
  }
  function openFile(id) {
    if (!id || id === selectedIdRef.current) return
    if (!discardChanges()) return
    const row = readDrawioFiles().find(file => file.id === id)
    if (!row) return
    remember(row.id, row.name)
    loadXml(row.xml)
  }
  function deleteFile() {
    const next = readDrawioFiles().filter(file => file.id !== selectedIdRef.current)
    writeDrawioFiles(next)
    setFiles(next)
    const row = next[0]
    remember(row?.id || '', row?.name || 'Untitled')
    loadXml(row?.xml || blankDrawioXml)
  }
  function rename(value) {
    nameRef.current = value
    setName(value)
    const id = selectedIdRef.current
    if (!id) return
    if (autoRef.current) {
      const next = readDrawioFiles().map(file => file.id === id ? { ...file, name: value.trim() || 'Untitled' } : file)
      writeDrawioFiles(next)
      setFiles(next)
    } else dirtyRef.current = true
  }
  function toggleAutoSave(on) {
    autoRef.current = on
    setAutoSave(on)
    localStorage.setItem(DRAWIO_AUTOSAVE_KEY, on ? '1' : '0')
    if (on && dirtyRef.current) persist(xmlRef.current)
  }
  return <div className="tool-content drawio-tool">
    <div className="inline-controls drawio-toolbar">
      <button type="button" className="text-action" onClick={() => setZen(value => !value)}>{zen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {zen ? 'Exit zen' : 'Zen'}</button>
      <button type="button" className="text-action" onClick={copyImage}><Copy size={14} /> Copy image</button>
      <label>Name<input value={name} onChange={e => rename(e.target.value)} aria-label="Diagram name" /></label>
      <button type="button" className="text-action" onClick={saveFile}><Save size={14} /> Save</button>
      <label className="check-pill"><input type="checkbox" checked={autoSave} onChange={e => toggleAutoSave(e.target.checked)} />Auto-save</label>
      <label>Saved<select value={selectedId} onChange={e => openFile(e.target.value)} aria-label="Saved diagrams"><option value="">{files.length ? 'Open a diagram…' : 'No saved diagrams'}</option>{files.map(file => <option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
      <button type="button" className="text-action" onClick={deleteFile} disabled={!selectedId}><Trash2 size={14} /> Delete</button>
    </div>
    <iframe ref={frameRef} className="drawio-frame" title="draw.io diagram editor" src={drawioSrc} allow="clipboard-read; clipboard-write" />
  </div>
}

const hoppscotchSrc = `${import.meta.env.BASE_URL}hoppscotch/index.html`
const hoppscotchExtensionLinks = {
  chrome: 'https://chromewebstore.google.com/detail/hoppscotch-browser-extension/amknoiejhlmhancpaelifemojeccbihk',
  firefox: 'https://addons.mozilla.org/en-US/firefox/addon/hoppscotch/',
}

function HoppscotchTool() {
  const [zen, setZen] = useState(false)
  const origin = typeof location !== 'undefined' ? location.origin : ''
  useEffect(() => {
    document.documentElement.classList.toggle('hoppscotch-zen', zen)
    return () => document.documentElement.classList.remove('hoppscotch-zen')
  }, [zen])
  return <div className="tool-content hoppscotch-tool">
    <div className="inline-controls hoppscotch-toolbar">
      <button type="button" className="text-action" onClick={() => setZen(value => !value)}>{zen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {zen ? 'Exit zen' : 'Zen'}</button>
      <button type="button" className="text-action" onClick={() => window.open(hoppscotchSrc, '_blank', 'noopener,noreferrer')}><ExternalLink size={14} /> Open tab</button>
      <a className="text-action" href={hoppscotchExtensionLinks.chrome} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Chrome extension</a>
      <a className="text-action" href={hoppscotchExtensionLinks.firefox} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Firefox extension</a>
    </div>
    <p className="hoppscotch-extension-note">Install the Hoppscotch browser extension, add <code>{origin || 'this site’s origin'}</code> to its active origins, refresh, then set the interceptor to Browser extension. That lets requests bypass CORS, including localhost. <a href="https://docs.hoppscotch.io/documentation/features/interceptor" target="_blank" rel="noopener noreferrer">Interceptor docs</a></p>
    <iframe className="hoppscotch-frame" title="Hoppscotch API client" src={hoppscotchSrc} allow="clipboard-read; clipboard-write" />
  </div>
}

const jsonPathCheatSheet = [
  ['$', 'Root object element'],
  ['@', 'Current object element'],
  ['object.property', 'Child operator'],
  ["['object']['property']", 'Bracket child operator'],
  ['..property', 'Recursive descent'],
  ['*', 'Wildcard'],
  ['[n]', 'Subscript operator'],
  ['[n1,n2]', 'Union operator'],
  ['[start:end:step]', 'Array slice operator'],
  ['?(expression)', 'Filter expression'],
  ['(expression)', 'Script expression'],
]

function CipherTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.cipher)
  const key = textValue(data, 'key', initialSamples['cipher-key'])
  const output = textValue(data, 'output', '')
  const [error, setError] = useState('')
  function run(mode) {
    setError('')
    try {
      const next = mode === 'encrypt' ? encryptShareText(input, key) : decryptShareText(input, key)
      setData({ output: next, lastMode: mode })
    } catch (e) {
      setError(e.message)
      set(setData, 'output', '')
    }
  }
  return <div className="tool-content">
    <div className="inline-controls">
      <Sample onClick={() => setData({ input: initialSamples.cipher, key: initialSamples['cipher-key'], output: '', lastMode: '' })} />
      <span className="muted-tip">AES passphrase mode (CryptoJS-compatible).</span>
    </div>
    <Split axis="y" storageKey="cipher-height" className="compare-stack">
      <Split><Editor label="Plain or ciphertext" value={input} onChange={v => set(setData, 'input', v)} /><Editor label="Key" value={key} onChange={v => set(setData, 'key', v)} rows={4} multiline={false} /></Split>
      <div className="inline-controls">
        <button type="button" className="text-action" onClick={() => run('encrypt')}><LockKeyhole size={14} /> Encrypt</button>
        <button type="button" className="text-action" onClick={() => run('decrypt')}><Fingerprint size={14} /> Decrypt</button>
        {output && <CopyAction value={output} />}
      </div>
      <Output label="Result" value={output} placeholder="Encrypt or decrypt to see output here." />
    </Split>
    {error && <p className="error-note">{error}</p>}
  </div>
}

function ImageWatermarkTool({ data, setData }) {
  const text = textValue(data, 'text', 'SAMPLE')
  const opacity = Number(textValue(data, 'opacity', 50)) || 50
  const fontSize = Number(textValue(data, 'fontSize', 48)) || 48
  const spacing = Number(textValue(data, 'spacing', 160)) || 160
  const color = textValue(data, 'color', 'black')
  const format = textValue(data, 'format', 'png')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }
    let alive = true
    setError('')
    renderWatermarkedCanvas(file, { text, opacity, fontSize, spacing, color }).then(canvas => {
      if (!alive) return
      canvas.toBlob(blob => {
        if (!alive || !blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(current => {
          if (current) URL.revokeObjectURL(current)
          return url
        })
      }, 'image/png')
    }).catch(e => { if (alive) setError(e.message) })
    return () => { alive = false }
  }, [file, text, opacity, fontSize, spacing, color])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  return <div className="tool-content">
    <div className="inline-controls">
      <label className="file-button"><FileUp size={14} /> Choose image<input type="file" accept="image/*" onChange={e => { const next = e.target.files?.[0]; setFile(next || null); e.target.value = '' }} /></label>
      <PasteImageButton onPaste={setFile} />
      <label>Export<select value={format} onChange={e => set(setData, 'format', e.target.value)}>{imageOutputFormats.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
      <button type="button" className="text-action" disabled={!file} onClick={async () => {
        try {
          const blob = await watermarkedImageBlob(file, format, 0.92, { text, opacity, fontSize, spacing, color })
          const base = file.name.replace(/\.[^.]+$/, '') || 'image'
          downloadBlob(blob, `${base}-watermark.${format}`)
        } catch (e) { setError(e.message) }
      }}><Download size={14} /> Save</button>
    </div>
    <div className="watermark-controls">
      <label>Watermark text<input value={text} onChange={e => set(setData, 'text', e.target.value)} spellCheck="false" placeholder="Watermark" /></label>
      <label>Color<select value={color} onChange={e => set(setData, 'color', e.target.value)}><option value="black">Black</option><option value="white">White</option></select></label>
      <div className="watermark-sliders">
        <label><span>Opacity · {opacity}%</span><input type="range" min="0" max="100" value={opacity} onChange={e => set(setData, 'opacity', e.target.value)} /></label>
        <label><span>Size · {fontSize}px</span><input type="range" min="12" max="120" value={fontSize} onChange={e => set(setData, 'fontSize', e.target.value)} /></label>
        <label><span>Spacing · {spacing}px</span><input type="range" min="40" max="400" value={spacing} onChange={e => set(setData, 'spacing', e.target.value)} /></label>
      </div>
    </div>
    <p className="subtle">Runs locally. Tiled diagonal text updates live on the preview.</p>
    <section className="editor-card media-preview-card">
      <div className="panel-top"><span>Preview</span>{previewUrl && <button type="button" className="text-action" onClick={() => setPreviewOpen(true)}>Open preview</button>}</div>
      {previewUrl
        ? <button type="button" className="media-preview-button" onClick={() => setPreviewOpen(true)}><img className="media-preview watermark-preview" src={previewUrl} alt="Watermarked preview" /></button>
        : <div className="image-converter-placeholder media-preview-empty">Choose an image to preview the watermark.</div>}
    </section>
    {previewOpen && previewUrl && <ImagePreviewModal src={previewUrl} alt="Watermarked preview" onClose={() => setPreviewOpen(false)} />}
    {error && <p className="error-note">{error}</p>}
  </div>
}

function formatMark(mark) {
  if (mark.type === 'point') return `point: { x: ${mark.x}, y: ${mark.y} }`
  return `rect: { x: ${mark.x}, y: ${mark.y}, width: ${mark.w}, height: ${mark.h} }`
}

function ImageCoordinateTool({ data, setData }) {
  const mode = textValue(data, 'mode', 'point')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [marks, setMarks] = useState([])
  const [history, setHistory] = useState([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [draft, setDraft] = useState(null)
  const [selected, setSelected] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const stageRef = useRef(null)
  const imgRef = useRef(null)

  function commitMarks(next) {
    const base = history.slice(0, historyIndex + 1)
    const updated = [...base, next]
    setHistory(updated)
    setHistoryIndex(updated.length - 1)
    setMarks(next)
  }

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      setSize({ w: 0, h: 0 })
      setMarks([])
      setHistory([[]])
      setHistoryIndex(0)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          if (historyIndex < history.length - 1) {
            const next = historyIndex + 1
            setHistoryIndex(next)
            setMarks(history[next])
          }
        } else if (historyIndex > 0) {
          const next = historyIndex - 1
          setHistoryIndex(next)
          setMarks(history[next])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history, historyIndex])

  function pointerToImage(clientX, clientY) {
    const img = imgRef.current
    if (!img || !size.w) return null
    const rect = img.getBoundingClientRect()
    const x = Math.round((clientX - rect.left) * (size.w / rect.width))
    const y = Math.round((clientY - rect.top) * (size.h / rect.height))
    if (x < 0 || y < 0 || x > size.w || y > size.h) return null
    return { x, y }
  }

  function onPointerDown(e) {
    if (!previewUrl) return
    const pt = pointerToImage(e.clientX, e.clientY)
    if (!pt) return
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i]
      if (m.type === 'rect' && pt.x >= m.x && pt.x <= m.x + m.w && pt.y >= m.y && pt.y <= m.y + m.h) {
        setSelected(i)
        return
      }
    }
    const hit = marks.findIndex(m => m.type === 'point' && Math.hypot(m.x - pt.x, m.y - pt.y) < 12)
    if (hit >= 0) { setSelected(hit); return }
    if (mode === 'point') {
      const next = [...marks, { id: crypto.randomUUID(), type: 'point', ...pt }]
      commitMarks(next)
      setSelected(next.length - 1)
      return
    }
    setDraft({ x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y })
  }

  function onPointerMove(e) {
    if (!draft) return
    const pt = pointerToImage(e.clientX, e.clientY)
    if (!pt) return
    setDraft(current => ({ ...current, x1: pt.x, y1: pt.y }))
  }

  function onPointerUp() {
    if (!draft) return
    const x = Math.min(draft.x0, draft.x1)
    const y = Math.min(draft.y0, draft.y1)
    const w = Math.abs(draft.x1 - draft.x0)
    const h = Math.abs(draft.y1 - draft.y0)
    setDraft(null)
    if (w < 2 && h < 2) return
    const next = [...marks, { id: crypto.randomUUID(), type: 'rect', x, y, w, h }]
    commitMarks(next)
    setSelected(next.length - 1)
  }

  const output = marks.map(formatMark).join('\n')
  const displayMarks = draft
    ? [...marks, {
      id: 'draft',
      type: 'rect',
      x: Math.min(draft.x0, draft.x1),
      y: Math.min(draft.y0, draft.y1),
      w: Math.abs(draft.x1 - draft.x0),
      h: Math.abs(draft.y1 - draft.y0),
    }]
    : marks

  return <div className="tool-content">
    <div className="inline-controls">
      <label className="file-button"><FileUp size={14} /> Choose image<input type="file" accept="image/*" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = '' }} /></label>
      <PasteImageButton onPaste={setFile} />
      <label>Mode<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="point">Point</option><option value="rect">Rectangle</option></select></label>
      <button type="button" className="text-action" disabled={historyIndex <= 0} onClick={() => {
        const next = historyIndex - 1
        setHistoryIndex(next)
        setMarks(history[next])
      }}>Undo</button>
      <button type="button" className="text-action" disabled={historyIndex >= history.length - 1} onClick={() => {
        const next = historyIndex + 1
        setHistoryIndex(next)
        setMarks(history[next])
      }}>Redo</button>
      <button type="button" className="text-action" disabled={!marks.length} onClick={() => { commitMarks([]); setSelected(null) }}><Trash2 size={14} /> Clear</button>
    </div>
    <p className="subtle">{size.w ? `Coordinates are in image pixels (${size.w}×${size.h}). Click a mark to select it.` : 'Choose an image, then click to mark pixels.'}</p>
    <section className="editor-card coordinate-stage-card" ref={stageRef}>
      <div className="panel-top"><span>Image</span>{previewUrl && <button type="button" className="text-action" onClick={() => setPreviewOpen(true)}>Open preview</button>}</div>
      {previewUrl ? <div className="coordinate-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div className="coordinate-image-wrap">
        <img ref={imgRef} src={previewUrl} alt="" draggable="false" onLoad={e => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
        <svg className="coordinate-overlay" viewBox={`0 0 ${size.w || 1} ${size.h || 1}`} preserveAspectRatio="xMidYMid meet">
          {displayMarks.map((mark, index) => mark.type === 'point'
            ? <g key={mark.id}><circle cx={mark.x} cy={mark.y} r="6" className={selected === index ? 'coord-hot' : 'coord-point'} /><text x={mark.x + 8} y={mark.y - 8} className="coord-label">{mark.x},{mark.y}</text></g>
            : <g key={mark.id}><rect x={mark.x} y={mark.y} width={mark.w} height={mark.h} className={selected === index || mark.id === 'draft' ? 'coord-hot' : 'coord-rect'} /><text x={mark.x + 4} y={mark.y + 14} className="coord-label">{mark.w}×{mark.h}</text></g>)}
        </svg>
        </div>
      </div> : <div className="image-converter-placeholder media-preview-empty">Choose an image to start marking.</div>}
    </section>
    {previewOpen && previewUrl && <ImagePreviewModal src={previewUrl} alt="Coordinate source" onClose={() => setPreviewOpen(false)} />}
    <Output wrap={false} label="Coordinates" value={output} placeholder="Marks appear here as you click or drag." actions={<>
      <CopyAction value={selected != null && marks[selected] ? formatMark(marks[selected]) : ''} label="Copy selected" />
      <CopyAction value={output} label="Copy all" />
    </>} />
  </div>
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(unit === 0 ? 0 : 1) : value.toFixed(1)} ${units[unit]}`
}

function segmentName(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || url)
  } catch {
    return url
  }
}

function M3u8Tool({ data, setData }) {
  const source = textValue(data, 'source', 'link')
  const playlist = textValue(data, 'playlist', '')
  const url = textValue(data, 'url', initialSamples.m3u8)
  const concurrency = Math.min(100, Math.max(1, Number(textValue(data, 'concurrency', 8)) || 8))
  const maxRetries = Math.min(100, Math.max(0, Number(textValue(data, 'maxRetries', 3)) || 3))
  const startIndex = Math.max(0, Number(textValue(data, 'startIndex', 0)) || 0)
  const saveMode = textValue(data, 'saveMode', canStreamToFile() ? 'stream' : 'memory')
  const fileName = textValue(data, 'fileName', 'video.ts')
  const [progress, setProgress] = useState({ phase: 'idle', done: 0, failed: 0, active: 0, total: 0, bytes: 0, percent: 0, activeSegments: [], failures: [], paused: false })
  const [error, setError] = useState('')
  const sessionRef = useRef(null)
  const loadAbort = useRef(null)

  useEffect(() => {
    const linked = m3u8UrlFromLocation(window.location.href)
    if (!linked) return
    setData({ source: 'link', url: linked })
    const hash = window.location.hash.replace(/\?.*$/, '')
    if (hash !== window.location.hash) history.replaceState(null, '', `${window.location.pathname}${hash}`)
  }, [])
  useEffect(() => () => { loadAbort.current?.abort(); sessionRef.current?.stop() }, [])

  async function resolvePlaylist() {
    if (source === 'file') {
      if (!playlist.trim()) throw new Error('Paste or load an M3U8 playlist.')
      return { text: playlist, finalUrl: '' }
    }
    if (!url.trim()) throw new Error('Enter an M3U8 URL.')
    return loadPlaylistFromUrl(url.trim(), loadAbort.current?.signal)
  }

  function halt() {
    loadAbort.current?.abort()
    sessionRef.current?.stop()
  }

  async function startDownload() {
    halt()
    const controller = new AbortController()
    loadAbort.current = controller
    setError('')
    setProgress(current => ({ ...current, phase: 'loading', percent: 0, done: 0, failed: 0, active: 0, failures: [], activeSegments: [] }))
    try {
      let loaded = await resolvePlaylist()
      if (controller.signal.aborted) return
      let playlistUrl = loaded.finalUrl || url
      let info = parseM3u8(loaded.text, playlistUrl || 'http://local.invalid/')
      if (info.isMaster) {
        const best = bestMasterVariant(listMasterVariants(loaded.text, playlistUrl))
        if (!best?.url) throw new Error('Master playlist has no variant streams.')
        const label = best.resolution || `${best.bandwidth || 'highest'} bps`
        setProgress(current => ({ ...current, phase: 'loading', message: `Opening ${label} variant…` }))
        loaded = await loadPlaylistFromUrl(best.url, controller.signal)
        playlistUrl = loaded.finalUrl || best.url
        info = parseM3u8(loaded.text, playlistUrl)
        if (info.isMaster) throw new Error('Could not find media segments in the selected variant.')
      }
      const slice = info.segments.slice(startIndex)
      if (!slice.length) throw new Error('No media segments found in the playlist.')
      const session = createM3u8Download({
        segments: slice,
        startIndex,
        concurrency,
        maxRetries,
        saveMode,
        fileName,
        signal: controller.signal,
        onUpdate: setProgress,
      })
      sessionRef.current = session
      const result = await session.run()
      if (saveMode === 'memory' && result.blob) downloadBlob(result.blob, fileName)
      setProgress(current => ({ ...current, phase: 'done', percent: 100, bytes: result.bytes, message: saveMode === 'memory' ? `Saved ${result.bytes} bytes.` : `Wrote ${result.segments} segments to disk.` }))
    } catch (e) {
      if (e?.name === 'AbortError') {
        setProgress(current => ({ ...current, phase: 'stopped', active: 0, activeSegments: [] }))
        return
      }
      setError(e.message || String(e))
      setProgress(current => ({ ...current, phase: 'error' }))
    }
  }

  const busy = ['loading', 'downloading', 'paused', 'incomplete'].includes(progress.phase)
  return <div className="tool-content">
    <div className="inline-controls">
      <label>Source<select value={source} onChange={e => set(setData, 'source', e.target.value)}><option value="link">URL</option><option value="file">Text</option></select></label>
      <label>Save mode<select value={saveMode} onChange={e => set(setData, 'saveMode', e.target.value)}><option value="stream">Stream to file</option><option value="memory">In memory</option></select></label>
      <label>Parallel<input type="number" min="1" max="100" value={concurrency} onChange={e => set(setData, 'concurrency', e.target.value)} /></label>
      <label>Retries<input type="number" min="0" max="100" value={maxRetries} onChange={e => set(setData, 'maxRetries', e.target.value)} /></label>
      <label>Start at<input type="number" min="0" value={startIndex} onChange={e => set(setData, 'startIndex', e.target.value)} /></label>
      <label>File name<input value={fileName} onChange={e => set(setData, 'fileName', e.target.value)} spellCheck="false" /></label>
    </div>
    {saveMode === 'memory' && <p className="subtle">In-memory mode holds the full video in RAM before download. Use stream mode for large files (Chrome/Edge).</p>}
    {saveMode === 'stream' && !canStreamToFile() && <p className="error-note">Streaming save is not available in this browser. Use in-memory mode or Chrome/Edge.</p>}
    {source === 'link'
      ? <Editor wrap={false} label="M3U8 URL" value={url} onChange={v => set(setData, 'url', v)} rows={3} multiline={false} />
      : <><Editor wrap={false} label="M3U8 playlist" value={playlist} onChange={v => set(setData, 'playlist', v)} rows={8} /><Editor wrap={false} label="Base URL (for relative segment paths)" value={url} onChange={v => set(setData, 'url', v)} rows={2} multiline={false} /></>}
    <div className="inline-controls">
      <button type="button" className="text-action" onClick={startDownload} disabled={busy}><Download size={14} /> Download</button>
      {progress.phase === 'paused'
        ? <button type="button" className="text-action" onClick={() => sessionRef.current?.resume()}><Play size={14} /> Continue</button>
        : <button type="button" className="text-action" onClick={() => sessionRef.current?.pause()} disabled={progress.phase !== 'downloading'}><Pause size={14} /> Pause</button>}
      <button type="button" className="text-action" onClick={() => sessionRef.current?.retryFailed()} disabled={!progress.failures?.length}><RefreshCw size={14} /> Retry failed</button>
      <button type="button" className="text-action" onClick={halt} disabled={!busy && progress.phase !== 'incomplete'}>Stop</button>
      <Sample onClick={() => setData({ source: 'link', url: initialSamples.m3u8, playlist: '', fileName: 'video.ts' })} />
    </div>
    {progress.phase !== 'idle' && <section className="m3u8-progress" aria-live="polite">
      <div className="m3u8-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent || 0}><span style={{ width: `${progress.percent || 0}%` }} /></div>
      <div className="m3u8-stats">
        <span>{progress.done || 0} / {progress.total || 0} done</span>
        <span>{progress.percent || 0}%</span>
        <span>{formatBytes(progress.bytes || 0)}</span>
        <span>{progress.active || 0} downloading</span>
        <span>{progress.failed || 0} failed</span>
        {progress.phase === 'paused' && <span>Paused</span>}
        {progress.phase === 'loading' && <span>{progress.message || 'Loading playlist…'}</span>}
        {progress.phase === 'done' && <span>{progress.message || 'Finished'}</span>}
        {progress.phase === 'stopped' && <span>Stopped</span>}
      </div>
      {!!progress.activeSegments?.length && <ul className="m3u8-segment-list">{progress.activeSegments.slice(0, 8).map(item => <li className="m3u8-segment active" key={`active-${item.index}`}>Segment {item.index} · try {item.attempt}/{item.tries} · {segmentName(item.url)}</li>)}</ul>}
      {!!progress.failures?.length && <ul className="m3u8-segment-list">{progress.failures.slice(0, 12).map(item => <li className="m3u8-segment error" key={`fail-${item.index}`}>Segment {item.index} failed · {item.error}</li>)}{progress.failures.length > 12 && <li className="m3u8-segment error">{progress.failures.length - 12} more failed segments</li>}</ul>}
    </section>}
    {error && <p className="error-note">{error}</p>}
    <p className="subtle">AES-128 encrypted HLS is decrypted in the browser. Segments must be reachable from your network (CORS may block some hosts).</p>
  </div>
}

function ImageConverterTool({ data, setData }) {
  const format = textValue(data, 'format', 'png')
  const [items, setItems] = useState([])
  useEffect(() => () => items.forEach(item => {
    if (item.preview) URL.revokeObjectURL(item.preview)
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
  }), [items])
  function removeAll() {
    items.forEach(item => {
      if (item.preview) URL.revokeObjectURL(item.preview)
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
    })
    setItems([])
  }
  function addFiles(fileList) {
    const next = [...fileList].map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
      outputUrl: '',
      status: 'ready',
      error: '',
    }))
    setItems(current => [...next, ...current])
  }
  async function convertItem(id) {
    const item = items.find(entry => entry.id === id)
    if (!item) return
    setItems(current => current.map(entry => entry.id === id ? { ...entry, status: 'working', error: '' } : entry))
    try {
      const blob = await convertImageFile(item.file, format)
      const outputUrl = URL.createObjectURL(blob)
      setItems(current => current.map(entry => {
        if (entry.id !== id) return entry
        if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl)
        return { ...entry, status: 'done', outputUrl, error: '' }
      }))
    } catch (e) {
      setItems(current => current.map(entry => entry.id === id ? { ...entry, status: 'error', error: e.message } : entry))
    }
  }
  async function convertAll() {
    for (const item of items) await convertItem(item.id)
  }
  async function blobForItem(item) {
    if (item.outputUrl) return fetch(item.outputUrl).then(response => response.blob())
    const blob = await convertImageFile(item.file, format)
    const outputUrl = URL.createObjectURL(blob)
    setItems(current => current.map(entry => {
      if (entry.id !== item.id) return entry
      if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl)
      return { ...entry, status: 'done', outputUrl, error: '' }
    }))
    return blob
  }
  async function saveAll() {
    for (const item of items) {
      const blob = await blobForItem(item)
      const base = item.name.replace(/\.[^.]+$/, '') || item.name
      downloadBlob(blob, `${base}.${format}`)
    }
  }
  return <div className="tool-content">
    <div className="inline-controls">
      <label>Convert to<select value={format} onChange={e => set(setData, 'format', e.target.value)}>{imageOutputFormats.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
      <label className="file-button"><FileUp size={14} /> Choose images<input type="file" accept="image/*" multiple onChange={e => { addFiles(e.target.files || []); e.target.value = '' }} /></label>
      <button type="button" className="text-action" onClick={convertAll} disabled={!items.length}><RefreshCw size={14} /> Convert all</button>
      <button type="button" className="text-action" onClick={saveAll} disabled={!items.length}><Download size={14} /> Save all</button>
      <button type="button" className="text-action" onClick={removeAll} disabled={!items.length}><Trash2 size={14} /> Delete all</button>
    </div>
    <p className="subtle">Runs locally in the browser. PNG, JPEG, and WebP export use the canvas API.</p>
    <div className="image-converter-list">
      {items.length ? items.map(item => <section className="editor-card image-converter-item" key={item.id}>
        <div className="panel-top"><span>{item.name}</span><span>{item.status === 'working' ? 'Converting…' : item.status === 'done' ? 'Ready' : item.status === 'error' ? 'Failed' : 'Queued'}</span></div>
        <div className="image-converter-grid">
          <img src={item.preview} alt="" />
          {item.outputUrl ? <img src={item.outputUrl} alt="" /> : <div className="image-converter-placeholder">{item.error || 'Converted preview'}</div>}
        </div>
        <div className="inline-controls">
          <button type="button" className="text-action" onClick={() => convertItem(item.id)}><RefreshCw size={14} /> Convert</button>
          <button type="button" className="text-action" onClick={async () => {
            const blob = await blobForItem(item)
            const base = item.name.replace(/\.[^.]+$/, '') || item.name
            downloadBlob(blob, `${base}.${format}`)
          }} disabled={item.status === 'working'}><Download size={14} /> Save</button>
        </div>
        {item.error && <p className="error-note">{item.error}</p>}
      </section>) : <p className="subtle">Choose one or more images to convert.</p>}
    </div>
  </div>
}

function JsonPathTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.jsonpath)
  const query = textValue(data, 'query', initialSamples['jsonpath-query'])
  const result = useMemo(() => queryJsonPath(input, query), [input, query])
  return <div className="tool-content jsonpath-tool">
    <div className="inline-controls"><Sample onClick={() => setData({ input: initialSamples.jsonpath, query: initialSamples['jsonpath-query'] })} /></div>
    <Split axis="y" storageKey="jsonpath-height" className="compare-stack">
      <Split><Editor label="JSON input" value={input} onChange={v => set(setData, 'input', v)} language="json" /><div className="jsonpath-side"><label className="regex-controls">JSONPath<input value={query} onChange={e => set(setData, 'query', e.target.value)} spellCheck="false" placeholder="$.store.book[0].title" /></label><Output label="JSONPath result" value={result.output} error={!!result.error} language="json" placeholder={result.error || 'Enter JSON and a JSONPath query.'} /></div></Split>
      <section className="editor-card cheat-sheet-card"><div className="panel-top"><span>JSONPath cheat sheet</span></div><div className="cheat-sheet-scroll"><table className="json-table cheat-sheet-table"><thead><tr><th>Syntax</th><th>Description</th></tr></thead><tbody>{jsonPathCheatSheet.map(([syntax, description]) => <tr key={syntax}><td><code>{syntax}</code></td><td>{description}</td></tr>)}</tbody></table></div></section>
    </Split>
  </div>
}

function XmlTesterTool({ data, setData }) {
  const xsd = textValue(data, 'xsd', initialSamples['xml-tester-xsd'])
  const xml = textValue(data, 'xml', initialSamples['xml-tester-xml'])
  const [status, setStatus] = useState({ severity: 'info', message: 'Enter an XSD schema and XML document to validate.' })
  useEffect(() => {
    let alive = true
    validateXmlAgainstXsd(xsd, xml).then(next => { if (alive) setStatus(next) })
    return () => { alive = false }
  }, [xsd, xml])
  const noteClass = status.severity === 'success' ? 'integrity-note match' : status.severity === 'error' ? 'integrity-note mismatch' : 'subtle'
  return <div className="tool-content">
    <div className="inline-controls"><Sample onClick={() => setData({ xsd: initialSamples['xml-tester-xsd'], xml: initialSamples['xml-tester-xml'] })} /><span className="muted-tip">Validates locally with libxml2 (WebAssembly).</span></div>
    <Split><Editor label="XSD schema" value={xsd} onChange={v => set(setData, 'xsd', v)} language="xml" rows={14} /><Editor label="XML data" value={xml} onChange={v => set(setData, 'xml', v)} language="xml" rows={14} /></Split>
    <p className={noteClass}>{status.message}</p>
  </div>
}

const regexTemplateHint = {
  javascript: ['$1, $<name>, or $&', '$1 or $<name>. Empty lists each full match'],
  python: ['\\1 or \\g<name>', '\\1 or \\g<name>. Empty lists each full match'],
  go: ['$0, $1, or ${name}', '$1 or ${name}. Empty lists each full match'],
  java: ['$1 or ${name}. A dollar is \\$', '$1 or ${name}. Empty lists each full match'],
  dotnet: ['$1, ${name}, or $&', '$1 or ${name}. Empty lists each full match'],
  rust: ['$0, $1, or ${name}', '$1 or ${name}. Empty lists each full match'],
}

function RegexTool({ data, setData }) {
  const text = textValue(data, 'input', initialSamples.regex)
  const pattern = textValue(data, 'pattern', '[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}')
  const flavorId = textValue(data, 'flavor', 'javascript')
  const flavor = regexFlavors.some(([id]) => id === flavorId) ? flavorId : 'javascript'
  const flavorName = regexFlavors.find(([id]) => id === flavor)[1]
  const modeId = textValue(data, 'mode', 'match')
  const mode = modeId === 'substitution' || modeId === 'extraction' ? modeId : 'match'
  const template = textValue(data, 'template', '')
  const options = {
    allMatches: textValue(data, 'allMatches', true),
    ignoreCase: textValue(data, 'ignoreCase', false),
    ignoreWhitespace: textValue(data, 'ignoreWhitespace', false),
    multiline: textValue(data, 'multiline', false),
    singleline: textValue(data, 'singleline', textValue(data, 'dotAll', false)),
    rightToLeft: textValue(data, 'rightToLeft', false),
    unicode: textValue(data, 'unicode', false),
  }
  const [state, setState] = useState({ matches: [], output: '', error: '', timeout: false })
  function toggleOption(key) {
    const value = options[key] === true || options[key] === 'true'
    set(setData, key, key === 'allMatches' ? value ? false : true : !value)
  }
  useEffect(() => {
    setState({ matches: [], output: '', error: '', timeout: false })
    if (!pattern) return
    let worker
    let timer
    try {
      worker = new Worker(new URL('./regexWorker.js', import.meta.url), { type: 'module' })
      worker.onmessage = e => {
        clearTimeout(timer)
        setState({ matches: e.data.matches || [], output: e.data.output || '', error: e.data.error || '', timeout: false })
        worker.terminate()
      }
      timer = window.setTimeout(() => {
        worker.terminate()
        setState({ matches: [], output: '', error: '', timeout: true })
      }, 2000)
      worker.postMessage({ pattern, text, flavor, mode, template, ...options })
    } catch (e) {
      setState({ matches: [], output: '', error: e.message, timeout: false })
    }
    return () => { clearTimeout(timer); worker?.terminate() }
  }, [pattern, text, flavor, mode, template, options.allMatches, options.ignoreCase, options.ignoreWhitespace, options.multiline, options.singleline, options.rightToLeft, options.unicode])
  const highlighted = useMemo(() => {
    if (state.error) return text
    let cursor = 0
    const chunks = []
    const ordered = [...state.matches].sort((a, b) => a.index - b.index)
    ordered.forEach((m, i) => {
      if (m.index > cursor) chunks.push(text.slice(cursor, m.index))
      chunks.push(<mark key={`${m.index}:${i}`}>{m.text || '∅'}</mark>)
      cursor = m.index + Math.max(m.text.length, 1)
    })
    if (cursor < text.length) chunks.push(text.slice(cursor))
    return chunks
  }, [state.matches, state.error, text])
  const hint = regexTemplateHint[flavor]
  const outputLabel = mode === 'substitution' ? 'Substitution' : 'Extraction'
  return <div className="tool-content">
    <div className="inline-controls">
      <label>Flavor<select value={flavor} onChange={e => set(setData, 'flavor', e.target.value)}>{regexFlavors.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Mode<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="match">Match</option><option value="substitution">Substitution</option><option value="extraction">Extraction</option></select></label>
      <Sample onClick={() => setData({ input: initialSamples.regex, pattern: '[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}' })} />
      <span className="muted-tip">{flavorName} · 2 second limit · 500 matches max</span>
    </div>
    <div className="regex-controls"><label>Pattern<input value={pattern} onChange={e => set(setData, 'pattern', e.target.value)} spellCheck="false" placeholder="Regular expression" /></label></div>
    <div className="check-grid">{regexControls(flavor).map(([key, label, title]) => <label className="check-pill" key={key} title={title}><input type="checkbox" checked={key === 'allMatches' ? options[key] !== false && options[key] !== 'false' : options[key] === true || options[key] === 'true'} onChange={() => toggleOption(key)} />{label}</label>)}</div>
    {mode !== 'match' && <div className="regex-controls"><label>{mode === 'substitution' ? 'Replace with' : 'Extract'}<input value={template} onChange={e => set(setData, 'template', e.target.value)} spellCheck="false" placeholder={mode === 'substitution' ? hint[0] : hint[1]} /></label></div>}
    <Editor label="Test text" value={text} onChange={v => set(setData, 'input', v)} />
    {state.error && <p className="error-note regex-error">{state.error}</p>}
    {state.timeout && <p className="error-note">This pattern took too long. It was stopped; try simplifying it.</p>}
    {!state.error && !state.timeout && <>
      <div className="match-summary"><strong>{state.matches.length}{state.matches.length === 500 ? '+' : ''}</strong> matches{state.matches.length > 0 && <span> · capture groups shown below</span>}</div>
      <pre className="regex-preview">{highlighted}</pre>
      {state.matches.slice(0, 25).map((m, i) => <div className="match-row" key={m.index + ':' + i}><span>{i + 1}</span><code>{m.text || '(empty match)'}</code><small>index {m.index}{m.groups.map((g, j) => ` · $${j + 1}: ${g ?? '∅'}`)}{Object.entries(m.named).map(([name, value]) => ` · ${name}: ${value ?? '∅'}`)}</small></div>)}
      {mode !== 'match' && <Output label={outputLabel} value={state.output} placeholder={mode === 'substitution' ? 'The test text with matches replaced.' : 'One line per match.'} />}
    </>}
    <section className="editor-card regex-help">
      <div className="panel-top"><span>{flavorName} syntax</span></div>
      <p className="subtle regex-help-note">Substitution rewrites each match in the test text. Extraction lists the template once per match. An empty extraction template lists the full matches. Syntax and replacements follow the selected flavor. The match itself runs in the browser, and anything that flavor cannot express is reported here.</p>
      <div className="cheat-sheet-scroll"><table className="json-table cheat-sheet-table"><thead><tr><th>Syntax</th><th>Meaning</th></tr></thead><tbody>{regexHelp(flavor).map(([syntax, meaning]) => <tr key={syntax}><td><code>{syntax}</code></td><td>{meaning}</td></tr>)}</tbody></table></div>
    </section>
  </div>
}

function DiffSpans({ parts }) {
  if (!parts) return null
  return parts.map((part, i) => part.kind === 'add' ? <ins key={i}>{part.text}</ins> : part.kind === 'remove' ? <del key={i}>{part.text}</del> : <span key={i}>{part.text}</span>)
}

function CompareTool({ data, setData }) {
  const left = textValue(data, 'left', initialSamples.compareLeft), right = textValue(data, 'right', initialSamples.compareRight)
  const mode = textValue(data, 'mode', 'words'), layout = textValue(data, 'layout', 'side')
  const [pane, setPane] = useState(() => readSplit(SPLIT_KEY))
  const parts = useMemo(() => mode === 'lines' ? diffLines(left, right) : diffWordsWithSpace(left, right), [left,right,mode]), added = parts.filter(x => x.added).reduce((n,x) => n+(x.count || 0),0), removed = parts.filter(x => x.removed).reduce((n,x) => n+(x.count || 0),0)
  const markup = parts.map((part,i) => part.added ? <ins key={i}>{part.value}</ins> : part.removed ? <del key={i}>{part.value}</del> : <span key={i}>{part.value}</span>)
  const rows = useMemo(() => layout === 'side' ? sideBySideRows(left, right, mode) : null, [layout, left, right, mode])
  const linked = layout === 'side' ? { ratio: pane, onRatio: setPane } : {}
  const editors = <Split axis={layout === 'inline' ? 'y' : 'x'} storageKey={layout === 'inline' ? 'compare-inline' : SPLIT_KEY} className="compare-editors" {...linked}><Editor label="Original text" value={left} onChange={v => set(setData, 'left', v)} /><Editor label="Changed text" value={right} onChange={v => set(setData, 'right', v)} /></Split>
  return <div className="tool-content"><div className="inline-controls"><label>Compare by<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="words">Words</option><option value="lines">Lines</option></select></label><label>View<select value={layout} onChange={e => set(setData, 'layout', e.target.value)}><option value="side">Side by side</option><option value="inline">Inline</option></select></label><Sample onClick={() => setData({ left: initialSamples.compareLeft, right: initialSamples.compareRight })} /><span className="change-count"><b className="added">+{added}</b> <b className="removed">−{removed}</b> changes</span></div>
    <Split axis="y" storageKey="compare-height" className="compare-stack">{editors}<section className="editor-card diff-card"><div className="panel-top"><span>{layout === 'side' ? 'Side by side' : 'Inline'} · {mode === 'lines' ? 'lines' : 'words'}</span><span className="diff-legend"><i className="added-bg" /> Added <i className="removed-bg" /> Removed</span></div>{rows ? <Split className="side-diff" storageKey={SPLIT_KEY} {...linked}><div className="side-col">{rows.map((row, i) => <pre key={i}><DiffSpans parts={row.left} /></pre>)}</div><div className="side-col">{rows.map((row, i) => <pre key={i}><DiffSpans parts={row.right} /></pre>)}</div></Split> : <pre>{markup}</pre>}</section></Split></div>
}

function EscapeTool({ data, setData }) {
  const input = textValue(data, 'input', initialSamples.escape), direction = textValue(data, 'direction', 'escape'), format = textValue(data, 'format', 'json')
  let output = '', error = ''
  try { output = direction === 'escape' ? escapeString(input, format) : unescapeString(input, format) }
  catch (e) { error = input ? e.message : '' }
  return <div className="tool-content"><div className="inline-controls"><label>Direction<select value={direction} onChange={e => set(setData, 'direction', e.target.value)}><option value="escape">Escape</option><option value="unescape">Unescape</option></select></label><label>Format<select value={format} onChange={e => set(setData, 'format', e.target.value)}><option value="json">JSON / JavaScript</option><option value="xml">XML</option></select></label><Sample onClick={() => setData({ direction: 'escape', format: 'json', input: initialSamples.escape })} /></div><Split><Editor label={direction === 'escape' ? 'Plain text' : 'Escaped text'} value={input} onChange={v => set(setData, 'input', v)} /><Output label="Result" value={output} error={!!error} placeholder={error || 'Enter text to convert.'} /></Split>{error && <p className="error-note">{error}</p>}</div>
}

function CalculatorTool({ data, setData }) {
  const input = textValue(data, 'input', '')
  const angleUnit = textValue(data, 'angleUnit', 'd')
  const resultFormat = textValue(data, 'resultFormat', 'g')
  const precision = Math.min(20, Math.max(0, Number(textValue(data, 'precision', '12')) || 12))
  const grouping = textValue(data, 'grouping', true) === true || textValue(data, 'grouping', true) === 'true'
  const autoCalc = textValue(data, 'autoCalc', true) !== false && textValue(data, 'autoCalc', true) !== 'false'
  const autoAns = textValue(data, 'autoAns', true) !== false && textValue(data, 'autoAns', true) !== 'false'
  const keepExpression = checked(data, 'keepExpression')
  const history = useMemo(() => {
    try { return JSON.parse(textValue(data, 'history', '[]')) } catch { return [] }
  }, [data.history])
  const variables = useMemo(() => {
    try { return JSON.parse(textValue(data, 'variables', '{}')) } catch { return {} }
  }, [data.variables])
  const historyRef = useRef(null)
  const inputRef = useRef(null)
  const [lineError, setLineError] = useState('')
  const [dock, setDock] = useState('functions')
  const [dockQuery, setDockQuery] = useState('')
  const session = useMemo(() => {
    const s = createCalculatorSession({
      angleUnit, precision, autoAns,
      variables: new Map(Object.entries(variables).map(([k, v]) => [k, Number(v)])),
    })
    const ansRaw = textValue(data, 'ans', '')
    if (ansRaw !== '') s.ans = Number(ansRaw)
    return s
  }, [angleUnit, precision, autoAns, variables, data.ans])
  const hints = useMemo(() => searchCalculatorSymbols((input.match(/[A-Za-z][A-Za-z0-9_]*$/) || [''])[0], 8), [input])
  const preview = useMemo(() => {
    if (!autoCalc || !input.trim()) return null
    const working = cloneCalculatorSession(session)
    try {
      const out = evaluateCalculatorExpression(input, working)
      if (out.skipped) return null
      return { text: formatCalculatorResult(out.result, precision, resultFormat, grouping), error: '' }
    } catch (e) {
      return { text: '', error: e.message }
    }
  }, [autoCalc, input, session, precision, resultFormat, grouping])

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight
  }, [history.length])

  function persistSession(nextSession, patch = {}) {
    setData({
      variables: JSON.stringify(Object.fromEntries(nextSession.variables)),
      ans: nextSession.ans == null ? '' : String(nextSession.ans),
      ...patch,
    })
  }

  function runLine(expr) {
    const working = cloneCalculatorSession(session)
    try {
      const out = evaluateCalculatorExpression(expr, working)
      if (out.skipped) return
      const entry = {
        expr: out.expression || expr,
        value: out.result,
        error: '',
        assigned: out.assigned || '',
        comment: out.comment || '',
      }
      persistSession(working, { history: JSON.stringify([...history, entry]), input: keepExpression ? input : '' })
      setLineError('')
    } catch (e) {
      setData({ history: JSON.stringify([...history, { expr, result: '', error: e.message, assigned: '', comment: '' }]) })
      setLineError(e.message)
    }
  }

  function submit() {
    const trimmed = input.trim()
    if (!trimmed) return
    runLine(autoFixCalculatorExpression(trimmed))
  }

  function insertSymbol(id) {
    set(setData, 'input', `${input}${id}`)
    inputRef.current?.focus()
  }

  function clearHistory() {
    setData({ history: '[]', variables: '{}', ans: '', input: '' })
    setLineError('')
  }

  const dockQueryText = dockQuery.trim().toLowerCase()
  const dockFunctions = calculatorFunctionCatalog.filter(fn => !dockQueryText || fn.id.includes(dockQueryText))
  const dockConstants = calculatorConstantCatalog.filter(c => !dockQueryText || `${c.id} ${c.name}`.toLowerCase().includes(dockQueryText))
  function shownResult(row) {
    if (row.error) return ''
    if (row.value != null && row.value !== '') return formatCalculatorResult(Number(row.value), precision, resultFormat, grouping)
    return row.result || ''
  }

  return <div className="tool-content calculator-tool">
    <div className="inline-controls calculator-options">
      <label>Angle<select value={angleUnit} onChange={e => set(setData, 'angleUnit', e.target.value)}>{angleUnits.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select></label>
      <label>Format<select value={resultFormat} onChange={e => set(setData, 'resultFormat', e.target.value)}>{resultFormats.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      <label>Digits<select value={String(precision)} onChange={e => set(setData, 'precision', e.target.value)}>{[6, 8, 12, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <label className="check-pill"><input type="checkbox" checked={grouping} onChange={e => set(setData, 'grouping', e.target.checked)} />Group digits</label>
      <label className="check-pill"><input type="checkbox" checked={autoCalc} onChange={e => set(setData, 'autoCalc', e.target.checked)} />Auto calculate</label>
      <label className="check-pill"><input type="checkbox" checked={autoAns} onChange={e => set(setData, 'autoAns', e.target.checked)} />Auto ans</label>
      <label className="check-pill"><input type="checkbox" checked={keepExpression} onChange={e => set(setData, 'keepExpression', e.target.checked)} />Keep expression</label>
      <Sample onClick={() => setData({ input: initialSamples.calculator, angleUnit: 'd', resultFormat: 'g', precision: '12', history: '[]', variables: '{}', ans: '' })} />
      <button type="button" className="text-action" onClick={clearHistory}>Clear</button>
    </div>
    <div className="calculator-workspace">
      <section className="calculator-panel editor-card">
        <div ref={historyRef} className="calculator-history" aria-live="polite">
          {history.length === 0 && <p className="calculator-empty">Enter evaluates. The line above the input is the live result when Auto calculate is on.</p>}
          {history.map((row, index) => <div key={index} className={`calculator-entry${row.error ? ' has-error' : ''}`}>
            <button type="button" className="calculator-expr" title="Reuse expression" onClick={() => set(setData, 'input', row.expr)}>{formatCalculatorExpression(row.expr, grouping)}{row.comment ? ` ? ${row.comment}` : ''}</button>
            {row.error
              ? <div className="calculator-error">{row.error}</div>
              : <div className="calculator-result">= {row.assigned ? `${row.assigned} ` : ''}{shownResult(row)}</div>}
          </div>)}
        </div>
        <form className="calculator-input-row" onSubmit={e => { e.preventDefault(); submit() }}>
          {preview && <div className="calculator-preview" aria-live="polite">
            <div className={preview.error ? 'calculator-error' : 'calculator-result'}>{preview.error || `= ${preview.text}`}</div>
          </div>}
          <input ref={inputRef} className="calculator-input" value={input} spellCheck="false" placeholder="Expression" aria-label="Expression" onChange={e => { set(setData, 'input', e.target.value); setLineError('') }} />
          <button type="submit" className="calculator-evaluate">Evaluate</button>
        </form>
        {hints.length > 0 && <div className="calculator-hints">{hints.map(h => <button key={`${h.kind}-${h.id}`} type="button" className="hint-chip" onClick={() => insertSymbol(h.kind === 'function' ? `${h.id}(` : h.id)}>{h.id}</button>)}</div>}
        {lineError && <p className="error-note">{lineError}</p>}
      </section>
      <aside className="calculator-dock editor-card">
        <div className="calculator-dock-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={dock === 'functions'} className={dock === 'functions' ? 'selected' : ''} onClick={() => setDock('functions')}>Functions</button>
          <button type="button" role="tab" aria-selected={dock === 'constants'} className={dock === 'constants' ? 'selected' : ''} onClick={() => setDock('constants')}>Constants</button>
        </div>
        <input className="calculator-dock-search" value={dockQuery} placeholder={dock === 'functions' ? 'Find a function' : 'Find a constant'} aria-label={dock === 'functions' ? 'Find a function' : 'Find a constant'} onChange={e => setDockQuery(e.target.value)} />
        <ul className="calculator-dock-list">
          {dock === 'functions'
            ? dockFunctions.map(fn => <li key={fn.id}><button type="button" onClick={() => insertSymbol(`${fn.id}(`)}>{fn.id}</button></li>)
            : dockConstants.map(c => <li key={c.id}><button type="button" onClick={() => insertSymbol(c.id)}><b>{c.id}</b><span>{c.name}</span></button></li>)}
        </ul>
      </aside>
    </div>
  </div>
}

function ListCompareTool({ data, setData }) {
  const left = textValue(data, 'left', initialSamples.listLeft), right = textValue(data, 'right', initialSamples.listRight)
  const mode = textValue(data, 'mode', 'both'), ignoreCase = textValue(data, 'ignoreCase', false)
  const rows = useMemo(() => compareLists(left, right, mode, ignoreCase === true || ignoreCase === 'true'), [left, right, mode, ignoreCase])
  const labels = { a: 'Only in list A', b: 'Only in list B', both: 'In both lists', union: 'Combined lists' }
  return <div className="tool-content"><div className="inline-controls"><label>Show<select value={mode} onChange={e => set(setData, 'mode', e.target.value)}><option value="both">In both</option><option value="a">Only in A</option><option value="b">Only in B</option><option value="union">Combined</option></select></label><label className="check-pill"><input type="checkbox" checked={ignoreCase === true || ignoreCase === 'true'} onChange={e => set(setData, 'ignoreCase', e.target.checked)} />Ignore case</label><Sample onClick={() => setData({ left: initialSamples.listLeft, right: initialSamples.listRight, mode: 'both' })} /><span className="muted-tip">{rows.length} line{rows.length === 1 ? '' : 's'} · blank lines skipped</span></div>
    <Split axis="y" storageKey="list-height" className="compare-stack"><Split className="compare-editors"><Editor label="List A" value={left} onChange={v => set(setData, 'left', v)} /><Editor label="List B" value={right} onChange={v => set(setData, 'right', v)} /></Split><Output label={labels[mode] || 'Result'} value={rows.join('\n')} placeholder="No matching lines." /></Split></div>
}

const DataPlaygroundTool = lazy(() => import('./dataPlayground/DataPlaygroundTool.jsx'))

export function renderTool(id, props) {
  if (id.startsWith('playground-')) return <Suspense fallback={<p role="status">Loading Data Playground…</p>}><DataPlaygroundTool view={id.slice('playground-'.length)} Editor={Editor} /></Suspense>
  const views = { json: JSONTool, sql: SQLTool, xml: XMLTool, base64: Base64Tool, 'base64-image': Base64ImageTool, certificate: CertificateTool, gzip: GZipTool, url: URLTool, html: HTMLTool, jwt: JWTTool, qrcode: QRCodeTool, cipher: CipherTool, cron: CronParserTool, 'json-table': JsonTableTool, 'number-base': NumberBaseTool, calculator: CalculatorTool, timestamp: TimestampTool, uuid: UUIDTool, hash: HashTool, password: PasswordTool, lorem: LoremTool, 'image-converter': ImageConverterTool, 'image-watermark': ImageWatermarkTool, 'image-coordinates': ImageCoordinateTool, jsxgraph: JsxGraphTool, mermaid: MermaidTool, drawio: DrawioTool, hoppscotch: HoppscotchTool, m3u8: M3u8Tool, analyzer: AnalyzerTool, yaml: YAMLTool, markdown: MarkdownTool, jsonpath: JsonPathTool, 'xml-tester': XmlTesterTool, regex: RegexTool, compare: CompareTool, escape: EscapeTool, list: ListCompareTool }
  const Component = views[id]
  return Component ? <WrapScope key={id} data={props.data} setData={props.setData}><Component {...props} /></WrapScope> : null
}
