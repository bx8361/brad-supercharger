import type { FeatureMatrix } from "../data/preprocessing";
import type { NumericSummary } from "../data/statistics";

export interface MatrixResult {
  labels: string[];
  values: number[][];
}

export interface PCAResult {
  coordinates: number[][];
  explainedVariance: number[];
  cumulativeVariance: number[];
  loadings: number[][];
  featureNames: string[];
  rowIndices: number[];
}

export interface KMeansOptions {
  k: number;
  seed?: number;
  maxIterations: number;
  standardize: boolean;
}

export interface KMeansResult {
  clusters: number[];
  centroids: number[][];
  iterations: number;
  converged: boolean;
  rowIndices: number[];
  featureNames: string[];
  projection?: PCAResult;
}

export type AnalysisKind =
  | "pca"
  | "correlation"
  | "similarity"
  | "distance"
  | "kmeans"
  | "descriptive"
  | "visualize";

export interface AnalysisResultBase {
  kind: AnalysisKind;
  interpretation: string;
  warnings: string[];
}

export interface PCAAnalysisResult extends AnalysisResultBase {
  kind: "pca";
  pca: PCAResult;
}

export interface MatrixAnalysisResult extends AnalysisResultBase {
  kind: "correlation" | "similarity" | "distance";
  matrix: MatrixResult;
  metric?: string;
}

export interface KMeansAnalysisResult extends AnalysisResultBase {
  kind: "kmeans";
  kmeans: KMeansResult;
}

export interface DescriptiveAnalysisResult extends AnalysisResultBase {
  kind: "descriptive";
  summaries: Record<string, NumericSummary>;
}

export interface VisualizeAnalysisResult extends AnalysisResultBase {
  kind: "visualize";
  chartType: string;
  xColumn?: string;
  yColumn?: string;
  colorColumn?: string | null;
}

export type AnalysisResult =
  | PCAAnalysisResult
  | MatrixAnalysisResult
  | KMeansAnalysisResult
  | DescriptiveAnalysisResult
  | VisualizeAnalysisResult;

export interface PCAAnalysisState {
  kind: "pca";
  components: number;
  colorColumn: string | null;
}

export interface SimilarityAnalysisState {
  kind: "similarity";
  metric: "cosine" | "pearson";
}

export interface DistanceAnalysisState {
  kind: "distance";
  metric: "euclidean" | "manhattan";
}

export interface CorrelationAnalysisState {
  kind: "correlation";
}

export interface KMeansAnalysisState {
  kind: "kmeans";
  k: number;
  seed: number;
  maxIterations: number;
}

export interface DescriptiveAnalysisState {
  kind: "descriptive";
}

export interface VisualizeAnalysisState {
  kind: "visualize";
  chartType: "scatter" | "histogram" | "box" | "line" | "bar";
  xColumn: string;
  yColumn: string;
  colorColumn: string | null;
}

export type AnalysisState =
  | PCAAnalysisState
  | SimilarityAnalysisState
  | DistanceAnalysisState
  | CorrelationAnalysisState
  | KMeansAnalysisState
  | DescriptiveAnalysisState
  | VisualizeAnalysisState;

export type { FeatureMatrix };
