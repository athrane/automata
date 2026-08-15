import { LEVEL_ONE_STARTING_PATTERN, LEVEL_THREE_STARTING_PATTERN, LEVEL_TWO_STARTING_PATTERN } from '../simulation';

import type { StartingPattern } from '../simulation';

/** A named starting pattern that a player can select for a custom level. */
export interface StartingPatternOption {
  /** Display name shown in the configuration screen. */
  readonly name: string;
  /** Short description of the opening layout the pattern produces. */
  readonly description: string;
  /** The underlying starting pattern instance used during simulation. */
  readonly pattern: StartingPattern;
}

/**
 * The full catalogue of starting patterns available for selection when the
 * player builds a custom level in the game-configuration screen.
 */
export const AVAILABLE_STARTING_PATTERNS: ReadonlyArray<StartingPatternOption> = [
  {
    name: 'Checker',
    description: 'Repeating 10x10 blocks cycling through the four players and an empty phase.',
    pattern: LEVEL_ONE_STARTING_PATTERN,
  },
  {
    name: 'Spread rectangles',
    description: 'One 20x20 block per player, centred in its own grid quadrant with an equal gap on every side.',
    pattern: LEVEL_TWO_STARTING_PATTERN,
  },
  {
    name: 'Centre cluster',
    description: 'One 20x20 block per player, tiled together at the centre of the grid with no gap between them.',
    pattern: LEVEL_THREE_STARTING_PATTERN,
  },
];
