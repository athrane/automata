import { SumRule } from "../src/simulation/rule";
import type { Cell } from "../src/simulation/Cell";
import type { Grid } from "../src/simulation/Grid";

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

  it("wraps neighbors around the grid edges", () => {
    // Left neighbor of (0,0) is (2,0); top neighbor of (0,0) is (0,2).
    const horizontal = createGrid([
      [0, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const vertical = createGrid([
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ]);

    const rule = new SumRule([1]);

    expect(rule.matches(horizontal, 0, 0, 1)).toBe(true);
    expect(rule.matches(vertical, 0, 0, 1)).toBe(true);
  });

  it("excludes central cell from count by default", () => {
    const grid = createGrid([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([1]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(false);
  });

  it("includes central cell in count when includeSelf is true", () => {
    const grid = createGrid([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([1], true);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches solitude — populated cell with zero neighbors", () => {
    const grid = createGrid([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([0, 1]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches overpopulation — populated cell with four or more neighbors", () => {
    const grid = createGrid([
      [1, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]);

    const rule = new SumRule([4, 5, 6, 7, 8]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches survival — populated cell with exactly two neighbors", () => {
    const grid = createGrid([
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([2]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches survival — populated cell with exactly three neighbors", () => {
    const grid = createGrid([
      [1, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([3]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

  it("matches birth — unpopulated cell with exactly three neighbors", () => {
    const grid = createGrid([
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 0],
    ]);

    const rule = new SumRule([3]);

    expect(rule.matches(grid, 1, 1, 1)).toBe(true);
  });

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
