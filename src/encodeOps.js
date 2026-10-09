import 'reflect-metadata'
import { X509Certificate } from '@peculiar/x509'

const htmlNamed = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
}

const jwtHash = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }

function padBase64(data) {
  const remainder = data.length % 4
  return remainder ? data + '='.repeat(4 - remainder) : data
}

function bytesToBase64(bytes) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function base64UrlEncode(text) {
  return bytesToBase64(new TextEncoder().encode(text)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeBytes(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padBase64(normalized))
  return new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0)))
}

function textEncoder(encoding) {
  if (encoding === 'ascii') {
    return {
      encode(text) {
        const bytes = new Uint8Array(text.length)
        for (let i = 0; i < text.length; i++) {
          const code = text.charCodeAt(i)
          bytes[i] = code > 0x7f ? 0x3f : code
        }
        return bytes
      },
      decode(bytes) {
        let out = ''
        for (const b of bytes) out += String.fromCharCode(b)
        return out
      },
    }
  }
  return {
    encode: text => new TextEncoder().encode(text),
    decode: bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes),
  }
}

export function encodeBase64(text, encoding = 'utf8') {
  return bytesToBase64(textEncoder(encoding).encode(text))
}

export function decodeBase64(text, encoding = 'utf8') {
  const raw = atob(padBase64(text.trim()))
  return textEncoder(encoding).decode(Uint8Array.from(raw, c => c.charCodeAt(0)))
}

export function encodeBytesBase64(bytes) {
  return bytesToBase64(bytes)
}

export function decodeBytesBase64(text) {
  const raw = atob(padBase64(text.trim()))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function encodeUrl(text) {
  return encodeURIComponent(text ?? '')
}

export function decodeUrl(text) {
  return decodeURIComponent(text ?? '')
}

function eachLine(text, multiline, convert) {
  const source = text ?? ''
  if (!multiline) return convert(source)
  return source.split(/\r?\n/).map(line => {
    try { return convert(line) } catch (e) { return e.message || '' }
  }).join('\n')
}

export function convertBase64Text(text, encoding = 'utf8', mode = 'encode', multiline = false) {
  return eachLine(text, multiline, line => {
    if (!String(line).trim()) return ''
    if (mode === 'encode') return encodeBase64(line, encoding)
    try { return decodeBase64(line, encoding) }
    catch (e) {
      if (!multiline) throw e
      return '<Invalid Base64>'
    }
  })
}

export function convertUrl(text, direction = 'encode', multiline = false) {
  const run = value => direction === 'encode' ? encodeUrl(value) : decodeUrl(value)
  return eachLine(text, multiline, line => multiline && !String(line).trim() ? '' : run(line))
}

export function encodeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function decodeHtml(text) {
  if (!text) return ''
  return text.replace(/&(#(?:xX)[\da-fA-F]+|#\d+|\w+);/g, (match, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X'
      const num = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10)
      if (!Number.isFinite(num) || num < 0 || num > 0x10ffff) return match
      try { return String.fromCodePoint(num) } catch { return match }
    }
    return htmlNamed[body.toLowerCase()] ?? match
  })
}

function gzipStreamsAvailable() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

async function gzipBytes(bytes) {
  if (!gzipStreamsAvailable()) throw new Error('GZip is not supported in this browser.')
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzipBytes(bytes) {
  if (!gzipStreamsAvailable()) throw new Error('GZip is not supported in this browser.')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function compressGzip(text) {
  const input = text ?? ''
  const compressed = await gzipBytes(new TextEncoder().encode(input))
  const data = bytesToBase64(compressed)
  const ratio = input.length ? ((input.length - data.length) / input.length) * 100 : 0
  return { data, ratio }
}

export async function decompressGzip(base64Input) {
  const invalid = '<Invalid GZip data>'
  if (base64Input == null) return { data: '', ratio: 0 }
  const trimmed = base64Input.trim()
  if (!trimmed) return { data: '', ratio: 0 }
  try {
    const outBytes = await gunzipBytes(decodeBytesBase64(trimmed))
    const data = new TextDecoder().decode(outBytes)
    const ratio = data.length ? ((data.length - trimmed.length) / data.length) * 100 : 0
    return { data, ratio }
  } catch {
    return { data: invalid, ratio: 0, error: invalid }
  }
}

export function decodeJwt(token) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) throw new Error('A JWT must contain three dot-separated parts.')
  return {
    header: JSON.parse(decodeBase64Url(parts[0])),
    claims: JSON.parse(decodeBase64Url(parts[1])),
  }
}

export function formatJwtDecoded({ header, claims }, now = Date.now()) {
  const exp = claims.exp ? new Date(claims.exp * 1000) : null
  const status = exp
    ? (exp.getTime() < now ? `EXPIRED ${exp.toLocaleString()}` : `Expires ${exp.toLocaleString()}`)
    : 'No expiration claim'
  return `HEADER\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(claims, null, 2)}\n\n${status}\n\nSignature: present but not verified.`
}

export async function encodeJwtHs({ payload, secret, algorithm = 'HS256', header = {} }) {
  const hash = jwtHash[algorithm]
  if (!hash) throw new Error(`Unsupported algorithm: ${algorithm}.`)
  if (!secret) throw new Error('Enter a signing secret.')
  let claims
  try { claims = typeof payload === 'string' ? JSON.parse(payload) : payload }
  catch { throw new Error('Payload must be valid JSON.') }
  const headerJson = { alg: algorithm, typ: 'JWT', ...header }
  const encodedHeader = base64UrlEncode(JSON.stringify(headerJson))
  const encodedPayload = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signature))}`
}

export function decodeCertificate(input) {
  const text = (input ?? '').trim()
  if (!text) throw new Error('Paste a PEM certificate.')
  if (/BEGIN CERTIFICATE REQUEST/i.test(text)) {
    throw new Error('Certificate signing requests are not supported in the browser.')
  }
  if (/BEGIN ENCRYPTED PRIVATE KEY/i.test(text) || /\.pfx/i.test(text)) {
    throw new Error('Password-protected PFX/P12 files are not supported here. Paste a PEM certificate.')
  }
  try {
    const cert = new X509Certificate(text)
    const lines = [
      `Subject: ${cert.subject}`,
      `Issuer: ${cert.issuer}`,
      `Serial number: ${cert.serialNumber}`,
      `Not before: ${cert.notBefore.toISOString()}`,
      `Not after: ${cert.notAfter.toISOString()}`,
      `Signature algorithm: ${cert.signatureAlgorithm.name}`,
    ]
    if (cert.publicKey?.algorithm?.name) lines.push(`Public key: ${cert.publicKey.algorithm.name}`)
    return lines.join('\n')
  } catch {
    throw new Error('Unsupported certificate format. Use a PEM-encoded X.509 certificate.')
  }
}

export function parseDataUrl(input) {
  const match = (input ?? '').trim().match(/^data:([^;,]+)?;base64,(.+)$/is)
  if (!match) return { mime: 'application/octet-stream', base64: (input ?? '').trim() }
  return { mime: match[1] || 'application/octet-stream', base64: match[2].replace(/\s/g, '') }
}

export function toDataUrl(base64, mime = 'application/octet-stream') {
  return `data:${mime};base64,${base64.trim()}`
}
