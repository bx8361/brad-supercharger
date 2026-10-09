import { distance as dist } from "ml-distance";
import type { MatrixResult } from "./types";

export function computeDistanceMatrix(
  matrix: number[][],
  metric: "euclidean" | "manhattan",
  labels: string[],
): MatrixResult {
  const n = matrix.length;
  const values: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(0);
        continue;
      }
      let d: number;
      if (metric === "euclidean") {
        d = dist.euclidean(matrix[i], matrix[j]);
      } else {
        d = dist.manhattan(matrix[i], matrix[j]);
      }
      row.push(Number.isFinite(d) ? d : 0);
    }
    values.push(row);
  }
  return { labels, values };
}
