import { describe, expect, it } from "vitest";
import { computeDistanceMatrix } from "../analysis/distance";

describe("distance", () => {
  it("euclidean", () => {
    const m = computeDistanceMatrix([[0, 0], [3, 4]], "euclidean", ["a", "b"]);
    expect(m.values[0][1]).toBeCloseTo(5, 5);
  });

  it("manhattan", () => {
    const m = computeDistanceMatrix([[0, 0], [3, 4]], "manhattan", ["a", "b"]);
    expect(m.values[0][1]).toBeCloseTo(7, 5);
  });
});
