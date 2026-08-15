import type { Cell } from "../Cell";
import type { RectangleRegion } from "./RectangleRegion";
import type { StartingPattern } from "./StartingPattern";

/**
 * A starting pattern made of one or more rectangular blocks, each owned by a single player.
 *
 * Regions are matched in declaration order and are expected not to overlap; a caller placing
 * overlapping regions gets whichever one appears first in the array. A cell outside every
 * region starts empty.
 *
 * Use the static factory method {@link RectanglesStartingPattern.create} to construct an
 * instance.
 */
export class RectanglesStartingPattern implements StartingPattern {
  /** The rectangular blocks making up this pattern. */
  private readonly regions: ReadonlyArray<RectangleRegion>;

  private constructor(regions: ReadonlyArray<RectangleRegion>) {
    this.regions = regions;
  }

  /**
   * Creates a {@link RectanglesStartingPattern} instance.
   *
   * @param regions - The rectangular blocks making up the pattern.
   * @returns A validated RectanglesStartingPattern instance.
   * @throws {RangeError} If regions is empty.
   */
  public static create(regions: ReadonlyArray<RectangleRegion>): RectanglesStartingPattern {
    if (regions.length === 0) {
      throw new RangeError("regions must not be empty");
    }

    return new RectanglesStartingPattern([...regions]);
  }

  /**
   * Returns the owner of the first region containing (x, y).
   *
   * @param x - Column index, counted from the left edge.
   * @param y - Row index, counted from the top edge.
   * @returns The id of the player owning the cell, or `null` if it starts empty.
   */
  cellAt(x: number, y: number): Cell {
    for (const region of this.regions) {
      const isInside =
        x >= region.x &&
        x < region.x + region.width &&
        y >= region.y &&
        y < region.y + region.height;

      if (isInside) {
        return region.owner;
      }
    }

    return null;
  }
}
