import type { Grid } from "../../Grid";
import type { GridPosition } from "../../player/GridPosition";
import type { Player } from "../../player/Player";
import type { ClaimCandidate } from "../ClaimCandidate";
import type { RuleSetApplicationStrategy } from "./RuleSetApplicationStrategy";

/**
 * Every player in the roster is eligible for every cell.
 *
 * A player's rules are combined with OR, not AND: each rule (e.g. a "born"
 * or a "survive" preset) independently makes the player a candidate, since
 * requiring every selected rule to match the same cell simultaneously is
 * almost never satisfiable and causes the grid to die out within a
 * generation or two.
 */
export class GlobalRuleSetApplicationStrategy implements RuleSetApplicationStrategy {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link GlobalRuleSetApplicationStrategy} instance.
   *
   * @returns A strategy that considers every roster player eligible for every cell.
   */
  public static create(): GlobalRuleSetApplicationStrategy {
    return new GlobalRuleSetApplicationStrategy();
  }

  /**
   * Returns every roster player whose rules matched, in roster order.
   *
   * Counted with an index loop rather than filter: this runs once per player
   * per cell, and the closure and result array a callback form allocates
   * dominate the cost of the rule evaluations themselves.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - Unused: every player is eligible regardless of position.
   * @param generation - Unused: eligibility and match strength do not depend on the generation.
   * @param needsAllCandidates - Whether every player must be evaluated, or enumeration may stop at the first match.
   * @returns The players whose rules matched, in roster order.
   */
  public buildCandidates(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    _positions: ReadonlyMap<number, GridPosition>,
    _generation: number,
    needsAllCandidates: boolean,
  ): ClaimCandidate[] {
    const candidates: ClaimCandidate[] = [];

    for (let rosterIndex = 0; rosterIndex < players.length; rosterIndex += 1) {
      const player = players[rosterIndex];
      const rules = player.rules;
      let matchedRuleCount = 0;

      for (let i = 0; i < rules.length; i += 1) {
        if (rules[i].matches(grid, x, y, player.id)) {
          matchedRuleCount += 1;
        }
      }

      if (matchedRuleCount > 0) {
        candidates.push({ player, rosterIndex, matchedRuleCount });

        if (!needsAllCandidates) {
          break;
        }
      }
    }

    return candidates;
  }

  /**
   * Returns null: this mode has no ownership persistence, so a cell no
   * candidate wins is fully unowned.
   *
   * @param grid - Unused.
   * @param x - Unused.
   * @param y - Unused.
   * @param players - Unused.
   * @param positions - Unused.
   * @returns Always null.
   */
  public resolveOwner(
    _grid: Grid,
    _x: number,
    _y: number,
    _players: ReadonlyArray<Player>,
    _positions: ReadonlyMap<number, GridPosition>,
  ): number | null {
    return null;
  }
}
