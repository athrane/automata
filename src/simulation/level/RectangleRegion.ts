import type { Cell } from "../Cell";

/**
 * One axis-aligned rectangular block of a {@link RectanglesStartingPattern}, owned by a
 * single player.
 *
 * `x`/`y` is the block's top-left corner; `width`/`height` extend right and down from there.
 */
export interface RectangleRegion {
  /** Column index of the block's left edge. */
  readonly x: number;

  /** Row index of the block's top edge. */
  readonly y: number;

  /** Width of the block, in cells. */
  readonly width: number;

  /** Height of the block, in cells. */
  readonly height: number;

  /** The id of the player owning every cell inside the block, or `null` for an empty block. */
  readonly owner: Cell;
}
