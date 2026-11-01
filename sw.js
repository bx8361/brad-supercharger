const VERSION = 'b0fede696798124e'
const FILES = ["assets/CheatsheetTool-D-2bSu6L.js","assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-DOSJ_M9f.js","assets/abnfDiagram-YUKMZFIV-DRmW3dMC.js","assets/algebriteWorker-DICACpaY.js","assets/arc-BqzLYT0C.js","assets/architectureDiagram-47P4ROYG-CG1UWFW5.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-CRQ3bPEb.js","assets/c4Diagram-CRA5TL53-Cwnhgs1A.js","assets/channel-DWj85oP2.js","assets/chineseResources-DDw2FHsd.js","assets/chunk-2Q5K7J3B-CAnUKQr5.js","assets/chunk-5VM5RSS4-WfFg73WZ.js","assets/chunk-7TKQ45FW-C8KVZ5Cb.js","assets/chunk-AW2ZBBNX-DJeND8pB.js","assets/chunk-FVRAUYC3-CRuIm8xK.js","assets/chunk-HTAEGDNF-Cz3sZUhi.js","assets/chunk-JWPE2WC7-xSizlsgy.js","assets/chunk-KQW6MTUR-hasI_pBS.js","assets/chunk-XXDRQBXY-DZDmmI3b.js","assets/classDiagram-v2-K4WV4PDN-Dk0IRX7k.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-DBWYKZU8.js","assets/cynefin-EF2NZ3EQ-DVEV-YL0.js","assets/cynefinDiagram-3GCD6N5R-BiMA4wLa.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-CsRGUfFP.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-Dn3hNXLh.js","assets/diagram-OVF4WLC6-B-SFuTfB.js","assets/diagram-PFPMY2P6-Dnk31Sgi.js","assets/diagram-UMYRVEAY-CxVG1ymw.js","assets/diagram-YEKJPTXX-oGzWOMYq.js","assets/diagram-ZIFT7M5P-dl6L2eic.js","assets/ebnfDiagram-VR2GEFS7-XXejNc-w.js","assets/elk-IJKZMXRS-CRsKAKGf.js","assets/erDiagram-O2IAPWRE-B_U-T4Uc.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-CdFGMwwD.js","assets/ganttDiagram-R7TSEDQI-BgT-gqLD.js","assets/gitGraphDiagram-XJZIOB7I-VC7fd1jM.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-B4youOKX.js","assets/index-CEPbh63w.css","assets/infoDiagram-5W2HQ5XZ-Cpkx4tPL.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-CwkA5kRY.js","assets/journeyDiagram-COXZFDF6-DFHIX_vC.js","assets/kanban-definition-P3RFRI5V-DvANOtLl.js","assets/linear-DJAW9rD5.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-4_CH0QFU.js","assets/nerdamerWorker-yGX1kYwE.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-C2fG4RCC.js","assets/pieDiagram-CAPJLFHJ-CQ1vflHQ.js","assets/postcss-2VMvKpSM.js","assets/pythonWorker-DNQzqLRX.js","assets/quadrantDiagram-GDMTTRAM-Ca8LZXUv.js","assets/railroadDiagram-SM67HX2B-Cpfm7z9I.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-Bntm5Bzy.js","assets/sankeyDiagram-UM26HJRW-B6xOmtvc.js","assets/sequenceDiagram-ZO4K6R2Y-TZLaH38L.js","assets/sizeCapture-INFHLROL-_Z--1H-s.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-Cg-TyBvR.js","assets/swimlanes-N4OXWK64-BRbglmgB.js","assets/swimlanesDiagram-K3J5GTZL-BXCDbZ8R.js","assets/timeline-definition-YOQAKGHF-D_9AlAvs.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-CgVVNnk0.js","assets/vennDiagram-BLWOH2XV-DjbvohRo.js","assets/wardleyDiagram-YMQ3BMBF-B54ut8cq.js","assets/xmllint-CcuGSrO9.wasm","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-DfylCLGa.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest","sqlite/sqlite3-opfs-async-proxy.js","sqlite/sqlite3.mjs","sqlite/sqlite3.wasm"]
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
