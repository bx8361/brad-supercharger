import type { Data } from "plotly.js";
import type { Dataset } from "../data/dataset";
import { renderPlot } from "./plot";
import { toNumericOrNull } from "../utils/numbers";

export function renderBoxPlot(
  container: HTMLElement,
  dataset: Dataset,
  column: string,
  groupColumn: string | null,
): void {
  if (groupColumn) {
    const groups = new Map<string, number[]>();
    for (const row of dataset.rows) {
      const key = String(row[groupColumn] ?? "—");
      const v = toNumericOrNull(row[column]);
      if (v === null) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }
    const traces: Data[] = [...groups.entries()].map(([name, vals]) => ({
      type: "box",
      name,
      y: vals,
    }));
    renderPlot(container, traces, { yaxis: { title: { text: column } } });
    return;
  }
  const vals = dataset.rows
    .map((r) => toNumericOrNull(r[column]))
    .filter((v): v is number => v !== null);
  renderPlot(container, [{ type: "box", y: vals }], {
    yaxis: { title: { text: column } },
  });
}

export function renderLineChart(
  container: HTMLElement,
  dataset: Dataset,
  xCol: string,
  yCol: string,
): void {
  const x: (string | number)[] = [];
  const y: number[] = [];
  dataset.rows.forEach((row, i) => {
    const yv = toNumericOrNull(row[yCol]);
    if (yv === null) return;
    const xv = row[xCol];
    x.push(xv === null || xv === undefined ? i : xv);
    y.push(yv);
  });
  renderPlot(
    container,
    [{ type: "scatter", mode: "lines+markers", x, y }],
    { xaxis: { title: { text: xCol } }, yaxis: { title: { text: yCol } } },
  );
}

export function renderBarChart(
  container: HTMLElement,
  dataset: Dataset,
  xCol: string,
  yCol: string,
): void {
  const x: (string | number)[] = [];
  const y: number[] = [];
  for (const row of dataset.rows) {
    const yv = toNumericOrNull(row[yCol]);
    if (yv === null) continue;
    x.push(row[xCol] ?? "");
    y.push(yv);
  }
  renderPlot(
    container,
    [{ type: "bar", x, y }],
    { xaxis: { title: { text: xCol } }, yaxis: { title: { text: yCol } } },
  );
}
