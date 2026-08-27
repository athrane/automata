import { SumRule } from "../../../src/simulation/rule";
import type { Cell } from "../../../src/simulation/Cell";
import type { Grid } from "../../../src/simulation/Grid";

/** Builds a claimed-and-alive cell for `owner`. */
function alive(owner: number): Cell {
  return { ownerId: owner, value: owner };
}

/** Builds an unclaimed cell. */
const EMPTY_CELL: Cell = { ownerId: null, value: null };

/** Builds a 3x3 grid of cells from a compact literal, where 0 means empty. */
function createGrid(rows: ReadonlyArray<ReadonlyArray<number>>): Grid {
  return rows.map((row) => row.map((entry) => (entry === 0 ? EMPTY_CELL : alive(entry))));
}

describe("SumRule", () => {
  it("matches when the player neighbor sum is included", () => {
    const grid = createGrid([
      [1, 1, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([2]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  describe("toroidal wrap-around", () => {
    it("reads the left neighbor of column 0 from the last column", () => {
      // Arrange: only the wrapped left neighbor of (0,0) is populated
      const grid = createGrid([
        [0, 0, 1],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      const rule = new SumRule([1]);

      // Act
      const result = rule.matches(grid, 0, 0, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("reads the right neighbor of the last column from column 0", () => {
      // Arrange: only the wrapped right neighbor of (2,0) is populated
      const grid = createGrid([
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      const rule = new SumRule([1]);

      // Act
      const result = rule.matches(grid, 2, 0, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("reads the top neighbor of row 0 from the last row", () => {
      // Arrange: only the wrapped top neighbor of (0,0) is populated
      const grid = createGrid([
        [0, 0, 0],
        [0, 0, 0],
        [1, 0, 0],
      ]);
      const rule = new SumRule([1]);

      // Act
      const result = rule.matches(grid, 0, 0, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("reads the bottom neighbor of the last row from row 0", () => {
      // Arrange: only the wrapped bottom neighbor of (0,2) is populated
      const grid = createGrid([
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      const rule = new SumRule([1]);

      // Act
      const result = rule.matches(grid, 0, 2, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("gives a corner cell the full eight-neighbor count", () => {
      // Arrange: every cell except the corner (0,0) is populated
      const grid = createGrid([
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]);
      const rule = new SumRule([8]);

      // Act
      const result = rule.matches(grid, 0, 0, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("counts zero neighbors on an empty grid", () => {
      // Arrange
      const grid: Grid = [];
      const rule = new SumRule([0]);

      // Act
      const result = rule.matches(grid, 0, 0, 1);

      // Assert
      expect(result).toBe(true);
    });
  });

  it("throws TypeError when sums is not an array", () => {
    // @ts-expect-error intentional invalid argument
    expect(() => new SumRule(3)).toThrow(TypeError);
  });

  describe("central-cell exclusion (default)", () => {
    it("excludes the central cell from the neighbor count", () => {
      // Central cell is player 1 but should not be counted
      const grid = createGrid([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([1]);

      // Zero neighbors when central cell is excluded
      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("central-cell inclusion (includeSelf = true)", () => {
    it("includes the central cell in the neighbor count", () => {
      // Central cell is player 1; with includeSelf the count becomes 1
      const grid = createGrid([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([1], true);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("counts central cell and neighbors together", () => {
      // Central cell (1) + two neighbors (1,1) = 3
      const grid = createGrid([
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([3], true);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });
  });

  describe("solitude death — populated cell with 0 or 1 neighbors", () => {
    it("matches a populated cell that has zero neighbors", () => {
      const grid = createGrid([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("matches a populated cell that has exactly one neighbor", () => {
      const grid = createGrid([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has two neighbors", () => {
      const grid = createGrid([
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([0, 1]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("overpopulation death — populated cell with 4 or more neighbors", () => {
    it("matches a populated cell that has exactly four neighbors", () => {
      const grid = createGrid([
        [1, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("matches a populated cell that has eight neighbors", () => {
      const grid = createGrid([
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]);

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has three neighbors", () => {
      const grid = createGrid([
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([4, 5, 6, 7, 8]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("survival with two neighbors", () => {
    it("matches a populated cell that has exactly two neighbors", () => {
      const grid = createGrid([
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([2]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has only one neighbor", () => {
      const grid = createGrid([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([2]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("survival with three neighbors", () => {
    it("matches a populated cell that has exactly three neighbors", () => {
      const grid = createGrid([
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match a populated cell that has two neighbors", () => {
      const grid = createGrid([
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("birth — unpopulated cell with three neighbors", () => {
    it("matches an unpopulated cell that has exactly three neighbors", () => {
      const grid = createGrid([
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([3]);

      // Cell (1,1) is empty but has three player-1 neighbors above it
      expect(rule.matches(grid, 1, 1, 1)).toBe(true);
    });

    it("does not match an unpopulated cell that has only two neighbors", () => {
      const grid = createGrid([
        [1, 1, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });

  describe("dormant claimed neighbours", () => {
    it("does not count a dormant claimed neighbour toward a match", () => {
      // The neighbour above-left is claimed by player 1 but dormant; only
      // live cells influence adjacency.
      const grid: Grid = [
        [{ ownerId: 1, value: null }, alive(1), EMPTY_CELL],
        [alive(1), EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
      ];

      const rule = new SumRule([3]);

      expect(rule.matches(grid, 1, 1, 1)).toBe(false);
    });
  });
});
