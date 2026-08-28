import type { Cell } from "../../../../src/simulation/Cell";
import type { CellClaimResolutionStrategy } from "../../../../src/simulation/claim/resolution/CellClaimResolutionStrategy";
import type { ClaimCandidate } from "../../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../../src/simulation/claim/ClaimContext";
import { FirstMatchClaimStrategy } from "../../../../src/simulation/claim/resolution/FirstMatchClaimStrategy";
import { NeighbourMajorityClaimStrategy } from "../../../../src/simulation/claim/resolution/NeighbourMajorityClaimStrategy";
import type { Grid } from "../../../../src/simulation/Grid";

/** A fallback that records the candidates it was offered. */
interface RecordingFallback extends CellClaimResolutionStrategy {
  calls: ReadonlyArray<ClaimCandidate>[];
}

/** Builds a fallback returning a fixed winner and recording every call. */
function createRecordingFallback(winner: Cell): RecordingFallback {
  const calls: ReadonlyArray<ClaimCandidate>[] = [];

  return {
    calls,
    needsAllCandidates: true,
    selectWinner(candidates: ReadonlyArray<ClaimCandidate>): number | null {
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

/** Builds a claimed-and-alive cell for `owner`. */
function alive(owner: number): Cell {
  return { ownerId: owner, value: owner };
}

/** Builds an unclaimed cell. */
const EMPTY_CELL: Cell = { ownerId: null, value: null };

/** Builds a 3x3 grid of claimed-and-alive cells with the given owners. */
function createGrid(owners: ReadonlyArray<number>): Grid {
  return owners.map((row) => row.map((owner) => alive(owner)));
}

/** Builds a context resolving the cell at (x, y) of the given grid. */
function createContext(grid: Grid, x: number, y: number): ClaimContext {
  return { grid, x, y, owner: grid[y]?.[x]?.ownerId ?? null, generation: 0, playerCount: 4 };
}

describe("NeighbourMajorityClaimStrategy", () => {
  describe("create", () => {
    it("throws TypeError when no fallback is supplied", () => {
      expect(() =>
        NeighbourMajorityClaimStrategy.create(null as unknown as CellClaimResolutionStrategy),
      ).toThrow(TypeError);
    });
  });

  describe("selectWinner", () => {
    it("awards the cell to the candidate owning more of its neighbours", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid = createGrid([
        [1, 1, 0],
        [0, 0, 0],
        [0, 0, 2],
      ]);

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(winner).toBe(1);
    });

    it("beats roster order, so a later player can take the cell", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid = createGrid([
        [2, 2, 2],
        [0, 0, 1],
        [0, 0, 0],
      ]);

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
      const grid = createGrid([
        [0, 1, 0],
        [0, 0, 0],
        [2, 0, 2],
      ]);

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 0, 0),
      );

      expect(winner).toBe(2);
    });

    it("ignores cells owned by players that are not candidates", () => {
      const fallback = createRecordingFallback(1);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid = createGrid([
        [3, 3, 3],
        [3, 0, 3],
        [3, 3, 3],
      ]);

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls[0].map((candidate) => candidate.player.id)).toEqual([1, 2]);
    });

    it("does not consult the fallback when one candidate leads outright", () => {
      const fallback = createRecordingFallback(2);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid = createGrid([
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls).toHaveLength(0);
    });

    it("offers the fallback only the candidates tied on the lead", () => {
      const fallback = createRecordingFallback(2);
      const strategy = NeighbourMajorityClaimStrategy.create(fallback);
      const grid = createGrid([
        [1, 2, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);

      strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1), createCandidate(3, 2)],
        createContext(grid, 1, 1),
      );

      expect(fallback.calls[0].map((candidate) => candidate.player.id)).toEqual([1, 2]);
    });

    it("counts a dormant claimed neighbour as owned territory", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      // Player 1's only neighbour is claimed but dormant (value null); player
      // 2's single neighbour is alive. Ownership, not liveness, is counted.
      const grid: Grid = [
        [{ ownerId: 1, value: null }, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, alive(2), EMPTY_CELL],
      ];

      const winner = strategy.selectWinner(
        [createCandidate(1, 0), createCandidate(2, 1)],
        createContext(grid, 1, 1),
      );

      expect(winner).toBe(1);
    });

    it("delegates when no candidate owns a neighbouring cell", () => {
      const strategy = NeighbourMajorityClaimStrategy.create(FirstMatchClaimStrategy.create());
      const grid = createGrid([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);

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
