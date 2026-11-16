import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/resolution/FirstMatchClaimStrategy";
import type { Cell } from "../../../src/simulation/Cell";
import type { Grid } from "../../../src/simulation/Grid";
import { ConversionSimulationMode } from "../../../src/simulation/mode/ConversionSimulationMode";
import type { GenerationContext } from "../../../src/simulation/mode/GenerationContext";
import type { Player } from "../../../src/simulation/player/Player";
import { ConversionRule } from "../../../src/simulation/rule/ConversionRule";
import { OtherPlayerCellSelector, OwnCellSelector } from "../../../src/simulation/rule/selector";

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

/** Player 1 takes another player's cell with 2 or more of its own neighbours; player 2 has no rules. */
function createPlayers(): Player[] {
  return [
    {
      id: 1,
      name: "Player 1",
      rules: [
        ConversionRule.create(OtherPlayerCellSelector.create(), OwnCellSelector.create(), [2, 3, 4, 5, 6, 7, 8]),
      ],
    },
    { id: 2, name: "Player 2", rules: [] },
  ];
}

/** Builds a context over `grid` with first-match claim resolution. */
function createContext(grid: Grid): GenerationContext {
  return {
    grid,
    players: createPlayers(),
    generation: 0,
    positions: new Map(),
    claimStrategy: FirstMatchClaimStrategy.create(),
  };
}

describe("ConversionSimulationMode", () => {
  describe("nextGeneration", () => {
    it("keeps the value of a cell no rule matches", () => {
      // Arrange
      const grid = createGrid([
        [1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 2, 0],
        [0, 0, 0, 0, 0],
      ]);

      // Act
      const nextGrid = ConversionSimulationMode.create().nextGeneration(createContext(grid));

      // Assert
      expect(nextGrid[3][3]).toEqual(alive(2));
      expect(nextGrid[0][0]).toEqual(alive(1));
      expect(nextGrid[4][4]).toEqual(EMPTY_CELL);
    });

    it("replaces the value of a cell a conversion rule matches", () => {
      // Arrange — (1,1) is player 2's, with two of player 1's neighbours.
      const grid = createGrid([
        [1, 1, 0, 0, 0],
        [0, 2, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ]);

      // Act
      const nextGrid = ConversionSimulationMode.create().nextGeneration(createContext(grid));

      // Assert
      expect(nextGrid[1][1]).toEqual(alive(1));
    });
  });
});
