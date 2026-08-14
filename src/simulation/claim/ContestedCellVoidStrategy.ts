import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";
import type { ClaimStrategy } from "./ClaimStrategy";

/** Number of candidates above which a cell counts as contested. */
const UNCONTESTED_CANDIDATE_COUNT = 1;

/**
 * Destroys a contested cell instead of awarding it.
 *
 * Boundaries between players erode into empty front lines rather than one
 * player absorbing the other, since neither side can hold ground the other
 * also qualifies for. Uncontested cells are decided by the fallback.
 */
export class ContestedCellVoidStrategy implements ClaimStrategy {
  /** Whether a cell is contested cannot be known from the first match alone. */
  public readonly needsAllCandidates = true;

  /** Decides cells only one player matched. */
  private readonly fallback: ClaimStrategy;

  private constructor(fallback: ClaimStrategy) {
    this.fallback = fallback;
  }

  /**
   * Creates a {@link ContestedCellVoidStrategy} instance.
   *
   * @param fallback - Decides cells with a single candidate.
   * @returns A strategy that empties contested cells.
   * @throws {TypeError} If no fallback is supplied.
   */
  public static create(fallback: ClaimStrategy): ContestedCellVoidStrategy {
    if (fallback === null || fallback === undefined) {
      throw new TypeError("fallback must be provided");
    }

    return new ContestedCellVoidStrategy(fallback);
  }

  /**
   * Returns null when more than one player matched, otherwise the fallback's choice.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns Null for a contested cell, or the fallback's choice.
   */
  public selectWinner(
    candidates: ReadonlyArray<ClaimCandidate>,
    context: ClaimContext,
  ): Cell {
    if (candidates.length > UNCONTESTED_CANDIDATE_COUNT) {
      return null;
    }

    return this.fallback.selectWinner(candidates, context);
  }
}
