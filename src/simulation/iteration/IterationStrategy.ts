import type { GridPosition } from "../player/GridPosition";
import type { GenerationContext } from "../mode/GenerationContext";

/**
 * Decides which cells a generation evaluates at all.
 *
 * This is independent of who is eligible once a cell is visited — that
 * decision belongs to the configured `RuleSetApplicationStrategy`.
 */
export interface IterationStrategy {
  /**
   * Returns the cells to visit for one generation.
   *
   * @param context - The state of the generation being read.
   * @returns The cells to resolve this generation.
   */
  cellsToVisit(context: GenerationContext): Iterable<GridPosition>;
}
