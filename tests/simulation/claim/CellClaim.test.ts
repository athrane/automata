import type { Cell } from "../../../src/simulation/Cell";
import { CellClaim } from "../../../src/simulation/claim/CellClaim";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../../src/simulation/claim/ClaimStrategy";
import type { Grid } from "../../../src/simulation/Grid";
import type { Player } from "../../../src/simulation/player/Player";
import type { Rule } from "../../../src/simulation/rule/Rule";

/** One call made to the recording strategy. */
interface RecordedCall {
  candidates: ReadonlyArray<ClaimCandidate>;
  context: ClaimContext;
}

/** A strategy that records its arguments and returns a fixed winner. */
interface RecordingStrategy extends ClaimStrategy {
  calls: RecordedCall[];
}

/** Builds a strategy that always returns the given winner and records every call. */
function createRecordingStrategy(winner: Cell, needsAllCandidates = true): RecordingStrategy {
  const calls: RecordedCall[] = [];

  return {
    calls,
    needsAllCandidates,
    selectWinner(candidates: ReadonlyArray<ClaimCandidate>, context: ClaimContext): Cell {
      calls.push({ candidates, context });
      return winner;
    },
  };
}

/** Builds a rule whose match result is fixed, independent of the grid. */
function createStubRule(result: boolean): Rule {
  return { matches: () => result };
}

/** Builds a player whose rules match according to the given results. */
function createPlayer(id: number, ruleResults: boolean[]): Player {
  return { id, name: `Player ${String(id)}`, rules: ruleResults.map(createStubRule) };
}

/** Builds a 2x2 grid with the given owners, row-major. */
function createGrid(owners: Cell[]): Grid {
  return [
    [owners[0], owners[1]],
    [owners[2], owners[3]],
  ];
}

describe("CellClaim", () => {
  describe("create", () => {
    it("throws TypeError when no strategy is supplied", () => {
      expect(() => CellClaim.create(null as unknown as ClaimStrategy)).toThrow(TypeError);
    });

    it("throws TypeError when the strategy is undefined", () => {
      expect(() => CellClaim.create(undefined as unknown as ClaimStrategy)).toThrow(
        "strategy must be provided",
      );
    });
  });

  describe("resolve", () => {
    it("returns the winner chosen by the strategy", () => {
      const claim = CellClaim.create(createRecordingStrategy(2));
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(winner).toBe(2);
    });

    it("offers every matching player as a candidate, in roster order", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [true]), createPlayer(2, [true]), createPlayer(3, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates.map((candidate) => candidate.player.id)).toEqual([
        1, 2, 3,
      ]);
    });

    it("records the roster position of each candidate", () => {
      const strategy = createRecordingStrategy(3);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [false]), createPlayer(2, [true]), createPlayer(3, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates.map((candidate) => candidate.rosterIndex)).toEqual([
        1, 2,
      ]);
    });

    it("counts every matching rule rather than stopping at the first", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [true, false, true, true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates[0].matchedRuleCount).toBe(3);
    });

    it("omits a player whose rules all fail to match", () => {
      const strategy = createRecordingStrategy(2);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [false, false]), createPlayer(2, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates).toHaveLength(1);
      expect(strategy.calls[0].candidates[0].player.id).toBe(2);
    });

    it("omits a player that has no rules at all", () => {
      const strategy = createRecordingStrategy(2);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, []), createPlayer(2, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates.map((candidate) => candidate.player.id)).toEqual([2]);
    });

    it("returns null without consulting the strategy when no player matches", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [false]), createPlayer(2, [false])];

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(winner).toBeNull();
      expect(strategy.calls).toHaveLength(0);
    });

    it("returns null without consulting the strategy when there are no players", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);

      const winner = claim.resolve(createGrid([null, null, null, null]), 0, 0, [], 0);

      expect(winner).toBeNull();
      expect(strategy.calls).toHaveLength(0);
    });

    it("passes the cell coordinates and the grid being read to the strategy", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);
      const grid = createGrid([null, null, null, null]);

      claim.resolve(grid, 1, 0, [createPlayer(1, [true])], 0);

      expect(strategy.calls[0].context.grid).toBe(grid);
      expect(strategy.calls[0].context.x).toBe(1);
      expect(strategy.calls[0].context.y).toBe(0);
    });

    it("passes the current owner of the cell to the strategy", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);

      claim.resolve(createGrid([null, null, 7, null]), 0, 1, [createPlayer(1, [true])], 0);

      expect(strategy.calls[0].context.owner).toBe(7);
    });

    it("passes the supplied generation and the roster size to the strategy", () => {
      const strategy = createRecordingStrategy(1);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [true]), createPlayer(2, [false]), createPlayer(3, [false])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 12);

      expect(strategy.calls[0].context.generation).toBe(12);
      expect(strategy.calls[0].context.playerCount).toBe(3);
    });

    it("stops at the first match for a strategy that needs no more", () => {
      const strategy = createRecordingStrategy(1, false);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [true]), createPlayer(2, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates.map((candidate) => candidate.player.id)).toEqual([1]);
    });

    it("skips players ahead of the first match only, not the ones before it", () => {
      const strategy = createRecordingStrategy(2, false);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [false]), createPlayer(2, [true]), createPlayer(3, [true])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates.map((candidate) => candidate.rosterIndex)).toEqual([1]);
    });

    it("still counts every rule of the player it stops at", () => {
      const strategy = createRecordingStrategy(1, false);
      const claim = CellClaim.create(strategy);
      const players = [createPlayer(1, [true, true, false])];

      claim.resolve(createGrid([null, null, null, null]), 0, 0, players, 0);

      expect(strategy.calls[0].candidates[0].matchedRuleCount).toBe(2);
    });

    it("returns null when the strategy declines to award the cell", () => {
      const claim = CellClaim.create(createRecordingStrategy(null));

      const winner = claim.resolve(
        createGrid([null, null, null, null]),
        0,
        0,
        [createPlayer(1, [true])],
        0,
      );

      expect(winner).toBeNull();
    });
  });
});
