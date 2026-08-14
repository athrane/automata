import { HiScore } from "../../../src/simulation/hiscore/HiScore";
import { CheckerStartingPattern } from "../../../src/simulation/level/CheckerStartingPattern";
import { Level } from "../../../src/simulation/level/Level";
import type { LevelRoster } from "../../../src/simulation/level/LevelRoster";
import { SumRule } from "../../../src/simulation/rule/SumRule";

/** Builds a two-player roster for tests that do not care about its contents. */
function createRoster(): LevelRoster {
  return {
    human: { id: 1, name: "Player 1" },
    computers: [{ id: 2, name: "Computer 1", rules: [new SumRule([3])] }],
  };
}

describe("Level", () => {
  it("exposes the values it was created with", () => {
    const roster = createRoster();
    const pattern = CheckerStartingPattern.create(2, [1, 2]);

    const level = Level.create(7, "Level 7", 4, 6, roster, pattern);

    expect(level.id).toBe(7);
    expect(level.name).toBe("Level 7");
    expect(level.width).toBe(4);
    expect(level.height).toBe(6);
    expect(level.roster).toBe(roster);
    expect(level.startingPattern).toBe(pattern);
  });

  describe("create", () => {
    it("throws RangeError when width is not positive", () => {
      expect(() =>
        Level.create(1, "Level 1", 0, 4, createRoster(), CheckerStartingPattern.create(2, [1])),
      ).toThrow(RangeError);
    });

    it("throws RangeError when height is not positive", () => {
      expect(() =>
        Level.create(1, "Level 1", 4, -1, createRoster(), CheckerStartingPattern.create(2, [1])),
      ).toThrow(RangeError);
    });

    it("throws RangeError when there are no computer players", () => {
      const roster: LevelRoster = { human: { id: 1, name: "Player 1" }, computers: [] };

      expect(() =>
        Level.create(1, "Level 1", 4, 4, roster, CheckerStartingPattern.create(2, [1])),
      ).toThrow(RangeError);
    });

    it("throws when a computer player reuses the human player's id", () => {
      const roster: LevelRoster = {
        human: { id: 1, name: "Player 1" },
        computers: [{ id: 1, name: "Computer 1", rules: [new SumRule([3])] }],
      };

      expect(() =>
        Level.create(1, "Level 1", 4, 4, roster, CheckerStartingPattern.create(2, [1])),
      ).toThrow("player ids must be unique");
    });

    it("throws when two computer players share an id", () => {
      const roster: LevelRoster = {
        human: { id: 1, name: "Player 1" },
        computers: [
          { id: 2, name: "Computer 1", rules: [new SumRule([3])] },
          { id: 2, name: "Computer 2", rules: [new SumRule([1])] },
        ],
      };

      expect(() =>
        Level.create(1, "Level 1", 4, 4, roster, CheckerStartingPattern.create(2, [1])),
      ).toThrow("player ids must be unique");
    });
  });

  describe("createPlayers", () => {
    it("places the human first, carrying the supplied rules", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );
      const humanRules = [new SumRule([2])];

      const players = level.createPlayers(humanRules);

      expect(players[0]).toEqual({ id: 1, name: "Player 1", rules: humanRules });
    });

    it("appends the computer players unchanged", () => {
      const roster = createRoster();
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        roster,
        CheckerStartingPattern.create(2, [1, 2]),
      );

      const players = level.createPlayers([new SumRule([2])]);

      expect(players).toHaveLength(2);
      expect(players[1]).toBe(roster.computers[0]);
    });

    it("throws RangeError when no human rules are supplied", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      expect(() => level.createPlayers([])).toThrow(RangeError);
    });
  });

  describe("createSimulation", () => {
    it("returns a simulation sized by the level", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        6,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      const simulation = level.createSimulation([new SumRule([2])], HiScore.create());

      expect(simulation.width).toBe(4);
      expect(simulation.height).toBe(6);
    });

    it("returns a simulation at generation 0 with the pattern applied", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      const simulation = level.createSimulation([new SumRule([2])], HiScore.create());
      const grid = simulation.getGrid();

      expect(simulation.generation).toBe(0);
      expect(grid[0][0]).toBe(1);
      expect(grid[0][2]).toBe(2);
      expect(grid[2][0]).toBe(2);
      expect(grid[2][2]).toBe(1);
    });

    it("registers the full roster with the simulation", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      const simulation = level.createSimulation([new SumRule([2])], HiScore.create());

      expect(simulation.getPlayers().map((player) => player.id)).toEqual([1, 2]);
    });

    it("records into the supplied hi-score list", () => {
      const hiScore = HiScore.create();
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      const simulation = level.createSimulation([new SumRule([2])], hiScore);
      simulation.recordHiScore("Player 1");

      expect(hiScore.getEntries()).toEqual([{ name: "Player 1", score: 0 }]);
    });

    it("throws RangeError when no human rules are supplied", () => {
      const level = Level.create(
        1,
        "Level 1",
        4,
        4,
        createRoster(),
        CheckerStartingPattern.create(2, [1, 2]),
      );

      expect(() => level.createSimulation([], HiScore.create())).toThrow(RangeError);
    });
  });
});
