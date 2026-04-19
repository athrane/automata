import type { Grid } from "../../types";
import type { Rule } from "./Rule";

/**
 * A rule that matches when the count of same-player neighbors
 * is one of the specified sums.
 */
export class SumRule implements Rule {
  private readonly sums: Set<number>;

  /**
   * @param sums - The neighbor counts that trigger a match.
   * @throws {TypeError} If sums is not an array.
   */
  constructor(sums: number[]) {
    if (!Array.isArray(sums)) throw new TypeError("sums must be an array");
    this.sums = new Set(sums);
  }

  /**
   * Returns true when the neighbor count for the given player
   * at (x, y) is included in the target sums.
   */
  matches(grid: Grid, x: number, y: number, playerId: number): boolean {
    const height = grid.length;
    const width = height > 0 ? grid[0].length : 0;
    let count = 0;

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        if (xOffset === 0 && yOffset === 0) {
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
