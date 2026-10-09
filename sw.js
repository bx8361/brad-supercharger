const VERSION = '2878909c440fb1ef'
const FILES = ["assets/DataPlaygroundTool-CcrsKDvb.css","assets/DataPlaygroundTool-CrXXmgVv.js","assets/abnfDiagram-YUKMZFIV-CLtbf6Dv.js","assets/arc-BfF-g-WG.js","assets/architectureDiagram-47P4ROYG-Bx2wJa53.js","assets/blockDiagram-E7TT5TSB-ckBehPp7.js","assets/c4Diagram-CRA5TL53-nzd2oOUD.js","assets/channel-BkQ69vzK.js","assets/chunk-2Q5K7J3B-BelFrMH-.js","assets/chunk-5VM5RSS4-Dq2UcGOt.js","assets/chunk-7TKQ45FW-_Qsa3QcK.js","assets/chunk-AW2ZBBNX-CzhpXUIG.js","assets/chunk-FVRAUYC3-Xc7HMI2n.js","assets/chunk-HTAEGDNF-CqS_bg4E.js","assets/chunk-JWPE2WC7-C37-MsiC.js","assets/chunk-KQW6MTUR-BZa-xZ3U.js","assets/chunk-XXDRQBXY-twer_zzE.js","assets/classDiagram-v2-K4WV4PDN-DjCBfKfM.js","assets/cose-bilkent-JH36ORCC-BKX81LcL.js","assets/cynefin-EF2NZ3EQ-BuAP9ewt.js","assets/cynefinDiagram-3GCD6N5R-Cl4pkjoV.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-B1eUuVbk.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-Br4EQptM.js","assets/diagram-OVF4WLC6-BmpXSTor.js","assets/diagram-PFPMY2P6-DKB1tpGg.js","assets/diagram-UMYRVEAY-BGmcOMe8.js","assets/diagram-YEKJPTXX-BezVSrse.js","assets/diagram-ZIFT7M5P-D7VadVMa.js","assets/ebnfDiagram-VR2GEFS7-CjZSq5At.js","assets/elk-IJKZMXRS-C5oe8xJl.js","assets/erDiagram-O2IAPWRE-DpHAbyG1.js","assets/flowDiagram-OXPTDLAJ-BgqGT0cG.js","assets/ganttDiagram-R7TSEDQI-DUiv7Vjt.js","assets/gitGraphDiagram-XJZIOB7I-2vA5r_5n.js","assets/graph-Bn3Yngep.js","assets/index-BLbjZVro.js","assets/index-Bw2q5VPY.css","assets/infoDiagram-5W2HQ5XZ-By65Zrr2.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-D5SaW4M6.js","assets/journeyDiagram-COXZFDF6-BT_qdSls.js","assets/kanban-definition-P3RFRI5V-DLbL4VFr.js","assets/katex-C5jXJg4s.js","assets/linear-CpWff4lF.js","assets/mindmap-definition-LZFPQGKD-B5oUc-ME.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-B7q-NOzm.js","assets/pieDiagram-CAPJLFHJ-DOQoax9k.js","assets/quadrantDiagram-GDMTTRAM-BRGCz7sV.js","assets/railroadDiagram-SM67HX2B-DuPuIsib.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-DmYjZ-2G.js","assets/sankeyDiagram-UM26HJRW-CrIYebW0.js","assets/sequenceDiagram-ZO4K6R2Y-DhUw1HRF.js","assets/sizeCapture-INFHLROL-DcTzSq2Y.js","assets/stateDiagram-v2-TBUQTH76-C7hnN_eq.js","assets/swimlanes-N4OXWK64-DeISBArg.js","assets/swimlanesDiagram-K3J5GTZL-ClbUfk6z.js","assets/timeline-definition-YOQAKGHF-Ke91REnz.js","assets/usecaseDiagram-VIAY4XPW-D7ElvItv.js","assets/vennDiagram-BLWOH2XV-Cg4AySTQ.js","assets/wardleyDiagram-YMQ3BMBF-DV2SBJpm.js","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-CTcKQe_D.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"]
const CACHE_PREFIX = `supercharger:${self.registration.scope}:`
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`
const ASSETS = FILES.map(file => new URL(file, self.registration.scope).href)
const SHELL = new URL('index.html', self.registration.scope).href

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
  // Updates wait until existing windows close so in-memory tool text is preserved.
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const scope = new URL(self.registration.scope)
  if (url.origin !== scope.origin) return
  const isShell = request.mode === 'navigate' &&
    (url.pathname === scope.pathname || url.pathname === new URL(SHELL).pathname)
  const asset = isShell ? SHELL : `${url.origin}${url.pathname}`
  if (!ASSETS.includes(asset)) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    return (await cache.match(asset)) || fetch(request)
  })())
})
