import {
  CheckerStartingPattern,
  ContestedCellVoidStrategy,
  FirstMatchClaimStrategy,
  HiScore,
  Simulation,
  SimulationOptions,
} from "../../src/simulation";
import type { Cell } from "../../src/simulation/Cell";
import type { ClaimCandidate } from "../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../src/simulation/claim/ClaimStrategy";
import { SumRule } from "../../src/simulation/rule";

/** A strategy that records its arguments and returns a fixed winner. */
interface RecordingStrategy extends ClaimStrategy {
  candidateIds: number[][];
  generations: number[];
}

/** Builds a strategy that always returns the given winner and records every call. */
function createRecordingStrategy(winner: Cell): RecordingStrategy {
  const candidateIds: number[][] = [];
  const generations: number[] = [];

  return {
    candidateIds,
    generations,
    needsAllCandidates: true,
    selectWinner(candidates: ReadonlyArray<ClaimCandidate>, context: ClaimContext): Cell {
      candidateIds.push(candidates.map((candidate) => candidate.player.id));
      generations.push(context.generation);
      return winner;
    },
  };
}

/**
 * Two players whose single rule matches any cell with exactly one of their
 * own cells among its neighbours.
 */
function createContestingPlayers() {
  return [
    { id: 1, name: "Player 1", rules: [new SumRule([1])] },
    { id: 2, name: "Player 2", rules: [new SumRule([1])] },
  ];
}

