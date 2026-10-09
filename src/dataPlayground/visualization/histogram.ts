import type { Data, Layout } from "plotly.js";
import type { Dataset } from "../data/dataset";
import { renderPlot } from "./plot";
import { toNumericOrNull } from "../utils/numbers";

export function renderHistogram(
  container: HTMLElement,
  dataset: Dataset,
  column: string,
  colorCol: string | null,
): void {
  if (colorCol) {
    const groups = new Map<string, number[]>();
    for (const row of dataset.rows) {
      const key = String(row[colorCol] ?? "—");
      const v = toNumericOrNull(row[column]);
      if (v === null) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }
    const traces: Data[] = [...groups.entries()].map(([name, vals]) => ({
      type: "histogram",
      name,
      x: vals,
      opacity: 0.7,
    }));
    renderPlot(container, traces, {
      barmode: "overlay",
      xaxis: { title: { text: column } },
    });
    return;
  }
  const vals = dataset.rows
    .map((r) => toNumericOrNull(r[column]))
    .filter((v): v is number => v !== null);
  const trace: Data = { type: "histogram", x: vals };
  renderPlot(container, [trace], { xaxis: { title: { text: column } } });
}
