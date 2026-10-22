const VERSION = '12de7063bbeddf8e'
const FILES = ["assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-DxqFms9V.js","assets/abnfDiagram-YUKMZFIV-D67AI2pW.js","assets/arc-Dih25VtA.js","assets/architectureDiagram-47P4ROYG-GoG7XMaS.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-BV4GsewE.js","assets/c4Diagram-CRA5TL53-DifQbAqB.js","assets/channel-e7rrDyf5.js","assets/chunk-2Q5K7J3B-DyEI5WWp.js","assets/chunk-5VM5RSS4-BhI5bs33.js","assets/chunk-7TKQ45FW-BmKl620Z.js","assets/chunk-AW2ZBBNX-DaO7x2RO.js","assets/chunk-FVRAUYC3-XbV__21L.js","assets/chunk-HTAEGDNF-BtFsplqP.js","assets/chunk-JWPE2WC7-BRGk0pZM.js","assets/chunk-KQW6MTUR-J6cNWgAC.js","assets/chunk-XXDRQBXY-DhMdeYYT.js","assets/classDiagram-v2-K4WV4PDN-2XfStSMj.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-BlSAiov0.js","assets/cynefin-EF2NZ3EQ-C3b9jnU9.js","assets/cynefinDiagram-3GCD6N5R-DlBkFweD.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-y-Qsv_nQ.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-T3hKG-ui.js","assets/diagram-OVF4WLC6-BmXs8Rtk.js","assets/diagram-PFPMY2P6-Ch1LZmG7.js","assets/diagram-UMYRVEAY-CdYOYcBX.js","assets/diagram-YEKJPTXX-D-llb4wx.js","assets/diagram-ZIFT7M5P-DSP5i1kG.js","assets/ebnfDiagram-VR2GEFS7-DUVjSMmn.js","assets/elk-IJKZMXRS-DB40gUAV.js","assets/erDiagram-O2IAPWRE-DalChd4I.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-D-Sczfkb.js","assets/ganttDiagram-R7TSEDQI-ClpSpMW4.js","assets/gitGraphDiagram-XJZIOB7I-CbI9-vi4.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-D2DbjvZm.js","assets/index-DEJ8jXjs.css","assets/infoDiagram-5W2HQ5XZ-D6Qwtz7K.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-oY31bdA3.js","assets/journeyDiagram-COXZFDF6-BpgQxPS3.js","assets/kanban-definition-P3RFRI5V-DRWYehZQ.js","assets/katex-Cp5iPVkt.js","assets/linear-B8aJUJcJ.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-DTyEUCQW.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-D9Xzf4jh.js","assets/pieDiagram-CAPJLFHJ-Df8sTF7Q.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-BI70iN47.js","assets/railroadDiagram-SM67HX2B-C3wScSxL.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-ULJRxiUE.js","assets/sankeyDiagram-UM26HJRW-Dh7qVVyr.js","assets/sequenceDiagram-ZO4K6R2Y-DHc17F22.js","assets/sizeCapture-INFHLROL-Cftipo1_.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-D3j7z7y8.js","assets/swimlanes-N4OXWK64-Dsk5uye9.js","assets/swimlanesDiagram-K3J5GTZL-CMI-J8IF.js","assets/timeline-definition-YOQAKGHF-DrXLsZFI.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-DYdYT73A.js","assets/vennDiagram-BLWOH2XV-BwTP0Wp8.js","assets/wardleyDiagram-YMQ3BMBF-mRvxdU9u.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS--I94m6Xm.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
