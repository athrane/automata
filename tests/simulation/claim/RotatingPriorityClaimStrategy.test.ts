import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import { RotatingPriorityClaimStrategy } from "../../../src/simulation/claim/RotatingPriorityClaimStrategy";

/** Roster size shared by these tests. */
const PLAYER_COUNT = 4;

/** Builds a candidate whose id matches its roster position, one-based. */
function createCandidate(rosterIndex: number): ClaimCandidate {
  const id = rosterIndex + 1;

  return {
    player: { id, name: `Player ${String(id)}`, rules: [] },
    rosterIndex,
    matchedRuleCount: 1,
  };
}

/** Builds a context for the given generation. */
function createContext(generation: number): ClaimContext {
  return { grid: [[null]], x: 0, y: 0, owner: null, generation, playerCount: PLAYER_COUNT };
}

/** Every player of the roster, as candidates in roster order. */
function createFullRoster(): ClaimCandidate[] {
  return [createCandidate(0), createCandidate(1), createCandidate(2), createCandidate(3)];
}

describe("RotatingPriorityClaimStrategy", () => {
  it("gives the first roster position priority in generation 0", () => {
    const strategy = RotatingPriorityClaimStrategy.create();

    const winner = strategy.selectWinner(createFullRoster(), createContext(0));

    expect(winner).toBe(1);
  });

  it("advances priority by one roster position each generation", () => {
    const strategy = RotatingPriorityClaimStrategy.create();

    const winners = [0, 1, 2, 3].map((generation) =>
      strategy.selectWinner(createFullRoster(), createContext(generation)),
    );

    expect(winners).toEqual([1, 2, 3, 4]);
  });

  it("wraps the rotation back to the first player after a full cycle", () => {
    const strategy = RotatingPriorityClaimStrategy.create();

    const winner = strategy.selectWinner(createFullRoster(), createContext(PLAYER_COUNT));

    expect(winner).toBe(1);
  });

  it("passes priority to the next candidate in rotation order", () => {
    const strategy = RotatingPriorityClaimStrategy.create();
    // Generation 1 gives priority to roster index 1, which did not match here,
    // so the cell falls to index 2 rather than back to index 0.
    const candidates = [createCandidate(0), createCandidate(2)];

    const winner = strategy.selectWinner(candidates, createContext(1));

    expect(winner).toBe(3);
  });

  it("wraps past the end of the roster when looking for the next candidate", () => {
    const strategy = RotatingPriorityClaimStrategy.create();
    const candidates = [createCandidate(0), createCandidate(1)];

    const winner = strategy.selectWinner(candidates, createContext(2));

    expect(winner).toBe(1);
  });

  it("returns the only candidate whatever the generation", () => {
    const strategy = RotatingPriorityClaimStrategy.create();

    const winner = strategy.selectWinner([createCandidate(2)], createContext(7));

    expect(winner).toBe(3);
  });

  it("returns the same winner for a fixed generation", () => {
    const strategy = RotatingPriorityClaimStrategy.create();

    const first = strategy.selectWinner(createFullRoster(), createContext(5));
    const second = strategy.selectWinner(createFullRoster(), createContext(5));

    expect(first).toBe(second);
  });
});
