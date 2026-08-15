import { LEVEL_ONE, LEVEL_THREE, LEVEL_TWO } from '../simulation';

import type { Level } from '../simulation';

/**
 * The full catalogue of fixed levels available for selection in the
 * game-configuration screen.
 */
export const AVAILABLE_LEVELS: ReadonlyArray<Level> = [LEVEL_ONE, LEVEL_TWO, LEVEL_THREE];
