import { CellClaim } from "../../../src/simulation/claim/CellClaim";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import { GlobalSimulationMode } from "../../../src/simulation/mode/GlobalSimulationMode";
import type { Player } from "../../../src/simulation/player/Player";
import { SumRule } from "../../../src/simulation/rule/SumRule";

/** A single player whose rule matches any cell with exactly two of its own neighbours. */
function createPlayers(): Player[] {
  return [{ id: 1, name: "Player 1", rules: [new SumRule([2])] }];
}

/** Builds a 3x3 grid, filling every cell not named in `owned` with null. */
function createGrid(owned: ReadonlyArray<readonly [number, number, number]>): Grid {
  const grid: Grid = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null));

  for (const [x, y, playerId] of owned) {
    grid[y][x] = playerId;
  }

  return grid;
}

/** Builds a context over `grid` with the default first-match claim resolution. */
function createContext(grid: Grid, players: Player[]): GenerationContext {
  return {
    grid,
    players,
    generation: 0,
    positions: new Map(),
    cellClaim: CellClaim.create(FirstMatchClaimStrategy.create()),
  };
}

describe("GlobalSimulationMode", () => {
  describe("nextGeneration", () => {
    it("resolves every cell of the grid", () => {
      // Arrange
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([
        [0, 0, 1],
        [0, 1, 1],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(nextGrid[1][1]).toBe(1);
      expect(nextGrid[0][0]).toBeNull();
    });

    it("evaluates a cell no player owns", () => {
      // Arrange — the centre is empty, but both seeds are among its neighbours.
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([
        [0, 0, 1],
        [0, 1, 1],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(grid[1][1]).toBeNull();
      expect(nextGrid[1][1]).toBe(1);
    });

    it("leaves an empty grid empty", () => {
      // Arrange
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(nextGrid.every((row) => row.every((cell) => cell === null))).toBe(true);
    });

    it("returns a new grid rather than the one it was given", () => {
      // Arrange
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([[0, 0, 1]]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(nextGrid).not.toBe(grid);
      expect(nextGrid[0]).not.toBe(grid[0]);
    });

    it("leaves the grid it was given unchanged", () => {
      // Arrange
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([
        [0, 0, 1],
        [0, 1, 1],
      ]);

      // Act
      mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(grid[0][0]).toBe(1);
      expect(grid[1][1]).toBeNull();
    });

    it("awards a contested cell to the first player in roster order", () => {
      // Arrange — on a 3x3 toroidal grid every other cell is a neighbour, so
      // both players match the centre.
      const mode = GlobalSimulationMode.create();
      const players: Player[] = [
        { id: 1, name: "Player 1", rules: [new SumRule([1])] },
        { id: 2, name: "Player 2", rules: [new SumRule([1])] },
      ];
      const grid = createGrid([
        [0, 0, 1],
        [2, 2, 2],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, players));

      // Assert
      expect(nextGrid[1][1]).toBe(1);
    });
  });
});
