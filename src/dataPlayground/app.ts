import {
  getState,
  patchState,
  selectRow,
  setDataset,
  setMainView,
  setSelectedFeatures,
} from "./state";
import { parseCsvFile, parseCsvText } from "./data/csv";
import { loadSample } from "./data/sample-data";
import { getCategoricalColumns, getNumericColumns } from "./data/columns";
import { buildFeatureMatrix, countMissingInFeatures } from "./data/preprocessing";
import { summarizeColumn } from "./data/statistics";
import { runPCA } from "./analysis/pca";
import {
  computeCorrelationMatrix,
  correlationInterpretation,
} from "./analysis/correlation";
import { computeSimilarityMatrix } from "./analysis/similarity";
import { computeDistanceMatrix } from "./analysis/distance";
import { kmeansInterpretation, runKMeans } from "./analysis/kmeans";
import type { AnalysisResult, AnalysisState } from "./analysis/types";
import {
  validateCorrelation,
  validateDistance,
  validateKMeans,
  validatePca,
  validateSimilarity,
} from "./utils/validation";
import { formatNumber, formatPercent } from "./utils/format";
import { renderDataTable } from "./ui/table";
import { showToast } from "./ui/notifications";
import { renderPCAScatter, renderExplainedVariance } from "./visualization/pca";
import { renderHeatmap } from "./visualization/heatmap";
import { renderClusterScatter } from "./visualization/clusters";
import { renderScatter } from "./visualization/scatter";
import { renderHistogram } from "./visualization/histogram";
import { renderBoxPlot, renderBarChart, renderLineChart } from "./visualization/box";
import { exportPng, purgePlot } from "./visualization/plot";
import { downloadText, matrixToCsv, rowsToCsv } from "./utils/export";
import { subscribeLocale, t } from "../i18n.js";

let appRoot: HTMLElement | null = null;
let onViewChange: (view: "data" | "analyze" | "visualize") => void;
let onEditorHost: (host: HTMLElement | null) => void;
let readCsv: () => string;
const find = (id: string) => appRoot?.querySelector<HTMLElement>(`#${id}`) ?? null;
let chartEl: HTMLElement;
let chartSecondaryEl: HTMLElement;
let toastRoot: HTMLElement;

function defaultStandardize(kind: AnalysisState): boolean {
  if (kind.kind === "similarity" && kind.metric === "cosine") return false;
  if (kind.kind === "correlation" || kind.kind === "descriptive") return false;
  return true;
}

