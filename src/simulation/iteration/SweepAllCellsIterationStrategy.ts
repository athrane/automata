import type { GridPosition } from "../player/GridPosition";
import type { GenerationContext } from "../mode/GenerationContext";
import type { IterationStrategy } from "./IterationStrategy";

/**
 * Visits every cell of the grid, in row-major order.
 *
 * Use the static factory method {@link SweepAllCellsIterationStrategy.create}
 * to construct an instance.
 */
export class SweepAllCellsIterationStrategy implements IterationStrategy {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link SweepAllCellsIterationStrategy} instance.
   *
   * @returns A strategy that visits every cell of the grid.
   */
  public static create(): SweepAllCellsIterationStrategy {
    return new SweepAllCellsIterationStrategy();
  }

  /**
   * Returns every cell of `context.grid`, in row-major order.
   *
   * @param context - The state of the generation being read.
   * @returns Every cell of the grid.
   */
  public cellsToVisit(context: GenerationContext): GridPosition[] {
    const height = context.grid.length;
    const width = height > 0 ? context.grid[0].length : 0;
    const cells: GridPosition[] = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        cells.push({ x, y });
      }
    }

    return cells;
  }
}
