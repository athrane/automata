import { HiScore, LEVEL_ONE } from "../../src/simulation";
import type { Grid, Simulation } from "../../src/simulation";
import { PlayerLocalSimulationMode } from "../../src/simulation/mode/PlayerLocalSimulationMode";
import { FirstClaimedCellPositioning } from "../../src/simulation/player/FirstClaimedCellPositioning";
import { SumRule } from "../../src/simulation/rule";

/** A viable human selection: the "Born at 3" and "Survive 2-3" presets. */
function createViableHumanRules(): SumRule[] {
  return [new SumRule([3]), new SumRule([2, 3], true)];
}

/** Starts level 1 in player local mode with every player on its first claimed cell. */
function createLocalGame(): Simulation {
  return LEVEL_ONE.createSimulation(
    createViableHumanRules(),
    HiScore.create(),
    PlayerLocalSimulationMode.create(),
    FirstClaimedCellPositioning.create(),
  );
}

/** Returns every cell whose owner differs between the two grids. */
function findOwnerChanges(before: Grid, after: Grid): { from: number; to: number }[] {
  const changes: { from: number; to: number }[] = [];

  for (let y = 0; y < before.length; y += 1) {
    for (let x = 0; x < before[y].length; x += 1) {
      const from = before[y][x];
      const to = after[y][x];

      if (from !== null && to !== null && from !== to) {
        changes.push({ from, to });
      }
    }
  }

  return changes;
}

/**
 * End-to-end coverage of playing level 1 in player local simulation mode,
 * exercising the path the game screen takes: level -> configuration ->
 * generations.
 */
describe("player local game", () => {
  describe("start positions", () => {
    it("gives every player a position", () => {
      // Arrange / Act
      const simulation = createLocalGame();

      // Assert
      expect(simulation.getPlayerPositions().size).toBe(simulation.getPlayers().length);
    });

    it("places every player inside a cell it owns at generation 0", () => {
      // Arrange
      const simulation = createLocalGame();

      // Act
      const grid = simulation.getGrid();

      // Assert
      for (const [playerId, position] of simulation.getPlayerPositions()) {
        expect(grid[position.y][position.x]).toBe(playerId);
      }
    });

    it("places each player on the top-left cell of its own block", () => {
      // Arrange / Act
      const simulation = createLocalGame();

      // Assert — the level's checker starts with player 1's block at the origin.
      expect(simulation.getPlayerPosition(1)).toEqual({ x: 0, y: 0 });
    });
  });

  describe("playing generations", () => {
    it("never lets a cell change from one player to another", () => {
      // Arrange
      const simulation = createLocalGame();

      // Act / Assert
      for (let generation = 0; generation < 10; generation += 1) {
        const before = simulation.getGrid();
        const after = simulation.run();

        expect(findOwnerChanges(before, after)).toEqual([]);
      }
    });

    it("only ever loses territory while every player stands still", () => {
      // Arrange
      const simulation = createLocalGame();
      const openingCounts = simulation.getCellCounts();

      // Act
      for (let generation = 0; generation < 10; generation += 1) {
        simulation.run();
      }

      // Assert
      for (const [playerId, count] of simulation.getCellCounts()) {
        expect(count).toBeLessThanOrEqual(openingCounts.get(playerId) ?? 0);
      }
    });

    it("advances the generation counter like any other mode", () => {
      // Arrange
      const simulation = createLocalGame();

      // Act
      for (let generation = 0; generation < 5; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.generation).toBe(5);
    });
  });

  describe("moving the human player", () => {
    it("brings the occupied cell to life when the player's rules match it", () => {
      // Arrange — the empty block of the checker starts at x = 40, whose
      // left-hand column neighbours player 4's block.
      const simulation = createLocalGame();
      const target = { x: 40, y: 0 };

      // Act
      const moved = simulation.movePlayer(1, target.x, target.y);

      // Assert — an unclaimed cell is a legal destination.
      expect(moved).toBe(true);
      expect(simulation.getPlayerPosition(1)).toEqual(target);
      expect(simulation.getGrid()[target.y][target.x]).toBeNull();
    });

    it("leaves the rest of the grid unaffected by the move itself", () => {
      // Arrange
      const simulation = createLocalGame();
      const before = simulation.getGrid();

      // Act
      simulation.movePlayer(1, 40, 0);

      // Assert
      expect(simulation.getGrid()).toEqual(before);
    });

    it("refuses to walk the human into another player's territory", () => {
      // Arrange — player 2's block starts at x = 10 on row 0.
      const simulation = createLocalGame();

      // Act
      const moved = simulation.movePlayer(1, 10, 0);

      // Assert
      expect(moved).toBe(false);
      expect(simulation.getPlayerPosition(1)).toEqual({ x: 0, y: 0 });
    });
  });
});
