import type { Grid } from "../../types";

/** Defines the contract for a cell-matching rule used by the simulation. */
export interface Rule {
  /**
   * Returns true if this rule is satisfied for the given cell coordinates
   * and player in the current grid state.
   */
  matches(grid: Grid, x: number, y: number, playerId: number): boolean;
}
