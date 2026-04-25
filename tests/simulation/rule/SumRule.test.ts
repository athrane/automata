import { SumRule } from "../../../src/simulation/rule";
import type { Grid } from "../../../src/simulation/Grid";

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

  it("throws TypeError when sums is not an array", () => {
    // @ts-expect-error intentional invalid argument
    expect(() => new SumRule(3)).toThrow(TypeError);
  });

  describe("central-cell exclusion (default)", () => {
    it("excludes the central cell from the neighbor count", () => {
      // Central cell is player 1 but should not be counted
      const grid: Grid = [
        [null, null, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([1]);

      // Zero neighbors when central cell is excluded
      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("central-cell inclusion (includeSelf = true)", () => {
    it("includes the central cell in the neighbor count", () => {
      // Central cell is player 1; with includeSelf the count becomes 1
      const grid: Grid = [
        [null, null, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([1], true);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("counts central cell and neighbors together", () => {
      // Central cell (1) + two neighbors (1,1) = 3
      const grid: Grid = [
        [1, 1, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([3], true);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });
  });

  describe("solitude death — populated cell with 0 or 1 neighbors", () => {
    it("matches a populated cell that has zero neighbors", () => {
      const grid: Grid = [
        [null, null, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("matches a populated cell that has exactly one neighbor", () => {
      const grid: Grid = [
        [1, null, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has two neighbors", () => {
      const grid: Grid = [
        [1, 1, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("overpopulation death — populated cell with 4 or more neighbors", () => {
    it("matches a populated cell that has exactly four neighbors", () => {
      const grid: Grid = [
        [1, 1, null],
        [1, 1, 1],
        [null, null, null],
      ];

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("matches a populated cell that has eight neighbors", () => {
      const grid: Grid = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has three neighbors", () => {
      const grid: Grid = [
        [1, 1, 1],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("survival with two neighbors", () => {
    it("matches a populated cell that has exactly two neighbors", () => {
      const grid: Grid = [
        [1, 1, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([2]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has only one neighbor", () => {
      const grid: Grid = [
        [1, null, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([2]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("survival with three neighbors", () => {
    it("matches a populated cell that has exactly three neighbors", () => {
      const grid: Grid = [
        [1, 1, 1],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has two neighbors", () => {
      const grid: Grid = [
        [1, 1, null],
        [null, 1, null],
        [null, null, null],
      ];

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("birth — unpopulated cell with three neighbors", () => {
    it("matches an unpopulated cell that has exactly three neighbors", () => {
      const grid: Grid = [
        [1, 1, 1],
        [null, null, null],
        [null, null, null],
      ];

      const rule = new SumRule([3]);

      // Cell (1,1) is null but has three player-1 neighbors above it
      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match an unpopulated cell that has only two neighbors", () => {
      const grid: Grid = [
        [1, 1, null],
        [null, null, null],
        [null, null, null],
      ];

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });
});
