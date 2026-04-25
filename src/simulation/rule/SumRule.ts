import type { Grid } from "../../types";
import type { Rule } from "./Rule";

/**
 * A rule that matches when the count of same-player neighbors
 * is one of the specified sums.
 *
 * Supports configurable neighbor counting:
 * - By default the central cell is excluded from the count.
 * - When `includeSelf` is `true` the central cell's own value is included.
 */
export class SumRule implements Rule {
  private readonly sums: Set<number>;
  private readonly includeSelf: boolean;

  /**
   * @param sums        - The neighbor counts that trigger a match.
   * @param includeSelf - When `true` the central cell is included in the count.
   *                      Defaults to `false`.
   * @throws {TypeError} If sums is not an array.
   */
  constructor(sums: number[], includeSelf: boolean = false) {
    if (!Array.isArray(sums)) throw new TypeError("sums must be an array");
    this.sums = new Set(sums);
    this.includeSelf = includeSelf;
  }

  /**
   * Returns true when the neighbor count for the given player
   * at (x, y) is included in the target sums.
   *
   * Supported SUM transitions (central cell excluded, default):
   * - Solitude death    : populated cell with 0 or 1 neighbors.
   * - Overpopulation    : populated cell with 4 or more neighbors.
   * - Survival (2)      : populated cell with exactly 2 neighbors survives.
   * - Survival/birth (3): any cell with exactly 3 neighbors survives or is born.
   */
  matches(grid: Grid, x: number, y: number, playerId: number): boolean {
    const height = grid.length;
    const width = height > 0 ? grid[0].length : 0;
    let count = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        if (!this.includeSelf && xOffset === 0 && yOffset === 0) {
          continue;
        }

        const nextX = x + xOffset;
        const nextY = y + yOffset;

        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
          continue;
        }

        if (grid[nextY][nextX] === playerId) {
          count += 1;
        }
      }
    }

    return this.sums.has(count);
  }
}
