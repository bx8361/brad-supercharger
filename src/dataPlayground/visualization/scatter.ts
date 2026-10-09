import type { Data, Layout } from "plotly.js";
import type { Dataset } from "../data/dataset";
import { buildHoverText, type HoverMeta, renderPlot } from "./plot";
import { toNumericOrNull } from "../utils/numbers";

export function renderScatter(
  container: HTMLElement,
  dataset: Dataset,
  xCol: string,
  yCol: string,
  colorCol: string | null,
  onClick?: (rowIndex: number) => void,
): void {
  const groups = new Map<string, number[]>();
  dataset.rows.forEach((row, i) => {
    const key = colorCol ? String(row[colorCol] ?? "—") : "__all__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  });
  const traces: Data[] = [];
  for (const [name, indices] of groups) {
    const x: number[] = [];
    const y: number[] = [];
    const meta: HoverMeta[] = [];
    for (const i of indices) {
      const row = dataset.rows[i];
      const xv = toNumericOrNull(row[xCol]);
      const yv = toNumericOrNull(row[yCol]);
      if (xv === null || yv === null) continue;
      x.push(xv);
      y.push(yv);
      meta.push({
        rowIndex: i,
        label: `Sample #${i}`,
        extra: {
          [xCol]: String(xv),
          [yCol]: String(yv),
          ...(colorCol ? { [colorCol]: String(row[colorCol]) } : {}),
        },
      });
    }
    traces.push({
      type: "scatter",
      mode: "markers",
      name: name === "__all__" ? "samples" : name,
      x,
      y,
      text: buildHoverText(meta),
      customdata: meta.map((m) => m.rowIndex),
      hoverinfo: "text",
      marker: { size: 8, opacity: 0.85 },
    });
  }
  const layout: Partial<Layout> = {
    xaxis: { title: { text: xCol } },
    yaxis: { title: { text: yCol } },
  };
  renderPlot(container, traces, layout, onClick);
}
