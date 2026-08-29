import type { GridPosition } from "../player/GridPosition";
import type { GenerationContext } from "../mode/GenerationContext";
import type { IterationStrategy } from "./IterationStrategy";

/**
 * Visits every currently-owned cell plus every player's current position,
 * de-duplicated by coordinate.
 *
 * Eligibility (which player's rules actually apply to a visited cell) is
 * decided later, per cell, by the configured `RuleSetApplicationStrategy` —
 * this strategy only narrows how much of the grid is touched at all, so a
 * cell neither owned nor occupied is never visited.
 *
 * Use the static factory method {@link OwnedCellIterationStrategy.create}
 * to construct an instance.
 */
export class OwnedCellIterationStrategy implements IterationStrategy {
  private constructor() {
    // Stateless; construction goes through create for consistency with the project's factories.
  }

  /**
   * Creates a {@link OwnedCellIterationStrategy} instance.
   *
   * @returns A strategy that visits only owned or occupied cells.
   */
  public static create(): OwnedCellIterationStrategy {
    return new OwnedCellIterationStrategy();
  }

  /**
   * Returns the union of every owned cell and every player's current
   * position, without duplicates.
   *
   * @param context - The state of the generation being read.
   * @returns The cells to resolve this generation.
   */
  public cellsToVisit(context: GenerationContext): GridPosition[] {
    const height = context.grid.length;
    const width = height > 0 ? context.grid[0].length : 0;
    const seen = new Set<number>();
    const cells: GridPosition[] = [];

    const addCell = (x: number, y: number): void => {
      const key = y * width + x;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      cells.push({ x, y });
    };

    for (let y = 0; y < height; y += 1) {
      const row = context.grid[y];
      for (let x = 0; x < row.length; x += 1) {
        if (row[x].ownerId !== null) {
          addCell(x, y);
        }
      }
    }

    for (const position of context.positions.values()) {
      addCell(position.x, position.y);
    }

    return cells;
  }
}
