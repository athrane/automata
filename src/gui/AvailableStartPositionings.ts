import { FirstClaimedCellPositioning, RandomClaimedCellPositioning } from '../simulation';

import type { StartPositioningStrategy } from '../simulation';

/** A named start-positioning strategy that a player can select on the configuration screen. */
export interface StartPositioningOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of where the strategy places a player. */
  readonly description: string;
  /** The underlying positioning strategy instance used when the game starts. */
  readonly strategy: StartPositioningStrategy;
}

/**
 * The full catalogue of start-positioning strategies available on the
 * game-configuration screen, offered only by a mode that needs positions.
 */
export const AVAILABLE_START_POSITIONINGS: ReadonlyArray<StartPositioningOption> = [
  {
    name: 'First claimed cell',
    description: 'Each player starts on the first cell it owns, scanning the grid from top-left to bottom-right.',
    strategy: FirstClaimedCellPositioning.create(),
  },
  {
    name: 'Random claimed cell',
    description: 'Each player starts on a cell drawn at random from the ones it owns, so two games open differently.',
    strategy: RandomClaimedCellPositioning.create(),
  },
];
