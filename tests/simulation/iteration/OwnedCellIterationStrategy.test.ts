import type { CellClaimResolutionStrategy } from "../../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import { OwnedCellIterationStrategy } from "../../../src/simulation/iteration/OwnedCellIterationStrategy";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import type { GridPosition } from "../../../src/simulation/player/GridPosition";

/** A claim-resolution strategy stub these tests never invoke. */
const UNUSED_CLAIM_STRATEGY: CellClaimResolutionStrategy = {
  needsAllCandidates: true,
  selectWinner: () => null,
};

/** Builds a 3x3 grid, filling every cell not named in `owned` as unclaimed. */
function createGrid(owned: ReadonlyArray<readonly [number, number, number]>): Grid {
  const grid: Grid = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => ({ ownerId: null, value: null })),
  );

  for (const [x, y, playerId] of owned) {
    grid[y][x] = { ownerId: playerId, value: playerId };
  }

  return grid;
}

/** Builds a context over `grid` with the given player positions. */
function createContext(
  grid: Grid,
  positions: ReadonlyMap<number, GridPosition>,
): GenerationContext {
  return {
    grid,
    players: [],
    generation: 0,
    positions,
    claimStrategy: UNUSED_CLAIM_STRATEGY,
  };
}

describe("OwnedCellIterationStrategy", () => {
  describe("cellsToVisit", () => {
    it("visits every owned cell", () => {
      // Arrange
      const strategy = OwnedCellIterationStrategy.create();
      const grid = createGrid([
        [0, 0, 1],
        [2, 2, 1],
      ]);

      // Act
      const cells = strategy.cellsToVisit(createContext(grid, new Map()));

      // Assert
      expect(cells).toEqual(
        expect.arrayContaining([
          { x: 0, y: 0 },
          { x: 2, y: 2 },
        ]),
      );
      expect(cells).toHaveLength(2);
    });

    it("visits a player's current position even when it owns nothing there", () => {
      // Arrange
      const strategy = OwnedCellIterationStrategy.create();
      const grid = createGrid([]);
      const positions = new Map<number, GridPosition>([[1, { x: 1, y: 1 }]]);

      // Act
      const cells = strategy.cellsToVisit(createContext(grid, positions));

      // Assert
      expect(cells).toEqual([{ x: 1, y: 1 }]);
    });

    it("does not visit a cell twice when it is both owned and occupied", () => {
      // Arrange
      const strategy = OwnedCellIterationStrategy.create();
      const grid = createGrid([[1, 1, 1]]);
      const positions = new Map<number, GridPosition>([[1, { x: 1, y: 1 }]]);

      // Act
      const cells = strategy.cellsToVisit(createContext(grid, positions));

      // Assert
      expect(cells).toHaveLength(1);
    });

    it("does not visit a cell twice when two players occupy the same unowned cell", () => {
      // Arrange
      const strategy = OwnedCellIterationStrategy.create();
      const grid = createGrid([]);
      const positions = new Map<number, GridPosition>([
        [1, { x: 1, y: 1 }],
        [2, { x: 1, y: 1 }],
      ]);

      // Act
      const cells = strategy.cellsToVisit(createContext(grid, positions));

      // Assert
      expect(cells).toEqual([{ x: 1, y: 1 }]);
    });

    it("visits nothing when the grid is empty and no player has a position", () => {
      // Arrange
      const strategy = OwnedCellIterationStrategy.create();
      const grid = createGrid([]);

      // Act
      const cells = strategy.cellsToVisit(createContext(grid, new Map()));

      // Assert
      expect(cells).toHaveLength(0);
    });
  });
});
