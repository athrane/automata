import type { Grid } from "../../Grid";
import type { GridPosition } from "../../player/GridPosition";
import type { Player } from "../../player/Player";
import type { ClaimCandidate } from "../ClaimCandidate";
import type { RuleSetApplicationStrategy } from "./RuleSetApplicationStrategy";

/**
 * Restricts eligibility to whichever player owns the cell, or currently
 * occupies it when it is unowned.
 *
 * A cell owned by a player and another player's position can never coincide,
 * since `Simulation.movePlayer` already refuses to move a player onto a cell
 * owned by someone else — so ordinarily exactly one player is eligible. A
 * genuine tie is possible only on an unowned cell more than one player's
 * position resolves to; both are offered as candidates and left to the
 * configured claim-resolution strategy to break, exactly as an ordinary
 * contested cell would be.
 */
export class OwnershipEligibilityRuleSetApplicationStrategy implements RuleSetApplicationStrategy {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link OwnershipEligibilityRuleSetApplicationStrategy} instance.
   *
   * @returns A strategy that restricts eligibility to a cell's owner or occupant.
   */
  public static create(): OwnershipEligibilityRuleSetApplicationStrategy {
    return new OwnershipEligibilityRuleSetApplicationStrategy();
  }

  /**
   * Returns the owning or occupying roster player(s) whose rules matched, in roster order.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @param generation - Unused: eligibility and match strength do not depend on the generation.
   * @param needsAllCandidates - Whether every eligible player must be evaluated.
   * @returns The eligible players whose rules matched, in roster order.
   */
  public buildCandidates(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
    _generation: number,
    needsAllCandidates: boolean,
  ): ClaimCandidate[] {
    const owner = grid[y][x].ownerId;
    const candidates: ClaimCandidate[] = [];

    for (let rosterIndex = 0; rosterIndex < players.length; rosterIndex += 1) {
      const player = players[rosterIndex];

      if (!this.isEligible(player, owner, positions, x, y)) {
        continue;
      }

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
   * Returns the earliest-in-roster player eligible for the cell, whether or
   * not its rules matched.
   *
   * A claim persists through a generation where the owner's rules stop
   * matching: `CellClaim.resolve` returns null (the cell goes dormant), but
   * this method still reports the eligible player as the owner, so the
   * caller keeps the cell rather than clearing it. Standing on unclaimed
   * ground has the same effect, birthing a dormant claim even before any
   * rule has fired.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @returns The eligible owner's id, or null when no player is eligible.
   */
  public resolveOwner(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
  ): number | null {
    const owner = grid[y][x].ownerId;

    for (const player of players) {
      if (this.isEligible(player, owner, positions, x, y)) {
        return player.id;
      }
    }

    return null;
  }

  /**
   * Returns whether a player owns or currently occupies the cell at (x, y).
   *
   * @param player - The player to check.
   * @param owner - The persistent owner of the cell, or null when unclaimed.
   * @param positions - The cell each player occupies, keyed by player id.
   * @param x - X coordinate of the cell being resolved.
   * @param y - Y coordinate of the cell being resolved.
   * @returns True when the player owns the cell or stands on it.
   */
  private isEligible(
    player: Player,
    owner: number | null,
    positions: ReadonlyMap<number, GridPosition>,
    x: number,
    y: number,
  ): boolean {
    if (player.id === owner) {
      return true;
    }

    const position = positions.get(player.id);

    return position !== undefined && position.x === x && position.y === y;
  }
}
