export function downloadText(filename: string, content: string, mime = "text/csv"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function matrixToCsv(matrix: { labels: string[]; values: number[][] }): string {
  const header = ["", ...matrix.labels].join(",");
  const rows = matrix.labels.map((label, i) => {
    const cells = matrix.values[i].map((v) => String(v));
    return [label, ...cells].join(",");
  });
  return [header, ...rows].join("\n");
}

export function rowsToCsv(
  headers: string[],
  rows: (string | number | null)[][],
): string {
  const escape = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}
