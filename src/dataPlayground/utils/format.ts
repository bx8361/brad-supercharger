export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1000 || (abs > 0 && abs < 0.001)) {
    return value.toExponential(digits);
  }
  return value.toFixed(digits);
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
