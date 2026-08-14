import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * Awards a contested cell to the candidate earliest in the roster.
 *
 * Roster position is therefore a fixed priority: the player at index 0 wins
 * every cell it is a candidate for. This is the simulation's default, and
 * the terminal fallback of every composing strategy, because it is total —
 * it always names a winner and never delegates.
 */
export class FirstMatchClaimStrategy implements ClaimStrategy {
  /** The first match settles the cell, so the later players need not be evaluated. */
  public readonly needsAllCandidates = false;

  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link FirstMatchClaimStrategy} instance.
   *
   * @returns A strategy that awards the cell to the first candidate.
   */
  public static create(): FirstMatchClaimStrategy {
    return new FirstMatchClaimStrategy();
  }

  /**
   * Returns the id of the candidate with the lowest roster index.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @returns The first candidate's player id.
   */
  public selectWinner(candidates: ReadonlyArray<ClaimCandidate>): Cell {
    return candidates[0].player.id;
  }
}
