const VERSION = '97e6ad91a64bb882'
const FILES = ["assets/CheatsheetTool-BFNE30I7.js","assets/DataPlaygroundTool-BhAxnq8V.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-SovKnOVQ.js","assets/algebriteWorker-DICACpaY.js","assets/arc-DYqaKTGz.js","assets/architectureDiagram-47P4ROYG-BNpqdpH2.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-C12s_wuL.js","assets/c4Diagram-CRA5TL53-OSczDiOI.js","assets/channel-D7vXoco-.js","assets/chineseResources-DDw2FHsd.js","assets/chunk-2Q5K7J3B-B9ef9N5C.js","assets/chunk-5VM5RSS4-DPgTbYO5.js","assets/chunk-7TKQ45FW-BD9wusDC.js","assets/chunk-AW2ZBBNX-B5FN8MDC.js","assets/chunk-FVRAUYC3-CovYBhVN.js","assets/chunk-HTAEGDNF-DPym7xpm.js","assets/chunk-JWPE2WC7-CNGLBz44.js","assets/chunk-KQW6MTUR-DxRfyNYA.js","assets/chunk-XXDRQBXY-f9Zl80HT.js","assets/classDiagram-v2-K4WV4PDN--ow0vFlu.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-Dg6ad6VA.js","assets/cynefin-EF2NZ3EQ-Bbpg2Hmp.js","assets/cynefinDiagram-3GCD6N5R-B5dxUB5l.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-BgqZDh77.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-DpC9VKAE.js","assets/diagram-OVF4WLC6-BearGbx_.js","assets/diagram-PFPMY2P6-BQ0xOloq.js","assets/diagram-UMYRVEAY-DDNpV_YK.js","assets/diagram-YEKJPTXX-t4lVKl6C.js","assets/diagram-ZIFT7M5P-3fgCE9bZ.js","assets/ebnfDiagram-VR2GEFS7-CQ4xbCq1.js","assets/elk-IJKZMXRS-Df_eGkz2.js","assets/erDiagram-O2IAPWRE-DRKAFJNS.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-CsvHQsZl.js","assets/ganttDiagram-R7TSEDQI-o8Rx0wFX.js","assets/gitGraphDiagram-XJZIOB7I-lIJob-cY.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-DQOa2ZzH.js","assets/index-DgEso02R.css","assets/infoDiagram-5W2HQ5XZ-CjSx616E.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-DhpTBAAf.js","assets/journeyDiagram-COXZFDF6-C1vRuHV_.js","assets/kanban-definition-P3RFRI5V-D1qHtXnn.js","assets/linear-lKKzVPDI.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-DgCu0AWs.js","assets/nerdamerWorker-yGX1kYwE.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-BL_9fJV_.js","assets/pieDiagram-CAPJLFHJ-CWjI2mUr.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-C6xkICxu.js","assets/railroadDiagram-SM67HX2B-0FvYdSJs.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-8sYpFZlH.js","assets/sankeyDiagram-UM26HJRW-B-6PyWqZ.js","assets/sequenceDiagram-ZO4K6R2Y-BNUrG5xy.js","assets/sizeCapture-INFHLROL-BV_BwYK-.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-BXuBJGyg.js","assets/swimlanes-N4OXWK64-DEch4Udj.js","assets/swimlanesDiagram-K3J5GTZL-C4XesBCv.js","assets/timeline-definition-YOQAKGHF-zei_IN5z.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-0lPE965c.js","assets/vennDiagram-BLWOH2XV-BYHAsXko.js","assets/wardleyDiagram-YMQ3BMBF-CeUDhDEi.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-Id-okI_I.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
