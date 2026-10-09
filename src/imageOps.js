export const imageOutputFormats = [
  { id: 'png', label: 'PNG', mime: 'image/png' },
  { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
]

export function imageFormatMeta(id) {
  return imageOutputFormats.find(format => format.id === id) || imageOutputFormats[0]
}

export async function convertImageFile(file, formatId, quality = 0.92) {
  const format = imageFormatMeta(formatId)
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a canvas context.')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
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
