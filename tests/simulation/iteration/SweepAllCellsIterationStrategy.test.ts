import type { CellClaimResolutionStrategy } from "../../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import { SweepAllCellsIterationStrategy } from "../../../src/simulation/iteration/SweepAllCellsIterationStrategy";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";

/** A claim-resolution strategy stub these tests never invoke. */
const UNUSED_CLAIM_STRATEGY: CellClaimResolutionStrategy = {
  needsAllCandidates: true,
  selectWinner: () => null,
};

/** Builds a context over an all-empty grid of the given size. */
function createContext(width: number, height: number): GenerationContext {
  const grid: Grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ ownerId: null, value: null })),
  );

  return {
    grid,
    players: [],
    generation: 0,
    positions: new Map(),
    claimStrategy: UNUSED_CLAIM_STRATEGY,
  };
}

describe("SweepAllCellsIterationStrategy", () => {
  describe("cellsToVisit", () => {
    it("visits every cell of the grid", () => {
      // Arrange
      const strategy = SweepAllCellsIterationStrategy.create();

      // Act
      const cells = strategy.cellsToVisit(createContext(2, 2));

      // Assert
      expect(cells).toHaveLength(4);
    });

    it("visits cells in row-major order", () => {
      // Arrange
      const strategy = SweepAllCellsIterationStrategy.create();

      // Act
      const cells = strategy.cellsToVisit(createContext(2, 2));

      // Assert
      expect(cells).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
    });

    it("visits no cells for an empty grid", () => {
      // Arrange
      const strategy = SweepAllCellsIterationStrategy.create();

      // Act
      const cells = strategy.cellsToVisit(createContext(0, 0));

      // Assert
      expect(cells).toHaveLength(0);
    });
  });
});
