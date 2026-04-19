import type { Grid } from "../types";
import type { Rule } from "./Rule";

export class SumRule implements Rule {
  private readonly sums: Set<number>;

  constructor(sums: number[]) {
    this.sums = new Set(sums);
  }

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
