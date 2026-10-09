import Plotly from "plotly.js-dist-min";
import type { Data, Layout, Config, PlotMouseEvent, PlotlyHTMLElement } from "plotly.js";

const PLOT_CONFIG: Partial<Config> = {
  responsive: true,
  displaylogo: false,
  scrollZoom: true,
};

function isDark(): boolean {
  return getComputedStyle(document.documentElement).colorScheme === "dark";
}

export function baseLayout(title?: string): Partial<Layout> {
  const dark = isDark();
  return {
    title: title ? { text: title } : undefined,
    paper_bgcolor: dark ? "#1a1d21" : "#f8f9fa",
    plot_bgcolor: dark ? "#23272e" : "#ffffff",
    font: { color: dark ? "#e8eaed" : "#1f2933" },
    margin: { t: 48, r: 24, b: 48, l: 56 },
    xaxis: { gridcolor: dark ? "#3a3f47" : "#e5e7eb", zerolinecolor: dark ? "#555" : "#ccc" },
    yaxis: { gridcolor: dark ? "#3a3f47" : "#e5e7eb", zerolinecolor: dark ? "#555" : "#ccc" },
  };
}

export function renderPlot(
  container: HTMLElement,
  data: Data[],
  layout: Partial<Layout>,
  onClick?: (pointIndex: number) => void,
): void {
  const fullLayout = { ...baseLayout(), ...layout };
  void Plotly.react(container, data, fullLayout, PLOT_CONFIG).then(() => {
    if (!container.isConnected) { Plotly.purge(container); return; }
    (container as PlotlyHTMLElement).removeAllListeners?.("plotly_click");
    if (onClick) {
      const el = container as PlotlyHTMLElement;
      el.on("plotly_click", (ev: PlotMouseEvent) => {
        const pt = ev.points?.[0];
        if (pt && typeof pt.customdata === "number") {
          onClick(pt.customdata);
          return;
        }
        if (pt && typeof pt.pointIndex === "number") {
          onClick(pt.pointIndex);
        } else if (pt && typeof pt.pointNumber === "number") {
          onClick(pt.pointNumber);
        }
      });
    }
  });
}

export function purgePlot(container?: HTMLElement): void {
  if (container) Plotly.purge(container);
}

export function exportPng(container: HTMLElement, filename: string): void {
  Plotly.downloadImage(container, {
    format: "png",
    filename,
    width: 1200,
    height: 800,
  });
}

export interface HoverMeta {
  rowIndex: number;
  label: string;
  extra: Record<string, string>;
}

export function buildHoverText(meta: HoverMeta[]): string[] {
  return meta.map((m) => {
    const lines = [m.label, ...Object.entries(m.extra).map(([k, v]) => `${k}: ${v}`)];
    return lines.join("<br>");
  });
}
