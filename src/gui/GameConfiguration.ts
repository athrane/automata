import type { Level, SimulationMode, StartPositioningStrategy } from '../simulation';
import type { RulePreset } from './RulePreset';

/**
 * Everything the player chose on the configuration screen, carried as one
 * value from that screen to the playing screen.
 *
 * A single value object is passed rather than one parameter per choice, so the
 * next configuration option does not widen three signatures again.
 */
export interface GameConfiguration {
  /** The level to play, defining the grid, the pattern, and the computer players. */
  readonly level: Level;

  /** Rule presets chosen by the human player. */
  readonly presets: RulePreset[];

  /** Decides which cells a generation evaluates and whose rules are consulted for them. */
  readonly mode: SimulationMode;

  /** Places each player on the grid, or null for a mode that does not use positions. */
  readonly startPositioning: StartPositioningStrategy | null;
}
