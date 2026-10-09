export function isMissingToken(raw: string): boolean {
  const t = raw.trim();
  if (t === "") return true;
  const upper = t.toUpperCase();
  return (
    upper === "NA" ||
    upper === "N/A" ||
    upper === "NULL" ||
    upper === "NAN" ||
    t === "?"
  );
}

export function toNumericOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const s = String(value).trim();
  if (isMissingToken(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function sanitizeFinite(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
