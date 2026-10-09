import type { Data } from "plotly.js";
import type { Dataset } from "../data/dataset";
import type { KMeansResult } from "../analysis/types";
import { buildHoverText, type HoverMeta, renderPlot } from "./plot";
import { toNumericOrNull } from "../utils/numbers";

export function renderClusterScatter(
  container: HTMLElement,
  kmeans: KMeansResult,
  dataset: Dataset,
  onClick?: (rowIndex: number) => void,
): void {
  const groups = new Map<number, number[]>();
  kmeans.rowIndices.forEach((orig, i) => {
    const c = kmeans.clusters[i];
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(i);
  });

  let xCol: string;
  let yCol: string;
  let getXY: (pi: number) => [number, number];
  let axisX = "";
  let axisY = "";

  if (kmeans.featureNames.length === 2) {
    xCol = kmeans.featureNames[0];
    yCol = kmeans.featureNames[1];
    getXY = (pi) => {
      const orig = kmeans.rowIndices[pi];
      const row = dataset.rows[orig];
      return [
        toNumericOrNull(row[xCol]) ?? 0,
        toNumericOrNull(row[yCol]) ?? 0,
      ];
    };
    axisX = xCol;
    axisY = yCol;
  } else if (kmeans.projection) {
    getXY = (pi) => {
      const c = kmeans.projection!.coordinates[pi];
      return [c[0], c[1]];
    };
    axisX = "PC1";
    axisY = "PC2";
  } else {
    return;
  }

  const traces: Data[] = [];
  for (const [cluster, indices] of groups) {
    const x: number[] = [];
    const y: number[] = [];
    const meta: HoverMeta[] = [];
    for (const pi of indices) {
      const [xv, yv] = getXY(pi);
      const orig = kmeans.rowIndices[pi];
      x.push(xv);
      y.push(yv);
      meta.push({
        rowIndex: orig,
        label: `Sample #${orig}`,
        extra: {
          Cluster: String(cluster),
          [axisX]: xv.toFixed(3),
          [axisY]: yv.toFixed(3),
        },
      });
    }
    traces.push({
      type: "scatter",
      mode: "markers",
      name: `Cluster ${cluster}`,
      x,
      y,
      text: buildHoverText(meta),
      customdata: meta.map((m) => m.rowIndex),
      hoverinfo: "text",
      marker: { size: 9 },
    });
  }
  renderPlot(
    container,
    traces,
    { xaxis: { title: { text: axisX } }, yaxis: { title: { text: axisY } } },
    onClick,
  );
}
