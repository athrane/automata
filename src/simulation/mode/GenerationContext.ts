import type { CellClaim } from "../claim/CellClaim";
import type { Grid } from "../Grid";
import type { GridPosition } from "../player/GridPosition";
import type { Player } from "../player/Player";

/**
 * Everything a {@link SimulationMode} needs to compute one generation.
 *
 * A context object is passed rather than five positional parameters, mirroring
 * the `ClaimContext` convention already established for the per-cell path.
 */
export interface GenerationContext {
  /** The grid of the generation being read. */
  readonly grid: Grid;

  /** The registered players, in roster order. */
  readonly players: ReadonlyArray<Player>;

  /** The generation being read, before it advances. */
  readonly generation: number;

  /**
   * The cell each player occupies, keyed by player id.
   *
   * Empty in a game whose mode does not use positions, so a mode that reads it
   * must tolerate a player having none.
   */
  readonly positions: ReadonlyMap<number, GridPosition>;

  /** Resolves the owner of a single cell in the next generation. */
  readonly cellClaim: CellClaim;
}
