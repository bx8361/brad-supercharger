const VERSION = '1668471afd101a0e'
const FILES = ["assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-D9Tap7LQ.js","assets/abnfDiagram-YUKMZFIV-CquV-c5H.js","assets/arc-BHOtl8Rn.js","assets/architectureDiagram-47P4ROYG-WSqavP94.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-3j45t9nG.js","assets/c4Diagram-CRA5TL53-CyWfaujK.js","assets/channel-CyRfMoBw.js","assets/chunk-2Q5K7J3B-C1EAsDZ3.js","assets/chunk-5VM5RSS4-Bsw6rOXn.js","assets/chunk-7TKQ45FW-HAjzsmDk.js","assets/chunk-AW2ZBBNX-DoxlWh6f.js","assets/chunk-FVRAUYC3-BX6Kj0Qh.js","assets/chunk-HTAEGDNF-Dxoyc0Z8.js","assets/chunk-JWPE2WC7-D7TyVknk.js","assets/chunk-KQW6MTUR-BQ_e3X5g.js","assets/chunk-XXDRQBXY-CvQZ4-Yc.js","assets/classDiagram-v2-K4WV4PDN-CwRoKITI.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-WhsToGr_.js","assets/cynefin-EF2NZ3EQ-CdZ5cxUZ.js","assets/cynefinDiagram-3GCD6N5R-Bmi1_ju8.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-DgRYn-xM.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-DRB5AUrt.js","assets/diagram-OVF4WLC6-78KrvBEA.js","assets/diagram-PFPMY2P6-BOifQUtU.js","assets/diagram-UMYRVEAY-_pbS9M-x.js","assets/diagram-YEKJPTXX-ClgI1K89.js","assets/diagram-ZIFT7M5P-NE8dFoQK.js","assets/ebnfDiagram-VR2GEFS7-Dniqvu7p.js","assets/elk-IJKZMXRS-BLp1cnzx.js","assets/erDiagram-O2IAPWRE-pUCXT5E4.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-DJAT1g7q.js","assets/ganttDiagram-R7TSEDQI-sCuAIDDP.js","assets/gitGraphDiagram-XJZIOB7I-CbF6TSjY.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-CTXgkpUu.js","assets/index-DEJ8jXjs.css","assets/infoDiagram-5W2HQ5XZ-gBjFz91K.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-BN8Ae_6-.js","assets/journeyDiagram-COXZFDF6-C891VAHd.js","assets/kanban-definition-P3RFRI5V-BvIeSiRd.js","assets/katex-Cp5iPVkt.js","assets/linear-CwOTwFYY.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-CXrqs3_T.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-CQGWdonN.js","assets/pieDiagram-CAPJLFHJ-C0z44HsV.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-BwMz6p5i.js","assets/quadrantDiagram-GDMTTRAM-p5y25KxS.js","assets/railroadDiagram-SM67HX2B-DvIC3WBx.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-DNiGBCyG.js","assets/sankeyDiagram-UM26HJRW-DyiW2SkC.js","assets/sequenceDiagram-ZO4K6R2Y-DvkrXCz_.js","assets/sizeCapture-INFHLROL-Dd-9v9FR.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-CSBN7sxK.js","assets/swimlanes-N4OXWK64-CRLl0iTs.js","assets/swimlanesDiagram-K3J5GTZL-CSXL7tAU.js","assets/timeline-definition-YOQAKGHF-DoumQ_ne.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-DDCZsPbl.js","assets/vennDiagram-BLWOH2XV-BsxG3xp6.js","assets/wardleyDiagram-YMQ3BMBF-527wfePr.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-D6SR4CWa.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
