const VERSION = 'b95b7cc1ab2abc36'
const FILES = ["assets/DataPlaygroundTool-BPB1IVF4.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-BESUrqSy.js","assets/arc-BqyekCAN.js","assets/architectureDiagram-47P4ROYG-i4iaHSwO.js","assets/blockDiagram-E7TT5TSB-HPuIUtiw.js","assets/c4Diagram-CRA5TL53-BwNQpqOx.js","assets/channel-sYv74cks.js","assets/chunk-2Q5K7J3B-BPPm8Ozs.js","assets/chunk-5VM5RSS4-BztLmXsd.js","assets/chunk-7TKQ45FW-BSdMjQFc.js","assets/chunk-AW2ZBBNX-D1bFp4tz.js","assets/chunk-FVRAUYC3-DJWhvGES.js","assets/chunk-HTAEGDNF-C8Z1Peh0.js","assets/chunk-JWPE2WC7-C5WRp1z_.js","assets/chunk-KQW6MTUR-hCXUwSgt.js","assets/chunk-XXDRQBXY-jf1P1lLs.js","assets/classDiagram-v2-K4WV4PDN-Cff7nrVJ.js","assets/cose-bilkent-JH36ORCC-fsQaGvq7.js","assets/cynefin-EF2NZ3EQ-DSsbejh9.js","assets/cynefinDiagram-3GCD6N5R-WO5UpfDT.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-B2iO4sO2.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-BjJcodfC.js","assets/diagram-OVF4WLC6-BTyrkrhw.js","assets/diagram-PFPMY2P6-BXVrztDP.js","assets/diagram-UMYRVEAY-bfXJREfF.js","assets/diagram-YEKJPTXX-DC-DSaCB.js","assets/diagram-ZIFT7M5P-BGVSwiU0.js","assets/ebnfDiagram-VR2GEFS7-CwtbUvGw.js","assets/elk-IJKZMXRS-cM-f08w8.js","assets/erDiagram-O2IAPWRE-OklRsILf.js","assets/flowDiagram-OXPTDLAJ-HUJncDjT.js","assets/ganttDiagram-R7TSEDQI-Cv4OY4TC.js","assets/gitGraphDiagram-XJZIOB7I-CpwvAXzx.js","assets/graph-Bn3Yngep.js","assets/index-C9_5HFDn.css","assets/index-DKSFDDDR.js","assets/infoDiagram-5W2HQ5XZ-syXoereW.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-BUygkC1J.js","assets/journeyDiagram-COXZFDF6-4OHN8rrw.js","assets/kanban-definition-P3RFRI5V-C7f7CSXa.js","assets/katex-C5jXJg4s.js","assets/linear-CWDh8Hro.js","assets/mindmap-definition-LZFPQGKD-iwGRj8hX.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-d7pKvaVI.js","assets/pieDiagram-CAPJLFHJ-qbsbTEg8.js","assets/quadrantDiagram-GDMTTRAM-Y6XxlWVl.js","assets/railroadDiagram-SM67HX2B-C2KZ6yMK.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-B27fFxAK.js","assets/sankeyDiagram-UM26HJRW-oT6vR_aZ.js","assets/sequenceDiagram-ZO4K6R2Y-BHfz3c3G.js","assets/sizeCapture-INFHLROL-B41QmecW.js","assets/stateDiagram-v2-TBUQTH76-CbMyUyTG.js","assets/swimlanes-N4OXWK64-DcNPpsXx.js","assets/swimlanesDiagram-K3J5GTZL-nKQ7b8Pj.js","assets/timeline-definition-YOQAKGHF-Csli73h4.js","assets/usecaseDiagram-VIAY4XPW-dpiFfRE4.js","assets/vennDiagram-BLWOH2XV-XRlhho9O.js","assets/wardleyDiagram-YMQ3BMBF-CgIPvkZ7.js","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-BYYM9udK.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"]
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
