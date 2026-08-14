import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * Awards a contested cell to the candidate whose rules matched most often.
 *
 * Ownership follows how well a rule set fits the local neighbourhood rather
 * than where the player sits in the roster: a player with one narrowly
 * matching rule loses to a player whose three rules all fire on the cell.
 * Candidates tied on the maximum are passed to the fallback.
 */
export class StrongestMatchClaimStrategy implements ClaimStrategy {
  /** Match strength is comparative, so every match is needed. */
  public readonly needsAllCandidates = true;

  /** Decides cells whose strongest candidates are tied. */
  private readonly fallback: ClaimStrategy;

  private constructor(fallback: ClaimStrategy) {
    this.fallback = fallback;
  }

  /**
   * Creates a {@link StrongestMatchClaimStrategy} instance.
   *
   * @param fallback - Breaks ties between equally strong candidates.
   * @returns A strategy that favours the strongest match.
   * @throws {TypeError} If no fallback is supplied.
   */
  public static create(fallback: ClaimStrategy): StrongestMatchClaimStrategy {
    if (fallback === null || fallback === undefined) {
      throw new TypeError("fallback must be provided");
    }

    return new StrongestMatchClaimStrategy(fallback);
  }

  /**
   * Returns the id of the candidate with the highest matched rule count.
   *
   * Only the tied candidates are handed to the fallback, so it cannot pick a
   * candidate this strategy has already eliminated.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns The strongest candidate's id, or the fallback's choice among ties.
   */
  public selectWinner(
    candidates: ReadonlyArray<ClaimCandidate>,
    context: ClaimContext,
  ): Cell {
    const strongest = candidates.reduce(
      (best, candidate) => Math.max(best, candidate.matchedRuleCount),
      0,
    );
    const tied = candidates.filter(
      (candidate) => candidate.matchedRuleCount === strongest,
    );

    if (tied.length === 1) {
      return tied[0].player.id;
    }

    return this.fallback.selectWinner(tied, context);
  }
}
