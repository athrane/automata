import type { Grid } from "../../Grid";
import type { GridPosition } from "../../player/GridPosition";
import type { Player } from "../../player/Player";
import type { ClaimCandidate } from "../ClaimCandidate";
import type { RuleSetApplicationStrategy } from "./RuleSetApplicationStrategy";

/**
 * Keeps a cell's value when no player's rules match it.
 *
 * A decorator over another {@link RuleSetApplicationStrategy}: whenever the
 * inner strategy offers at least one candidate those candidates are used
 * unchanged, so any matching rule always beats the incumbent. Only when
 * nothing matched is the player currently holding the cell offered as the
 * sole candidate, with a `matchedRuleCount` of 0, so the cell keeps its value
 * instead of going empty.
 *
 * Use the static factory method {@link PersistentValueRuleSetApplicationStrategy.create}
 * to construct an instance.
 */
export class PersistentValueRuleSetApplicationStrategy implements RuleSetApplicationStrategy {
  /** The strategy whose candidates and owner fallback are decorated. */
  private readonly inner: RuleSetApplicationStrategy;

  private constructor(inner: RuleSetApplicationStrategy) {
    this.inner = inner;
  }

  /**
   * Creates a {@link PersistentValueRuleSetApplicationStrategy} instance.
   *
   * @param inner - The strategy deciding eligibility and candidates when a rule matches.
   * @returns A strategy that falls back to the cell's current holder when nothing matches.
   * @throws {TypeError} If inner is not supplied.
   */
  public static create(inner: RuleSetApplicationStrategy): PersistentValueRuleSetApplicationStrategy {
    if (inner === null || inner === undefined) {
      throw new TypeError("inner must be provided");
    }

    return new PersistentValueRuleSetApplicationStrategy(inner);
  }

  /**
   * Returns the inner strategy's candidates, or the cell's current holder when there are none.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @param generation - The generation being read, before it advances.
   * @param needsAllCandidates - Whether every eligible player must be evaluated.
   * @returns The inner candidates; otherwise the incumbent with a match count of 0, or none
   *   when the cell is empty or held by a player outside the roster.
   */
  public buildCandidates(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
    generation: number,
    needsAllCandidates: boolean,
  ): ClaimCandidate[] {
    const candidates = this.inner.buildCandidates(
      grid,
      x,
      y,
      players,
      positions,
      generation,
      needsAllCandidates,
    );

    if (candidates.length > 0) {
      return candidates;
    }

    const value = grid[y][x].value;
    const rosterIndex = players.findIndex((player) => player.id === value);

    if (rosterIndex === -1) {
      return [];
    }

    return [{ player: players[rosterIndex], rosterIndex, matchedRuleCount: 0 }];
  }

  /**
   * Delegates to the inner strategy, so persistence of a cell's value does not
   * alter how its owner is decided.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @returns The inner strategy's owner fallback.
   */
  public resolveOwner(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
  ): number | null {
    return this.inner.resolveOwner(grid, x, y, players, positions);
  }
}
