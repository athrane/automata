import type { Grid } from "../Grid";
import type { GridPosition } from "./GridPosition";
import type { StartPositioningStrategy } from "./StartPositioningStrategy";

/**
 * Starts a player on the first cell it owns in row-major order — top-left to
 * bottom-right.
 *
 * Row-major order is what makes "first claimed cell" well-defined, since a
 * `StartingPattern` exposes no ordering of its own. The cell is that player's
 * first, not the grid's, because a single global first cell would stack every
 * player on one square.
 *
 * Use the static factory method {@link FirstClaimedCellPositioning.create} to
 * construct an instance.
 */
export class FirstClaimedCellPositioning implements StartPositioningStrategy {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link FirstClaimedCellPositioning} instance.
   *
   * @returns A strategy that positions a player on its first owned cell.
   */
  public static create(): FirstClaimedCellPositioning {
    return new FirstClaimedCellPositioning();
  }

  /**
   * Returns the first cell owned by `playerId` in row-major order.
   *
   * @param grid - The seeded grid at generation 0.
   * @param playerId - The player to position.
   * @returns The player's first owned cell.
   * @throws {RangeError} If the player owns no cell in the grid.
   */
  public selectPosition(grid: Grid, playerId: number): GridPosition {
    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y];
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === playerId) {
          return { x, y };
        }
      }
    }

    throw new RangeError("player has no claimed cells");
  }
}
