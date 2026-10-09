import { describe, expect, it } from "vitest";
import { parseCsvText } from "../data/csv";
import { buildFeatureMatrix } from "../data/preprocessing";
import { runPCA } from "../analysis/pca";
import { loadIrisDataset } from "../data/sample-data";

describe("pca", () => {
  it("output dimensions and variance", () => {
    const dataset = loadIrisDataset();
    const features = ["sepal_length", "sepal_width", "petal_length", "petal_width"];
    const fm = buildFeatureMatrix(dataset, features, {
      missingStrategy: "mean",
      standardize: true,
    });
    const result = runPCA(fm, 2);
    expect(result.coordinates.length).toBe(fm.matrix.length);
    expect(result.coordinates[0].length).toBe(2);
    const sumEv = result.explainedVariance.reduce((s, v) => s + v, 0);
    expect(sumEv).toBeLessThanOrEqual(1.01);
    expect(sumEv).toBeGreaterThan(0.5);
  });

  it("small known dataset", () => {
    const d = parseCsvText("a,b\n0,0\n1,1\n2,2\n3,3");
    const fm = buildFeatureMatrix(d, ["a", "b"], {
      missingStrategy: "mean",
      standardize: true,
    });
    const result = runPCA(fm, 2);
    expect(result.explainedVariance[0]).toBeGreaterThan(0.9);
  });
});
