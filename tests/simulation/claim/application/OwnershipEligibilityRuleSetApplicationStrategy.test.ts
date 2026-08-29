import { OwnershipEligibilityRuleSetApplicationStrategy } from "../../../../src/simulation/claim/application/OwnershipEligibilityRuleSetApplicationStrategy";
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

/** Builds a single-cell grid owned by `owner`, or unclaimed when null. */
function createGrid(owner: number | null): Grid {
  return [[{ ownerId: owner, value: owner }]];
}

describe("OwnershipEligibilityRuleSetApplicationStrategy", () => {
  describe("buildCandidates", () => {
    it("offers only the owning player as a candidate for an owned cell", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];

      const candidates = strategy.buildCandidates(createGrid(1), 0, 0, players, new Map(), 0, true);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([1]);
    });

    it("offers only the occupying player as a candidate for an unowned-but-occupied cell", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];
      const positions = new Map<number, GridPosition>([[2, { x: 0, y: 0 }]]);

      const candidates = strategy.buildCandidates(createGrid(null), 0, 0, players, positions, 0, true);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([2]);
    });

    it("offers no candidates for a cell neither owned nor occupied", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true])];

      const candidates = strategy.buildCandidates(createGrid(null), 0, 0, players, new Map(), 0, true);

      expect(candidates).toHaveLength(0);
    });

    it("offers every player positioned on the same unowned cell, in roster order", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];
      const positions = new Map<number, GridPosition>([
        [1, { x: 0, y: 0 }],
        [2, { x: 0, y: 0 }],
      ]);

      const candidates = strategy.buildCandidates(createGrid(null), 0, 0, players, positions, 0, true);

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([1, 2]);
    });

    it("omits an eligible player whose rules do not match", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false])];

      const candidates = strategy.buildCandidates(createGrid(1), 0, 0, players, new Map(), 0, true);

      expect(candidates).toHaveLength(0);
    });

    it("counts every matching rule for the eligible player", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true, true, false])];

      const candidates = strategy.buildCandidates(createGrid(1), 0, 0, players, new Map(), 0, true);

      expect(candidates[0].matchedRuleCount).toBe(2);
    });

    it("records the roster index of the eligible candidate within the full roster", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];

      const candidates = strategy.buildCandidates(createGrid(2), 0, 0, players, new Map(), 0, true);

      expect(candidates[0].rosterIndex).toBe(1);
    });

    it("stops at the first eligible match when needsAllCandidates is false", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];
      const positions = new Map<number, GridPosition>([
        [1, { x: 0, y: 0 }],
        [2, { x: 0, y: 0 }],
      ]);

      const candidates = strategy.buildCandidates(
        createGrid(null),
        0,
        0,
        players,
        positions,
        0,
        false,
      );

      expect(candidates.map((candidate) => candidate.player.id)).toEqual([1]);
    });
  });

  describe("resolveOwner", () => {
    it("reports the owning player as owner even when no rule matches", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false])];

      const owner = strategy.resolveOwner(createGrid(1), 0, 0, players, new Map());

      expect(owner).toBe(1);
    });

    it("reports the occupying player as owner for an unowned-but-occupied cell", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false])];
      const positions = new Map<number, GridPosition>([[1, { x: 0, y: 0 }]]);

      const owner = strategy.resolveOwner(createGrid(null), 0, 0, players, positions);

      expect(owner).toBe(1);
    });

    it("returns null for a cell neither owned nor occupied", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false])];

      const owner = strategy.resolveOwner(createGrid(null), 0, 0, players, new Map());

      expect(owner).toBeNull();
    });

    it("breaks a tie between two players positioned on the same unowned cell by roster order", () => {
      const strategy = OwnershipEligibilityRuleSetApplicationStrategy.create();
      const players = [createPlayer(1, [false]), createPlayer(2, [false])];
      const positions = new Map<number, GridPosition>([
        [1, { x: 0, y: 0 }],
        [2, { x: 0, y: 0 }],
      ]);

      const owner = strategy.resolveOwner(createGrid(null), 0, 0, players, positions);

      expect(owner).toBe(1);
    });
  });
});
