import { AVAILABLE_ITERATION_STRATEGIES } from './AvailableIterationStrategies';
import { AVAILABLE_RULE_SET_APPLICATIONS } from './AvailableRuleSetApplications';
import { AVAILABLE_SIMULATION_MODES } from './AvailableSimulationModes';
import { ConfigurableSimulationMode } from '../simulation';

import type { SimulationMode } from '../simulation';

/**
 * Resolves the simulation mode to play: a freshly built {@link ConfigurableSimulationMode}
 * for a custom selection, or the selected preset's own mode instance otherwise.
 *
 * @param isCustom - Whether the player selected the "Custom" mode option.
 * @param modeIndex - Index into {@link AVAILABLE_SIMULATION_MODES}, used when not custom.
 * @param iterationIndex - Index into {@link AVAILABLE_ITERATION_STRATEGIES}, used when custom.
 * @param applicationIndex - Index into {@link AVAILABLE_RULE_SET_APPLICATIONS}, used when custom.
 * @returns The mode to run for the game about to start.
 */
export function resolveSimulationMode(
  isCustom: boolean,
  modeIndex: number,
  iterationIndex: number,
  applicationIndex: number,
): SimulationMode {
  if (!isCustom) {
    return AVAILABLE_SIMULATION_MODES[modeIndex].mode;
  }

  return ConfigurableSimulationMode.create(
    AVAILABLE_ITERATION_STRATEGIES[iterationIndex].strategy,
    AVAILABLE_RULE_SET_APPLICATIONS[applicationIndex].strategy,
  );
}

/**
 * Resolves whether the selected mode needs every player placed on the grid
 * before the first generation.
 *
 * @param isCustom - Whether the player selected the "Custom" mode option.
 * @param modeIndex - Index into {@link AVAILABLE_SIMULATION_MODES}, used when not custom.
 * @param iterationIndex - Index into {@link AVAILABLE_ITERATION_STRATEGIES}, used when custom.
 * @returns Whether start positions are required.
 */
export function requiresStartPositioning(
  isCustom: boolean,
  modeIndex: number,
  iterationIndex: number,
): boolean {
  if (!isCustom) {
    return AVAILABLE_SIMULATION_MODES[modeIndex].requiresStartPositioning;
  }

  return AVAILABLE_ITERATION_STRATEGIES[iterationIndex].requiresStartPositioning;
}
