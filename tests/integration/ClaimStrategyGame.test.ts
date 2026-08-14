import {
  ContestedCellVoidStrategy,
  FirstMatchClaimStrategy,
  HiScore,
  IncumbentClaimStrategy,
  LEVEL_ONE,
  Level,
  NeighbourMajorityClaimStrategy,
  RotatingPriorityClaimStrategy,
  StrongestMatchClaimStrategy,
} from "../../src/simulation";
import type { ClaimStrategy, Grid } from "../../src/simulation";
import { SumRule } from "../../src/simulation/rule";

/**
 * Generations each strategy is played for.
 *
 * Kept low deliberately: every case here plays a full 100x100 level, so the
 * count is the dominant cost of this file. Ten generations is already past
 * the point where the strategies diverge.
 */
const GENERATIONS = 10;

/** A viable human selection: the "Born at 3" and "Survive 2-3" presets. */
function createHumanRules(): SumRule[] {
  return [new SumRule([3]), new SumRule([2, 3], true)];
}

/**
 * Rebuilds level 1 with a different claim strategy.
 *
 * The grid, the starting pattern, and every rule set are level 1's own, so
 * the claim strategy is the only thing that varies between these runs.
 */
function createLevel(claimStrategy?: ClaimStrategy): Level {
  return Level.create(
    LEVEL_ONE.id,
    LEVEL_ONE.name,
    LEVEL_ONE.width,
    LEVEL_ONE.height,
    LEVEL_ONE.roster,
    LEVEL_ONE.startingPattern,
    claimStrategy,
  );
}

/** Plays level 1 under the given strategy and returns the resulting grid. */
function play(claimStrategy?: ClaimStrategy, generations = GENERATIONS): Grid {
  const simulation = createLevel(claimStrategy).createSimulation(
    createHumanRules(),
    HiScore.create(),
  );

  for (let i = 0; i < generations; i += 1) {
    simulation.run();
  }

  return simulation.getGrid();
}

/** The first-match outcome, played once and shared by the cases that compare against it. */
let baseline: Grid | null = null;

/** Returns the outcome of playing level 1 under the default strategy. */
function playBaseline(): Grid {
  baseline ??= play();

  return baseline;
}

/** Counts the cells of `grid` owned by nobody. */
function countEmptyCells(grid: Grid): number {
  return grid.reduce((total, row) => total + row.filter((cell) => cell === null).length, 0);
}

/** The alternative strategies, each composed over first match. */
const ALTERNATIVES: ReadonlyArray<readonly [string, ClaimStrategy]> = [
  ["incumbent", IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create())],
  ["strongest match", StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create())],
  ["neighbour majority", NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create())],
  ["rotating priority", RotatingPriorityClaimStrategy.create()],
  ["contested cell void", ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create())],
];

/**
 * End-to-end coverage of playing a level under each claim strategy, exercising
 * level -> simulation -> generations with only the claim policy varying.
 */
describe("claim strategy game", () => {
  describe("default", () => {
    it("plays level 1 exactly as an explicit first-match strategy does", () => {
      const implicit = play();
      const explicit = play(FirstMatchClaimStrategy.create());

      expect(implicit).toEqual(explicit);
    });
  });

  describe("divergence", () => {
    it.each(ALTERNATIVES)("changes the outcome under %s", (_name, strategy) => {
      const outcome = play(strategy);

      expect(outcome).not.toEqual(playBaseline());
    });
  });

  describe("determinism", () => {
    it.each(ALTERNATIVES)("reproduces a run under %s", (_name, strategy) => {
      const first = play(strategy);
      const second = play(strategy);

      expect(first).toEqual(second);
    });

    it("reproduces a run under the default strategy", () => {
      expect(play()).toEqual(play());
    });
  });

  describe("behaviour of the individual strategies", () => {
    it("leaves fewer living cells under the contested cell void strategy", () => {
      const voided = play(ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create()));

      expect(countEmptyCells(voided)).toBeGreaterThan(countEmptyCells(playBaseline()));
    });

    it("hands the human player fewer cells once priority rotates", () => {
      // Under first match the human sits at roster index 0 and wins every
      // contested cell; rotation shares that advantage with the computers.
      const rotated = play(RotatingPriorityClaimStrategy.create());

      const humanCells = (grid: Grid) =>
        grid.reduce((total, row) => total + row.filter((cell) => cell === 1).length, 0);

      expect(humanCells(rotated)).toBeLessThan(humanCells(playBaseline()));
    });

    it("keeps every player alive under the incumbent strategy", () => {
      const simulation = createLevel(
        IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create()),
      ).createSimulation(createHumanRules(), HiScore.create());

      for (let i = 0; i < GENERATIONS; i += 1) {
        simulation.run();
      }

      expect(simulation.hasLivingCells()).toBe(true);
    });
  });
});
