import type { Dataset } from "./data/dataset";
import type { AnalysisResult, AnalysisState } from "./analysis/types";

export type MainView = "data" | "analyze" | "visualize";

export interface AppState {
  dataset: Dataset | null;
  mainView: MainView;
  selectedFeatures: string[];
  preprocessing: {
    missingStrategy: "drop" | "mean" | "median";
    standardize: boolean;
  };
  analysis: AnalysisState;
  result: AnalysisResult | null;
  selectedRowIndex: number | null;
  statusMessage: string | null;
  isRunning: boolean;
}

export function createInitialState(): AppState {
  return {
    dataset: null,
    mainView: "data",
    selectedFeatures: [],
    preprocessing: {
      missingStrategy: "mean",
      standardize: true,
    },
    analysis: {
      kind: "pca",
      components: 2,
      colorColumn: null,
    },
    result: null,
    selectedRowIndex: null,
    statusMessage: null,
    isRunning: false,
  };
}

let state = createInitialState();
type Listener = () => void;
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  for (const fn of listeners) fn();
}

export function patchState(partial: Partial<AppState>): void {
  state = { ...state, ...partial };
  emit();
}

export function setDataset(dataset: Dataset | null): void {
  const numeric = dataset?.columns.filter((c) => c.type === "numeric").map((c) => c.name) ?? [];
  state = {
    ...state,
    dataset,
    analysis: state.analysis.kind === "visualize" ? {
      ...state.analysis,
      xColumn: numeric[0] ?? "",
      yColumn: numeric[1] ?? numeric[0] ?? "",
      colorColumn: null,
    } : state.analysis,
    selectedFeatures: numeric.filter((n) => !/^(id|index|row|uuid)$/i.test(n) && !n.toLowerCase().endsWith("_id")),
    result: null,
    selectedRowIndex: null,
    statusMessage: dataset
      ? `${dataset.rows.length} rows × ${dataset.columns.length} columns loaded`
      : null,
  };
  emit();
}

export function setSelectedFeatures(features: string[]): void {
  patchState({ selectedFeatures: features });
}

export function selectRow(index: number | null): void {
  patchState({ selectedRowIndex: index });
}

export function setMainView(view: MainView): void {
  if (view === "visualize" && state.analysis.kind !== "visualize") {
    const numeric =
      state.dataset?.columns.filter((c) => c.type === "numeric").map((c) => c.name) ??
      [];
    patchState({
      mainView: view,
      result: null,
      analysis: {
        kind: "visualize",
        chartType: "scatter",
        xColumn: numeric[0] ?? "",
        yColumn: numeric[1] ?? numeric[0] ?? "",
        colorColumn: null,
      },
    });
    return;
  }
  if (view === "analyze" && state.analysis.kind === "visualize") {
    patchState({ mainView: view, analysis: { kind: "pca", components: 2, colorColumn: null }, result: null });
    return;
  }
  patchState({ mainView: view });
}
