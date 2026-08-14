import type { Cell } from "../Cell";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimContext } from "./ClaimContext";

/** Decides which of the players matching a cell claims it in the next generation. */
export interface ClaimStrategy {
  /**
   * Whether {@link selectWinner} needs every matching player or only the first.
   *
   * Declaring `false` lets the resolver stop evaluating rules at the first
   * player that matches, which is what the generation loop did before claim
   * resolution was extracted. A strategy that compares candidates against
   * each other must declare `true`, including a decorator whose fallback
   * declares `false`, since the decorator itself does the comparing.
   */
  readonly needsAllCandidates: boolean;

  /**
   * Returns the id of the player that claims the cell, or null to leave it empty.
   *
   * The candidates are never empty and are ordered by {@link ClaimCandidate.rosterIndex}
   * ascending. The returned value must be the id of one of the candidates, or null;
   * returning any other id would put a player on the grid whose rules did not match.
   *
   * @param candidates - The players whose rules matched, in roster order.
   * @param context - The cell being resolved and the state surrounding it.
   * @returns The winning player's id, or null when no player claims the cell.
   */
  selectWinner(candidates: ReadonlyArray<ClaimCandidate>, context: ClaimContext): Cell;
}
