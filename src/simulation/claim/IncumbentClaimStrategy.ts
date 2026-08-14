import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * Lets the current occupant keep a cell it still matches.
 *
 * Territory becomes defensible: a player loses a cell only when its own
 * rules stop matching, rather than to a higher-priority player that merely
 * also qualifies. Cells the occupant can no longer hold, and empty cells,
 * are decided by the fallback.
 */
export class IncumbentClaimStrategy implements ClaimStrategy {
  /** The occupant may sit anywhere in the roster, so every match is needed. */
  public readonly needsAllCandidates = true;

  /** Decides cells the current occupant cannot hold. */
  private readonly fallback: ClaimStrategy;

  private constructor(fallback: ClaimStrategy) {
    this.fallback = fallback;
  }

  /**
   * Creates an {@link IncumbentClaimStrategy} instance.
   *
   * @param fallback - Decides cells with no defending occupant.
   * @returns A strategy that favours the current occupant.
   * @throws {TypeError} If no fallback is supplied.
   */
  public static create(fallback: ClaimStrategy): IncumbentClaimStrategy {
    if (fallback === null || fallback === undefined) {
      throw new TypeError("fallback must be provided");
    }

    return new IncumbentClaimStrategy(fallback);
  }

  /**
   * Returns the current owner when it is among the candidates, otherwise
   * the fallback's choice.
   *
   * The owner is checked against the candidate list rather than trusted,
   * because an occupant whose rules no longer match has to lose the cell.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns The defending owner's id, or the fallback's choice.
   */
  public selectWinner(
    candidates: ReadonlyArray<ClaimCandidate>,
    context: ClaimContext,
  ): Cell {
    const isDefending = candidates.some(
      (candidate) => candidate.player.id === context.owner,
    );

    if (isDefending) {
      return context.owner;
    }

    return this.fallback.selectWinner(candidates, context);
  }
}