export function runAnalysis(): void {
  const state = getState();
  const dataset = state.dataset;
  if (!dataset) {
    showToast(toastRoot, t("Load a dataset first."), "error");
    return;
  }
  const analysis = state.analysis;
  const features = state.selectedFeatures;
  let standardize = state.preprocessing.standardize;
  if (analysis.kind === "visualize") {
    patchState({
      result: {
        kind: "visualize",
        chartType: analysis.chartType,
        xColumn: analysis.xColumn,
        yColumn: analysis.yColumn,
        colorColumn: analysis.colorColumn,
        interpretation: t("Direct visualization of raw data."),
        warnings: [],
      },
    });
    renderCharts();
    return;
  }

  standardize = standardize ?? defaultStandardize(analysis);
  const matrixOpts = {
    missingStrategy: state.preprocessing.missingStrategy,
    standardize,
  };

  try {
    if (analysis.kind === "descriptive") {
      const summaries: Record<string, ReturnType<typeof summarizeColumn>> = {};
      for (const col of features) {
        summaries[col] = summarizeColumn(dataset.rows, col);
      }
      patchState({
        result: {
          kind: "descriptive",
          summaries,
          interpretation: `Descriptive statistics for ${features.length} numeric features.`,
          warnings: [],
        },
      });
      renderCharts();
      return;
    }

    const errPca = analysis.kind === "pca" ? validatePca(dataset, features) : null;
    if (errPca) throw new Error(errPca);
    const errCorr =
      analysis.kind === "correlation" ? validateCorrelation(dataset, features) : null;
    if (errCorr) throw new Error(errCorr);

    const fm = buildFeatureMatrix(dataset, features, matrixOpts);
    const warnings = [...fm.warnings];
    const rowCount = fm.matrix.length;

    if (analysis.kind === "similarity") {
      const err = validateSimilarity(dataset, features, rowCount);
      if (err?.includes("maximum")) throw new Error(err);
      if (err?.startsWith("Warning")) warnings.push(err);
      const labels = fm.rowIndices.map((i) => dataset.rowIds[i] ?? String(i));
      const matrix = computeSimilarityMatrix(fm.matrix, analysis.metric, labels);
      patchState({
        result: {
          kind: "similarity",
          matrix,
          metric: analysis.metric,
          interpretation: `${analysis.metric} similarity matrix for ${rowCount} samples.`,
          warnings,
        },
      });
    } else if (analysis.kind === "distance") {
      const err = validateDistance(dataset, features, rowCount);
      if (err?.includes("maximum")) throw new Error(err);
      if (err?.startsWith("Warning")) warnings.push(err);
      const labels = fm.rowIndices.map((i) => dataset.rowIds[i] ?? String(i));
      const matrix = computeDistanceMatrix(fm.matrix, analysis.metric, labels);
      patchState({
        result: {
          kind: "distance",
          matrix,
          metric: analysis.metric,
          interpretation: `${analysis.metric} distance matrix for ${rowCount} samples.`,
          warnings,
        },
      });
    } else if (analysis.kind === "correlation") {
      const matrix = computeCorrelationMatrix(fm.matrix, fm.featureNames);
      patchState({
        result: {
          kind: "correlation",
          matrix,
          interpretation: correlationInterpretation(matrix),
          warnings,
        },
      });
    } else if (analysis.kind === "pca") {
      const pca = runPCA(fm, analysis.components);
      const ev1 = pca.explainedVariance[0] ?? 0;
      const ev2 = pca.explainedVariance[1] ?? 0;
      const cum = (pca.cumulativeVariance[1] ?? ev1 + ev2);
      patchState({
        result: {
          kind: "pca",
          pca,
          interpretation: `PC1 explains ${formatPercent(ev1)} of the variance. PC1 + PC2 explain ${formatPercent(cum)}.`,
          warnings,
        },
      });
    } else if (analysis.kind === "kmeans") {
      const err = validateKMeans(dataset, features, analysis.k, rowCount);
      if (err) throw new Error(err);
      const kmeans = runKMeans(fm, {
        k: analysis.k,
        seed: analysis.seed,
        maxIterations: analysis.maxIterations,
        standardize,
      });
      patchState({
        result: {
          kind: "kmeans",
          kmeans,
          interpretation: kmeansInterpretation(kmeans),
          warnings,
        },
      });
    }
    renderCharts();
  } catch (e) {
    showToast(toastRoot, e instanceof Error ? e.message : String(e), "error");
  }
}

