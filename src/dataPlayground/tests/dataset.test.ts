import { describe, expect, it } from "vitest";
import { parseCsvText } from "../data/csv";
import { isLikelyIdentifierColumn } from "../data/columns";

describe("dataset", () => {
  it("parses paste and upload equivalently", () => {
    const text = "age,height\n25,170\n30,180";
    const d = parseCsvText(text);
    expect(d.rows.length).toBe(2);
    expect(d.columns.find((c) => c.name === "age")?.type).toBe("numeric");
  });

  it("detects missing tokens", () => {
    const d = parseCsvText("x\n1\nNA\n3\n");
    expect(d.rows[1].x).toBeNull();
  });

  it("identifier heuristic", () => {
    expect(isLikelyIdentifierColumn("customer_id")).toBe(true);
    expect(isLikelyIdentifierColumn("income")).toBe(false);
  });
});
