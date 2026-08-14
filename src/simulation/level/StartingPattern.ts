import type { Cell } from "../Cell";

/**
 * Defines the state of the grid at generation 0.
 *
 * A pattern is addressed by coordinate rather than handed out as a prebuilt
 * grid, so a single instance can be applied to a grid of any size.
 *
 * Implementations must be pure: `cellAt` is called once per cell of the grid
 * and must return the same value for the same coordinate every time, since a
 * level start has to be reproducible.
 */
export interface StartingPattern {
  /**
   * Returns the owner of the cell at (x, y) before the first generation runs.
   *
   * @param x - Column index, counted from the left edge.
   * @param y - Row index, counted from the top edge.
   * @returns The id of the player owning the cell, or `null` if it starts empty.
   */
  cellAt(x: number, y: number): Cell;
}
