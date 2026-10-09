import Papa from "papaparse";
import type { Dataset } from "./dataset";
import { inferColumns, normalizeRows } from "./columns";

function buildDataset(parsed: Record<string, string>[]): Dataset {
  const rows = normalizeRows(parsed);
  const columns = inferColumns(rows);
  const rowIds = rows.map((_, i) => String(i));
  return { columns, rows, rowIds };
}

export function parseCsvText(text: string): Dataset {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const fatal = result.errors.filter((e) => e.type !== "Delimiter");
  if (fatal.length > 0) {
    const msg = fatal.map((e) => e.message).join("; ");
    throw new Error(`CSV parse error: ${msg}`);
  }
  if (!result.data.length) {
    throw new Error("CSV appears empty or has no data rows.");
  }
  return buildDataset(result.data);
}

export function parseCsvFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors.map((e) => e.message).join("; ")));
          return;
        }
        if (!result.data.length) {
          reject(new Error("CSV appears empty or has no data rows."));
          return;
        }
        resolve(buildDataset(result.data));
      },
      error: (err) => reject(err),
    });
  });
}
