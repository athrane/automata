import type { ClaimCandidate } from "../../../src/simulation/claim/ClaimCandidate";
import type { ClaimContext } from "../../../src/simulation/claim/ClaimContext";
import { FirstMatchClaimStrategy } from "../../../src/simulation/claim/FirstMatchClaimStrategy";

/** Builds a candidate with the given roster position and match strength. */
function createCandidate(
  id: number,
  rosterIndex: number,
  matchedRuleCount = 1,
): ClaimCandidate {
  return {
    player: { id, name: `Player ${String(id)}`, rules: [] },
    rosterIndex,
    matchedRuleCount,
  };
}

/** Builds a context for a cell nothing in these tests reads beyond the owner. */
function createContext(owner: number | null = null): ClaimContext {
  return { grid: [[owner]], x: 0, y: 0, owner, generation: 0, playerCount: 4 };
}

describe("FirstMatchClaimStrategy", () => {
  it("declares that it does not need the candidates after the first", () => {
    expect(FirstMatchClaimStrategy.create().needsAllCandidates).toBe(false);
  });

  it("returns the only candidate when just one player matched", () => {
    const strategy = FirstMatchClaimStrategy.create();

    const winner = strategy.selectWinner([createCandidate(3, 2)], createContext());

    expect(winner).toBe(3);
  });

  it("returns the candidate earliest in the roster", () => {
    const strategy = FirstMatchClaimStrategy.create();
    const candidates = [createCandidate(2, 1), createCandidate(3, 2), createCandidate(4, 3)];

    const winner = strategy.selectWinner(candidates, createContext());

    expect(winner).toBe(2);
  });

  it("ignores how strongly the later candidates matched", () => {
    const strategy = FirstMatchClaimStrategy.create();
    const candidates = [createCandidate(1, 0, 1), createCandidate(2, 1, 8)];

    const winner = strategy.selectWinner(candidates, createContext());

    expect(winner).toBe(1);
  });

  it("ignores the current owner of the cell", () => {
    const strategy = FirstMatchClaimStrategy.create();
    const candidates = [createCandidate(1, 0), createCandidate(2, 1)];

    const winner = strategy.selectWinner(candidates, createContext(2));

    expect(winner).toBe(1);
  });
});