describe("Simulation", () => {
  it("starts at generation 0 with default 100x100 grid", () => {
    const simulation = Simulation.create();

    const grid = simulation.getGrid();

    expect(simulation.generation).toBe(0);
    expect(simulation.width).toBe(100);
    expect(simulation.height).toBe(100);
    expect(grid).toHaveLength(100);
    expect(grid[0]).toHaveLength(100);
  });

  it("supports custom rectangular grid size", () => {
    const simulation = Simulation.create(SimulationOptions.create(3, 2));

    const grid = simulation.getGrid();

    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
  });

  it("calculates the next generation when run is called", () => {
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [{ id: 1, name: "Player 1", rules: [new SumRule([2])] }]),
    );

    simulation.setCell(0, 0, 1);
    simulation.setCell(0, 1, 1);

    const nextGrid = simulation.run();

    expect(simulation.generation).toBe(1);
    expect(nextGrid[1][1]).toBe(1);
    expect(nextGrid[0][0]).toBeNull();
  });

  it("combines a player's multiple rules with OR, not AND", () => {
    // These two rules can never both match the same cell (a neighbor count
    // cannot be both 1 and 4 at once). An AND combination would therefore
    // never populate any cell, starving the grid within a generation.
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [
        { id: 1, name: "Player 1", rules: [new SumRule([1]), new SumRule([4])] },
      ]),
    );

    simulation.setCell(0, 0, 1);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });

  it("supports multiple players with different rulesets", () => {
    const simulation = Simulation.create(
      SimulationOptions.create(3, 3, [
        { id: 1, name: "Player 1", rules: [new SumRule([1])] },
        { id: 2, name: "Player 2", rules: [new SumRule([1])] },
      ]),
    );

    simulation.setCell(0, 0, 1);
    simulation.setCell(0, 1, 2);

    const nextGrid = simulation.run();

    expect(nextGrid[1][1]).toBe(1);
  });

  describe("claim strategy", () => {
    it("awards contested cells to the first player in the roster by default", () => {
      // On a 3x3 toroidal grid every other cell is a neighbour, so both
      // players match every cell except the one holding their own seed.
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, createContestingPlayers()),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(2, 2, 2);

      const nextGrid = simulation.run();

      expect(nextGrid[1][1]).toBe(1);
      expect(nextGrid[0][0]).toBe(2);
      expect(nextGrid[2][2]).toBe(1);
    });

    it("resolves cells through the strategy supplied in the options", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(
          3,
          3,
          createContestingPlayers(),
          HiScore.create(),
          ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create()),
        ),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(2, 2, 2);

      const nextGrid = simulation.run();

      expect(nextGrid[1][1]).toBeNull();
      expect(nextGrid[0][0]).toBe(2);
      expect(nextGrid[2][2]).toBe(1);
    });

    it("offers the strategy every player that matched the cell", () => {
      const strategy = createRecordingStrategy(2);
      const simulation = Simulation.create(
        SimulationOptions.create(
          3,
          3,
          createContestingPlayers(),
          HiScore.create(),
          strategy,
        ),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(2, 2, 2);
      simulation.run();

      expect(strategy.candidateIds).toContainEqual([1, 2]);
    });

    it("writes the strategy's choice into the next grid", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(
          3,
          3,
          createContestingPlayers(),
          HiScore.create(),
          createRecordingStrategy(2),
        ),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(2, 2, 2);

      const nextGrid = simulation.run();

      expect(nextGrid[1][1]).toBe(2);
    });

    it("leaves a cell empty when the strategy declines to award it", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(
          3,
          3,
          createContestingPlayers(),
          HiScore.create(),
          createRecordingStrategy(null),
        ),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(2, 2, 2);

      const nextGrid = simulation.run();

      expect(simulation.hasLivingCells()).toBe(false);
      expect(nextGrid[1][1]).toBeNull();
    });

    it("passes the generation being read, not the one being written", () => {
      const strategy = createRecordingStrategy(1);
      // A rule accepting every neighbour count keeps the player a candidate
      // for every cell, so the strategy is consulted in both generations.
      const players = [
        { id: 1, name: "Player 1", rules: [new SumRule([0, 1, 2, 3, 4, 5, 6, 7, 8])] },
      ];
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, players, HiScore.create(), strategy),
      );

      simulation.run();
      simulation.run();

      expect(strategy.generations[0]).toBe(0);
      expect(strategy.generations.at(-1)).toBe(1);
    });
  });

  describe("getCellCounts", () => {
    it("reports zero for every registered player on an empty grid", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      const counts = simulation.getCellCounts();

      expect(counts.get(1)).toBe(0);
      expect(counts.get(2)).toBe(0);
    });

    it("counts cells against their owning player", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.setCell(1, 0, 1);
      simulation.setCell(2, 2, 2);

      const counts = simulation.getCellCounts();

      expect(counts.get(1)).toBe(2);
      expect(counts.get(2)).toBe(1);
    });

    it("keeps a player with no cells in the result", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);

      const counts = simulation.getCellCounts();

      expect(counts.size).toBe(2);
      expect(counts.get(2)).toBe(0);
    });
  });

  describe("getScores", () => {
    it("reports zero for every registered player before any generation runs", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      const scores = simulation.getScores();

      expect(scores.get(1)).toBe(0);
      expect(scores.get(2)).toBe(0);
    });

    it("adds each generation's cell count to the running total instead of replacing it", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [new SumRule([0, 1, 2, 3, 4, 5, 6, 7, 8])] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.run();
      const afterFirstRun = simulation.getCellCounts().get(1) ?? 0;

      simulation.run();
      const afterSecondRun = simulation.getCellCounts().get(1) ?? 0;

      expect(simulation.getScores().get(1)).toBe(afterFirstRun + afterSecondRun);
    });

    it("keeps a player with no cells in the result", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.run();

      expect(simulation.getScores().size).toBe(2);
      expect(simulation.getScores().get(2)).toBe(0);
    });
  });

  describe("getPlayers", () => {
    it("returns the players supplied through the options", () => {
      const players = [
        { id: 1, name: "Player 1", rules: [] },
        { id: 2, name: "Player 2", rules: [] },
      ];
      const simulation = Simulation.create(SimulationOptions.create(3, 3, players));

      expect(simulation.getPlayers().map((player) => player.id)).toEqual([1, 2]);
    });

    it("returns an empty list when no players are registered", () => {
      const simulation = Simulation.create(SimulationOptions.create(3, 3));

      expect(simulation.getPlayers()).toHaveLength(0);
    });
  });

  describe("applyStartingPattern", () => {
    it("writes the pattern into every cell", () => {
      const simulation = Simulation.create(SimulationOptions.create(4, 4));

      simulation.applyStartingPattern(CheckerStartingPattern.create(2, [1, 2]));

      const grid = simulation.getGrid();

      expect(grid[0][0]).toBe(1);
      expect(grid[0][2]).toBe(2);
      expect(grid[2][0]).toBe(2);
      expect(grid[2][2]).toBe(1);
    });

    it("overwrites cells that are already occupied", () => {
      const simulation = Simulation.create(SimulationOptions.create(4, 4));

      simulation.setCell(0, 0, 9);
      simulation.applyStartingPattern(CheckerStartingPattern.create(2, [1, 2]));

      expect(simulation.getGrid()[0][0]).toBe(1);
    });

    it("clears cells the pattern leaves empty", () => {
      const simulation = Simulation.create(SimulationOptions.create(4, 4));

      simulation.setCell(0, 0, 9);
      simulation.applyStartingPattern(CheckerStartingPattern.create(2, [null]));

      expect(simulation.getGrid()[0][0]).toBeNull();
    });

    it("resets the generation counter to zero", () => {
      const simulation = Simulation.create(SimulationOptions.create(4, 4));

      simulation.run();
      simulation.run();
      simulation.applyStartingPattern(CheckerStartingPattern.create(2, [1, 2]));

      expect(simulation.generation).toBe(0);
    });

    it("resets every player's score to zero", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(4, 4, [
          { id: 1, name: "Player 1", rules: [new SumRule([0, 1, 2, 3, 4, 5, 6, 7, 8])] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.run();
      simulation.applyStartingPattern(CheckerStartingPattern.create(2, [1, 2]));

      expect(simulation.getScores().get(1)).toBe(0);
    });
  });

  describe("seedRandom", () => {
    it("leaves cells owned by an earlier player untouched", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [
          { id: 1, name: "Player 1", rules: [] },
          { id: 2, name: "Player 2", rules: [] },
        ]),
      );

      simulation.setCell(0, 0, 1);
      simulation.seedRandom(1, 2);

      const grid = simulation.getGrid();

      expect(grid[0][0]).toBe(1);
      expect(grid[0][1]).toBe(2);
    });

    it("rejects a density outside the range [0, 1]", () => {
      const simulation = Simulation.create(SimulationOptions.create(3, 3));

      expect(() => { simulation.seedRandom(1.5, 1); }).toThrow(RangeError);
    });
  });

  describe("recordHiScore", () => {
    it("records the current generation as the score", () => {
      const hiScore = HiScore.create();
      const simulation = Simulation.create(SimulationOptions.create(3, 3, [], hiScore));

      simulation.run();
      simulation.run();
      simulation.recordHiScore("Player 1");

      expect(hiScore.getEntries()[0]?.score).toBe(2);
    });

    it("records the given player name", () => {
      const hiScore = HiScore.create();
      const simulation = Simulation.create(SimulationOptions.create(3, 3, [], hiScore));

      simulation.recordHiScore("Player 1");

      expect(hiScore.getEntries()[0]?.name).toBe("Player 1");
    });

    it("records into the shared list when no hi-score list is supplied", () => {
      HiScore.resetShared();
      const simulation = Simulation.create(SimulationOptions.create(3, 3));

      simulation.run();
      simulation.recordHiScore("Player 1");

      expect(HiScore.shared().getEntries()).toEqual([{ name: "Player 1", score: 1 }]);
    });
  });

  describe("getHiScores", () => {
    it("returns the entries of the supplied hi-score list", () => {
      const hiScore = HiScore.create();
      const simulation = Simulation.create(SimulationOptions.create(3, 3, [], hiScore));

      hiScore.addEntry({ name: "Alice", score: 42 });

      expect(simulation.getHiScores()).toEqual([{ name: "Alice", score: 42 }]);
    });

    it("returns an empty list before any game has been recorded", () => {
      const simulation = Simulation.create(
        SimulationOptions.create(3, 3, [], HiScore.create()),
      );

      expect(simulation.getHiScores()).toHaveLength(0);
    });
  });
});
