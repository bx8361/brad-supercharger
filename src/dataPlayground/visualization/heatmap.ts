import type { Data, Layout } from "plotly.js";
import type { MatrixResult } from "../analysis/types";
import { renderPlot } from "./plot";

export function renderHeatmap(
  container: HTMLElement,
  matrix: MatrixResult,
  title: string,
  valueLabel: (a: string, b: string, v: number) => string,
  colorscale: "RdBu" | "Viridis" = "RdBu",
  zmin?: number,
  zmax?: number,
): void {
  const customdata: string[][] = [];
  for (let i = 0; i < matrix.labels.length; i++) {
    const row: string[] = [];
    for (let j = 0; j < matrix.labels.length; j++) {
      row.push(valueLabel(matrix.labels[i], matrix.labels[j], matrix.values[i][j]));
    }
    customdata.push(row);
  }
  const trace: Data = {
    type: "heatmap",
    z: matrix.values,
    x: matrix.labels,
    y: matrix.labels,
    colorscale,
    zmin,
    zmax,
    hovertemplate: "%{customdata}<extra></extra>",
    customdata,
  };
  const layout: Partial<Layout> = { title: { text: title } };
  renderPlot(container, [trace], layout);
}
