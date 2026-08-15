import type { Grid } from "../../../src/simulation/Grid";
import { FirstClaimedCellPositioning } from "../../../src/simulation/player/FirstClaimedCellPositioning";

/** Builds a square grid, filling every cell not named in `owned` with null. */
function createGrid(
  size: number,
  owned: ReadonlyArray<readonly [number, number, number]>,
): Grid {
  const grid: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );

  for (const [x, y, playerId] of owned) {
    grid[y][x] = playerId;
  }

  return grid;
}

describe("FirstClaimedCellPositioning", () => {
  describe("selectPosition", () => {
    it("returns the first owned cell in row-major order", () => {
      // Arrange — (2, 0) precedes (0, 1) reading top-left to bottom-right.
      const strategy = FirstClaimedCellPositioning.create();
      const grid = createGrid(3, [
        [0, 1, 1],
        [2, 0, 1],
        [2, 2, 1],
      ]);

      // Act
      const position = strategy.selectPosition(grid, 1);

      // Assert
      expect(position).toEqual({ x: 2, y: 0 });
    });

    it("skips cells owned by another player", () => {
      // Arrange
      const strategy = FirstClaimedCellPositioning.create();
      const grid = createGrid(3, [
        [0, 0, 2],
        [1, 0, 2],
        [2, 1, 1],
      ]);

      // Act
      const position = strategy.selectPosition(grid, 1);

      // Assert
      expect(position).toEqual({ x: 2, y: 1 });
    });

    it("finds a cell in the last position of the grid", () => {
      // Arrange
      const strategy = FirstClaimedCellPositioning.create();
      const grid = createGrid(3, [[2, 2, 1]]);

      // Act
      const position = strategy.selectPosition(grid, 1);

      // Assert
      expect(position).toEqual({ x: 2, y: 2 });
    });

    it("throws RangeError when the player owns no cell", () => {
      // Arrange
      const strategy = FirstClaimedCellPositioning.create();
      const grid = createGrid(3, [[0, 0, 2]]);

      // Act / Assert
      expect(() => strategy.selectPosition(grid, 1)).toThrow(RangeError);
    });

    it("throws RangeError on an empty grid", () => {
      // Arrange
      const strategy = FirstClaimedCellPositioning.create();
      const grid = createGrid(3, []);

      // Act / Assert
      expect(() => strategy.selectPosition(grid, 1)).toThrow("player has no claimed cells");
    });
  });
});
