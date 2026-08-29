import { PlayerLocalIterationStrategy, SweepAllCellsIterationStrategy } from '../simulation';

import type { IterationStrategy } from '../simulation';

/** A named iteration strategy that a player can select for a custom simulation mode. */
export interface IterationStrategyOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of the cells the strategy visits. */
  readonly description: string;
  /** The underlying iteration strategy instance used during simulation. */
  readonly strategy: IterationStrategy;
  /** Whether the strategy needs every player placed on the grid before the first generation. */
  readonly requiresStartPositioning: boolean;
}

/**
 * The full catalogue of iteration strategies available for selection when the
 * player builds a custom simulation mode in the game-configuration screen.
 *
 * The first entry matches the default mode's iteration strategy, so a custom
 * selection that changes nothing else visits the same cells as today's game.
 */
export const AVAILABLE_ITERATION_STRATEGIES: ReadonlyArray<IterationStrategyOption> = [
  {
    name: 'Sweep every cell',
    description: 'Every cell of the grid is visited each generation, matching the default mode.',
    strategy: SweepAllCellsIterationStrategy.create(),
    requiresStartPositioning: false,
  },
  {
    name: 'Owned and occupied cells',
    description: "Only the cells a player owns plus the cell it stands on are visited each generation.",
    strategy: PlayerLocalIterationStrategy.create(),
    requiresStartPositioning: true,
  },
];
