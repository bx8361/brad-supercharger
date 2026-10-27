// Keras 3 (runs on TensorFlow, JAX or PyTorch) and TensorFlow. Defaults follow Keras 3 and TensorFlow 2.16+.
import { PT, KR } from './frameworks.js'

export const kerasEntries = [
  // Layers
  {
    id: 'keras-dense', name: 'layers.Dense / Flatten / Reshape', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Fully connected layer on the last axis, plus shape helpers. PyTorch: `nn.Linear`, `nn.Flatten`.',
    use: 'MLPs, classifier heads, projections inside attention blocks.',
    keywords: 'dense linear fully connected flatten reshape permute repeatvector identity activation lambda einsum',
    params: [
      ['units', 'required', 'int', 'Output size; the input size is inferred.'],
      ['activation', 'None', "'relu' | 'gelu' | 'softmax' | callable", 'None = linear; leave None on the logits layer.'],
      ['use_bias', 'True', 'bool', 'Set False before BatchNormalization.'],
      ['kernel_initializer', "'glorot_uniform'", "'he_normal' | 'he_uniform' | …", "'he_normal' for ReLU stacks."],
      ['bias_initializer', "'zeros'", 'initializer', ''],
      ['kernel_regularizer', 'None', '`regularizers.l2(1e-4)`', 'Adds a penalty to `model.losses`.'],
      ['activity_regularizer', 'None', 'regularizer', 'Penalises outputs (sparse activations).'],
      ['kernel_constraint', 'None', '`constraints.MaxNorm(3)`', ''],
      ['lora_rank', 'None', 'int', 'LoRA fine-tuning of this layer.'],
    ],
    tables: [{
      title: 'Shape and utility layers',
      head: ['Layer', 'Key arguments', 'Use for'],
      rows: [
        ['`layers.Flatten()`', "data_format=None", 'Conv features → Dense.'],
        ['`layers.Reshape(target_shape)`', 'target_shape', 'Excludes the batch axis.'],
        ['`layers.Permute(dims)`', 'dims (1-based)', 'Reorder axes.'],
        ['`layers.RepeatVector(n)`', 'n', 'Repeat a vector n times for a decoder.'],
        ['`layers.Activation(fn)`', 'activation', 'Stand-alone non-linearity.'],
        ['`layers.Identity()`', '', 'No-op placeholder.'],
        ['`layers.Lambda(fn)`', 'function, output_shape', 'Quick custom op; prefer a subclassed layer for saving.'],
        ['`layers.EinsumDense(eq, output_shape)`', 'equation, output_shape, bias_axes', 'Per-head projections.'],
        ['`layers.Masking(mask_value=0.0)`', 'mask_value', 'Skip padded timesteps.'],
        ['`layers.InputLayer` / `keras.Input(shape)`', 'shape, batch_size, dtype', 'Declare the model input.'],
      ],
    }],
  },
  {
    id: 'keras-conv', name: 'layers.Conv1D / Conv2D / Conv3D', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Convolutions are channels-last by default: (batch, H, W, C). PyTorch: `nn.Conv2d` (channels-first).',
    use: 'Images, audio and sequences with local structure.',
    keywords: 'convolution conv2d conv1d conv3d separable depthwise transpose upsampling padding cropping stride dilation',
    params: [
      ['filters', 'required', 'int', 'Output channels (PyTorch `out_channels`).'],
      ['kernel_size', 'required', 'int | tuple', '3 is the standard choice.'],
      ['strides', '1', 'int | tuple', '2 halves the spatial size.'],
      ['padding', "'valid'", "'valid' | 'same'", "'same' keeps size when strides=1; 'valid' means no padding."],
      ['data_format', "'channels_last'", "'channels_last' | 'channels_first'", 'Follows `keras.config`; leave default.'],
      ['dilation_rate', '1', 'int | tuple', 'Larger receptive field without more weights.'],
      ['groups', '1', 'int', 'Grouped convolution.'],
      ['activation', 'None', 'str | callable', 'Usually `"relu"`, or None followed by BatchNorm + ReLU.'],
      ['use_bias', 'True', 'bool', 'False before BatchNormalization.'],
      ['kernel_initializer', "'glorot_uniform'", 'initializer', "'he_normal' for ReLU."],
    ],
    tables: [{
      title: 'Related layers',
      head: ['Layer', 'Use for', 'Note'],
      rows: [
        ['`layers.SeparableConv2D(filters, k)`', 'Light-weight convs (Xception)', 'Depthwise then pointwise.'],
        ['`layers.DepthwiseConv2D(k)`', 'MobileNet blocks', 'depth_multiplier=1.'],
        ['`layers.Conv2DTranspose(filters, k, strides)`', 'Learned upsampling', 'Checkerboard artifacts: use kernel divisible by stride.'],
        ['`layers.UpSampling2D(size=(2, 2), interpolation="nearest")`', 'Non-learned upsampling', 'Follow with a Conv2D.'],
        ['`layers.ZeroPadding2D(padding=1)` / `Cropping2D`', 'Manual pad / crop', ''],
        ['`layers.Conv1D(filters, k, padding="causal")`', 'Causal sequences', "'causal' never looks ahead."],
      ],
    }],
    tips: ['Output size: `⌊(n + 2p − k) / s⌋ + 1` for valid padding; `⌈n / s⌉` for same.'],
  },
  {
    id: 'keras-pooling', name: 'layers.MaxPooling / GlobalAveragePooling', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Downsample feature maps or collapse them into a vector. PyTorch: `nn.MaxPool2d`, `nn.AdaptiveAvgPool2d(1)`.',
    keywords: 'pooling maxpooling averagepooling global average pooling flatten',
    params: [
      ['pool_size', '(2, 2)', 'int | tuple', 'Window size.'],
      ['strides', 'None → pool_size', 'int | tuple', 'Defaults to non-overlapping windows.'],
      ['padding', "'valid'", "'valid' | 'same'", ''],
      ['keepdims (Global*)', 'False', 'bool', 'Keep spatial axes as size 1.'],
    ],
    tables: [{
      title: 'Layers',
      head: ['Layer', 'Output', 'Use for'],
      rows: [
        ['`layers.MaxPooling1D/2D/3D()`', 'smaller feature map', 'Keeps strongest activation; CNN stages.'],
        ['`layers.AveragePooling2D()`', 'smaller feature map', 'Smoother downsampling.'],
        ['`layers.GlobalAveragePooling2D()`', '(batch, channels)', 'Replaces Flatten in modern CNNs; fewer parameters.'],
        ['`layers.GlobalMaxPooling2D()`', '(batch, channels)', 'Detects presence of a feature anywhere.'],
        ['`layers.GlobalAveragePooling1D()`', '(batch, features)', 'Pool over time for text / sequences.'],
      ],
    }],
  },
  {
    id: 'keras-normalization', name: 'layers.BatchNormalization / LayerNormalization', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Stabilise training. PyTorch: `nn.BatchNorm2d`, `nn.LayerNorm`, `nn.GroupNorm`.',
    keywords: 'batchnorm batch normalization layernorm groupnorm unitnorm rmsnorm momentum epsilon',
    params: [
      ['axis', '-1', 'int | list', 'The channel axis; -1 for channels-last.'],
      ['momentum (BN)', '0.99', '0–1', 'Higher = slower running stats (PyTorch 0.1 ≈ Keras 0.9).'],
      ['epsilon (BN)', '1e-3', 'float', 'PyTorch uses 1e-5; Keras uses 1e-3.'],
      ['epsilon (LayerNorm)', '1e-3', 'float', "Use 1e-6 for transformers if you want PyTorch-like numerics."],
      ['center / scale', 'True / True', 'bool', 'Learnable beta / gamma.'],
      ['groups (GroupNorm)', '32', 'int', 'Must divide channels; batch-size independent.'],
      ['synchronized (BN)', 'False', 'bool', 'Sync statistics across replicas.'],
    ],
    tables: [{
      title: 'Which one',
      head: ['Layer', 'Normalises over', 'Use for'],
      rows: [
        ['`BatchNormalization()`', 'batch + spatial', 'CNNs with batch ≥ 16.'],
        ['`LayerNormalization()`', 'features of each sample', 'Transformers, RNNs, small batches.'],
        ['`GroupNormalization(groups=32)`', 'channel groups', 'Small-batch vision, detection.'],
        ['`UnitNormalization()`', 'L2 norm of each vector', 'Embeddings, cosine similarity.'],
        ['`Normalization()`', 'fixed mean / variance', 'Input scaling; call `.adapt(data)` on training data.'],
      ],
    }],
    tips: ['Call `model(x, training=False)` on a frozen backbone so BatchNorm uses stored statistics.', 'Setting `layer.trainable = False` on BatchNormalization also freezes its running statistics.'],
  },
  {
    id: 'keras-dropout', name: 'layers.Dropout / SpatialDropout / GaussianNoise', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Randomly drop activations during training only. PyTorch: `nn.Dropout`, `nn.Dropout2d`.',
    use: 'Overfitting in dense layers (Dropout) or conv feature maps (SpatialDropout).',
    keywords: 'dropout regularization overfitting spatialdropout gaussiandropout alphadropout gaussiannoise rate',
    params: [
      ['rate', 'required (no default)', '0–1', 'Fraction dropped (PyTorch `p`); 0.1–0.3 for conv / transformers, 0.3–0.5 for dense.'],
      ['noise_shape', 'None', 'tuple', 'Shape of the binary mask; set (batch, 1, features) to drop the same features across timesteps.'],
      ['seed', 'None', 'int', 'Reproducible masks.'],
    ],
    tables: [{
      title: 'Variants',
      head: ['Layer', 'Behaviour', 'Use for'],
      rows: [
        ['`layers.Dropout(rate)`', 'Drops individual units', 'Dense layers, transformers.'],
        ['`layers.SpatialDropout1D/2D(rate)`', 'Drops whole channels', 'Conv feature maps, embeddings.'],
        ['`layers.GaussianDropout(rate)`', 'Multiplicative Gaussian noise', 'Smoother regularisation.'],
        ['`layers.AlphaDropout(rate)`', 'Keeps mean / variance', 'SELU networks.'],
        ['`layers.GaussianNoise(stddev)`', 'Adds noise to inputs', 'Input noise augmentation.'],
        ['`layers.ActivityRegularization(l1, l2)`', 'Penalty on activations', 'Sparse features.'],
        ['`layers.LSTM(…, dropout=, recurrent_dropout=)`', 'Built-in RNN dropout', '`recurrent_dropout` disables the fast cuDNN kernel.'],
      ],
    }],
    tips: ['Active only when the layer is called with `training=True`; `fit` sets it automatically, `model.predict` and `model(x)` do not.'],
  },
  {
    id: 'keras-embedding', name: 'layers.Embedding', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Integer ids → dense vectors. PyTorch: `nn.Embedding`.',
    keywords: 'embedding token vocabulary mask_zero word vectors positional embedding',
    params: [
      ['input_dim', 'required', 'int', 'Vocabulary size (max id + 1).'],
      ['output_dim', 'required', 'int', 'Vector size; 64–768 typical.'],
      ['embeddings_initializer', "'uniform'", 'initializer', ''],
      ['embeddings_regularizer', 'None', 'regularizer', ''],
      ['mask_zero', 'False', 'bool', 'Id 0 = padding; downstream RNN / attention skip it (PyTorch `padding_idx`). Then input_dim = vocab + 1.'],
      ['weights', 'None', 'list of array', 'Initialise from pretrained vectors.'],
      ['sparse', 'False', 'bool', 'Sparse gradients (TensorFlow backend).'],
    ],
    snippets: [{
      title: 'Text classifier head',
      code: `inputs = keras.Input(shape=(None,), dtype="int32")
x = layers.Embedding(20_000, 128, mask_zero=True)(inputs)
x = layers.Bidirectional(layers.LSTM(64))(x)
outputs = layers.Dense(1, activation="sigmoid")(x)
model = keras.Model(inputs, outputs)`,
    }],
  },
  {
    id: 'keras-rnn', name: 'layers.LSTM / GRU / SimpleRNN / Bidirectional', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Recurrent layers are batch-first: (batch, time, features). PyTorch: `nn.LSTM(batch_first=True)`.',
    keywords: 'lstm gru rnn simplernn bidirectional timedistributed convlstm return_sequences return_state stateful sequence time series',
    params: [
      ['units', 'required', 'int', 'Hidden size.'],
      ['activation', "'tanh'", 'str', 'Keep tanh + sigmoid for the cuDNN kernel.'],
      ['recurrent_activation', "'sigmoid'", 'str', 'Gate activation.'],
      ['dropout', '0.0', '0–1', 'On the inputs.'],
      ['recurrent_dropout', '0.0', '0–1', 'On the recurrent state; slows training.'],
      ['return_sequences', 'False', 'bool', 'True to output every timestep (needed to stack RNNs or feed attention).'],
      ['return_state', 'False', 'bool', 'Also return the final hidden (and cell) state.'],
      ['go_backwards', 'False', 'bool', 'Process in reverse.'],
      ['stateful', 'False', 'bool', 'Carry state between batches; needs fixed batch size.'],
      ['unroll', 'False', 'bool', 'Faster for short sequences, more memory.'],
      ['reset_after (GRU)', 'True', 'bool', 'cuDNN-compatible variant.'],
    ],
    tables: [{
      title: 'Wrappers',
      head: ['Layer', 'Key arguments', 'Use for'],
      rows: [
        ['`layers.Bidirectional(layer)`', "merge_mode='concat'", 'Use both directions; output units doubles.'],
        ['`layers.TimeDistributed(layer)`', 'layer', 'Apply a layer per timestep.'],
        ['`layers.RNN(cell)`', 'cell, return_sequences', 'Custom cells.'],
        ['`layers.ConvLSTM2D(filters, k)`', 'return_sequences', 'Video / spatio-temporal.'],
      ],
    }],
    tips: ['Pass `mask` or use `Embedding(mask_zero=True)` for padded sequences.', 'Stacking: every RNN except the last needs `return_sequences=True`.'],
  },
  {
    id: 'keras-attention', name: 'layers.MultiHeadAttention / Attention', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Self- and cross-attention. PyTorch: `nn.MultiheadAttention`.',
    keywords: 'attention multiheadattention self attention cross attention causal mask key_dim num_heads transformer',
    params: [
      ['num_heads', 'required', 'int', 'Parallel attention heads.'],
      ['key_dim', 'required', 'int', 'Per-head size; usually `embed_dim // num_heads`.'],
      ['value_dim', 'None → key_dim', 'int', ''],
      ['dropout', '0.0', '0–1', 'On attention weights.'],
      ['use_bias', 'True', 'bool', ''],
      ['output_shape', 'None → query dim', 'int', ''],
      ['attention_axes', 'None', 'int | tuple', 'Axes to attend over (e.g. spatial axes for images).'],
      ['call: use_causal_mask', 'False', 'bool', 'Decoder self-attention.'],
      ['call: attention_mask', 'None', 'bool tensor', 'True = allowed; shape (B, T, S).'],
      ['call: return_attention_scores', 'False', 'bool', 'For visualisation.'],
    ],
    snippets: [{
      title: 'Transformer encoder block',
      code: `def encoder_block(x, d_model=128, heads=4, ff=512, rate=0.1):
    a = layers.MultiHeadAttention(num_heads=heads, key_dim=d_model // heads, dropout=rate)(x, x)
    x = layers.LayerNormalization(epsilon=1e-6)(x + layers.Dropout(rate)(a))
    f = layers.Dense(ff, activation="gelu")(x)
    f = layers.Dense(d_model)(f)
    return layers.LayerNormalization(epsilon=1e-6)(x + layers.Dropout(rate)(f))`,
    }],
    tips: ['Positional information is not built in: add `Embedding(max_len, d_model)` for positions, or use KerasHub `PositionEmbedding`.'],
  },
  {
    id: 'keras-merge', name: 'Merging layers (Add, Concatenate, …)', section: 'Keras · Layers', lib: KR, import: 'from keras import layers',
    summary: 'Combine branches: skip connections, multi-input models. PyTorch: `x + y`, `torch.cat`.',
    keywords: 'add concatenate multiply average subtract maximum dot skip residual merge branch',
    tables: [{
      title: 'Layers',
      head: ['Layer', 'Behaviour', 'Use for'],
      rows: [
        ['`layers.Add()([a, b])`', 'Element-wise sum', 'Residual connections (shapes must match).'],
        ['`layers.Concatenate(axis=-1)([a, b])`', 'Join along an axis', 'Multi-input models, U-Net skips.'],
        ['`layers.Multiply()([a, b])`', 'Element-wise product', 'Gating.'],
        ['`layers.Average()`, `Maximum()`, `Minimum()`', 'Element-wise reductions', 'Ensembling branches.'],
        ['`layers.Subtract()([a, b])`', 'a − b', 'Siamese difference.'],
        ['`layers.Dot(axes=-1, normalize=False)`', 'Dot product', 'Similarity; `normalize=True` = cosine.'],
      ],
    }],
    snippets: [{
      title: 'Residual block',
      code: `def res_block(x, filters):
    shortcut = x
    x = layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x); x = layers.ReLU()(x)
    x = layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    return layers.ReLU()(layers.Add()([shortcut, x]))`,
    }],
  },
  {
    id: 'keras-activations', name: 'Keras activations', section: 'Keras · Layers', lib: KR, import: 'from keras import layers, activations',
    summary: 'Pass a string to `activation=` or use a layer when the activation has parameters.',
    keywords: 'relu leakyrelu prelu elu gelu swish silu selu softmax sigmoid tanh softplus activation layer',
    params: [
      ['layers.ReLU(max_value, negative_slope, threshold)', 'None, 0.0, 0.0', 'floats', '`max_value=6` gives ReLU6 (MobileNet).'],
      ['layers.LeakyReLU(negative_slope)', '0.3', 'float', 'PyTorch default is 0.01; pass 0.01 for parity.'],
      ['layers.PReLU()', 'alpha init zeros', '', 'Learnable slope per unit.'],
      ['layers.ELU(alpha)', '1.0', 'float', ''],
      ['layers.Softmax(axis)', '-1', 'int', 'Use only at inference or with `from_logits=False`.'],
      ["'gelu' / 'silu' / 'swish' / 'selu' / 'softplus' / 'tanh' / 'sigmoid' / 'linear'", '—', 'string names', "'selu' needs `lecun_normal` init and AlphaDropout."],
    ],
    tips: ['The output layer usually has no activation when the loss uses `from_logits=True`.', 'The PyTorch ↔ Keras activation table is under Layers › Activation functions.'],
  },
  // Losses & metrics
  {
    id: 'keras-losses', name: 'keras.losses', section: 'Keras · Losses & metrics', lib: KR, import: 'import keras',
    summary: 'Loss classes (configurable) and lower-case functions. PyTorch: `nn.CrossEntropyLoss`, `nn.BCEWithLogitsLoss`, `nn.MSELoss`.',
    use: 'Pick by target format: integer labels, one-hot, binary, or real values.',
    keywords: 'loss crossentropy sparse categorical binary mse mae huber hinge kl divergence focal dice cosine from_logits label smoothing',
    params: [
      ['from_logits', 'False', 'bool', 'True when the last layer has no sigmoid / softmax (recommended: numerically stable).'],
      ['label_smoothing', '0.0', '0–1', '0.05–0.1 reduces over-confidence.'],
      ['reduction', "'sum_over_batch_size'", "'sum' | 'none' | …", "'none' for per-sample losses."],
      ['axis (categorical)', '-1', 'int', 'Class axis.'],
      ['class_weight (fit)', 'None', 'dict', 'Weights for imbalance, set in `fit`, not in the loss.'],
      ['sample_weight (fit)', 'None', 'array', 'Per-example weights.'],
    ],
    tables: [{
      title: 'Which loss',
      head: ['Task', 'Last layer', 'Loss'],
      rows: [
        ['Binary', '`Dense(1)` logits', '`BinaryCrossentropy(from_logits=True)`'],
        ['Multiclass, integer labels', '`Dense(K)` logits', '`SparseCategoricalCrossentropy(from_logits=True)`'],
        ['Multiclass, one-hot labels', '`Dense(K)` logits', '`CategoricalCrossentropy(from_logits=True)`'],
        ['Multilabel', '`Dense(K)` logits', '`BinaryCrossentropy(from_logits=True)`'],
        ['Regression', '`Dense(1)` linear', '`MeanSquaredError()`; `MeanAbsoluteError()`; `Huber(delta=1.0)` for outliers'],
        ['Imbalanced binary', '`Dense(1)` logits', '`BinaryFocalCrossentropy(gamma=2.0, alpha=0.25, from_logits=True)`'],
        ['Segmentation overlap', 'sigmoid / softmax', '`Dice()`, `CategoricalCrossentropy`'],
        ['Distribution match', 'softmax', '`KLDivergence()`'],
        ['Embedding similarity', 'normalised vectors', '`CosineSimilarity()` (negative), contrastive via custom loss'],
        ['Count data', 'exp / softplus', '`Poisson()`'],
        ['Margin / SVM-style', 'linear', '`Hinge()`, `SquaredHinge()`, `CategoricalHinge()`'],
        ['Smooth L1-like', 'linear', '`LogCosh()`'],
      ],
    }],
    snippets: [{
      title: 'Custom loss',
      code: `def weighted_mse(y_true, y_pred):
    w = keras.ops.where(y_true > 0, 2.0, 1.0)
    return keras.ops.mean(w * keras.ops.square(y_true - y_pred), axis=-1)

model.compile(optimizer="adam", loss=weighted_mse)`,
    }],
  },
  {
    id: 'keras-metrics', name: 'keras.metrics', section: 'Keras · Losses & metrics', lib: KR, import: 'import keras',
    summary: 'Metrics are stateful objects: `update_state`, `result`, `reset_state`. PyTorch: torchmetrics.',
    keywords: 'metrics accuracy auc precision recall f1score r2score rmse topk binaryaccuracy categoricalaccuracy',
    params: [
      ['BinaryAccuracy(threshold)', '0.5', 'float', 'Expects probabilities, or logits with threshold=0.'],
      ['SparseCategoricalAccuracy()', '—', '', 'Integer labels.'],
      ['CategoricalAccuracy()', '—', '', 'One-hot labels.'],
      ['TopKCategoricalAccuracy(k)', '5', 'int', 'Top-5 for ImageNet-like tasks.'],
      ['AUC(num_thresholds, curve, from_logits)', '200, "ROC", False', 'curve "ROC" | "PR"', '"PR" for imbalanced data.'],
      ['Precision / Recall(thresholds, top_k, class_id)', 'None', '', 'Set `thresholds` or `class_id` for multiclass.'],
      ['F1Score(average, threshold)', 'None, None', "None | 'micro' | 'macro' | 'weighted'", 'Multi-class F1.'],
      ['R2Score(class_aggregation)', "'uniform_average'", '', 'Regression.'],
      ['MeanSquaredError / RootMeanSquaredError / MeanAbsoluteError', '—', '', 'Regression.'],
      ['Mean() / Sum()', '—', '', 'Running average of any value (e.g. a loss).'],
    ],
    snippets: [{
      title: 'Use and custom metric',
      code: `model.compile("adam", "binary_crossentropy",
              metrics=["accuracy", keras.metrics.AUC(name="auc"), keras.metrics.Precision(name="precision")])

class Brier(keras.metrics.Metric):
    def __init__(self, name="brier", **kw):
        super().__init__(name=name, **kw)
        self.total = self.add_variable(shape=(), initializer="zeros")
        self.count = self.add_variable(shape=(), initializer="zeros")
    def update_state(self, y_true, y_pred, sample_weight=None):
        err = keras.ops.square(keras.ops.cast(y_true, "float32") - y_pred)
        self.total.assign_add(keras.ops.sum(err))
        self.count.assign_add(keras.ops.cast(keras.ops.size(err), "float32"))
    def result(self):
        return self.total / self.count
    def reset_state(self):
        self.total.assign(0.0); self.count.assign(0.0)`,
    }],
  },
  // Optimization
  {
    id: 'keras-optimizers', name: 'keras.optimizers', section: 'Keras · Optimization', lib: KR, import: 'import keras',
    summary: 'Defaults for Keras 3 optimizers. PyTorch equivalents: `optim.Adam`, `AdamW`, `SGD`, `RMSprop`.',
    keywords: 'optimizer adam adamw sgd rmsprop adagrad adadelta adamax nadam lion adafactor ftrl momentum nesterov weight decay clipnorm clipvalue ema gradient accumulation learning rate',
    tables: [{
      title: 'Optimizers and defaults',
      head: ['Optimizer', 'Defaults', 'Use for'],
      rows: [
        ['`Adam`', 'learning_rate=0.001, beta_1=0.9, beta_2=0.999, epsilon=1e-7, amsgrad=False', 'Default for most tasks.'],
        ['`AdamW`', 'learning_rate=0.001, weight_decay=0.004, beta_1=0.9, beta_2=0.999', 'Transformers, fine-tuning; decoupled decay.'],
        ['`SGD`', 'learning_rate=0.01, momentum=0.0, nesterov=False', 'CNNs with momentum 0.9 and a schedule.'],
        ['`RMSprop`', 'learning_rate=0.001, rho=0.9, momentum=0.0, epsilon=1e-7, centered=False', 'RNNs; the Keras `compile` default.'],
        ['`Adagrad`', 'learning_rate=0.001, initial_accumulator_value=0.1', 'Sparse features.'],
        ['`Adadelta`', 'learning_rate=0.001, rho=0.95', 'Rarely needed.'],
        ['`Adamax`', 'learning_rate=0.001, beta_1=0.9, beta_2=0.999', 'Embedding-heavy models.'],
        ['`Nadam`', 'learning_rate=0.001, beta_1=0.9, beta_2=0.999', 'Adam with Nesterov.'],
        ['`Lion`', 'learning_rate=0.001, beta_1=0.9, beta_2=0.99', 'Memory-light; use ~3–10× smaller LR than Adam.'],
        ['`Adafactor`', 'learning_rate=0.001, beta_2_decay=-0.8', 'Large models, small memory.'],
        ['`Ftrl`', 'learning_rate=0.001, l1/l2 strengths', 'Wide / linear sparse models.'],
      ],
    }],
    params: [
      ['learning_rate', 'depends', 'float | LearningRateSchedule', 'Pass a schedule object for decay.'],
      ['weight_decay', 'None', 'float', 'Decoupled decay; AdamW default 0.004.'],
      ['clipnorm', 'None', 'float', 'Clip each gradient tensor by norm.'],
      ['global_clipnorm', 'None', 'float', 'Clip by the global norm; recommended for RNNs and transformers.'],
      ['clipvalue', 'None', 'float', 'Clip each element.'],
      ['use_ema / ema_momentum', 'False / 0.99', 'bool / float', 'Exponential moving average of weights; evaluate with EMA weights.'],
      ['gradient_accumulation_steps', 'None', 'int', 'Larger effective batch size.'],
      ['loss_scale_factor', 'None', 'float', 'Static loss scaling (mixed precision).'],
    ],
    snippets: [{
      title: 'Typical setup',
      code: `opt = keras.optimizers.AdamW(
    learning_rate=keras.optimizers.schedules.CosineDecay(1e-3, decay_steps=total_steps, warmup_steps=500, warmup_target=1e-3),
    weight_decay=0.01, global_clipnorm=1.0)`,
    }],
  },
  {
    id: 'keras-schedules', name: 'Learning-rate schedules & callbacks', section: 'Keras · Optimization', lib: KR, import: 'import keras',
    summary: 'Per-step schedule objects, or per-epoch callbacks. PyTorch: `lr_scheduler`.',
    keywords: 'learning rate schedule decay exponentialdecay cosinedecay polynomialdecay piecewise reducelronplateau learningratescheduler warmup',
    params: [
      ['ExponentialDecay(initial_learning_rate, decay_steps, decay_rate, staircase)', 'staircase=False', '', 'lr · rate^(step / decay_steps).'],
      ['CosineDecay(initial_learning_rate, decay_steps, alpha, warmup_target, warmup_steps)', 'alpha=0.0, warmup_steps=0', '', 'Cosine to alpha·lr; linear warmup when set.'],
      ['CosineDecayRestarts(initial_learning_rate, first_decay_steps, t_mul, m_mul, alpha)', 't_mul=2.0, m_mul=1.0, alpha=0.0', '', 'Warm restarts.'],
      ['PiecewiseConstantDecay(boundaries, values)', 'required', '', 'Step schedule at given step counts.'],
      ['PolynomialDecay(initial_learning_rate, decay_steps, end_learning_rate, power)', 'end=0.0001, power=1.0', '', 'Linear when power=1 (BERT-style).'],
      ['InverseTimeDecay(initial_learning_rate, decay_steps, decay_rate)', 'staircase=False', '', ''],
      ['callbacks.ReduceLROnPlateau', "monitor='val_loss', factor=0.1, patience=10, min_delta=1e-4, cooldown=0, min_lr=0.0", '', 'Reduce when the metric stalls.'],
      ['callbacks.LearningRateScheduler(fn)', 'fn(epoch, lr)', '', 'Arbitrary per-epoch rule.'],
    ],
    tips: ['Schedule objects count optimizer steps, not epochs: `decay_steps = steps_per_epoch * epochs`.', 'Use either a schedule object or `ReduceLROnPlateau`, not both.'],
  },
  {
    id: 'keras-init-reg', name: 'Initializers, regularizers & constraints', section: 'Keras · Optimization', lib: KR, import: 'from keras import initializers, regularizers, constraints',
    summary: 'Layer arguments: `kernel_initializer`, `kernel_regularizer`, `kernel_constraint`. PyTorch: `nn.init`, optimizer `weight_decay`.',
    keywords: 'initializer glorot he lecun orthogonal l1 l2 regularizer constraint maxnorm weight decay penalty',
    tables: [{
      title: 'Initializers',
      head: ['Name', 'Default for', 'Use for'],
      rows: [
        ["`'glorot_uniform'`", 'Dense, Conv kernels', 'tanh / sigmoid / linear.'],
        ["`'he_normal'` / `'he_uniform'`", '—', 'ReLU-family activations.'],
        ["`'lecun_normal'`", '—', 'SELU.'],
        ["`'orthogonal'`", 'RNN recurrent kernels', 'Stable recurrent dynamics.'],
        ["`'zeros'` / `'ones'`", 'biases / BN scale', ''],
        ["`'random_normal'` / `'truncated_normal'` (stddev=0.05)", 'Embedding uses uniform', 'Simple small random init.'],
      ],
    }, {
      title: 'Regularizers and constraints',
      head: ['Object', 'Default', 'Effect'],
      rows: [
        ['`regularizers.L2(l2=0.01)`', 'l2=0.01', 'Weight decay penalty added to the loss.'],
        ['`regularizers.L1(l1=0.01)`', 'l1=0.01', 'Sparsity.'],
        ['`regularizers.L1L2(l1=0.0, l2=0.0)`', '0.0 / 0.0', 'Elastic net.'],
        ['`regularizers.OrthogonalRegularizer(factor)`', 'factor=0.01', 'Encourages orthogonal weights.'],
        ['`constraints.MaxNorm(max_value=2)`', '2', 'Clip weight norm after each update.'],
        ['`constraints.UnitNorm()` / `NonNeg()` / `MinMaxNorm()`', '—', 'Other projections.'],
      ],
    }],
    tips: ['With Adam, prefer `AdamW(weight_decay=…)` over L2 regularizers.'],
  },
  // Basics
  {
    id: 'keras-backends', name: 'Keras 3 multi-backend & keras.ops', section: 'Keras · Basics', lib: KR, import: 'import os\nos.environ["KERAS_BACKEND"] = "jax"   # before importing keras\nimport keras',
    summary: 'Keras 3 runs on TensorFlow, JAX or PyTorch. Write layers with `keras.ops` and the same code works on all.',
    use: 'Portable layers and models; choose the backend per speed or deployment.',
    keywords: 'keras 3 backend jax torch tensorflow ops random multi backend KERAS_BACKEND keras_hub keras.config',
    tables: [{
      title: 'Backends',
      head: ['Backend', 'Choose it for', 'Notes'],
      rows: [
        ['`tensorflow` (default for `tf.keras`)', 'tf.data, SavedModel / TFLite / TF Serving export', '`model.export()` needs this backend.'],
        ['`jax`', 'Fast TPU / GPU training, `keras.distribution`', 'Stateless; works with tf.data or any iterable.'],
        ['`torch`', 'Use PyTorch ecosystem; DataLoader input', 'Keras layers are `torch.nn.Module`s.'],
      ],
    }, {
      title: 'keras.ops cheatsheet',
      head: ['NumPy / TF / PyTorch', 'Backend-agnostic', 'Note'],
      rows: [
        ['`tf.reduce_mean`, `torch.mean`', '`keras.ops.mean(x, axis)`', 'NumPy names.'],
        ['`tf.matmul`, `torch.matmul`', '`keras.ops.matmul(a, b)`', ''],
        ['`tf.concat`, `torch.cat`', '`keras.ops.concatenate([a, b], axis)`', ''],
        ['`tf.nn.softmax`, `F.softmax`', '`keras.ops.softmax(x, axis=-1)`', ''],
        ['`tf.cast`, `x.to(dtype)`', '`keras.ops.cast(x, "float32")`', ''],
        ['`tf.random.normal`, `torch.randn`', '`keras.random.normal(shape, seed=…)`', 'Pass a `SeedGenerator`.'],
        ['`tf.GradientTape`, `loss.backward()`', 'Override `train_step` or use `fit`', 'Gradients are backend specific.'],
      ],
    }],
    snippets: [{
      title: 'Backend-agnostic layer',
      code: `class RMSNorm(keras.layers.Layer):
    def __init__(self, eps=1e-6, **kw):
        super().__init__(**kw); self.eps = eps
    def build(self, input_shape):
        self.scale = self.add_weight(shape=(input_shape[-1],), initializer="ones")
    def call(self, x):
        var = keras.ops.mean(keras.ops.square(x), axis=-1, keepdims=True)
        return x * keras.ops.rsqrt(var + self.eps) * self.scale`,
    }, {
      title: 'Pretrained models with KerasHub',
      code: `import keras_hub
clf = keras_hub.models.TextClassifier.from_preset("bert_base_en", num_classes=2)   # fine-tune in one call
clf.fit(train_ds, validation_data=val_ds, epochs=2)
vit = keras_hub.models.ImageClassifier.from_preset("resnet_50_imagenet")`,
    }],
    tips: ['Set `KERAS_BACKEND` (or edit `~/.keras/keras.json`) before the first `import keras`.', '`keras.config.set_floatx("float32")`, `keras.config.disable_traceback_filtering()` help when debugging.', 'Old code: `tf.keras` is Keras 2 in TF ≤ 2.15; for TF ≥ 2.16 `tf.keras` is Keras 3 (set `TF_USE_LEGACY_KERAS=1` for Keras 2).'],
  },
  // Data
  {
    id: 'keras-data-utils', name: 'keras.utils: datasets, sequences & helpers', section: 'Keras · Data', lib: KR, import: 'import keras',
    summary: 'Built-in datasets and the loaders that turn folders or arrays into batched datasets.',
    keywords: 'datasets mnist cifar imdb to_categorical pad_sequences timeseries_dataset_from_array image_dataset_from_directory text_dataset_from_directory audio pydataset load_img img_to_array normalize',
    tables: [{
      title: 'Loaders',
      head: ['Task', 'Code', 'Note'],
      rows: [
        ['Built-in data', '`keras.datasets.mnist.load_data()`, `cifar10`, `cifar100`, `fashion_mnist`, `imdb`, `reuters`, `boston_housing`', 'Returns `(x_train, y_train), (x_test, y_test)` NumPy arrays.'],
        ['Image folders', '`keras.utils.image_dataset_from_directory(dir, image_size=(256, 256), batch_size=32, validation_split=…, subset=…, seed=…)`', 'Folder name = class; `label_mode="int"|"categorical"|"binary"|None`.'],
        ['Text folders', '`keras.utils.text_dataset_from_directory(dir, batch_size=32)`', 'Pair with `TextVectorization`.'],
        ['Audio folders', '`keras.utils.audio_dataset_from_directory(dir, sampling_rate=…)`', ''],
        ['Time series windows', '`keras.utils.timeseries_dataset_from_array(data, targets, sequence_length, sequence_stride=1, batch_size=128)`', 'No shuffling leak: keep temporal order for validation.'],
        ['One-hot', '`keras.utils.to_categorical(y, num_classes)`', 'Or use sparse labels and Sparse losses.'],
        ['Pad sequences', '`keras.utils.pad_sequences(seqs, maxlen, padding="pre", truncating="pre", value=0)`', 'Default pads / truncates at the front.'],
        ['Custom loader', 'Subclass `keras.utils.PyDataset` with `__len__` and `__getitem__`', 'Framework-agnostic Sequence replacement; `workers`, `use_multiprocessing`.'],
        ['Torch / tf.data input', 'Pass a `torch.utils.data.DataLoader` or `tf.data.Dataset` straight to `fit`', 'Works on any backend.'],
        ['Normalize', '`keras.utils.normalize(x, axis=-1, order=2)`', 'L2 normalise arrays.'],
        ['Class weights', 'sklearn `compute_class_weight` → `fit(class_weight={…})`', ''],
      ],
    }],
    snippets: [{
      title: 'Images from folders, then cache and prefetch',
      code: `train = keras.utils.image_dataset_from_directory("data", validation_split=0.2, subset="training", seed=0, image_size=(224, 224), batch_size=32)
val = keras.utils.image_dataset_from_directory("data", validation_split=0.2, subset="validation", seed=0, image_size=(224, 224), batch_size=32)
train = train.cache().prefetch(tf.data.AUTOTUNE)
val = val.cache().prefetch(tf.data.AUTOTUNE)`,
    }],
  },
  // Training
  {
    id: 'keras-model-api', name: 'Model API: predict, evaluate, summary, weights', section: 'Keras · Training', lib: KR, import: 'import keras',
    summary: 'Everyday methods on a Keras model.',
    keywords: 'predict evaluate summary get_weights set_weights layers trainable freeze plot_model test_on_batch train_on_batch history fit return_dict',
    params: [
      ['model.fit(...)', 'returns History', '`history.history["val_loss"]`', 'Per-epoch loss and metrics.'],
      ['model.evaluate(x, y, return_dict=False)', 'verbose="auto"', '', 'Loss and metrics; `return_dict=True` for a dict.'],
      ['model.predict(x, batch_size=None)', 'batch_size → 32', '', 'Returns NumPy; for small inputs call `model(x, training=False)`.'],
      ['model.train_on_batch / test_on_batch / predict_on_batch', '—', '', 'Single-step APIs.'],
      ['model.summary(expand_nested=False)', '—', '', 'Layers, shapes, parameters.'],
      ['model.layers / model.get_layer(name)', '—', '', 'Access sub-layers.'],
      ['layer.trainable = False', 'True', '', 'Freeze; re-run `compile` afterwards.'],
      ['model.get_weights() / set_weights(list)', '—', '', 'NumPy arrays.'],
      ['model.save_weights("x.weights.h5") / load_weights', '—', '', 'Weights only.'],
      ['keras.utils.plot_model(model, show_shapes=True)', '—', '', 'Diagram; needs graphviz.'],
      ['model.count_params()', '—', '', ''],
      ['model.stop_training = True', '—', '', 'Stop from a callback.'],
    ],
    tips: ['PyTorch ↔ Keras: `model.train()` / `model.eval()` becomes the `training=` argument; `.parameters()` is `.trainable_weights`.'],
  },
  {
    id: 'keras-model', name: 'Keras models', section: 'Keras · Basics', lib: KR, import: 'import keras\nfrom keras import layers',
    summary: 'Sequential for stacks, functional API for multiple inputs/outputs or skip connections. Keras 3 runs on TensorFlow, JAX, or PyTorch.',
    keywords: 'keras tensorflow sequential functional model summary',
    snippets: [
      {
        title: 'Sequential',
        code: `model = keras.Sequential([
    keras.Input(shape=(n_features,)),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.2),
    layers.Dense(64, activation="relu"),
    layers.Dense(n_classes),            # logits
])
model.summary()`,
      },
      {
        title: 'Functional CNN',
        code: `inputs = keras.Input(shape=(28, 28, 1))
x = layers.Conv2D(32, 3, padding="same", activation="relu")(inputs)
x = layers.MaxPooling2D()(x)
x = layers.Conv2D(64, 3, padding="same", activation="relu")(x)
x = layers.GlobalAveragePooling2D()(x)
outputs = layers.Dense(10)(x)
model = keras.Model(inputs, outputs)`,
      },
    ],
  },
  {
    id: 'keras-compile-fit', name: 'compile() / fit()', section: 'Keras · Training', lib: KR, import: 'import keras',
    summary: 'Configure training, then train.',
    keywords: 'compile fit optimizer loss metrics epochs batch validation',
    params: [
      ['optimizer (compile)', "'rmsprop'", "'adam' | 'adamw' | 'sgd' | optimizer object", '`keras.optimizers.Adam(1e-3)` to set the learning rate.'],
      ['loss (compile)', 'None', 'str | Loss', 'Set `from_logits=True` when the last layer has no activation.'],
      ['metrics (compile)', 'None', 'list', "e.g. `['accuracy']`, `[keras.metrics.AUC()]`."],
      ['batch_size (fit)', 'None → 32', 'int', ''],
      ['epochs (fit)', '1', 'int', 'Set high and use EarlyStopping.'],
      ['validation_split (fit)', '0.0', '0–1', 'Takes the last fraction of the data (not shuffled first).'],
      ['validation_data (fit)', 'None', '(x_val, y_val) | dataset', 'Prefer an explicit split.'],
      ['callbacks (fit)', 'None', 'list', ''],
      ['class_weight (fit)', 'None', 'dict', '{class: weight} for imbalance.'],
      ['shuffle (fit)', 'True', 'bool', ''],
      ['verbose (fit)', "'auto'", "0 | 1 | 2 | 'auto'", ''],
    ],
    snippets: [{
      title: 'Compile and fit with callbacks',
      code: `model.compile(
    optimizer=keras.optimizers.AdamW(learning_rate=1e-3, weight_decay=1e-4),
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=["accuracy"],
)
history = model.fit(
    x_train, y_train, validation_data=(x_val, y_val),
    epochs=100, batch_size=64,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4),
        keras.callbacks.ModelCheckpoint("best.keras", monitor="val_loss", save_best_only=True),
    ],
)`,
    }],
  },
  {
    id: 'keras-callbacks', name: 'Keras callbacks', section: 'Keras · Training', lib: KR, import: 'from keras import callbacks',
    summary: 'Hooks that run during `fit`.',
    keywords: 'callback earlystopping modelcheckpoint reducelronplateau tensorboard',
    tables: [{
      title: 'Common callbacks',
      head: ['Callback', 'Defaults', 'Notes'],
      rows: [
        ['`EarlyStopping`', "monitor='val_loss', min_delta=0, patience=0, mode='auto', restore_best_weights=False", 'Set patience 5–20 and `restore_best_weights=True`.'],
        ['`ModelCheckpoint`', "filepath, monitor='val_loss', save_best_only=False, save_weights_only=False", 'Keras 3 needs a `.keras` (or `.weights.h5`) extension.'],
        ['`ReduceLROnPlateau`', "monitor='val_loss', factor=0.1, patience=10, min_delta=1e-4, min_lr=0", 'factor 0.5, patience 3–5 is gentler.'],
        ['`LearningRateScheduler`', 'schedule(epoch, lr)', 'Custom per-epoch schedule.'],
        ['`TensorBoard`', "log_dir='logs'", 'Run `tensorboard --logdir logs`.'],
        ['`CSVLogger`', 'filename, separator=",", append=False', 'Log metrics per epoch.'],
      ],
    }],
  },
  {
    id: 'keras-save', name: 'Keras save / load / export', section: 'Keras · Deploy', lib: KR, import: 'import keras',
    summary: 'Keras 3 formats for whole models, weights only, and inference exports.',
    keywords: 'keras save load model .keras weights h5 export savedmodel tflite',
    tables: [{
      title: 'Formats',
      head: ['Call', 'Saves', 'Notes'],
      rows: [
        ['`model.save("model.keras")`', 'Architecture + weights + optimizer state', 'Default format in Keras 3. Load with `keras.models.load_model`.'],
        ['`model.save_weights("w.weights.h5")`', 'Weights only', 'Rebuild the same architecture, then `load_weights`.'],
        ['`model.export("dir")`', 'TensorFlow SavedModel for serving', 'TF backend; inference only.'],
        ['`keras.saving.register_keras_serializable()`', 'Custom layers', 'Decorate custom classes so `load_model` can rebuild them.'],
      ],
    }],
    snippets: [{ title: 'Save and reload', code: 'model.save("model.keras")\nreloaded = keras.models.load_model("model.keras")\nnp.testing.assert_allclose(model.predict(x_test[:8]), reloaded.predict(x_test[:8]), atol=1e-6)' }],
  },
  {
    id: 'keras-preprocessing', name: 'Keras preprocessing layers', section: 'Keras · Data', lib: KR, import: 'from keras import layers',
    summary: 'Preprocessing inside the model, so training and serving share it.',
    keywords: 'keras normalization stringlookup integerlookup textvectorization rescaling augmentation preprocessing adapt',
    tables: [{
      title: 'Layers',
      head: ['Layer', 'Key arguments (defaults)', 'Notes'],
      rows: [
        ['`layers.Normalization()`', 'axis=-1, mean=None, variance=None', 'Call `.adapt(X_train)` to learn mean / variance.'],
        ['`layers.Rescaling(scale, offset=0.0)`', '—', '`Rescaling(1/255)` for images.'],
        ['`layers.StringLookup()` / `IntegerLookup()`', "max_tokens=None, num_oov_indices=1, output_mode='int'", '`output_mode="one_hot"` for categoricals.'],
        ['`layers.Discretization()`', 'bin_boundaries=None, num_bins=None', 'Bucketize numbers; `adapt` learns quantile bins.'],
        ['`layers.TextVectorization()`', "max_tokens=None, output_mode='int', output_sequence_length=None, ngrams=None", "`output_mode='tf_idf'` for a bag-of-words model."],
        ['`layers.RandomFlip()` / `RandomRotation(f)` / `RandomZoom(f)`', "mode='horizontal_and_vertical'", 'Image augmentation; active only in training.'],
      ],
    }],
  },
  {
    id: 'keras-pytorch-map', name: 'PyTorch ↔ Keras / TensorFlow map', section: 'Start here', lib: [PT, KR],
    summary: 'Equivalent layers, losses, optimizers and training calls, with default differences.',
    keywords: 'equivalent translate convert keras pytorch layers',
    tables: [{
      title: 'Equivalents',
      head: ['PyTorch', 'Keras', 'Watch out'],
      rows: [
        ['`nn.Linear(in, out)`', '`layers.Dense(out)`', 'Keras infers input size.'],
        ['`nn.Conv2d(c_in, c_out, k)`', '`layers.Conv2D(c_out, k)`', 'PyTorch is channels-first (N, C, H, W); Keras defaults to channels-last.'],
        ['`nn.MaxPool2d(2)`', '`layers.MaxPooling2D(2)`', ''],
        ['`nn.AdaptiveAvgPool2d(1)` + flatten', '`layers.GlobalAveragePooling2D()`', ''],
        ['`nn.BatchNorm2d(c)`', '`layers.BatchNormalization()`', 'momentum 0.1 (PyTorch) ≈ momentum 0.9 (Keras convention); Keras default 0.99.'],
        ['`nn.LayerNorm(d)`', '`layers.LayerNormalization()`', 'Keras eps default 1e-3.'],
        ['`nn.Dropout(p)`', '`layers.Dropout(rate)`', ''],
        ['`nn.Embedding(n, d)`', '`layers.Embedding(n, d)`', '`mask_zero=True` ≈ padding_idx=0.'],
        ['`nn.LSTM(in, h, batch_first=True)`', '`layers.LSTM(h, return_sequences=…)`', 'Keras returns only the last step unless `return_sequences=True`.'],
        ['`nn.MultiheadAttention(E, H)`', '`layers.MultiHeadAttention(H, key_dim=E // H)`', ''],
        ['`nn.Flatten()`', '`layers.Flatten()`', ''],
        ['`nn.GRU(in, h, batch_first=True)`', '`layers.GRU(h, return_sequences=…)`', ''],
        ['`nn.GroupNorm(g, c)`', '`layers.GroupNormalization(groups=g)`', ''],
        ['`nn.Dropout2d(p)`', '`layers.SpatialDropout2D(rate)`', ''],
        ['`nn.ConvTranspose2d`', '`layers.Conv2DTranspose`', ''],
        ['`nn.Upsample(scale_factor=2)`', '`layers.UpSampling2D(2)`', ''],
        ['`nn.AvgPool2d(2)`', '`layers.AveragePooling2D(2)`', ''],
        ['`nn.Identity()`', '`layers.Identity()`', ''],
        ['`nn.Sequential(...)`', '`keras.Sequential([...])`', 'Keras needs `keras.Input(shape)` first or a build call.'],
        ['`nn.CrossEntropyLoss()`', '`SparseCategoricalCrossentropy(from_logits=True)`', 'Both take logits and integer labels.'],
        ['`nn.BCEWithLogitsLoss()`', '`BinaryCrossentropy(from_logits=True)`', ''],
        ['`nn.MSELoss()`', '`MeanSquaredError()`', ''],
        ['`optim.Adam(params, lr=1e-3)`', '`keras.optimizers.Adam(1e-3)`', 'PyTorch eps 1e-8, Keras 1e-7.'],
        ['`optim.AdamW(params, lr, weight_decay=0.01)`', '`keras.optimizers.AdamW(lr, weight_decay=0.004)`', 'Different default decay.'],
        ['`torch.utils.data.DataLoader`', '`tf.data.Dataset` / `keras.utils.PyDataset`', ''],
        ['`model.train()` / `model.eval()`', '`training=True` / `training=False`', 'Passed as an argument.'],
        ['`torch.save(model.state_dict(), p)`', '`model.save_weights("p.weights.h5")`', ''],
        ['`torch.no_grad()`', '`model.predict(...)` / `model(x, training=False)`', ''],
        ['`loss.backward(); opt.step()`', '`tf.GradientTape` + `apply_gradients`, or `fit`', ''],
      ],
    }],
  },
  // TensorFlow
  {
    id: 'tf-tensors', name: 'Tensors & Variables', section: 'Keras · Basics', lib: KR, import: 'import tensorflow as tf',
    summary: 'tf.constant is immutable, tf.Variable holds trainable state; ops mirror NumPy.',
    keywords: 'tensor constant variable reshape cast dtype numpy device gpu',
    tables: [{
      title: 'Common operations',
      head: ['Task', 'Code', 'Note'],
      rows: [
        ['Create', '`tf.constant([[1., 2.]])`, `tf.zeros((2, 3))`, `tf.random.normal((2, 3))`', 'Default float dtype is float32, integers int32.'],
        ['To / from NumPy', '`t.numpy()`, `tf.convert_to_tensor(arr)`', 'Eager mode only for `.numpy()`.'],
        ['Cast', '`tf.cast(x, tf.float32)`', 'TF never promotes dtypes silently; mismatches raise errors.'],
        ['Reshape', '`tf.reshape(x, (-1, 28, 28, 1))`, `tf.squeeze`, `tf.expand_dims(x, axis)`', ''],
        ['Join / split', '`tf.concat([a, b], axis=-1)`, `tf.stack`, `tf.split`', ''],
        ['Reduce', '`tf.reduce_mean(x, axis=0)`, `reduce_sum`, `reduce_max`', 'Named reduce_*, not mean/sum.'],
        ['Matmul', '`a @ b`, `tf.linalg.matmul(a, b)`', 'Batched on leading dims.'],
        ['Index / mask', '`x[:, 0]`, `tf.boolean_mask(x, m)`, `tf.gather(x, idx)`', 'Tensors are immutable; use `tf.tensor_scatter_nd_update`.'],
        ['Trainable state', '`w = tf.Variable(tf.zeros((3,)))`, `w.assign(v)`, `w.assign_add(v)`', 'Only Variables get gradients by default.'],
        ['Devices', '`tf.config.list_physical_devices("GPU")`', 'TF uses a GPU automatically when one is visible.'],
      ],
    }],
    tips: ['`tf.shape(x)` gives the dynamic shape inside `tf.function`; `x.shape` is the static one.'],
  },
  {
    id: 'tf-data', name: 'tf.data pipeline', section: 'Keras · Data', lib: KR, import: 'import tensorflow as tf',
    summary: 'Input pipeline: from_tensor_slices, map, shuffle, batch, prefetch.',
    use: 'Any input larger than a few arrays, or when the GPU waits for data.',
    keywords: 'dataset shuffle batch prefetch cache map tfrecord autotune interleave',
    params: [
      ['shuffle(buffer_size)', 'required', 'ideally ≥ dataset size', 'Shuffle before `batch`; `reshuffle_each_iteration=True` by default.'],
      ['batch(batch_size, drop_remainder)', "drop_remainder=False", 'True / False', '`True` gives static shapes (needed on TPU).'],
      ['map(fn, num_parallel_calls)', 'None (serial)', '`tf.data.AUTOTUNE`', 'Parallelise preprocessing; fn must be traceable by `tf.function`.'],
      ['cache(filename)', 'in memory', 'path for disk', 'Place after deterministic preprocessing, before random augmentation.'],
      ['prefetch(buffer_size)', 'required', '`tf.data.AUTOTUNE`', 'Always last; overlaps input with training.'],
      ['repeat(count)', 'None (forever)', 'int', 'Needed with `steps_per_epoch`.'],
    ],
    snippets: [{
      title: 'Typical pipeline',
      code: `AUTOTUNE = tf.data.AUTOTUNE

def prep(x, y):
    return tf.cast(x, tf.float32) / 255.0, y

train_ds = (tf.data.Dataset.from_tensor_slices((x_train, y_train))
            .shuffle(10_000)
            .map(prep, num_parallel_calls=AUTOTUNE)
            .batch(64)
            .prefetch(AUTOTUNE))

# Files
imgs = tf.keras.utils.image_dataset_from_directory('data/train', image_size=(224, 224), batch_size=32)
text = tf.keras.utils.text_dataset_from_directory('data/text', batch_size=32)
# model.fit(train_ds, validation_data=val_ds, epochs=10)`,
    }],
  },
  {
    id: 'tf-gradient-tape', name: 'Custom training loop (GradientTape)', section: 'Keras · Training', lib: KR, import: 'import tensorflow as tf',
    summary: 'Full control over the step: forward under a tape, gradients, optimizer update.',
    use: 'GANs, multiple optimizers, gradient clipping or accumulation, unusual losses.',
    keywords: 'gradienttape train_step gradient apply_gradients clip custom loop persistent',
    snippets: [{
      title: 'Compiled training step',
      code: `loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
opt = tf.keras.optimizers.Adam(1e-3)
acc = tf.keras.metrics.SparseCategoricalAccuracy()

@tf.function
def train_step(x, y):
    with tf.GradientTape() as tape:
        logits = model(x, training=True)          # training=True turns on dropout / BN updates
        loss = loss_fn(y, logits) + tf.add_n(model.losses or [0.0])  # regularisation losses
    grads = tape.gradient(loss, model.trainable_variables)
    grads, _ = tf.clip_by_global_norm(grads, 1.0)
    opt.apply_gradients(zip(grads, model.trainable_variables))
    acc.update_state(y, logits)
    return loss

for epoch in range(10):
    acc.reset_state()
    for x, y in train_ds:
        loss = train_step(x, y)
    print(epoch, float(loss), float(acc.result()))`,
    }, {
      title: 'Override train_step inside Keras fit()',
      code: `class MyModel(tf.keras.Model):
    def train_step(self, data):
        x, y = data
        with tf.GradientTape() as tape:
            y_pred = self(x, training=True)
            loss = self.compute_loss(y=y, y_pred=y_pred)
        grads = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        for m in self.metrics:
            if m.name == 'loss': m.update_state(loss)
            else: m.update_state(y, y_pred)
        return {m.name: m.result() for m in self.metrics}`,
    }],
    tips: [
      'Call the model with `training=True` in training and `False` in evaluation.',
      '`tape.gradient` returns `None` for variables not connected to the loss; check for it.',
      'Use `persistent=True` only when you need several `tape.gradient` calls; free it afterwards.',
    ],
  },
  {
    id: 'tf-function', name: 'tf.function & graph mode', section: 'Keras · Training', lib: KR, import: 'import tensorflow as tf',
    summary: 'Trace Python into a graph for speed; retracing and Python side effects are the traps.',
    keywords: 'tf.function graph autograph retrace input_signature jit_compile xla eager debug',
    params: [
      ['input_signature', 'None', '`[tf.TensorSpec([None, 10], tf.float32)]`', 'Fixes shapes/dtypes so it traces once.'],
      ['jit_compile', 'None', 'True / False', 'XLA-compile for speed; needs static-friendly ops.'],
      ['reduce_retracing', 'False', 'True / False', 'Relax shapes after the first retrace.'],
    ],
    tables: [{
      title: 'Pitfalls',
      head: ['Problem', 'Cause', 'Fix'],
      rows: [
        ['`print` runs once', 'Python code only executes during tracing', 'Use `tf.print`.'],
        ['Retracing warning', 'New Python values or shapes on each call', 'Pass tensors, set `input_signature`.'],
        ['Variable created on non-first call', 'Creating `tf.Variable` inside the function', 'Create variables outside.'],
        ['Python list grows', 'Appends happen at trace time', 'Use `tf.TensorArray`.'],
        ['Cannot debug', 'Graph hides breakpoints', '`tf.config.run_functions_eagerly(True)`.'],
      ],
    }],
  },
  {
    id: 'tf-custom-layer', name: 'Custom layers & models (TF)', section: 'Keras · Layers', lib: KR, import: 'import tensorflow as tf\nfrom tensorflow import keras',
    summary: 'Subclass Layer for new blocks (build/call/get_config) and Model for new training behaviour.',
    keywords: 'subclass layer build call get_config add_weight serialization register_keras_serializable',
    snippets: [{
      title: 'Layer with weights',
      code: `@keras.saving.register_keras_serializable()
class Dense2(keras.layers.Layer):
    def __init__(self, units, **kwargs):
        super().__init__(**kwargs)
        self.units = units

    def build(self, input_shape):                 # runs once, when the input shape is known
        self.w = self.add_weight(shape=(input_shape[-1], self.units), initializer='glorot_uniform', trainable=True)
        self.b = self.add_weight(shape=(self.units,), initializer='zeros')

    def call(self, x, training=None):
        return tf.nn.relu(x @ self.w + self.b)

    def get_config(self):                         # needed to save / reload the model
        return {**super().get_config(), 'units': self.units}`,
    }, {
      title: 'Functional and subclassed model',
      code: `inputs = keras.Input(shape=(32,))
x = Dense2(64)(inputs)
outputs = keras.layers.Dense(10, activation='softmax')(x)
model = keras.Model(inputs, outputs)

class Net(keras.Model):
    def __init__(self):
        super().__init__()
        self.body = keras.Sequential([keras.layers.Dense(64, 'relu'), keras.layers.Dense(10)])
    def call(self, x, training=False):
        return self.body(x, training=training)`,
    }],
  },
  {
    id: 'tf-distribute', name: 'tf.distribute & mixed precision', section: 'Keras · Training', lib: KR, import: 'import tensorflow as tf',
    summary: 'Scale to several GPUs/TPUs and speed up with float16/bfloat16.',
    keywords: 'mirroredstrategy multi gpu tpu parameterserver mixed_float16 mixed_bfloat16 loss scale',
    tables: [{
      title: 'Strategies',
      head: ['Strategy', 'Use for', 'Note'],
      rows: [
        ['`MirroredStrategy()`', 'One machine, several GPUs', 'Synchronous data parallel; scale batch size and LR by replicas.'],
        ['`MultiWorkerMirroredStrategy()`', 'Several machines', 'Needs `TF_CONFIG` on each worker.'],
        ['`TPUStrategy(resolver)`', 'Cloud TPU', 'Use `drop_remainder=True` for static shapes.'],
        ['`ParameterServerStrategy`', 'Very large asynchronous training', 'Rarely needed.'],
        ['`get_strategy()` (default)', 'Single device', 'No-op strategy.'],
      ],
    }],
    snippets: [{
      title: 'Multi-GPU and mixed precision',
      code: `tf.keras.mixed_precision.set_global_policy('mixed_float16')   # 'mixed_bfloat16' on TPU / Ampere+

strategy = tf.distribute.MirroredStrategy()
print('replicas:', strategy.num_replicas_in_sync)
with strategy.scope():                              # create model, optimizer, metrics inside
    model = build_model()
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3 * strategy.num_replicas_in_sync),
                  loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(train_ds.batch(64 * strategy.num_replicas_in_sync), epochs=5)

# Keep the final layer in float32 under mixed precision
# layers.Dense(10, dtype='float32')`,
    }],
  },
  {
    id: 'tf-transfer', name: 'Pretrained models (keras.applications / TF Hub)', section: 'Keras · Training', lib: KR, import: 'import tensorflow as tf',
    summary: 'Reuse ImageNet backbones: freeze, add a head, then fine-tune the top layers.',
    use: 'Image tasks with little data.',
    keywords: 'resnet mobilenet efficientnet transfer learning fine-tune freeze include_top preprocess_input hub',
    params: [
      ['weights', "'imagenet'", "'imagenet' / None / path", 'None trains from scratch.'],
      ['include_top', 'True', 'True / False', '`False` drops the ImageNet classifier so you can add your own head.'],
      ['input_shape', 'model default (224, 224, 3)', 'tuple', 'Requires `include_top=False` to change.'],
      ['pooling', 'None', "None / 'avg' / 'max'", "'avg' gives a flat feature vector."],
      ['trainable', 'True', 'True / False', 'Set `base.trainable = False` to freeze; recompile after changing it.'],
    ],
    snippets: [{
      title: 'Freeze, train head, fine-tune',
      code: `base = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base.trainable = False

inputs = tf.keras.Input((224, 224, 3))
x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)   # each backbone has its own preprocess_input
x = base(x, training=False)                                        # keep BatchNorm in inference mode
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.2)(x)
outputs = tf.keras.layers.Dense(5)(x)
model = tf.keras.Model(inputs, outputs)
model.compile('adam', tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True), metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=5)

base.trainable = True                                              # stage 2: unfreeze the top layers
for layer in base.layers[:-30]: layer.trainable = False
model.compile(tf.keras.optimizers.Adam(1e-5), tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True), metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=5)`,
    }],
  },
  {
    id: 'tf-export', name: 'SavedModel, TFLite & TF Serving', section: 'Keras · Deploy', lib: KR, import: 'import tensorflow as tf',
    summary: 'Export for servers, mobile, browsers.',
    keywords: 'savedmodel tflite quantization serving tfjs checkpoint export signature convert',
    tables: [{
      title: 'Formats',
      head: ['Format', 'How', 'Use for'],
      rows: [
        ['`.keras` file', '`model.save("m.keras")` / `keras.models.load_model`', 'Reloading in Python with architecture, weights, optimizer.'],
        ['Weights only', '`model.save_weights("m.weights.h5")`', 'Checkpoints; rebuild the model first.'],
        ['SavedModel', '`model.export("saved_model_dir")`', 'TF Serving, tf.saved_model.load; inference only.'],
        ['TFLite', '`tf.lite.TFLiteConverter.from_saved_model(dir)`', 'Mobile / edge; add `optimizations=[tf.lite.Optimize.DEFAULT]` to quantize.'],
        ['TF.js', '`tensorflowjs_converter` CLI', 'Browser.'],
        ['`tf.train.Checkpoint`', '`ckpt.save(path)`, `ckpt.restore(path)`', 'Custom loops (model + optimizer state).'],
      ],
    }],
    snippets: [{
      title: 'Export and run TFLite',
      code: `model.export('export/saved_model')

converter = tf.lite.TFLiteConverter.from_saved_model('export/saved_model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]       # dynamic-range quantization
open('model.tflite', 'wb').write(converter.convert())

interp = tf.lite.Interpreter(model_path='model.tflite')
interp.allocate_tensors()
inp, out = interp.get_input_details()[0], interp.get_output_details()[0]
interp.set_tensor(inp['index'], x[:1].astype('float32'))
interp.invoke()
print(interp.get_tensor(out['index']))`,
    }],
    tips: ['Keras 3: use `model.export()` for SavedModel; `model.save()` writes `.keras`.'],
  },
  {
    id: 'tf-debug-perf', name: 'TensorBoard, profiling & reproducibility', section: 'Keras · Training', lib: KR, import: 'import tensorflow as tf',
    summary: 'Logging, speed checks and deterministic runs.',
    keywords: 'tensorboard profiler seed determinism memory growth xla nan check_numerics',
    tables: [{
      title: 'Snippets',
      head: ['Goal', 'Code', 'Note'],
      rows: [
        ['TensorBoard logs', '`keras.callbacks.TensorBoard("logs", histogram_freq=1, profile_batch="10,20")`', '`tensorboard --logdir logs`.'],
        ['Custom scalars', '`with tf.summary.create_file_writer("logs").as_default(): tf.summary.scalar("loss", v, step)`', 'For custom loops.'],
        ['Seed everything', '`keras.utils.set_random_seed(42)`', 'Seeds Python, NumPy and TF.'],
        ['Deterministic ops', '`tf.config.experimental.enable_op_determinism()`', 'Slower; some ops error out.'],
        ['GPU memory', '`tf.config.experimental.set_memory_growth(gpu, True)`', 'Call before any GPU use.'],
        ['Find NaNs', '`tf.debugging.enable_check_numerics()`', 'Slow; for debugging only.'],
        ['Assert shapes', '`tf.debugging.assert_shapes([(x, ("N", 3))])`', ''],
        ['Quiet logs', '`os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"`', 'Set before importing TF.'],
      ],
    }],
  },
]
