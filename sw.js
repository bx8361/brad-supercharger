const VERSION = 'e48e79bad35db6f7'
const FILES = ["assets/DataPlaygroundTool-BEiPF1Jg.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-CyTUE9O0.js","assets/algebriteWorker-DICACpaY.js","assets/arc-BnFBvCpE.js","assets/architectureDiagram-47P4ROYG-DS4NUQMa.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-CS4acZf4.js","assets/c4Diagram-CRA5TL53--5xDcniW.js","assets/channel-_YO4Svlz.js","assets/chineseResources-DDw2FHsd.js","assets/chunk-2Q5K7J3B-D5X1u9lt.js","assets/chunk-5VM5RSS4-B89IoJLG.js","assets/chunk-7TKQ45FW-D0j__IxM.js","assets/chunk-AW2ZBBNX-C5X_zhSr.js","assets/chunk-FVRAUYC3-B0KRBLls.js","assets/chunk-HTAEGDNF-DLsUoHzF.js","assets/chunk-JWPE2WC7-P_dIdVip.js","assets/chunk-KQW6MTUR-BLsiLyPE.js","assets/chunk-XXDRQBXY-BxMRmzFT.js","assets/classDiagram-v2-K4WV4PDN-BenVa9GB.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-192w-pu_.js","assets/cynefin-EF2NZ3EQ-Dc-piae0.js","assets/cynefinDiagram-3GCD6N5R-Dx2T9pv3.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-DwrYaFL1.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-P-NCvraC.js","assets/diagram-OVF4WLC6-BhNe_n9B.js","assets/diagram-PFPMY2P6-DW04UWZk.js","assets/diagram-UMYRVEAY-rq2SJeRR.js","assets/diagram-YEKJPTXX-BbQpxYqU.js","assets/diagram-ZIFT7M5P-zfsjECW_.js","assets/ebnfDiagram-VR2GEFS7-DUHB_a8P.js","assets/elk-IJKZMXRS-DQ7MKGhn.js","assets/erDiagram-O2IAPWRE-nNeMXZF9.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-DaBLNz1D.js","assets/ganttDiagram-R7TSEDQI-C3lWVp8D.js","assets/gitGraphDiagram-XJZIOB7I-TpMfzcUv.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-CAZuxaIn.js","assets/index-DGnjxaS3.css","assets/infoDiagram-5W2HQ5XZ-BUvw2oB8.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-DUf-Cnpy.js","assets/journeyDiagram-COXZFDF6-DGKcLVkU.js","assets/kanban-definition-P3RFRI5V-CO3eQDlC.js","assets/linear-Bd6th4b2.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-BmoQLtIk.js","assets/nerdamerWorker-yGX1kYwE.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-VL6wbc_F.js","assets/pieDiagram-CAPJLFHJ-G7xelx49.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-CPs7854b.js","assets/railroadDiagram-SM67HX2B-CxOiAr-A.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-oshPo1Ua.js","assets/sankeyDiagram-UM26HJRW-DwOe3z6X.js","assets/sequenceDiagram-ZO4K6R2Y-CJ8uouqE.js","assets/sizeCapture-INFHLROL-C-aG8SaH.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-DEULDluG.js","assets/swimlanes-N4OXWK64-CHMSKTXy.js","assets/swimlanesDiagram-K3J5GTZL-B-z4zx_5.js","assets/timeline-definition-YOQAKGHF-CJOfBaAa.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-DcpI23zq.js","assets/vennDiagram-BLWOH2XV-D-5MUsrC.js","assets/wardleyDiagram-YMQ3BMBF-BCwEzD0j.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-DnOonoDe.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
