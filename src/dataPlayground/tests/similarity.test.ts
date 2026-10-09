import { describe, expect, it } from "vitest";
import { computeSimilarityMatrix } from "../analysis/similarity";

describe("similarity", () => {
  it("cosine identical", () => {
    const m = computeSimilarityMatrix([[1, 0], [1, 0]], "cosine", ["a", "b"]);
    expect(m.values[0][1]).toBeCloseTo(1, 5);
  });

  it("cosine orthogonal", () => {
    const m = computeSimilarityMatrix([[1, 0], [0, 1]], "cosine", ["a", "b"]);
    expect(m.values[0][1]).toBeCloseTo(0, 5);
  });
});
