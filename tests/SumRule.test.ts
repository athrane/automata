import { SumRule } from "../src/simulation/rule";
import type { Grid } from "../src/types";

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

  it("excludes central cell from count by default", () => {
    const grid: Grid = [
      [null, null, null],
      [null, 1, null],
      [null, null, null],
    ];

    const rule = new SumRule([1]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(false);
  });

  it("includes central cell in count when includeSelf is true", () => {
    const grid: Grid = [
      [null, null, null],
      [null, 1, null],
      [null, null, null],
    ];

    const rule = new SumRule([1], true);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches solitude — populated cell with zero neighbors", () => {
    const grid: Grid = [
      [null, null, null],
      [null, 1, null],
      [null, null, null],
    ];

    const rule = new SumRule([0, 1]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches overpopulation — populated cell with four or more neighbors", () => {
    const grid: Grid = [
      [1, 1, null],
      [1, 1, 1],
      [null, null, null],
    ];

    const rule = new SumRule([4, 5, 6, 7, 8]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches survival — populated cell with exactly two neighbors", () => {
    const grid: Grid = [
      [1, 1, null],
      [null, 1, null],
      [null, null, null],
    ];

    const rule = new SumRule([2]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches survival — populated cell with exactly three neighbors", () => {
    const grid: Grid = [
      [1, 1, 1],
      [null, 1, null],
      [null, null, null],
    ];

    const rule = new SumRule([3]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches birth — unpopulated cell with exactly three neighbors", () => {
    const grid: Grid = [
      [1, 1, 1],
      [null, null, null],
      [null, null, null],
    ];

    const rule = new SumRule([3]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });
});
