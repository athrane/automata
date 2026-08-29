import { UnrestrictedRuleSetApplicationStrategy } from "../../../../src/simulation/claim/application/UnrestrictedRuleSetApplicationStrategy";
import type { Grid } from "../../../../src/simulation/Grid";
import type { GridPosition } from "../../../../src/simulation/player/GridPosition";
import type { Player } from "../../../../src/simulation/player/Player";
import type { Rule } from "../../../../src/simulation/rule/Rule";

/** Builds a rule whose match result is fixed, independent of the grid. */
function createStubRule(result: boolean): Rule {
  return { matches: () => result };
}

/** Builds a player whose rules match according to the given results. */
function createPlayer(id: number, ruleResults: boolean[]): Player {
  return { id, name: `Player ${String(id)}`, rules: ruleResults.map(createStubRule) };
}

/** An empty grid; every rule stub in these tests ignores its contents. */
const GRID: Grid = [[{ ownerId: null, value: null }]];

/** No player occupies any cell in these tests. */
const NO_POSITIONS: ReadonlyMap<number, GridPosition> = new Map();

describe("UnrestrictedRuleSetApplicationStrategy", () => {
  describe("buildCandidates", () => {
    it("offers every matching player as a candidate, in roster order", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true]), createPlayer(3, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([1, 2, 3]);
    });

    it("records the roster position of each candidate", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false]), createPlayer(2, [true]), createPlayer(3, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates.map((candidate) => candidate.rosterIndex)).toEqual([1, 2]);
    });

    it("counts every matching rule rather than stopping at the first", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true, false, true, true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates[0].matchedRuleCount).toBe(3);
    });

    it("omits a player whose rules all fail to match", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false, false]), createPlayer(2, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].player.id).toBe(2);
    });

    it("omits a player that has no rules at all", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, []), createPlayer(2, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([2]);
    });

    it("returns no candidates when no player matches", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false]), createPlayer(2, [false])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, true);

      expect(candidates).toHaveLength(0);
    });

    it("returns no candidates when there are no players", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();

      const candidates = strategy.buildCandidates(GRID, 0, 0, [], NO_POSITIONS, 0, true);

      expect(candidates).toHaveLength(0);
    });

    it("stops at the first match when needsAllCandidates is false", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, false);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([1]);
    });

    it("skips players ahead of the first match only, not the ones before it", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false]), createPlayer(2, [true]), createPlayer(3, [true])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, false);

      expect(candidates.map((candidate) => candidate.rosterIndex)).toEqual([1]);
    });

    it("still counts every rule of the player it stops at", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true, true, false])];

      const candidates = strategy.buildCandidates(GRID, 0, 0, players, NO_POSITIONS, 0, false);

      expect(candidates[0].matchedRuleCount).toBe(2);
    });
  });

  describe("resolveOwner", () => {
    it("returns null, leaving a cell no candidate wins fully unowned", () => {
      const strategy = UnrestrictedRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false])];

      const owner = strategy.resolveOwner(GRID, 0, 0, players, NO_POSITIONS);

      expect(owner).toBeNull();
    });
  });
});
