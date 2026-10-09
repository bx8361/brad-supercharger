import test from 'node:test'
import assert from 'node:assert/strict'
import { bestMasterVariant, listMasterVariants, m3u8UrlFromLocation, parseM3u8, resolvePlaylistUrl, segmentProgress } from '../src/m3u8Ops.js'

test('resolvePlaylistUrl resolves relative segment URLs', () => {
  assert.equal(
    resolvePlaylistUrl('https://cdn.example.com/live/playlist.m3u8', 'seg-001.ts'),
    'https://cdn.example.com/live/seg-001.ts',
  )
})

test('parseM3u8 collects segments and keeps encryption key across parts', () => {
  const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:100
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXTINF:9.0,
part0.ts
#EXTINF:9.0,
part1.ts
`
  const { segments, mediaSequence } = parseM3u8(playlist, 'https://video.test/stream.m3u8')
  assert.equal(mediaSequence, 100)
  assert.equal(segments.length, 2)
  assert.equal(segments[0].url, 'https://video.test/part0.ts')
  assert.equal(segments[0].sequence, 100)
  assert.equal(segments[0].key.method, 'AES-128')
  assert.equal(segments[0].key.uri, 'https://video.test/key.bin')
  assert.equal(segments[1].key.uri, 'https://video.test/key.bin')
})

test('listMasterVariants picks the highest bandwidth media playlist', () => {
  const playlist = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
low/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
hi/index.m3u8
`
  const variants = listMasterVariants(playlist, 'https://cdn.example/live/master.m3u8')
  assert.equal(parseM3u8(playlist, 'https://cdn.example/live/master.m3u8').isMaster, true)
  assert.equal(variants.length, 2)
  const best = bestMasterVariant(variants)
  assert.equal(best.url, 'https://cdn.example/live/hi/index.m3u8')
  assert.equal(best.resolution, '1280x720')
})

test('segmentProgress counts done, active, and failed segments', () => {
  const progress = segmentProgress([
    { status: 'done', bytes: 100, playlistIndex: 0, url: 'https://cdn.example/0.ts' },
    { status: 'downloading', attempt: 2, tries: 4, playlistIndex: 1, url: 'https://cdn.example/1.ts' },
    { status: 'error', error: 'HTTP 404', playlistIndex: 2, url: 'https://cdn.example/2.ts' },
  ])
  assert.equal(progress.done, 1)
  assert.equal(progress.active, 1)
  assert.equal(progress.failed, 1)
  assert.equal(progress.bytes, 100)
  assert.equal(progress.percent, 33)
  assert.equal(progress.activeSegments[0].attempt, 2)
  assert.equal(progress.failures[0].error, 'HTTP 404')
})

test('m3u8UrlFromLocation reads path and hash query urls', () => {
  assert.equal(
    m3u8UrlFromLocation('http://blablabla/tools/m3u8?url=https%3A%2F%2Fcdn.example%2Fa.m3u8'),
    'https://cdn.example/a.m3u8',
  )
  assert.equal(
    m3u8UrlFromLocation('http://blablabla/#/tools/m3u8?url=https%3A%2F%2Fcdn.example%2Fb.m3u8'),
    'https://cdn.example/b.m3u8',
  )
})
