import type { Dataset } from "./dataset";
import { mean, median, stdDev } from "./statistics";
import { toNumericOrNull } from "../utils/numbers";

export interface PreprocessingOptions {
  missingStrategy: "drop" | "mean" | "median";
  standardize: boolean;
}

export interface FeatureMatrix {
  matrix: number[][];
  rowIndices: number[];
  featureNames: string[];
  warnings: string[];
}

export function buildFeatureMatrix(
  dataset: Dataset,
  columns: string[],
  options: PreprocessingOptions,
): FeatureMatrix {
  const warnings: string[] = [];
  const featureNames: string[] = [];
  const colValues: number[][] = columns.map((col) => {
    featureNames.push(col);
    const vals: number[] = [];
    for (const row of dataset.rows) {
      const n = toNumericOrNull(row[col]);
      vals.push(n === null ? NaN : n);
    }
    return vals;
  });

  const rowIndices: number[] = [];
  const matrix: number[][] = [];

  const imputeStats = columns.map((col, ci) => {
    const finite = colValues[ci].filter((v) => Number.isFinite(v));
    return {
      mean: mean(finite),
      median: median(finite),
    };
  });

  for (let ri = 0; ri < dataset.rows.length; ri++) {
    const row: number[] = [];
    let hasMissing = false;
    for (let ci = 0; ci < columns.length; ci++) {
      let v = colValues[ci][ri];
      if (!Number.isFinite(v)) {
        hasMissing = true;
        if (options.missingStrategy === "mean") {
          v = imputeStats[ci].mean;
        } else if (options.missingStrategy === "median") {
          v = imputeStats[ci].median;
        }
      }
      row.push(v);
    }
    if (options.missingStrategy === "drop" && hasMissing) {
      continue;
    }
    if (row.every((v) => Number.isFinite(v))) {
      matrix.push(row);
      rowIndices.push(ri);
    }
  }

  if (options.missingStrategy === "drop") {
    const dropped = dataset.rows.length - rowIndices.length;
    if (dropped > 0) {
      warnings.push(`${dropped} rows removed because of missing values.`);
    }
  }

  const keepIndices: number[] = [];
  const finalNames: string[] = [];
  for (let ci = 0; ci < columns.length; ci++) {
    const col = matrix.map((r) => r[ci]);
    const sd = stdDev(col);
    if (sd === 0 || !Number.isFinite(sd)) {
      warnings.push(`Removed constant feature: ${columns[ci]}`);
      continue;
    }
    keepIndices.push(ci);
    finalNames.push(columns[ci]);
  }

  let reduced = matrix.map((row) => keepIndices.map((i) => row[i]));

  if (options.standardize && reduced.length > 0 && finalNames.length > 0) {
    for (let ci = 0; ci < finalNames.length; ci++) {
      const col = reduced.map((r) => r[ci]);
      const m = mean(col);
      const s = stdDev(col);
      if (s === 0 || !Number.isFinite(s)) continue;
      for (let ri = 0; ri < reduced.length; ri++) {
        reduced[ri][ci] = (reduced[ri][ci] - m) / s;
      }
    }
    warnings.push(`${finalNames.length} features standardized using z-scores.`);
  }

  for (const row of reduced) {
    for (const v of row) {
      if (!Number.isFinite(v)) {
        throw new Error("Invalid numeric value after preprocessing.");
      }
    }
  }

  return {
    matrix: reduced,
    rowIndices,
    featureNames: finalNames,
    warnings,
  };
}

export function countMissingInFeatures(
  dataset: Dataset,
  columns: string[],
): number {
  let count = 0;
  for (const row of dataset.rows) {
    for (const col of columns) {
      if (toNumericOrNull(row[col]) === null) count++;
    }
  }
  return count;
}