function renderCharts(): void {
  const state = getState();
  const dataset = state.dataset;
  const result = state.result;
  const pngButton = find("btn-export-png") as HTMLButtonElement | null;
  const csvButton = find("btn-export-csv") as HTMLButtonElement | null;
  if (pngButton) pngButton.disabled = !result || result.kind === "descriptive";
  if (csvButton) csvButton.disabled = !result || !["pca", "correlation", "similarity", "distance", "kmeans"].includes(result.kind);
  if (!dataset || !result) {
    chartEl.innerHTML = `<p class="placeholder">${escape(t("Run an analysis or visualization to see results."))}</p>`;
    chartSecondaryEl.innerHTML = "";
    return;
  }
  purgePlot(chartEl);
  purgePlot(chartSecondaryEl);
  chartEl.innerHTML = "";
  chartSecondaryEl.innerHTML = "";
  const onClick = (row: number) => {
    selectRow(row);
    const detail = find("detail-panel");
    if (detail) renderDetailPanel(detail);
  };

  if (result.kind === "visualize") {
    const v = state.analysis;
    if (v.kind !== "visualize") return;
    if (v.chartType === "scatter") {
      renderScatter(chartEl, dataset, v.xColumn, v.yColumn, v.colorColumn, onClick);
    } else if (v.chartType === "histogram") {
      renderHistogram(chartEl, dataset, v.xColumn, v.colorColumn);
    } else if (v.chartType === "box") {
      renderBoxPlot(chartEl, dataset, v.xColumn, v.colorColumn);
    } else if (v.chartType === "line") {
      renderLineChart(chartEl, dataset, v.xColumn, v.yColumn);
    } else if (v.chartType === "bar") {
      renderBarChart(chartEl, dataset, v.xColumn, v.yColumn);
    }
    return;
  }
  if (result.kind === "pca") {
    const color =
      state.analysis.kind === "pca" ? state.analysis.colorColumn : null;
    const meta = dataset.columns.map((c) => c.name).slice(0, 5);
    renderPCAScatter(chartEl, result.pca, dataset, color, meta, onClick);
    renderExplainedVariance(chartSecondaryEl, result.pca);
    return;
  }
  if (result.kind === "correlation") {
    renderHeatmap(
      chartEl,
      result.matrix,
      "Correlation matrix",
      (a, b, v) => `${a} × ${b}<br>r = ${v.toFixed(2)}`,
      "RdBu",
      -1,
      1,
    );
    return;
  }
  if (result.kind === "similarity") {
    renderHeatmap(
      chartEl,
      result.matrix,
      `${result.metric} similarity`,
      (a, b, v) => `${a} ↔ ${b}<br>Similarity: ${v.toFixed(3)}`,
      "Viridis",
      0,
      1,
    );
    return;
  }
  if (result.kind === "distance") {
    renderHeatmap(
      chartEl,
      result.matrix,
      `${result.metric} distance`,
      (a, b, v) => `${a} ↔ ${b}<br>Distance: ${v.toFixed(3)}`,
      "Viridis",
    );
    return;
  }
  if (result.kind === "kmeans") {
    renderClusterScatter(chartEl, result.kmeans, dataset, onClick);
  }
}

