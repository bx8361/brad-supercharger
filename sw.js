const VERSION = '72a0fd4330b76f5d'
const FILES = ["assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-DCznhS5q.js","assets/abnfDiagram-YUKMZFIV-kf8j_PFq.js","assets/arc-D2kDXql_.js","assets/architectureDiagram-47P4ROYG-Dyqn8P-T.js","assets/blockDiagram-E7TT5TSB-CVJvk7-3.js","assets/c4Diagram-CRA5TL53-C8a2zX_u.js","assets/channel-RgGs9JYo.js","assets/chunk-2Q5K7J3B-uEBoiFO0.js","assets/chunk-5VM5RSS4-BhDiG08w.js","assets/chunk-7TKQ45FW-BCUstgBt.js","assets/chunk-AW2ZBBNX-tg9X9dbu.js","assets/chunk-FVRAUYC3-t6gyXLdO.js","assets/chunk-HTAEGDNF-B_w7KXfH.js","assets/chunk-JWPE2WC7-OHGYYO3Q.js","assets/chunk-KQW6MTUR-Bsk0xItv.js","assets/chunk-XXDRQBXY-Bt2BK2yE.js","assets/classDiagram-v2-K4WV4PDN-C9IKOWUu.js","assets/cose-bilkent-JH36ORCC-Cq-pPhyK.js","assets/cynefin-EF2NZ3EQ-Am3bbTeZ.js","assets/cynefinDiagram-3GCD6N5R-CljaVe2n.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-k-7tlxhu.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-9i690U59.js","assets/diagram-OVF4WLC6-3Aydk4NY.js","assets/diagram-PFPMY2P6-D90RxpFq.js","assets/diagram-UMYRVEAY-m6qp529i.js","assets/diagram-YEKJPTXX-BXtS688i.js","assets/diagram-ZIFT7M5P-B5j3JTix.js","assets/ebnfDiagram-VR2GEFS7-BfQwJJOl.js","assets/elk-IJKZMXRS-PuWSimwl.js","assets/erDiagram-O2IAPWRE-QugtuAiv.js","assets/flowDiagram-OXPTDLAJ-9J3EkROg.js","assets/ganttDiagram-R7TSEDQI-19MFr90k.js","assets/gitGraphDiagram-XJZIOB7I-BUqlXwJe.js","assets/graph-Bn3Yngep.js","assets/index-BFLACM-w.js","assets/index-DB5Lhg4q.css","assets/infoDiagram-5W2HQ5XZ-CvoIoWAA.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-Bp6hR5JV.js","assets/journeyDiagram-COXZFDF6-DmkYFgeR.js","assets/kanban-definition-P3RFRI5V-BU2NaiDH.js","assets/katex-C5jXJg4s.js","assets/linear-CC0xgbCL.js","assets/mindmap-definition-LZFPQGKD-CHLkpkOB.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-BsX4kifj.js","assets/pieDiagram-CAPJLFHJ-DkgG1ZqB.js","assets/quadrantDiagram-GDMTTRAM-CFUqqI_b.js","assets/railroadDiagram-SM67HX2B-BTjFLABc.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-Ck3I0ysC.js","assets/sankeyDiagram-UM26HJRW-Cfs2WfO0.js","assets/sequenceDiagram-ZO4K6R2Y-BWyUI2w9.js","assets/sizeCapture-INFHLROL-DKJ84186.js","assets/stateDiagram-v2-TBUQTH76-BFpZIZVn.js","assets/swimlanes-N4OXWK64-iVuFNwZm.js","assets/swimlanesDiagram-K3J5GTZL-BA8vjA0Y.js","assets/timeline-definition-YOQAKGHF-DZ73nh1g.js","assets/usecaseDiagram-VIAY4XPW-BrAV8Mmx.js","assets/vennDiagram-BLWOH2XV-BQ0PTmFM.js","assets/wardleyDiagram-YMQ3BMBF-CWbS9nRZ.js","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-Cc8dhVVb.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"]
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
