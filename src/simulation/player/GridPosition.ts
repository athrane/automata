/**
 * A cell coordinate a player occupies on the simulation grid.
 *
 * A position is deliberately not a field on `Player`: `LevelRoster.computers`
 * holds shared `Player` instances that every game started from that level
 * reuses, so a mutable position on them would leak state from one run into the
 * next. The `Simulation` owns the positions instead.
 */
export interface GridPosition {
  /** X coordinate of the occupied cell. */
  readonly x: number;

  /** Y coordinate of the occupied cell. */
  readonly y: number;
}
