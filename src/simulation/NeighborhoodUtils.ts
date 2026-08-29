import { wrapCoordinate } from "./WrapCoordinate";

/** Number of neighbours in the 8-direction Moore neighbourhood. */
const NEIGHBOR_COUNT = 8;

/**
 * The 8 neighbour offsets of the Moore neighbourhood, in row-major order,
 * excluding the centre cell: top-left, top, top-right, left, right,
 * bottom-left, bottom, bottom-right.
 */
const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

/** Shared Moore-neighbourhood lookup used by rules and claim-resolution strategies. */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- deliberately a static-only utility class
export class NeighborhoodUtils {
  private constructor() {
    // Static utility; never instantiated.
  }

  /**
   * Invokes `visit` once for each of the 8 wrapped Moore-neighbour
   * coordinates of (x, y), in a fixed order: top-left, top, top-right, left,
   * right, bottom-left, bottom, bottom-right.
   *
   * Neighbour coordinates wrap at every edge, so every cell has a full
   * 8-neighbour neighbourhood regardless of its position on the grid.
   *
   * @param width - Grid width in cells. Must be greater than 0.
   * @param height - Grid height in cells. Must be greater than 0.
   * @param x - X coordinate of the centre cell.
   * @param y - Y coordinate of the centre cell.
   * @param visit - Called once per neighbour with its wrapped coordinates and offset index (0-7).
   * @throws {RangeError} If width or height is not greater than 0.
   */
  public static forEachMooreNeighbor(
    width: number,
    height: number,
    x: number,
    y: number,
    visit: (nx: number, ny: number, index: number) => void,
  ): void {
    for (let i = 0; i < NEIGHBOR_COUNT; i += 1) {
      const [xOffset, yOffset] = NEIGHBOR_OFFSETS[i];
      const nx = wrapCoordinate(x + xOffset, width);
      const ny = wrapCoordinate(y + yOffset, height);

      visit(nx, ny, i);
    }
  }
}
