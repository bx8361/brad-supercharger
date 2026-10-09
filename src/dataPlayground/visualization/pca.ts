import type { Data, Layout } from "plotly.js";
import type { Dataset } from "../data/dataset";
import type { PCAResult } from "../analysis/types";
import { buildHoverText, type HoverMeta, renderPlot } from "./plot";

export function renderPCAScatter(
  container: HTMLElement,
  pca: PCAResult,
  dataset: Dataset,
  colorColumn: string | null,
  metadataColumns: string[],
  onClick?: (rowIndex: number) => void,
): void {
  const groups = new Map<string, number[]>();
  pca.rowIndices.forEach((origIdx, pi) => {
    const key = colorColumn
      ? String(dataset.rows[origIdx][colorColumn] ?? "—")
      : "__all__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pi);
  });
  const ev1 = (pca.explainedVariance[0] ?? 0) * 100;
  const ev2 = (pca.explainedVariance[1] ?? 0) * 100;
  const traces: Data[] = [];
  for (const [name, indices] of groups) {
    const x: number[] = [];
    const y: number[] = [];
    const meta: HoverMeta[] = [];
    for (const pi of indices) {
      const orig = pca.rowIndices[pi];
      const row = dataset.rows[orig];
      const coords = pca.coordinates[pi];
      x.push(coords[0]);
      y.push(coords[1]);
      const extra: Record<string, string> = {
        PC1: coords[0].toFixed(3),
        PC2: coords[1].toFixed(3),
      };
      for (const col of metadataColumns.slice(0, 5)) {
        extra[col] = String(row[col]);
      }
      meta.push({ rowIndex: orig, label: `Sample #${orig}`, extra });
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
      marker: { size: 9, opacity: 0.85 },
    });
  }
  renderPlot(
    container,
    traces,
    {
      xaxis: { title: { text: `PC1 (${ev1.toFixed(1)}%)` } },
      yaxis: { title: { text: `PC2 (${ev2.toFixed(1)}%)` } },
    },
    onClick,
  );
}

export function renderExplainedVariance(
  container: HTMLElement,
  pca: PCAResult,
): void {
  const labels = pca.explainedVariance.map((_, i) => `PC${i + 1}`);
  const pct = pca.explainedVariance.map((v) => v * 100);
  const cum = pca.cumulativeVariance.map((v) => v * 100);
  const traces: Data[] = [
    {
      type: "bar",
      name: "Explained %",
      x: labels,
      y: pct,
    },
    {
      type: "scatter",
      mode: "lines+markers",
      name: "Cumulative %",
      x: labels,
      y: cum,
      yaxis: "y2",
    },
  ];
  const layout: Partial<Layout> = {
    title: { text: "Explained variance" },
    yaxis: { title: { text: "Variance %" } },
    yaxis2: {
      title: { text: "Cumulative %" },
      overlaying: "y",
      side: "right",
    },
  };
  renderPlot(container, traces, layout);
}