function renderDetailPanel(container: HTMLElement): void {
  const state = getState();
  const dataset = state.dataset;
  if (!dataset) {
    container.innerHTML = "<p>Select or load data to begin.</p>";
    return;
  }
  const row = state.selectedRowIndex;
  let extra = "";
  const result = state.result;
  if (result?.kind === "pca" && row !== null) {
    const pi = result.pca.rowIndices.indexOf(row);
    if (pi >= 0) {
      const c = result.pca.coordinates[pi];
      extra += `<tr><td>PC1</td><td class="num">${c[0].toFixed(4)}</td></tr>`;
      extra += `<tr><td>PC2</td><td class="num">${c[1].toFixed(4)}</td></tr>`;
    }
  }
  if (result?.kind === "kmeans" && row !== null) {
    const ki = result.kmeans.rowIndices.indexOf(row);
    if (ki >= 0) {
      extra += `<tr><td>Cluster</td><td>${result.kmeans.clusters[ki]}</td></tr>`;
    }
  }
  if (row === null) {
    let html = `<p class="muted">${escape(t("Click a chart point to inspect a sample."))}</p>`;
    if (result?.interpretation) {
      html += `<p>${escape(result.interpretation)}</p>`;
      if (result.warnings.length) {
        html += `<ul>${result.warnings.map((w) => `<li>${escape(w)}</li>`).join("")}</ul>`;
      }
    }
    if (result?.kind === "descriptive") {
      html += `<table class="detail-table"><thead><tr><th>Feature</th><th>mean</th><th>std</th><th>min</th><th>max</th></tr></thead><tbody>`;
      for (const [name, s] of Object.entries(result.summaries)) {
        html += `<tr><td>${escape(name)}</td><td class="num">${formatNumber(s.mean)}</td><td class="num">${formatNumber(s.stdDev)}</td><td class="num">${formatNumber(s.min)}</td><td class="num">${formatNumber(s.max)}</td></tr>`;
      }
      html += `</tbody></table>`;
    }
    if (result?.kind === "kmeans") {
      const km = result.kmeans;
      html += `<p>Iterations: ${km.iterations}, converged: ${km.converged ? "yes" : "no"}</p>`;
      html += `<table class="detail-table"><thead><tr><th>Cluster</th>${km.featureNames.map((f) => `<th>${escape(f)}</th>`).join("")}<th>count</th></tr></thead><tbody>`;
      const counts = new Map<number, number>();
      km.clusters.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
      km.centroids.forEach((cent, ci) => {
        html += `<tr><td>${ci}</td>${cent.map((v) => `<td class="num">${formatNumber(v)}</td>`).join("")}<td>${counts.get(ci) ?? 0}</td></tr>`;
      });
      html += `</tbody></table>`;
    }
    container.innerHTML = html;
    return;
  }
  const r = dataset.rows[row];
  const rows = dataset.columns
    .map(
      (c) =>
        `<tr><td>${escape(c.name)}</td><td class="${c.type === "numeric" ? "num" : ""}">${escape(String(r[c.name] ?? ""))}</td></tr>`,
    )
    .join("");
  container.innerHTML = `
    <h3>Selected sample</h3>
    <p>Row #${row}</p>
    <table class="detail-table"><tbody>${rows}${extra}</tbody></table>
  `;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderLoadings(container: HTMLElement): void {
  const result = getState().result;
  if (result?.kind !== "pca") {
    container.innerHTML = "";
    return;
  }
  const { loadings, featureNames } = result.pca;
  const headers = ["Feature", "PC1", "PC2"];
  const body = featureNames
    .map((name, i) => {
      const cells = loadings[i].map((v) => `<td class="num">${v.toFixed(3)}</td>`).join("");
      return `<tr><td>${escape(name)}</td>${cells}</tr>`;
    })
    .join("");
  container.innerHTML = `
    <h4>PCA loadings</h4>
    <table class="detail-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>
  `;
}

function buildFeatureCheckboxes(root: HTMLElement): void {
  const state = getState();
  const dataset = state.dataset;
  if (!dataset) {
    root.innerHTML = '<p class="muted">No features yet.</p>';
    return;
  }
  root.innerHTML = "";
  for (const col of dataset.columns) {
    if (col.type !== "numeric") continue;
    const id = `feat-${col.name}`;
    const label = document.createElement("label");
    label.className = "checkbox-row";
    const checked = state.selectedFeatures.includes(col.name);
    label.innerHTML = `<input type="checkbox" id="${id}" ${checked ? "checked" : ""} /> ${escape(col.name)}`;
    label.querySelector("input")!.addEventListener("change", (e) => {
      const on = (e.target as HTMLInputElement).checked;
      const next = new Set(getState().selectedFeatures);
      if (on) next.add(col.name);
      else next.delete(col.name);
      setSelectedFeatures([...next]);
      if (find("missing-note")) renderMissingNote(find("missing-note")!);
    });
    root.appendChild(label);
  }
}

function renderDataSummary(el: HTMLElement): void {
  const dataset = getState().dataset;
  if (!dataset) {
    el.innerHTML = "";
    return;
  }
  const numeric = getNumericColumns(dataset.columns);
  const categorical = getCategoricalColumns(dataset.columns);
  const missing = dataset.columns.reduce((s, c) => s + c.missingCount, 0);
  const warn =
    dataset.rows.length > 50000
      ? `<p class="warn">${escape(t("Large dataset: O(n²) analyses may be slow."))}</p>`
      : dataset.rows.length > 10000
        ? `<p class="warn">${escape(t("Dataset has 10k+ rows; some analyses may be heavy."))}</p>`
        : "";
  el.innerHTML = `
    ${warn}
    <dl class="stats-dl">
      <dt>${escape(t("Rows"))}</dt><dd>${dataset.rows.length}</dd>
      <dt>${escape(t("Columns"))}</dt><dd>${dataset.columns.length}</dd>
      <dt>${escape(t("Numeric"))}</dt><dd>${numeric.length}</dd>
      <dt>${escape(t("Categorical"))}</dt><dd>${categorical.length}</dd>
      <dt>${escape(t("Missing values"))}</dt><dd>${missing}</dd>
    </dl>
  `;
}

function renderMissingNote(el: HTMLElement): void {
  const state = getState();
  if (!state.dataset) return;
  const n = countMissingInFeatures(state.dataset, state.selectedFeatures);
  const strat = state.preprocessing.missingStrategy;
  const label =
    strat === "drop"
      ? t("Rows with missing values will be dropped")
      : strat === "median"
        ? t("Median imputation will be applied")
        : t("Mean imputation will be applied");
  el.textContent =
    n > 0
      ? t("{n} missing values in selected features. {action}.", { n, action: label })
      : t("No missing values in selected features.");
}

function exportResultCsv(): void {
  const state = getState();
  const result = state.result;
  const dataset = state.dataset;
  if (!result || !dataset) return;
  if (result.kind === "correlation" || result.kind === "similarity" || result.kind === "distance") {
    downloadText(`${result.kind}.csv`, matrixToCsv(result.matrix));
    return;
  }
  if (result.kind === "pca") {
    const headers = ["row_id", "PC1", "PC2"];
    const rows = result.pca.rowIndices.map((ri, i) => {
      const c = result.pca.coordinates[i];
      return [ri, c[0], c[1] ?? ""];
    });
    downloadText("pca.csv", rowsToCsv(headers, rows));
  }
  if (result.kind === "kmeans") {
    const headers = ["row_id", "cluster"];
    const rows = result.kmeans.rowIndices.map((ri, i) => [
      ri,
      result.kmeans.clusters[i],
    ]);
    downloadText("kmeans.csv", rowsToCsv(headers, rows));
  }
}

export function render(): void {
  const state = getState();
  const app = appRoot;
  if (!app) return;

  purgePlot(chartEl);
  purgePlot(chartSecondaryEl);
  app.innerHTML = `
    <header class="app-header">
      <p class="privacy">${escape(t("Your data stays in this browser. Files are processed locally and are not uploaded."))}</p>
      <div class="header-actions">
        <button type="button" id="btn-sample-iris">${escape(t("Load Iris"))}</button>
        <button type="button" id="btn-sample-customers">${escape(t("Load customers"))}</button>
        <button type="button" id="btn-clear">${escape(t("Clear"))}</button>
      </div>
    </header>
    <nav class="main-nav">
      <button type="button" data-view="data" class="${state.mainView === "data" ? "active" : ""}">${escape(t("Data"))}</button>
      <button type="button" data-view="analyze" class="${state.mainView === "analyze" ? "active" : ""}">${escape(t("Analyze"))}</button>
      <button type="button" data-view="visualize" class="${state.mainView === "visualize" ? "active" : ""}">${escape(t("Visualize"))}</button>
    </nav>
    <div class="workspace">
      <aside class="playground-sidebar" id="sidebar"></aside>
      <main class="result-area">
        <div class="result-toolbar">
          <span id="status-line">${escape(state.dataset ? t("{rows} rows × {columns} columns loaded", { rows: state.dataset.rows.length, columns: state.dataset.columns.length }) : "")}</span>
          <button type="button" id="btn-export-png">${escape(t("Export PNG"))}</button>
          <button type="button" id="btn-export-csv">${escape(t("Export CSV"))}</button>
        </div>
        <div id="chart" class="chart"></div>
        <div id="chart-secondary" class="chart chart-secondary"></div>
        <div id="loadings"></div>
      </main>
    </div>
    <footer class="detail-footer">
      <div id="detail-panel"></div>
      <div id="table-panel"></div>
    </footer>
    <div id="toast-root"></div>
  `;

  toastRoot = find("toast-root")!;
  chartEl = find("chart")!;
  chartSecondaryEl = find("chart-secondary")!;

  const sidebar = find("sidebar")!;
  sidebar.innerHTML = renderSidebarContent(state);
  wireSidebar(sidebar);

  if (find("data-summary")) renderDataSummary(find("data-summary")!);
  if (find("missing-note")) renderMissingNote(find("missing-note")!);
  if (find("feature-list")) buildFeatureCheckboxes(find("feature-list")!);
  onEditorHost(find("csv-editor-host"));
  if (state.dataset) {
    renderDataTable(
      find("table-panel")!,
      state.dataset,
      state.selectedRowIndex,
      (row) => { selectRow(row); render(); },
    );
  }
  renderDetailPanel(find("detail-panel")!);
  renderLoadings(find("loadings")!);
  renderCharts();

  app.querySelectorAll(".main-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      onViewChange((btn as HTMLElement).dataset.view as "data" | "analyze" | "visualize");
    });
  });

  find("btn-sample-iris")!.addEventListener("click", () => {
    setDataset(loadSample("iris"));
    patchState({ analysis: { kind: "pca", components: 2, colorColumn: "species" } });
    setMainView(getState().mainView);
    render();
    showToast(toastRoot, t("Iris dataset loaded — try PCA."));
  });
  find("btn-sample-customers")!.addEventListener("click", () => {
    setDataset(loadSample("customers"));
    render();
  });
  find("btn-clear")!.addEventListener("click", () => {
    setDataset(null);
    render();
  });
  find("btn-export-png")!.addEventListener("click", () => {
    exportPng(chartEl, "chart");
  });
  find("btn-export-csv")!.addEventListener("click", exportResultCsv);
}

