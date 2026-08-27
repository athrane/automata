/**
 * A single cell of the simulation grid.
 *
 * `ownerId` is the persistent claim: the id of the player that owns the cell,
 * or null when no player has ever claimed it. `value` is what the owning
 * player's rules computed for the current generation, or null when the cell is
 * currently dormant. A freshly claimed cell always carries both fields set to
 * the same player id; only a cell whose owner lets its value lapse keeps them
 * apart.
 */
export interface Cell {
  /** The id of the player claiming this cell, or null when unclaimed. */
  readonly ownerId: number | null;

  /** The value computed for this cell in the current generation, or null when dormant. */
  readonly value: number | null;
}
