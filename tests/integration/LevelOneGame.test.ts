import { HiScore, LEVEL_ONE } from "../../src/simulation";
import type { Grid } from "../../src/simulation";
import { SumRule } from "../../src/simulation/rule";

/** Width and height of one checker block in level 1, in cells. */
const BLOCK_SIZE = 10;

/** A viable human selection: the "Born at 3" and "Survive 2-3" presets. */
function createViableHumanRules(): SumRule[] {
  return [new SumRule([3]), new SumRule([2, 3], true)];
}

/** Counts the cells of `grid` owned by nobody. */
function countEmptyCells(grid: Grid): number {
  return grid.reduce(
    (total, row) => total + row.filter((cell) => cell === null).length,
    0,
  );
}

/**
 * End-to-end coverage of starting and playing level 1, exercising the path the
 * game screen takes: level -> simulation -> generations -> hi-score.
 *
 * These replace the manual browser checks that do not depend on rendering.
 */
describe("level 1 game", () => {
  describe("opening grid", () => {
    it("fills the first block with the human player's cells", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      const grid = simulation.getGrid();

      // Assert
      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          expect(grid[y][x]).toBe(1);
        }
      }
    });

    it("repeats the checker along both axes", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      const grid = simulation.getGrid();

      // Assert
      expect(grid[0][BLOCK_SIZE]).toBe(2);
      expect(grid[BLOCK_SIZE][0]).toBe(2);
    });

    it("leaves every fifth block empty", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      const grid = simulation.getGrid();

      // Assert
      expect(grid[0][BLOCK_SIZE * 4]).toBeNull();
      expect(grid[BLOCK_SIZE * 4][0]).toBeNull();
      expect(countEmptyCells(grid)).toBe(2000);
    });

    it("gives all four participants an equal share", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      const counts = simulation.getCellCounts();

      // Assert
      expect([...counts.values()]).toEqual([2000, 2000, 2000, 2000]);
    });

    it("starts at generation 0", () => {
      // Arrange / Act
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Assert
      expect(simulation.generation).toBe(0);
    });
  });

  describe("determinism", () => {
    it("evolves two runs with the same human rules identically", () => {
      // Arrange
      const first = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());
      const second = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      for (let generation = 0; generation < 25; generation += 1) {
        first.run();
        second.run();
      }

      // Assert
      expect(first.getGrid()).toEqual(second.getGrid());
      expect(first.getCellCounts()).toEqual(second.getCellCounts());
    });

    it("reaches the same generation count in both runs", () => {
      // Arrange
      const first = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());
      const second = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      for (let generation = 0; generation < 25; generation += 1) {
        first.run();
        second.run();
      }

      // Assert
      expect(first.generation).toBe(second.generation);
    });
  });

  describe("the human player's selection", () => {
    it("changes the outcome of the run", () => {
      // Arrange
      const born = LEVEL_ONE.createSimulation(
        [new SumRule([3]), new SumRule([2, 3], true)],
        HiScore.create(),
      );
      const survive = LEVEL_ONE.createSimulation(
        [new SumRule([1]), new SumRule([1], true)],
        HiScore.create(),
      );

      // Act
      for (let generation = 0; generation < 10; generation += 1) {
        born.run();
        survive.run();
      }

      // Assert
      expect(born.getCellCounts().get(1)).not.toBe(survive.getCellCounts().get(1));
    });

    it("eliminates a human player whose rules cannot sustain cells", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation([new SumRule([8])], HiScore.create());

      // Act
      for (let generation = 0; generation < 10; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.getCellCounts().get(1)).toBe(0);
    });

    it("leaves the level's computer players running when the human is eliminated", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation([new SumRule([8])], HiScore.create());

      // Act
      for (let generation = 0; generation < 10; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.hasLivingCells()).toBe(true);
    });
  });

  describe("playing on", () => {
    it("keeps the grid populated well past the opening generations", () => {
      // Arrange
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), HiScore.create());

      // Act
      for (let generation = 0; generation < 50; generation += 1) {
        simulation.run();
      }

      // Assert
      expect(simulation.hasLivingCells()).toBe(true);
    });

    it("records the generations survived as the hi-score", () => {
      // Arrange
      const hiScore = HiScore.create();
      const simulation = LEVEL_ONE.createSimulation(createViableHumanRules(), hiScore);

      // Act
      for (let generation = 0; generation < 12; generation += 1) {
        simulation.run();
      }
      simulation.recordHiScore(LEVEL_ONE.roster.human.name);

      // Assert
      expect(hiScore.getEntries()).toEqual([{ name: "Player 1", score: 12 }]);
    });
  });
});
