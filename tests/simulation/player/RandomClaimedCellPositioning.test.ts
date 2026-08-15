import type { Grid } from "../../../src/simulation/Grid";
import { RandomClaimedCellPositioning } from "../../../src/simulation/player/RandomClaimedCellPositioning";

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

/** A grid where player 1 owns three cells and player 2 owns one. */
function createSharedGrid(): Grid {
  return createGrid(3, [
    [1, 0, 1],
    [0, 1, 2],
    [2, 1, 1],
    [0, 2, 1],
  ]);
}

describe("RandomClaimedCellPositioning", () => {
  describe("selectPosition", () => {
    it("picks the first owned cell when the generator returns 0", () => {
      // Arrange
      const strategy = RandomClaimedCellPositioning.create(() => 0);

      // Act
      const position = strategy.selectPosition(createSharedGrid(), 1);

      // Assert
      expect(position).toEqual({ x: 1, y: 0 });
    });

    it("picks the last owned cell when the generator returns almost 1", () => {
      // Arrange
      const strategy = RandomClaimedCellPositioning.create(() => 0.999);

      // Act
      const position = strategy.selectPosition(createSharedGrid(), 1);

      // Assert
      expect(position).toEqual({ x: 0, y: 2 });
    });

    it("picks a middle cell for a generator value inside the range", () => {
      // Arrange — three owned cells, so 0.5 lands on the second.
      const strategy = RandomClaimedCellPositioning.create(() => 0.5);

      // Act
      const position = strategy.selectPosition(createSharedGrid(), 1);

      // Assert
      expect(position).toEqual({ x: 2, y: 1 });
    });

    it("only ever returns a cell the player owns", () => {
      // Arrange
      const grid = createSharedGrid();

      // Act / Assert
      for (const value of [0, 0.25, 0.5, 0.75, 0.999]) {
        const position = RandomClaimedCellPositioning.create(() => value)
          .selectPosition(grid, 1);

        expect(grid[position.y][position.x]).toBe(1);
      }
    });

    it("defaults to Math.random when no generator is supplied", () => {
      // Arrange
      const grid = createSharedGrid();

      // Act
      const position = RandomClaimedCellPositioning.create().selectPosition(grid, 1);

      // Assert
      expect(grid[position.y][position.x]).toBe(1);
    });

    it("throws RangeError when the player owns no cell", () => {
      // Arrange
      const strategy = RandomClaimedCellPositioning.create(() => 0);

      // Act / Assert
      expect(() => strategy.selectPosition(createSharedGrid(), 3)).toThrow(RangeError);
    });
  });
});