function renderSidebarContent(state: ReturnType<typeof getState>): string {
  const dataset = state.dataset;
  const analysis = state.analysis;
  const numericCols = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const catCols = dataset?.columns ?? [];

  let analyzeParams = "";
  if (analysis.kind === "pca") {
    analyzeParams = `
      <label>${escape(t("Components"))} <input type="number" id="pca-components" min="2" max="10" value="${analysis.components}" /></label>
      <label>${escape(t("Color by"))}
        <select id="pca-color">${optionTags(catCols.map((c) => c.name), analysis.colorColumn)}</select>
      </label>`;
  } else if (analysis.kind === "similarity") {
    analyzeParams = `<label>${escape(t("Metric"))} <select id="sim-metric"><option value="cosine" ${analysis.metric === "cosine" ? "selected" : ""}>${escape(t("Cosine"))}</option><option value="pearson" ${analysis.metric === "pearson" ? "selected" : ""}>${escape(t("Pearson"))}</option></select></label>`;
  } else if (analysis.kind === "distance") {
    analyzeParams = `<label>${escape(t("Metric"))} <select id="dist-metric"><option value="euclidean" ${analysis.metric === "euclidean" ? "selected" : ""}>${escape(t("Euclidean"))}</option><option value="manhattan" ${analysis.metric === "manhattan" ? "selected" : ""}>${escape(t("Manhattan"))}</option></select></label>`;
  } else if (analysis.kind === "kmeans") {
    analyzeParams = `
      <label>${escape(t("K"))} <input type="number" id="kmeans-k" min="2" value="${analysis.k}" /></label>
      <label>${escape(t("Seed"))} <input type="number" id="kmeans-seed" value="${analysis.seed}" /></label>
      <label>${escape(t("Max iterations"))} <input type="number" id="kmeans-iter" value="${analysis.maxIterations}" /></label>`;
  }

  const dataPanel =
    state.mainView === "data"
      ? `
    <section>
      <h2>${escape(t("CSV input"))}</h2>
      <div id="csv-editor-host"></div>
      <button type="button" id="btn-parse">${escape(t("Parse CSV"))}</button>
      <label class="file-label">${escape(t("Upload CSV"))} <input type="file" id="csv-file" accept=".csv,text/csv" /></label>
    </section>
    <section><h2>${escape(t("Dataset"))}</h2><div id="data-summary"></div></section>
    <section><h2>${escape(t("Preview"))}</h2><p class="muted">${escape(t("See table below after load."))}</p></section>`
      : "";

  const analyzePanel =
    state.mainView === "analyze"
      ? `
    <section>
      <h2>${escape(t("Analysis"))}</h2>
      <select id="analysis-kind">
        <option value="pca" ${analysis.kind === "pca" ? "selected" : ""}>PCA</option>
        <option value="correlation" ${analysis.kind === "correlation" ? "selected" : ""}>${escape(t("Correlation"))}</option>
        <option value="similarity" ${analysis.kind === "similarity" ? "selected" : ""}>${escape(t("Similarity"))}</option>
        <option value="distance" ${analysis.kind === "distance" ? "selected" : ""}>${escape(t("Distance"))}</option>
        <option value="kmeans" ${analysis.kind === "kmeans" ? "selected" : ""}>${escape(t("K-means"))}</option>
        <option value="descriptive" ${analysis.kind === "descriptive" ? "selected" : ""}>${escape(t("Descriptive stats"))}</option>
      </select>
      ${analyzeParams}
    </section>
    <section>
      <h2>${escape(t("Features"))}</h2>
      <div id="feature-list"></div>
    </section>
    <section>
      <h2>${escape(t("Preprocessing"))}</h2>
      <label>${escape(t("Missing values"))}
        <select id="missing-strategy">
          <option value="drop" ${state.preprocessing.missingStrategy === "drop" ? "selected" : ""}>${escape(t("Drop rows"))}</option>
          <option value="mean" ${state.preprocessing.missingStrategy === "mean" ? "selected" : ""}>${escape(t("Replace with mean"))}</option>
          <option value="median" ${state.preprocessing.missingStrategy === "median" ? "selected" : ""}>${escape(t("Replace with median"))}</option>
        </select>
      </label>
      <label class="checkbox-row"><input type="checkbox" id="standardize" ${state.preprocessing.standardize ? "checked" : ""} /> ${escape(t("Standardize (z-score)"))}</label>
      <p id="missing-note" class="muted small"></p>
      <button type="button" id="btn-run" class="primary">${escape(t("Run"))}</button>
    </section>`
      : "";

  const viz = state.analysis.kind === "visualize" ? state.analysis : null;
  const visualizePanel =
    state.mainView === "visualize"
      ? `
    <section>
      <h2>${escape(t("Chart"))}</h2>
      <select id="viz-type">
        <option value="scatter" ${viz?.chartType === "scatter" ? "selected" : ""}>${escape(t("Scatter"))}</option>
        <option value="histogram" ${viz?.chartType === "histogram" ? "selected" : ""}>${escape(t("Histogram"))}</option>
        <option value="box" ${viz?.chartType === "box" ? "selected" : ""}>${escape(t("Box plot"))}</option>
        <option value="line" ${viz?.chartType === "line" ? "selected" : ""}>${escape(t("Line"))}</option>
        <option value="bar" ${viz?.chartType === "bar" ? "selected" : ""}>${escape(t("Bar"))}</option>
      </select>
      <label>X <select id="viz-x">${optionTags(numericCols.map((c) => c.name), viz?.xColumn ?? numericCols[0]?.name)}</select></label>
      <label>Y <select id="viz-y">${optionTags(numericCols.map((c) => c.name), viz?.yColumn ?? numericCols[1]?.name ?? numericCols[0]?.name)}</select></label>
      <label>Color <select id="viz-color">${optionTags(["", ...catCols.map((c) => c.name)], viz?.colorColumn ?? "")}</select></label>
      <button type="button" id="btn-viz-run" class="primary">${escape(t("Render"))}</button>
    </section>`
      : "";

  return dataPanel + analyzePanel + visualizePanel;
}

