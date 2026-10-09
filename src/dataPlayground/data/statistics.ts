import { toNumericOrNull } from "../utils/numbers";

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function variance(values: number[], sample = true): number {
  if (values.length === 0) return NaN;
  const m = mean(values);
  let sum = 0;
  for (const v of values) sum += (v - m) ** 2;
  const denom = sample ? values.length - 1 : values.length;
  return denom > 0 ? sum / denom : 0;
}

export function stdDev(values: number[], sample = true): number {
  const v = variance(values, sample);
  return Math.sqrt(v);
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function min(values: number[]): number {
  if (values.length === 0) return NaN;
  return Math.min(...values);
}

export function max(values: number[]): number {
  if (values.length === 0) return NaN;
  return Math.max(...values);
}

export interface NumericSummary {
  count: number;
  missing: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  q25: number;
  q50: number;
  q75: number;
  max: number;
}

export function summarizeColumn(
  rows: Record<string, string | number | null>[],
  column: string,
): NumericSummary {
  const nums: number[] = [];
  let missing = 0;
  for (const row of rows) {
    const n = toNumericOrNull(row[column]);
    if (n === null) missing++;
    else nums.push(n);
  }
  return {
    count: nums.length,
    missing,
    mean: mean(nums),
    median: median(nums),
    stdDev: stdDev(nums),
    min: min(nums),
    q25: quantile(nums, 0.25),
    q50: quantile(nums, 0.5),
    q75: quantile(nums, 0.75),
    max: max(nums),
  };
}
