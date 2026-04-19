import { SumRule } from "../../../src/simulation/rule";
import type { Grid } from "../../../src/types";

describe("SumRule", () => {
  it("matches when the player neighbor sum is included", () => {
    const grid: Grid = [
      [1, 1, null],
      [null, null, null],
      [null, null, null],
    ];

    const rule = new SumRule([2]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("ignores out-of-bounds neighbors", () => {
    const grid: Grid = [
      [1, null],
      [null, null],
    ];

    const rule = new SumRule([1]);

    expect(rule.matches(grid, 0, 0, 1)).toBe(false);
    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });
});
