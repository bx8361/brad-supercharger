import { similarity } from "ml-distance";
import type { MatrixResult } from "./types";
import { stdDev } from "../data/statistics";

function columnVectors(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const cols = matrix[0].length;
  const out: number[][] = [];
  for (let c = 0; c < cols; c++) {
    out.push(matrix.map((row) => row[c]));
  }
  return out;
}

export function computeCorrelationMatrix(
  matrix: number[][],
  labels: string[],
): MatrixResult {
  const cols = columnVectors(matrix);
  const n = cols.length;
  const values: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(1);
        continue;
      }
      const sdI = stdDev(cols[i]);
      const sdJ = stdDev(cols[j]);
      if (sdI === 0 || sdJ === 0) {
        row.push(0);
      } else {
        const r = similarity.pearson(cols[i], cols[j]);
        row.push(Number.isFinite(r) ? r : 0);
      }
    }
    values.push(row);
  }
  return { labels, values };
}

export function strongestCorrelation(matrix: MatrixResult): {
  a: string;
  b: string;
  r: number;
} | null {
  let best: { a: string; b: string; r: number } | null = null;
  const { labels, values } = matrix;
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const r = values[i][j];
      if (!Number.isFinite(r)) continue;
      if (!best || Math.abs(r) > Math.abs(best.r)) {
        best = { a: labels[i], b: labels[j], r };
      }
    }
  }
  return best;
}

export function correlationInterpretation(matrix: MatrixResult): string {
  const best = strongestCorrelation(matrix);
  if (!best) return "No correlation pairs available.";
  return `The strongest absolute correlation is ${best.a} ↔ ${best.b}: r = ${best.r.toFixed(2)}.`;
}
