export const imageOutputFormats = [
  { id: 'png', label: 'PNG', mime: 'image/png' },
  { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
]

export function imageFormatMeta(id) {
  return imageOutputFormats.find(format => format.id === id) || imageOutputFormats[0]
}

export function isSvgFile(file) {
  const type = file?.type || ''
  return type === 'image/svg+xml' || type === 'image/svg' || /\.svg$/i.test(file?.name || '')
}

// ponytail: 8192px cap so a viewBox cannot allocate a huge canvas
const maxRaster = 8192

function svgAttr(openTag, name) {
  return openTag.match(new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'i'))?.[2] ?? ''
}

// ponytail: unitless and px only; cm/in/em need a real SVG length resolver
function svgPx(value) {
  const n = parseFloat(value)
  if (!value || /%|auto/i.test(value) || !Number.isFinite(n) || n <= 0) return 0
  return n
}

export function svgIntrinsicSize(text) {
  const open = String(text).match(/<svg\b([^>]*)>/i)?.[1] || ''
  const box = svgAttr(open, 'viewBox').trim().split(/[\s,]+/).map(Number)
  const vbW = box.length === 4 && box[2] > 0 ? box[2] : 0
  const vbH = box.length === 4 && box[3] > 0 ? box[3] : 0
  return {
    width: svgPx(svgAttr(open, 'width')) || vbW || 300,
    height: svgPx(svgAttr(open, 'height')) || vbH || 150,
  }
}

export function rasterSize(intrinsic, width, height) {
  const w = Number(width)
  const h = Number(height)
  const hasW = Number.isFinite(w) && w > 0
  const hasH = Number.isFinite(h) && h > 0
  let outW = intrinsic.width
  let outH = intrinsic.height
  if (hasW && hasH) { outW = w; outH = h }
  else if (hasW) { outW = w; outH = intrinsic.height * (w / intrinsic.width) }
  else if (hasH) { outH = h; outW = intrinsic.width * (h / intrinsic.height) }
  const scale = Math.min(1, maxRaster / outW, maxRaster / outH)
  return { width: Math.max(1, Math.round(outW * scale)), height: Math.max(1, Math.round(outH * scale)) }
}

function svgSized(text, width, height) {
  const match = String(text).match(/<svg\b([^>]*)>/i)
  if (!match) throw new Error('Image conversion failed.')
  const attrs = match[1]
    .replace(/\swidth\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\sheight\s*=\s*(['"]).*?\1/gi, '')
  return String(text).replace(match[0], `<svg${attrs} width="${width}" height="${height}">`)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image conversion failed.'))
    img.src = url
  })
}

export async function convertImageFile(file, formatId, quality = 0.92, size) {
  const format = imageFormatMeta(formatId)
  if (!isSvgFile(file) && !file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a canvas context.')
  if (isSvgFile(file)) {
    const text = await file.text()
    const target = rasterSize(svgIntrinsicSize(text), size?.width, size?.height)
    const url = URL.createObjectURL(new Blob([svgSized(text, target.width, target.height)], { type: 'image/svg+xml' }))
    try {
      const img = await loadImage(url)
      canvas.width = target.width
      canvas.height = target.height
      ctx.drawImage(img, 0, 0, target.width, target.height)
    } finally {
      URL.revokeObjectURL(url)
    }
  } else {
    const bitmap = await createImageBitmap(file)
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
  }
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      value => (value ? resolve(value) : reject(new Error('Image conversion failed.'))),
      format.mime,
      format.id === 'png' ? undefined : quality,
    )
  })
  return blob
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function drawTextWatermark(ctx, width, height, options) {
  const text = String(options.text ?? '').trim()
  if (!text) return
  const opacity = Math.min(100, Math.max(0, Number(options.opacity) || 0)) / 100
  const fontSize = Math.max(1, Number(options.fontSize) || 24)
  const spacing = Math.max(0, Number(options.spacing) || 120)
  const color = options.color === 'white' ? '#ffffff' : '#000000'
  const angle = -Math.PI / 6

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const cellW = Math.max(spacing, metrics.width + spacing * 0.35)
  const cellH = Math.max(spacing, fontSize * 1.8)

  const diag = Math.hypot(width, height)
  ctx.translate(width / 2, height / 2)
  ctx.rotate(angle)
  ctx.translate(-diag, -diag)

  for (let y = 0; y < diag * 2; y += cellH) {
    for (let x = 0; x < diag * 2; x += cellW) {
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
}

export async function renderWatermarkedCanvas(file, options) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a canvas context.')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  drawTextWatermark(ctx, canvas.width, canvas.height, options)
  return canvas
}

export async function watermarkedImageBlob(file, formatId = 'png', quality = 0.92, options) {
  const format = imageFormatMeta(formatId)
  const canvas = await renderWatermarkedCanvas(file, options)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      value => (value ? resolve(value) : reject(new Error('Watermark export failed.'))),
      format.mime,
      format.id === 'png' ? undefined : quality,
    )
  })
  return blob
}
