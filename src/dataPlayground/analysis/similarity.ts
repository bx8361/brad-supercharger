import { similarity } from "ml-distance";
import type { MatrixResult } from "./types";

export function computeSimilarityMatrix(
  matrix: number[][],
  metric: "cosine" | "pearson",
  labels: string[],
): MatrixResult {
  const n = matrix.length;
  const values: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(1);
        continue;
      }
      let sim: number;
      if (metric === "cosine") {
        sim = similarity.cosine(matrix[i], matrix[j]);
      } else {
        sim = similarity.pearson(matrix[i], matrix[j]);
      }
      row.push(Number.isFinite(sim) ? sim : 0);
    }
    values.push(row);
  }
  return { labels, values };
}
