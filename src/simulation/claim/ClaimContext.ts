import type { Cell } from "../Cell";
import type { Grid } from "../Grid";

/**
 * Everything a {@link ClaimStrategy} may read about the cell being resolved.
 *
 * The state is passed as a context object rather than as positional
 * parameters so that a strategy needing more of the surrounding state does
 * not change the signature every other strategy implements.
 */
export interface ClaimContext {
  /** The grid of the generation being read. Never the grid being written. */
  readonly grid: Grid;

  /** X coordinate of the cell being resolved. */
  readonly x: number;

  /** Y coordinate of the cell being resolved. */
  readonly y: number;

  /** Owner of the cell in the generation being read, or null when empty. */
  readonly owner: Cell;

  /** The generation being read, before the simulation advances. */
  readonly generation: number;

  /** Number of players registered with the simulation. */
  readonly playerCount: number;
}