function optionTags(values: string[], selected: string | null): string {
  return values
    .map((v) => {
      const label = v === "" ? t("(none)") : v;
      return `<option value="${escape(v)}" ${v === selected ? "selected" : ""}>${escape(label)}</option>`;
    })
    .join("");
}

function wireSidebar(sidebar: HTMLElement): void {
  sidebar.querySelector("#btn-parse")?.addEventListener("click", () => {
    const text = readCsv();
    try {
      setDataset(parseCsvText(text));
      render();
    } catch (e) {
      showToast(toastRoot, e instanceof Error ? e.message : String(e), "error");
    }
  });
  sidebar.querySelector("#csv-file")?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      setDataset(await parseCsvFile(file));
      render();
    } catch (err) {
      showToast(toastRoot, err instanceof Error ? err.message : String(err), "error");
    }
  });
  sidebar.querySelector("#btn-run")?.addEventListener("click", () => {
    syncAnalysisFromForm();
    runAnalysis();
    renderDetailPanel(find("detail-panel")!);
    renderLoadings(find("loadings")!);
  });
  sidebar.querySelector("#btn-viz-run")?.addEventListener("click", () => {
    syncVisualizeFromForm();
    runAnalysis();
    renderDetailPanel(find("detail-panel")!);
  });
  sidebar.querySelector("#analysis-kind")?.addEventListener("change", () => {
    syncAnalysisKind();
    render();
  });
  sidebar.querySelector("#missing-strategy")?.addEventListener("change", (e) => {
    patchState({
      preprocessing: {
        ...getState().preprocessing,
        missingStrategy: (e.target as HTMLSelectElement).value as "drop" | "mean" | "median",
      },
    });
    if (find("missing-note")) renderMissingNote(find("missing-note")!);
  });
  sidebar.querySelector("#standardize")?.addEventListener("change", (e) => {
    patchState({
      preprocessing: {
        ...getState().preprocessing,
        standardize: (e.target as HTMLInputElement).checked,
      },
    });
  });
}

