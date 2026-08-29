import type { Grid } from "../../Grid";
import type { GridPosition } from "../../player/GridPosition";
import type { Player } from "../../player/Player";
import type { ClaimCandidate } from "../ClaimCandidate";

/**
 * Decides which players are eligible for a cell, and how strongly each
 * eligible player's rules match it.
 *
 * This is the first of the two stages of cell resolution: it owns which
 * players even become {@link ClaimCandidate}s. The configured
 * `CellClaimResolutionStrategy` owns the second stage, picking a winner
 * among whatever candidates this strategy returns.
 */
export interface RuleSetApplicationStrategy {
  /**
   * Returns the candidates eligible to claim the cell at (x, y), in roster order.
   *
   * Enumeration may stop as soon as one candidate is found when
   * `needsAllCandidates` is false, mirroring the early-stop optimisation the
   * per-cell resolution path already applies.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @param generation - The generation being read, before it advances.
   * @param needsAllCandidates - Whether every eligible player must be evaluated.
   * @returns The eligible players whose rules matched, in roster order.
   */
  buildCandidates(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
    generation: number,
    needsAllCandidates: boolean,
  ): ClaimCandidate[];

  /**
   * Returns the owner to assign the cell when no candidate wins its value.
   *
   * `CellClaim.resolve` decides only the cell's value, never its owner — a
   * mode that persists claims independent of the current rule match (a
   * dormant cell) reports that persistent owner here; a mode with no such
   * persistence reports null, leaving the cell fully unowned.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @returns The persistent owner to fall back to, or null for no persistence.
   */
  resolveOwner(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
  ): number | null;
}
