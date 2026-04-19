import type { Grid } from "../types";

export interface Rule {
  matches(grid: Grid, x: number, y: number, playerId: number): boolean;
}
