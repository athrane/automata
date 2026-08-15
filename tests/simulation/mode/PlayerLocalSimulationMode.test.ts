import { CellClaim } from "../../../src/simulation/claim/CellClaim";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import { PlayerLocalSimulationMode } from "../../../src/simulation/mode/PlayerLocalSimulationMode";
import type { GridPosition } from "../../../src/simulation/player/GridPosition";
import type { Player } from "../../../src/simulation/player/Player";
import { SumRule } from "../../../src/simulation/rule/SumRule";

/** Width and height of the grid every test in this file works on. */
const GRID_SIZE = 5;

/** Rule matching a cell with any neighbour count, so it never limits evaluation. */
function createAlwaysMatchingRule(): SumRule {
  return new SumRule([0, 1, 2, 3, 4, 5, 6, 7, 8]);
}

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

/** Builds a context over `grid` with the default first-match claim resolution. */
function createContext(
  grid: Grid,
  players: Player[],
  positions: ReadonlyMap<number, GridPosition>,
): GenerationContext {
  return {
    grid,
    players,
    generation: 0,
    positions,
    cellClaim: CellClaim.create(FirstMatchClaimStrategy.create()),
  };
}

/**
 * A vertical line of three cells owned by player 1 at x = 1, y = 1..3.
 *
 * With a "survive on exactly 2 neighbours" rule the middle cell lives on and
 * both ends die, so one grid covers both outcomes.
 */
function createLineGrid(): Grid {
  return createGrid(GRID_SIZE, [
    [1, 1, 1],
    [1, 2, 1],
    [1, 3, 1],
  ]);
}

/** Player 1, surviving only on exactly two of its own neighbours. */
function createLinePlayer(): Player {
  return { id: 1, name: "Player 1", rules: [new SumRule([2])] };
}

describe("PlayerLocalSimulationMode", () => {
  describe("nextGeneration", () => {
    it("keeps an owned cell its player's rules still match", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(createLineGrid(), [createLinePlayer()], new Map());

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[2][1]).toBe(1);
    });

    it("clears an owned cell its player's rules no longer match", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(createLineGrid(), [createLinePlayer()], new Map());

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][1]).toBeNull();
      expect(nextGrid[3][1]).toBeNull();
    });

    it("leaves an unowned cell empty even when a player's rules match it", () => {
      // Arrange — (2, 1) has exactly two of player 1's cells among its
      // neighbours, so the global sweep would bring it to life.
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(createLineGrid(), [createLinePlayer()], new Map());

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][2]).toBeNull();
    });

    it("evaluates the cell a player occupies even when the player does not own it", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const positions = new Map<number, GridPosition>([[1, { x: 2, y: 1 }]]);
      const context = createContext(createLineGrid(), [createLinePlayer()], positions);

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][2]).toBe(1);
    });

    it("never lets one player take a cell owned by another", () => {
      // Arrange — player 2's rule matches every cell in the grid.
      const mode = PlayerLocalSimulationMode.create();
      const players: Player[] = [
        createLinePlayer(),
        { id: 2, name: "Player 2", rules: [createAlwaysMatchingRule()] },
      ];
      const grid = createGrid(GRID_SIZE, [
        [1, 1, 1],
        [1, 2, 1],
        [1, 3, 1],
        [3, 3, 2],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, players, new Map()));

      // Assert
      expect(nextGrid[2][1]).toBe(1);
      expect(nextGrid[1][1]).toBeNull();
      expect(nextGrid[3][3]).toBe(2);
    });

    it("awards a cell two players occupy to the earlier one in roster order", () => {
      // Arrange — both players stand on the same empty cell, which only
      // happens once one has stepped onto the other's position.
      const mode = PlayerLocalSimulationMode.create();
      const players: Player[] = [
        { id: 1, name: "Player 1", rules: [createAlwaysMatchingRule()] },
        { id: 2, name: "Player 2", rules: [createAlwaysMatchingRule()] },
      ];
      const positions = new Map<number, GridPosition>([
        [1, { x: 2, y: 2 }],
        [2, { x: 2, y: 2 }],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(
        createContext(createGrid(GRID_SIZE, []), players, positions),
      );

      // Assert
      expect(nextGrid[2][2]).toBe(1);
    });

    it("returns a new grid rather than the one it was given", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const grid = createLineGrid();

      // Act
      const nextGrid = mode.nextGeneration(
        createContext(grid, [createLinePlayer()], new Map()),
      );

      // Assert
      expect(nextGrid).not.toBe(grid);
      expect(grid[1][1]).toBe(1);
    });

    it("leaves an empty grid empty", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(
        createGrid(GRID_SIZE, []),
        [createLinePlayer()],
        new Map(),
      );

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid.every((row) => row.every((cell) => cell === null))).toBe(true);
    });
  });
});
