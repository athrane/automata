import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/resolution/FirstMatchClaimStrategy";
import type { Cell } from "../../../src/simulation/Cell";
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

/** Builds a square grid, filling every cell not named in `owned` as unclaimed. */
function createGrid(
  size: number,
  owned: ReadonlyArray<readonly [number, number, number]>,
): Grid {
  const grid: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ ownerId: null, value: null })),
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

/** The cell written for a claimed-but-dormant player id. */
function dormant(playerId: number): Cell {
  return { ownerId: playerId, value: null };
}

/** The cell written for a cell no player has ever claimed. */
const EMPTY_CELL: Cell = { ownerId: null, value: null };

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
    claimStrategy: FirstMatchClaimStrategy.create(),
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
      expect(nextGrid[2][1]).toEqual(alive(1));
    });

    it("dims an owned cell its player's rules no longer match, keeping the claim", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(createLineGrid(), [createLinePlayer()], new Map());

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][1]).toEqual(dormant(1));
      expect(nextGrid[3][1]).toEqual(dormant(1));
    });

    it("leaves an unowned cell empty even when a player's rules match it", () => {
      // Arrange — (2, 1) has exactly two of player 1's cells among its
      // neighbours, so the global sweep would bring it to life.
      const mode = PlayerLocalSimulationMode.create();
      const context = createContext(createLineGrid(), [createLinePlayer()], new Map());

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][2]).toEqual(EMPTY_CELL);
    });

    it("evaluates the cell a player occupies even when the player does not own it", () => {
      // Arrange
      const mode = PlayerLocalSimulationMode.create();
      const positions = new Map<number, GridPosition>([[1, { x: 2, y: 1 }]]);
      const context = createContext(createLineGrid(), [createLinePlayer()], positions);

      // Act
      const nextGrid = mode.nextGeneration(context);

      // Assert
      expect(nextGrid[1][2]).toEqual(alive(1));
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
      expect(nextGrid[2][1]).toEqual(alive(1));
      expect(nextGrid[1][1]).toEqual(dormant(1));
      expect(nextGrid[3][3]).toEqual(alive(2));
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
      expect(nextGrid[2][2]).toEqual(alive(1));
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
      expect(grid[1][1]).toEqual(alive(1));
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
      expect(nextGrid.every((row) => row.every((cell) => cell.ownerId === null))).toBe(true);
    });

    it("re-evaluates a dormant claimed cell so it can revive", () => {
      // Arrange — (1, 2) was claimed by player 1 but its value lapsed; the
      // live cells at (1, 1) and (1, 3) give it exactly two neighbours, so
      // the survive-on-2 rule brings it back to life.
      const mode = PlayerLocalSimulationMode.create();
      const grid = createGrid(GRID_SIZE, [
        [1, 0, 1],
        [1, 1, 1],
        [1, 2, 1],
        [1, 3, 1],
      ]);
      grid[2][1] = dormant(1);

      // Act
      const nextGrid = mode.nextGeneration(
        createContext(grid, [createLinePlayer()], new Map()),
      );

      // Assert
      expect(nextGrid[2][1]).toEqual(alive(1));
    });

    it("keeps a dormant claimed cell in its owner's hands rather than clearing it", () => {
      // Arrange — a lone dormant cell has no live neighbours, so the rule
      // does not match and the value stays null; the claim must survive.
      const mode = PlayerLocalSimulationMode.create();
      const grid = createGrid(GRID_SIZE, []);
      grid[2][2] = dormant(1);

      // Act
      const nextGrid = mode.nextGeneration(
        createContext(grid, [createLinePlayer()], new Map()),
      );

      // Assert
      expect(nextGrid[2][2]).toEqual(dormant(1));
    });

    it("never pulls an unclaimed cell into a player's evaluated set by proximity", () => {
      // Arrange — (2, 1) is unclaimed but sits between two of player 1's
      // cells; only the claimed cells may be evaluated.
      const mode = PlayerLocalSimulationMode.create();
      const grid = createGrid(GRID_SIZE, [
        [1, 1, 1],
        [1, 3, 1],
      ]);

      // Act
      const nextGrid = mode.nextGeneration(
        createContext(grid, [createLinePlayer()], new Map()),
      );

      // Assert
      expect(nextGrid[1][2]).toEqual(EMPTY_CELL);
    });
  });
});
