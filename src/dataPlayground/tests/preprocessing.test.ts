import { describe, expect, it } from "vitest";
import { parseCsvText } from "../data/csv";
import { buildFeatureMatrix } from "../data/preprocessing";

const csv = `a,b,c
1,2,5
4,NA,5
7,8,5
1,1,5`;

describe("preprocessing", () => {
  const dataset = parseCsvText(csv);

  it("mean imputation", () => {
    const fm = buildFeatureMatrix(dataset, ["a", "b", "c"], {
      missingStrategy: "mean",
      standardize: false,
    });
    expect(fm.matrix.length).toBe(4);
    expect(fm.matrix[1][1]).toBeCloseTo(11 / 3, 5);
  });

  it("drops rows", () => {
    const fm = buildFeatureMatrix(dataset, ["a", "b", "c"], {
      missingStrategy: "drop",
      standardize: false,
    });
    expect(fm.matrix.length).toBe(3);
    expect(fm.warnings.some((w) => w.includes("removed"))).toBe(true);
  });

  it("removes constant feature", () => {
    const fm = buildFeatureMatrix(dataset, ["a", "b", "c"], {
      missingStrategy: "mean",
      standardize: false,
    });
    expect(fm.featureNames).not.toContain("c");
    expect(fm.warnings.some((w) => w.includes("constant"))).toBe(true);
  });

  it("preserves row indices on drop", () => {
    const fm = buildFeatureMatrix(dataset, ["a", "b"], {
      missingStrategy: "drop",
      standardize: false,
    });
    expect(fm.rowIndices).toEqual([0, 2, 3]);
  });

  it("standardizes", () => {
    const fm = buildFeatureMatrix(dataset, ["a", "b"], {
      missingStrategy: "mean",
      standardize: true,
    });
    const col0 = fm.matrix.map((r) => r[0]);
    const m = col0.reduce((s, v) => s + v, 0) / col0.length;
    expect(Math.abs(m)).toBeLessThan(1e-10);
  });
});
