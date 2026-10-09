import type { Dataset } from "../data/dataset";

export function countSelectedNumericFeatures(
  dataset: Dataset,
  selected: string[],
): number {
  const numeric = new Set(
    dataset.columns.filter((c) => c.type === "numeric").map((c) => c.name),
  );
  return selected.filter((n) => numeric.has(n)).length;
}

export function validatePca(
  dataset: Dataset,
  selected: string[],
): string | null {
  if (!dataset.rows.length) return "Load a dataset before running PCA.";
  if (dataset.rows.length < 2) return "PCA requires at least two rows.";
  const n = countSelectedNumericFeatures(dataset, selected);
  if (n < 2) {
    return "PCA requires at least two numeric features. Select another numeric column before running PCA.";
  }
  return null;
}

export function validateCorrelation(
  dataset: Dataset,
  selected: string[],
): string | null {
  const n = countSelectedNumericFeatures(dataset, selected);
  if (n < 2) {
    return "Correlation requires at least two numeric features.";
  }
  return null;
}

export function validateSimilarity(
  dataset: Dataset,
  selected: string[],
  rowCount: number,
): string | null {
  if (rowCount < 2) return "Similarity requires at least two samples.";
  const n = countSelectedNumericFeatures(dataset, selected);
  if (n < 1) return "Similarity requires at least one numeric feature.";
  if (rowCount > 2000) {
    return `Similarity matrices grow quadratically.\n\nSelected samples: ${rowCount}\nRequired comparisons: ~${(
      (rowCount * (rowCount - 1)) /
      2
    ).toLocaleString()}\n\nPlease filter or sample the dataset first (maximum 2,000 rows).`;
  }
  if (rowCount > 500) {
    return `Warning: ${rowCount} samples will produce a large heatmap. Consider using fewer rows for readability.`;
  }
  return null;
}

export function validateDistance(
  dataset: Dataset,
  selected: string[],
  rowCount: number,
): string | null {
  if (rowCount < 2) return "Distance requires at least two samples.";
  const n = countSelectedNumericFeatures(dataset, selected);
  if (n < 1) return "Distance requires at least one numeric feature.";
  if (rowCount > 2000) {
    return `Distance matrices grow quadratically.\n\nSelected samples: ${rowCount}\nRequired comparisons: ~${(
      (rowCount * (rowCount - 1)) /
      2
    ).toLocaleString()}\n\nPlease filter or sample the dataset first (maximum 2,000 rows).`;
  }
  if (rowCount > 500) {
    return `Warning: ${rowCount} samples will produce a large heatmap. Consider using fewer rows for readability.`;
  }
  return null;
}

export function validateKMeans(
  dataset: Dataset,
  selected: string[],
  k: number,
  rowCount: number,
): string | null {
  const n = countSelectedNumericFeatures(dataset, selected);
  if (n < 1) return "K-means requires at least one numeric feature.";
  if (k < 2) return "K must be at least 2.";
  if (k >= rowCount) {
    return "K must be less than the number of samples after preprocessing.";
  }
  return null;
}
