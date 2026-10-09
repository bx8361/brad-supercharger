import type { ColumnInfo, DataRow } from "./dataset";
import { isMissingToken, toNumericOrNull } from "../utils/numbers";

const ID_HEURISTIC = /^(id|index|row|uuid)$/i;

export function isLikelyIdentifierColumn(name: string): boolean {
  const base = name.trim();
  if (ID_HEURISTIC.test(base)) return true;
  if (base.toLowerCase().endsWith("_id")) return true;
  return false;
}

export function inferColumns(rows: Record<string, unknown>[]): ColumnInfo[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((name) => {
    let nonEmpty = 0;
    let numericOk = 0;
    const values = new Set<string>();
    for (const row of rows) {
      const raw = row[name];
      if (raw === null || raw === undefined || String(raw).trim() === "") {
        continue;
      }
      nonEmpty++;
      values.add(String(raw));
      if (toNumericOrNull(raw) !== null) numericOk++;
    }
    const ratio = nonEmpty === 0 ? 0 : numericOk / nonEmpty;
    let type: "numeric" | "categorical" = ratio >= 0.95 ? "numeric" : "categorical";
    if (type === "numeric" && isLikelyIdentifierColumn(name)) {
      type = "categorical";
    }
    let missingCount = 0;
    for (const row of rows) {
      const v = row[name];
      if (v === null || v === undefined || String(v).trim() === "") missingCount++;
      else if (toNumericOrNull(v) === null && type === "numeric") missingCount++;
    }
    return {
      name,
      type,
      missingCount,
      uniqueCount: values.size,
    };
  });
}

export function getNumericColumns(columns: ColumnInfo[]): ColumnInfo[] {
  return columns.filter((c) => c.type === "numeric");
}

export function getCategoricalColumns(columns: ColumnInfo[]): ColumnInfo[] {
  return columns.filter((c) => c.type === "categorical");
}

export function normalizeRows(
  parsed: Record<string, string>[],
): DataRow[] {
  return parsed.map((row) => {
    const out: DataRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === undefined || value === "" || isMissingToken(String(value))) {
        out[key] = null;
        continue;
      }
      const n = toNumericOrNull(value);
      out[key] = n !== null ? n : value;
    }
    return out;
  });
}
