const VERSION = '559f284c2845f3aa'
const FILES = ["assets/DataPlaygroundTool-D4U63WLV.css","assets/DataPlaygroundTool-DQjAH8dE.js","assets/abnfDiagram-YUKMZFIV-BmmOIDm-.js","assets/arc-DYq9wHwk.js","assets/architectureDiagram-47P4ROYG-DzCpevgk.js","assets/babel-Dw5Eu3O9.js","assets/blockDiagram-E7TT5TSB-ai0c2waH.js","assets/c4Diagram-CRA5TL53-D0erFMNS.js","assets/channel-J-W23VTL.js","assets/chunk-2Q5K7J3B-DxRBAIKQ.js","assets/chunk-5VM5RSS4-C-IkLH6E.js","assets/chunk-7TKQ45FW-GOW9oAao.js","assets/chunk-AW2ZBBNX-DReVeJzM.js","assets/chunk-FVRAUYC3-C-RUxW9H.js","assets/chunk-HTAEGDNF-8ZGhNBNZ.js","assets/chunk-JWPE2WC7-De1jzCcs.js","assets/chunk-KQW6MTUR-DyJceApW.js","assets/chunk-XXDRQBXY-Dxg6-CRM.js","assets/classDiagram-v2-K4WV4PDN-04KvtjrO.js","assets/common-C-y9RR26.js","assets/cose-bilkent-JH36ORCC-NSqNYFRC.js","assets/cynefin-EF2NZ3EQ-BT8dbzCz.js","assets/cynefinDiagram-3GCD6N5R-kr8x4gl2.js","assets/cytoscape.esm-Ix0LnXOy.js","assets/dagre-W4DXFKR2-D0cxCX27.js","assets/defaultLocale-DX6XiGOO.js","assets/diagram-2UJZ2QOL-DgPKclox.js","assets/diagram-OVF4WLC6-Bze7UDyp.js","assets/diagram-PFPMY2P6-qPFZD60A.js","assets/diagram-UMYRVEAY-B1oMvjdG.js","assets/diagram-YEKJPTXX-4xFZ8nLN.js","assets/diagram-ZIFT7M5P-DpNZBE1H.js","assets/ebnfDiagram-VR2GEFS7-CyfImSBT.js","assets/elk-IJKZMXRS-C0RV50EZ.js","assets/erDiagram-O2IAPWRE-BtjlSH0Y.js","assets/estree-DlGR-zBs.js","assets/flowDiagram-OXPTDLAJ-B8Uu1RZz.js","assets/ganttDiagram-R7TSEDQI-9K-Dr-wO.js","assets/gitGraphDiagram-XJZIOB7I-B_xt2CUQ.js","assets/graph-Bn3Yngep.js","assets/graphql-Houc-vhO.js","assets/html-Cdlyoy-I.js","assets/index-B2S_rucn.js","assets/index-W08_OglL.css","assets/infoDiagram-5W2HQ5XZ-CSUyX-Ny.js","assets/init-Gi6I4Gst.js","assets/ishikawaDiagram-K3B6WC7H-BDx2s5Nx.js","assets/journeyDiagram-COXZFDF6-DJgtkCLK.js","assets/kanban-definition-P3RFRI5V-DBC66_mE.js","assets/katex-Cp5iPVkt.js","assets/linear-2g4PlWq4.js","assets/markdown-Da4luf4E.js","assets/mindmap-definition-LZFPQGKD-BpxW3Rz5.js","assets/ordinal-Cboi1Yqb.js","assets/pegDiagram-BGZESJAR-B20FiEt3.js","assets/pieDiagram-CAPJLFHJ-CqR1wgRj.js","assets/postcss-2VMvKpSM.js","assets/quadrantDiagram-GDMTTRAM-rBUPqu4G.js","assets/railroadDiagram-SM67HX2B-NcOgzoM7.js","assets/regexWorker-pMZMrArR.js","assets/requirementDiagram-X7JNWC4A-B82xzKNx.js","assets/sankeyDiagram-UM26HJRW-8r7Vi0MO.js","assets/sequenceDiagram-ZO4K6R2Y-Bz73fhVV.js","assets/sizeCapture-INFHLROL-fkNpjQwd.js","assets/standalone-fOeV0Vsa.js","assets/stateDiagram-v2-TBUQTH76-CPtRGeh9.js","assets/swimlanes-N4OXWK64-QGPc_Ziu.js","assets/swimlanesDiagram-K3J5GTZL-DObO2QPm.js","assets/timeline-definition-YOQAKGHF-BsE-Mwl-.js","assets/typescript-CpwMS6-X.js","assets/usecaseDiagram-VIAY4XPW-Ce5iZNQd.js","assets/vennDiagram-BLWOH2XV-CKSo9GTw.js","assets/wardleyDiagram-YMQ3BMBF-Bas3BXOr.js","assets/xmllint-browser-B74SeJE4.js","assets/xychartDiagram-TAQBALBS-CqLVjobJ.js","assets/yaml-CwaMJBxz.js","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"]
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
