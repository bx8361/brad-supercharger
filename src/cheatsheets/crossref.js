// "See …" links between PyTorch and Keras 3 / TensorFlow entries.
// Forward links are listed here; the reverse link is added to the target automatically.
// `row` is the exact first cell of a table row to scroll to and highlight in the target.
import { PT, KR } from './frameworks.js'

const MAP = 'keras-pytorch-map'
const map = row => ({ id: MAP, row })

const forward = {
  'tensor-basics': ['tf-tensors', 'keras-merge'],
  'nn-module': ['tf-custom-layer', 'keras-model', map('`nn.Sequential(...)`')],
  autograd: ['tf-gradient-tape', map('`torch.no_grad()`')],
  linear: ['keras-dense'],
  'pt-utility-layers': ['keras-dense'],
  conv2d: ['keras-conv'],
  'conv-transpose': [{ id: 'keras-conv', row: '`layers.Conv2DTranspose(filters, k, strides)`' }],
  pooling: ['keras-pooling'],
  normalization: ['keras-normalization'],
  dropout: ['keras-dropout'],
  embedding: ['keras-embedding'],
  rnn: ['keras-rnn'],
  attention: ['keras-attention'],
  'transformer-encoder': ['keras-attention'],
  'transformer-full': ['keras-attention'],
  'cross-entropy': ['keras-losses'],
  bce: ['keras-losses'],
  'regression-losses': ['keras-losses'],
  'custom-losses': ['keras-losses'],
  optimizers: ['keras-optimizers'],
  schedulers: ['keras-schedules'],
  init: ['keras-init-reg'],
  dataloader: ['tf-data', 'keras-data-utils', map('`torch.utils.data.DataLoader`')],
  'image-transforms': ['keras-preprocessing'],
  'collate-padding': ['keras-data-utils'],
  samplers: ['keras-compile-fit'],
  'training-loop': ['keras-compile-fit', 'tf-gradient-tape', map('`model.train()` / `model.eval()`'), map('`loss.backward(); opt.step()`')],
  'early-stopping': ['keras-callbacks'],
  'mixed-precision': ['tf-distribute', 'tf-function'],
  'transfer-learning': ['tf-transfer'],
  reproducibility: ['tf-debug-perf'],
  'metrics-logging': ['keras-metrics', 'tf-debug-perf'],
  'multi-gpu': ['tf-distribute'],
  'pt-save-load': ['keras-save', 'tf-export'],
  'pt-pretrained': ['tf-transfer'],
  autoencoder: ['keras-model'],
}
const normalize = link => typeof link === 'string' ? { id: link } : link

export function addCrossRefs(entries) {
  const byId = new Map(entries.map(entry => [entry.id, entry]))
  const inbound = new Map()
  for (const [id, links] of Object.entries(forward)) {
    const source = byId.get(id)
    if (!source) throw new Error(`crossref: unknown entry ${id}`)
    source.see = links.map(normalize).map(link => {
      const target = byId.get(link.id)
      if (!target) throw new Error(`crossref: unknown target ${link.id}`)
      if (link.id !== MAP) inbound.set(link.id, [...(inbound.get(link.id) || []), source])
      return { ...link, to: link.id === MAP ? 'map' : KR }
    })
  }
  for (const [id, sources] of inbound) {
    const target = byId.get(id)
    target.see = [...(target.see || []), ...sources.map(source => ({ id: source.id, to: PT, name: sources.length > 1 ? source.name : '' }))]
  }
  return entries
}
