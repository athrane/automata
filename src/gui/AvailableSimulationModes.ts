import { GlobalSimulationMode, PlayerLocalSimulationMode } from '../simulation';

import type { SimulationMode } from '../simulation';

/** A named simulation mode that a player can select on the configuration screen. */
export interface SimulationModeOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of the game behaviour the mode produces. */
  readonly description: string;
  /** The underlying mode instance used during simulation. */
  readonly mode: SimulationMode;
  /** Whether the mode needs every player placed on the grid before the first generation. */
  readonly requiresStartPositioning: boolean;
}

/**
 * The full catalogue of simulation modes available on the game-configuration
 * screen.
 *
 * The first entry is the mode every game used before modes were selectable, so
 * a player who changes nothing gets today's game.
 */
export const AVAILABLE_SIMULATION_MODES: ReadonlyArray<SimulationModeOption> = [
  {
    name: 'Global simulation',
    description: "Today's default: every cell of the grid is evaluated against every player's rules each generation.",
    mode: GlobalSimulationMode.create(),
    requiresStartPositioning: false,
  },
  {
    name: 'Player local simulation',
    description: 'Each player holds a position and its rules apply only to the cells it owns plus the cell it stands on, so territory cannot be taken from another player.',
    mode: PlayerLocalSimulationMode.create(),
    requiresStartPositioning: true,
  },
];
