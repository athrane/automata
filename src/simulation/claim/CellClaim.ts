import type { Grid } from "../Grid";
import type { GridPosition } from "../player/GridPosition";
import type { Player } from "../player/Player";
import type { RuleSetApplicationStrategy } from "./application/RuleSetApplicationStrategy";
import type { CellClaimResolutionStrategy } from "./resolution/CellClaimResolutionStrategy";

/**
 * Resolves the owner of a single cell in the next generation.
 *
 * Resolution has two steps. The configured {@link RuleSetApplicationStrategy}
 * owns the first: deciding which players are eligible for the cell and
 * building a {@link ClaimCandidate} for each whose rules match. The configured
 * {@link CellClaimResolutionStrategy} owns the second: picking the winner
 * among them.
 */
export class CellClaim {
  /** Decides which players are eligible for the cell and how their rules match. */
  private readonly ruleSetApplication: RuleSetApplicationStrategy;

  /** Decides the winner among the candidates. */
  private readonly claimResolution: CellClaimResolutionStrategy;

  private constructor(
    ruleSetApplication: RuleSetApplicationStrategy,
    claimResolution: CellClaimResolutionStrategy,
  ) {
    this.ruleSetApplication = ruleSetApplication;
    this.claimResolution = claimResolution;
  }

  /**
   * Creates a {@link CellClaim} instance.
   *
   * @param ruleSetApplication - Decides which players are eligible for a cell and builds candidates.
   * @param claimResolution - Decides which candidate claims a contested cell.
   * @returns A CellClaim that resolves cells through the given strategies.
   * @throws {TypeError} If either strategy is not supplied.
   */
  public static create(
    ruleSetApplication: RuleSetApplicationStrategy,
    claimResolution: CellClaimResolutionStrategy,
  ): CellClaim {
    if (ruleSetApplication === null || ruleSetApplication === undefined) {
      throw new TypeError("ruleSetApplication must be provided");
    }
    if (claimResolution === null || claimResolution === undefined) {
      throw new TypeError("claimResolution must be provided");
    }

    return new CellClaim(ruleSetApplication, claimResolution);
  }

  /**
   * Returns the value of the cell at (x, y) in the next generation.
   *
   * The claim-resolution strategy is not consulted when no player is a
   * candidate: an unclaimed cell is empty, which is not a decision a strategy
   * gets to make. The caller — the simulation mode — decides the cell's
   * persistent owner; this method decides only what the cell computes to.
   *
   * @param grid - The grid of the generation being read.
   * @param x - X coordinate of the cell to resolve.
   * @param y - Y coordinate of the cell to resolve.
   * @param players - The registered players, in roster order.
   * @param positions - The cell each player occupies, keyed by player id.
   * @param generation - The generation being read, before it advances.
   * @returns The winning player's id, or null when the cell stays empty.
   */
  public resolve(
    grid: Grid,
    x: number,
    y: number,
    players: ReadonlyArray<Player>,
    positions: ReadonlyMap<number, GridPosition>,
    generation: number,
  ): number | null {
    const candidates = this.ruleSetApplication.buildCandidates(
      grid,
      x,
      y,
      players,
      positions,
      generation,
      this.claimResolution.needsAllCandidates,
    );

    if (candidates.length === 0) {
      return null;
    }

    return this.claimResolution.selectWinner(candidates, {
      grid,
      x,
      y,
      owner: grid[y][x].ownerId,
      generation,
      playerCount: players.length,
    });
  }
}
