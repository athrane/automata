import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * Awards a contested cell by a roster priority that rotates each generation.
 *
 * The player first in priority advances by one roster position per
 * generation, so the advantage the first-match rule grants to index 0 is
 * spread evenly across the roster over a run. The rotation is a total order
 * on the roster and consults no randomness, so a run stays reproducible.
 */
export class RotatingPriorityClaimStrategy implements ClaimStrategy {
  /** The prioritised roster position may match after an earlier one, so every match is needed. */
  public readonly needsAllCandidates = true;

  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link RotatingPriorityClaimStrategy} instance.
   *
   * No fallback is needed: rotation orders the whole roster, so two
   * candidates can never tie.
   *
   * @returns A strategy that rotates priority once per generation.
   */
  public static create(): RotatingPriorityClaimStrategy {
    return new RotatingPriorityClaimStrategy();
  }

  /**
   * Returns the id of the candidate closest to the generation's priority slot.
   *
   * The offset is derived from the roster size rather than the number of
   * candidates, so it holds steady for a whole sweep of the grid instead of
   * advancing at a different rate on every cell.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns The prioritised candidate's player id.
   */
  public selectWinner(
    candidates: ReadonlyArray<ClaimCandidate>,
    context: ClaimContext,
  ): Cell {
    const offset = context.generation % context.playerCount;

    const winner = candidates.reduce((best, candidate) =>
      this.distanceFrom(offset, candidate, context) <
      this.distanceFrom(offset, best, context)
        ? candidate
        : best,
    );

    return winner.player.id;
  }

  /**
   * Returns how many roster positions a candidate sits behind the priority slot.
   *
   * @param offset - Roster index holding priority this generation.
   * @param candidate - The candidate to measure.
   * @param context - Supplies the roster size the distance wraps at.
   * @returns The wrapped distance, from 0 for the prioritised position upwards.
   */
  private distanceFrom(
    offset: number,
    candidate: ClaimCandidate,
    context: ClaimContext,
  ): number {
    return (
      ((candidate.rosterIndex - offset) % context.playerCount + context.playerCount) %
      context.playerCount
    );
  }
}
