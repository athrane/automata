import type { Cell } from "../../../src/simulation/Cell";
import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import type { ClaimStrategy } from "../../../src/simulation/claim/ClaimStrategy";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";
import { NeighbourMajorityClaimStrategy } from "../../../src/simulation/claim/NeighbourMajorityClaimStrategy";
import type { Grid } from "../../../src/simulation/Grid";

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

/** Builds a context resolving the cell at (x, y) of the given grid. */
function createContext(grid: Grid, x: number, y: number): ClaimContext {
  return { grid, x, y, owner: grid[y]?.[x] ?? null, generation: 0, playerCount: 4 };
}

describe("NeighbourMajorityClaimStrategy", () => {
  describe("create", () => {
    it("throws TypeError when no fallback is supplied", () => {
      expect(() =>
        NeighbourMajorityClaimStrategy.create(null as unknown as ClaimStrategy),
      ).toThrow(TypeError);
    });
  });

  describe("selectWinner", () => {
    it("awards the cell to the candidate owning more of its neighbours", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid: Grid = [
        [1, 1, null],
        [null, null, null],
        [null, null, 2],
      ];

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(winner).toBe(1);
    });

    it("beats roster order, so a later player can take the cell", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid: Grid = [
        [2, 2, 2],
        [null, null, 1],
        [null, null, null],
      ];

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(winner).toBe(2);
    });

    it("counts neighbours across the grid edges", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      // Resolving (0, 0): row 2 is its wrapped top row, so both of player 2's
      // cells are neighbours, against a single non-wrapped cell for player 1.
      const grid: Grid = [
        [null, 1, null],
        [null, null, null],
        [2, null, 2],
      ];

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 0, 0),
      );

      expect(winner).toBe(2);
    });

    it("ignores cells owned by players that are not candidates", () => {
      const fallback = createRecordingFallback(1);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid: Grid = [
        [3, 3, 3],
        [3, null, 3],
        [3, 3, 3],
      ];

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls[0].map((candidate) => candidate.player.id)).toEqual([1, 2]);
    });

    it("does not consult the fallback when one candidate leads outright", () => {
      const fallback = createRecordingFallback(2);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid: Grid = [
        [1, null, null],
        [null, null, null],
        [null, null, null],
      ];

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls).toHaveLength(0);
    });

    it("offers the fallback only the candidates tied on the lead", () => {
      const fallback = createRecordingFallback(2);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid: Grid = [
        [1, 2, null],
        [null, null, null],
        [null, null, null],
      ];

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1), createCandidate(3, 2)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls[0].map((candidate) => candidate.player.id)).toEqual([1, 2]);
    });

    it("delegates when no candidate owns a neighbouring cell", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid: Grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(winner).toBe(1);
    });

    it("delegates on an empty grid rather than reading past its bounds", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext([], 0, 0),
      );

      expect(winner).toBe(1);
    });
  });
});
