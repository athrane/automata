import type { Cell } from "../../../src/simulation/Cell";
import type { Grid } from "../../../src/simulation/Grid";
import { ConversionRule } from "../../../src/simulation/rule/ConversionRule";
import type { CellSelector } from "../../../src/simulation/rule/selector";
import {
  OtherPlayerCellSelector,
  OwnCellSelector,
  SpecificPlayerCellSelector,
} from "../../../src/simulation/rule/selector";

/** Builds a claimed-and-alive cell for `owner`. */
function alive(owner: number): Cell {
  return { ownerId: owner, value: owner };
}

/** An unclaimed cell. */
const EMPTY_CELL: Cell = { ownerId: null, value: null };

/** Builds a grid from a compact literal, where 0 means empty. */
function createGrid(rows: ReadonlyArray<ReadonlyArray<number>>): Grid {
  return rows.map((row) => row.map((entry) => (entry === 0 ? EMPTY_CELL : alive(entry))));
}

/** A rule taking another player's cell when 2 or 3 of its neighbours are the acting player's. */
function createTakeoverRule(): ConversionRule {
  return ConversionRule.create(OtherPlayerCellSelector.create(), OwnCellSelector.create(), [2, 3]);
}

describe("ConversionRule", () => {
  describe("matches", () => {
    it("matches a target cell whose trigger count is in the set", () => {
      // Arrange — the centre is player 2's, with two of player 1's neighbours.
      const grid = createGrid([
        [1, 1, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = createTakeoverRule().matches(grid, 1, 1, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("does not match a target cell whose trigger count is outside the set", () => {
      // Arrange — only one of player 1's cells borders the centre.
      const grid = createGrid([
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = createTakeoverRule().matches(grid, 1, 1, 1);

      // Assert
      expect(result).toBe(false);
    });

    it("never matches a cell the target does not select", () => {
      // Arrange — the centre is empty, so "another player's cell" does not apply.
      const grid = createGrid([
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = createTakeoverRule().matches(grid, 1, 1, 1);

      // Assert
      expect(result).toBe(false);
    });

    it("never matches the acting player's own cell under an other-player target", () => {
      // Arrange
      const grid = createGrid([
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = createTakeoverRule().matches(grid, 1, 1, 1);

      // Assert
      expect(result).toBe(false);
    });

    it("counts a specific trigger player that differs from the acting player", () => {
      // Arrange — player 5 takes player 3's cell beside a catalyst (player 4).
      const rule = ConversionRule.create(
        SpecificPlayerCellSelector.create(3),
        SpecificPlayerCellSelector.create(4),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
      const grid = createGrid([
        [3, 3, 3, 0],
        [3, 3, 4, 0],
        [3, 3, 3, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = rule.matches(grid, 1, 1, 5);

      // Assert
      expect(result).toBe(true);
    });

    it("does not count the acting player's cells under a specific trigger", () => {
      // Arrange — the neighbours are player 5's own cells, not the catalyst's.
      const rule = ConversionRule.create(
        SpecificPlayerCellSelector.create(3),
        SpecificPlayerCellSelector.create(4),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
      const grid = createGrid([
        [5, 5, 5, 0],
        [5, 3, 5, 0],
        [5, 5, 5, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = rule.matches(grid, 1, 1, 5);

      // Assert
      expect(result).toBe(false);
    });

    it("reads neighbours across the grid edge", () => {
      // Arrange — (0,0)'s left and top-left neighbours wrap to the last column.
      const grid = createGrid([
        [2, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);

      // Act
      const result = createTakeoverRule().matches(grid, 0, 0, 1);

      // Assert
      expect(result).toBe(true);
    });

    it("does not match on an empty grid", () => {
      expect(createTakeoverRule().matches([], 0, 0, 1)).toBe(false);
    });
  });

  describe("create", () => {
    it("throws TypeError when the target is missing", () => {
      expect(() =>
        ConversionRule.create(undefined as unknown as CellSelector, OwnCellSelector.create(), [1]),
      ).toThrow(TypeError);
    });

    it("throws TypeError when the trigger is missing", () => {
      expect(() =>
        ConversionRule.create(OwnCellSelector.create(), null as unknown as CellSelector, [1]),
      ).toThrow(TypeError);
    });

    it("throws TypeError when counts is not an array", () => {
      expect(() =>
        ConversionRule.create(
          OwnCellSelector.create(),
          OwnCellSelector.create(),
          3 as unknown as number[],
        ),
      ).toThrow(TypeError);
    });

    it("throws RangeError when a count exceeds 8", () => {
      expect(() =>
        ConversionRule.create(OwnCellSelector.create(), OwnCellSelector.create(), [9]),
      ).toThrow(RangeError);
    });

    it("throws RangeError when a count is negative", () => {
      expect(() =>
        ConversionRule.create(OwnCellSelector.create(), OwnCellSelector.create(), [-1]),
      ).toThrow(RangeError);
    });

    it("throws RangeError when a count is not an integer", () => {
      expect(() =>
        ConversionRule.create(OwnCellSelector.create(), OwnCellSelector.create(), [1.5]),
      ).toThrow(RangeError);
    });

    it("accepts the full range 0 to 8", () => {
      expect(() =>
        ConversionRule.create(
          OwnCellSelector.create(),
          OwnCellSelector.create(),
          [0, 1, 2, 3, 4, 5, 6, 7, 8],
        ),
      ).not.toThrow();
    });
  });
});
