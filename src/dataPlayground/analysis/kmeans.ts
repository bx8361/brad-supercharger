import { kmeans } from "ml-kmeans";
import type { FeatureMatrix } from "../data/preprocessing";
import type { KMeansOptions, KMeansResult } from "./types";
import { runPCA } from "./pca";

export function runKMeans(
  input: FeatureMatrix,
  options: KMeansOptions,
): KMeansResult {
  const { matrix, rowIndices, featureNames } = input;
  const result = kmeans(matrix, options.k, {
    maxIterations: options.maxIterations,
    initialization: "kmeans++",
    seed: options.seed,
  });
  const clusters = result.clusters;
  let projection;
  if (featureNames.length > 2) {
    projection = runPCA(input, 2);
  }
  return {
    clusters,
    centroids: result.centroids,
    iterations: result.iterations,
    converged: result.converged,
    rowIndices,
    featureNames,
    projection,
  };
}

export function kmeansInterpretation(kmeans: KMeansResult): string {
  const counts = new Map<number, number>();
  for (const c of kmeans.clusters) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const parts = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([c, n]) => `${n}`);
  return `K-means produced ${counts.size} clusters containing ${parts.join(", ")} samples.`;
}
