const VERSION = '30dd6f570fcecd2c'
const FILES = ["assets/CheatsheetTool-ZNjOZXjr.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-DFN1BzMZ.js","assets/abnfDiagram-YUKMZFIV-CCMOnYDc.js","assets/algebriteWorker-DICACpaY.js","assets/arc-DHaU9vlE.js","assets/architectureDiagram-47P4ROYG-BZpvfFv0.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-BEm59JXB.js","assets/c4Diagram-CRA5TL53-WpdEnr6I.js","assets/channel-BtyVnUhF.js","assets/chineseResources-DDw2FHsd.js","assets/chunk-2Q5K7J3B-BLsIDmmu.js","assets/chunk-5VM5RSS4-CU3Bay1W.js","assets/chunk-7TKQ45FW-zJcNeu0g.js","assets/chunk-AW2ZBBNX-dsTfdH9R.js","assets/chunk-FVRAUYC3-Fe-E4UDk.js","assets/chunk-HTAEGDNF-C2MUj5yE.js","assets/chunk-JWPE2WC7-CCI4zqjv.js","assets/chunk-KQW6MTUR-D8XzruHR.js","assets/chunk-XXDRQBXY-DhkKHYDe.js","assets/classDiagram-v2-K4WV4PDN-BpGZbUo4.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-DurDyZn_.js","assets/cynefin-EF2NZ3EQ-LBxz8bF4.js","assets/cynefinDiagram-3GCD6N5R-CqNpAtjl.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-DJF2h1RT.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-YZRrs7lw.js","assets/diagram-OVF4WLC6-BgsZomFq.js","assets/diagram-PFPMY2P6-CWYG4_LN.js","assets/diagram-UMYRVEAY-DxnWF9D7.js","assets/diagram-YEKJPTXX-DJ8dtMaN.js","assets/diagram-ZIFT7M5P-BkR2hB5Q.js","assets/ebnfDiagram-VR2GEFS7-fqT9NgMk.js","assets/elk-IJKZMXRS-EniDPhyS.js","assets/erDiagram-O2IAPWRE-DCadrx-X.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-CWotapau.js","assets/ganttDiagram-R7TSEDQI-C-qwzI_r.js","assets/gitGraphDiagram-XJZIOB7I-djXwjU07.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-BYBMbk6W.css","assets/index-BmdkvrGW.js","assets/infoDiagram-5W2HQ5XZ-D84SD2OL.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-C9jBQZ20.js","assets/journeyDiagram-COXZFDF6-Dd9rvHvV.js","assets/kanban-definition-P3RFRI5V-BbUjbXFK.js","assets/linear-DqYwRfQa.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-DFsl4BxK.js","assets/nerdamerWorker-yGX1kYwE.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-CJ28hkHV.js","assets/pieDiagram-CAPJLFHJ-Dom0hQge.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-Ca8U3Hga.js","assets/railroadDiagram-SM67HX2B-BBJ5mskg.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-hcFD5zhG.js","assets/sankeyDiagram-UM26HJRW-WDw05taj.js","assets/sequenceDiagram-ZO4K6R2Y-BMWtnjH7.js","assets/sizeCapture-INFHLROL-yPTMirJo.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-Jb4iWEtJ.js","assets/swimlanes-N4OXWK64-CycmHhzL.js","assets/swimlanesDiagram-K3J5GTZL-CY7klxFN.js","assets/timeline-definition-YOQAKGHF-DHXLhrQ8.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-2JNXtPlI.js","assets/vennDiagram-BLWOH2XV-DQytTuz4.js","assets/wardleyDiagram-YMQ3BMBF-CIbNjAPn.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-C2Z462JS.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
