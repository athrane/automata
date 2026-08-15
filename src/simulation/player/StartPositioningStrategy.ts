import type { Grid } from "../Grid";
import type { GridPosition } from "./GridPosition";

/**
 * Chooses the cell a player starts a game on.
 *
 * A strategy is called once per player, after the level's starting pattern has
 * been applied, and reads the seeded grid rather than the `StartingPattern`, so
 * no pattern implementation has to grow an enumeration method for this one
 * caller.
 *
 * An implementation must throw rather than return a position outside the grid
 * or a cell the player does not own.
 */
export interface StartPositioningStrategy {
  /**
   * Returns the cell `playerId` starts on.
   *
   * @param grid - The seeded grid at generation 0.
   * @param playerId - The player to position.
   * @returns A position inside the grid, on a cell owned by that player.
   * @throws {RangeError} If the player owns no cell in the grid.
   */
  selectPosition(grid: Grid, playerId: number): GridPosition;
}
