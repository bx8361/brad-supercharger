const VERSION = '5db4e8ee7686ed44'
const FILES = ["assets/DataPlaygroundTool-CObFeZbA.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/abnfDiagram-YUKMZFIV-5mhy6Jgt.js","assets/arc-BDvA9-fL.js","assets/architectureDiagram-47P4ROYG-BJxn_pNw.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-C1kHkJAx.js","assets/c4Diagram-CRA5TL53-DZ_jvkPt.js","assets/channel-Cl7HqUEX.js","assets/chineseResources-DDw2FHsd.js","assets/chunk-2Q5K7J3B-Bp8ZQgVB.js","assets/chunk-5VM5RSS4-B_1ZPLfL.js","assets/chunk-7TKQ45FW-sytrx0uj.js","assets/chunk-AW2ZBBNX-CoZ_XdN7.js","assets/chunk-FVRAUYC3-C5ntuZ-C.js","assets/chunk-HTAEGDNF-B_LPopIr.js","assets/chunk-JWPE2WC7-Be2-X50x.js","assets/chunk-KQW6MTUR-DmBqwId2.js","assets/chunk-XXDRQBXY-BeytvBMc.js","assets/classDiagram-v2-K4WV4PDN-CpjMXeTr.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-BKNPCA4P.js","assets/cynefin-EF2NZ3EQ-Ds-bqFky.js","assets/cynefinDiagram-3GCD6N5R-BAUzGQRR.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-Cb0omlR2.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-BcWO8ZpG.js","assets/diagram-OVF4WLC6-CyhSGjI4.js","assets/diagram-PFPMY2P6-D3nmqsO9.js","assets/diagram-UMYRVEAY-o7DKSxIO.js","assets/diagram-YEKJPTXX-Bo8WhgGR.js","assets/diagram-ZIFT7M5P-J_ujAYwU.js","assets/ebnfDiagram-VR2GEFS7-C49DO-vN.js","assets/elk-IJKZMXRS-E14fMVYJ.js","assets/erDiagram-O2IAPWRE-DGj30fjE.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-Di7i1j-u.js","assets/ganttDiagram-R7TSEDQI-BrCotsEu.js","assets/gitGraphDiagram-XJZIOB7I-3lWRiKK6.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-DEJ8jXjs.css","assets/index-DfPxQk5e.js","assets/infoDiagram-5W2HQ5XZ-C3b3LI-t.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-Bt4CZF-e.js","assets/journeyDiagram-COXZFDF6-CfpdjXge.js","assets/kanban-definition-P3RFRI5V-DbLDxUpi.js","assets/katex-Cp5iPVkt.js","assets/linear-D9lggnn7.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-DuodALdi.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-DT0gtIuO.js","assets/pieDiagram-CAPJLFHJ-CS5J35J8.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-BojfejLy.js","assets/railroadDiagram-SM67HX2B-eFzBJj_D.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-D0MhvJzB.js","assets/sankeyDiagram-UM26HJRW-Be6kZmjD.js","assets/sequenceDiagram-ZO4K6R2Y-Dyiqe6zQ.js","assets/sizeCapture-INFHLROL-Ba5Bnvbr.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-DyWnrfK6.js","assets/swimlanes-N4OXWK64-DaHgm8C_.js","assets/swimlanesDiagram-K3J5GTZL-DmeOC-R1.js","assets/timeline-definition-YOQAKGHF-D8FpLgbb.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-Co1snJBM.js","assets/vennDiagram-BLWOH2XV-DOsCHoLO.js","assets/wardleyDiagram-YMQ3BMBF-CXLUVXkm.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-Ck9HEpHF.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
