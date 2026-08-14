import type { Cell } from "../../../src/simulation/Cell";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../../src/simulation/claim/ClaimStrategy";
import { ContestedCellVoidStrategy } from "../../../src/simulation/claim/ContestedCellVoidStrategy";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";

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

/** Builds a context these tests do not otherwise read. */
function createContext(): ClaimContext {
  return { grid: [[null]], x: 0, y: 0, owner: null, generation: 0, playerCount: 4 };
}

describe("ContestedCellVoidStrategy", () => {
  describe("create", () => {
    it("throws TypeError when no fallback is supplied", () => {
      expect(() =>
        ContestedCellVoidStrategy.create(null as unknown as ClaimStrategy),
      ).toThrow(TypeError);
    });
  });

  describe("selectWinner", () => {
    it("empties a cell two players matched", () => {
      const strategy = ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(1, 0), createCandidate(2, 1)];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBeNull();
    });

    it("empties a cell three players matched", () => {
      const strategy = ContestedCellVoidStrategy.create(FirstMatchClaimStrategy.create());
      const candidates = [createCandidate(1, 0), createCandidate(2, 1), createCandidate(3, 2)];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBeNull();
    });

    it("does not consult the fallback for a contested cell", () => {
      const fallback = createRecordingFallback(1);
      const strategy = ContestedCellVoidStrategy.create(fallback);

      strategy.selectWinner([createCandidate(1, 0), createCandidate(2, 1)], createContext());

      expect(fallback.calls).toHaveLength(0);
    });

    it("delegates an uncontested cell to the fallback", () => {
      const fallback = createRecordingFallback(7);
      const strategy = ContestedCellVoidStrategy.create(fallback);
      const candidates = [createCandidate(3, 2)];

      const winner = strategy.selectWinner(candidates, createContext());

      expect(winner).toBe(7);
      expect(fallback.calls[0]).toBe(candidates);
    });
  });
});
