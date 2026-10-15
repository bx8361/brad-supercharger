const VERSION = '21288663e028328a'
const FILES = ["assets/DataPlaygroundTool-BDgj7Apk.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-7u0Fs9Sz.js","assets/arc-phIo059l.js","assets/architectureDiagram-47P4ROYG-C6SBC_G0.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-OiR_8w3u.js","assets/c4Diagram-CRA5TL53-CjcQ0NSW.js","assets/channel-CRR6_plB.js","assets/chunk-2Q5K7J3B-DJWHLBMk.js","assets/chunk-5VM5RSS4-srLwBt5f.js","assets/chunk-7TKQ45FW-DQorR2Fv.js","assets/chunk-AW2ZBBNX-T1fwjn9T.js","assets/chunk-FVRAUYC3-BbUvH_S4.js","assets/chunk-HTAEGDNF-CDWkD8mJ.js","assets/chunk-JWPE2WC7-BJEu2B7M.js","assets/chunk-KQW6MTUR-WzOLEGDX.js","assets/chunk-XXDRQBXY--aVbhVyq.js","assets/classDiagram-v2-K4WV4PDN-qJ1uaA1C.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-DLCpz1LA.js","assets/cynefin-EF2NZ3EQ-CN0h1Fsk.js","assets/cynefinDiagram-3GCD6N5R-Cc49Qz38.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-BVdGZ2Wq.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-B1IM8tGo.js","assets/diagram-OVF4WLC6-CvWXOMw9.js","assets/diagram-PFPMY2P6-BC96QBgU.js","assets/diagram-UMYRVEAY-DUzPzZZa.js","assets/diagram-YEKJPTXX-Q28rp1Ca.js","assets/diagram-ZIFT7M5P-Cv8AsY8t.js","assets/ebnfDiagram-VR2GEFS7-OCCbg6-5.js","assets/elk-IJKZMXRS-DL__jMg5.js","assets/erDiagram-O2IAPWRE-CiuWWtg-.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-D6Z5XJRT.js","assets/ganttDiagram-R7TSEDQI-lz7MrFmj.js","assets/gitGraphDiagram-XJZIOB7I-C-5usTfb.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-B77K5ZIh.css","assets/index-CCmBOzKi.js","assets/infoDiagram-5W2HQ5XZ-CBEATrSr.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-h0C-lOIE.js","assets/journeyDiagram-COXZFDF6-YCPTJr1b.js","assets/kanban-definition-P3RFRI5V-B2R8Q4Mk.js","assets/katex-Cp5iPVkt.js","assets/linear-oXEqXweJ.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-vIUbOWup.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-DA2KtT-y.js","assets/pieDiagram-CAPJLFHJ-BXTN9e2I.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-BwMz6p5i.js","assets/quadrantDiagram-GDMTTRAM-qqkn-T3d.js","assets/railroadDiagram-SM67HX2B-BWsM58YP.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-zX-Aho5l.js","assets/sankeyDiagram-UM26HJRW-CZTrwoS5.js","assets/sequenceDiagram-ZO4K6R2Y-CK9JaaR3.js","assets/sizeCapture-INFHLROL-Jidf7kI3.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-CJM_JxfD.js","assets/swimlanes-N4OXWK64-Dp6Q6zDf.js","assets/swimlanesDiagram-K3J5GTZL-C-ib09e8.js","assets/timeline-definition-YOQAKGHF-CRA46NUd.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-F_6nKlBd.js","assets/vennDiagram-BLWOH2XV-D6Emrz9B.js","assets/wardleyDiagram-YMQ3BMBF-BICsvFJx.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-BOlhzJEJ.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
