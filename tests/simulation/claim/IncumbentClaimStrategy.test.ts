import type { Cell } from "../../../src/simulation/Cell";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../../src/simulation/claim/ClaimStrategy";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";
import { IncumbentClaimStrategy } from "../../../src/simulation/claim/IncumbentClaimStrategy";

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

/** Builds a candidate with the given roster position. */
function createCandidate(id: number, rosterIndex: number): ClaimCandidate {
  return {
    player: { id, name: `Player ${String(id)}`, rules: [] },
    rosterIndex,
    matchedRuleCount: 1,
  };
}

/** Builds a context whose cell is owned by the given player. */
function createContext(owner: Cell): ClaimContext {
  return { grid: [[owner]], x: 0, y: 0, owner, generation: 0, playerCount: 4 };
}

describe("IncumbentClaimStrategy", () => {
  describe("create", () => {
    it("throws TypeError when no fallback is supplied", () => {
      expect(() =>
        IncumbentClaimStrategy.create(null as unknown as ClaimStrategy),
      ).toThrow(TypeError);
    });
  });

  describe("selectWinner", () => {
    it("keeps the cell with its current owner when the owner still matches", () => {
      const strategy = IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(1, 0), createCandidate(3, 2)];

      const winner = strategy.selectWinner(candidates, createContext(3));

      expect(winner).toBe(3);
    });

    it("does not consult the fallback while the owner is defending", () => {
      const fallback = createRecordingFallback(1);
      const strategy = IncumbentClaimStrategy.create(fallback);

      strategy.selectWinner([createCandidate(1, 0), createCandidate(3, 2)], createContext(3));

      expect(fallback.calls).toHaveLength(0);
    });

    it("delegates when the owner's rules no longer match", () => {
      const strategy = IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(2, 1), createCandidate(3, 2)];

      const winner = strategy.selectWinner(candidates, createContext(4));

      expect(winner).toBe(2);
    });

    it("delegates when the cell is empty", () => {
      const strategy = IncumbentClaimStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(2, 1), createCandidate(3, 2)];

      const winner = strategy.selectWinner(candidates, createContext(null));

      expect(winner).toBe(2);
    });

    it("offers the fallback the full candidate list", () => {
      const fallback = createRecordingFallback(2);
      const strategy = IncumbentClaimStrategy.create(fallback);
      const candidates = [createCandidate(2, 1), createCandidate(3, 2)];

      strategy.selectWinner(candidates, createContext(null));

      expect(fallback.calls[0]).toBe(candidates);
    });

    it("returns the owner when it is the only candidate", () => {
      const fallback = createRecordingFallback(9);
      const strategy = IncumbentClaimStrategy.create(fallback);

      const winner = strategy.selectWinner([createCandidate(5, 0)], createContext(5));

      expect(winner).toBe(5);
      expect(fallback.calls).toHaveLength(0);
    });
  });
});
