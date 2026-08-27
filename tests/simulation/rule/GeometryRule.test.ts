import { GeometryRule } from "../../../src/simulation/rule";
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

describe("GeometryRule", () => {
  it("matches when all 8 neighbours exactly match the pattern", () => {
    // Arrange
    // Pattern: top-left=true, top=true, top-right=false, left=false,
    //          right=false, bottom-left=false, bottom=false, bottom-right=false
    const grid = createGrid([
      [1, 1, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("does not match when a required neighbour is absent", () => {
    // Arrange
    const grid = createGrid([
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(false);
  });

  it("does not match when a forbidden neighbour is present", () => {
    // Arrange
    const grid = createGrid([
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    // pattern expects top-right to be false, but it is 1
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(false);
  });

  it("reads the left neighbour of column 0 from the last column", () => {
    // Arrange
    // Corner cell (0,0): its left neighbour wraps to (2,0).
    const grid = createGrid([
      [0, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const pattern = [false, false, false, true, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 0, 0, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("reads the top neighbour of row 0 from the last row", () => {
    // Arrange
    // Corner cell (0,0): its top neighbour wraps to (0,2).
    const grid = createGrid([
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const pattern = [false, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 0, 0, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("matches an all-false pattern on an empty grid", () => {
    // Arrange
    const grid: Grid = [];
    const pattern = [false, false, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 0, 0, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("matches an all-surrounded pattern", () => {
    // Arrange
    const grid = createGrid([
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]);
    const pattern = [true, true, true, true, true, true, true, true];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("does not count a dormant claimed neighbour as present", () => {
    // Arrange — the top-left neighbour is claimed by player 1 but dormant,
    // so the pattern requiring it to hold a live cell does not match.
    const grid: Grid = [
      [{ ownerId: 1, value: null }, alive(1), EMPTY_CELL],
      [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
      [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
    ];
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(false);
  });

  it("throws TypeError when pattern is not an array", () => {
    // @ts-expect-error intentionally passing wrong type
    expect(() => new GeometryRule("invalid")).toThrow(TypeError);
  });

  it("throws RangeError when pattern does not have exactly 8 elements", () => {
    expect(() => new GeometryRule([true, false])).toThrow(RangeError);
  });
});
