import type { Grid } from "../Grid";
import { wrapCoordinate } from "../WrapCoordinate";
import type { Rule } from "./Rule";

/** Number of neighbors surrounding a cell in the 8-direction Moore neighbourhood. */
const NEIGHBOR_COUNT = 8;

/**
 * The 8 neighbour offsets in row-major order, excluding the centre cell:
 * top-left, top, top-right, left, right, bottom-left, bottom, bottom-right.
 */
const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

/**
 * A rule that matches when the 8 neighbouring cells exactly match a
 * predefined geometric pattern for the player.
 *
 * The pattern is an array of 8 booleans indexed in the same order as
 * {@link NEIGHBOR_OFFSETS}: top-left, top, top-right, left, right,
 * bottom-left, bottom, bottom-right.
 * `true` means the neighbour must contain this player's cell;
 * `false` means it must not.
 *
 * The grid is toroidal: neighbour coordinates that run past an edge wrap
 * around to the opposite edge, both horizontally and vertically.
 */
export class GeometryRule implements Rule {
  private readonly pattern: ReadonlyArray<boolean>;

  /**
   * @param pattern - An 8-element boolean array describing the required
   *   neighbour configuration.
   * @throws {TypeError} If pattern is not an array.
   * @throws {RangeError} If pattern does not contain exactly 8 elements.
   */
  constructor(pattern: boolean[]) {
    if (!Array.isArray(pattern)) throw new TypeError("pattern must be an array");
    if (pattern.length !== NEIGHBOR_COUNT) {
      throw new RangeError(`pattern must have exactly ${NEIGHBOR_COUNT} elements`);
    }
    this.pattern = pattern;
  }

  /**
   * Returns true when all 8 neighbours match the pattern for the given
   * player at position (x, y). Neighbour coordinates wrap around the grid
   * edges, so edge and corner cells have a full 8-neighbour neighbourhood.
   */
  matches(grid: Grid, x: number, y: number, playerId: number): boolean {
    const height = grid.length;
    const width = height > 0 ? grid[0].length : 0;

    if (width === 0 || height === 0) return !this.pattern.includes(true);

    for (let i = 0; i < NEIGHBOR_COUNT; i += 1) {
      const [xOffset, yOffset] = NEIGHBOR_OFFSETS[i];
      const nx = wrapCoordinate(x + xOffset, width);
      const ny = wrapCoordinate(y + yOffset, height);

      const isPlayer = grid[ny][nx] === playerId;

      if (isPlayer !== this.pattern[i]) {
        return false;
      }
    }

    return true;
  }
}
