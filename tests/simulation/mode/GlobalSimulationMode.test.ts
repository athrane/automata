import { CellClaim } from "../../../src/simulation/claim/CellClaim";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/resolution/FirstMatchClaimStrategy";
import type { Cell } from "../../../src/simulation/Cell";
import type { Grid } from "../../../src/simulation/Grid";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import { GlobalSimulationMode } from "../../../src/simulation/mode/GlobalSimulationMode";
import type { Player } from "../../../src/simulation/player/Player";
import { SumRule } from "../../../src/simulation/rule/SumRule";

/** A single player whose rule matches any cell with exactly two of its own neighbours. */
function createPlayers(): Player[] {
  return [{ id: 1, name: "Player 1", rules: [new SumRule([2])] }];
}

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

/** The cell written for a claimed-and-alive player id. */
function alive(playerId: number): Cell {
  return { ownerId: playerId, value: playerId };
}

/** The cell written for a cell no player claims. */
const EMPTY_CELL: Cell = { ownerId: null, value: null };

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
      expect(nextGrid[1][1]).toEqual(alive(1));
      expect(nextGrid[0][0]).toEqual(EMPTY_CELL);
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
      expect(grid[1][1]).toEqual(EMPTY_CELL);
      expect(nextGrid[1][1]).toEqual(alive(1));
    });

    it("leaves an empty grid empty", () => {
      // Arrange
      const mode = GlobalSimulationMode.create();
      const grid = createGrid([]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, createPlayers()));

      // Assert
      expect(nextGrid.every((row) => row.every((cell) => cell.ownerId === null))).toBe(true);
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
      expect(grid[0][0]).toEqual(alive(1));
      expect(grid[1][1]).toEqual(EMPTY_CELL);
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
      expect(nextGrid[1][1]).toEqual(alive(1));
    });

    it("keeps ownerId and value identical on every cell it writes", () => {
      // Arrange — a rule matching every neighbour count keeps the sweep
      // writing every cell of the grid.
      const mode = GlobalSimulationMode.create();
      const players: Player[] = [
        { id: 1, name: "Player 1", rules: [new SumRule([0, 1, 2, 3, 4, 5, 6, 7, 8])] },
      ];
      const grid = createGrid([[0, 0, 1]]);

      // Act
      const nextGrid = mode.nextGeneration(createContext(grid, players));

      // Assert
      for (const row of nextGrid) {
        for (const cell of row) {
          expect(cell.ownerId).toBe(cell.value);
        }
      }
    });
  });
});
