import type { Cell } from "../Cell";
import type { Grid } from "../Grid";
import type { Player } from "../player/Player";
import type { ClaimCandidate } from "./ClaimCandidate";
import type { ClaimStrategy } from "./ClaimStrategy";

/**
 * Resolves the owner of a single cell in the next generation.
 *
 * Resolution has two steps. This class owns the first: every player whose
 * rules match the cell becomes a {@link ClaimCandidate}. The configured
 * {@link ClaimStrategy} owns the second: picking the winner among them.
 *
 * Enumeration stops at the first match for a strategy that declares it does
 * not need the full list. Building the list eagerly costs the rule
 * evaluations the pre-extraction generation loop skipped, which measured at
 * roughly twice the cost of a whole generation on a 100x100 grid — enough to
 * miss the renderer's frame budget at the fastest speed.
 *
 * A player's rules are combined with OR, not AND: each rule (e.g. a "born"
 * or a "survive" preset) independently makes the player a candidate, since
 * requiring every selected rule to match the same cell simultaneously is
 * almost never satisfiable and causes the grid to die out within a
 * generation or two.
 */
export class CellClaim {
  /** Decides the winner among the candidates. */
  private readonly strategy: ClaimStrategy;

  private constructor(strategy: ClaimStrategy) {
    this.strategy = strategy;
  }

  /**
   * Creates a {@link CellClaim} instance.
   *
   * @param strategy - Decides which candidate claims a contested cell.
   * @returns A CellClaim that resolves cells through the given strategy.
   * @throws {TypeError} If no strategy is supplied.
   */
  public static create(strategy: ClaimStrategy): CellClaim {
    if (strategy === null || strategy === undefined) {
      throw new TypeError("strategy must be provided");
    }

    return new CellClaim(strategy);
  }

  /**
   * Returns the owner of the cell at (x, y) in the next generation.
   *
   * The strategy is not consulted when no player matched: an unclaimed cell
   * is empty, which is not a decision a strategy gets to make.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell to resolve.
   * @param y - Y coordinate of the cell to resolve.
   * @param players - The registered players, in roster order.
   * @param generation - The generation being read, before it advances.
   * @returns The winning player's id, or null when the cell stays empty.
   */
  public resolve(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    generation: number,
  ): Cell {
    const candidates: ClaimCandidate[] = [];

    for (let rosterIndex = 0; rosterIndex < players.length; rosterIndex += 1) {
      const player = players[rosterIndex];
      const rules = player.rules;
      let matchedRuleCount = 0;

      // Counted with an index loop rather than filter: this runs once per
      // player per cell, and the closure and result array a callback form
      // allocates dominate the cost of the rule evaluations themselves.
      for (let i = 0; i < rules.length; i += 1) {
        if (rules[i].matches(grid, x, y, player.id)) {
          matchedRuleCount += 1;
        }
      }

      if (matchedRuleCount > 0) {
        candidates.push({ player, rosterIndex, matchedRuleCount });

        if (!this.strategy.needsAllCandidates) {
          break;
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    return this.strategy.selectWinner(candidates, {
      grid,
      x,
      y,
      owner: grid[y][x],
      generation,
      playerCount: players.length,
    });
  }
}