function syncAnalysisKind(): void {
  const kind = (find("analysis-kind") as HTMLSelectElement)?.value;
  if (!kind) return;
  if (kind === "pca") {
    patchState({ analysis: { kind: "pca", components: 2, colorColumn: "species" } });
  } else if (kind === "correlation") {
    patchState({ analysis: { kind: "correlation" } });
  } else if (kind === "similarity") {
    patchState({ analysis: { kind: "similarity", metric: "cosine" } });
  } else if (kind === "distance") {
    patchState({ analysis: { kind: "distance", metric: "euclidean" } });
  } else if (kind === "kmeans") {
    patchState({
      analysis: { kind: "kmeans", k: 3, seed: 42, maxIterations: 100 },
    });
  } else if (kind === "descriptive") {
    patchState({ analysis: { kind: "descriptive" } });
  }
}

function syncAnalysisFromForm(): void {
  const state = getState();
  const a = state.analysis;
  if (a.kind === "pca") {
    patchState({
      analysis: {
        kind: "pca",
        components: Number((find("pca-components") as HTMLInputElement)?.value ?? 2),
        colorColumn:
          (find("pca-color") as HTMLSelectElement)?.value || null,
      },
    });
  } else if (a.kind === "similarity") {
    patchState({
      analysis: {
        kind: "similarity",
        metric: (find("sim-metric") as HTMLSelectElement).value as "cosine" | "pearson",
      },
    });
  } else if (a.kind === "distance") {
    patchState({
      analysis: {
        kind: "distance",
        metric: (find("dist-metric") as HTMLSelectElement).value as "euclidean" | "manhattan",
      },
    });
  } else if (a.kind === "kmeans") {
    patchState({
      analysis: {
        kind: "kmeans",
        k: Number((find("kmeans-k") as HTMLInputElement).value),
        seed: Number((find("kmeans-seed") as HTMLInputElement).value),
        maxIterations: Number((find("kmeans-iter") as HTMLInputElement).value),
      },
    });
  }
}

