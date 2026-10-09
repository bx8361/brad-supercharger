import { PCA } from "ml-pca";
import type { FeatureMatrix } from "../data/preprocessing";
import type { PCAResult } from "./types";

export function runPCA(
  input: FeatureMatrix,
  components = 2,
): PCAResult {
  const { matrix, rowIndices, featureNames } = input;
  if (matrix.length < 2 || featureNames.length < 2) {
    throw new Error("PCA requires at least 2 rows and 2 features.");
  }
  const nComp = Math.min(components, featureNames.length, matrix.length);
  const pca = new PCA(matrix, { center: true, scale: false });
  const projected = pca.predict(matrix, { nComponents: nComp });
  const coordinates: number[][] = [];
  for (let i = 0; i < projected.rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < nComp; j++) {
      row.push(projected.get(i, j));
    }
    coordinates.push(row);
  }
  const explainedVariance = pca.getExplainedVariance().slice(0, nComp);
  const cumulativeVariance = pca.getCumulativeVariance().slice(0, nComp);
  const loadingsMatrix = pca.getLoadings();
  const loadings: number[][] = [];
  for (let f = 0; f < featureNames.length; f++) {
    const row: number[] = [];
    for (let c = 0; c < nComp; c++) {
      row.push(loadingsMatrix.get(f, c));
    }
    loadings.push(row);
  }
  return {
    coordinates,
    explainedVariance,
    cumulativeVariance,
    loadings,
    featureNames,
    rowIndices,
  };
}
