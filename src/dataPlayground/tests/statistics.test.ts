import { describe, expect, it } from "vitest";
import {
  mean,
  median,
  quantile,
  stdDev,
  variance,
} from "../data/statistics";

describe("statistics", () => {
  it("mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it("median", () => {
    expect(median([1, 3, 9])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("standard deviation", () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0);
  });

  it("variance of constant is zero", () => {
    expect(variance([5, 5, 5, 5])).toBe(0);
  });

  it("quantile", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
  });
});
