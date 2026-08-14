import type { Cell } from "../../../src/simulation/Cell";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../../src/simulation/claim/ClaimStrategy";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";
import { StrongestMatchClaimStrategy } from "../../../src/simulation/claim/StrongestMatchClaimStrategy";

/** A fallback that records the candidates it was offered. */
interface RecordingFallback extends ClaimStrategy {
  calls: ReadonlyArray<ClaimCandidate>[];
}

/** Builds a fallback returning a fixed winner and recording every call. */
function createRecordingFallback(winner: Cell): RecordingFallback {
  const calls: ReadonlyArray<ClaimCandidate>[] = [];

  return {
    calls,
    needsAllCandidates: true,
    selectWinner(candidates: ReadonlyArray<ClaimCandidate>): Cell {
      calls.push(candidates);
      return winner;
    },
  };
}

/** Builds a candidate that matched the given number of rules. */
function createCandidate(
  id: number,
  rosterIndex: number,
  matchedRuleCount: number,
): ClaimCandidate {
  return {
    player: { id, name: `Player ${String(id)}`, rules: [] },
    rosterIndex,
    matchedRuleCount,
  };
}

/** Builds a context these tests do not otherwise read. */
function createContext(): ClaimContext {
  return { grid: [[null]], x: 0, y: 0, owner: null, generation: 0, playerCount: 4 };
}

describe("StrongestMatchClaimStrategy", () => {
  describe("create", () => {
    it("throws TypeError when no fallback is supplied", () => {
      expect(() =>
        StrongestMatchClaimStrategy.create(null as unknown as ClaimStrategy),
      ).toThrow(TypeError);
    });
  });

  describe("selectWinner", () => {
    it("awards the cell to the candidate matching the most rules", () => {
      const strategy = StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(1, 0, 1), createCandidate(2, 1, 3)];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBe(2);
    });

    it("beats roster order, so a later player can take the cell", () => {
      const strategy = StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [
        createCandidate(1, 0, 2),
        createCandidate(2, 1, 1),
        createCandidate(3, 2, 5),
      ];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBe(3);
    });

    it("does not consult the fallback when the strongest candidate is unique", () => {
      const fallback = createRecordingFallback(1);
      const strategy = StrongestMatchClaimStrategy.create(fallback);

      strategy.selectWinner(
        [createCandidate(1, 0, 1), createCandidate(2, 1, 3)],
        createContext(),
      );

      expect(fallback.calls).toHaveLength(0);
    });

    it("delegates a tie to the fallback", () => {
      const strategy = StrongestMatchClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(2, 1, 3), createCandidate(3, 2, 3)];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBe(2);
    });

    it("offers the fallback only the tied candidates", () => {
      const fallback = createRecordingFallback(3);
      const strategy = StrongestMatchClaimStrategy.create(fallback);
      const candidates = [
        createCandidate(1, 0, 1),
        createCandidate(2, 1, 4),
        createCandidate(3, 2, 4),
      ];

      strategy.selectWinner(candidates, createContext());

      expect(fallback.calls[0].map((candidate) => candidate.player.id)).toEqual([2, 3]);
    });

    it("returns the only candidate without consulting the fallback", () => {
      const fallback = createRecordingFallback(9);
      const strategy = StrongestMatchClaimStrategy.create(fallback);

      const winner = strategy.selectWinner([createCandidate(4, 3, 2)], createContext());

      expect(winner).toBe(4);
      expect(fallback.calls).toHaveLength(0);
    });
  });
});