function syncVisualizeFromForm(): void {
  const x = (find("viz-x") as HTMLSelectElement).value;
  const y = (find("viz-y") as HTMLSelectElement).value;
  const color = (find("viz-color") as HTMLSelectElement).value;
  patchState({
    analysis: {
      kind: "visualize",
      chartType: (find("viz-type") as HTMLSelectElement).value as "scatter" | "histogram" | "box" | "line" | "bar",
      xColumn: x,
      yColumn: y,
      colorColumn: color || null,
    },
  });
}

export function mountPlayground(
  root: HTMLElement,
  view: "data" | "analyze" | "visualize",
  editorHost: (host: HTMLElement | null) => void,
  csvValue: () => string,
): () => void {
  appRoot = root;
  onEditorHost = editorHost;
  readCsv = csvValue;
  onViewChange = (next) => { window.location.hash = `#/tools/playground-${next}`; };
  if (!initialized) {
    setDataset(loadSample("iris"));
    patchState({ analysis: { kind: "pca", components: 2, colorColumn: "species" } });
    initialized = true;
  }
  setMainView(view);
  render();
  const observer = new MutationObserver(() => renderCharts());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const updateTheme = () => renderCharts();
  media.addEventListener("change", updateTheme);
  const stopLocale = subscribeLocale(() => render());
  return () => {
    stopLocale();
    observer.disconnect();
    media.removeEventListener("change", updateTheme);
    purgePlot(chartEl);
    purgePlot(chartSecondaryEl);
    appRoot = null;
  };
}

let initialized = false;
