const VERSION = 'd268a23d8f22dce5'
const FILES = ["assets/DataPlaygroundTool-5Zk-RyB8.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-C4hHtX1o.js","assets/arc-CpILa2S0.js","assets/architectureDiagram-47P4ROYG-Bh5RyTP-.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-CAN3LE-s.js","assets/c4Diagram-CRA5TL53-DsRhNSAi.js","assets/channel-Dp7d4vZK.js","assets/chunk-2Q5K7J3B-fmoZAN52.js","assets/chunk-5VM5RSS4-BmwDFZsv.js","assets/chunk-7TKQ45FW-COKJKTQt.js","assets/chunk-AW2ZBBNX-DxPaAfmc.js","assets/chunk-FVRAUYC3-pXZMYV4N.js","assets/chunk-HTAEGDNF-D5XfxTOm.js","assets/chunk-JWPE2WC7-Dykp-gQX.js","assets/chunk-KQW6MTUR-CNuK-Kau.js","assets/chunk-XXDRQBXY-CaUsIXAs.js","assets/classDiagram-v2-K4WV4PDN-Ae8ujyul.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-knM6_dZD.js","assets/cynefin-EF2NZ3EQ-Qj3T0_uM.js","assets/cynefinDiagram-3GCD6N5R-BVa2s4qC.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-BxxRmYg6.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-Bf9JwC_2.js","assets/diagram-OVF4WLC6-CQ07ZwuR.js","assets/diagram-PFPMY2P6-DIZ6oKeI.js","assets/diagram-UMYRVEAY-CIAxpmXv.js","assets/diagram-YEKJPTXX-CVpHwuvH.js","assets/diagram-ZIFT7M5P-DjMhObz1.js","assets/ebnfDiagram-VR2GEFS7-VKLt_-f7.js","assets/elk-IJKZMXRS-vmko4sox.js","assets/erDiagram-O2IAPWRE-B9NX4_tX.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-BnO4_IYO.js","assets/ganttDiagram-R7TSEDQI-C-ZYJJRU.js","assets/gitGraphDiagram-XJZIOB7I-CHpLFeeY.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-DEJ8jXjs.css","assets/index-ZvOIlBKJ.js","assets/infoDiagram-5W2HQ5XZ-Cy8a0z9q.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-BV-0po3M.js","assets/journeyDiagram-COXZFDF6-DWpWmg4r.js","assets/kanban-definition-P3RFRI5V-CoqoMM0F.js","assets/katex-Cp5iPVkt.js","assets/linear-DKJnDuDz.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-BRlp3sbC.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-8QF2uY6v.js","assets/pieDiagram-CAPJLFHJ-DGsGm9YN.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-BwMz6p5i.js","assets/quadrantDiagram-GDMTTRAM-CxFzwv5W.js","assets/railroadDiagram-SM67HX2B-BVnM4bzq.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-Cl69hAWR.js","assets/sankeyDiagram-UM26HJRW-CODwx8Dr.js","assets/sequenceDiagram-ZO4K6R2Y-DICqs2T1.js","assets/sizeCapture-INFHLROL-VG6hHbMj.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-TlcXmO4m.js","assets/swimlanes-N4OXWK64-DFT-6kCB.js","assets/swimlanesDiagram-K3J5GTZL-Du_pvqjU.js","assets/timeline-definition-YOQAKGHF-vbLlaQ9W.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-nfv3coAs.js","assets/vennDiagram-BLWOH2XV-cXi01ook.js","assets/wardleyDiagram-YMQ3BMBF-C__x3sCn.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-CDpoqLM8.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
