import type { Grid } from "../Grid";
import type { GenerationContext } from "./GenerationContext";

/**
 * Computes the grid of the next generation from the current one.
 *
 * The mode owns which cells a generation evaluates and whose rules are
 * consulted for them. Making that a strategy keeps `Simulation` closed for
 * modification when a new shape of game is added, the same way `ClaimStrategy`
 * does for the per-cell decision.
 */
export interface SimulationMode {
  /**
   * Returns the grid of the next generation.
   *
   * The returned grid must be a new array rather than the one in `context`: a
   * synchronous cellular automaton reads every cell of one generation before
   * any cell of the next is written.
   *
   * @param context - The state of the generation being read.
   * @returns The grid of the next generation.
   */
  nextGeneration(context: GenerationContext): Grid;
}
