// Defaults follow PyTorch 2.x, Keras 3 and TensorFlow 2.16+.
import { nnWorkflows } from './workflows.js'
import { kerasEntries } from './keras.js'
import { PT, KR, HF } from './frameworks.js'
import { addCrossRefs } from './crossref.js'


const nnEntries = [
  // Start here
  {
    id: 'nn-architecture-map', name: 'Choosing an architecture', section: 'Start here', lib: [PT, KR],
    summary: 'Match the network family to the data shape.',
    keywords: 'which model mlp cnn rnn lstm transformer pick',
    tables: [{
      title: 'Data → architecture',
      head: ['Data', 'Input shape', 'Start with', 'Then try'],
      rows: [
        ['Tabular', '(N, features)', 'MLP: Linear → ReLU → Dropout', 'Boosted trees usually win; try embeddings for categoricals.'],
        ['Images', '(N, C, H, W)', 'Pretrained ResNet / EfficientNet (fine-tune)', 'ConvNeXt, ViT for large data.'],
        ['Sequences / time series', '(N, L, features)', 'GRU / LSTM or 1D CNN', 'Transformer encoder, temporal conv nets.'],
        ['Text', '(N, L) token ids', 'Pretrained transformer (Hugging Face)', 'Embedding + LSTM for small, simple tasks.'],
        ['Sets / graphs', 'varies', 'DeepSets / GNN (PyG, DGL)', ''],
        ['Generation', 'varies', 'VAE / diffusion / autoregressive transformer', ''],
      ],
    }],
  },
  {
    id: 'tensor-basics', name: 'Tensor basics', section: 'PyTorch · Basics', lib: PT,
    import: 'import torch',
    summary: 'Create, reshape, and move tensors.',
    keywords: 'tensor reshape view permute squeeze unsqueeze cat stack device dtype shape',
    tables: [{
      title: 'Shape operations',
      head: ['Operation', 'Example', 'Notes'],
      rows: [
        ['reshape / view', '`x.view(N, -1)`, `x.reshape(N, -1)`', '`view` needs contiguous memory; `reshape` copies when needed.'],
        ['flatten', '`x.flatten(1)`', 'Keep batch dim, flatten the rest.'],
        ['permute', '`x.permute(0, 2, 3, 1)`', 'NCHW → NHWC. Follow with `.contiguous()` before `view`.'],
        ['transpose', '`x.transpose(1, 2)`', 'Swap two dims: (N, L, C) ↔ (N, C, L) for Conv1d.'],
        ['unsqueeze / squeeze', '`x.unsqueeze(0)`, `x.squeeze(-1)`', 'Add / remove size-1 dims.'],
        ['cat / stack', '`torch.cat([a, b], dim=1)`, `torch.stack(xs)`', '`cat` joins along an existing dim; `stack` adds a new one.'],
        ['expand / repeat', '`x.expand(N, -1)`, `x.repeat(2, 1)`', '`expand` does not copy memory.'],
        ['einsum', "`torch.einsum('bij,bjk->bik', a, b)`", 'Readable batched products.'],
        ['device / dtype', "`x.to(device)`, `x.float()`, `x.half()`", 'Model and data must be on the same device.'],
        ['to NumPy', '`x.detach().cpu().numpy()`', ''],
      ],
    }],
    snippets: [{
      title: 'Create tensors',
      code: `import torch
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
x = torch.randn(32, 10, device=device)          # normal
z = torch.zeros(3, 4); o = torch.ones_like(z)
r = torch.arange(0, 10, 2); l = torch.linspace(0, 1, 5)
t = torch.tensor(np_array, dtype=torch.float32)  # copies
t2 = torch.from_numpy(np_array)                  # shares memory
x.shape, x.dtype, x.device`,
    }],
  },
  {
    id: 'conv-shape', name: 'Output shape formulas', section: 'Start here', lib: PT,
    summary: 'Compute spatial sizes after convolution and pooling.',
    keywords: 'conv output size formula padding stride kernel dilation shape calculation same',
    tables: [{
      title: 'Formulas (per spatial dim)',
      head: ['Layer', 'Output size', 'Notes'],
      rows: [
        ['Conv / Pool', '⌊(H + 2·padding − dilation·(kernel − 1) − 1) / stride⌋ + 1', 'Pool stride defaults to kernel_size.'],
        ['ConvTranspose', '(H − 1)·stride − 2·padding + dilation·(kernel − 1) + output_padding + 1', ''],
        ["Keep size (stride 1)", 'padding = dilation·(kernel − 1) / 2', "Or `padding='same'` (stride 1 only)."],
        ['Halve size', 'kernel=3, stride=2, padding=1', 'Or MaxPool2d(2).'],
        ['Linear after conv', 'in_features = C · H_out · W_out', 'Or `nn.LazyLinear(out)` / `AdaptiveAvgPool2d(1)` to avoid computing it.'],
        ['Params of Conv2d', 'C_out · (C_in/groups · k_h · k_w) + C_out', 'Last term is the bias.'],
      ],
    }],
    snippets: [{ title: 'Find the shape empirically', code: 'with torch.no_grad():\n    print(features(torch.zeros(1, 3, 224, 224)).shape)\n\n# or print every layer\nfrom torchinfo import summary  # pip install torchinfo\nsummary(model, input_size=(1, 3, 224, 224))' }],
  },
  {
    id: 'nn-module', name: 'nn.Module & containers', section: 'PyTorch · Basics', lib: PT, import: 'import torch\nimport torch.nn as nn',
    summary: 'Every model is an `nn.Module`: define layers in `__init__`, the computation in `forward`.',
    keywords: 'module sequential modulelist moduledict forward custom model residual parameters count train eval device',
    tables: [{
      title: 'Containers and module methods',
      head: ['API', 'Use', 'Notes'],
      rows: [
        ['`nn.Sequential(*layers)`', 'Plain stacks', 'Index or slice: `model[:-1]`.'],
        ['`nn.ModuleList([...])`', 'Lists of layers used in a loop', 'A plain Python list hides parameters from the optimizer and `.to(device)`.'],
        ['`nn.ModuleDict({...})`', 'Named branches / heads', ''],
        ['`nn.Identity()`', 'Placeholder or removed head', '`model.fc = nn.Identity()` to get features.'],
        ['`register_buffer(name, t)`', 'Non-trainable state (masks, running stats)', 'Moves with `.to()` and is saved in `state_dict`.'],
        ['`model.train()` / `model.eval()`', 'Switch dropout and BatchNorm behavior', ''],
        ['`model.to(device)`', 'Move parameters and buffers', 'Move inputs too: `xb.to(device)`.'],
        ['`model.parameters()` / `named_parameters()`', 'Iterate weights', 'Freeze with `p.requires_grad_(False)`.'],
        ['`model.state_dict()` / `load_state_dict()`', 'Save and load weights', '`strict=False` to load partial weights.'],
        ['`model.apply(fn)`', 'Apply a function to every submodule', 'Custom weight initialization.'],
      ],
    }],
    snippets: [{
      title: 'Custom module with a residual block',
      code: `class ResidualBlock(nn.Module):
    def __init__(self, dim, p=0.1):
        super().__init__()
        self.net = nn.Sequential(nn.LayerNorm(dim), nn.Linear(dim, dim * 4), nn.GELU(),
                                 nn.Dropout(p), nn.Linear(dim * 4, dim))

    def forward(self, x):
        return x + self.net(x)

class Net(nn.Module):
    def __init__(self, in_dim, dim=128, depth=3, n_out=10):
        super().__init__()
        self.inp = nn.Linear(in_dim, dim)
        self.blocks = nn.ModuleList(ResidualBlock(dim) for _ in range(depth))
        self.head = nn.Linear(dim, n_out)

    def forward(self, x):
        x = self.inp(x)
        for block in self.blocks:
            x = block(x)
        return self.head(x)

model = Net(20)
print(sum(p.numel() for p in model.parameters() if p.requires_grad), "trainable params")`,
    }],
  },

  ...nnWorkflows,

  // Layers
  {
    id: 'autograd', name: 'Autograd & gradients', section: 'PyTorch · Basics', lib: PT, import: 'import torch',
    summary: 'Tensors with `requires_grad=True` record operations; `backward()` fills `.grad`. TensorFlow: `tf.GradientTape`.',
    keywords: 'autograd backward grad no_grad inference_mode detach requires_grad zero_grad retain_graph clip gradient accumulation',
    tables: [{
      title: 'Calls',
      head: ['Call', 'Effect', 'Use for'],
      rows: [
        ['`loss.backward()`', 'Accumulates gradients in `.grad`', 'After each forward pass; needs a scalar (or pass `gradient=`).'],
        ['`optimizer.zero_grad(set_to_none=True)`', 'Clears gradients', 'Before every `backward()`; skipping it accumulates.'],
        ['`with torch.no_grad():`', 'Disables graph building', 'Validation / inference; use `torch.inference_mode()` for extra speed.'],
        ['`x.detach()`', 'Cuts a tensor from the graph', 'Targets, logging, stop-gradient.'],
        ['`x.requires_grad_(False)`', 'Freeze a tensor', '`for p in m.parameters(): p.requires_grad = False` freezes a module.'],
        ['`torch.autograd.grad(y, x)`', 'Gradient without `.grad`', 'Gradient penalties, higher-order derivatives (`create_graph=True`).'],
        ['`loss.backward(retain_graph=True)`', 'Keep the graph', 'Several backward passes over one forward pass.'],
        ['`torch.nn.utils.clip_grad_norm_(params, 1.0)`', 'Rescale gradients', 'After `backward()`, before `step()`.'],
        ['`(loss / accum_steps).backward()`', 'Gradient accumulation', 'Step every `accum_steps` batches.'],
        ['`torch.autograd.set_detect_anomaly(True)`', 'Find NaN source', 'Debugging only; slow.'],
      ],
    }],
  },
  {
    id: 'pt-utility-layers', name: 'Utility layers (Flatten, Identity, Padding, Upsample)', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Shape and plumbing layers. Keras: `Flatten`, `Reshape`, `ZeroPadding2D`, `UpSampling2D`.',
    keywords: 'flatten unflatten identity padding zeropad2d reflectionpad2d upsample pixelshuffle cosinesimilarity pairwise distance',
    params: [
      ['nn.Flatten(start_dim, end_dim)', '1, -1', 'ints', 'Keeps the batch axis.'],
      ['nn.Unflatten(dim, unflattened_size)', 'required', '', 'Inverse of Flatten.'],
      ['nn.Identity()', '—', '', 'Placeholder, e.g. replace a classifier head.'],
      ['nn.ZeroPad2d / ReflectionPad2d / ReplicationPad2d(padding)', 'required', 'int | 4-tuple', 'Explicit padding.'],
      ['nn.Upsample(scale_factor, mode)', "mode='nearest'", "'nearest' | 'bilinear' | 'bicubic'", "'bilinear' needs align_corners=False."],
      ['nn.PixelShuffle(upscale_factor)', 'required', 'int', 'Sub-pixel super-resolution.'],
      ['nn.CosineSimilarity(dim, eps)', 'dim=1, eps=1e-8', '', 'Similarity between vectors.'],
      ['nn.PairwiseDistance(p, eps)', 'p=2.0, eps=1e-6', '', 'Distances for metric learning.'],
      ['nn.Softmax(dim) / nn.LogSoftmax(dim)', 'dim must be given', '', 'Inference only; losses take logits.'],
    ],
  },
  {
    id: 'pt-save-load', name: 'Saving, loading & exporting', section: 'PyTorch · Training', lib: PT, import: 'import torch',
    summary: 'Save the `state_dict`; export ONNX or TorchScript for deployment. Keras: `.keras`, `save_weights`.',
    keywords: 'save load state_dict checkpoint torch.save torch.load weights_only onnx torchscript jit trace map_location export',
    tables: [{
      title: 'Options',
      head: ['Goal', 'Code', 'Note'],
      rows: [
        ['Weights only (recommended)', '`torch.save(model.state_dict(), "w.pt")`', 'Rebuild the model class, then `load_state_dict`.'],
        ['Load', "`model.load_state_dict(torch.load('w.pt', map_location='cpu', weights_only=True))`", '`weights_only=True` is safer and the default in PyTorch ≥ 2.6.'],
        ['Resume training', '`{"model": m.state_dict(), "opt": o.state_dict(), "sched": s.state_dict(), "epoch": e}`', 'Save optimizer and scheduler too.'],
        ['Partial load', '`model.load_state_dict(sd, strict=False)`', 'Returns missing / unexpected keys; check them.'],
        ['ONNX', '`torch.onnx.export(model.eval(), example, "m.onnx", input_names=["x"], dynamic_axes={"x": {0: "batch"}})`', 'Then run with ONNX Runtime.'],
        ['TorchScript', '`torch.jit.trace(model.eval(), example)` / `torch.jit.script(model)`', 'Trace for static graphs, script for control flow.'],
        ['Whole model pickle', '`torch.save(model, "m.pt")`', 'Fragile; avoid.'],
        ['Compiled model', '`model._orig_mod.state_dict()`', 'Keys have an `_orig_mod.` prefix when `torch.compile` is used.'],
      ],
    }],
  },
  {
    id: 'pt-pretrained', name: 'Pretrained models (torchvision / timm)', section: 'PyTorch · Training', lib: PT, import: 'import torchvision',
    summary: 'Load ImageNet weights and replace the head. Keras: `keras.applications`.',
    keywords: 'torchvision models resnet efficientnet vit mobilenet weights timm pretrained head replace fc classifier',
    tables: [{
      title: 'Heads to replace',
      head: ['Model', 'Load', 'Replace'],
      rows: [
        ['ResNet', '`models.resnet50(weights="IMAGENET1K_V2")`', '`m.fc = nn.Linear(m.fc.in_features, n)`'],
        ['EfficientNet / MobileNetV3', '`models.efficientnet_b0(weights="DEFAULT")`', '`m.classifier[-1] = nn.Linear(m.classifier[-1].in_features, n)`'],
        ['ViT', '`models.vit_b_16(weights="DEFAULT")`', '`m.heads.head = nn.Linear(768, n)`'],
        ['ConvNeXt', '`models.convnext_tiny(weights="DEFAULT")`', '`m.classifier[-1] = nn.Linear(768, n)`'],
        ['timm', '`timm.create_model("resnet50", pretrained=True, num_classes=n)`', 'Head replaced for you.'],
      ],
    }],
    tips: ['Use the weights'+"'"+' own transforms: `weights.transforms()`.'],
  },
  {
    id: 'linear', name: 'nn.Linear', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Fully connected layer: y = x Wᵀ + b. Applies to the last dimension. Keras: `layers.Dense(units)`.',
    keywords: 'dense fully connected fc mlp',
    params: [
      ['in_features', '—', 'int', 'Size of the last input dim.'],
      ['out_features', '—', 'int', ''],
      ['bias', 'True', 'bool', 'False when followed by BatchNorm.'],
    ],
    snippets: [{ title: 'MLP block', code: 'mlp = nn.Sequential(\n    nn.Linear(in_dim, 256), nn.ReLU(), nn.Dropout(0.2),\n    nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.2),\n    nn.Linear(128, n_classes),   # logits, no softmax\n)' }],
  },
  {
    id: 'conv2d', name: 'nn.Conv2d / Conv1d / Conv3d', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Learnable sliding filters. Input (N, C_in, H, W) for 2D, (N, C_in, L) for 1D. Keras: `layers.Conv2D(filters, kernel_size)` (channels last).',
    keywords: 'convolution cnn kernel filter stride padding',
    params: [
      ['in_channels', '—', 'int', '3 for RGB, 1 for grayscale.'],
      ['out_channels', '—', 'int', 'Number of filters. Often doubles as resolution halves (32 → 64 → 128).'],
      ['kernel_size', '—', 'int | tuple', '3 is standard; 7 or 5 for a first layer; 1 for channel mixing.'],
      ['stride', '1', 'int | tuple', '2 to downsample instead of pooling.'],
      ['padding', '0', "int | tuple | 'valid' | 'same'", "`kernel_size // 2` (or `'same'`) keeps size."],
      ['dilation', '1', 'int | tuple', '> 1 enlarges receptive field without more params.'],
      ['groups', '1', 'int', '`groups=in_channels` = depthwise conv (MobileNet).'],
      ['bias', 'True', 'bool', 'False when followed by BatchNorm.'],
      ['padding_mode', "'zeros'", "'zeros' | 'reflect' | 'replicate' | 'circular'", ''],
    ],
    snippets: [{ title: 'Conv block', code: 'def conv_block(c_in, c_out):\n    return nn.Sequential(\n        nn.Conv2d(c_in, c_out, 3, padding=1, bias=False),\n        nn.BatchNorm2d(c_out),\n        nn.ReLU(inplace=True),\n        nn.MaxPool2d(2),\n    )' }],
  },
  {
    id: 'conv-transpose', name: 'nn.ConvTranspose2d / Upsample', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Upsampling for decoders, U-Nets, and GANs.',
    use: '`Upsample` + `Conv2d` avoids checkerboard artifacts that ConvTranspose can create.',
    keywords: 'deconvolution upsample decoder unet',
    params: [
      ['in_channels / out_channels', '—', 'int', ''],
      ['kernel_size', '—', 'int', '`kernel_size=2, stride=2` doubles size cleanly.'],
      ['stride', '1', 'int', ''],
      ['padding', '0', 'int', ''],
      ['output_padding', '0', 'int', 'Fix off-by-one output sizes.'],
      ['scale_factor (Upsample)', 'None', 'float', 'e.g. 2.'],
      ['mode (Upsample)', "'nearest'", "'nearest' | 'bilinear' | 'bicubic' | 'trilinear'", ''],
      ['align_corners (Upsample)', 'None', 'bool', 'Usually False with bilinear.'],
    ],
  },
  {
    id: 'pooling', name: 'Pooling layers', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Downsample feature maps. Keras: `MaxPooling2D`, `GlobalAveragePooling2D`.',
    keywords: 'maxpool avgpool adaptive global pooling downsample',
    params: [
      ['kernel_size (Max/AvgPool2d)', '—', 'int | tuple', '2 halves H and W.'],
      ['stride', 'None (= kernel_size)', 'int | tuple', ''],
      ['padding', '0', 'int', ''],
      ['ceil_mode', 'False', 'bool', 'Round output size up.'],
      ['output_size (AdaptiveAvgPool2d)', '—', 'int | tuple', '`1` = global average pooling; works for any input size.'],
      ['count_include_pad (AvgPool2d)', 'True', 'bool', ''],
    ],
  },
  {
    id: 'normalization', name: 'BatchNorm / LayerNorm / GroupNorm', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Normalize activations to stabilize and speed up training.',
    use: 'BatchNorm for CNNs with batch ≥ 16; LayerNorm for transformers and RNNs; GroupNorm for CNNs with small batches.',
    keywords: 'batchnorm layernorm groupnorm rmsnorm normalization bn ln',
    params: [
      ['num_features (BatchNorm)', '—', 'int', 'Channels C (BatchNorm2d) or features (BatchNorm1d).'],
      ['eps', '1e-5', 'float', ''],
      ['momentum (BatchNorm)', '0.1', 'float | None', 'Running-stat update rate. Keras uses momentum=0.99 with the opposite meaning.'],
      ['affine / elementwise_affine', 'True', 'bool', 'Learnable scale and shift.'],
      ['track_running_stats (BatchNorm)', 'True', 'bool', ''],
      ['normalized_shape (LayerNorm)', '—', 'int | tuple', 'Trailing dims to normalize, usually `d_model`.'],
      ['bias (LayerNorm)', 'True', 'bool', ''],
      ['num_groups / num_channels (GroupNorm)', '—', 'int', '32 groups is common.'],
    ],
    tips: ['BatchNorm behaves differently in train and eval mode: call `model.eval()` before validation.', 'Use `nn.RMSNorm(d)` (PyTorch ≥ 2.4) for LLaMA-style blocks.'],
  },
  {
    id: 'dropout', name: 'nn.Dropout', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Randomly zero activations during training. Disabled by `model.eval()`.',
    keywords: 'regularization dropout overfitting',
    params: [
      ['p', '0.5', '0–1', '0.1–0.3 for conv/transformers, 0.3–0.5 for dense layers.'],
      ['inplace', 'False', 'bool', ''],
    ],
    tips: ['`nn.Dropout2d` drops whole channels for conv feature maps.'],
  },
  {
    id: 'embedding', name: 'nn.Embedding', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Lookup table from integer ids to dense vectors. Keras: `layers.Embedding(input_dim, output_dim)`.',
    use: 'Tokens, categorical features, user/item ids.',
    keywords: 'embedding lookup token vocab categorical',
    params: [
      ['num_embeddings', '—', 'int', 'Vocabulary size (max id + 1).'],
      ['embedding_dim', '—', 'int', 'Rule of thumb for categoricals: min(50, (cardinality + 1) // 2).'],
      ['padding_idx', 'None', 'int', 'This id stays a zero vector and gets no gradient.'],
      ['max_norm', 'None', 'float', 'Renormalize vectors above this norm.'],
      ['sparse', 'False', 'bool', 'Sparse gradients for huge vocabularies (use SparseAdam).'],
    ],
  },
  {
    id: 'rnn', name: 'nn.LSTM / nn.GRU / nn.RNN', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Recurrent layers. Return `(output, h_n)` (GRU/RNN) or `(output, (h_n, c_n))` (LSTM). Keras: `layers.LSTM(units, return_sequences=...)`.',
    keywords: 'recurrent lstm gru rnn sequence time series hidden',
    params: [
      ['input_size', '—', 'int', 'Features per time step.'],
      ['hidden_size', '—', 'int', '64–512.'],
      ['num_layers', '1', 'int', '2–3 stacked layers.'],
      ['batch_first', 'False', 'bool', 'Set True to use (N, L, H_in). Default is (L, N, H_in)!'],
      ['dropout', '0.0', '0–1', 'Between stacked layers only (needs num_layers > 1).'],
      ['bidirectional', 'False', 'bool', 'Doubles output features. Not for forecasting/causal tasks.'],
      ['bias', 'True', 'bool', ''],
      ['proj_size (LSTM)', '0', 'int', 'Project hidden state to a smaller size.'],
      ['nonlinearity (RNN)', "'tanh'", "'tanh' | 'relu'", ''],
    ],
    snippets: [{
      title: 'Sequence classifier',
      code: `class SeqClassifier(nn.Module):
    def __init__(self, n_features, hidden, n_classes):
        super().__init__()
        self.lstm = nn.LSTM(n_features, hidden, num_layers=2, batch_first=True, dropout=0.2)
        self.head = nn.Linear(hidden, n_classes)

    def forward(self, x):            # x: (N, L, n_features)
        out, (h, c) = self.lstm(x)   # out: (N, L, hidden)
        return self.head(out[:, -1]) # last time step

# Variable lengths: nn.utils.rnn.pack_padded_sequence(x, lengths, batch_first=True, enforce_sorted=False)`,
    }],
  },
  {
    id: 'attention', name: 'nn.MultiheadAttention / scaled_dot_product_attention', section: 'PyTorch · Layers', lib: PT,
    import: 'import torch.nn as nn\nimport torch.nn.functional as F',
    summary: 'Attention(Q, K, V) = softmax(QKᵀ / √d) V. Keras: `layers.MultiHeadAttention(num_heads, key_dim)`.',
    keywords: 'attention transformer self-attention heads mask causal sdpa flash',
    params: [
      ['embed_dim', '—', 'int', 'Must be divisible by num_heads.'],
      ['num_heads', '—', 'int', '4–16; head dim of 64 is typical.'],
      ['dropout', '0.0', '0–1', 'On attention weights.'],
      ['batch_first', 'False', 'bool', 'Set True for (N, L, E).'],
      ['kdim / vdim', 'None (= embed_dim)', 'int', 'For cross-attention with different key/value sizes.'],
      ['key_padding_mask (forward)', 'None', 'bool (N, S)', 'True marks padding positions to ignore.'],
      ['attn_mask (forward)', 'None', 'bool or float (L, S)', 'True = not allowed to attend.'],
      ['is_causal (SDPA / forward)', 'False', 'bool', 'Autoregressive mask without building it yourself.'],
      ['need_weights (forward)', 'True', 'bool', 'Set False for the fast path.'],
    ],
    snippets: [{ title: 'Fused attention (Flash / memory-efficient kernels)', code: '# q, k, v: (N, heads, L, head_dim)\nout = F.scaled_dot_product_attention(q, k, v, attn_mask=None, dropout_p=0.0, is_causal=True)' }],
  },
  {
    id: 'transformer-encoder', name: 'nn.TransformerEncoderLayer', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Self-attention + feed-forward block with residuals and LayerNorm.',
    keywords: 'transformer encoder bert self attention block',
    params: [
      ['d_model', '—', 'int', 'Embedding size.'],
      ['nhead', '—', 'int', 'd_model % nhead == 0.'],
      ['dim_feedforward', '2048', 'int', 'Usually 4 × d_model.'],
      ['dropout', '0.1', '0–1', ''],
      ['activation', "'relu'", "'relu' | 'gelu' | callable", '`gelu` is the modern default.'],
      ['batch_first', 'False', 'bool', 'Set True.'],
      ['norm_first', 'False', 'bool', 'True = pre-LN; trains more stably for deep stacks.'],
      ['layer_norm_eps', '1e-5', 'float', ''],
      ['num_layers (TransformerEncoder)', '—', 'int', ''],
    ],
    snippets: [{
      title: 'Transformer classifier',
      code: `class TextClassifier(nn.Module):
    def __init__(self, vocab, d=256, heads=8, layers=4, n_classes=2, max_len=512):
        super().__init__()
        self.tok = nn.Embedding(vocab, d, padding_idx=0)
        self.pos = nn.Embedding(max_len, d)
        layer = nn.TransformerEncoderLayer(d, heads, 4 * d, dropout=0.1, activation="gelu",
                                           batch_first=True, norm_first=True)
        self.encoder = nn.TransformerEncoder(layer, layers)
        self.head = nn.Linear(d, n_classes)

    def forward(self, ids):                     # ids: (N, L)
        pad = ids == 0
        pos = torch.arange(ids.size(1), device=ids.device)
        x = self.tok(ids) + self.pos(pos)
        x = self.encoder(x, src_key_padding_mask=pad)
        x = x.masked_fill(pad.unsqueeze(-1), 0).sum(1) / (~pad).sum(1, keepdim=True)
        return self.head(x)`,
    }],
  },
  {
    id: 'transformer-full', name: 'nn.Transformer / TransformerDecoderLayer', section: 'PyTorch · Layers', lib: PT, import: 'import torch.nn as nn',
    summary: 'Encoder–decoder transformer and the decoder layer with causal masking.',
    use: 'Sequence-to-sequence (translation, summarization) or decoder-only language models. For text, a pretrained Hugging Face model is usually better than training from scratch.',
    keywords: 'transformer decoder causal mask seq2seq autoregressive gpt generate tgt_mask',
    params: [
      ['d_model', '512', 'int', 'Must be divisible by nhead.'],
      ['nhead', '8', 'int', ''],
      ['num_encoder_layers / num_decoder_layers', '6 / 6', 'int', ''],
      ['dim_feedforward', '2048', 'int', 'Usually 4 × d_model.'],
      ['dropout', '0.1', 'float', ''],
      ['activation', "'relu'", "'relu' | 'gelu' | callable", ''],
      ['batch_first', 'False', 'bool', 'Set True for (N, S, E) inputs.'],
      ['norm_first', 'False', 'bool', 'True (pre-norm) trains more stably for deep stacks.'],
      ['tgt_mask (forward)', 'None', '(T, T) bool / float mask', '`nn.Transformer.generate_square_subsequent_mask(T)` blocks attention to future tokens.'],
      ['*_key_padding_mask (forward)', 'None', '(N, S) bool', 'True marks padding positions to ignore.'],
    ],
    snippets: [{
      title: 'Sinusoidal positional encoding',
      code: `import math
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pos = torch.arange(max_len).unsqueeze(1)
        div = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2], pe[:, 1::2] = torch.sin(pos * div), torch.cos(pos * div)
        self.register_buffer("pe", pe)

    def forward(self, x):            # x: (N, S, E), batch_first
        return x + self.pe[: x.size(1)]

# Or learned: self.pos = nn.Embedding(max_len, d_model); x + self.pos(torch.arange(S, device=x.device))`,
    }],
  },
  {
    id: 'activations', name: 'Activation functions', section: 'PyTorch · Layers', lib: [PT, KR],
    import: 'import torch.nn as nn\nimport torch.nn.functional as F',
    summary: 'Non-linearities between layers.',
    keywords: 'relu gelu silu swish sigmoid tanh softmax leaky elu activation',
    tables: [{
      title: 'Activations',
      head: ['PyTorch', 'Keras', 'Range', 'Use for'],
      rows: [
        ['`nn.ReLU()`', "`'relu'`", '[0, ∞)', 'Default for MLPs and CNNs.'],
        ['`nn.LeakyReLU(0.01)`', '`layers.LeakyReLU()`', '(−∞, ∞)', 'Avoid dead ReLUs; GAN discriminators.'],
        ['`nn.GELU()`', "`'gelu'`", '≈(−0.17, ∞)', 'Transformers.'],
        ['`nn.SiLU()`', "`'silu'` / `'swish'`", '≈(−0.28, ∞)', 'EfficientNet, modern CNNs, LLM MLPs (SwiGLU).'],
        ['`nn.ELU()`', "`'elu'`", '(−1, ∞)', 'Smooth alternative to ReLU.'],
        ['`nn.Tanh()`', "`'tanh'`", '(−1, 1)', 'RNN internals, outputs in [−1, 1].'],
        ['`nn.Sigmoid()`', "`'sigmoid'`", '(0, 1)', 'Gates; binary output only at inference (train with BCEWithLogitsLoss).'],
        ['`nn.Softmax(dim=-1)`', "`'softmax'`", '(0, 1), sums to 1', 'Multiclass output at inference only (CrossEntropyLoss expects logits).'],
        ['`nn.Softplus()`', "`'softplus'`", '(0, ∞)', 'Positive outputs such as variances.'],
        ['`nn.Identity()`', "`'linear'`", '(−∞, ∞)', 'Regression outputs.'],
      ],
    }],
  },

  // Losses
  {
    id: 'loss-chooser', name: 'Choosing a loss', section: 'PyTorch · Losses', lib: [PT, KR],
    summary: 'Match output layer, target format, and loss.',
    keywords: 'loss function criterion cross entropy mse bce',
    tables: [{
      title: 'Task → output → loss',
      head: ['Task', 'Last layer', 'Target', 'PyTorch', 'Keras'],
      rows: [
        ['Binary', 'Linear(…, 1), no activation', 'float 0/1, shape (N, 1)', '`nn.BCEWithLogitsLoss()`', "`BinaryCrossentropy(from_logits=True)`"],
        ['Multiclass', 'Linear(…, C), no softmax', 'int class ids (N,)', '`nn.CrossEntropyLoss()`', "`SparseCategoricalCrossentropy(from_logits=True)`"],
        ['Multiclass, one-hot / soft labels', 'Linear(…, C)', 'float (N, C)', '`nn.CrossEntropyLoss()` (accepts probabilities)', "`CategoricalCrossentropy(from_logits=True)`"],
        ['Multi-label', 'Linear(…, C), no activation', 'float 0/1 (N, C)', '`nn.BCEWithLogitsLoss()`', "`BinaryCrossentropy(from_logits=True)`"],
        ['Regression', 'Linear(…, 1)', 'float', '`nn.MSELoss()` / `nn.L1Loss()` / `nn.HuberLoss()`', "`'mse'` / `'mae'` / `Huber()`"],
        ['Counts', 'Linear, exp or softplus', 'int ≥ 0', '`nn.PoissonNLLLoss()`', "`'poisson'`"],
        ['Distribution matching', 'log_softmax', 'probabilities', '`nn.KLDivLoss(reduction="batchmean")`', "`KLDivergence()`"],
        ['Embeddings / similarity', 'embedding vector', 'pairs / triplets', '`nn.TripletMarginLoss`, `nn.CosineEmbeddingLoss`', ''],
        ['Sequence alignment (ASR/OCR)', 'log_softmax over vocab', 'label sequences', '`nn.CTCLoss()`', '`CTC` via `keras.ops.ctc_loss`'],
      ],
    }],
  },
  {
    id: 'cross-entropy', name: 'nn.CrossEntropyLoss', section: 'PyTorch · Losses', lib: PT, import: 'import torch.nn as nn',
    summary: 'LogSoftmax + NLLLoss in one. Input: raw logits (N, C); target: class ids (N,) or class probabilities (N, C).',
    keywords: 'cross entropy multiclass softmax logits label smoothing',
    params: [
      ['weight', 'None', 'tensor (C,)', 'Per-class weights for imbalance, e.g. inverse frequency.'],
      ['ignore_index', '-100', 'int', 'Target value to skip (padding tokens).'],
      ['reduction', "'mean'", "'mean' | 'sum' | 'none'", '`none` for per-sample losses.'],
      ['label_smoothing', '0.0', '0–1', '0.1 reduces over-confidence.'],
    ],
    tips: ['Do not apply softmax before this loss.', 'For sequences, reshape logits to (N·L, C) or pass (N, C, L).'],
  },
  {
    id: 'bce', name: 'nn.BCEWithLogitsLoss', section: 'PyTorch · Losses', lib: PT, import: 'import torch.nn as nn',
    summary: 'Sigmoid + binary cross entropy, numerically stable. For binary and multi-label targets.',
    keywords: 'binary cross entropy sigmoid multilabel pos_weight',
    params: [
      ['pos_weight', 'None', 'tensor (C,)', 'Imbalance: ≈ negatives / positives per label.'],
      ['weight', 'None', 'tensor', 'Per-element rescaling.'],
      ['reduction', "'mean'", "'mean' | 'sum' | 'none'", ''],
    ],
    tips: ['Targets must be float: `y.float()`.', 'Predicted probability: `torch.sigmoid(logits)`.'],
  },
  {
    id: 'regression-losses', name: 'MSELoss / L1Loss / HuberLoss', section: 'PyTorch · Losses', lib: PT, import: 'import torch.nn as nn',
    summary: 'Regression losses.',
    use: 'MSE for Gaussian noise; L1 for robustness to outliers; Huber/SmoothL1 for both (bounding boxes, RL).',
    keywords: 'mse mae l1 l2 huber smooth regression loss',
    params: [
      ['reduction', "'mean'", "'mean' | 'sum' | 'none'", ''],
      ['delta (HuberLoss)', '1.0', 'float > 0', 'Errors above delta are treated linearly.'],
      ['beta (SmoothL1Loss)', '1.0', 'float ≥ 0', 'SmoothL1 = Huber / beta.'],
    ],
    tips: ['Match shapes: `pred.squeeze(-1)` vs target (N,) — broadcasting (N,1) vs (N,) silently gives the wrong loss.'],
  },
  {
    id: 'custom-losses', name: 'Focal / Dice / custom losses', section: 'PyTorch · Losses', lib: PT,
    summary: 'Losses that are not built into PyTorch but are common in practice, and how to write your own.',
    use: 'Focal loss for heavy class imbalance or dense detection; Dice for segmentation with small foreground; contrastive losses for embeddings.',
    keywords: 'focal loss dice loss segmentation imbalance custom loss contrastive label smoothing',
    tables: [{
      title: 'Other losses',
      head: ['Loss', 'Where', 'Notes'],
      rows: [
        ['Focal loss', '`torchvision.ops.sigmoid_focal_loss(logits, targets, alpha=0.25, gamma=2)`', 'Down-weights easy examples. gamma 1–3.'],
        ['Dice loss', 'Write it (below) or `segmentation_models_pytorch.losses.DiceLoss`', 'Often summed with BCE / CE.'],
        ['Label smoothing', '`nn.CrossEntropyLoss(label_smoothing=0.1)`', 'Regularizes over-confident classifiers.'],
        ['NLLLoss', '`nn.NLLLoss()`', 'Takes log-probabilities (after `log_softmax`).'],
        ['Margin ranking', '`nn.MarginRankingLoss(margin=…)`', 'Pairwise ranking.'],
        ['InfoNCE / contrastive', 'Cross-entropy over similarity logits', 'Self-supervised and retrieval embeddings (CLIP-style).'],
      ],
    }],
    snippets: [{
      title: 'Dice + BCE for binary segmentation',
      code: `def dice_loss(logits, targets, eps=1.0):
    probs = torch.sigmoid(logits).flatten(1)
    targets = targets.flatten(1).float()
    inter = (probs * targets).sum(1)
    return 1 - ((2 * inter + eps) / (probs.sum(1) + targets.sum(1) + eps)).mean()

bce = nn.BCEWithLogitsLoss()
loss = bce(logits, masks.float()) + dice_loss(logits, masks)`,
    }],
  },

  // Optimization
  {
    id: 'optimizers', name: 'Optimizers', section: 'PyTorch · Optimization', lib: PT, import: 'import torch.optim as optim',
    summary: 'AdamW is the safe default; SGD with momentum often generalizes best for CNNs with a good schedule.',
    keywords: 'adam adamw sgd momentum rmsprop optimizer learning rate weight decay',
    params: [
      ['lr (Adam/AdamW)', '1e-3', 'float', '1e-3 from scratch; 1e-5–5e-5 to fine-tune transformers; 1e-4 to fine-tune CNNs.'],
      ['betas (Adam/AdamW)', '(0.9, 0.999)', '(β1, β2)', '(0.9, 0.95) for large transformers.'],
      ['eps (Adam/AdamW)', '1e-8', 'float', ''],
      ['weight_decay (AdamW)', '1e-2', 'float', '0.01–0.1. Exclude biases and norm weights.'],
      ['weight_decay (Adam/SGD)', '0', 'float', 'Adam applies L2 through the gradient; prefer AdamW for decoupled decay.'],
      ['amsgrad', 'False', 'bool', ''],
      ['lr (SGD)', '1e-3', 'float', '0.1 for ResNets with batch 256 (scale with batch size).'],
      ['momentum (SGD)', '0', 'float', 'Set 0.9.'],
      ['nesterov (SGD)', 'False', 'bool', 'True with momentum.'],
      ['lr (RMSprop)', '1e-2', 'float', ''],
      ['alpha (RMSprop)', '0.99', 'float', ''],
      ['fused / foreach', 'None', 'bool', '`fused=True` speeds up CUDA training.'],
    ],
    snippets: [{
      title: 'AdamW with no decay on bias / norm',
      code: `decay, no_decay = [], []
for name, p in model.named_parameters():
    if not p.requires_grad:
        continue
    (no_decay if p.ndim < 2 else decay).append(p)
optimizer = torch.optim.AdamW(
    [{"params": decay, "weight_decay": 0.05}, {"params": no_decay, "weight_decay": 0.0}],
    lr=3e-4, betas=(0.9, 0.999),
)`,
    }],
  },
  {
    id: 'schedulers', name: 'Learning-rate schedulers', section: 'PyTorch · Optimization', lib: PT, import: 'from torch.optim import lr_scheduler',
    summary: 'Change the learning rate during training.',
    keywords: 'scheduler cosine onecycle step plateau warmup learning rate decay',
    tables: [{
      title: 'Schedulers',
      head: ['Scheduler', 'Key params (defaults)', 'Call step()', 'Use when'],
      rows: [
        ['`StepLR`', 'step_size, gamma=0.1', 'per epoch', 'Classic drop every N epochs.'],
        ['`MultiStepLR`', 'milestones, gamma=0.1', 'per epoch', 'Drop at chosen epochs (e.g. [30, 60, 90]).'],
        ['`ExponentialLR`', 'gamma', 'per epoch', 'Smooth decay.'],
        ['`CosineAnnealingLR`', 'T_max, eta_min=0.0', 'per epoch (or per step with T_max = total steps)', 'Good default with fixed budget.'],
        ['`CosineAnnealingWarmRestarts`', 'T_0, T_mult=1, eta_min=0.0', 'per step or epoch', 'Restarts / snapshot ensembles.'],
        ['`OneCycleLR`', 'max_lr, total_steps or (epochs, steps_per_epoch), pct_start=0.3, div_factor=25.0, final_div_factor=1e4', 'per batch', 'Fast training with warmup built in.'],
        ['`LinearLR`', 'start_factor=1/3, end_factor=1.0, total_iters=5', 'per step', 'Warmup, combined via `SequentialLR`.'],
        ['`ReduceLROnPlateau`', "mode='min', factor=0.1, patience=10, threshold=1e-4, cooldown=0, min_lr=0", 'per epoch with metric: `step(val_loss)`', 'No fixed budget; reacts to stalls.'],
      ],
    }],
    snippets: [{
      title: 'Linear warmup + cosine decay (per step)',
      code: `from torch.optim.lr_scheduler import LinearLR, CosineAnnealingLR, SequentialLR
total = epochs * len(train_loader)
warmup = int(0.05 * total)
scheduler = SequentialLR(optimizer, [
    LinearLR(optimizer, start_factor=0.01, total_iters=warmup),
    CosineAnnealingLR(optimizer, T_max=total - warmup, eta_min=1e-6),
], milestones=[warmup])
# inside the batch loop, after optimizer.step(): scheduler.step()`,
    }],
  },
  {
    id: 'init', name: 'Weight initialization', section: 'PyTorch · Optimization', lib: PT, import: 'import torch.nn as nn',
    summary: 'PyTorch layers already use Kaiming-uniform-style init; override for very deep or custom nets.',
    keywords: 'init kaiming he xavier glorot orthogonal initialization',
    tables: [{
      title: 'Init functions',
      head: ['Function', 'Defaults', 'Pair with'],
      rows: [
        ['`nn.init.kaiming_normal_(w)`', "a=0, mode='fan_in', nonlinearity='leaky_relu'", "ReLU nets: pass `nonlinearity='relu'`; `mode='fan_out'` for conv."],
        ['`nn.init.xavier_uniform_(w)`', 'gain=1.0', 'tanh / sigmoid, attention projections.'],
        ['`nn.init.orthogonal_(w)`', 'gain=1', 'RNN hidden-to-hidden weights.'],
        ['`nn.init.trunc_normal_(w, std=0.02)`', 'mean=0, a=-2, b=2', 'Transformers / ViT.'],
        ['`nn.init.zeros_(b)`', '—', 'Biases; last layer of residual branches.'],
      ],
    }],
    snippets: [{ title: 'Apply to a model', code: 'def init_weights(m):\n    if isinstance(m, (nn.Linear, nn.Conv2d)):\n        nn.init.kaiming_normal_(m.weight, nonlinearity="relu")\n        if m.bias is not None:\n            nn.init.zeros_(m.bias)\n\nmodel.apply(init_weights)' }],
  },
  {
    id: 'hyperparams', name: 'Hyperparameter starting points', section: 'PyTorch · Optimization', lib: [PT, KR],
    summary: 'Reasonable first values before tuning.',
    keywords: 'batch size learning rate epochs tuning defaults',
    tables: [{
      title: 'Starting values',
      head: ['Hyperparameter', 'Start', 'Notes'],
      rows: [
        ['Batch size', '32–256', 'Largest that fits; scale lr ≈ linearly with batch size for SGD.'],
        ['Learning rate (Adam/AdamW)', '1e-3 (scratch), 3e-4 (transformers), 2e-5 (fine-tune BERT)', 'Use an LR range test if unsure.'],
        ['Weight decay (AdamW)', '0.01–0.05', ''],
        ['Dropout', '0.1–0.3', 'Increase if train ≫ val.'],
        ['Epochs', 'Until early stopping triggers', 'Patience 5–10 epochs.'],
        ['Gradient clipping', 'max_norm=1.0', 'RNNs and transformers.'],
        ['Warmup', '1–5% of steps', 'Transformers and large batch sizes.'],
      ],
    }],
  },

  // Data
  {
    id: 'dataloader', name: 'Dataset & DataLoader', section: 'PyTorch · Data', lib: PT, import: 'from torch.utils.data import Dataset, DataLoader, TensorDataset, random_split',
    summary: 'Wrap data in a Dataset and batch it with a DataLoader.',
    keywords: 'dataset dataloader batch shuffle workers collate',
    params: [
      ['batch_size', '1', 'int', 'Set explicitly (32–256).'],
      ['shuffle', 'False', 'bool', 'True for training, False for validation/test.'],
      ['num_workers', '0', 'int', '4–8 for image loading. 0 inside notebooks on Windows/macOS if it hangs.'],
      ['pin_memory', 'False', 'bool', 'True when training on CUDA.'],
      ['drop_last', 'False', 'bool', 'True to avoid a tiny last batch with BatchNorm.'],
      ['persistent_workers', 'False', 'bool', 'True keeps workers alive across epochs (needs num_workers > 0).'],
      ['prefetch_factor', 'None (2 with workers)', 'int', 'Batches loaded ahead per worker.'],
      ['collate_fn', 'None', 'callable', 'Custom batching, e.g. padding variable-length sequences.'],
      ['sampler', 'None', 'Sampler', '`WeightedRandomSampler` for class imbalance (then shuffle=False).'],
    ],
    snippets: [
      {
        title: 'Custom Dataset',
        code: `class TabularDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.as_tensor(X, dtype=torch.float32)
        self.y = torch.as_tensor(y, dtype=torch.long)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, i):
        return self.X[i], self.y[i]

train_loader = DataLoader(TabularDataset(X_train, y_train), batch_size=64, shuffle=True,
                          num_workers=2, pin_memory=True)`,
      },
      { title: 'Quick split', code: 'ds = TensorDataset(torch.tensor(X, dtype=torch.float32), torch.tensor(y))\ntrain_ds, val_ds = random_split(ds, [0.8, 0.2], generator=torch.Generator().manual_seed(0))' },
    ],
  },
  {
    id: 'image-transforms', name: 'Image transforms (torchvision)', section: 'PyTorch · Data', lib: PT,
    import: 'from torchvision.transforms import v2 as T\nfrom torchvision import datasets',
    summary: 'Augment training images; only resize and normalize for evaluation.',
    keywords: 'augmentation transforms torchvision resize crop flip normalize imagenet',
    snippets: [{
      title: 'Train / eval transforms',
      code: `train_tf = T.Compose([
    T.RandomResizedCrop(224, scale=(0.6, 1.0)),
    T.RandomHorizontalFlip(),
    T.ColorJitter(0.2, 0.2, 0.2),
    T.ToImage(), T.ToDtype(torch.float32, scale=True),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),  # ImageNet stats
])
eval_tf = T.Compose([
    T.Resize(256), T.CenterCrop(224),
    T.ToImage(), T.ToDtype(torch.float32, scale=True),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
train_ds = datasets.ImageFolder("data/train", transform=train_tf)  # data/train/<class>/*.jpg`,
    }],
  },
  {
    id: 'collate-padding', name: 'Variable-length batches (collate_fn)', section: 'PyTorch · Data', lib: PT,
    import: 'from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence',
    summary: 'Pad sequences of different lengths per batch and build the matching mask.',
    use: 'Text, audio, events, or any sequences where each sample has its own length.',
    keywords: 'collate_fn padding pad_sequence mask variable length sequence batch text',
    params: [
      ['batch_first (pad_sequence)', 'False', 'bool', 'True gives (N, T, …).'],
      ['padding_value (pad_sequence)', '0.0', 'float', 'Use the padding token id; set `padding_idx` in `nn.Embedding` to match.'],
      ['padding_side (pad_sequence)', "'right'", "'right' | 'left'", 'Left padding for decoder-only generation (PyTorch ≥ 2.6).'],
      ['enforce_sorted (pack_padded_sequence)', 'True', 'bool', 'Set False unless the batch is sorted by length.'],
    ],
    snippets: [{
      title: 'Pad per batch',
      code: `def collate(batch):
    seqs, labels = zip(*batch)                   # each seq: LongTensor (T_i,)
    lengths = torch.tensor([len(s) for s in seqs])
    x = pad_sequence(seqs, batch_first=True, padding_value=PAD_ID)
    mask = x != PAD_ID                           # True = real token
    return x, lengths, mask, torch.tensor(labels)

loader = DataLoader(ds, batch_size=32, shuffle=True, collate_fn=collate)
# Transformer layers want the opposite: src_key_padding_mask = ~mask`,
    }],
  },
  {
    id: 'samplers', name: 'Imbalanced data in PyTorch', section: 'PyTorch · Data', lib: PT,
    import: 'from torch.utils.data import WeightedRandomSampler',
    summary: 'Two ways to rebalance: weight the loss, or oversample rare classes in the DataLoader.',
    use: 'Class imbalance in classification. Try loss weights first; use a sampler when batches rarely contain the minority class.',
    keywords: 'imbalance class weights weighted random sampler oversample pos_weight minority',
    params: [
      ['weights (sampler)', '—', 'per-sample weights', '1 / count of the sample’s class.'],
      ['num_samples (sampler)', '—', 'int', 'Samples drawn per epoch, usually `len(dataset)`.'],
      ['replacement (sampler)', 'True', 'bool', 'Must be True to oversample.'],
      ['weight (CrossEntropyLoss)', 'None', 'tensor (C,)', 'e.g. inverse class frequency, normalized.'],
      ['pos_weight (BCEWithLogitsLoss)', 'None', 'tensor', '≈ negatives / positives.'],
    ],
    snippets: [{
      title: 'Sampler and loss weights',
      code: `counts = torch.bincount(train_labels)
sample_w = (1.0 / counts.float())[train_labels]
sampler = WeightedRandomSampler(sample_w, num_samples=len(sample_w), replacement=True)
train_loader = DataLoader(train_ds, batch_size=64, sampler=sampler)   # no shuffle=True with a sampler

# or weight the loss instead
class_w = counts.sum() / (len(counts) * counts.float())
criterion = nn.CrossEntropyLoss(weight=class_w.to(device))`,
    }],
  },

  // Training
  {
    id: 'training-loop', name: 'Training loop', section: 'PyTorch · Training', lib: PT,
    summary: 'The standard PyTorch train / evaluate loop.',
    keywords: 'train loop epoch backward zero_grad step eval no_grad',
    snippets: [{
      title: 'Train and evaluate',
      code: `model = model.to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

def train_one_epoch(loader):
    model.train()
    total = 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad(set_to_none=True)
        loss = criterion(model(xb), yb)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        total += loss.item() * len(xb)
    return total / len(loader.dataset)

@torch.no_grad()
def evaluate(loader):
    model.eval()
    correct = total_loss = 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        logits = model(xb)
        total_loss += criterion(logits, yb).item() * len(xb)
        correct += (logits.argmax(1) == yb).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n

for epoch in range(epochs):
    train_loss = train_one_epoch(train_loader)
    val_loss, val_acc = evaluate(val_loader)
    print(f"{epoch:3d}  train {train_loss:.4f}  val {val_loss:.4f}  acc {val_acc:.3f}")`,
    }],
  },
  {
    id: 'early-stopping', name: 'Early stopping & checkpoints', section: 'PyTorch · Training', lib: PT,
    summary: 'Keep the best weights and stop when validation stops improving.',
    keywords: 'early stopping checkpoint save load state_dict best model patience',
    snippets: [
      {
        title: 'Early stopping',
        code: `best, patience, bad = float("inf"), 10, 0
for epoch in range(max_epochs):
    train_one_epoch(train_loader)
    val_loss, _ = evaluate(val_loader)
    if val_loss < best - 1e-4:
        best, bad = val_loss, 0
        torch.save(model.state_dict(), "best.pt")
    else:
        bad += 1
        if bad >= patience:
            break
model.load_state_dict(torch.load("best.pt", map_location=device))`,
      },
      {
        title: 'Full checkpoint (resume training)',
        code: `torch.save({"epoch": epoch, "model": model.state_dict(), "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict()}, "ckpt.pt")

ckpt = torch.load("ckpt.pt", map_location=device)
model.load_state_dict(ckpt["model"]); optimizer.load_state_dict(ckpt["optimizer"])
scheduler.load_state_dict(ckpt["scheduler"]); start_epoch = ckpt["epoch"] + 1`,
      },
    ],
  },
  {
    id: 'mixed-precision', name: 'Mixed precision & torch.compile', section: 'PyTorch · Training', lib: PT,
    summary: 'Faster training with lower memory on modern GPUs.',
    keywords: 'amp autocast gradscaler fp16 bf16 compile speed',
    params: [
      ['device_type (autocast)', '—', "'cuda' | 'cpu' | 'mps'", ''],
      ['dtype (autocast)', 'float16 (cuda) / bfloat16 (cpu)', 'torch.float16 | torch.bfloat16', '`bfloat16` on Ampere+ needs no GradScaler.'],
      ['mode (torch.compile)', "'default'", "'default' | 'reduce-overhead' | 'max-autotune'", '`reduce-overhead` for small batches (CUDA graphs).'],
      ['fullgraph (torch.compile)', 'False', 'bool', 'True to error on graph breaks.'],
      ['dynamic (torch.compile)', 'None', 'bool | None', 'True for varying input shapes.'],
    ],
    snippets: [{
      title: 'AMP training step',
      code: `scaler = torch.amp.GradScaler("cuda")
model = torch.compile(model)  # optional, PyTorch 2.x

for xb, yb in train_loader:
    xb, yb = xb.to(device), yb.to(device)
    optimizer.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=torch.float16):
        loss = criterion(model(xb), yb)
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    scaler.step(optimizer)
    scaler.update()`,
    }],
  },
  {
    id: 'transfer-learning', name: 'Transfer learning', section: 'PyTorch · Training', lib: PT,
    import: 'from torchvision.models import resnet50, ResNet50_Weights',
    summary: 'Start from pretrained weights, replace the head, then fine-tune.',
    keywords: 'pretrained fine-tune freeze resnet backbone head torchvision timm',
    snippets: [{
      title: 'Freeze backbone, train new head',
      code: `weights = ResNet50_Weights.DEFAULT
model = resnet50(weights=weights)
for p in model.parameters():
    p.requires_grad = False
model.fc = nn.Linear(model.fc.in_features, n_classes)  # new head trains
preprocess = weights.transforms()

optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
# Phase 2: unfreeze all and fine-tune with a small lr (1e-4 … 1e-5)`,
    }],
  },
  {
    id: 'reproducibility', name: 'Reproducibility', section: 'PyTorch · Training', lib: PT,
    summary: 'Seed everything for repeatable runs.',
    keywords: 'seed random deterministic reproducible',
    snippets: [{
      title: 'Seed everything',
      code: `import random, numpy as np, torch
def seed_everything(seed=42):
    random.seed(seed); np.random.seed(seed)
    torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.use_deterministic_algorithms(True, warn_only=True)
seed_everything()`,
    }],
  },
  {
    id: 'debugging', name: 'Debugging training', section: 'PyTorch · Training', lib: [PT, KR],
    summary: 'Symptoms and the first things to check.',
    keywords: 'debug nan loss not decreasing overfitting underfitting exploding vanishing',
    tables: [{
      title: 'Symptom → fix',
      head: ['Symptom', 'Likely cause', 'Try'],
      rows: [
        ['Loss is NaN / inf', 'LR too high, log(0), fp16 overflow', 'Lower lr, clip gradients, check inputs for NaN, use `BCEWithLogitsLoss` instead of sigmoid + BCE.'],
        ['Loss does not decrease', 'Bug, LR too low/high, wrong labels', 'Overfit one small batch first; it should reach ~0 loss.'],
        ['Train good, val bad', 'Overfitting', 'More data/augmentation, dropout, weight decay, early stopping, smaller model.'],
        ['Train and val both bad', 'Underfitting', 'Bigger model, train longer, higher lr, fewer regularizers.'],
        ['Val better than train', 'Dropout/augmentation only in train', 'Usually fine.'],
        ['Accuracy stuck at majority class', 'Imbalance', 'Class weights, `WeightedRandomSampler`, check metric.'],
        ['Different results in eval', 'Forgot `model.eval()`', 'Call `model.eval()` and `torch.no_grad()`.'],
        ['CUDA out of memory', 'Batch/model too large', 'Smaller batch, AMP, gradient accumulation, `torch.cuda.empty_cache()`.'],
        ['Shape mismatch error', 'Wrong in_features or layout', 'Print shapes after each layer; check `batch_first`.'],
      ],
    }],
    snippets: [{ title: 'Gradient accumulation', code: 'accum = 4\nfor i, (xb, yb) in enumerate(train_loader):\n    loss = criterion(model(xb.to(device)), yb.to(device)) / accum\n    loss.backward()\n    if (i + 1) % accum == 0:\n        optimizer.step(); optimizer.zero_grad(set_to_none=True)' }],
  },
  {
    id: 'metrics-logging', name: 'Metrics & logging (torchmetrics, TensorBoard)', section: 'PyTorch · Training', lib: PT,
    import: 'import torchmetrics  # pip install torchmetrics\nfrom torch.utils.tensorboard import SummaryWriter',
    summary: 'Accumulate metrics correctly across batches and log curves to compare runs.',
    keywords: 'metrics torchmetrics accuracy f1 auroc tensorboard summarywriter logging wandb',
    tables: [{
      title: 'Common APIs',
      head: ['API', 'Use', 'Notes'],
      rows: [
        ['`torchmetrics.Accuracy(task="multiclass", num_classes=C)`', 'Accuracy', '`task` is "binary", "multiclass", or "multilabel".'],
        ['`torchmetrics.F1Score(task=…, average="macro")`', 'F1', ''],
        ['`torchmetrics.AUROC(task="binary")`', 'ROC AUC', 'Needs probabilities or logits, not labels.'],
        ['`metric.update(preds, target)` → `metric.compute()` → `metric.reset()`', 'Epoch-level metric', 'Averaging per-batch values is wrong for F1 / AUC.'],
        ['`SummaryWriter("runs/exp1").add_scalar(tag, value, step)`', 'TensorBoard curves', 'Run `tensorboard --logdir runs`.'],
        ['`writer.add_hparams(hparams, metrics)`', 'Compare runs', ''],
      ],
    }],
    snippets: [{
      title: 'Epoch metrics + TensorBoard',
      code: `f1 = torchmetrics.F1Score(task="multiclass", num_classes=n_classes, average="macro").to(device)
writer = SummaryWriter("runs/baseline")

model.eval()
with torch.no_grad():
    for xb, yb in val_loader:
        f1.update(model(xb.to(device)).argmax(1), yb.to(device))
val_f1 = f1.compute().item(); f1.reset()
writer.add_scalar("f1/val", val_f1, epoch)
writer.add_scalar("lr", optimizer.param_groups[0]["lr"], epoch)`,
    }],
  },
  {
    id: 'multi-gpu', name: 'Multi-GPU (DDP / Accelerate)', section: 'PyTorch · Training', lib: [PT, HF],
    import: 'from accelerate import Accelerator  # pip install accelerate',
    summary: 'Scale the same training loop across GPUs or machines.',
    use: 'When one GPU is too slow. Prefer `DistributedDataParallel` (or Accelerate) over the legacy `nn.DataParallel`.',
    keywords: 'multi gpu distributed ddp accelerate torchrun dataparallel fsdp',
    tables: [{
      title: 'Options',
      head: ['Option', 'How', 'Notes'],
      rows: [
        ['Accelerate', '`accelerator.prepare(model, optimizer, loader)`, `accelerator.backward(loss)`', 'Minimal code changes; launch with `accelerate launch train.py`.'],
        ['DDP', '`torchrun --nproc_per_node=4 train.py` + `DistributedDataParallel(model)` + `DistributedSampler`', 'Call `sampler.set_epoch(epoch)` every epoch.'],
        ['FSDP', '`torch.distributed.fsdp`', 'Shards weights for models too large for one GPU.'],
        ['`nn.DataParallel`', 'Wrap the model', 'Single process; slower than DDP. Avoid.'],
      ],
    }],
    snippets: [{
      title: 'Accelerate loop',
      code: `accelerator = Accelerator(mixed_precision="bf16")
model, optimizer, train_loader = accelerator.prepare(model, optimizer, train_loader)
for xb, yb in train_loader:                  # already on the right device
    loss = criterion(model(xb), yb)
    accelerator.backward(loss)
    optimizer.step(); optimizer.zero_grad()
accelerator.save(accelerator.unwrap_model(model).state_dict(), "model.pt")`,
    }],
  },
  {
    id: 'hf-transformers', name: 'Hugging Face Transformers', section: 'Hugging Face', lib: HF,
    import: 'from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification, TrainingArguments, Trainer, pipeline',
    summary: 'Pretrained models for text, vision, and audio, with the Trainer for fine-tuning.',
    use: 'Any NLP task, and many vision/audio tasks: start from a pretrained checkpoint instead of training from scratch.',
    keywords: 'hugging face transformers bert pretrained tokenizer trainer trainingarguments pipeline fine tune nlp',
    params: [
      ['output_dir', '—', 'str', 'Checkpoints and logs.'],
      ['learning_rate', '5e-5', 'float', '2e-5–5e-5 for BERT-size models.'],
      ['per_device_train_batch_size', '8', 'int', '16–32 if memory allows; use `gradient_accumulation_steps` otherwise.'],
      ['num_train_epochs', '3.0', 'float', '2–5 for fine-tuning.'],
      ['weight_decay', '0.0', 'float', '0.01 is common.'],
      ['warmup_ratio / warmup_steps', '0.0 / 0', 'float / int', '0.06–0.1 of steps.'],
      ['lr_scheduler_type', "'linear'", "'linear' | 'cosine' | 'constant' | …", ''],
      ['eval_strategy', "'no'", "'no' | 'steps' | 'epoch'", 'Needed for `load_best_model_at_end`.'],
      ['save_strategy', "'steps'", "'no' | 'steps' | 'epoch'", 'Must match eval_strategy for best-model loading.'],
      ['load_best_model_at_end', 'False', 'bool', 'With `metric_for_best_model`.'],
      ['fp16 / bf16', 'False', 'bool', 'Mixed precision on GPU (bf16 on Ampere+).'],
      ['gradient_accumulation_steps', '1', 'int', 'Effective batch = batch × steps × GPUs.'],
      ['seed', '42', 'int', ''],
    ],
    snippets: [{
      title: 'Inference pipelines',
      code: `from transformers import pipeline
clf = pipeline("sentiment-analysis")                 # default model
clf(["great product", "never again"])

zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
zs("The battery died after a day", candidate_labels=["battery", "screen", "shipping"])

# Sentence embeddings (pip install sentence-transformers)
from sentence_transformers import SentenceTransformer
emb = SentenceTransformer("all-MiniLM-L6-v2").encode(texts, normalize_embeddings=True)`,
    }],
  },
  {
    id: 'autoencoder', name: 'Autoencoder / VAE', section: 'PyTorch · Training', lib: PT,
    summary: 'Learn a compressed representation by reconstructing the input.',
    use: 'Anomaly detection (high reconstruction error), denoising, pretraining, and generative modeling (VAE).',
    keywords: 'autoencoder vae variational latent reconstruction anomaly denoise encoder decoder kl',
    snippets: [{
      title: 'VAE with reparameterization',
      code: `class VAE(nn.Module):
    def __init__(self, in_dim, latent=16, hidden=256):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(in_dim, hidden), nn.ReLU())
        self.mu, self.logvar = nn.Linear(hidden, latent), nn.Linear(hidden, latent)
        self.dec = nn.Sequential(nn.Linear(latent, hidden), nn.ReLU(), nn.Linear(hidden, in_dim))

    def forward(self, x):
        h = self.enc(x)
        mu, logvar = self.mu(h), self.logvar(h)
        z = mu + torch.randn_like(mu) * torch.exp(0.5 * logvar)
        return self.dec(z), mu, logvar

def vae_loss(recon, x, mu, logvar, beta=1.0):
    rec = nn.functional.mse_loss(recon, x, reduction="sum") / len(x)
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp()) / len(x)
    return rec + beta * kl

# Plain autoencoder for anomalies: score = ((model(x) - x) ** 2).mean(1)`,
    }],
  },

  ...kerasEntries,
]

// Group entries so each section is contiguous and frameworks read top to bottom.
const sectionOrder = [
  'Start here', 'Workflows (SOP)',
  'PyTorch · Basics', 'PyTorch · Layers', 'PyTorch · Losses', 'PyTorch · Optimization', 'PyTorch · Data', 'PyTorch · Training',
  'Keras · Basics', 'Keras · Layers', 'Keras · Losses & metrics', 'Keras · Optimization', 'Keras · Data', 'Keras · Training', 'Keras · Deploy',
  'Hugging Face',
]

export const nnSheet = addCrossRefs(nnEntries
  .map((entry, index) => ({ entry, index }))
  .sort((a, b) => sectionOrder.indexOf(a.entry.section) - sectionOrder.indexOf(b.entry.section) || a.index - b.index)
  .map(({ entry }) => entry))
