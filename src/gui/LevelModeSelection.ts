import type { Level, SimulationMode, StartPositioningStrategy } from '../simulation';

/**
 * Resolves the mode a game plays in: the level's own mode when it fixes one,
 * otherwise the mode selected on the configuration screen.
 *
 * @param level - The level about to be played.
 * @param selectedMode - The mode chosen on the configuration screen.
 * @returns The mode the game will run.
 */
export function resolveEffectiveMode(level: Level, selectedMode: SimulationMode): SimulationMode {
  return level.mode ?? selectedMode;
}

/**
 * Resolves the start positioning a game uses: none when the level fixes its
 * mode, otherwise the positioning selected on the configuration screen.
 *
 * @param level - The level about to be played.
 * @param selectedPositioning - The positioning chosen on the configuration screen, or null for none.
 * @returns The positioning to apply, or null when players are not placed.
 */
export function resolveEffectiveStartPositioning(
  level: Level,
  selectedPositioning: StartPositioningStrategy | null,
): StartPositioningStrategy | null {
  if (level.mode !== null) {
    return null;
  }

  return selectedPositioning;
}
