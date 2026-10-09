import { describe, expect, it } from "vitest";
import { computeCorrelationMatrix } from "../analysis/correlation";

describe("correlation", () => {
  it("perfect positive", () => {
    const matrix = [[1, 2], [2, 4], [3, 6]];
    const result = computeCorrelationMatrix(matrix, ["x", "y"]);
    expect(result.values[0][1]).toBeCloseTo(1, 5);
  });

  it("perfect negative", () => {
    const matrix = [[1, 10], [2, 8], [3, 6]];
    const result = computeCorrelationMatrix(matrix, ["x", "y"]);
    expect(result.values[0][1]).toBeCloseTo(-1, 5);
  });

  it("constant column", () => {
    const matrix = [[1, 5], [2, 5], [3, 5]];
    const result = computeCorrelationMatrix(matrix, ["x", "y"]);
    expect(result.values[0][1]).toBe(0);
  });
});
