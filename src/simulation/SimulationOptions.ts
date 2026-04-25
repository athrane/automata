import type { Player } from "./player/Player";

/** Configuration options for creating a Simulation instance. */
export interface SimulationOptions {

  /** Grid width in cells. Defaults to 100. */
  width?: number;

  /** Grid height in cells. Defaults to 100. */
  height?: number;

  /** Players to include in the simulation. Defaults to an empty array. */
  players?: Player[];
}
