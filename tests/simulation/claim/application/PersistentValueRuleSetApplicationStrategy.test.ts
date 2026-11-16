import { PersistentValueRuleSetApplicationStrategy } from "../../../../src/simulation/claim/application/PersistentValueRuleSetApplicationStrategy";
import type { RuleSetApplicationStrategy } from "../../../../src/simulation/claim/application/RuleSetApplicationStrategy";
import { UnrestrictedRuleSetApplicationStrategy } from "../../../../src/simulation/claim/application/UnrestrictedRuleSetApplicationStrategy";
import type { ClaimCandidate } from "../../../../src/simulation/claim/ClaimCandidate";
import type { Grid } from "../../../../src/simulation/Grid";
import type { Player } from "../../../../src/simulation/player/Player";
import { SumRule } from "../../../../src/simulation/rule/SumRule";

/** Two players whose rules never match: no cell has nine neighbours. */
function createUnmatchedPlayers(): Player[] {
  return [
    { id: 1, name: "Player 1", rules: [new SumRule([9])] },
    { id: 2, name: "Player 2", rules: [new SumRule([9])] },
  ];
}

/** Builds a 3x3 grid whose centre holds `centre` and every other cell is empty. */
function createGrid(centre: number | null): Grid {
  const grid: Grid = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => ({ ownerId: null, value: null })),
  );
  grid[1][1] = { ownerId: centre, value: centre };

  return grid;
}

/** Builds candidates for the centre cell through `strategy`. */
function buildCentreCandidates(
  strategy: RuleSetApplicationStrategy,
  grid: Grid,
  players: Player[],
): ClaimCandidate[] {
  return strategy.buildCandidates(grid, 1, 1, players, new Map(), 0, true);
}

describe("PersistentValueRuleSetApplicationStrategy", () => {
  describe("buildCandidates", () => {
    it("passes the inner strategy's candidates through unchanged", () => {
      // Arrange — player 2 matches every cell, so the inner strategy offers it.
      const players: Player[] = [
        { id: 1, name: "Player 1", rules: [new SumRule([9])] },
        { id: 2, name: "Player 2", rules: [new SumRule([0])] },
      ];
      const strategy = PersistentValueRuleSetApplicationStrategy.create(
        UnrestrictedRuleSetApplicationStrategy.create(),
      );

      // Act
      const candidates = buildCentreCandidates(strategy, createGrid(1), players);

      // Assert
      expect(candidates).toEqual([{ player: players[1], rosterIndex: 1, matchedRuleCount: 1 }]);
    });

    it("offers the incumbent with a match count of 0 when nothing matched", () => {
      // Arrange
      const players = createUnmatchedPlayers();
      const strategy = PersistentValueRuleSetApplicationStrategy.create(
        UnrestrictedRuleSetApplicationStrategy.create(),
      );

      // Act
      const candidates = buildCentreCandidates(strategy, createGrid(2), players);

      // Assert
      expect(candidates).toEqual([{ player: players[1], rosterIndex: 1, matchedRuleCount: 0 }]);
    });

    it("offers no candidate for an unmatched empty cell", () => {
      // Arrange
      const strategy = PersistentValueRuleSetApplicationStrategy.create(
        UnrestrictedRuleSetApplicationStrategy.create(),
      );

      // Act
      const candidates = buildCentreCandidates(strategy, createGrid(null), createUnmatchedPlayers());

      // Assert
      expect(candidates).toEqual([]);
    });

    it("offers no candidate when the cell's value is not in the roster", () => {
      // Arrange
      const strategy = PersistentValueRuleSetApplicationStrategy.create(
        UnrestrictedRuleSetApplicationStrategy.create(),
      );

      // Act
      const candidates = buildCentreCandidates(strategy, createGrid(7), createUnmatchedPlayers());

      // Assert
      expect(candidates).toEqual([]);
    });
  });

  describe("resolveOwner", () => {
    it("delegates to the inner strategy", () => {
      // Arrange
      const inner: RuleSetApplicationStrategy = {
        buildCandidates: () => [],
        resolveOwner: () => 42,
      };
      const strategy = PersistentValueRuleSetApplicationStrategy.create(inner);

      // Act
      const owner = strategy.resolveOwner(createGrid(null), 1, 1, createUnmatchedPlayers(), new Map());

      // Assert
      expect(owner).toBe(42);
    });
  });

  describe("create", () => {
    it("throws TypeError when inner is missing", () => {
      expect(() =>
        PersistentValueRuleSetApplicationStrategy.create(
          undefined as unknown as RuleSetApplicationStrategy,
        ),
      ).toThrow(TypeError);
    });
  });
});
